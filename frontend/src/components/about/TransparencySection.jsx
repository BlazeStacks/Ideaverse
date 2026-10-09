import { BadgeCheck, CircleX, Info } from 'lucide-react'

import { Container } from '@/components/ui/container'

const IS_LIST = [
  'An independent tool that turns photographs of civic problems into structured reports.',
  'A place to review and export a complaint draft, and find which body may be responsible.',
  'Open about uncertainty: what the AI is unsure of, what is unverified and what is missing.',
]

const IS_NOT_LIST = [
  'Not a government authority, and not affiliated with or integrated with any municipal body.',
  'Not an official complaint portal. You send the complaint yourself, and generating one does not mean it has been submitted.',
  'Not a tracker. It cannot see acknowledgements, repair progress or resolution.',
  'Not a guarantee that a complaint will be accepted or the problem repaired.',
]

export function TransparencySection() {
  return (
    <section id="privacy" className="scroll-mt-20 py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow mb-3">Privacy and limitations</p>
          <h2 className="mb-3 text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            What CivicFix is — and what it is not
          </h2>
        </div>

        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck aria-hidden="true" className="size-5" style={{ color: 'var(--color-success)' }} />
              <h3 className="font-semibold text-foreground">What CivicFix is</h3>
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
              <h3 className="font-semibold text-foreground">What CivicFix is not</h3>
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

        <div
          className="flex items-start gap-3 rounded-2xl p-5"
          style={{
            background: 'var(--color-secondary)',
            border: '1px solid var(--color-secondary-hover)',
          }}
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3
              className="mb-1 text-sm font-semibold"
              style={{ color: 'var(--color-secondary-foreground)' }}
            >
              Your photograph and location
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-primary)' }}>
              Your photo and location are sent once to the analysis service to produce the
              assessment. CivicFix does not store photographs in your browser or publish anything,
              and does not save reports: results live in the open tab and are cleared when you
              refresh. AI assessments can be wrong or uncertain, so please review them.
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
