/**
 * Shared frontend constants.
 *
 * Issue categories live in `src/config/issueCategories.js` and authority
 * entries in `src/config/authorityDirectory.js` — this file must not duplicate
 * either of them.
 */

export const APP_NAME = 'CivicFix AI'
export const APP_TAGLINE = 'Turn a photograph of a civic problem into a report you can act on'

/** Primary navigation. Every entry must resolve to a real route. */
export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Report an Issue', to: '/report' },
  { label: 'Issue Map', to: '/map' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'About', to: '/about' },
  { label: 'Help', to: '/help' },
]

/* -------------------------------------------------------------------------- */
/* Upload rules                                                              */
/* -------------------------------------------------------------------------- */

export const IMAGE_ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
export const IMAGE_ACCEPT_ATTRIBUTE = [...IMAGE_ACCEPTED_MIME_TYPES, ...IMAGE_ACCEPTED_EXTENSIONS].join(
  ',',
)
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024 // 8 MB

/* -------------------------------------------------------------------------- */
/* Location rules                                                            */
/* -------------------------------------------------------------------------- */

export const MIN_LOCATION_LENGTH = 3
export const MAX_LOCATION_LENGTH = 160
export const MAX_LANDMARK_LENGTH = 120
export const MAX_DETAILS_LENGTH = 1000

/**
 * How much text the backend reads (backend/main.py truncates beyond this).
 * The frontend keeps its composed `location` and `additional_details` inside
 * these limits so nothing is cut off without the citizen knowing.
 */
export const BACKEND_TEXT_LIMITS = {
  location: 500,
  additionalDetails: 1500,
}

/** How accurate browser geolocation typically is; never presented as precise. */
export const GEOLOCATION_NOTE =
  'Device location can be off by tens or hundreds of metres, especially indoors. Treat the coordinates as a hint and always add a landmark.'

/* -------------------------------------------------------------------------- */
/* Domain vocabulary                                                         */
/* -------------------------------------------------------------------------- */

/** Severity vocabulary the results interface understands. */
export const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical', 'Uncertain']

/** Preliminary estimate statuses returned by the analysis endpoint. */
export const ESTIMATE_STATUS_LABELS = {
  preliminary: 'Preliminary estimate',
  final: 'Final estimate',
  unavailable: 'Estimate unavailable',
}

/**
 * Report workflow statuses used by sample records and by future stored reports.
 *
 * New reports start as Open. There is no in-app way to change a status yet
 * (no accounts); edit the `status` column in Supabase to demonstrate Resolved.
 */
export const REPORT_STATUSES = ['Open', 'In Review', 'In Progress', 'Resolved', 'Closed']
