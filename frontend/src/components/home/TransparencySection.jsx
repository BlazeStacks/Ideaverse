import { BadgeCheck, CircleX, Info } from 'lucide-react'

import { BackendDependencyPanel } from '@/components/reports/BackendDependencyPanel'
import { Container } from '@/components/ui/container'

const IS_LIST = [
  'An independent, citizen-facing tool that turns photographs of civic problems into structured reports.',
  'A place to draft, review and export a formal complaint, and find which body may be responsible.',
  'Honest about uncertainty: what the AI is unsure of, what is unverified, and what is missing.',
  'A record you keep — the complaint text, the channel you used and the date you used it.',
]

const IS_NOT_LIST = [
  'Not a government authority, and not affiliated with, endorsed by or integrated with any municipal body.',
  'Not an official complaint portal and not a substitute for one — you still send the complaint yourself.',
  'Not a tracker: it cannot see acknowledgements, work orders, repair progress or resolution.',
  'Not a guarantee that anything will be repaired, or that a complaint will be accepted.',
]

export function TransparencySection() {
  return (
    <section id="transparency" className="scroll-mt-20 border-b border-border py-16 sm:py-24">
      <Container>
        {/* Section header */}
        <div className="mb-12">
          <p className="eyebrow mb-3">Transparency</p>
          <h2
            className="mb-4 max-w-2xl text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What CivicFix is — and what it is not.
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            This project is built to be useful without overstating itself. Everything below is a
            deliberate boundary, not a missing screen.
          </p>
        </div>

        {/* Is / Is Not */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck aria-hidden="true" className="size-5" style={{ color: 'var(--color-success)' }} />
              <h3
                className="font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                What CivicFix is
              </h3>
            </div>
            <ul className="space-y-3">
              {IS_LIST.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--color-success)' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <CircleX aria-hidden="true" className="size-5 text-muted-foreground" />
              <h3
                className="font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                What CivicFix is not
              </h3>
            </div>
            <ul className="space-y-3">
              {IS_NOT_LIST.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Privacy note */}
        <div
          className="mb-10 flex items-start gap-3 rounded-2xl p-5"
          style={{
            background: 'var(--color-secondary)',
            border: '1px solid var(--color-secondary-hover)',
          }}
        >
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            style={{ color: 'var(--color-primary)' }}
          />
          <div>
            <p
              className="mb-1 text-sm font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary-foreground)' }}
            >
              Your report is yours
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-primary)' }}>
              Photographs are never stored in your browser and never published. Coordinates are only
              shown to you for review. Nothing is sent anywhere except the single analysis request
              to the backend.
            </p>
          </div>
        </div>

        {/* Feature status */}
        <div className="space-y-4">
          <p
            className="flex items-center gap-2 text-sm font-medium text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Info aria-hidden="true" className="size-4" style={{ color: 'var(--color-primary)' }} />
            Current build status, feature by feature
          </p>
          <BackendDependencyPanel
            title="Available now and awaiting backend support"
            description="Anything listed as awaiting support is designed but inert, and never simulated."
            headingLevel="h3"
          />
        </div>
      </Container>
    </section>
  )
}
