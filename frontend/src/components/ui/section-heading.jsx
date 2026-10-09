import { cn } from '@/lib/utils'

/**
 * Shared section heading used by the landing page and the app pages.
 *
 * @param {{
 *   eyebrow?: string,
 *   title: React.ReactNode,
 *   description?: React.ReactNode,
 *   align?: 'left'|'center',
 *   tone?: 'light'|'dark',
 *   as?: React.ElementType,
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
  as: Heading = 'h2',
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.14em]',
            tone === 'light' ? 'text-primary' : 'text-emerald-300',
          )}
        >
          {eyebrow}
        </p>
      ) : null}

      <Heading
        className={cn(
          'text-2xl leading-tight sm:text-3xl',
          tone === 'light' ? 'text-foreground' : 'text-navy-foreground',
          align === 'center' && 'max-w-3xl',
        )}
      >
        {title}
      </Heading>

      {description ? (
        <div
          className={cn(
            'max-w-3xl space-y-3 text-base leading-relaxed',
            tone === 'light' ? 'text-muted-foreground' : 'text-navy-muted',
          )}
        >
          {description}
        </div>
      ) : null}

      {children}
    </div>
  )
}
