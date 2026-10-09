import { BatteryCharging, ClipboardCopy, Download, PencilLine, Printer, ShieldCheck } from 'lucide-react'

import { Container } from '@/components/ui/container'

const POINTS = [
  {
    Icon: PencilLine,
    title: 'Drafted from your assessment',
    description:
      'Assembled from the assessment, the category you confirmed and the details you typed. You edit every line before it goes anywhere.',
  },
  {
    Icon: ClipboardCopy,
    title: 'Copy, download or print',
    description:
      'Take the text in whichever form suits the channel: paste into an official form, save as a .txt file, or print a clean copy.',
  },
  {
    Icon: ShieldCheck,
    title: 'No invented facts',
    description:
      'The draft says the photograph "appears to show" the problem. It never states measurements or costs as facts, and marks anything missing as not provided.',
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
    <section
      className="py-16 sm:py-24"
      style={{ background: 'var(--color-navy)', borderBottom: '1px solid var(--color-navy-border)' }}
    >
      <Container>
        {/* Section header */}
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow-dark mb-3">Prepare your complaint</p>
          <h2
            className="mb-4 text-3xl sm:text-4xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-navy-foreground)',
            }}
          >
            Turn an assessment into a complaint you can actually send.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-navy-muted)' }}>
            Most citizens never escalate a civic problem because writing the complaint is the hard
            part. CivicFix drafts a formal, factual complaint — and then hands it to you to check.
          </p>
        </div>

        {/* Two-column: points left, sample right */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Feature points */}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {POINTS.map(({ Icon, title, description }) => (
              <li
                key={title}
                className="flex flex-col gap-3 rounded-2xl p-5"
                style={{
                  border: '1px solid var(--color-navy-border)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <span
                  className="flex size-9 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(232,129,10,0.15)',
                    color: 'var(--color-amber-vivid)',
                  }}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <h3
                  className="text-sm font-semibold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-navy-foreground)',
                  }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-navy-muted)' }}>
                  {description}
                </p>
              </li>
            ))}
          </ul>

          {/* Sample complaint */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--color-navy-border)' }}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid var(--color-navy-border)',
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-navy-foreground)',
                }}
              >
                Sample complaint structure
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-navy-muted)' }}>
                Real values come from your assessment
              </p>
            </div>

            {/* Subject line */}
            <div
              className="px-4 py-3"
              style={{
                background: 'rgba(232,129,10,0.08)',
                borderBottom: '1px solid var(--color-navy-border)',
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-amber-vivid)',
                }}
              >
                SUBJECT: Request for Inspection and Repair of Damaged Road
              </p>
            </div>

            {/* Body */}
            <pre
              className="overflow-x-auto p-4 text-[11px] leading-[1.7] whitespace-pre-wrap"
              style={{
                background: 'rgba(14,17,23,0.6)',
                color: 'var(--color-navy-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >{`Respected Sir/Madam,

I wish to report a problem with public infrastructure.
The photograph taken at the location mentioned below
appears to show damaged road surface.

REPORTED ISSUE
Location:   … your location and landmark
Category:   Road Damage

DESCRIPTION
The photograph appears to show: …

REQUESTED ACTION
I request that the concerned department inspect the
reported location and take appropriate corrective
action if the problem is confirmed.

DECLARATION
… prepared with AI assistance and reviewed by me.
Contains no measurements or cost figures not
verified on site.`}</pre>

            {/* Actions strip */}
            <div
              className="flex flex-wrap items-center gap-4 px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid var(--color-navy-border)',
              }}
            >
              {[
                { Icon: ClipboardCopy, label: 'Copy' },
                { Icon: Download, label: 'Download .txt' },
                { Icon: Printer, label: 'Print' },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--color-navy-muted)' }}
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  {label}
                </span>
              ))}
            </div>

            {/* Honesty note */}
            <div
              className="px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid var(--color-navy-border)',
              }}
            >
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(141,132,118,0.7)' }}>
                Copying, downloading or printing does not submit the complaint. CivicFix records no
                submission until you say you sent one yourself.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
