import { CircleCheckBig, CircleDashed } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BACKEND_DEPENDENCIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Explicit boundary between what this frontend implements and what still
 * depends on the separately developed backend.
 *
 * @param {{
 *   title?: string,
 *   description?: React.ReactNode,
 *   capabilities?: typeof BACKEND_DEPENDENCIES,
 *   headingLevel?: 'h2'|'h3',
 *   className?: string,
 * }} props
 */
export function BackendDependencyPanel({
  title = 'What runs today, and what still needs the backend',
  description = 'This interface is built independently of the backend. Everything below is accurate about the current state of the build.',
  capabilities = BACKEND_DEPENDENCIES,
  headingLevel = 'h3',
  className,
}) {
  const ready = capabilities.filter((capability) => capability.implemented)
  const pending = capabilities.filter((capability) => !capability.implemented)

  const renderGroup = (label, items, isReady) => (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isReady ? (
          <CircleCheckBig aria-hidden="true" className="size-3.5 text-emerald-600" />
        ) : (
          <CircleDashed aria-hidden="true" className="size-3.5 text-amber-600" />
        )}
        {label}
      </p>
      <ul className="space-y-2.5">
        {items.map((capability) => (
          <li key={capability.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', isReady ? 'bg-emerald-600' : 'bg-amber-500')}
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">{capability.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{capability.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as={headingLevel}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {renderGroup('Available now', ready, true)}
        {renderGroup('Awaiting backend support', pending, false)}
      </CardContent>
    </Card>
  )
}
