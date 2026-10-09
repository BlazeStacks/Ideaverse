import { CircleHelp, Info } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCostRange, formatDurationRange, toFiniteNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Preliminary cost or duration estimate.
 *
 * Rules this component enforces:
 *  - null/missing bounds are explained, never rendered as 0;
 *  - a value reported as exactly zero by the backend is shown but flagged,
 *    because a zero cost is almost always a missing value in disguise;
 *  - the backend's `basis` text is shown verbatim so the user can judge it.
 *
 * @param {{
 *   title: string,
 *   icon?: React.ComponentType<{ className?: string }>,
 *   estimate?: { minimum: number|null, maximum: number|null, basis: string|null, hasBounds: boolean },
 *   kind: 'cost' | 'duration',
 *   unavailableMessage?: string,
 *   className?: string,
 * }} props
 */
export function EstimateCard({
  title,
  icon: Icon = Info,
  estimate,
  kind,
  unavailableMessage = 'The analysis service did not return enough information for a reliable estimate.',
  className,
}) {
  const formatted = kind === 'cost' ? formatCostRange(estimate) : formatDurationRange(estimate)
  const minimum = toFiniteNumber(estimate?.minimum)
  const maximum = toFiniteNumber(estimate?.maximum)
  const isZero = minimum === 0 && maximum === 0

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>
          Indicative only. Final figures depend on a physical site inspection and local rates.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {formatted ? (
          <p className="text-2xl font-semibold leading-none text-foreground" data-slot="metric">
            {formatted.display}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CircleHelp aria-hidden="true" className="size-4" />
            Not available
          </p>
        )}

        {!formatted ? <p className="text-sm leading-relaxed text-muted-foreground">{unavailableMessage}</p> : null}

        {formatted && formatted.partial ? (
          <p className="text-xs leading-relaxed text-amber-800">
            Only one bound of this range was provided, so the other side is unknown.
          </p>
        ) : null}

        {isZero ? (
          <p className="text-xs leading-relaxed text-amber-800">
            The service reported a value of zero. Zero usually means the figure is unknown rather than free of cost —
            treat it as unavailable.
          </p>
        ) : null}

        {estimate?.basis ? (
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basis</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{estimate.basis}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
