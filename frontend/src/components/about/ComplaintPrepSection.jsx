import { ClipboardCopy, PencilLine, ShieldCheck } from 'lucide-react'

import { Container } from '@/components/ui/container'

const POINTS = [
  {
    Icon: PencilLine,
    title: 'Drafted from your assessment',
    description:
      'Built from the assessment, the category you confirmed and the details you typed. You can edit every line.',
  },
  {
    Icon: ClipboardCopy,
    title: 'Copy, download or print',
    description:
      'Paste it into an official form, save it as a .txt file, or print a clean copy.',
  },
  {
    Icon: ShieldCheck,
    title: 'No invented facts',
    description:
      'The draft says the photograph “appears to show” the problem and marks anything missing as not provided.',
  },
]

export function ComplaintPrepSection() {
  return (
    <section
      id="complaints"
      className="scroll-mt-20 py-14 sm:py-20"
      style={{ background: 'var(--color-navy)', borderBottom: '1px solid var(--color-navy-border)' }}
    >
      <Container>
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow-dark mb-3">Complaint preparation</p>
          <h2
            className="mb-3 text-3xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-foreground)' }}
          >
            From assessment to a draft you can send
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-navy-muted)' }}>
            The complaint is drafted in your browser from a fixed template, so you can review it
            before it goes anywhere. Copying, downloading or printing it does not submit it —
            you send it yourself.
          </p>
        </div>

        <ul className="grid gap-4 md:grid-cols-3">
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
                style={{ background: 'rgba(232,129,10,0.15)', color: 'var(--color-amber-vivid)' }}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-foreground)' }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-navy-muted)' }}>
                {description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
