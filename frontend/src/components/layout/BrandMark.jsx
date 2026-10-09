import { MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Brand mark: a civic location pin on an amber tile.
 * Amber primary ties the logo to the construction/civic accent color.
 * @param {{ className?: string, size?: 'sm'|'lg' }} props
 */
export function BrandMark({ className, size = 'sm' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg',
        size === 'sm' ? 'size-9' : 'size-11',
        className,
      )}
      style={{ background: 'var(--color-primary)', color: '#fff' }}
    >
      <MapPin className={size === 'sm' ? 'size-5' : 'size-6'} strokeWidth={2.25} />
    </span>
  )
}
