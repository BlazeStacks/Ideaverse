import { ExternalLink as ExternalLinkIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Link to a third-party or government website.
 *
 * Always opens in a new tab with `rel="noopener noreferrer"`, always carries a
 * screen-reader warning that it leaves CivicFix, and always shows the
 * destination domain so the citizen can see where they are going before they
 * click. CivicFix never fetches these pages itself.
 *
 * @param {{
 *   href: string,
 *   children: React.ReactNode,
 *   className?: string,
 *   showHost?: boolean,
 *   onNavigate?: () => void,
 * }} props
 */
export function ExternalLink({ href, children, className, showHost = true, onNavigate }) {
  let host = null
  try {
    host = new URL(href).host
  } catch {
    host = null
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onNavigate?.()}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary-hover',
        className,
      )}
    >
      <span>{children}</span>
      <ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">(opens {host ? `${host} ` : ''}in a new tab)</span>
      {showHost && host ? (
        <span className="font-mono text-[11px] font-normal text-muted-foreground">{host}</span>
      ) : null}
    </a>
  )
}
