import { ArrowUpRight, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SeverityBadge } from '@/components/reports/SeverityBadge'
import { StatusBadge, SubmissionStatusBadge } from '@/components/reports/StatusBadge'
import { formatDate, formatReportId, PLACEHOLDER } from '@/lib/format'

/**
 * Desktop table of reports. Hidden below `md`, where `ReportCard` is used.
 *
 * The active report is passed through router state rather than a URL, because
 * there is no backend to fetch it from and report identifiers should not be
 * treated as deep links yet.
 *
 * @param {{ reports: Array<object> }} props
 */
export function ReportTable({ reports }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Reports currently loaded in the dashboard</caption>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Reference
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Issue
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Category
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Severity
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Submission
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Location
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Reported
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const id = report.id ?? report.report_id
            const reference = formatReportId(id)

            return (
              <tr key={String(id)} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="flex items-center gap-2 font-medium text-foreground" data-slot="metric">
                    {reference}
                    {report.isDemo ? <FlaskConical aria-hidden="true" className="size-3.5 text-amber-600" /> : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{report.issueType ?? report.issue_type ?? PLACEHOLDER}</td>
                <td className="px-4 py-3 text-muted-foreground">{report.category ?? PLACEHOLDER}</td>
                <td className="px-4 py-3">
                  <SeverityBadge value={report.severity} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={report.status} />
                </td>
                <td className="px-4 py-3">
                  <SubmissionStatusBadge value={report.submissionStatus} />
                </td>
                <td className="max-w-56 truncate px-4 py-3 text-muted-foreground" title={report.location ?? ''}>
                  {report.location ?? PLACEHOLDER}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(report.reportedAt ?? report.reported_at) ?? PLACEHOLDER}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/dashboard/reports/${encodeURIComponent(String(id))}`}
                    state={{ report }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    <span className="sr-only"> details for {reference}</span>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
