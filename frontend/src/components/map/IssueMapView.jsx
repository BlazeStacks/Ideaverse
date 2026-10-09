import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'

import { SeverityBadge } from '@/components/reports/SeverityBadge'
import { StatusBadge } from '@/components/reports/StatusBadge'
import { formatDateTime } from '@/lib/format'
import { INDIA_CENTER, INDIA_ZOOM, LABELS_URL, SEVERITY_COLORS, TILE_ATTRIBUTION, TILE_URL } from '@/components/map/mapConfig'

/**
 * Interactive map of India with one marker per saved report that has real
 * coordinates. Reports without coordinates are filtered out by the caller and
 * never given a made-up position.
 *
 * @param {{ reports: Array<object> }} props
 */
export function IssueMapView({ reports }) {
  return (
    <MapContainer
      center={INDIA_CENTER}
      zoom={INDIA_ZOOM}
      minZoom={3}
      scrollWheelZoom
      className="h-[60vh] min-h-[360px] w-full rounded-xl border border-border"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={16} />
      <TileLayer url={LABELS_URL} maxZoom={16} />
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={10}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: SEVERITY_COLORS[report.severity] ?? SEVERITY_COLORS.Uncertain,
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <div className="min-w-[200px] max-w-[260px] space-y-2 text-sm">
              <p className="font-semibold text-foreground">{report.issueType ?? 'Civic issue'}</p>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge value={report.severity} size="sm" />
                <StatusBadge status={report.status} />
              </div>
              {report.description ? (
                <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">{report.description}</p>
              ) : null}
              <dl className="space-y-0.5 text-xs">
                <div>
                  <dt className="inline font-medium">Location: </dt>
                  <dd className="inline">{report.location || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Reported: </dt>
                  <dd className="inline">{formatDateTime(report.reportedAt) ?? 'Unknown'}</dd>
                </div>
              </dl>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
