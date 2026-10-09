import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset px-2.5 py-0.5 text-xs font-medium leading-5',
  {
    variants: {
      variant: {
        // Amber primary badge
        default:
          'bg-secondary text-secondary-foreground ring-secondary-hover',
        neutral:
          'bg-muted text-foreground ring-border',
        outline:
          'bg-card text-muted-foreground ring-border',
        muted:
          'bg-muted text-muted-foreground ring-border',
        success:
          'bg-emerald-50 text-emerald-900 ring-emerald-200',
        warning:
          'bg-amber-50 text-amber-900 ring-amber-200',
        danger:
          'bg-red-50 text-red-900 ring-red-200',
        info:
          'bg-sky-50 text-sky-900 ring-sky-200',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0 text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * @param {React.ComponentPropsWithoutRef<'span'> & {
 *   variant?: 'default'|'neutral'|'outline'|'muted'|'success'|'warning'|'danger'|'info',
 *   size?: 'default'|'sm'
 * }} props
 */
export function Badge({ className, variant, size, ...props }) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { badgeVariants }
