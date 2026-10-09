import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Styled native select.
 *
 * A native control is used on purpose: it keeps keyboard behaviour, mobile
 * pickers and screen-reader support intact without extra JavaScript.
 *
 * @param {React.ComponentPropsWithoutRef<'select'>} props
 */
export function Select({ className, children, ...props }) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-9 text-sm text-foreground',
          'transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
          'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
          'aria-invalid:border-destructive',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
