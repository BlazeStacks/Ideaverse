import {
  Archive,
  CircleCheckBig,
  ClipboardCheck,
  FileText,
  Hourglass,
  Send,
} from 'lucide-react'

import { SUBMISSION_STATUS } from '@/lib/submissionStatus'

/**
 * Status of a **saved report** (as opposed to the submission status of the
 * complaint draft on the results page).
 *
 * Every value here is declared by the citizen and stored with the report. None
 * of them is observed by CivicFix: the app cannot query a municipal portal, so
 * it never claims that an authority acknowledged, acted on or fixed anything.
 * The labels say so explicitly, and the badges carry text as well as colour.
 *
 * These keys are the values the backend accepts (`report_schemas.ReportStatus`)
 * and the values the database constrains (`civic_reports_status_check`).
 */
export const REPORT_STATUS = {
  DRAFT: 'draft',
  READY: 'ready_to_submit',
  SUBMITTED: 'submitted_external',
  AWAITING: 'awaiting_response',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
}

export const REPORT_STATUS_ORDER = [
  REPORT_STATUS.DRAFT,
  REPORT_STATUS.READY,
  REPORT_STATUS.SUBMITTED,
  REPORT_STATUS.AWAITING,
  REPORT_STATUS.RESOLVED,
  REPORT_STATUS.CLOSED,
]

export const REPORT_STATUS_META = {
  [REPORT_STATUS.DRAFT]: {
    label: 'Draft',
    short: 'Draft',
    Icon: FileText,
    badgeVariant: 'neutral',
    description: 'Saved with the complaint still being prepared. Nothing was sent anywhere.',
  },
  [REPORT_STATUS.READY]: {
    label: 'Ready to submit',
    short: 'Ready',
    Icon: ClipboardCheck,
    badgeVariant: 'info',
    description: 'You marked the complaint as reviewed and ready to send through an official channel.',
  },
  [REPORT_STATUS.SUBMITTED]: {
    label: 'Marked submitted by you',
    short: 'Submitted (your record)',
    Icon: Send,
    badgeVariant: 'warning',
    description:
      'You told CivicFix that you submitted this complaint yourself outside the app. CivicFix cannot verify it and holds no acknowledgement number.',
  },
  [REPORT_STATUS.AWAITING]: {
    label: 'Waiting — your record',
    short: 'Waiting (your record)',
    Icon: Hourglass,
    badgeVariant: 'warning',
    description:
      'You recorded that you are waiting for a response. CivicFix has no connection to the authority and cannot see any reply.',
  },
  [REPORT_STATUS.RESOLVED]: {
    label: 'Marked resolved — your record',
    short: 'Resolved (your record)',
    Icon: CircleCheckBig,
    badgeVariant: 'success',
    description:
      'You recorded that the problem was fixed. This is not a verified repair: CivicFix could not confirm it with anyone.',
  },
  [REPORT_STATUS.CLOSED]: {
    label: 'Closed by you',
    short: 'Closed',
    Icon: Archive,
    badgeVariant: 'muted',
    description: 'You closed this report without recording a repair.',
  },
}

/** Display metadata for a stored status, with an honest fallback. */
export function resolveReportStatus(value) {
  if (typeof value === 'string' && REPORT_STATUS_META[value]) return REPORT_STATUS_META[value]
  return {
    label: value ? `Unrecognised status “${value}”` : 'No status recorded',
    short: 'Unknown',
    Icon: FileText,
    badgeVariant: 'outline',
    description: 'This record carries a status CivicFix does not recognise. It is shown as-is rather than guessed.',
  }
}

/**
 * Translate the results-page submission status into the stored report status.
 *
 * The two vocabularies are deliberately separate: the results page speaks about
 * a complaint draft, while a saved report has a longer, still citizen-declared,
 * lifecycle. The only mapping needed is the two statuses the app can assert for
 * itself, plus the one the citizen declares.
 */
export function toStoredStatus(submissionStatus) {
  switch (submissionStatus) {
    case SUBMISSION_STATUS.READY:
      return REPORT_STATUS.READY
    case SUBMISSION_STATUS.SUBMITTED_EXTERNAL:
      return REPORT_STATUS.SUBMITTED
    case SUBMISSION_STATUS.DRAFT:
    default:
      return REPORT_STATUS.DRAFT
  }
}
