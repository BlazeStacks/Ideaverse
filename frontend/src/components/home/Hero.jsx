import { ArrowRight, Camera, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SeverityBadge } from '@/components/reports/SeverityBadge'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-navy)' }}
    >
      {/* Warm amber bloom, top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60rem 40rem at 105% -5%, rgba(217,107,16,0.14) 0%, transparent 65%)',
        }}
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-20">
          <div className="flex flex-col gap-7">
            <h1
              className="text-4xl leading-[1.07] sm:text-5xl lg:text-[3.5rem]"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-navy-foreground)',
              }}
            >
              Turn a photograph into a complaint you can{' '}
              <span style={{ color: 'var(--color-amber-vivid)' }}>actually send.</span>
            </h1>

            <p
              className="max-w-lg text-base leading-[1.7] sm:text-lg"
              style={{ color: 'var(--color-navy-muted)' }}
            >
              Spot a pothole, overflowing drain, or other civic issue? Upload a photo, get an AI
              assessment, and prepare a complaint for the appropriate authority.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/report">
                  Report an Issue
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="onDarkOutline">
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>
          </div>

          <IllustrativePreview />
        </div>
      </Container>
    </section>
  )
}

/**
 * Static mock of the results interface. Not connected to the API, so it is
 * labelled as a sample and must never look like a real analysis.
 */
function IllustrativePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <p
        className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em]"
        style={{ color: 'rgba(141,132,118,0.8)' }}
      >
        Sample preview — not a real analysis
      </p>

      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          borderColor: 'var(--color-navy-border)',
          background: 'rgba(23,29,40,0.85)',
        }}
      >
        <div
          className="mb-4 flex h-28 items-center justify-center rounded-xl border"
          style={{
            borderColor: 'var(--color-navy-border)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <Camera aria-hidden="true" className="size-6" style={{ color: 'var(--color-navy-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--color-navy-muted)' }}>
              Your photograph appears here
            </span>
          </div>
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-navy-muted)' }}
            >
              Identified issue
            </p>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-foreground)' }}
            >
              Pothole
            </p>
          </div>
          <SeverityBadge value="High" />
        </div>

        <ul className="mb-4 space-y-2">
          {[
            'Photograph appears to show damaged road surface',
            'Complaint draft and authority guidance appear next',
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-xs"
              style={{ color: 'var(--color-navy-muted)' }}
            >
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                style={{ background: 'var(--color-amber-vivid)' }}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>

        <div
          className="flex items-center gap-2 rounded-lg p-2.5 text-xs"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--color-navy-border)',
            color: 'var(--color-navy-muted)',
          }}
        >
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          Location shown with every assessment
        </div>
      </div>
    </div>
  )
}
