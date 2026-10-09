import { CircleCheckBig, Database, MapPin, MapPinOff, RefreshCw, ScanSearch, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { IssueMapView } from '@/components/map/IssueMapView'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { StatCard } from '@/components/reports/StatCard'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/ui/empty-state'
import { SEVERITY_COLORS } from '@/components/map/mapConfig'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReportFilters } from '@/hooks/useReportFilters'
import { useReports } from '@/hooks/useReports'

/**
 * Issue Map: saved reports (from the backend / Supabase) that have real
 * coordinates, plotted on OpenStreetMap. No sample or invented incidents are
 * ever shown here.
 */
export default function IssueMap() {
  useDocumentTitle('Issue map')

  const { reports, isLoading, error, lastLoadedAt, connect } = useReports()

  useEffect(() => {
    connect()
  }, [connect])

  const { filters, setFilter, resetFilters, facets, filteredReports, isFiltered } = useReportFilters(reports)

  const mappable = useMemo(() => filteredReports.filter((report) => report.hasCoordinates), [filteredReports])

  const stats = useMemo(() => {
    const severity = (report) => String(report.severity ?? '').toLowerCase()
    return {
      total: reports.length,
      high: reports.filter((report) => ['high', 'critical'].includes(severity(report))).length,
      resolved: reports.filter((report) => String(report.status ?? '').toLowerCase() === 'resolved').length,
      withoutCoordinates: reports.filter((report) => !report.hasCoordinates).length,
    }
  }, [reports])

  // True only after a successful load, so an empty state never flashes before the request finishes.
  const loaded = Boolean(lastLoadedAt) && !isLoading && !error
  const value = (count) => (loaded ? count : null)

  return (
    <>
      <PageHeader
        eyebrow="Issue map"
        title="Reported civic issues across India"
        description="Saved reports that include a location on the map. Positions are the coordinates the reporter chose; reports without coordinates are saved but not plotted."
        actions={
          <>
            <Button variant="outline" onClick={connect} disabled={isLoading}>
              <RefreshCw className={isLoading ? 'animate-spin' : undefined} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/report">
                <ScanSearch />
                Report an issue
              </Link>
            </Button>
          </>
        }
      />

      <Container className="space-y-6 py-8 sm:py-10">
        {error ? (
          <Alert variant="warning" icon={TriangleAlert} title="Saved reports could not be loaded" role="alert">
            <p>{error.message}</p>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total reports" value={value(stats.total)} icon={Database} isLoading={isLoading} unavailableHint="Reports not loaded." />
          <StatCard label="High / critical severity" value={value(stats.high)} icon={TriangleAlert} tone="warning" isLoading={isLoading} unavailableHint="Reports not loaded." />
          <StatCard label="Resolved" value={value(stats.resolved)} icon={CircleCheckBig} tone="success" isLoading={isLoading} unavailableHint="Reports not loaded." />
          <StatCard label="No map coordinates" value={value(stats.withoutCoordinates)} icon={MapPinOff} isLoading={isLoading} unavailableHint="Reports not loaded." />
        </div>

        <ReportFilters
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          facets={facets}
          resultCount={filteredReports.length}
          totalCount={reports.length}
          isFiltered={isFiltered}
          disabled={reports.length === 0}
        />

        {loaded && reports.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved reports yet"
            description={<p>Analyse an issue, pick its spot on the map, and save the report. It will appear here.</p>}
            actions={
              <Button asChild>
                <Link to="/report">
                  <ScanSearch />
                  Report an issue
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <IssueMapView reports={mappable} />
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <p>
                Showing {mappable.length} of {filteredReports.length} matching report
                {filteredReports.length === 1 ? '' : 's'} on the map.
              </p>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Marker colours by severity">
                {Object.entries(SEVERITY_COLORS).map(([label, color]) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-3 rounded-full" style={{ background: color }} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Container>
    </>
  )
}
