import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Confirmation without a browser dialog.
 *
 * The first press swaps the button for an inline "confirm / cancel" pair, so an
 * irreversible action (clearing a form, discarding a complaint draft) needs a
 * deliberate second press and never a native `window.confirm`.
 *
 * @param {{
 *   label: React.ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   question?: string,
 *   icon?: React.ComponentType<{ className?: string }>,
 *   onConfirm: () => void,
 *   variant?: 'default'|'secondary'|'outline'|'ghost'|'subtle'|'destructive'|'link'|'onDark'|'onDarkOutline',
 *   size?: 'sm'|'default'|'lg'|'icon',
 *   disabled?: boolean,
 *   className?: string,
 *   confirmClassName?: string,
 * }} props
 */
export function ConfirmButton({
  label,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  question,
  icon: Icon,
  onConfirm,
  variant = 'outline',
  size = 'default',
  disabled = false,
  className,
  confirmClassName,
}) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isConfirming) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        className={className}
        onClick={() => setIsConfirming(true)}
      >
        {Icon ? <Icon /> : null}
        {label}
      </Button>
    )
  }

  return (
    <span
      role="group"
      aria-label={typeof question === 'string' ? question : 'Confirm action'}
      className={cn(
        'inline-flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-red-50 px-2.5 py-1.5',
        className,
      )}
    >
      {question ? <span className="text-xs font-medium text-red-900">{question}</span> : null}
      <Button
        variant="destructive"
        size="sm"
        className={confirmClassName}
        onClick={() => {
          setIsConfirming(false)
          onConfirm()
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsConfirming(false)}>
        {cancelLabel}
      </Button>
    </span>
  )
}
