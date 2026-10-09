import { getCategoryLabel } from '@/config/issueCategories'
import { isValidCoordinates } from '@/lib/location'
import { SEVERITY_LEVELS } from '@/lib/constants'

/**
 * Build the JSON body for POST /reports from a finished analysis.
 *
 * Nothing is invented: a missing optional value is sent as null. Coordinates
 * are included only when the citizen chose them (map click or device
 * location); otherwise the report is still saved, just without a map marker.
 *
 * @returns {{ ok: true, payload: object } | { ok: false, message: string }}
 */
export function buildSaveReportPayload({ analysis, request, categoryId, clientRequestId }) {
  if (!analysis || !clientRequestId) {
    return { ok: false, message: 'There is no assessment to save.' }
  }
  if (!analysis.issueType) {
    return { ok: false, message: 'The assessment has no issue type, so it cannot be saved.' }
  }
  if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
    return { ok: false, message: 'The assessment has no valid confidence value, so it cannot be saved.' }
  }
  if (!SEVERITY_LEVELS.includes(analysis.severityValue)) {
    return { ok: false, message: 'The assessment has no recognised severity, so it cannot be saved.' }
  }

  const coordinates = isValidCoordinates(request?.coordinates) ? request.coordinates : null

  return {
    ok: true,
    payload: {
      client_request_id: clientRequestId,
      issue_category: getCategoryLabel(categoryId),
      issue_type: analysis.issueType,
      description: analysis.description ?? '',
      severity: analysis.severityValue,
      confidence: analysis.confidence,
      recommended_actions: analysis.recommendedActions ?? [],
      suggested_department: analysis.suggestedDepartment,
      estimated_cost_min: analysis.cost?.minimum ?? null,
      estimated_cost_max: analysis.cost?.maximum ?? null,
      estimated_cost_basis: analysis.cost?.basis ?? null,
      estimated_duration_min_hours: analysis.duration?.minimum ?? null,
      estimated_duration_max_hours: analysis.duration?.maximum ?? null,
      estimated_duration_basis: analysis.duration?.basis ?? null,
      location: (analysis.location ?? request?.location ?? '').slice(0, 500),
      latitude: coordinates ? Number(coordinates.latitude.toFixed(6)) : null,
      longitude: coordinates ? Number(coordinates.longitude.toFixed(6)) : null,
    },
  }
}
