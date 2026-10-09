import { getCategoryLabel } from '@/config/issueCategories'
import { toStoredStatus } from '@/lib/reportStatus'

/**
 * Mapping between an in-memory analysis session and the report row the backend
 * stores (and returns).
 *
 * Rules kept deliberately strict, because a stored row is permanent:
 *
 *  - Only values the analysis actually returned are sent. A field the AI left
 *    out is sent as `null`, never as `0`, `false` or "unknown".
 *  - Nothing is inferred from the coordinates: no address is invented, and the
 *    citizen's typed location text stays exactly as they wrote it.
 *  - Cost and duration are stored as separate numbers plus the basis text, so
 *    the dashboard and the map can show "not estimated" instead of a fake zero.
 *  - The status is the citizen-declared one and is labelled as such everywhere
 *    it is displayed.
 */

const MAX = {
  location: 500,
  landmark: 200,
  description: 2000,
  subject: 300,
  body: 20000,
}

function text(value, limit) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return limit ? trimmed.slice(0, limit) : trimmed
}

function textList(values) {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
}

function finite(value, { min = -Infinity, max = Infinity } = {}) {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return null
  if (number < min || number > max) return null
  return number
}

function resources(values) {
  if (!Array.isArray(values)) return []
  return values
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const item = text(entry.item)
      if (!item) return null
      return { item, purpose: text(entry.purpose) ?? '' }
    })
    .filter(Boolean)
}

/** Coordinates, kept only when they form a usable pair. */
function coordinates(request) {
  const pair = request?.coordinates
  const latitude = finite(pair?.latitude, { min: -90, max: 90 })
  const longitude = finite(pair?.longitude, { min: -180, max: 180 })
  if (latitude === null || longitude === null) {
    return { latitude: null, longitude: null, accuracy: null }
  }
  return {
    latitude,
    longitude,
    accuracy: finite(pair?.accuracyMeters, { min: 0 }),
  }
}

/**
 * Build the `POST /reports` body for a completed analysis session.
 *
 * @param {{
 *   analysis: object,
 *   request: object|null,
 *   complaint?: { subject?: string|null, addressee?: string|null, body?: string|null }|null,
 *   categoryId?: string|null,
 *   categoryLabel?: string|null,
 *   submissionStatus?: string,
 *   sessionId: string,
 *   analysisModel?: string|null,
 *   imageSha256?: string|null,
 * }} params
 */
export function buildStoredReport({
  analysis,
  request = null,
  complaint = null,
  categoryId = null,
  categoryLabel = null,
  submissionStatus,
  sessionId,
  analysisModel = null,
  imageSha256 = null,
}) {
  const coords = coordinates(request)
  const cost = analysis?.cost ?? null
  const duration = analysis?.duration ?? null
  const resolvedCategoryLabel = text(categoryLabel) ?? (categoryId ? getCategoryLabel(categoryId) : null)

  return {
    client_report_id: sessionId,
    issue_category: text(categoryId),
    issue_category_label: resolvedCategoryLabel,
    issue_type: text(analysis?.issueType),
    description: text(analysis?.description, MAX.description),
    severity: text(analysis?.severity),
    confidence: finite(analysis?.confidence, { min: 0, max: 1 }),
    is_civic_issue: typeof analysis?.isCivicIssue === 'boolean' ? analysis.isCivicIssue : null,

    observations: textList(analysis?.observations),
    safety_concerns: textList(analysis?.safetyConcerns),
    recommended_actions: textList(analysis?.recommendedActions),
    resources: resources(analysis?.resources),
    missing_information: textList(analysis?.missingInformation),
    suggested_department: text(analysis?.suggestedDepartment),
    needs_site_inspection:
      typeof analysis?.needsSiteInspection === 'boolean' ? analysis.needsSiteInspection : null,

    estimated_cost_min: finite(cost?.minimum, { min: 0 }),
    estimated_cost_max: finite(cost?.maximum, { min: 0 }),
    estimated_cost_basis: text(cost?.basis, 2000),
    estimated_cost_currency: 'INR',
    estimated_duration_min: finite(duration?.minimum, { min: 0 }),
    estimated_duration_max: finite(duration?.maximum, { min: 0 }),
    estimated_duration_basis: text(duration?.basis, 2000),
    estimated_duration_unit: 'hours',

    location: text(request?.location, MAX.location),
    landmark: text(request?.landmark, MAX.landmark),
    latitude: coords.latitude,
    longitude: coords.longitude,
    location_accuracy_m: coords.accuracy,

    status: toStoredStatus(submissionStatus),
    complaint_subject: text(complaint?.subject, MAX.subject),
    complaint_addressee: text(complaint?.addressee),
    complaint_body: text(complaint?.body, MAX.body),

    image_name: text(request?.imageName, 260),
    image_size_bytes: finite(request?.imageSize, { min: 0 }),
    image_sha256: text(imageSha256, 64),
    analysis_model: text(analysisModel, 120),
  }
}

