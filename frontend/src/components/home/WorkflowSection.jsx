import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { BACKEND_DEPENDENCIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const WORKFLOW_STAGES = [
  {
    title: 'Citizen report',
    description: 'Photograph, location and optional details captured through the reporting form.',
    status: 'Available',
  },
  {
    title: 'AI-assisted assessment',
    description: 'Structured analysis returned by POST /analyze and rendered defensively.',
    status: 'Available',
  },
  {
    title: 'Report storage and history',
    description: 'Persisting assessments so they can be searched, tracked and revisited.',
    status: 'Planned',
  },
  {
    title: 'Official review and assignment',
    description: 'Inspectors accept reports, change status and assign work to a team.',
    status: 'Planned',
  },
  {
    title: 'Authority submission and closure',
    description: 'Escalation to the responsible local body with a verified closing record.',
    status: 'Planned',
  },
  {
    title: 'Public tracking and map',
    description: 'Progress visibility for citizens, plotted from genuine report coordinates.',
    status: 'Planned',
  },
]

export function WorkflowSection() {
  const plannedCapabilities = BACKEND_DEPENDENCIES.filter((capability) => !capability.implemented)

  return (
    <section className="border-b border-border bg-card py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Intended workflow"
          title="The full reporting lifecycle, and how much of it exists today"
          description="CivicFix AI is intended to cover the whole path from a citizen's photograph to a verified repair. Only the first two stages are implemented in this build; the rest are designed and clearly labelled as planned."
        />

        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isAvailable = stage.status === 'Available'

            return (
              <li
                key={stage.title}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-5',
                  isAvailable ? 'border-border bg-background' : 'border-dashed border-border bg-muted/30',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Stage {index + 1}
                  </span>
                  <Badge variant={isAvailable ? 'success' : 'muted'}>{stage.status}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{stage.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
              </li>
            )
          })}
        </ol>

        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="text-sm font-semibold text-foreground">Capabilities that remain placeholders</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            These are shown in the interface as designed-but-unavailable. Nothing below is simulated, and no sample
            record is presented as a real incident.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {plannedCapabilities.map((capability) => (
              <li key={capability.id} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{capability.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{capability.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
