import { useCallback, useRef, useState } from 'react'

import { GEOLOCATION_NOTE } from '@/lib/constants'

/**
 * Opt-in browser geolocation.
 *
 * Guarantees this hook enforces:
 *  - permission is requested only when `requestLocation()` is called, i.e. only
 *    after the citizen presses "Use My Location";
 *  - a denial, a timeout or an unavailable service is reported as a normal,
 *    non-blocking outcome — manual location entry always keeps working;
 *  - no coordinates are ever sent anywhere by this hook; it only returns them
 *    to the caller, which shows them for review.
 */

export const GEOLOCATION_STATE = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  TIMEOUT: 'timeout',
  ERROR: 'error',
}

function messageForError(error) {
  if (!error) return 'Your current location could not be determined.'

  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return 'Location permission was denied or blocked. You can still type the location yourself — nothing is blocked.'
    case 2: // POSITION_UNAVAILABLE
      return 'Your device could not determine a location right now. Enter the location manually instead.'
    case 3: // TIMEOUT
      return 'Getting your location took too long. Try again, or enter the location manually.'
    default:
      return 'Your current location could not be determined. Enter the location manually instead.'
  }
}

function describeAccuracy(accuracy) {
  if (typeof accuracy !== 'number' || !Number.isFinite(accuracy)) return null
  const rounded = accuracy < 100 ? Math.round(accuracy) : Math.round(accuracy / 10) * 10
  if (rounded <= 30) return 'The device reports a fairly tight fix, but treat it as approximate.'
  if (rounded <= 200) return `The device reports roughly ±${rounded} m of accuracy — approximate.`
  return `The device reports only ±${rounded} m of accuracy, so this may be off by a street or more.`
}

export function useGeolocation() {
  const [state, setState] = useState({
    status: GEOLOCATION_STATE.IDLE,
    coordinates: null,
    accuracyMeters: null,
    message: null,
    timestamp: null,
  })
  const requestIdRef = useRef(0)

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const clear = useCallback(() => {
    requestIdRef.current += 1
    setState({
      status: GEOLOCATION_STATE.IDLE,
      coordinates: null,
      accuracyMeters: null,
      message: null,
      timestamp: null,
    })
  }, [])

  /** Request a single position. Must be called from a user gesture. */
  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setState({
        status: GEOLOCATION_STATE.UNAVAILABLE,
        coordinates: null,
        accuracyMeters: null,
        message:
          'This browser does not provide location services. Type the location and a landmark instead — nothing is blocked.',
        timestamp: null,
      })
      return Promise.resolve(null)
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState((previous) => ({ ...previous, status: GEOLOCATION_STATE.REQUESTING, message: null }))

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (requestIdRef.current !== requestId) return resolve(null)
          const { latitude, longitude, accuracy } = position.coords
          const accuracyNote = describeAccuracy(accuracy)
          setState({
            status: GEOLOCATION_STATE.GRANTED,
            coordinates: { latitude, longitude },
            accuracyMeters: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
            message: [GEOLOCATION_NOTE, accuracyNote].filter(Boolean).join(' '),
            timestamp: new Date().toISOString(),
          })
          resolve({ latitude, longitude })
        },
        (error) => {
          if (requestIdRef.current !== requestId) return resolve(null)
          const denied = error?.code === 1
          setState({
            status: denied ? GEOLOCATION_STATE.DENIED : GEOLOCATION_STATE.ERROR,
            coordinates: null,
            accuracyMeters: null,
            message: messageForError(error),
            timestamp: null,
          })
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
      )
    })
  }, [isSupported])

  return {
    ...state,
    isSupported,
    isRequesting: state.status === GEOLOCATION_STATE.REQUESTING,
    requestLocation,
    clear,
  }
}
