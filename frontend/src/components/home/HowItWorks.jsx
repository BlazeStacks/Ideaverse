import { Building2, Camera, PencilLine, RefreshCw, ScanLine } from 'lucide-react'

import { Alert } from '@/components/ui/alert'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'

const STEPS = [
  {
    Icon: Camera,
    step: '1',
    title: 'Report',
    description:
      'Pick a category or let the AI decide, add a photograph and say where the problem is. Manual location entry always works.',
  },
  {
    Icon: ScanLine,
    step: '2',
    title: 'Assess',
    description:
      'The backend returns what the photograph appears to show: severity, confidence, observations and safety concerns.',
  },
  {
    Icon: PencilLine,
    step: '3',
    title: 'Prepare',
    description:
      'A formal complaint is drafted from the assessment and your own words. Edit it, copy it, download it or print it.',
  },
  {
    Icon: Building2,
    step: '4',
    title: 'Find authority',
    description:
      'Guidance on which body may be responsible for this kind of problem in your city, and which channels have been verified.',
  },
  {
    Icon: RefreshCw,
    step: '5',
    title: 'Follow up',
    description:
      'Record what you sent and when. CivicFix keeps your own record honestly — it cannot see any authority portal.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="How CivicFix works"
          title="Report → Assess → Prepare → Find authority → Follow up"
          description="Five steps from a photograph on your phone to a complaint you can actually send. Each step tells you exactly what it did for you, and what is still your job."
        />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ Icon, step, title, description }) => (
            <li key={title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span aria-hidden="true" className="text-sm font-semibold text-muted-foreground/60">
                  {step}
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>

        <Alert variant="info" title="Steps 2 to 5 work from real data only">
          <p>
            The reporting form, validation, assessment layout, complaint drafting and authority guidance are all
            implemented. Step 2 needs the AI backend, which is developed separately. Until it is running, the interface
            reports the real connection failure instead of inventing an assessment — and the complaint template will not
            invent facts to fill the gaps.
          </p>
        </Alert>
      </Container>
    </section>
  )
}
