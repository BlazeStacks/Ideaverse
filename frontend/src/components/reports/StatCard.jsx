import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Summary statistic.
 *
 * `value === null` is rendered as an em dash together with the `unavailableHint`
 * so a missing data source never looks like a real count of zero.
 *
 * @param {{
 *   label: string,
 *   value: number | string | null,
 *   caption?: React.ReactNode,
 *   unavailableHint?: string,
 *   icon?: React.ComponentType<{ className?: string }>,
 *   isLoading?: boolean,
 *   isDemo?: boolean,
 *   tone?: 'default'|'info'|'warning'|'success',
 * }} props
 */
export function StatCard({
  label,
  value,
  caption,
  unavailableHint = 'No data source connected',
  icon: Icon,
  isLoading = false,
  isDemo = false,
  tone = 'default',
}) {
  const isUnavailable = value === null || value === undefined

  return (
    <Card className="gap-3">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>

          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p
              className={cn(
                'text-2xl font-semibold leading-none',
                isUnavailable ? 'text-muted-foreground' : 'text-foreground',
              )}
              data-slot="metric"
            >
              {isUnavailable ? '—' : value}
            </p>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            {isLoading ? 'Loading…' : caption ?? (isUnavailable ? unavailableHint : null)}
          </p>

          {isDemo && !isLoading ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Demo data</p>
          ) : null}
        </div>

        {Icon ? (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg border',
              tone === 'default' && 'border-border bg-muted text-muted-foreground',
              tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-700',
              tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
              tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}
