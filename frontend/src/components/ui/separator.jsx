import { cn } from '@/lib/utils'

/**
 * @param {{ className?: string, orientation?: 'horizontal'|'vertical', decorative?: boolean }} props
 */
export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) {
  return (
    <div
      role={decorative ? 'presentation' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  )
}
