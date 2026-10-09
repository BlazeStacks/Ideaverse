import { ArrowUpRight, FlaskConical, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SeverityBadge } from '@/components/reports/SeverityBadge'
import { StatusBadge, SubmissionStatusBadge } from '@/components/reports/StatusBadge'
import { formatDate, formatReportId, PLACEHOLDER } from '@/lib/format'

/**
 * Compact report card used on small screens, where the table is hidden.
 * @param {{ reports: Array<object> }} props
 */
export function ReportCardList({ reports }) {
  return (
    <ul className="space-y-3 md:hidden">
      {reports.map((report) => {
        const id = report.id ?? report.report_id
        const reference = formatReportId(id)

        return (
          <li key={String(id)}>
            <Link
              to={`/dashboard/reports/${encodeURIComponent(String(id))}`}
              state={{ report }}
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground" data-slot="metric">
                    {reference}
                    {report.isDemo ? (
                      <>
                        <FlaskConical aria-hidden="true" className="size-3.5 text-amber-600" />
                        <span className="text-amber-700">Demo data</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {report.issueType ?? report.issue_type ?? PLACEHOLDER}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SeverityBadge value={report.severity} size="sm" />
                <StatusBadge status={report.status} />
                <SubmissionStatusBadge value={report.submissionStatus} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-3.5" />
                  {report.location ?? PLACEHOLDER}
                </span>
                <span>Reported {formatDate(report.reportedAt ?? report.reported_at) ?? PLACEHOLDER}</span>
              </div>

              <span className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-primary">
                View report
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
