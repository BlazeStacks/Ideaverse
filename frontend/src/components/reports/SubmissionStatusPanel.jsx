import { Info, Lock, TriangleAlert } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAnalysisSession } from '@/context/AnalysisContext'
import {
  SELECTABLE_SUBMISSION_STATUSES,
  SUBMISSION_STATUS_META,
  UNAVAILABLE_SUBMISSION_STATUSES,
  resolveSubmissionStatus,
} from '@/lib/submissionStatus'
import { cn } from '@/lib/utils'

/**
 * Section G — submission status.
 *
 * CivicFix can only know what it did, and it did nothing: it cannot browse to an
 * authority, submit a form, receive an acknowledgement or observe a repair. The
 * only honest states are therefore the ones the citizen declares, plus a clearly
 * named "marked outside CivicFix" state that is explicitly unverified.
 *
 * "Awaiting Authority Response" and "Resolved" are shown as unavailable, with
 * the exact information that would be needed to support them.
 */
export function SubmissionStatusPanel() {
  const { submissionStatus, setSubmissionStatus } = useAnalysisSession()
  const current = resolveSubmissionStatus(submissionStatus)

  return (
    <Card id="submission-status" className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle as="h2">Submission status</CardTitle>
          <Badge variant={current.badgeVariant}>
            <current.Icon aria-hidden="true" className="size-3.5" />
            {current.label}
          </Badge>
        </div>
        <CardDescription>
          This is a record of what you did, not a tracking system. CivicFix cannot see or query any authority portal.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Alert variant="neutral" icon={Info} title="What counts as a submission — and what does not">
          <p>
            Copying, downloading, printing or opening an official website is <strong>not</strong> a submission. CivicFix
            only records a submission when you tell it that you completed one yourself, and even then it cannot verify
            it.
          </p>
        </Alert>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Record what you have done</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {SELECTABLE_SUBMISSION_STATUSES.map((statusKey) => {
              const meta = SUBMISSION_STATUS_META[statusKey]
              const isSelected = submissionStatus === statusKey

              return (
                <label
                  key={statusKey}
                  className={cn(
                    'flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors',
                    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
                    isSelected
                      ? 'border-primary bg-secondary/60 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50',
                  )}
                >
                  <input
                    type="radio"
                    name="submission-status"
                    value={statusKey}
                    checked={isSelected}
                    onChange={() => setSubmissionStatus(statusKey)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <meta.Icon
                      aria-hidden="true"
                      className={cn('size-4', isSelected ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{meta.summary}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <p aria-live="polite" className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {current.detail}
        </p>

        <Separator />

        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock aria-hidden="true" className="size-4 text-muted-foreground" />
            Statuses CivicFix cannot record yet
          </p>
          <ul className="space-y-2">
            {UNAVAILABLE_SUBMISSION_STATUSES.map((status) => (
              <li
                key={status.key}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3"
              >
                <status.Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{status.label}</span>
                    <Badge variant="muted">Not available</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Requires: {status.requires}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Alert variant="warning" icon={TriangleAlert} title="This status is session-only">
          <p>
            Nothing here is stored on a server. If you reload the page or open a new tab, this status and your complaint
            draft are gone — keep your own copy (the downloaded .txt file) and the reference number the authority gives
            you.
          </p>
        </Alert>
      </CardContent>
    </Card>
  )
}
