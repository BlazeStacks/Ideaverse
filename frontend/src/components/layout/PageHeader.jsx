import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'

/**
 * Page-level header band. Renders its own Container, so page bodies only need
 * to wrap their main content.
 *
 * @param {{
 *   eyebrow?: React.ReactNode,
 *   title: React.ReactNode,
 *   description?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   children?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export function PageHeader({ eyebrow, title, description, actions, children, className }) {
  return (
    <div className={cn('border-b border-border bg-card', className)}>
      <Container className="flex flex-col gap-6 py-8 sm:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            {eyebrow ? (
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--color-primary)' }}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="text-2xl leading-tight text-foreground sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h1>
            {description ? (
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </div>
            ) : null}
          </div>

          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        {children}
      </Container>
    </div>
  )
}

