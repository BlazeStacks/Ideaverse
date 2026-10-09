import { cn } from '@/lib/utils'

/**
 * Consistent page width and gutters. `size="wide"` is used for data-dense
 * views such as the dashboard table.
 *
 * @param {{ className?: string, size?: 'default'|'wide'|'narrow', children?: React.ReactNode, as?: React.ElementType }} props
 */
export function Container({ className, size = 'default', as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-6xl',
        size === 'wide' && 'max-w-7xl',
        className,
      )}
      {...props}
    />
  )
}
