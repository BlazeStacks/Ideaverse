import { Check, Crosshair, Info, MapPin, Navigation, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { GEOLOCATION_NOTE, MAX_LANDMARK_LENGTH, MAX_LOCATION_LENGTH, MIN_LOCATION_LENGTH } from '@/lib/constants'
import { describeCoordinates, formatCoordinates } from '@/lib/location'
import { GEOLOCATION_STATE, useGeolocation } from '@/hooks/useGeolocation'

/**
 * Location input.
 *
 * Three independent ways to describe where the problem is, and the citizen
 * always keeps control:
 *  1. type an address, street or area (always available, never blocked);
 *  2. optionally capture device coordinates with an explicit button — permission
 *     is only requested on that press;
 *  3. add a landmark to remove ambiguity.
 *
 * Coordinates are never turned into an address (that would need a geocoding
 * service CivicFix does not have), are never published, and are only shown back
 * to the citizen for review.
 *
 * @param {{
 *   location: string,
 *   landmark: string,
 *   coordinates: { latitude: number, longitude: number } | null,
 *   errors?: { location?: string, landmark?: string },
 *   disabled?: boolean,
 *   onLocationChange: (value: string) => void,
 *   onLandmarkChange: (value: string) => void,
 *   onCoordinatesChange: (coordinates: { latitude: number, longitude: number } | null) => void,
 * }} props
 */
export function LocationField({
  location,
  landmark,
  coordinates,
  errors = {},
  disabled = false,
  onLocationChange,
  onLandmarkChange,
  onCoordinatesChange,
}) {
  const geo = useGeolocation()
  const { status, message, accuracyMeters, requestLocation, clear } = geo

  // Report captured coordinates to the parent form.
  useEffect(() => {
    if (geo.coordinates) {
      onCoordinatesChange({
        latitude: geo.coordinates.latitude,
        longitude: geo.coordinates.longitude,
        accuracyMeters: geo.accuracyMeters ?? null,
      })
    }
  }, [geo.coordinates, geo.accuracyMeters, onCoordinatesChange])

  const handleUseMyLocation = useCallback(async () => {
    await requestLocation()
  }, [requestLocation])

  const handleRemoveCoordinates = useCallback(() => {
    clear()
    onCoordinatesChange(null)
  }, [clear, onCoordinatesChange])

  const handleCopyCoordinatesToText = useCallback(() => {
    const formatted = formatCoordinates(geo.coordinates)
    if (!formatted) return
    const next = location.trim() ? `${location.trim()} (${formatted})` : formatted
    onLocationChange(next.slice(0, MAX_LOCATION_LENGTH))
  }, [geo.coordinates, location, onLocationChange])

  const showStatus = status !== GEOLOCATION_STATE.IDLE && status !== GEOLOCATION_STATE.REQUESTING

  return (
    <div className="space-y-5">
      <Field
        id="report-location"
        label="Where is the problem?"
        required
        error={errors.location}
        hint={`A street, landmark or area name is enough. At least ${MIN_LOCATION_LENGTH} characters, up to ${MAX_LOCATION_LENGTH}.`}
        labelAccessory={
          <Button
            variant="subtle"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={disabled || geo.isRequesting}
            aria-describedby="geolocation-explainer"
          >
            {geo.isRequesting ? <Navigation className="animate-pulse" /> : <Crosshair />}
            Use My Location
          </Button>
        }
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="location"
            value={location}
            disabled={disabled}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Street, landmark or area"
            autoComplete="street-address"
            aria-describedby={[describedBy, 'geolocation-explainer'].filter(Boolean).join(' ')}
            aria-invalid={invalid || undefined}
          />
        )}
      </Field>

      <p id="geolocation-explainer" className="text-xs leading-relaxed text-muted-foreground">
        &ldquo;Use My Location&rdquo; is optional and only runs when you press it — the page never asks for your
        location on its own. {GEOLOCATION_NOTE}
      </p>

      {showStatus ? (
        <Alert
          variant={status === GEOLOCATION_STATE.GRANTED ? 'success' : 'warning'}
          icon={status === GEOLOCATION_STATE.GRANTED ? Check : Info}
          role="status"
        >
          <p className="font-medium">
            {status === GEOLOCATION_STATE.GRANTED
              ? 'Device location captured for review'
              : 'Device location was not captured'}
          </p>
          {message ? <p>{message}</p> : null}
          {status !== GEOLOCATION_STATE.GRANTED ? (
            <p className="text-xs">Manual entry is always available — a typed address or landmark is usually clearer than coordinates.</p>
          ) : null}
        </Alert>
      ) : null}

      {coordinates ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin aria-hidden="true" className="size-4 text-primary" />
            Review the captured location
          </p>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Latitude</dt>
              <dd className="text-sm text-foreground" data-slot="metric">
                {coordinates.latitude?.toFixed(5) ?? '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Longitude</dt>
              <dd className="text-sm text-foreground" data-slot="metric">
                {coordinates.longitude?.toFixed(5) ?? '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reported accuracy</dt>
              <dd className="text-sm text-foreground" data-slot="metric">
                {typeof accuracyMeters === 'number' ? `±${accuracyMeters} m` : 'Not reported'}
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {describeCoordinates(coordinates, accuracyMeters)}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCoordinatesToText} disabled={disabled}>
              <MapPin />
              Add coordinates to the location text
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoordinates}
              disabled={disabled}
              className="text-destructive hover:bg-red-50"
            >
              <X />
              Remove coordinates
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            CivicFix cannot turn coordinates into a street address (that needs a geocoding service), so the typed
            location above is what a human will read. If the backend is extended to accept coordinates, they will be
            sent along as <span className="font-mono">latitude</span> and <span className="font-mono">longitude</span>.
          </p>
        </div>
      ) : null}

      <Field
        id="report-landmark"
        label="Landmark or nearest address"
        optional
        error={errors.landmark}
        hint={`Helps the inspection team find the exact spot, for example "opposite the bus depot gate". Up to ${MAX_LANDMARK_LENGTH} characters.`}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="landmark"
            value={landmark}
            disabled={disabled}
            maxLength={MAX_LANDMARK_LENGTH}
            onChange={(event) => onLandmarkChange(event.target.value)}
            placeholder="Nearest landmark"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </Field>
    </div>
  )
}
