import { AlertOctagon, AlertTriangle, HelpCircle, ShieldAlert, ShieldCheck } from 'lucide-react'

import { SEVERITY_LEVELS } from '@/lib/constants'

/**
 * Severity presentation.
 *
 * Severity is always communicated with a text label and a distinct icon in
 * addition to colour, so it remains readable without colour perception.
 */
export const SEVERITY_META = {
  Low: {
    label: 'Low',
    rank: 1,
    summary: 'Minor issue. Routine maintenance is usually sufficient.',
    Icon: ShieldCheck,
    badgeClassName: 'bg-sky-50 text-sky-900 ring-sky-200',
    indicatorClassName: 'bg-sky-600',
  },
  Medium: {
    label: 'Medium',
    rank: 2,
    summary: 'Noticeable issue that should be scheduled for repair.',
    Icon: ShieldAlert,
    badgeClassName: 'bg-amber-50 text-amber-900 ring-amber-200',
    indicatorClassName: 'bg-amber-600',
  },
  High: {
    label: 'High',
    rank: 3,
    summary: 'Significant damage or risk that warrants prompt attention.',
    Icon: AlertTriangle,
    badgeClassName: 'bg-orange-50 text-orange-900 ring-orange-200',
    indicatorClassName: 'bg-orange-600',
  },
  Critical: {
    label: 'Critical',
    rank: 4,
    summary: 'Immediate hazard. Should be escalated without delay.',
    Icon: AlertOctagon,
    badgeClassName: 'bg-red-50 text-red-900 ring-red-200',
    indicatorClassName: 'bg-red-700',
  },
  Uncertain: {
    label: 'Uncertain',
    rank: 0,
    summary: 'The available information is not sufficient to grade severity.',
    Icon: HelpCircle,
    badgeClassName: 'bg-slate-100 text-slate-800 ring-slate-300',
    indicatorClassName: 'bg-slate-500',
  },
  Unknown: {
    label: 'Not reported',
    rank: 0,
    summary: 'The analysis response did not include a severity value.',
    Icon: HelpCircle,
    badgeClassName: 'bg-slate-100 text-slate-800 ring-slate-300',
    indicatorClassName: 'bg-slate-400',
  },
}

/**
 * Map an arbitrary backend severity value onto the supported vocabulary.
 * Unrecognised values are preserved for display but styled as unclassified.
 * @param {unknown} rawValue
 */
export function resolveSeverity(rawValue) {
  const raw = typeof rawValue === 'string' ? rawValue.trim() : ''
  const canonical = SEVERITY_LEVELS.find((level) => level.toLowerCase() === raw.toLowerCase())

  if (canonical) {
    return { key: canonical, ...SEVERITY_META[canonical] }
  }

  if (raw) {
    return {
      ...SEVERITY_META.Unknown,
      key: 'Unknown',
      label: raw,
      summary: 'This severity value is not part of the documented vocabulary.',
    }
  }

  return { key: 'Unknown', ...SEVERITY_META.Unknown }
}

/**
 * Qualitative confidence band. Rendered as text next to the percentage so the
 * value does not rely on a colour or a bar alone.
 */
export const CONFIDENCE_BANDS = [
  { min: 0.85, label: 'High confidence' },
  { min: 0.6, label: 'Moderate confidence' },
  { min: 0.4, label: 'Low confidence' },
  { min: 0, label: 'Very low confidence' },
]

export function getConfidenceBand(normalizedConfidence) {
  if (typeof normalizedConfidence !== 'number') return null
  const band = CONFIDENCE_BANDS.find((entry) => normalizedConfidence >= entry.min)
  return band ? band.label : null
}
