import { cn } from '@/lib/utils'

import { Label } from './label'

/**
 * Accessible form field wrapper: wires the label, hint and error message to the
 * control through ids and `aria-describedby`, and marks the control invalid.
 *
 * @param {{
 *   id: string,
 *   label: React.ReactNode,
 *   hint?: React.ReactNode,
 *   error?: string | null,
 *   required?: boolean,
 *   optional?: boolean,
 *   className?: string,
 *   labelAccessory?: React.ReactNode,
 *   children: (props: { id: string, describedBy?: string, invalid: boolean }) => React.ReactNode,
 * }} props
 */
export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  optional = false,
  className,
  labelAccessory,
  children,
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-1.5">
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
          {optional ? (
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          ) : null}
        </Label>
        {labelAccessory}
      </div>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-xs font-medium leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
