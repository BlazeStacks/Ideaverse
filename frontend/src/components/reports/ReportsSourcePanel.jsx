import { Database, FlaskConical, Link2Off, PlugZap, TriangleAlert } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime } from '@/lib/format'
import { REPORTS_DATA_SOURCE } from '@/services/reportsService'
import { cn } from '@/lib/utils'

const SOURCE_STATE = {
  [REPORTS_DATA_SOURCE.NONE]: {
    label: 'No report data source connected',
    detail:
      'Stored reports require a backend reports endpoint, which does not exist yet. The interface below is complete and will render real records as soon as it does.',
    Icon: Link2Off,
    className: 'text-slate-600',
  },
  [REPORTS_DATA_SOURCE.DEMO]: {
    label: 'Showing labelled demo data',
    detail: 'Fictional records are displayed so the dashboard layout can be reviewed. Nothing here is a real incident.',
    Icon: FlaskConical,
    className: 'text-amber-700',
  },
  [REPORTS_DATA_SOURCE.API]: {
    label: 'Connected to the reports API',
    detail: 'Records were returned by the backend reports endpoint.',
    Icon: Database,
    className: 'text-emerald-700',
  },
}

/**
 * Controls for the dashboard's data source.
 *
 * Both actions are explicit and perform real work: "Connect" makes a genuine
 * request (and reports the real failure), "Load demo data" pulls in the
 * clearly labelled sample dataset.
 *
 * @param {{
 *   source: string,
 *   isLoading: boolean,
 *   error: { message: string, code?: string, status?: number|null } | null,
 *   lastLoadedAt?: string | null,
 *   onConnect: () => void,
 *   onLoadDemo: () => void,
 *   onClear: () => void,
 *   hasData: boolean,
 * }} props
 */
export function ReportsSourcePanel({
  source,
  isLoading,
  error,
  lastLoadedAt,
  onConnect,
  onLoadDemo,
  onClear,
  hasData,
}) {
  const state = SOURCE_STATE[source] ?? SOURCE_STATE[REPORTS_DATA_SOURCE.NONE]
  const { Icon } = state

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <PlugZap aria-hidden="true" className="size-4" />
          </span>
          <CardTitle>Report data source</CardTitle>
        </div>
        <CardDescription>
          Analysis and storage are separate capabilities: producing an assessment does not save a report.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', state.className)} />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{state.label}</p>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{state.detail}</p>
              {lastLoadedAt ? (
                <p className="text-xs text-muted-foreground">Loaded {formatDateTime(lastLoadedAt)}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button variant="outline" size="sm" onClick={onConnect} disabled={isLoading}>
              {isLoading ? <Spinner label="Connecting" className="text-primary" /> : <Database />}
              {isLoading ? 'Checking…' : 'Connect reports API'}
            </Button>

            {hasData ? (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onLoadDemo}>
                <FlaskConical />
                Load demo data
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <Alert
            variant="warning"
            icon={TriangleAlert}
            title="The reports request did not return usable data"
            role="alert"
          >
            <p>{error.message}</p>
            <p className="text-xs">
              This is expected until the backend exposes report storage. Nothing was substituted in its place.
              {typeof error.status === 'number' ? ` (HTTP ${error.status})` : ''}
            </p>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
