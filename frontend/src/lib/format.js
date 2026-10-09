/**
 * Presentation formatters.
 *
 * Every formatter is defensive: the analysis response may contain null,
 * missing or unexpected values. Formatters return `null` (never a fabricated
 * number such as 0) when there is nothing reliable to display.
 */

const PLACEHOLDER = '—'

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** @param {unknown} value */
export function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** Human readable file size, e.g. "2.4 MB". */
export function formatFileSize(bytes) {
  const value = toFiniteNumber(bytes)
  if (value === null || value < 0) return PLACEHOLDER
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB']
  let size = value / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const rounded = size >= 10 ? Math.round(size) : Math.round(size * 10) / 10
  return `${rounded} ${units[unitIndex]}`
}

/** Format a confidence value (0–1) as a percentage string, or null. */
export function formatConfidence(value) {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return null
  const normalized = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed
  if (normalized < 0 || normalized > 1) return null
  return `${Math.round(normalized * 100)}%`
}

/** Format a numeric value for display with optional digits. */
export function formatNumber(value, { maximumFractionDigits = 0 } = {}) {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return PLACEHOLDER
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(parsed)
}

/** Format a monetary amount in INR, or null when unavailable. */
export function formatCurrency(value) {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return null
  return inrFormatter.format(parsed)
}

/**
 * Format a cost range. Returns null when the range carries no usable bound —
 * the caller must explain the missing information rather than print zero.
 * @returns {{ display: string, partial: boolean } | null}
 */
export function formatCostRange(estimate) {
  const minimum = formatCurrency(estimate?.minimum)
  const maximum = formatCurrency(estimate?.maximum)

  if (minimum && maximum) {
    if (minimum === maximum) return { display: minimum, partial: false }
    return { display: `${minimum} – ${maximum}`, partial: false }
  }
  if (minimum) return { display: `${minimum} and above`, partial: true }
  if (maximum) return { display: `Up to ${maximum}`, partial: true }
  return null
}

/**
 * Format a duration range in hours.
 * @returns {{ display: string, partial: boolean } | null}
 */
export function formatDurationRange(estimate) {
  const minimum = toFiniteNumber(estimate?.minimum)
  const maximum = toFiniteNumber(estimate?.maximum)
  const hours = (value) => `${formatNumber(value, { maximumFractionDigits: 1 })} h`

  if (minimum !== null && maximum !== null) {
    if (minimum === maximum) return { display: hours(minimum), partial: false }
    return { display: `${hours(minimum)} – ${hours(maximum)}`, partial: false }
  }
  if (minimum !== null) return { display: `${hours(minimum)} or more`, partial: true }
  if (maximum !== null) return { display: `Up to ${hours(maximum)}`, partial: true }
  return null
}

/** Coerce a date-like value into a Date, or null. */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const fromNumber = new Date(value)
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function formatDateTime(value) {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : null
}

export function formatDate(value) {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : null
}

/** Format a fixed-width identifier such as "CF-2418". */
export function formatReportId(value, prefix = 'CF') {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${prefix}-${String(Math.trunc(value)).padStart(4, '0')}`
  }
  if (typeof value === 'string' && value.trim()) return value.trim()
  return PLACEHOLDER
}

/** Pluralise a count, e.g. "3 reports". */
export function pluralize(count, singular, plural) {
  const value = toFiniteNumber(count)
  if (value === null) return ''
  const word = value === 1 ? singular : plural || `${singular}s`
  return `${value} ${word}`
}

export { PLACEHOLDER }
