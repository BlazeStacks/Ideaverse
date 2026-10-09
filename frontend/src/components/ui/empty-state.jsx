import { cn } from '@/lib/utils'

/**
 * Reusable empty, loading-failed or not-yet-available state.
 *
 * `titleAs="h1"` is used by full-page states that have no other heading.
 *
 * @param {{
 *   icon?: React.ComponentType<{ className?: string }>,
 *   title: string,
 *   titleAs?: 'p'|'h1'|'h2',
 *   description?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   tone?: 'neutral'|'info'|'warning',
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export function EmptyState({
  icon: Icon,
  title,
  titleAs: Title = 'p',
  description,
  actions,
  tone = 'neutral',
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center',
        tone === 'neutral' && 'border-border bg-muted/40',
        tone === 'info' && 'border-sky-200 bg-sky-50/50',
        tone === 'warning' && 'border-amber-300 bg-amber-50/50',
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            'flex size-11 items-center justify-center rounded-full border',
            tone === 'neutral' && 'border-border bg-card text-muted-foreground',
            tone === 'info' && 'border-sky-200 bg-card text-sky-700',
            tone === 'warning' && 'border-amber-200 bg-card text-amber-700',
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      ) : null}

      <div className="space-y-2">
        <Title className="text-base font-semibold text-foreground">{title}</Title>
        {description ? (
          <div className="mx-auto max-w-2xl space-y-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
      {children}
    </div>
  )
}
