import { FileWarning, Gauge, Package, ShieldAlert } from 'lucide-react'

import { Container } from '@/components/ui/container'

const ASSESSMENT_FIELDS = [
  {
    Icon: Gauge,
    title: 'Finding and severity',
    items: ['Issue category', 'What the photo appears to show', 'Severity grade', 'Confidence'],
  },
  {
    Icon: FileWarning,
    title: 'Risk and response',
    items: ['Observations', 'Safety concerns', 'Suggested department', 'Corrective actions'],
  },
  {
    Icon: Package,
    title: 'Preliminary planning',
    items: ['Materials and equipment', 'Indicative cost and duration', 'Site inspection needed?'],
  },
]

export function AssessmentSection() {
  return (
    <section id="assessment" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow mb-3">AI-assisted assessment</p>
          <h2 className="mb-3 text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            What the assessment tells you
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            An AI service looks at your photograph and returns a structured assessment of what it
            appears to show. It is a starting point to review, not a verdict. Fields the service
            cannot provide are shown as not available rather than guessed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ASSESSMENT_FIELDS.map(({ Icon, title, items }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'var(--color-secondary)', color: 'var(--color-primary)' }}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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

        <div
          className="mt-6 flex items-start gap-3 rounded-xl p-4 text-sm leading-relaxed"
          style={{
            background: 'var(--color-secondary)',
            color: 'var(--color-secondary-foreground)',
          }}
        >
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Cost and duration figures are planning aids based on a photograph. They are not
            quotations or approved budgets, and an assessment is not a complaint submission.
          </p>
        </div>
      </Container>
    </section>
  )
}
