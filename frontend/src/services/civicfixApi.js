/**
 * CivicFix AI — API service
 * ==========================================================================
 * This is the single integration layer between the frontend and the FastAPI
 * backend that is developed independently on another machine.
 *
 * Rules this file follows:
 *  - Fetch API only. No mock server, no bundled fake responses, no simulated
 *    AI output. If the backend is unreachable the caller receives an `ApiError`
 *    describing the real failure.
 *  - `Content-Type` is never set manually for FormData uploads, so the browser
 *    can attach the multipart boundary.
 *  - Every failure mode (not configured, network, timeout, HTTP status,
 *    malformed JSON, unexpected schema) is distinguishable by
 *    `ApiError.code` so the UI can explain what actually happened.
 *
 * Docs for the planned contract: see README.md → "Backend integration".
 */

import { isRecognizedAnalysisPayload } from '@/lib/analysis'

const RAW_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim()

/** Fallback used when VITE_API_URL is not set (local backend default). */
export const DEFAULT_API_BASE_URL = 'http://localhost:8000'

/** Base URL without a trailing slash. */
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '') || DEFAULT_API_BASE_URL

/** True when VITE_API_URL was explicitly provided at build time. */
export const isApiUrlConfigured = Boolean(RAW_BASE_URL)

export const ANALYZE_ENDPOINT = '/analyze'
export const HEALTH_ENDPOINT = '/health'

export const analyzeUrl = `${API_BASE_URL}${ANALYZE_ENDPOINT}`

export const API_ERROR_CODES = {
  VALIDATION: 'validation_error',
  NETWORK: 'network_error',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
  HTTP: 'http_error',
  MALFORMED_RESPONSE: 'malformed_response',
  UNEXPECTED_SCHEMA: 'unexpected_schema',
}

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number|null, detail?: string|null, url?: string|null, cause?: unknown }} [options]
   */
  constructor(message, { code = 'unknown_error', status = null, detail = null, url = null, cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.detail = detail
    this.url = url
    this.cause = cause
  }
}

/* -------------------------------------------------------------------------- */
/* Internals                                                                 */
/* -------------------------------------------------------------------------- */

function messageForNetworkFailure(url) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'this site'
  return (
    `Could not reach the analysis service at ${url}. ` +
    'The AI backend is developed separately and may not be running yet. ' +
    `Check that it is started and that CORS allows requests from ${origin}. ` +
    'Nothing was analysed and no report was created.'
  )
}

/** Extract a human readable message from common backend error bodies. */
function extractErrorDetail(payload) {
  if (!payload) return null
  if (typeof payload === 'string') return payload.trim() || null
  if (Array.isArray(payload)) return extractErrorDetail(payload[0])
  if (typeof payload !== 'object') return null

  const candidate = payload.detail ?? payload.message ?? payload.error ?? null
  if (typeof candidate === 'string') return candidate.trim() || null
  if (Array.isArray(candidate)) {
    const messages = candidate
      .map((entry) => (typeof entry === 'string' ? entry : entry?.msg || entry?.message))
      .filter(Boolean)
    return messages.length ? messages.join('; ') : null
  }
  if (candidate && typeof candidate === 'object') {
    return candidate.msg || candidate.message || JSON.stringify(candidate)
  }
  return null
}

function messageForHttpFailure(status, statusText, detail, url) {
  const base = `The analysis service responded with HTTP ${status}${statusText ? ` ${statusText}` : ''}.`
  const parts = [base]
  if (detail) parts.push(detail)
  parts.push(`Request: POST ${url}`)
  return parts.join(' ')
}

/**
 * Perform a JSON request with timeout and caller-provided cancellation.
 * @param {string} path
 * @param {{ method?: string, body?: BodyInit, signal?: AbortSignal, timeoutMs?: number }} [options]
 */
