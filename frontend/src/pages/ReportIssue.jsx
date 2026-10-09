import {
  CircleCheckBig,
  Database,
  HardDriveUpload,
  Info,
  Layers,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  ScanSearch,
  Send,
  ServerCrash,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { BackendDependencyPanel } from '@/components/reports/BackendDependencyPanel'
import { CategoryFollowUps } from '@/components/reports/CategoryFollowUps'
import { CategoryPicker } from '@/components/reports/CategoryPicker'
import { ImageDropzone } from '@/components/reports/ImageDropzone'
import { LocationField } from '@/components/reports/LocationField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Container } from '@/components/ui/container'
import { Field } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AI_DECIDE_CATEGORY_ID, getIssueCategory } from '@/config/issueCategories'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { MAX_DETAILS_LENGTH } from '@/lib/constants'
import { formatFileSize } from '@/lib/format'
import { buildReportSubmission } from '@/lib/reportPayload'
import { validateReportForm } from '@/lib/validation'
import {
  API_BASE_URL,
  API_ERROR_CODES,
  analyzeUrl,
  checkBackendHealth,
  describeAnalyzeFields,
  isApiUrlConfigured,
} from '@/services/civicfixApi'

/** Extra guidance per API failure code. */
function describeApiError(error) {
  const base = { title: 'The analysis could not be completed', message: error.message, hint: null }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'this origin'

  switch (error.code) {
    case API_ERROR_CODES.NETWORK:
      return {
        ...base,
        hint: `Confirm the backend is running at ${API_BASE_URL} and that it allows CORS requests from ${origin}. Your photograph and details stay in the form, so you can retry once it is available.`,
      }
    case API_ERROR_CODES.TIMEOUT:
      return {
        ...base,
        hint: 'Large images and first-request model warm-up can take a while. Try again, or submit a smaller photograph.',
      }
    case API_ERROR_CODES.HTTP:
      return {
        ...base,
        hint:
          error.status === 422
            ? 'The backend rejected the submitted fields. Check the documented field names (file, location, additional_details) and whether it rejects the proposed optional fields.'
            : 'The backend returned an error status. The message above is what it reported.',
      }
    case API_ERROR_CODES.UNEXPECTED_SCHEMA:
    case API_ERROR_CODES.MALFORMED_RESPONSE:
      return {
        ...base,
        hint: 'The request reached the service, but the response did not match the documented schema. Adjust src/lib/analysis.js if the agreed contract has changed.',
      }
    case API_ERROR_CODES.VALIDATION:
      return { ...base, hint: 'Correct the highlighted field and submit again.' }
    default:
      return base
  }
}

