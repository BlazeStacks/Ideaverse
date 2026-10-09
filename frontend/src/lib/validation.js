import {
  IMAGE_ACCEPTED_EXTENSIONS,
  IMAGE_ACCEPTED_MIME_TYPES,
  MAX_DETAILS_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  MAX_LANDMARK_LENGTH,
  MAX_LOCATION_LENGTH,
  MIN_LOCATION_LENGTH,
} from '@/lib/constants'
import { formatFileSize } from '@/lib/format'

/** Lower-case file extension for a file name, including the dot. */
export function getFileExtension(fileName) {
  if (typeof fileName !== 'string') return ''
  const index = fileName.lastIndexOf('.')
  if (index < 0) return ''
  return fileName.slice(index).toLowerCase()
}

export const IMAGE_ERROR_CODES = {
  MISSING: 'missing_file',
  EMPTY: 'empty_file',
  TYPE: 'unsupported_type',
  SIZE: 'file_too_large',
}

/**
 * Validate a selected image against the documented upload rules:
 * JPEG / PNG / WEBP up to 8 MB.
 *
 * The browser-reported MIME type is authoritative when present. Some browsers
 * omit it for less common formats, so the file extension is used as a
 * documented fallback instead of trusting either signal alone.
 *
 * @param {File | null | undefined} file
 * @returns {{ valid: boolean, code: string | null, error: string | null }}
 */
export function validateImageFile(file) {
  if (!file) {
    return {
      valid: false,
      code: IMAGE_ERROR_CODES.MISSING,
      error: 'Choose a photograph of the issue before running the analysis.',
    }
  }

  const mimeType = typeof file.type === 'string' ? file.type.toLowerCase() : ''
  const extension = getFileExtension(file.name)
  const typeLooksValid = mimeType
    ? IMAGE_ACCEPTED_MIME_TYPES.includes(mimeType)
    : IMAGE_ACCEPTED_EXTENSIONS.includes(extension)

  if (!typeLooksValid) {
    return {
      valid: false,
      code: IMAGE_ERROR_CODES.TYPE,
      error: `Unsupported file type${
        mimeType ? ` (${mimeType})` : ''
      }. Upload a JPEG, PNG or WEBP image.`,
    }
  }

  if (typeof file.size !== 'number' || file.size === 0) {
    return {
      valid: false,
      code: IMAGE_ERROR_CODES.EMPTY,
      error: 'That file appears to be empty. Choose a different image.',
    }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      code: IMAGE_ERROR_CODES.SIZE,
      error: `That image is ${formatFileSize(file.size)}. The maximum allowed size is ${formatFileSize(
        MAX_IMAGE_SIZE_BYTES,
      )}.`,
    }
  }

  return { valid: true, code: null, error: null }
}

/**
 * Validate the whole report form.
 *
 * Everything except the photograph and a location is optional: a citizen must
 * never be blocked from reporting because a follow-up question went unanswered.
 *
 * @param {{
 *   file?: File|null,
 *   location?: string,
 *   landmark?: string,
 *   additionalDetails?: string,
 * }} values
 * @returns {{ valid: boolean, errors: Record<string, string>, firstError: string|null }}
 */
export function validateReportForm({ file, location, landmark = '', additionalDetails = '' } = {}) {
  /** @type {Record<string, string>} */
  const errors = {}

  const fileResult = validateImageFile(file)
  if (!fileResult.valid) errors.file = fileResult.error

  const trimmedLocation = typeof location === 'string' ? location.trim() : ''
  if (!trimmedLocation) {
    errors.location = 'Enter the location of the issue, for example a street or area name.'
  } else if (trimmedLocation.length < MIN_LOCATION_LENGTH) {
    errors.location = `Use at least ${MIN_LOCATION_LENGTH} characters so the location is identifiable.`
  } else if (trimmedLocation.length > MAX_LOCATION_LENGTH) {
    errors.location = `Keep the location under ${MAX_LOCATION_LENGTH} characters.`
  }

  if (typeof additionalDetails === 'string' && additionalDetails.length > MAX_DETAILS_LENGTH) {
    errors.additionalDetails = `Additional details must be ${MAX_DETAILS_LENGTH} characters or fewer.`
  }

  if (typeof landmark === 'string' && landmark.length > MAX_LANDMARK_LENGTH) {
    errors.landmark = `The landmark must be ${MAX_LANDMARK_LENGTH} characters or fewer.`
  }

  const orderedKeys = ['file', 'location', 'landmark', 'additionalDetails']
  const firstErrorKey = orderedKeys.find((key) => errors[key])

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstError: firstErrorKey ? errors[firstErrorKey] : null,
  }
}
