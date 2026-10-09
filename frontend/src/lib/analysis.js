import { toFiniteNumber, toDate } from '@/lib/format'
import { resolveSeverity } from '@/lib/severity'

/**
 * Defensive normalisation of the `/analyze` response.
 *
 * The backend is developed independently and its schema may change. This module
 * never invents values: anything missing, null or of an unexpected type is
 * represented as `null` (or an empty list) and reported through
 * `missingFields` / `unexpectedTypes`, which the results page surfaces so the
 * integration can be corrected quickly.
 */

/**
 * Fields returned by POST /analyze (backend/main.py: the CivicAnalysis model
 * plus `location`, `model`, `estimate_status` and `authority_status`, which the
 * backend attaches itself).
 */
export const KNOWN_ANALYSIS_FIELDS = [
  'issue_type',
  'is_civic_issue',
  'confidence',
  'severity',
  'description',
  'observations',
  'safety_concerns',
  'suggested_department',
  'recommended_actions',
  'resources',
  'estimated_cost_inr',
  'estimated_duration_hours',
  'needs_site_inspection',
  'missing_information',
  'location',
  'estimate_status',
  'authority_status',
  'model',
]

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** Read a non-empty trimmed string, or null. */
function asText(value) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

/** Read an array of non-empty strings, dropping anything unusable. */
function asTextList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim() || null
      if (isPlainObject(entry)) return asText(entry.label) || asText(entry.name) || asText(entry.value)
      return null
    })
    .filter(Boolean)
}

/** Read a boolean, or null when the backend did not say. */
function asBoolean(value) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

/** Normalise the {item, purpose} resource list. */
function asResources(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        const label = asText(entry)
        return label ? { item: label, purpose: null } : null
      }
      if (!isPlainObject(entry)) return null
      const item = asText(entry.item) || asText(entry.name)
      const purpose = asText(entry.purpose) || asText(entry.note) || asText(entry.description)
      if (!item && !purpose) return null
      return { item: item || 'Unnamed resource', purpose }
    })
    .filter(Boolean)
}

/** Normalise a {minimum, maximum, basis} estimate block. */
function asEstimate(value) {
  const source = isPlainObject(value) ? value : {}
  const minimum = toFiniteNumber(source.minimum)
  const maximum = toFiniteNumber(source.maximum)
  return {
    minimum,
    maximum,
    basis: asText(source.basis),
    hasBounds: minimum !== null || maximum !== null,
  }
}

/**
 * Normalise a raw analysis payload into a predictable shape.
 * @param {unknown} raw
 */
export function normalizeAnalysis(raw) {
  const source = isPlainObject(raw) ? raw : {}
  const presentFields = Object.keys(source)
  const missingFields = KNOWN_ANALYSIS_FIELDS.filter(
    (field) => !(field in source) || source[field] === null || source[field] === undefined,
  )
  const unexpectedFields = presentFields.filter((field) => !KNOWN_ANALYSIS_FIELDS.includes(field))

  const confidence = toFiniteNumber(source.confidence)
  const isCivicIssue = asBoolean(source.is_civic_issue)

  return {
    source,
    isPlainObject: isPlainObject(raw),
    issueType: asText(source.issue_type),
    isCivicIssue,
    confidence,
    severityValue: asText(source.severity),
    severity: resolveSeverity(source.severity),
    description: asText(source.description),
    observations: asTextList(source.observations),
    safetyConcerns: asTextList(source.safety_concerns),
    suggestedDepartment: asText(source.suggested_department),
    recommendedActions: asTextList(source.recommended_actions),
    resources: asResources(source.resources),
    cost: asEstimate(source.estimated_cost_inr),
    duration: asEstimate(source.estimated_duration_hours),
    needsSiteInspection: asBoolean(source.needs_site_inspection),
    missingInformation: asTextList(source.missing_information),
    location: asText(source.location),
    estimateStatus: asText(source.estimate_status),
    authorityStatus: asText(source.authority_status),
    modelName: asText(source.model),
    missingFields,
    unexpectedFields,
    presentFields,
    /** True when at least one documented field is present in the response. */
    usable: presentFields.some((field) => KNOWN_ANALYSIS_FIELDS.includes(field)),
  }
}

/** A payload we can attempt to render: a non-empty object. */
export function isRecognizedAnalysisPayload(payload) {
  return isPlainObject(payload) && Object.keys(payload).length > 0
}

/**
 * Interpret `authority_status` honestly.
 *
 * A successful analysis never means a complaint was filed. Only an explicit
 * backend status is reported, and even then the UI states that the frontend
 * cannot verify it with any authority.
 */
export function resolveAuthorityStatus(rawValue) {
  const value = asText(rawValue)
  if (!value) {
    return {
      key: 'unknown',
      label: 'Not reported',
      tone: 'neutral',
      detail: 'The analysis response did not include an authority-submission status.',
    }
  }

  const normalized = value.toLowerCase()
  if (['not_submitted', 'not-submitted', 'none', 'pending', 'unsent'].includes(normalized)) {
    return {
      key: 'not_submitted',
      label: 'Not submitted to any authority',
      tone: 'neutral',
      detail:
        'The AI analysis only produces an assessment. No complaint has been sent to a municipal or government authority from this application.',
    }
  }

  return {
    key: 'reported_by_backend',
    label: `Backend reported: ${value}`,
    tone: 'caution',
    detail:
      'The analysis service returned this status. The frontend cannot confirm that a department received or acknowledged anything — verify it directly with the responsible office.',
  }
}

/** Human readable estimate status. */
export function resolveEstimateStatus(rawValue) {
  const value = asText(rawValue)
  if (!value) {
    return { label: 'Estimate status not reported', detail: null }
  }
  const normalized = value.toLowerCase()
  if (normalized === 'preliminary') {
    return {
      label: 'Preliminary estimate',
      detail:
        'Figures are indicative, based only on the photograph and the information provided. They are not a quotation.',
    }
  }
  if (normalized === 'final') {
    return { label: 'Final estimate', detail: 'The analysis service marked this estimate as final.' }
  }
  if (normalized === 'unavailable') {
    return { label: 'Estimate unavailable', detail: 'The analysis service could not produce an estimate.' }
  }
  return { label: value, detail: null }
}

/** Received-at timestamp used across the results UI. */
export function buildAnalysisSession({ payload, request, receivedAt = new Date().toISOString() }) {
  return {
    analysis: normalizeAnalysis(payload),
    request: request ?? null,
    receivedAt: toDate(receivedAt)?.toISOString() ?? new Date().toISOString(),
  }
}
