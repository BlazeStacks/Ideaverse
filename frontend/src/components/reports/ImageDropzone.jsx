import { FileWarning, ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { IMAGE_ACCEPT_ATTRIBUTE, MAX_IMAGE_SIZE_BYTES } from '@/lib/constants'
import { formatFileSize } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Image selection with drag-and-drop, click-to-browse, preview, replacement and
 * removal. Validation belongs to the parent form so messages stay in one place.
 *
 * @param {{
 *   file: File | null,
 *   previewUrl: string | null,
 *   error?: string | null,
 *   disabled?: boolean,
 *   onSelectFile: (file: File) => void,
 *   onClear: () => void,
 *   describedBy?: string,
 * }} props
 */
export function ImageDropzone({ file, previewUrl, error, disabled = false, onSelectFile, onClear, describedBy }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)
  const generatedId = useId()
  const inputId = `issue-image-${generatedId}`
  const helpId = `${inputId}-help`

  const openPicker = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleFiles = (fileList) => {
    const [selected] = Array.from(fileList ?? [])
    if (selected) onSelectFile(selected)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    handleFiles(event.dataTransfer?.files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleInputChange = (event) => {
    handleFiles(event.target.files)
    // Allow re-selecting the same file after a failed validation.
    event.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
        aria-describedby={[describedBy, helpId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
      />

      {file ? (
        <div
          className={cn(
            'overflow-hidden rounded-xl border bg-card',
            error ? 'border-destructive' : isDragging ? 'border-primary' : 'border-border',
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {previewUrl ? (
            <div className="flex items-center justify-center bg-muted/60 p-3">
              <img
                src={previewUrl}
                alt={`Preview of the selected photograph${file.name ? `: ${file.name}` : ''}`}
                className="max-h-72 w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-red-50/50 p-4">
              <FileWarning aria-hidden="true" className="size-5 shrink-0 text-destructive" />
              <p className="text-sm text-foreground">
                This file cannot be previewed because it is not an image the browser can render. Replace it with a
                JPEG, PNG or WEBP photograph.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground" title={file.name}>
                {file.name || 'Selected image'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} · {file.type || 'type reported by the browser is empty'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openPicker} disabled={disabled}>
                <RefreshCw />
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={disabled}
                className="text-destructive hover:bg-red-50"
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={disabled}
          className={cn(
            'flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isDragging
              ? 'border-primary bg-secondary/60'
              : error
                ? 'border-destructive bg-red-50/40'
                : 'border-input bg-muted/40 hover:border-primary/60 hover:bg-muted/70',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <span
            className={cn(
              'flex size-12 items-center justify-center rounded-full border bg-card',
              isDragging ? 'border-primary text-primary' : 'border-border text-muted-foreground',
            )}
          >
            {isDragging ? (
              <UploadCloud aria-hidden="true" className="size-5" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-5" />
            )}
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              {isDragging ? 'Drop the photograph to attach it' : 'Drag and drop a photograph here'}
            </span>
            <span className="block text-xs text-muted-foreground">
              or <span className="font-medium text-primary underline underline-offset-2">choose an image</span> from
              this device
            </span>
          </span>
        </button>
      )}

      <p id={helpId} className="text-xs leading-relaxed text-muted-foreground">
        JPEG, PNG or WEBP · up to {formatFileSize(MAX_IMAGE_SIZE_BYTES)} per image. The photograph is sent to the
        backend only when you press &ldquo;Analyse issue&rdquo;, and is never stored in your browser.
      </p>
    </div>
  )
}
