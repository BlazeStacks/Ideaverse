import { getCategoryLabel, getFollowUpQuestions } from '@/config/issueCategories'
import { composeLocationText, isValidCoordinates } from '@/lib/location'
import { BACKEND_TEXT_LIMITS } from '@/lib/constants'

/**
 * Shape a report into the three text/file fields the backend reads.
 *
 * The backend accepts `file`, `location` and `additional_details` only, so the
 * rest of the form is carried honestly inside those fields as plain text:
 *
 *  - location text and landmark become one `location` string; captured
 *    coordinates are used there only when no address was typed;
 *  - the citizen's own notes come first in `additional_details`, followed by
 *    the category they chose (never "let the AI decide") and any answered
 *    follow-up questions, as short labelled lines;
 *  - whole lines are dropped, never cut mid-sentence, if the structured block
 *    would push the text past the backend's read limit.
 *
 * Coordinates and the chosen category are also returned separately for the
 * complaint draft and authority guidance, which run in the browser.
 *
 * @param {{
 *   file: File,
 *   location: string,
 *   landmark?: string,
 *   additionalDetails?: string,
 *   categoryId?: string|null,
 *   followUpAnswers?: Record<string, string>,
 *   coordinates?: { latitude: number, longitude: number }|null,
 *   categoryIsUserChosen?: boolean,
 * }} params
 */
export function buildReportSubmission({
  file,
  location,
  landmark = '',
  additionalDetails = '',
  categoryId = null,
  followUpAnswers = {},
  coordinates = null,
  categoryIsUserChosen = false,
}) {
  const questions = getFollowUpQuestions(categoryId)
  const answered = questions
    .map((question) => {
      const answer = followUpAnswers?.[question.id]
      return typeof answer === 'string' && answer.trim() ? `- ${question.label} ${answer.trim()}` : null
    })
    .filter(Boolean)

  const userDetails = typeof additionalDetails === 'string' ? additionalDetails.trim() : ''
  const validCoordinates = isValidCoordinates(coordinates) ? coordinates : null

  // Structured lines, most useful first.
  const structured = []
  if (categoryIsUserChosen && categoryId) {
    structured.push(`Category chosen by the citizen: ${getCategoryLabel(categoryId)}`)
  }
  if (answered.length) {
    structured.push('Additional details recorded from the reporting form:', ...answered)
  }

  // Keep whole lines within the backend's read limit; the citizen's own words
  // are never truncated here (the form already caps them below the limit).
  const limit = BACKEND_TEXT_LIMITS.additionalDetails
  const separator = userDetails ? 2 : 0 // "\n\n" between notes and the block
  let budget = limit - userDetails.length - separator
  const keptLines = []
  for (const line of structured) {
    const cost = line.length + (keptLines.length ? 1 : 0)
    if (cost > budget) break
    keptLines.push(line)
    budget -= cost
  }

  const sections = []
  if (userDetails) sections.push(userDetails)
  if (keptLines.length) sections.push(keptLines.join('\n'))

  const submittedLocation = composeLocationText({ location, landmark, coordinates: validCoordinates })

  return {
    file,
    // Backend field `location` (at most BACKEND_TEXT_LIMITS.location read).
    location: submittedLocation.slice(0, BACKEND_TEXT_LIMITS.location),
    // Backend field `additional_details`.
    additionalDetails: sections.join('\n\n'),
    // Browser-side only: used by the complaint draft and authority guidance.
    issueCategory: categoryIsUserChosen ? categoryId : null,
    coordinates: validCoordinates,
    userDetails: userDetails || null,
    followUpAnswers: Object.fromEntries(
      answered.length ? Object.entries(followUpAnswers).filter(([, value]) => value) : [],
    ),
    // True when the chosen category line made it into `additional_details`.
    categorySent: Boolean(categoryIsUserChosen && categoryId && keptLines[0]?.startsWith('Category chosen')),
  }
}
