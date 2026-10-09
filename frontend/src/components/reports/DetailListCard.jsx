import { Dot } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Titled list of short findings (observations, actions, concerns, ...).
 *
 * When the backend returned nothing for this section the card states that
 * plainly instead of rendering empty space.
 *
 * @param {{
 *   title: string,
 *   description?: React.ReactNode,
 *   icon?: React.ComponentType<{ className?: string }>,
 *   items?: Array<string | React.ReactNode>,
 *   emptyMessage?: string,
 *   renderItem?: (item: any, index: number) => React.ReactNode,
 *   headingLevel?: 'h2'|'h3',
 *   className?: string,
 *   footer?: React.ReactNode,
 * }} props
 */
export function DetailListCard({
  title,
  description,
  icon: Icon,
  items = [],
  emptyMessage = 'The analysis response did not include this section.',
  renderItem,
  headingLevel = 'h3',
  className,
  footer,
}) {
  const hasItems = Array.isArray(items) && items.length > 0

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          ) : null}
          <CardTitle as={headingLevel}>{title}</CardTitle>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent>
        {hasItems ? (
          <ul className="space-y-2.5">
            {items.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed text-foreground">
                <Dot aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0">{renderItem ? renderItem(item, index) : item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>

      {footer ? <CardContent className="text-sm text-muted-foreground">{footer}</CardContent> : null}
    </Card>
  )
}
