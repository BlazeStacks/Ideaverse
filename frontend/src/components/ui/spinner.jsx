import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * @param {{ className?: string, label?: string }} props
 */
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 aria-hidden="true" className={cn('size-4 animate-spin', className)} />
    </span>
  )
}
