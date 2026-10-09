import { useCallback, useMemo, useState } from 'react'

const INITIAL_FILTERS = {
  query: '',
  category: 'all',
  severity: 'all',
  status: 'all',
}

const ALL = 'all'

function readField(report, keys) {
  for (const key of keys) {
    const value = report?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

/**
 * Client-side search and filtering over whatever dataset is currently loaded.
 * Facet options are derived from the data so nothing is hard-coded to demo
 * values; when the backend supplies real reports the filters keep working.
 *
 * @param {Array<object>} reports
 */
export function useReportFilters(reports = []) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const setFilter = useCallback((key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(INITIAL_FILTERS), [])

  const facets = useMemo(
    () => ({
      categories: uniqueSorted(reports.map((report) => readField(report, ['category', 'issue_category']))),
      severities: uniqueSorted(reports.map((report) => readField(report, ['severity']))),
      statuses: uniqueSorted(reports.map((report) => readField(report, ['status']))),
    }),
    [reports],
  )

  const filteredReports = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return reports.filter((report) => {
      if (query) {
        const haystack = [
          report.id,
          report.report_id,
          report.issueType,
          report.issue_type,
          report.category,
          report.location,
          report.status,
        ]
          .filter((value) => typeof value === 'string' || typeof value === 'number')
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(query)) return false
      }

      if (filters.category !== ALL) {
        const category = readField(report, ['category', 'issue_category'])
        if ((category ?? '').toLowerCase() !== filters.category.toLowerCase()) return false
      }

      if (filters.severity !== ALL) {
        const severity = readField(report, ['severity']) ?? 'Uncertain'
        if (severity.toLowerCase() !== filters.severity.toLowerCase()) return false
      }

      if (filters.status !== ALL) {
        const status = readField(report, ['status'])
        if ((status ?? '').toLowerCase() !== filters.status.toLowerCase()) return false
      }

      return true
    })
  }, [reports, filters])

  const activeFilterCount = useMemo(
    () =>
      ['category', 'severity', 'status'].filter((key) => filters[key] !== ALL).length +
      (filters.query.trim() ? 1 : 0),
    [filters],
  )

  return {
    filters,
    setFilter,
    resetFilters,
    facets,
    filteredReports,
    activeFilterCount,
    isFiltered: activeFilterCount > 0,
    hasData: reports.length > 0,
    isFilteredEmpty: reports.length > 0 && filteredReports.length === 0,
  }
}
