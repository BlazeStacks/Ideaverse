import { CircleCheckBig, Database, MapPin, MapPinOff, Save } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { formatCoordinates, isValidCoordinates } from '@/lib/location'
import { buildSaveReportPayload } from '@/lib/savePayload'
import { saveReport } from '@/services/reportsService'

/**
 * "Save this report" — stores the finished assessment in Supabase through the
 * backend. Saving is an explicit choice; nothing is stored before the button is
 * pressed. Pressing it twice (or retrying after a timeout) cannot create a
 * duplicate: the backend de-duplicates on the session's `clientRequestId`.
 */
export function SaveReportCard({ categoryId }) {
  const { session, analysis, request, savedReport, setSavedReport } = useAnalysisSession()
  const [state, setState] = useState({ status: 'idle', message: null })
  const inFlightRef = useRef(false)

  const coordinates = isValidCoordinates(request?.coordinates) ? request.coordinates : null
  const notCivic = analysis?.isCivicIssue === false

  const handleSave = useCallback(async () => {
    if (inFlightRef.current || savedReport) return
    const built = buildSaveReportPayload({
      analysis,
      request,
      categoryId,
      clientRequestId: session?.clientRequestId,
    })
    if (!built.ok) {
      setState({ status: 'error', message: built.message })
      return
    }

    inFlightRef.current = true
    setState({ status: 'saving', message: null })
    try {
      const { report } = await saveReport(built.payload)
      setSavedReport(report)
      setState({ status: 'idle', message: null })
    } catch (error) {
      setState({
        status: 'error',
        message: error?.detail || error?.message || 'The report could not be saved.',
      })
    } finally {
      inFlightRef.current = false
    }
  }, [analysis, categoryId, request, savedReport, session, setSavedReport])

  const saving = state.status === 'saving'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Database aria-hidden="true" className="size-4" />
          </span>
          <CardTitle as="h3">Save this report</CardTitle>
        </div>
        <CardDescription>
          Stores the assessment (category, severity, confidence, actions, estimates, location and date) so it is still
          there after a refresh or restart. The photograph is not stored. Saving does not send anything to an
          authority.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="flex items-start gap-2 text-sm text-foreground">
          {coordinates ? (
            <>
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Will be saved with coordinates <span className="font-mono text-xs">{formatCoordinates(coordinates)}</span>{' '}
                and shown as a marker on the Issue Map.
              </span>
            </>
          ) : (
            <>
              <MapPinOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                No map coordinates were chosen, so this report will be saved without a map marker. Add them next time
                by clicking the map on the report form.
              </span>
            </>
          )}
        </p>

        {savedReport ? (
          <Alert variant="success" icon={CircleCheckBig} title="Report saved" role="status">
            <p>
              Saved permanently
              {savedReport.hasCoordinates ? ' and visible on the Issue Map' : ''}. Pressing save again will not create a
              duplicate.
            </p>
            <p className="mt-2 flex flex-wrap gap-3 text-sm">
              <Link to="/dashboard" className="font-medium underline underline-offset-2">
                View in the dashboard
              </Link>
              {savedReport.hasCoordinates ? (
                <Link to="/map" className="font-medium underline underline-offset-2">
                  View on the map
                </Link>
              ) : null}
            </p>
          </Alert>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={saving || notCivic}>
              {saving ? <Spinner label="Saving" /> : <Save />}
              {saving ? 'Saving…' : state.status === 'error' ? 'Try saving again' : 'Save report'}
            </Button>
            {notCivic ? (
              <span className="text-xs text-muted-foreground">
                This image was not identified as a civic issue, so it cannot be saved.
              </span>
            ) : null}
          </div>
        )}

        {state.status === 'error' ? (
          <Alert variant="danger" title="The report was not saved" role="alert">
            <p>{state.message}</p>
            <p className="text-xs">Nothing was stored. Trying again is safe — it cannot create a duplicate.</p>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
