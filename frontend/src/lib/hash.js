/**
 * SHA-256 of an uploaded file, used only for duplicate detection.
 *
 * The hash lets the backend notice that the *same photograph* is being saved
 * again at the same place, which is what an accidental double submission looks
 * like. The file itself never leaves the analysis request: the hash is computed
 * in the browser, and only the hex digest is stored with the report.
 *
 * Returns `null` — never a fake value — when hashing is unavailable (an older
 * browser, or a page served over plain HTTP where `crypto.subtle` is disabled).
 * In that case the backend falls back to the idempotency key alone, so a
 * repeated save still cannot duplicate a report.
 *
 * @param {File|Blob|null} file
 * @returns {Promise<string|null>}
 */
export async function hashFileSha256(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return null
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : null
  if (!subtle?.digest) return null

  try {
    const bytes = await file.arrayBuffer()
    const digest = await subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    // A failure here must never block saving; it only disables the extra check.
    return null
  }
}
