import { ArrowRight, Camera, CircleCheckBig, Info, MapPin, PencilLine, ScanSearch, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SeverityBadge } from '@/components/reports/SeverityBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

const HERO_FACTS = [
  { Icon: Camera, text: 'Photograph plus a location — no account needed, works on a phone' },
  { Icon: ScanSearch, text: 'An assessment with severity, observations and safety concerns' },
  { Icon: PencilLine, text: 'A formal complaint drafted for you to edit, copy or print' },
  { Icon: MapPin, text: 'Guidance on which authority may be responsible, with verified channels marked' },
  { Icon: ShieldAlert, text: 'Honest states when the backend is unavailable or a fact is unknown' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_24rem_at_85%_-10%,rgba(15,118,110,0.12),transparent)]"
      />

      <Container className="relative grid gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
            <Info aria-hidden="true" className="size-3.5" />
            Frontend preview — the AI backend is being developed separately
          </span>

          <h1 className="text-3xl leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Turn a photograph of a civic problem into a report you can actually send.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            CivicFix AI assesses what the photograph appears to show — pothole, blocked drain, leaking pipeline, damaged
            signal, dumped waste — then drafts a formal complaint you can edit, and tells you which authority may be
            responsible for it. You stay in control of what is sent, and where.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/report">
                Report an Issue
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <ul className="grid gap-3 pt-2 sm:grid-cols-1">
            {HERO_FACTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <IllustrativePreview />
      </Container>
    </section>
  )
}

/**
 * Static, clearly labelled mock of the results interface.
 * It is not connected to the API and must never be presented as a real result.
 */
function IllustrativePreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline">Illustrative interface preview</Badge>
          <span className="text-xs text-muted-foreground">Sample layout — not a real analysis</span>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Identified issue</p>
              <p className="text-lg font-semibold text-foreground">Pothole</p>
            </div>
            <SeverityBadge value="High" />
          </div>

          <div className="h-24 rounded-lg border border-dashed border-border bg-muted/60">
            <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
              <Camera aria-hidden="true" className="size-4" />
              Your photograph appears here
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Confidence</dt>
              <dd className="text-sm font-medium text-foreground" data-slot="metric">
                0.95
              </dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Department</dt>
              <dd className="text-sm font-medium text-foreground">Road maintenance</dd>
            </div>
          </dl>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'The photograph appears to show a damaged road surface',
              'Suggested department: road maintenance (not confirmed)',
              'Complaint draft and authority guidance appear next',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleCheckBig aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            Location and timestamp are shown with every assessment
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Placeholder content for layout purposes. Real values come from the backend response.
      </p>
    </div>
  )
}
