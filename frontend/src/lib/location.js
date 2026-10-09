/**
 * Location helpers.
 *
 * The backend has a single free-text `location` field and no coordinate fields,
 * so a landmark is folded into that text. Captured coordinates are sent only
 * when they are the citizen's only description of the place (no typed address);
 * otherwise they stay in the browser.
 */

/**
 * Compose the single location string sent to the backend.
 * Falls back to the captured coordinates when no address text was typed.
 */
export function composeLocationText({ location, landmark, coordinates } = {}) {
  const typed = typeof location === 'string' ? location.trim() : ''
  const near = typeof landmark === 'string' ? landmark.trim() : ''
  const formatted = isValidCoordinates(coordinates) ? formatCoordinates(coordinates) : null
  const base = typed || (formatted ? `GPS coordinates ${formatted}` : '')
  if (base && near) return `${base} — near ${near}`
  return base || near || ''
}

/** True when the submitted location text is built from coordinates alone. */
export function locationComesFromCoordinates({ location, coordinates } = {}) {
  const typed = typeof location === 'string' ? location.trim() : ''
  return !typed && isValidCoordinates(coordinates)
}

/** Human-readable coordinates, rounded for display. */
export function formatCoordinates(coordinates, digits = 5) {
  if (!coordinates) return null
  const { latitude, longitude } = coordinates
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return `${latitude.toFixed(digits)}, ${longitude.toFixed(digits)}`
}

/** Plain description of a captured location, including its limits. */
export function describeCoordinates(coordinates, accuracyMeters) {
  const formatted = formatCoordinates(coordinates)
  if (!formatted) return null
  const accuracy =
    typeof accuracyMeters === 'number' && accuracyMeters > 0 ? ` Reported accuracy about ±${accuracyMeters} m.` : ''
  return `${formatted}.${accuracy} Device location is a hint, not an address: it does not say which side of the road the problem is on. The coordinates are stored and shown on the public Issue Map only if you save the report.`
}

/** True when the captured coordinates look like a usable pair. */
export function isValidCoordinates(coordinates) {
  if (!coordinates) return false
  const { latitude, longitude } = coordinates
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}
