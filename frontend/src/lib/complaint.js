import { getCategoryLabel, getComplaintMeta, getFollowUpQuestions } from '@/config/issueCategories'
import { formatDate, toDate } from '@/lib/format'

/**
 * Deterministic complaint drafting.
 *
 * No language model is involved and no API key is exposed: the draft is
 * assembled from the analysis response, the citizen's own input and a fixed
 * template. The rules that keep it honest:
 *
 *  - The reporter describes what a photograph *appears* to show. Findings are
 *    never upgraded to established facts, even at high model confidence.
 *  - Anything missing is either omitted or explicitly marked as not provided.
 *  - Measurements, costs, durations and engineering conclusions are never
 *    stated as facts, because none of them have been verified on site.
 *  - The draft always discloses that it was prepared with AI assistance and has
 *    not been submitted anywhere.
 *
 * The draft is stored as three independent, editable fields — subject,
 * addressee and body — so that choosing a different authority (or correcting
 * the category) never has to overwrite text the citizen has written.
 */

export const COMPLAINT_DISCLAIMER =
  'AI-assisted draft. Review every line before you use it, and correct anything that is wrong or missing.'

export const DEFAULT_ADDRESSEE = 'The Officer in Charge, Concerned Department'

const NOT_PROVIDED = 'Not provided'

function asText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asList(values) {
  return Array.isArray(values) ? values.filter((value) => typeof value === 'string' && value.trim()) : []
}

function bulletLines(items, emptyLine) {
  if (!items.length) return [emptyLine]
  return items.map((item) => `- ${item}`)
}

/**
 * Build the complaint draft for an analysis session.
 *
 * @param {{
 *   analysis: object,
 *   request?: { location?: string|null, additionalDetails?: string|null, imageName?: string|null } | null,
 *   categoryId?: string|null,
 *   sessionId?: string|null,
 *   cityLabel?: string|null,
 *   authorityName?: string|null,
 *   followUpAnswers?: Record<string, string>,
 *   generatedAt?: string,
 * }} params
 */
