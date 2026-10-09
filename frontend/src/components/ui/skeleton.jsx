import { cn } from '@/lib/utils'

/** @param {React.ComponentPropsWithoutRef<'div'>} props */
export function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}
