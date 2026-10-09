import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and resolve conflicting Tailwind utilities.
 * @param {...unknown} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Small helper for stable React list keys without depending on array index.
 * @param {string} prefix
 * @param {number} index
 * @param {string} [value]
 */
export function listKey(prefix, index, value) {
  const slug = typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, '-') : ''
  return [prefix, index, slug].filter(Boolean).join('-')
}
