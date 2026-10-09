import { BadgeCheck, CircleX, Info, Scale } from 'lucide-react'

import { BackendDependencyPanel } from '@/components/reports/BackendDependencyPanel'
import { Alert } from '@/components/ui/alert'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'

const IS_LIST = [
  'An independent, citizen-facing tool that turns photographs of civic problems into structured reports.',
  'A place to draft, review and export a formal complaint, and to find which body may be responsible.',
  'Honest about uncertainty: what the AI is unsure of, what the directory has not verified, and what is still missing.',
  'A record you keep — the complaint text, the channel you used and the date you used it.',
]

const IS_NOT_LIST = [
  'Not a government authority, and not affiliated with, endorsed by or integrated with any municipal or government body.',
  'Not an official complaint portal, and not a substitute for one. You still send the complaint yourself.',
  'Not a tracker: it cannot see acknowledgements, work orders, repair progress or resolution.',
  'Not a guarantee that anything will be repaired, or that a complaint will be accepted.',
]

export function TransparencySection() {
  return (
    <section id="transparency" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Transparency"
          title="What CivicFix is — and what it is not"
          description="This project is built to be useful without overstating itself. Everything below is a deliberate boundary, not a missing screen."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BadgeCheck aria-hidden="true" className="size-4 text-emerald-700" />
              What CivicFix is
            </p>
            <ul className="space-y-3">
              {IS_LIST.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CircleX aria-hidden="true" className="size-4 text-muted-foreground" />
              What CivicFix is not
            </p>
            <ul className="space-y-3">
              {IS_NOT_LIST.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Alert variant="neutral" icon={Scale} title="Your report is yours">
          <p>
            Photographs are never stored in your browser and never published. Coordinates are only used for your own
            review unless you choose to include them, and nothing is sent anywhere except the single analysis request to
            the backend.
          </p>
        </Alert>

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Info aria-hidden="true" className="size-4 text-primary" />
            Current build status, feature by feature
          </p>
          <BackendDependencyPanel
            title="Available now and awaiting backend support"
            description="Kept honest here and inside the app: anything listed as awaiting support is designed but inert, and never simulated."
            headingLevel="h3"
          />
        </div>
      </Container>
    </section>
  )
}
