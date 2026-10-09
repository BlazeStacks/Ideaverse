import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Presentation config per variant. Text colours are chosen for readable
 * contrast on the tinted background; the icon carries meaning as well, so the
 * variant is never communicated by colour alone.
 */
const ALERT_VARIANTS = {
  info: {
    Icon: Info,
    containerClassName: 'border-sky-200 bg-sky-50',
    iconClassName: 'text-sky-700',
    titleClassName: 'text-sky-950',
    bodyClassName: 'text-sky-900',
  },
  success: {
    Icon: CheckCircle2,
    containerClassName: 'border-emerald-200 bg-emerald-50',
    iconClassName: 'text-emerald-700',
    titleClassName: 'text-emerald-950',
    bodyClassName: 'text-emerald-900',
  },
  warning: {
    Icon: AlertTriangle,
    containerClassName: 'border-amber-300 bg-amber-50',
    iconClassName: 'text-amber-700',
    titleClassName: 'text-amber-950',
    bodyClassName: 'text-amber-900',
  },
  danger: {
    Icon: OctagonAlert,
    containerClassName: 'border-red-200 bg-red-50',
    iconClassName: 'text-red-700',
    titleClassName: 'text-red-950',
    bodyClassName: 'text-red-900',
  },
  neutral: {
    Icon: Info,
    containerClassName: 'border-border bg-muted',
    iconClassName: 'text-muted-foreground',
    titleClassName: 'text-foreground',
    bodyClassName: 'text-muted-foreground',
  },
}

/**
 * @param {{
 *   variant?: 'info'|'success'|'warning'|'danger'|'neutral',
 *   title?: React.ReactNode,
 *   icon?: React.ComponentType<{ className?: string }> | null,
 *   children?: React.ReactNode,
 *   className?: string,
 *   role?: string,
 *   actions?: React.ReactNode,
 * }} props
 */
export function Alert({ variant = 'info', title, icon, children, className, role = 'note', actions }) {
  const config = ALERT_VARIANTS[variant] ?? ALERT_VARIANTS.neutral
  const Icon = icon === undefined ? config.Icon : icon

  return (
    <div role={role} className={cn('flex gap-3 rounded-xl border p-4', config.containerClassName, className)}>
      {Icon ? <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', config.iconClassName)} /> : null}
      <div className="min-w-0 flex-1 space-y-1.5">
        {title ? <p className={cn('text-sm font-semibold', config.titleClassName)}>{title}</p> : null}
        {children ? (
          <div className={cn('space-y-2 text-sm leading-relaxed', config.bodyClassName)}>{children}</div>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div> : null}
      </div>
    </div>
  )
}
