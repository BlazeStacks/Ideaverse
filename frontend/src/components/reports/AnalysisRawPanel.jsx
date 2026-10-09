import { Check, Code2, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Collapsible developer view of the raw analysis payload.
 *
 * Useful while the backend contract is still moving: it shows exactly what the
 * API returned, which makes schema drift obvious.
 *
 * @param {{ payload: unknown, className?: string }} props
 */
export function AnalysisRawPanel({ payload, className }) {
  const [copied, setCopied] = useState(false)

  let serialized = ''
  try {
    serialized = JSON.stringify(payload, null, 2) ?? ''
  } catch {
    serialized = 'The response could not be serialised for display.'
  }

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) return
      await navigator.clipboard.writeText(serialized)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked; the panel stays usable without it.
    }
  }

  return (
    <details className={cn('group rounded-xl border border-border bg-card', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-foreground sm:p-5">
        <span className="flex items-center gap-2">
          <Code2 aria-hidden="true" className="size-4 text-muted-foreground" />
          Raw analysis response
        </span>
        <span className="text-xs font-normal text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Hide</span>
      </summary>

      <div className="space-y-3 border-t border-border p-4 sm:p-5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Exactly what the backend returned, unmodified. Use this when checking the response schema during backend
          integration.
        </p>
        <pre className="max-h-80 overflow-auto rounded-lg bg-navy p-4 text-xs leading-relaxed text-navy-foreground">
          <code>{serialized}</code>
        </pre>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy JSON'}
        </Button>
      </div>
    </details>
  )
}
