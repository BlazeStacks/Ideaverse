import { MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Brand mark: a pinned civic location inside a teal tile.
 * @param {{ className?: string, size?: 'sm'|'lg' }} props
 */
export function BrandMark({ className, size = 'sm' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground',
        size === 'sm' ? 'size-9' : 'size-11',
        className,
      )}
    >
      <MapPin className={size === 'sm' ? 'size-5' : 'size-6'} strokeWidth={2.25} />
    </span>
  )
}
