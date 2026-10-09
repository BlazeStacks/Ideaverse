import { RotateCcw, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { pluralize } from '@/lib/format'

/**
 * Search and facet filters for the report list.
 *
 * Facet options are derived from the loaded dataset, so the same component
 * works unchanged once real reports arrive from the backend.
 *
 * Rendered without its own surface so the caller decides how it is framed.
 *
 * @param {{
 *   filters: { query: string, category: string, severity: string, status: string },
 *   setFilter: (key: string, value: string) => void,
 *   resetFilters: () => void,
 *   facets: { categories: string[], severities: string[], statuses: string[] },
 *   resultCount: number,
 *   totalCount: number,
 *   isFiltered: boolean,
 *   disabled?: boolean,
 * }} props
 */
export function ReportFilters({
  filters,
  setFilter,
  resetFilters,
  facets,
  resultCount,
  totalCount,
  isFiltered,
  disabled = false,
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-search">Search</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="report-search"
                type="search"
                value={filters.query}
                disabled={disabled}
                onChange={(event) => setFilter('query', event.target.value)}
                placeholder="Reference, issue or location"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-category">Category</Label>
            <Select
              id="filter-category"
              value={filters.category}
              disabled={disabled}
              onChange={(event) => setFilter('category', event.target.value)}
            >
              <option value="all">All categories</option>
              {facets.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-severity">Severity</Label>
            <Select
              id="filter-severity"
              value={filters.severity}
              disabled={disabled}
              onChange={(event) => setFilter('severity', event.target.value)}
            >
              <option value="all">All severities</option>
              {facets.severities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              id="filter-status"
              value={filters.status}
              disabled={disabled}
              onChange={(event) => setFilter('status', event.target.value)}
            >
              <option value="all">All statuses</option>
              {facets.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground" role="status">
          {disabled
            ? 'No reports loaded'
            : `Showing ${pluralize(resultCount, 'report')} of ${pluralize(totalCount, 'report')}`}
        </p>
        <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!isFiltered || disabled}>
          <RotateCcw />
          Reset filters
        </Button>
      </div>
    </div>
  )
}
