import {
  CircleDollarSign,
  FileWarning,
  Gauge,
  Info,
  ListChecks,
  Package,
  ShieldAlert,
  Timer,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'

const ASSESSMENT_FIELDS = [
  {
    Icon: Gauge,
    title: 'Finding and severity',
    items: ['Issue category', 'Description of the visible damage', 'Severity grade', 'Model confidence'],
  },
  {
    Icon: FileWarning,
    title: 'Risk and response',
    items: [
      'Visible observations',
      'Safety concerns',
      'Suggested department',
      'Recommended corrective actions',
    ],
  },
  {
    Icon: Package,
    title: 'Preliminary planning',
    items: [
      'Materials and equipment that may be required',
      'Indicative cost range',
      'Indicative duration range',
      'Whether a site inspection is required',
    ],
  },
  {
    Icon: ListChecks,
    title: 'Report completeness',
    items: ['Details still missing before work can be planned', 'Estimate status', 'Authority submission status'],
  },
]

const HANDLING_NOTES = [
  {
    Icon: ShieldAlert,
    title: 'Missing values stay missing',
    description:
      'When the backend returns a null cost or duration, the interface explains that there is not enough information for a reliable estimate. Nothing is filled in with zero.',
  },
  {
    Icon: Info,
    title: 'Unexpected responses are shown, not hidden',
    description:
      'Every response passes through one normaliser. Unrecognised severity values, malformed arrays and schema drift are surfaced honestly instead of being silently reshaped.',
  },
  {
    Icon: CircleDollarSign,
    title: 'Estimates are always labelled preliminary',
    description:
      'Cost and duration figures are planning aids based on a photograph. They are never presented as quotations or approved budgets.',
  },
  {
    Icon: Timer,
    title: 'Analysis is not a submission',
    description:
      'A successful assessment means the image was understood. It does not mean a complaint reached a municipality, and the interface says so explicitly.',
  },
]

export function AssessmentSection() {
  return (
    <section className="border-b border-border py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="AI-assisted assessment"
          title="What the assessment returns, and how the interface treats it"
          description="The backend is designed to return a structured assessment rather than free text, so the frontend can present it consistently. These are the fields the interface knows how to render today."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle as="h3">Assessment contents</CardTitle>
              <CardDescription>
                Grouped view of the documented response fields. The exact schema belongs to the backend and may evolve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {ASSESSMENT_FIELDS.map(({ Icon, title, items }) => (
                <div key={title} className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon aria-hidden="true" className="size-4 text-primary" />
                    {title}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {HANDLING_NOTES.map(({ Icon, title, description }) => (
              <Card key={title} className="gap-3">
                <CardContent className="space-y-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
