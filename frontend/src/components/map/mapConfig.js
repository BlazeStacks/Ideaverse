/** Shared map settings. Esri World Light Gray tiles: clean look, no API key needed. Attribution is required. */
export const INDIA_CENTER = [22.9734, 78.6569]
export const INDIA_ZOOM = 5
export const TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
export const LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
export const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors'

/** Marker colours per severity (the popup always also states severity in text). */
export const SEVERITY_COLORS = {
  Low: '#0284c7',
  Medium: '#d97706',
  High: '#ea580c',
  Critical: '#b91c1c',
  Uncertain: '#64748b',
}
