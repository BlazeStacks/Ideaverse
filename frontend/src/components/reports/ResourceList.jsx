import { Wrench } from 'lucide-react'

/**
 * Materials and equipment suggested by the analysis.
 * Each entry keeps the backend's stated purpose so nothing is implied beyond it.
 *
 * @param {{ resources?: Array<{ item: string, purpose: string | null }> }} props
 */
export function ResourceList({ resources = [] }) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        The analysis response did not list any materials or equipment.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {resources.map((resource, index) => (
        <li key={`${resource.item}-${index}`} className="flex gap-2.5">
          <Wrench aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{resource.item}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {resource.purpose ?? 'The analysis response did not state a purpose for this resource.'}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