export default function ReportIssue() {
  useDocumentTitle('Report an issue')

  const navigate = useNavigate()
  const { runAnalysis, isAnalyzing, error: apiError, reset } = useAnalysisSession()

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [categoryId, setCategoryId] = useState(AI_DECIDE_CATEGORY_ID)
  const [followUpAnswers, setFollowUpAnswers] = useState({})
  const [location, setLocation] = useState('')
  const [landmark, setLandmark] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [errors, setErrors] = useState({})
  const [submitNotice, setSubmitNotice] = useState(null)
  const [connection, setConnection] = useState({ state: 'idle', detail: null })

  const locationSectionRef = useRef(null)
  const fileSectionRef = useRef(null)
  const detailsRef = useRef(null)

  const selectedCategory = getIssueCategory(categoryId)
  const categoryIsUserChosen = categoryId !== AI_DECIDE_CATEGORY_ID

  const releasePreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }, [])

  const handleSelectFile = useCallback(
    (selected) => {
      releasePreview()
      setFile(selected)
      const isImage = typeof selected.type === 'string' && selected.type.startsWith('image/')
      setPreviewUrl(isImage ? URL.createObjectURL(selected) : null)
      setErrors((previous) => ({ ...previous, file: undefined }))
      setSubmitNotice(null)
    },
    [releasePreview],
  )

  const handleClearFile = useCallback(() => {
    releasePreview()
    setFile(null)
    setSubmitNotice(null)
  }, [releasePreview])

  const handleCategoryChange = useCallback((nextCategoryId) => {
    setCategoryId(nextCategoryId)
    // Answers belong to the previous category's questions, so they are dropped
    // rather than silently carried across.
    setFollowUpAnswers({})
  }, [])

  const handleFollowUpChange = useCallback((questionId, value) => {
    setFollowUpAnswers((previous) => {
      if (!value) {
        const next = { ...previous }
        delete next[questionId]
        return next
      }
      return { ...previous, [questionId]: value }
    })
  }, [])

  const handleCoordinatesChange = useCallback((next) => {
    setCoordinates(next)
  }, [])

  const handleResetForm = useCallback(() => {
    releasePreview()
    setFile(null)
    setCategoryId(AI_DECIDE_CATEGORY_ID)
    setFollowUpAnswers({})
    setLocation('')
    setLandmark('')
    setCoordinates(null)
    setAdditionalDetails('')
    setErrors({})
    setSubmitNotice(null)
    setConnection({ state: 'idle', detail: null })
    reset()
  }, [releasePreview, reset])

  const handleTestConnection = useCallback(async () => {
    setConnection({ state: 'checking', detail: null })
    const result = await checkBackendHealth()
    setConnection({
      state: result.ok ? 'ok' : result.reachable ? 'reachable' : 'unreachable',
      detail: result.detail,
    })
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setSubmitNotice(null)

      const validation = validateReportForm({ file, location, landmark, additionalDetails })
      setErrors(validation.errors)

      if (!validation.valid) {
        setSubmitNotice({ tone: 'invalid', message: validation.firstError })
        if (validation.errors.file) fileSectionRef.current?.focus()
        else if (validation.errors.location || validation.errors.landmark) locationSectionRef.current?.focus()
        else if (validation.errors.additionalDetails) detailsRef.current?.focus()
        return
      }

      const submission = buildReportSubmission({
        file,
        location,
        landmark,
        additionalDetails,
        categoryId,
        followUpAnswers,
        coordinates,
        categoryIsUserChosen,
      })

      const result = await runAnalysis({
        file: submission.file,
        location: submission.location,
        additionalDetails: submission.additionalDetails,
        categoryId: submission.issueCategory ?? categoryId,
        followUpAnswers: submission.followUpAnswers,
        coordinates: submission.coordinates,
        userDetails: submission.userDetails,
      })

      if (result.ok) {
        setSubmitNotice({ tone: 'success', message: 'The analysis returned a result. Opening the assessment…' })
        navigate('/results')
        return
      }

      // Only a real failure reaches this branch; nothing is simulated.
      setSubmitNotice({ tone: 'error', message: result.error.message })
    },
    [
      additionalDetails,
      categoryId,
      categoryIsUserChosen,
      coordinates,
      file,
      followUpAnswers,
      landmark,
      location,
      navigate,
      runAnalysis,
    ],
  )

  const apiErrorDisplay = useMemo(() => (apiError ? describeApiError(apiError) : null), [apiError])

  const analyzeFields = useMemo(
    () =>
      describeAnalyzeFields({
        issueCategory: categoryIsUserChosen ? categoryId : null,
        coordinates,
      }),
    [categoryId, categoryIsUserChosen, coordinates],
  )

  const isBusy = isAnalyzing

  return (
    <>
      <PageHeader
        eyebrow="Citizen report"
        title="Report a civic problem"
        description="Pick the category if you know it (or let the AI decide), add a photograph and tell us where the problem is. You will get an assessment, a complaint you can edit, and guidance on where to send it."
        actions={
          <ConfirmButton
            label="Clear form"
            question="Clear everything you have entered?"
            confirmLabel="Clear"
            icon={RotateCcw}
            disabled={isBusy}
            onConfirm={handleResetForm}
          />
        }
      />

      <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Layers aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h2">What kind of problem is it?</CardTitle>
              </div>
              <CardDescription>
                Choose a category if you already know what it is. If you are unsure, pick &ldquo;Let AI identify the
                issue&rdquo; and change it afterwards — the assessment never overrides your choice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <CategoryPicker
                value={categoryId}
                onChange={handleCategoryChange}
                disabled={isBusy}
                describedBy="category-explainer"
              />
              <p id="category-explainer" className="text-xs leading-relaxed text-muted-foreground">
                Categories are defined once in the application configuration, and they decide which optional questions you
                see, how the complaint is titled, and which authorities are suggested later.
              </p>

              {selectedCategory ? (
                <>
                  <Separator />
                  <CategoryFollowUps
                    categoryId={categoryId}
                    answers={followUpAnswers}
                    onChange={handleFollowUpChange}
                    disabled={isBusy}
                  />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <HardDriveUpload aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h2">Photograph of the problem</CardTitle>
              </div>
              <CardDescription>
                Required. One clear image, taken from a safe position, showing the extent of the damage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div ref={fileSectionRef} tabIndex={-1} className="rounded-xl focus-visible:outline-none">
                <ImageDropzone
                  file={file}
                  previewUrl={previewUrl}
                  error={errors.file}
                  disabled={isBusy}
                  onSelectFile={handleSelectFile}
                  onClear={handleClearFile}
                />
              </div>
              {errors.file ? (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {errors.file}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Send aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h2">Where is it, and anything else?</CardTitle>
              </div>
              <CardDescription>
                Type the location, or capture your current position if you prefer. Manual entry always works, even if
                location is denied or unavailable.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div ref={locationSectionRef} tabIndex={-1} className="rounded-xl focus-visible:outline-none">
                <LocationField
                  location={location}
                  landmark={landmark}
                  coordinates={coordinates}
                  errors={{ location: errors.location, landmark: errors.landmark }}
                  disabled={isBusy}
                  onLocationChange={setLocation}
                  onLandmarkChange={setLandmark}
                  onCoordinatesChange={handleCoordinatesChange}
                />
              </div>

              <Separator />

              <Field
                id="report-details"
                label="Anything else the photograph cannot show?"
                optional
                error={errors.additionalDetails}
                hint="How long has it been like this, does it get worse after rain, is access restricted, has anyone been injured?"
                labelAccessory={
                  <span className="text-xs text-muted-foreground" data-slot="metric">
                    {additionalDetails.length}/{MAX_DETAILS_LENGTH}
                  </span>
                }
              >
                {({ id, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    ref={detailsRef}
                    name="additional_details"
                    rows={5}
                    value={additionalDetails}
                    disabled={isBusy}
                    maxLength={MAX_DETAILS_LENGTH}
                    onChange={(event) => setAdditionalDetails(event.target.value)}
                    placeholder="Optional context for the assessment and the complaint"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                  />
                )}
              </Field>
            </CardContent>
          </Card>

          {apiErrorDisplay ? (
            <Alert variant="danger" icon={ServerCrash} title={apiErrorDisplay.title} role="alert">
              <p>{apiErrorDisplay.message}</p>
              {apiErrorDisplay.hint ? <p className="text-xs">{apiErrorDisplay.hint}</p> : null}
            </Alert>
          ) : null}

          {!apiErrorDisplay && submitNotice?.tone === 'invalid' ? (
            <Alert variant="warning" icon={TriangleAlert} title="Check the form before submitting" role="alert">
              <p>{submitNotice.message}</p>
            </Alert>
          ) : null}

          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <Database aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Ready to analyse</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {selectedCategory ? selectedCategory.label : 'Let AI identify the issue'} ·{' '}
                      {file ? `${file.name} · ${formatFileSize(file.size)}` : 'no photograph yet'} ·{' '}
                      {location.trim() ? location.trim() : 'no location yet'}
                      {coordinates ? ' · coordinates captured' : ''}
                    </p>
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={isBusy} className="sm:w-auto">
                  {isBusy ? <Loader2 className="animate-spin" /> : <ScanSearch />}
                  {isBusy ? 'Analysing…' : 'Analyse issue'}
                </Button>
              </div>

              {isBusy ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                  <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Waiting for {analyzeUrl}. Large images and cold model start-up can take a minute.
                  </p>
                </div>
              ) : null}

              {submitNotice?.tone === 'success' ? (
                <Alert variant="success" icon={CircleCheckBig}>
                  {submitNotice.message}
                </Alert>
              ) : null}

              <p className="text-xs leading-relaxed text-muted-foreground">
                Submitting sends the photograph, the location text and your details to the backend for analysis. It does
                not file a complaint with any government department.
              </p>
            </CardContent>
          </Card>

          <BackendDependencyPanel
            title="What this form does today"
            description="The form, validation, complaint drafting and results rendering are complete. Producing a genuine assessment depends on the backend."
          />
        </form>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Send aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h2">Backend integration</CardTitle>
              </div>
              <CardDescription>
                Exactly which fields this form will send, and the current state of the connection.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endpoint</dt>
                  <dd className="break-all rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 font-mono text-xs text-foreground">
                    POST {analyzeUrl}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configured by</dt>
                  <dd className="text-xs text-muted-foreground">
                    <span className="font-mono">VITE_API_URL</span>
                    {isApiUrlConfigured ? ' (set for this build)' : ' (not set — falling back to the local default)'}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Multipart fields in this request
                </p>
                <ul className="space-y-1.5">
                  {analyzeFields.map((field) => (
                    <li key={field.name} className="flex items-start gap-2 text-xs">
                      <span
                        aria-hidden="true"
                        className={
                          field.sent
                            ? 'mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-600'
                            : 'mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40'
                        }
                      />
                      <span className="min-w-0">
                        <span className={field.sent ? 'font-mono text-foreground' : 'font-mono text-muted-foreground'}>
                          {field.name}
                        </span>
                        <span className="ml-1.5 text-muted-foreground">
                          {field.kind === 'proposed' ? 'proposed' : 'documented'}
                          {field.sent ? '' : ' — not sent'}
                        </span>
                        {field.note ? (
                          <span className="block text-muted-foreground/90">{field.note}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The proposed fields are optional additions to the agreed contract, documented in the README for the
                  backend developer. A backend that ignores them keeps working.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isBusy || connection.state === 'checking'}
                >
                  {connection.state === 'checking' ? <Loader2 className="animate-spin" /> : <Info />}
                  Test backend connection
                </Button>

                {connection.state !== 'idle' && connection.state !== 'checking' ? (
                  <Alert
                    variant={connection.state === 'ok' ? 'success' : connection.state === 'reachable' ? 'info' : 'warning'}
                    role="status"
                  >
                    <p className="font-medium">
                      {connection.state === 'ok'
                        ? 'The backend responded to /health.'
                        : connection.state === 'reachable'
                          ? 'The backend is reachable but did not answer /health.'
                          : 'The backend could not be reached.'}
                    </p>
                    {connection.detail ? <p className="text-xs">{connection.detail}</p> : null}
                    <p className="text-xs">
                      The documented contract only guarantees POST /analyze, so a missing /health route is not an error.
                    </p>
                  </Alert>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <MessageSquarePlus aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h2">What you get next</CardTitle>
              </div>
              <CardDescription>After the assessment loads you can prepare a complaint, find an authority and record what you did.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[
                  'The assessment explains what the photograph appears to show, with severity and confidence.',
                  'A formal complaint is drafted for you to edit, copy, download or print.',
                  'Guidance suggests which authority may be responsible for this category and city.',
                  'You record whether you sent it — CivicFix cannot submit or track anything itself.',
                ].map((item, index) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </Container>
    </>
  )
}