export function buildComplaintDraft({
  analysis,
  request = null,
  categoryId = null,
  sessionId = null,
  cityLabel = null,
  authorityName = null,
  followUpAnswers = {},
  generatedAt = new Date().toISOString(),
}) {
  const meta = getComplaintMeta(categoryId)
  const categoryLabel = categoryId ? getCategoryLabel(categoryId) : null
  const location = asText(analysis?.location) ?? asText(request?.location)
  const reportDate = formatDate(generatedAt)
  const description = asText(analysis?.description)
  const observations = asList(analysis?.observations)
  const safetyConcerns = asList(analysis?.safetyConcerns)
  const missingInformation = asList(analysis?.missingInformation)
  const additionalDetails = asText(request?.additionalDetails)
  const imageName = asText(request?.imageName)

  /** @type {string[]} */
  const warnings = []

  if (analysis?.isCivicIssue === false) {
    warnings.push(
      'The AI assessment did not recognise this image as a supported civic issue. Check that you are describing a public infrastructure problem before sending this complaint.',
    )
  }
  if (analysis?.isCivicIssue === null || analysis?.isCivicIssue === undefined) {
    warnings.push(
      'The assessment does not state whether this image was recognised as a supported civic issue.',
    )
  }
  if (!location) {
    warnings.push('No location was provided, so the complaint does not identify where the problem is.')
  }
  if (analysis?.needsSiteInspection === true) {
    warnings.push(
      'The assessment indicates that a site inspection is required. Keep the complaint factual and let the authority verify the extent of the damage.',
    )
  }
  if (typeof analysis?.confidence === 'number' && analysis.confidence < 0.6) {
    warnings.push(
      'The assessment confidence is low, so the description is written as an observation rather than a finding. Add your own detail if you can.',
    )
  }

  const addressee = authorityName
    ? `The Officer in Charge, ${authorityName}${cityLabel ? `, ${cityLabel}` : ''}`
    : DEFAULT_ADDRESSEE

  const lines = []
  lines.push('Respected Sir/Madam,')
  lines.push('')
  lines.push(
    `I wish to report a problem with public infrastructure. The photograph taken at the location mentioned below appears to show ${meta.phrase}.`,
  )
  lines.push('')
  lines.push('REPORTED ISSUE')
  lines.push(`Location: ${location ?? NOT_PROVIDED}`)
  lines.push(`Issue category: ${categoryLabel ?? NOT_PROVIDED}`)
  lines.push(`Prepared on: ${reportDate ?? NOT_PROVIDED}`)
  lines.push('')

  lines.push('DESCRIPTION')
  lines.push(
    description
      ? `The photograph appears to show: ${description.replace(/\.$/, '')}.`
      : 'No description was available from the assessment. Please add your own description of the problem here.',
  )
  lines.push('')

  lines.push('OBSERVATIONS RECORDED FROM THE PHOTOGRAPH')
  lines.push(
    'The points below come from an AI-assisted assessment of the photograph. They have not been verified on site and should be treated as observations, not measurements.',
  )
  lines.push(...bulletLines(observations, '- No specific observations were recorded.'))
  lines.push('')

  lines.push('REPORTED SAFETY CONCERNS')
  lines.push(...bulletLines(safetyConcerns, '- No safety concerns were recorded in the assessment.'))
  lines.push('')

  lines.push('REQUESTED ACTION')
  lines.push(
    'I request that the concerned department inspect the reported location and take appropriate corrective action if the problem is confirmed.',
  )
  if (analysis?.needsSiteInspection === true) {
    lines.push(
      'The assessment also indicates that a site inspection is required before repair work can be planned.',
    )
  }
  lines.push('')

  lines.push('SUPPORTING EVIDENCE')
  lines.push(
    imageName
      ? `A photograph of the reported issue (${imageName}) was captured and submitted for AI-assisted assessment on ${reportDate ?? 'the date above'}. It can be attached to this complaint if required.`
      : `A photograph of the reported issue was captured and submitted for AI-assisted assessment on ${reportDate ?? 'the date above'}. It can be attached to this complaint if required.`,
  )
  lines.push('CivicFix does not upload or attach the photograph to the authority.')
  lines.push('')

  lines.push('ADDITIONAL DETAILS PROVIDED BY THE REPORTER')
  lines.push(additionalDetails ?? NOT_PROVIDED)

  const answeredQuestions = getFollowUpQuestions(categoryId)
    .map((question) => {
      const answer = asText(followUpAnswers?.[question.id])
      return answer ? `- ${question.label} ${answer}` : null
    })
    .filter(Boolean)

  if (answeredQuestions.length) {
    lines.push('')
    lines.push('ADDITIONAL DETAILS RECORDED FROM THE REPORTING FORM')
    lines.push(...answeredQuestions)
  }

  if (missingInformation.length) {
    lines.push('')
    lines.push('INFORMATION NOT AVAILABLE WHEN THIS COMPLAINT WAS PREPARED')
    lines.push('The following details could not be established from the photograph or the information provided:')
    lines.push(...bulletLines(missingInformation, '- None recorded.'))
  }

  lines.push('')
  lines.push('DECLARATION')
  lines.push(
    'This complaint was prepared with AI assistance using a photograph and my own description, and I have reviewed it before submission. It contains no measurements, cost estimates or engineering findings that have not been verified on site.',
  )
  lines.push('')
  lines.push(
    `Prepared with CivicFix AI on ${reportDate ?? 'the date above'}. CivicFix is not a government authority and has not submitted this complaint on my behalf.`,
  )
  lines.push('')
  lines.push('Name: ______________________')
  lines.push('Contact: ___________________')

  return {
    sessionId,
    categoryId,
    subject: meta.subject,
    addressee,
    body: lines.join('\n'),
    generatedAt,
    isEdited: false,
    warnings,
    disclaimer: COMPLAINT_DISCLAIMER,
  }
}

/**
 * Compose the complete document as plain text — used for the clipboard, the
 * downloaded .txt file and the print view, so all three stay identical.
 */
export function buildComplaintText(draft) {
  if (!draft) return ''
  const lines = []
  lines.push(`SUBJECT: ${(draft.subject ?? '').trim()}`)
  lines.push('')
  lines.push('To,')
  lines.push((draft.addressee ?? DEFAULT_ADDRESSEE).trim())
  lines.push('')
  lines.push((draft.body ?? '').trimEnd())
  if (draft.warnings?.length) {
    lines.push('')
    lines.push('POINTS TO CHECK BEFORE SENDING')
    lines.push(...draft.warnings.map((warning) => `- ${warning}`))
  }
  return `${lines.join('\n').trimEnd()}\n`
}

/** Downloadable file name, e.g. civicfix-complaint-road-damage-2026-10-09.txt */
export function buildComplaintFileName(draft, fallbackDate = new Date()) {
  const date = toDate(draft?.generatedAt) ?? fallbackDate
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
  const slug = (draft?.categoryId ?? 'draft').toString().replace(/[^a-z0-9-]/gi, '').toLowerCase()
  return `civicfix-complaint-${slug || 'draft'}-${stamp}.txt`
}

/** Has the citizen changed the generated draft? */
export function isDraftEdited(draft, original) {
  if (!draft || !original) return false
  return (
    draft.subject !== original.subject ||
    draft.addressee !== original.addressee ||
    draft.body !== original.body
  )
}
