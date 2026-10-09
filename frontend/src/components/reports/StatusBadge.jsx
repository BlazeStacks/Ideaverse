import { CircleSlash, CircleDot, CircleCheckBig, LoaderCircle, Send, HelpCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { resolveAuthorityStatus } from '@/lib/analysis'
import { resolveSubmissionStatus } from '@/lib/submissionStatus'

const REPORT_STATUS_TONES = {
  open: { variant: 'info', Icon: CircleDot },
  inreview: { variant: 'warning', Icon: LoaderCircle },
  inprogress: { variant: 'warning', Icon: LoaderCircle },
  resolved: { variant: 'success', Icon: CircleCheckBig },
  closed: { variant: 'muted', Icon: CircleSlash },
}

/**
 * Workflow status badge. Status vocabulary comes from the (not yet implemented)
 * reports API, so unknown values fall back to a neutral badge.
 * @param {{ status: unknown }} props
 */
export function StatusBadge({ status }) {
  const label = typeof status === 'string' && status.trim() ? status.trim() : 'Unknown'
  const tone = REPORT_STATUS_TONES[label.toLowerCase().replace(/[\s_-]/g, '')] ?? {
    variant: 'neutral',
    Icon: CircleDot,
  }
  const { Icon } = tone

  return (
    <Badge variant={tone.variant}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </Badge>
  )
}

/**
 * Submission-status badge for a stored or sample record.
 *
 * Absent information is shown as "Not tracked" rather than assumed to be
 * submitted or resolved.
 * @param {{ value: unknown }} props
 */
export function SubmissionStatusBadge({ value }) {
  if (!value) return <Badge variant="outline">Not tracked</Badge>

  const meta = resolveSubmissionStatus(value)
  return (
    <Badge variant={meta.badgeVariant}>
      <meta.Icon aria-hidden="true" className="size-3.5" />
      {meta.label}
    </Badge>
  )
}

/**
 * Authority-submission badge.
 *
 * Renders only what the backend actually reported. A successful analysis is
 * never presented as a filed complaint.
 * @param {{ value: unknown }} props
 */
export function AuthorityStatusBadge({ value }) {
  const status = resolveAuthorityStatus(value)

  if (status.key === 'not_submitted') {
    return (
      <Badge variant="neutral">
        <CircleSlash aria-hidden="true" className="size-3.5" />
        {status.label}
      </Badge>
    )
  }

  if (status.key === 'reported_by_backend') {
    return (
      <Badge variant="warning">
        <Send aria-hidden="true" className="size-3.5" />
        {status.label}
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <HelpCircle aria-hidden="true" className="size-3.5" />
      {status.label}
    </Badge>
  )
}
