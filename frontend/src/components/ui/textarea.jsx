import { cn } from '@/lib/utils'

/** @param {React.ComponentPropsWithoutRef<'textarea'>} props */
export function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm leading-relaxed text-foreground',
        'placeholder:text-muted-foreground/80 transition-colors',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25',
        className,
      )}
      {...props}
    />
  )
}