/**
 * Shape a stored row for the dashboard, detail view and map.
 *
 * Both camelCase and snake_case keys are provided because the existing report
 * components read either, and the raw row is kept under `raw` so nothing is
 * hidden from the detail page.
 */
export function normalizeStoredReport(row) {
  if (!row || typeof row !== 'object') return null

  const id = row.id ?? null
  const latitude = finite(row.latitude, { min: -90, max: 90 })
  const longitude = finite(row.longitude, { min: -180, max: 180 })
  const hasCoordinates = latitude !== null && longitude !== null

  return {
    id,
    report_id: id,
    clientReportId: row.client_report_id ?? null,

    issueType: row.issue_type ?? null,
    issue_type: row.issue_type ?? null,
    category: row.issue_category_label ?? row.issue_category ?? null,
    categoryId: row.issue_category ?? null,
    issue_category: row.issue_category ?? null,
    description: row.description ?? null,
    severity: row.severity ?? null,
    confidence: typeof row.confidence === 'number' ? row.confidence : null,
    isCivicIssue: typeof row.is_civic_issue === 'boolean' ? row.is_civic_issue : null,
    needsInspection: typeof row.needs_site_inspection === 'boolean' ? row.needs_site_inspection : null,
    suggestedDepartment: row.suggested_department ?? null,

    location: row.location ?? null,
    landmark: row.landmark ?? null,
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    hasCoordinates,

    status: row.status ?? null,
    statusUpdatedAt: row.status_updated_at ?? null,
    // A stored report's status is citizen-declared, never an authority update,
    // so it is deliberately NOT published as a "submission status".
    submissionStatus: null,

    observations: textList(row.observations),
    safetyConcerns: textList(row.safety_concerns),
    recommendedActions: textList(row.recommended_actions),
    resources: resources(row.resources),
    missingInformation: textList(row.missing_information),

    cost: {
      minimum: finite(row.estimated_cost_min, { min: 0 }),
      maximum: finite(row.estimated_cost_max, { min: 0 }),
      basis: row.estimated_cost_basis ?? null,
      currency: row.estimated_cost_currency ?? 'INR',
    },
    duration: {
      minimum: finite(row.estimated_duration_min, { min: 0 }),
      maximum: finite(row.estimated_duration_max, { min: 0 }),
      basis: row.estimated_duration_basis ?? null,
      unit: row.estimated_duration_unit ?? 'hours',
    },

    reportedAt: row.created_at ?? null,
    reported_at: row.created_at ?? null,
    statusUpdatedLabel: row.status_updated_at ?? null,

    complaintSubject: row.complaint_subject ?? null,
    complaintAddressee: row.complaint_addressee ?? null,
    complaintBody: row.complaint_body ?? null,

    imageName: row.image_name ?? null,
    imageSizeBytes: row.image_size_bytes ?? null,
    analysisModel: row.analysis_model ?? null,

    isDemo: false,
    source: 'api',
    raw: row,
  }
}
