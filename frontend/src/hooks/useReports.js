import { useCallback, useState } from 'react'

import { REPORTS_DATA_SOURCE, fetchReports, getDemoReports } from '@/services/reportsService'

/**
 * Dashboard data access.
 *
 * Nothing is loaded automatically: the dashboard starts in an honest empty
 * state and the user explicitly either connects to the reports API or loads
 * labelled demo data. This keeps a missing backend from looking like an error
 * while never pretending that sample records are real incidents.
 */
export function useReports() {
  const [state, setState] = useState({
    source: REPORTS_DATA_SOURCE.NONE,
    reports: [],
    isLoading: false,
    error: null,
    lastLoadedAt: null,
  })

  /** Attempt a real request against the reports endpoint. */
  const connect = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }))
    try {
      const { reports, source } = await fetchReports()
      setState({
        source,
        reports,
        isLoading: false,
        error: null,
        lastLoadedAt: new Date().toISOString(),
      })
      return true
    } catch (error) {
      setState((previous) => ({
        source: REPORTS_DATA_SOURCE.NONE,
        reports: [],
        isLoading: false,
        error: {
          message: error?.message || 'The reports request failed.',
          code: error?.code ?? 'unknown_error',
          status: error?.status ?? null,
        },
        lastLoadedAt: previous.lastLoadedAt,
      }))
      return false
    }
  }, [])

  /** Load the clearly labelled demo dataset for interface preview only. */
  const loadDemo = useCallback(() => {
    setState({
      source: REPORTS_DATA_SOURCE.DEMO,
      reports: getDemoReports(),
      isLoading: false,
      error: null,
      lastLoadedAt: new Date().toISOString(),
    })
  }, [])

  const clear = useCallback(() => {
    setState({
      source: REPORTS_DATA_SOURCE.NONE,
      reports: [],
      isLoading: false,
      error: null,
      lastLoadedAt: null,
    })
  }, [])

  return {
    ...state,
    isDemo: state.source === REPORTS_DATA_SOURCE.DEMO,
    isConnected: state.source === REPORTS_DATA_SOURCE.API,
    connect,
    loadDemo,
    clear,
  }
}
