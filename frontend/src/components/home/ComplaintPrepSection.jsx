import { BatteryCharging, ClipboardCopy, Download, PencilLine, Printer, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'

const POINTS = [
  {
    Icon: PencilLine,
    title: 'Drafted from your assessment',
    description:
      'The complaint is assembled from the assessment, the category you confirmed and the details you typed. You edit every line before it goes anywhere.',
  },
  {
    Icon: ClipboardCopy,
    title: 'Copy, download or print',
    description:
      'Take the text in whichever form suits the channel you are using: paste it into an official form, save it as a .txt file, or print a clean copy.',
  },
  {
    Icon: ShieldCheck,
    title: 'No invented facts',
    description:
      'The draft says the photograph “appears to show” the problem. It never states measurements, costs or engineering conclusions as facts, and it marks anything missing as not provided.',
  },
  {
    Icon: BatteryCharging,
    title: 'Generated in your browser',
    description:
      'No second AI service, no API key and no extra network request. The template is fixed, deterministic and runs on your device.',
  },
]

export function ComplaintPrepSection() {
  return (
    <section className="border-b border-border py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Prepare your complaint"
          title="Turn an assessment into a complaint you can actually send"
          description="Most citizens never escalate a civic problem because writing the complaint is the hard part. CivicFix drafts a formal, factual complaint — and then hands it to you to check."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="grid gap-4 sm:grid-cols-2">
            {POINTS.map(({ Icon, title, description }) => (
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

          <Card className="gap-4">
            <CardHeader>
              <CardTitle as="h3">What the draft looks like</CardTitle>
              <CardDescription>
                Illustrative sample showing the structure. Real values come from your own assessment and details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs font-medium text-foreground">
                SUBJECT: Request for Inspection and Repair of Damaged Road
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-navy p-4 text-[11px] leading-relaxed text-navy-foreground">
{`Respected Sir/Madam,

I wish to report a problem with public infrastructure. The
photograph taken at the location mentioned below appears to
show damaged road surface.

REPORTED ISSUE
Location:   … your location and landmark
Category:   Road Damage

DESCRIPTION
The photograph appears to show: …

REQUESTED ACTION
I request that the concerned department inspect the
reported location and take appropriate corrective action if
the problem is confirmed.

DECLARATION
… prepared with AI assistance and reviewed by me. It
contains no measurements or cost figures that have not
been verified on site.`}
              </pre>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ClipboardCopy aria-hidden="true" className="size-3.5" /> Copy
                </span>
                <span className="flex items-center gap-1.5">
                  <Download aria-hidden="true" className="size-3.5" /> Download .txt
                </span>
                <span className="flex items-center gap-1.5">
                  <Printer aria-hidden="true" className="size-3.5" /> Print
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Copying, downloading or printing a complaint does not submit it. CivicFix records no submission until you
                say you sent one yourself.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  )
}