export async function apiRequest(path, { method = 'GET', body, signal, timeoutMs = 60000 } = {}) {
  const url = `${API_BASE_URL}${path}`
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const forwardAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', forwardAbort)
  }

  // Only attach a body when there is one: GET requests must not carry a body.
  const requestInit = { method, signal: controller.signal }
  if (body !== undefined && body !== null) requestInit.body = body

  let response
  try {
    response = await fetch(url, requestInit)
  } catch (error) {
    if (error?.name === 'AbortError') {
      if (timedOut) {
        throw new ApiError(
          `The analysis service did not respond within ${Math.round(timeoutMs / 1000)} seconds. Nothing was analysed.`,
          { code: API_ERROR_CODES.TIMEOUT, url, cause: error },
        )
      }
      throw new ApiError('The request was cancelled before it completed.', {
        code: API_ERROR_CODES.ABORTED,
        url,
        cause: error,
      })
    }
    throw new ApiError(messageForNetworkFailure(url), {
      code: API_ERROR_CODES.NETWORK,
      url,
      cause: error,
    })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }

  const rawText = await response.text().catch(() => '')
  let payload = null
  let parseFailed = false

  if (rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch {
      parseFailed = true
    }
  }

  if (!response.ok) {
    throw new ApiError(messageForHttpFailure(response.status, response.statusText, extractErrorDetail(payload), url), {
      code: API_ERROR_CODES.HTTP,
      status: response.status,
      detail: extractErrorDetail(payload),
      url,
    })
  }

  if (parseFailed) {
    throw new ApiError(
      'The analysis service returned a response that is not valid JSON, so it cannot be displayed.',
      { code: API_ERROR_CODES.MALFORMED_RESPONSE, status: response.status, url },
    )
  }

  return { data: payload, status: response.status, url }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * PROPOSED FIELDS — opt-in, documented, and safe to disable.
 * ==========================================================================
 * The agreed contract has exactly three multipart fields:
 * `file`, `location`, `additional_details`.
 *
 * The reporting form now collects a category and (optionally) coordinates,
 * which the current backend has not been asked to consume yet. Rather than
 * silently changing the contract, the extra fields are opt-in through this
 * switch and documented as a proposal for the backend developer:
 *
 *   issue_category  string  — one of the ids in src/config/issueCategories.js
 *                             ("let-ai-decide" is never sent, because it means
 *                             "the citizen did not choose")
 *   latitude        float   — browser geolocation latitude, only when the
 *                             citizen explicitly captured their location
 *   longitude       float   — matching longitude
 *
 * A backend that ignores unknown form fields keeps working unchanged.
 * Set a flag to `false` to send exactly the original three-field contract.
 */
export const PROPOSED_ANALYZE_FIELDS = {
  issueCategory: true,
  coordinates: true,
}

/**
 * Describe exactly which multipart fields a submission will contain, so the UI
 * can show the truth instead of a guess.
 *
 * @param {{ issueCategory?: string|null, coordinates?: { latitude: number, longitude: number }|null }} [params]
 * @returns {Array<{ name: string, kind: 'documented'|'proposed', sent: boolean, note?: string }>}
 */
export function describeAnalyzeFields({ issueCategory = null, coordinates = null } = {}) {
  return [
    { name: 'file', kind: 'documented', sent: true },
    { name: 'location', kind: 'documented', sent: true },
    { name: 'additional_details', kind: 'documented', sent: true },
    {
      name: 'issue_category',
      kind: 'proposed',
      sent: Boolean(PROPOSED_ANALYZE_FIELDS.issueCategory && issueCategory),
      note: 'Sent only when you choose a category.',
    },
    {
      name: 'latitude',
      kind: 'proposed',
      sent: Boolean(PROPOSED_ANALYZE_FIELDS.coordinates && coordinates),
      note: 'Sent only when you capture your current location.',
    },
    {
      name: 'longitude',
      kind: 'proposed',
      sent: Boolean(PROPOSED_ANALYZE_FIELDS.coordinates && coordinates),
      note: 'Sent only when you capture your current location.',
    },
  ]
}

/**
 * Build the multipart body for POST /analyze.
 *
 * The three documented fields are always present. The proposed fields are added
 * only when they have a value and their feature flag is on.
 *
 * @param {{
 *   file: File,
 *   location: string,
 *   additionalDetails?: string,
 *   issueCategory?: string|null,
 *   coordinates?: { latitude: number, longitude: number }|null,
 * }} params
 */
export function buildAnalyzeFormData({
  file,
  location,
  additionalDetails = '',
  issueCategory = null,
  coordinates = null,
} = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('location', typeof location === 'string' ? location.trim() : '')
  formData.append('additional_details', typeof additionalDetails === 'string' ? additionalDetails.trim() : '')

  if (PROPOSED_ANALYZE_FIELDS.issueCategory && typeof issueCategory === 'string' && issueCategory.trim()) {
    formData.append('issue_category', issueCategory.trim())
  }

  const hasCoordinates =
    PROPOSED_ANALYZE_FIELDS.coordinates &&
    coordinates &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude)

  if (hasCoordinates) {
    formData.append('latitude', String(coordinates.latitude))
    formData.append('longitude', String(coordinates.longitude))
  }

  return formData
}

