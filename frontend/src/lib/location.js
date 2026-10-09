/**
 * Location helpers.
 *
 * The documented backend contract has a single free-text `location` field, so a
 * landmark is folded into that text instead of inventing a new required field.
 * Coordinates are only ever carried as the opt-in proposed fields.
 */

/** Compose the single location string sent to the backend. */
export function composeLocationText({ location, landmark } = {}) {
  const base = typeof location === 'string' ? location.trim() : ''
  const near = typeof landmark === 'string' ? landmark.trim() : ''
  if (base && near) return `${base} — near ${near}`
  return base || near || ''
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
  return `${formatted}.${accuracy} Device location is a hint, not an address: it does not say which side of the road the problem is on, and it is not published anywhere.`
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
