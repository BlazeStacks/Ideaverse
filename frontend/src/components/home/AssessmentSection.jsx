import {
  CircleDollarSign,
  FileWarning,
  Gauge,
  ListChecks,
  Package,
  ShieldAlert,
  Timer,
  Info,
} from 'lucide-react'

import { Container } from '@/components/ui/container'

const ASSESSMENT_FIELDS = [
  {
    Icon: Gauge,
    title: 'Finding and severity',
    items: ['Issue category', 'Description of the visible damage', 'Severity grade', 'Model confidence'],
  },
  {
    Icon: FileWarning,
    title: 'Risk and response',
    items: ['Visible observations', 'Safety concerns', 'Suggested department', 'Recommended corrective actions'],
  },
  {
    Icon: Package,
    title: 'Preliminary planning',
    items: ['Materials and equipment', 'Indicative cost range', 'Indicative duration range', 'Site inspection required?'],
  },
  {
    Icon: ListChecks,
    title: 'Report completeness',
    items: ['Details still missing', 'Estimate status', 'Authority submission status'],
  },
]

const HANDLING_NOTES = [
  {
    Icon: ShieldAlert,
    title: 'Missing values stay missing',
    description:
      'When the backend returns a null cost or duration, the interface explains the gap. Nothing is filled in with zero.',
  },
  {
    Icon: Info,
    title: 'Unexpected responses shown, not hidden',
    description:
      'Every response passes through one normaliser. Unrecognised values and schema drift are surfaced honestly.',
  },
  {
    Icon: CircleDollarSign,
    title: 'Estimates are always preliminary',
    description:
      'Cost and duration figures are planning aids based on a photograph — never quotations or approved budgets.',
  },
  {
    Icon: Timer,
    title: 'Analysis is not a submission',
    description:
      'A successful assessment means the image was understood. It does not mean a complaint reached a municipality.',
  },
]

export function AssessmentSection() {
  return (
    <section className="border-b border-border py-16 sm:py-24">
      <Container>
        {/* Section header */}
        <div className="mb-12">
          <p className="eyebrow mb-3">AI-assisted assessment</p>
          <h2
            className="mb-4 max-w-2xl text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What the assessment returns, and how the interface treats it.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            The backend returns a structured assessment rather than free text, so the frontend
            can present it consistently. These are the fields the interface knows how to render.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* Left: assessment field groups */}
          <div className="space-y-6">
            {ASSESSMENT_FIELDS.map(({ Icon, title, items }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'var(--color-secondary)', color: 'var(--color-primary)' }}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <h3
                    className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {title}
                  </h3>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right: handling notes */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 lg:sticky lg:top-24">
            {HANDLING_NOTES.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span
                  className="mb-3 flex size-9 items-center justify-center rounded-xl"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-primary)' }}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <h3
                  className="mb-1.5 text-sm font-semibold text-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
