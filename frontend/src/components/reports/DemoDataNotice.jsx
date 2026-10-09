import { FlaskConical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Mandatory label shown wherever the sample dataset is displayed.
 * The dashboard must never render demo records without this notice.
 *
 * @param {{ className?: string, onClear?: () => void, description?: React.ReactNode }} props
 */
export function DemoDataNotice({
  className,
  onClear,
  description = 'Every row below is fictional sample content used to preview the dashboard layout. These are not incidents, not municipal records and not produced by the AI backend.',
}) {
  return (
    <div
      role="note"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex gap-3">
        <FlaskConical aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-950">DEMO DATA — interface preview only</p>
          <p className="text-sm leading-relaxed text-amber-900">{description}</p>
        </div>
      </div>
      {onClear ? (
        <Button variant="outline" size="sm" className="shrink-0 border-amber-300 bg-card" onClick={onClear}>
          Clear demo data
        </Button>
      ) : null}
    </div>
  )
}
