import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardList,
  Database,
  FileSearch,
  MapPin,
  Send,
  ShieldAlert,
  Tag,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DemoDataNotice } from '@/components/reports/DemoDataNotice'
import { SeverityBadge } from '@/components/reports/SeverityBadge'
import { StatusBadge } from '@/components/reports/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/ui/empty-state'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatConfidence, formatDateTime, formatReportId, PLACEHOLDER } from '@/lib/format'
import { resolveSubmissionStatus } from '@/lib/submissionStatus'
import { fetchReportById } from '@/services/reportsService'
import { Spinner } from '@/components/ui/spinner'

export default function ReportDetail() {
  const { reportId } = useParams()
  const location = useLocation()
  const stateReport = location.state?.report ?? null
  const isDemoId = String(reportId).startsWith('DEMO-')
  const [fetched, setFetched] = useState({ id: null, report: null })

  // Opened directly or reloaded: load the record from the backend by id.
  useEffect(() => {
    if (stateReport || isDemoId) return undefined
    const controller = new AbortController()
    fetchReportById(reportId, { signal: controller.signal })
      .then((loaded) => setFetched({ id: reportId, report: loaded }))
      .catch(() => {
        if (!controller.signal.aborted) setFetched({ id: reportId, report: null })
      })
    return () => controller.abort()
  }, [reportId, stateReport, isDemoId])

  const report = stateReport ?? (fetched.id === reportId ? fetched.report : null)
  const isLoading = !stateReport && !isDemoId && fetched.id !== reportId

  useDocumentTitle(`Report ${formatReportId(reportId)}`)

  if (isLoading) {
    return (
      <Container className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <Spinner className="size-5" label="Loading report" />
        <span className="text-sm">Loading report…</span>
      </Container>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Nothing to show: persistence and GET /reports/:id do not exist yet.  */
  /* ------------------------------------------------------------------ */
  if (!report) {
    return (
      <>
        <PageHeader
          eyebrow="Report detail"
          title={`Report ${formatReportId(reportId)}`}
          description="This page renders a single saved report opened from the dashboard."
        />
        <Container className="py-10">
          <EmptyState
            icon={Database}
            title="This report cannot be loaded"
            description={
              <>
                <p>
                  We could not find this report. It may have been removed, or the server may be starting up. Go back
                  to the dashboard and try opening it again.
                </p>
              </>
            }
            actions={
              <>
                <Button asChild>
                  <Link to="/dashboard">
                    <ArrowLeft />
                    Back to the dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/report">
                    <FileSearch />
                    Start a new report
                  </Link>
                </Button>
              </>
            }
          />
        </Container>
      </>
    )
  }

  const reference = formatReportId(report.id ?? report.report_id)
  const isDemo = report.isDemo === true
  const confidence = formatConfidence(report.confidence)

  return (
    <>
      <PageHeader
        eyebrow="Report detail"
        title={report.issueType ?? report.issue_type ?? reference}
        description={
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5" data-slot="metric">
              <Tag aria-hidden="true" className="size-4" />
              {reference}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-4" />
              {report.location ?? PLACEHOLDER}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock aria-hidden="true" className="size-4" />
              {formatDateTime(report.reportedAt ?? report.reported_at) ?? 'Reported time unavailable'}
            </span>
          </p>
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft />
              Back to the dashboard
            </Link>
          </Button>
        }
      />

      <Container className="space-y-8 py-8 sm:py-10">
        {isDemo ? (
          <DemoDataNotice description="This detail view is showing a fictional sample record so the layout can be reviewed. It is not a real incident and no municipal data is involved." />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge value={report.severity} />
                <StatusBadge status={report.status} />
                {isDemo ? <Badge variant="warning">Demo data</Badge> : null}
              </div>
              <CardTitle as="h2">Report summary</CardTitle>
              <CardDescription>
                Fields shown here come from the loaded record only. Nothing is inferred by the interface.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Reference', value: reference, Icon: Tag },
                  { label: 'Issue type', value: report.issueType ?? report.issue_type ?? PLACEHOLDER, Icon: ClipboardList },
                  { label: 'Category', value: report.category ?? PLACEHOLDER, Icon: Building2 },
                  { label: 'Location', value: report.location ?? PLACEHOLDER, Icon: MapPin },
                  {
                    label: 'Reported',
                    value: formatDateTime(report.reportedAt ?? report.reported_at) ?? PLACEHOLDER,
                    Icon: CalendarClock,
                  },
                  { label: 'Analysis confidence', value: confidence ?? 'Not reported', Icon: ShieldAlert },
                  {
                    label: 'Submission status',
                    value: report.submissionStatus
                      ? resolveSubmissionStatus(report.submissionStatus).label
                      : 'Not tracked — CivicFix has no submission information for this record',
                    Icon: Send,
                  },
                ].map((field) => (
                  <div key={field.label} className="flex gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
                    <field.Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className="text-sm text-foreground">{field.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Available actions</CardTitle>
              <CardDescription>
                Workflow actions are shown for reference and are not available in this demo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled aria-describedby="detail-assign-note">
                  Assign inspector
                </Button>
                <Button variant="outline" size="sm" disabled aria-describedby="detail-status-note">
                  Change status
                </Button>
                <Button variant="outline" size="sm" disabled aria-describedby="detail-submit-note">
                  Submit to authority
                </Button>
              </div>

              <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li id="detail-assign-note">Assignment needs officer accounts and a write endpoint.</li>
                <li id="detail-status-note">Status changes need persistence plus an audit trail.</li>
                <li id="detail-submit-note">
                  Authority submission is a separate capability from AI analysis and is not implemented at all.
                </li>
              </ul>

              <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                The analysis result for a new report is shown in the assessment view, which is a different capability
                from this stored-record view.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  )
}