/**
 * POST /analyze — request an AI assessment for a photographed civic issue.
 *
 * Returns the parsed backend response exactly as received (no shaping, no
 * invented defaults). Call `normalizeAnalysis` to render it defensively.
 *
 * @param {{
 *   file: File,
 *   location: string,
 *   additionalDetails?: string,
 *   issueCategory?: string|null,
 *   coordinates?: { latitude: number, longitude: number }|null,
 * }} params
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 * @returns {Promise<{ payload: unknown, receivedAt: string, status: number, url: string }>}
 */
export async function analyzeIssue(
  { file, location, additionalDetails = '', issueCategory = null, coordinates = null } = {},
  options = {},
) {
  if (!(file instanceof File) && !file) {
    throw new ApiError('A photograph is required before an analysis can be requested.', {
      code: API_ERROR_CODES.VALIDATION,
      url: analyzeUrl,
    })
  }

  const formData = buildAnalyzeFormData({ file, location, additionalDetails, issueCategory, coordinates })

  // Intentionally no Content-Type header: the browser sets the multipart boundary.
  const { data, status, url } = await apiRequest(ANALYZE_ENDPOINT, {
    method: 'POST',
    body: formData,
    signal: options.signal,
    timeoutMs: options.timeoutMs ?? 90000,
  })

  if (!isRecognizedAnalysisPayload(data)) {
    throw new ApiError(
      'The analysis service responded successfully but the body was not a JSON object matching the documented response schema. ' +
        'Update src/lib/analysis.js if the agreed contract has changed.',
      { code: API_ERROR_CODES.UNEXPECTED_SCHEMA, status, url, detail: typeof data === 'string' ? data : null },
    )
  }

  return { payload: data, receivedAt: new Date().toISOString(), status, url }
}

/**
 * GET /health — optional availability probe.
 *
 * Used only by the "test connection" affordance on the report form. It never
 * reports success on the caller's behalf: it returns what actually happened.
 * The documented contract only guarantees POST /analyze, so a 404 here means
 * the service is reachable but exposes no health route.
 *
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 * @returns {Promise<{ reachable: boolean, ok: boolean, status: number|null, detail: string }>}
 */
export async function checkBackendHealth(options = {}) {
  try {
    const { data, status } = await apiRequest(HEALTH_ENDPOINT, {
      method: 'GET',
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? 6000,
    })
    const reported = data && typeof data === 'object' ? (data.status ?? data.state ?? null) : null
    return {
      reachable: true,
      ok: true,
      status,
      detail: reported ? `Service responded with status "${reported}".` : 'Service responded to /health.',
    }
  } catch (error) {
    if (error instanceof ApiError && error.code === API_ERROR_CODES.HTTP) {
      return {
        reachable: true,
        ok: false,
        status: error.status,
        detail:
          error.status === 404
            ? 'The service is reachable but does not expose /health. Analysis requests may still work.'
            : `The service is reachable but /health returned HTTP ${error.status}.`,
      }
    }
    if (error instanceof ApiError) {
      return { reachable: false, ok: false, status: null, detail: error.message }
    }
    return {
      reachable: false,
      ok: false,
      status: null,
      detail: 'The connection test failed for an unexpected reason.',
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Extension points                                                          */
/* -------------------------------------------------------------------------- */

/**
 * AUTH EXTENSION POINT (not implemented).
 *
 * No authentication exists yet and none is faked. When the backend exposes
 * accounts, wrap `requestJson` with an `Authorization` header produced by a
 * token provider, e.g.:
 *
 *   let tokenProvider = null
 *   export function setAuthTokenProvider(fn) { tokenProvider = fn }
 *
 * and inside `requestJson`:
 *
 *   const token = await tokenProvider?.()
 *   if (token) headers.Authorization = `Bearer ${token}`
 *
 * Do not add a fake login flow before the backend can verify credentials.
 *
 * ROLES / JURISDICTION EXTENSION POINT (not implemented).
 * Department suggestions returned by the analysis are displayed as-is. Mapping a
 * report to a specific local body requires a backend service; until then the UI
 * must not claim that any authority was identified or contacted.
 */
