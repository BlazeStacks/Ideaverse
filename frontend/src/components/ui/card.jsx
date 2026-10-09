import { cn } from '@/lib/utils'

/** Bordered surface. Spacing lives on the container so sub-sections can be omitted. */
export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function CardTitle({ className, as: Component = 'h3', ...props }) {
  return <Component className={cn('text-base font-semibold leading-6', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('min-w-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)} {...props} />
}
