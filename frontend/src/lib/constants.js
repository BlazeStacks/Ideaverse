/**
 * Shared frontend constants.
 *
 * Nothing in this file describes backend behaviour. Where a capability depends
 * on the separately developed backend, `BACKEND_DEPENDENCIES` marks it as
 * pending so the UI can be honest about it.
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
 * These are presentation vocabulary only: no report is ever persisted or moved
 * between statuses until the backend exposes report storage.
 */
export const REPORT_STATUSES = ['Open', 'In Review', 'In Progress', 'Resolved', 'Closed']

/* -------------------------------------------------------------------------- */
/* Honest boundaries                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Capabilities that depend on the backend, or that carry a trust caveat.
 * `implemented: false` entries may be shown in the UI as planned, but must never
 * be presented as working.
 */
export const BACKEND_DEPENDENCIES = [
  {
    id: 'analysis',
    label: 'AI image analysis',
    detail:
      'POST /analyze on the FastAPI backend. The frontend is wired and will render a real response as soon as the endpoint responds.',
    implemented: true,
  },
  {
    id: 'complaint',
    label: 'Complaint preparation',
    detail:
      'Drafted in your browser from the analysis using a fixed template. No AI service, no API key and no network request is involved.',
    implemented: true,
  },
  {
    id: 'authority-guidance',
    label: 'Authority guidance',
    detail:
      'A small curated directory of bodies that may be responsible, with the verification state of every channel. It is guidance, not an official ruling on ownership.',
    implemented: true,
  },
  {
    id: 'persistence',
    label: 'Report persistence',
    detail:
      'Storing reports and complaints. Not implemented — the analysis and your draft live in this browser tab only.',
    implemented: false,
  },
  {
    id: 'history',
    label: 'Report history & search',
    detail:
      'Retrieving stored reports. Not implemented — the dashboard ships with an honest empty state and separate demo data.',
    implemented: false,
  },
  {
    id: 'jurisdiction',
    label: 'Verified jurisdiction lookup',
    detail:
      'Determining the legal owner of a specific asset (municipal, state or national). Not implemented; the directory only suggests likely bodies and asks you to confirm.',
    implemented: false,
  },
  {
    id: 'submission',
    label: 'Authority submission',
    detail:
      'Sending a complaint to a government authority. Not implemented and never simulated — CivicFix cannot submit, acknowledge or track a complaint.',
    implemented: false,
  },
  {
    id: 'map',
    label: 'Interactive incident map',
    detail:
      'Plotting genuine report coordinates. Not implemented — no invented incidents are displayed, and coordinates are never published automatically.',
    implemented: false,
  },
  {
    id: 'auth',
    label: 'Authentication & roles',
    detail:
      'Citizen and official accounts. Not implemented; the codebase leaves a documented integration point.',
    implemented: false,
  },
]
