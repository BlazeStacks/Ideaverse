import { Camera, PencilLine, ScanLine } from 'lucide-react'

import { Container } from '@/components/ui/container'

const STEPS = [
  {
    Icon: Camera,
    number: '01',
    title: 'Report',
    description: 'Upload a photo and tell us where the issue is.',
  },
  {
    Icon: ScanLine,
    number: '02',
    title: 'Assess',
    description:
      'AI analyses the visible problem and suggests its severity and possible next steps.',
  },
  {
    Icon: PencilLine,
    number: '03',
    title: 'Take Action',
    description:
      'Review the assessment and prepare a complaint for the relevant authority.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border py-16 sm:py-24">
      <Container>
        <div className="mb-10 max-w-xl">
          <p className="eyebrow mb-3">How it works</p>
          <h2
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Three steps from photo to complaint.
          </h2>
        </div>

        <ol className="grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ Icon, number, title, description }) => (
            <li
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ background: 'var(--color-secondary)', color: 'var(--color-primary)' }}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-border)',
                    letterSpacing: '-0.03em',
                  }}
                  aria-hidden="true"
                >
                  {number}
                </span>
              </div>
              <div>
                <h3
                  className="mb-1.5 text-base font-bold text-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
