import { cn } from '@/lib/utils'
import { resolveSeverity } from '@/lib/severity'

/**
 * Severity indicator.
 *
 * Never colour-only: the badge always renders the severity text and a distinct
 * icon, and exposes a descriptive label for assistive technology.
 *
 * @param {{ value: unknown, className?: string, size?: 'default'|'sm' }} props
 */
export function SeverityBadge({ value, className, size = 'default' }) {
  const severity = resolveSeverity(value)
  const { Icon, label } = severity

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        severity.badgeClassName,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        className,
      )}
    >
      <Icon aria-hidden="true" className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      <span>{label}</span>
      <span className="sr-only"> severity</span>
    </span>
  )
}

/**
 * Horizontal severity scale showing where this value sits.
 *
 * The filled segments share the severity tone and the remaining steps stay
 * neutral, so the scale reads as one graded value instead of a mosaic of
 * colours. The accompanying text carries the meaning on its own.
 */
export function SeverityScale({ value, className }) {
  const severity = resolveSeverity(value)
  const steps = ['Low', 'Medium', 'High', 'Critical']
  const activeIndex = steps.indexOf(severity.key)
  const isGraded = activeIndex !== -1

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label={`Severity scale from Low to Critical, current value: ${severity.label}`}
      >
        {steps.map((step, index) => (
          <span
            key={step}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              isGraded && index <= activeIndex ? severity.indicatorClassName : 'bg-muted-foreground/20',
            )}
          />
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {severity.summary ?? severity.label}
        {isGraded ? ` (${steps.length}-point scale)` : ''}
      </p>
    </div>
  )
}
