import {
  CircleCheckBig,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Hourglass,
  Send,
} from 'lucide-react'

/**
 * Submission status vocabulary.
 *
 * CivicFix cannot observe what happens on another website, so the only states
 * the application may assert by itself are "Draft" and "Ready to Submit".
 * Everything beyond that requires a trustworthy source, and is therefore listed
 * as unavailable with an explanation instead of being offered as a claim.
 *
 * A complaint being copied, downloaded, printed or opened in another tab is
 * NEVER treated as a submission.
 */
export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  SUBMITTED_EXTERNAL: 'submitted_external',
  UNKNOWN: 'unknown',
}

/** Statuses a citizen can set from within CivicFix. */
export const SELECTABLE_SUBMISSION_STATUSES = [
  SUBMISSION_STATUS.DRAFT,
  SUBMISSION_STATUS.READY,
  SUBMISSION_STATUS.SUBMITTED_EXTERNAL,
]

export const SUBMISSION_STATUS_META = {
  [SUBMISSION_STATUS.DRAFT]: {
    key: SUBMISSION_STATUS.DRAFT,
    label: 'Draft',
    Icon: FileText,
    badgeVariant: 'neutral',
    selectable: true,
    summary: 'Your complaint is being prepared and has not been sent anywhere.',
    detail:
      'CivicFix has drafted the complaint in your browser. Nothing has left this device and no authority knows about it.',
  },
  [SUBMISSION_STATUS.READY]: {
    key: SUBMISSION_STATUS.READY,
    label: 'Ready to Submit',
    Icon: ClipboardCheck,
    badgeVariant: 'info',
    selectable: true,
    summary: 'Your complaint is prepared and ready for you to send through an official channel.',
    detail:
      'You marked the complaint as reviewed. CivicFix has not sent it and cannot send it — use the authority channel you chose and keep any reference number they give you.',
  },
  [SUBMISSION_STATUS.SUBMITTED_EXTERNAL]: {
    key: SUBMISSION_STATUS.SUBMITTED_EXTERNAL,
    label: 'Marked as submitted outside CivicFix',
    Icon: Send,
    badgeVariant: 'warning',
    selectable: true,
    summary: 'You told CivicFix that you submitted this complaint yourself.',
    detail:
      'CivicFix cannot verify this, has no acknowledgement number, and does not know the complaint’s status. Keep the reference number from the channel you used — it is the only reliable record.',
  },
  [SUBMISSION_STATUS.UNKNOWN]: {
    key: SUBMISSION_STATUS.UNKNOWN,
    label: 'Submission status unknown',
    Icon: CircleHelp,
    badgeVariant: 'outline',
    selectable: false,
    summary: 'There is no reliable information about whether this was submitted.',
    detail:
      'This record came from somewhere CivicFix cannot verify, so the submission status is unknown rather than assumed.',
  },
}

/**
 * Statuses that require a trustworthy external source before they can be shown
 * as recorded facts. Listed so the interface can explain what is missing.
 */
export const UNAVAILABLE_SUBMISSION_STATUSES = [
  {
    key: 'awaiting_authority',
    label: 'Awaiting Authority Response',
    Icon: Hourglass,
    requires:
      'A verified acknowledgement from the authority, or a tracking endpoint that CivicFix can query.',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    Icon: CircleCheckBig,
    requires:
      'A trustworthy status source confirming that the repair was completed — typically the authority’s own tracking system.',
  },
]

/** Resolve a stored status value into display metadata. */
export function resolveSubmissionStatus(value) {
  if (typeof value === 'string' && SUBMISSION_STATUS_META[value]) {
    return SUBMISSION_STATUS_META[value]
  }
  return SUBMISSION_STATUS_META[SUBMISSION_STATUS.UNKNOWN]
}

/** Can this status be set by the citizen? */
export function isSelectableStatus(value) {
  return SELECTABLE_SUBMISSION_STATUSES.includes(value)
}
