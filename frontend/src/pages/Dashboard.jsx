import {
  ArrowRight,
  BellRing,
  CircleDot,
  Database,
  FileSearch,
  ListFilter,
  Network,
  ScanSearch,
  TriangleAlert,
  UserCog,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { DemoDataNotice } from '@/components/reports/DemoDataNotice'
import { ReportCardList } from '@/components/reports/ReportCard'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { ReportTable } from '@/components/reports/ReportTable'
import { ReportsSourcePanel } from '@/components/reports/ReportsSourcePanel'
import { StatCard } from '@/components/reports/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/ui/empty-state'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReportFilters } from '@/hooks/useReportFilters'
import { useReports } from '@/hooks/useReports'
import { REPORT_STATUSES } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { resolveSubmissionStatus } from '@/lib/submissionStatus'

const PLANNED_ACTIONS = [
  { label: 'Assign an inspector', detail: 'Requires report storage and officer accounts. CivicFix has no official dashboard.' },
  { label: 'Change report status', detail: 'Requires a write endpoint and an audit history from the authority.' },
  { label: 'Export the filtered list', detail: 'Requires a real dataset to export.' },
  { label: 'Open the incident map', detail: 'Requires genuine report coordinates and a verified data source.' },
]

export default function Dashboard() {
  useDocumentTitle('My reports')

  const { source, reports, isLoading, error, lastLoadedAt, isDemo, connect, loadDemo, clear } = useReports()
  const { sessionId, analysis, complaint, submissionStatus, receivedAt } = useAnalysisSession()
  const sessionStatus = resolveSubmissionStatus(submissionStatus)

  const {
    filters,
    setFilter,
    resetFilters,
    facets,
    filteredReports,
    activeFilterCount,
    isFiltered,
    isFilteredEmpty,
  } = useReportFilters(reports)

  const hasData = reports.length > 0

  const stats = useMemo(() => {
    if (!hasData) {
      return { total: null, open: null, inspection: null, severe: null }
    }
    const severityKey = (report) => String(report.severity ?? '').toLowerCase()
    const statusKey = (report) => String(report.status ?? '').toLowerCase()

    return {
      total: reports.length,
      open: reports.filter((report) => statusKey(report) === 'open').length,
      inspection: reports.filter((report) => report.needsInspection === true).length,
      severe: reports.filter((report) => ['high', 'critical'].includes(severityKey(report))).length,
    }
  }, [reports, hasData])

  const unavailableHint = 'Not available until a reports API is connected.'

  return (
    <>
      <PageHeader
        eyebrow="Citizen view"
        title="My reports"
        description="Keep track of the civic problems you have reported and what you did about them. Reports are not stored on a server yet, so this page shows either records returned by a connected reports API or clearly labelled sample data — and it never invents municipal statistics."
        actions={
          <Button asChild>
            <Link to="/report">
              <ScanSearch />
              Report an issue
            </Link>
          </Button>
        }
      />

      <Container className="space-y-8 py-8 sm:py-10">
        {sessionId && analysis ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <CircleDot aria-hidden="true" className="size-4" />
                  </span>
                  <CardTitle as="h2">Your current report is still open in this tab</CardTitle>
                </div>
                <Badge variant={sessionStatus.badgeVariant}>
                  <sessionStatus.Icon aria-hidden="true" className="size-3.5" />
                  {sessionStatus.label}
                </Badge>
              </div>
              <CardDescription>
                {analysis.issueType ? `Assessed as “${analysis.issueType}”. ` : 'Assessment in progress. '}
                This report, its complaint draft and its status exist only in this browser tab — they are not saved
                anywhere, and they disappear when you reload or close it.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <Link to="/results">
                  Open the assessment
                  <ArrowRight />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                {complaint ? 'A complaint draft is ready to review.' : 'No complaint draft yet.'}
                {receivedAt ? ` Analysed ${formatDateTime(receivedAt)}.` : ''}
              </span>
            </CardContent>
          </Card>
        ) : null}
        <ReportsSourcePanel
          source={source}
          isLoading={isLoading}
          error={error}
          lastLoadedAt={lastLoadedAt}
          onConnect={connect}
          onLoadDemo={loadDemo}
          onClear={clear}
          hasData={hasData}
        />

        {isDemo ? <DemoDataNotice onClear={clear} /> : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Reports loaded"
            value={stats.total}
            icon={Database}
            isLoading={isLoading}
            isDemo={isDemo}
            unavailableHint={unavailableHint}
          />
          <StatCard
            label="Open"
            value={stats.open}
            icon={CircleDot}
            isLoading={isLoading}
            isDemo={isDemo}
            tone="info"
            unavailableHint={unavailableHint}
          />
          <StatCard
            label="Awaiting site inspection"
            value={stats.inspection}
            icon={BellRing}
            isLoading={isLoading}
            isDemo={isDemo}
            tone="warning"
            unavailableHint={unavailableHint}
          />
          <StatCard
            label="High or critical severity"
            value={stats.severe}
            icon={TriangleAlert}
            isLoading={isLoading}
            isDemo={isDemo}
            tone="warning"
            unavailableHint={unavailableHint}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ListFilter aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h2">Filters</CardTitle>
              </div>
              {isFiltered ? (
                <Badge variant="default">
                  {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                </Badge>
              ) : null}
            </div>
            <CardDescription>
              Filtering runs entirely in the browser over the currently loaded records, so it does not require the
              backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportFilters
              filters={filters}
              setFilter={setFilter}
              resetFilters={resetFilters}
              facets={facets}
              resultCount={filteredReports.length}
              totalCount={reports.length}
              isFiltered={isFiltered}
              disabled={!hasData}
            />
          </CardContent>
        </Card>

        {!hasData ? (
          <EmptyState
            icon={Database}
            title="No stored reports are available"
            description={
              <>
                <p>
                  Report history is not implemented. The agreed backend contract exposes only the analysis endpoint,
                  which returns an assessment without saving it, so there are no real records to list here. Your
                  current report lives in this tab only.
                </p>
                <p>
                  Use <span className="font-medium text-foreground">Connect reports API</span> to attempt a real request
                  against <span className="font-mono text-xs">GET /reports</span>, or load labelled sample data to review
                  the layout. Sample records and real records are never shown together.
                </p>
              </>
            }
            actions={
              <>
                <Button onClick={connect} disabled={isLoading}>
                  <Network />
                  Connect reports API
                </Button>
                <Button variant="outline" onClick={loadDemo}>
                  Load demo data
                </Button>
              </>
            }
          />
        ) : isFilteredEmpty ? (
          <EmptyState
            icon={FileSearch}
            title="No reports match the current filters"
            description={<p>Adjust or reset the filters to see the {reports.length} loaded records.</p>}
            actions={
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <ReportTable reports={filteredReports} />
            <ReportCardList reports={filteredReports} />
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <UserCog aria-hidden="true" className="size-4" />
              </span>
              <CardTitle as="h2">Operations that are still to be built</CardTitle>
            </div>
            <CardDescription>
              These belong to an official workflow that does not exist in this build. They are deliberately inert — no
              assignment, status change or escalation is recorded anywhere.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            {PLANNED_ACTIONS.map((action) => (
              <div
                key={action.label}
                className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4"
              >
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled aria-describedby={`planned-${action.label}`}>
                    {action.label}
                  </Button>
                  <Badge variant="muted">Not implemented</Badge>
                </div>
                <p id={`planned-${action.label}`} className="text-xs leading-relaxed text-muted-foreground">
                  {action.detail}
                </p>
              </div>
            ))}

            <div className="sm:col-span-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Status vocabulary reserved for the future official workflow:{' '}
                <span className="font-medium text-foreground">{REPORT_STATUSES.join(' · ')}</span>. Reports are never
                moved between these states in this build, and no status change is simulated. Submission status, which
                you control yourself, is recorded on the assessment page only — CivicFix has no authority feed to
                observe it for you.
              </p>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  )
}
