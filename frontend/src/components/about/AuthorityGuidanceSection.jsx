import { BadgeCheck, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import {
  AUTHORITY_ENTRIES,
  DIRECTORY_REVIEWED_ON,
  SUPPORTED_CITIES,
} from '@/config/authorityDirectory'

const POINTS = [
  'You choose your city — CivicFix does not guess it from the photograph or the AI label.',
  'A primary suggestion and alternatives are shown, each with the reason.',
  'Every channel says whether it is verified and when it was checked.',
  'Only verified channels are linked. Unverified ones are listed without a link.',
]

export function AuthorityGuidanceSection() {
  const cityLabels = SUPPORTED_CITIES.map((city) => city.label).join(', ')

  return (
    <section id="authorities" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow mb-3">Authority recommendations</p>
          <h2 className="mb-3 text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            Who should you report it to?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            A road may belong to a municipal corporation, a state department, a national highways
            authority or a cantonment board. CivicFix points you to the bodies that may be
            responsible, using a small hand-reviewed directory.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <ul className="space-y-3">
              {POINTS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <BadgeCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              Directory coverage: {cityLabels} ({AUTHORITY_ENTRIES.length} entries, last reviewed{' '}
              {DIRECTORY_REVIEWED_ON}). If your city or issue is not covered, CivicFix says so and
              explains how to find the right office yourself.
            </p>
          </div>

          <div
            className="flex flex-col gap-3 rounded-2xl p-5"
            style={{
              background: '#FFF8EE',
              border: '1px solid #F5D9A8',
              borderLeft: '3px solid var(--color-warning)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
                style={{ color: 'var(--color-warning)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-display)', color: '#7A4A00' }}
              >
                Guidance, not an official determination
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#8A5C20' }}>
              CivicFix is not connected to any government body and cannot confirm who legally owns
              a specific asset. Always check the suggestion before you send a complaint.
            </p>
            <div>
              <Button asChild variant="outline" size="sm">
                <Link to="/report">Try it with your own report</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
