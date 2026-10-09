import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { AI_DECIDE_CATEGORY_ID, getCategoryLabel } from '@/config/issueCategories'
import { buildAnalysisSession } from '@/lib/analysis'
import { buildComplaintDraft } from '@/lib/complaint'
import { SUBMISSION_STATUS } from '@/lib/submissionStatus'
import { API_ERROR_CODES, ApiError, analyzeIssue } from '@/services/civicfixApi'

/**
 * In-memory working session for one report.
 *
 * Holds everything a citizen produces while they are working on a single
 * report: the uploaded image preview, the analysis returned by the backend, the
 * complaint they are drafting, the authority they picked and the submission
 * status they declared.
 *
 * The session deliberately lives in memory only:
 *  - image files are never written to localStorage and are never placed in a URL;
 *  - a page refresh drops the session, and the results page explains that
 *    instead of rendering fabricated data;
 *  - nothing here is sent anywhere except the single POST /analyze request.
 */

const AnalysisContext = createContext(null)

/** @typedef {'idle'|'loading'|'success'|'error'} AnalysisStatus */

function makeSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Random id generated once per analysis; the backend uses it to de-duplicate saves. */
function makeClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Fallback for non-secure contexts (plain http on a LAN address).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

export function AnalysisProvider({ children }) {
  const [state, setState] = useState({ status: 'idle', error: null, session: null })
  const [image, setImage] = useState({ previewUrl: null, name: null, size: null })
  const [complaint, setComplaint] = useState(null)
  const [submissionStatus, setSubmissionStatusState] = useState(SUBMISSION_STATUS.DRAFT)
  const [authoritySelection, setAuthoritySelectionState] = useState(null)
  // The stored copy of this session's report, once the citizen has saved it.
  const [savedReport, setSavedReport] = useState(null)

  const previewUrlRef = useRef(null)
  const activeRequestRef = useRef(null)
  // Synchronous guard: state updates are asynchronous, so a double click or a
  // double Enter could otherwise start two uploads before `isAnalyzing` flips.
  const inFlightRef = useRef(false)

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  /** Create an object URL for the selected image so the UI can preview it. */
  const setPreviewImage = useCallback(
    (file) => {
      revokePreviewUrl()
      if (!file) {
        setImage({ previewUrl: null, name: null, size: null })
        return
      }
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setImage({ previewUrl: url, name: file.name ?? null, size: file.size ?? null })
    },
    [revokePreviewUrl],
  )

  /** Drop the whole session, including the complaint draft. */
  const reset = useCallback(() => {
    activeRequestRef.current?.abort()
    activeRequestRef.current = null
    inFlightRef.current = false
    revokePreviewUrl()
    setImage({ previewUrl: null, name: null, size: null })
    setState({ status: 'idle', error: null, session: null })
    setComplaint(null)
    setSubmissionStatusState(SUBMISSION_STATUS.DRAFT)
    setAuthoritySelectionState(null)
    setSavedReport(null)
  }, [revokePreviewUrl])

  useEffect(() => () => revokePreviewUrl(), [revokePreviewUrl])

  /**
   * Send the validated report to the backend and normalise its response.
   * Never fabricates a result: on failure the caller receives the real error.
   *
   * @param {{
   *   file: File,
   *   location: string,
   *   additionalDetails?: string,
   *   userDetails?: string|null,
   *   categoryId?: string|null,
   *   followUpAnswers?: Record<string, string>,
   *   coordinates?: { latitude: number, longitude: number }|null,
   * }} params
   */
  const runAnalysis = useCallback(
    async ({
      file,
      location,
      additionalDetails = '',
      userDetails = null,
      categoryId = null,
      followUpAnswers = {},
      coordinates = null,
    }) => {
      if (inFlightRef.current) {
        return {
          ok: false,
          error: {
            message: 'An analysis is already running. Please wait for it to finish.',
            code: API_ERROR_CODES.DUPLICATE,
            status: null,
            detail: null,
          },
        }
      }
      inFlightRef.current = true

      const controller = new AbortController()
      activeRequestRef.current = controller
      // True only while this request is still the active one. `reset()` clears
      // the ref and a newer request replaces it, so a late response from an
      // abandoned request can never overwrite the state of the current one.
      const isCurrent = () => activeRequestRef.current === controller

      setPreviewImage(file)
      setState({ status: 'loading', error: null, session: null })
      setComplaint(null)
      setSubmissionStatusState(SUBMISSION_STATUS.DRAFT)
      setAuthoritySelectionState(null)
      setSavedReport(null)

      const chosenCategoryId =
        categoryId && categoryId !== AI_DECIDE_CATEGORY_ID ? categoryId : null
      const answeredFollowUps = Object.fromEntries(
        Object.entries(followUpAnswers ?? {}).filter(([, value]) => typeof value === 'string' && value.trim()),
      )

      try {
        // The backend reads `file`, `location` and `additional_details` only.
        // The category and coordinates stay in `request` below for the
        // complaint draft and authority guidance, which run in the browser.
        const { payload, receivedAt } = await analyzeIssue(
          { file, location, additionalDetails },
          { signal: controller.signal },
        )

        const session = buildAnalysisSession({
          payload,
          receivedAt,
          request: {
            location: location?.trim() || null,
            // The complaint quotes the citizen's own words; the extra structured
            // answers are listed separately by the complaint template.
            additionalDetails: (userDetails ?? additionalDetails)?.trim() || null,
            imageName: file?.name ?? null,
            imageSize: file?.size ?? null,
            chosenCategoryId,
            chosenCategoryLabel: chosenCategoryId ? getCategoryLabel(chosenCategoryId, null) : null,
            followUpAnswers: answeredFollowUps,
            coordinates: coordinates ?? null,
          },
        })

        if (!isCurrent()) {
          return {
            ok: false,
            error: {
              message: 'The request was cancelled before it completed.',
              code: API_ERROR_CODES.ABORTED,
              status: null,
              detail: null,
            },
          }
        }

        // The id identifies this session for the complaint draft and for the
        // opt-in, user-declared submission status.
        const sessionWithId = { ...session, id: makeSessionId(), clientRequestId: makeClientRequestId() }
        setState({ status: 'success', error: null, session: sessionWithId })
        return { ok: true, session: sessionWithId }
      } catch (error) {
        const normalized =
          error instanceof ApiError
            ? { message: error.message, code: error.code, status: error.status, detail: error.detail }
            : {
                message: 'The analysis request failed for an unexpected reason.',
                code: 'unknown_error',
                status: null,
                detail: error instanceof Error ? error.message : null,
              }

        const cancelled = normalized.code === API_ERROR_CODES.ABORTED
        // Ignore the outcome of a request that is no longer the active one.
        if (isCurrent()) {
          setState({ status: cancelled ? 'idle' : 'error', error: cancelled ? null : normalized, session: null })
        }
        return { ok: false, error: normalized }
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null
          inFlightRef.current = false
        }
      }
    },
    [setPreviewImage],
  )

  const session = state.session
  const analysis = session?.analysis ?? null
  const request = session?.request ?? null

  /**
   * Create the complaint draft once per session, or return the existing draft.
   * An existing draft is never overwritten here — that is what
   * `regenerateComplaint` is for, and it is always an explicit user action.
   */
  const ensureComplaintDraft = useCallback(
    ({ categoryId, authorityName = null, cityLabel = null } = {}) => {
      if (!session || !analysis) return null

      const isSameDraft =
        complaint && complaint.sessionId === session.id && complaint.categoryId === categoryId
      if (isSameDraft) return complaint

      const draft = buildComplaintDraft({
        analysis,
        request,
        categoryId,
        sessionId: session.id,
        authorityName,
        cityLabel,
        followUpAnswers: request?.followUpAnswers ?? {},
      })
      setComplaint(draft)
      return draft
    },
    [analysis, complaint, request, session],
  )

  /** Force a fresh draft from the current analysis. Replaces any edits. */
  const regenerateComplaint = useCallback(
    ({ categoryId, authorityName = null, cityLabel = null } = {}) => {
      if (!session || !analysis) return null
      const draft = buildComplaintDraft({
        analysis,
        request,
        categoryId,
        sessionId: session.id,
        authorityName,
        cityLabel,
        followUpAnswers: request?.followUpAnswers ?? {},
      })
      setComplaint(draft)
      return draft
    },
    [analysis, request, session],
  )

  /** Apply the citizen's edits, keeping everything else intact. */
  const updateComplaintDraft = useCallback((changes) => {
    setComplaint((current) => (current ? { ...current, ...changes, isEdited: true } : current))
  }, [])

  const setSubmissionStatus = useCallback((value) => {
    setSubmissionStatusState(value)
  }, [])

  const setAuthoritySelection = useCallback((selection) => {
    setAuthoritySelectionState(selection)
  }, [])

  const value = useMemo(
    () => ({
      // Analysis session
      status: state.status,
      error: state.error,
      sessionId: session?.id ?? null,
      session,
      analysis,
      request,
      receivedAt: session?.receivedAt ?? null,
      previewUrl: image.previewUrl,
      imageName: image.name,
      imageSize: image.size,
      isAnalyzing: state.status === 'loading',

      // Complaint preparation
      complaint,
      complaintIsEdited: Boolean(complaint?.isEdited),
      ensureComplaintDraft,
      regenerateComplaint,
      updateComplaintDraft,

      // Authority guidance
      authoritySelection,
      setAuthoritySelection,

      // Saved copy (Supabase)
      savedReport,
      setSavedReport,

      // Submission status
      submissionStatus,
      setSubmissionStatus,

      runAnalysis,
      reset,
    }),
    [
      state,
      session,
      analysis,
      request,
      image,
      complaint,
      ensureComplaintDraft,
      regenerateComplaint,
      updateComplaintDraft,
      authoritySelection,
      setAuthoritySelection,
      savedReport,
      submissionStatus,
      setSubmissionStatus,
      runAnalysis,
      reset,
    ],
  )

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

export function useAnalysisSession() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysisSession must be used inside <AnalysisProvider>.')
  }
  return context
}
