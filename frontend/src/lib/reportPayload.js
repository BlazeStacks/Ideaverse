import { getFollowUpQuestions } from '@/config/issueCategories'
import { composeLocationText, isValidCoordinates } from '@/lib/location'

/**
 * Shape a report into the request the backend expects.
 *
 * The documented contract has three fields — `file`, `location`,
 * `additional_details` — and this module keeps them working while folding the
 * new UI into them:
 *
 *  - the location text and the landmark become one `location` string;
 *  - the optional per-category answers are appended to `additional_details` as a
 *    short structured block, because there is no field for them;
 *  - the chosen category and captured coordinates are passed through separately
 *    as the opt-in proposed fields (see `PROPOSED_ANALYZE_FIELDS`).
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
  const sections = []
  if (userDetails) sections.push(userDetails)
  if (answered.length) {
    sections.push(['Additional details recorded from the reporting form:', ...answered].join('\n'))
  }

  return {
    file,
    // Documented field: location + landmark combined into one readable string.
    location: composeLocationText({ location, landmark }),
    // Documented field: the citizen's own notes first, then the extra answers.
    additionalDetails: sections.join('\n\n'),
    // Proposed fields — sent only when they carry a real value.
    issueCategory: categoryIsUserChosen ? categoryId : null,
    coordinates: isValidCoordinates(coordinates) ? coordinates : null,
    // Kept for the complaint draft, which lists the two parts separately.
    userDetails: userDetails || null,
    followUpAnswers: Object.fromEntries(answered.length ? Object.entries(followUpAnswers).filter(([, value]) => value) : []),
  }
}
