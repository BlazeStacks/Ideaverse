import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        outline: 'border border-input bg-card text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        subtle: 'text-secondary-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover',
        link: 'text-primary underline-offset-4 hover:underline',
        onDark: 'bg-white text-navy hover:bg-navy-foreground',
        onDarkOutline: 'border border-navy-border text-navy-foreground hover:bg-navy-soft',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        default: 'h-10 px-4 [&_svg]:size-4',
        lg: 'h-11 px-6 text-base [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * @param {React.ComponentPropsWithoutRef<'button'> & {
 *   variant?: 'default'|'secondary'|'outline'|'ghost'|'subtle'|'destructive'|'link'|'onDark'|'onDarkOutline',
 *   size?: 'sm'|'default'|'lg'|'icon',
 *   asChild?: boolean
 * }} props
 */
export function Button({ className, variant, size, asChild = false, type, ...props }) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  )
}

export { buttonVariants }
