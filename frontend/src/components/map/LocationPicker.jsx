import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import { INDIA_CENTER, INDIA_ZOOM, LABELS_URL, TILE_ATTRIBUTION, TILE_URL } from '@/components/map/mapConfig'

function ClickToSelect({ disabled, onSelect }) {
  useMapEvents({
    click(event) {
      if (disabled) return
      onSelect({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
        accuracyMeters: null,
      })
    },
  })
  return null
}

/** Moves the view to the chosen point (for example after "Use My Location"). */
function FlyToSelection({ coordinates }) {
  const map = useMap()
  const lat = coordinates?.latitude
  const lng = coordinates?.longitude
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15))
    }
  }, [lat, lng, map])
  return null
}

/**
 * Small map on the report form: click to drop the incident pin. The pin is the
 * coordinates saved with the report.
 *
 * @param {{
 *   coordinates: { latitude: number, longitude: number } | null,
 *   onSelect: (coordinates: { latitude: number, longitude: number, accuracyMeters: null }) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function LocationPicker({ coordinates, onSelect, onLocate, isLocating = false, disabled = false }) {
  return (
    <div className="relative">
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        minZoom={3}
        scrollWheelZoom={false}
        className="h-72 w-full rounded-xl border border-border sm:h-80"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={16} />
        <TileLayer url={LABELS_URL} maxZoom={16} />
        <ClickToSelect disabled={disabled} onSelect={onSelect} />
        <FlyToSelection coordinates={coordinates} />
        {coordinates ? (
          <CircleMarker
            center={[coordinates.latitude, coordinates.longitude]}
            radius={11}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#ea580c', fillOpacity: 1 }}
          />
        ) : null}
      </MapContainer>

      {onLocate ? (
        <button
          type="button"
          onClick={onLocate}
          disabled={disabled || isLocating}
          className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-md transition-colors hover:bg-secondary disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" className={isLocating ? 'size-4 animate-pulse text-primary' : 'size-4 text-primary'} />
          {isLocating ? 'Locating…' : 'Use my location'}
        </button>
      ) : null}
    </div>
  )
}
