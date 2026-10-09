import { MinusCircle } from 'lucide-react'

import { formatConfidence } from '@/lib/format'
import { getConfidenceBand } from '@/lib/severity'
import { cn } from '@/lib/utils'

function toNormalized(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const normalized = value > 1 && value <= 100 ? value / 100 : value
  if (normalized < 0 || normalized > 1) return null
  return normalized
}

/**
 * Confidence indicator.
 *
 * The percentage, a qualitative band and a tonal bar are all shown, so the
 * value is never conveyed by the bar alone. When the backend omits confidence
 * the component says so instead of showing 0%.
 *
 * @param {{ value: unknown, className?: string, showBand?: boolean }} props
 */
export function ConfidenceMeter({ value, className, showBand = true }) {
  const normalized = toNormalized(value)
  const display = formatConfidence(value)

  if (normalized === null || !display) {
    return (
      <div className={cn('space-y-2', className)}>
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MinusCircle aria-hidden="true" className="size-4" />
          Confidence not reported
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-0" />
        </div>
      </div>
    )
  }

  const percentage = Math.round(normalized * 100)
  const band = getConfidenceBand(normalized)
  const barClassName =
    normalized >= 0.85
      ? 'bg-emerald-600'
      : normalized >= 0.6
        ? 'bg-amber-600'
        : normalized >= 0.4
          ? 'bg-orange-600'
          : 'bg-slate-500'

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground" data-slot="metric">
          {display}
        </span>
        {showBand && band ? <span className="text-xs text-muted-foreground">{band}</span> : null}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label="Analysis confidence"
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', barClassName)}
          style={{ width: `${Math.max(percentage, 3)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        How confident the analysis is about the identified issue, based on the uploaded photograph.
      </p>
    </div>
  )
}
