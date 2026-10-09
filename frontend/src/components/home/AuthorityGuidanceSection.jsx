import { BadgeCheck, Building2, CircleHelp, ShieldQuestion, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import {
  AUTHORITY_ENTRIES,
  DIRECTORY_REVIEWED_ON,
  getVerifiedChannels,
} from '@/config/authorityDirectory'

export function AuthorityGuidanceSection() {
  const entryCount = AUTHORITY_ENTRIES.length
  const verifiedChannelCount = AUTHORITY_ENTRIES.reduce(
    (total, entry) => total + getVerifiedChannels(entry).length,
    0,
  )
  const citiesWithEntries = Array.from(new Set(AUTHORITY_ENTRIES.flatMap((entry) => entry.cityIds)))

  return (
    <section className="border-b border-border py-16 sm:py-24">
      <Container>
        {/* Section header */}
        <div className="mb-12 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-3">Find the right authority</p>
            <h2
              className="mb-4 max-w-2xl text-3xl sm:text-4xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Who should you actually report it to?
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              Getting the authority wrong is why most complaints go nowhere. A road may belong to
              the municipal corporation, state PWD, national highways authority or a cantonment
              board — CivicFix helps you distinguish them.
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Left: directory facts + feature list */}
          <div className="space-y-6">
            {/* Real stats from the directory data */}
            <dl className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Entries',
                  value: entryCount,
                  sub: `${citiesWithEntries.length === 1 ? '1 city so far' : `${citiesWithEntries.length} cities`}`,
                },
                {
                  label: 'Verified channels',
                  value: verifiedChannelCount,
                  sub: 'Checked against the authority’s own pages',
                },
                {
                  label: 'Last reviewed',
                  value: DIRECTORY_REVIEWED_ON,
                  sub: 'By hand, entry by entry',
                  isText: true,
                },
              ].map(({ label, value, sub, isText }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <dt className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </dt>
                  <dd
                    className={isText ? 'text-base font-semibold text-foreground' : 'text-3xl font-bold text-foreground'}
                    data-slot="metric"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {value}
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</dd>
                </div>
              ))}
            </dl>

            {/* How it works */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'var(--color-secondary)', color: 'var(--color-primary)' }}
                >
                  <Building2 aria-hidden="true" className="size-4" />
                </span>
                <h3
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  What the directory does
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  'You choose your city — CivicFix does not guess from the photograph or AI label.',
                  'Both primary suggestion and alternatives shown, with the reason for each.',
                  'Every channel states whether it is verified, when, and how it was checked.',
                  'Verified links open the authority\u2019s own website. Unverified ones are simply not linked.',
                ].map((item) => (
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
            </div>
          </div>

          {/* Right: honesty cards */}
          <div className="space-y-4">
            {/* Guidance caveat */}
            <div
              className="rounded-2xl border-l-2 p-5"
              style={{
                borderLeftColor: 'var(--color-warning)',
                background: '#FFF8EE',
                border: '1px solid #F5D9A8',
                borderLeftWidth: '3px',
              }}
            >
              <div className="mb-2 flex items-start gap-2.5">
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
                CivicFix is not connected to any government body. It cannot confirm who legally
                owns a specific asset. Where a channel is not confirmed, the interface says so and
                explains how to find the office yourself.
              </p>
            </div>

            {/* Verified channels */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <span
                className="mb-3 flex size-9 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-muted)', color: 'var(--color-primary)' }}
              >
                <ShieldQuestion aria-hidden="true" className="size-4" />
              </span>
              <h3
                className="mb-1.5 text-sm font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Only verified channels get a link
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                Channels are marked verified only when identified from the authority's own website,
                and each carries the date it was checked. Everything else is listed as unverified.
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}
                >
                  <BadgeCheck aria-hidden="true" className="size-3" />
                  Verified channel
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
                >
                  Unverified — no link
                </span>
              </div>
            </div>

            {/* When we can't tell */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <span
                className="mb-3 flex size-9 items-center justify-center rounded-xl"
                style={{ background: 'var(--color-muted)', color: 'var(--color-primary)' }}
              >
                <CircleHelp aria-hidden="true" className="size-4" />
              </span>
              <h3
                className="mb-1.5 text-sm font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                When CivicFix cannot tell you
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                If your city or issue category is not in the directory, CivicFix says so and gives
                you a short process for finding the right office yourself.
              </p>
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
