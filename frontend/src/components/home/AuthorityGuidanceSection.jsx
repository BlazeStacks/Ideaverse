import { BadgeCheck, Building2, CircleHelp, ShieldQuestion, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import {
  AUTHORITY_ENTRIES,
  DIRECTORY_REVIEWED_ON,
  getVerifiedChannels,
} from '@/config/authorityDirectory'

/**
 * Authority guidance section.
 *
 * The numbers shown here are computed from the directory configuration, so the
 * page cannot claim more coverage than the data actually has.
 */
export function AuthorityGuidanceSection() {
  const entryCount = AUTHORITY_ENTRIES.length
  const verifiedChannelCount = AUTHORITY_ENTRIES.reduce(
    (total, entry) => total + getVerifiedChannels(entry).length,
    0,
  )
  const citiesWithEntries = Array.from(new Set(AUTHORITY_ENTRIES.flatMap((entry) => entry.cityIds)))

  return (
    <section className="border-b border-border bg-card py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Find the right authority"
          title="Who should you report it to?"
          description="Knowing who owns the asset is the hardest part. A road may belong to the municipal corporation, the state public works department, the national highways authority or a cantonment board — and getting it wrong is why complaints go nowhere."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Building2 aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h3">What the directory does</CardTitle>
              </div>
              <CardDescription>
                A small, hand-checked list of bodies that may be responsible, with the verification state of each
                reporting channel.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Entries</dt>
                  <dd className="text-2xl font-semibold text-foreground" data-slot="metric">
                    {entryCount}
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    {citiesWithEntries.length === 1 ? '1 city so far' : `${citiesWithEntries.length} cities`}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Verified channels
                  </dt>
                  <dd className="text-2xl font-semibold text-foreground" data-slot="metric">
                    {verifiedChannelCount}
                  </dd>
                  <dd className="text-xs text-muted-foreground">Checked against the authority&rsquo;s own pages</dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Last reviewed
                  </dt>
                  <dd className="text-sm font-medium text-foreground" data-slot="metric">
                    {DIRECTORY_REVIEWED_ON}
                  </dd>
                  <dd className="text-xs text-muted-foreground">By hand, entry by entry</dd>
                </div>
              </dl>

              <ul className="space-y-2.5">
                {[
                  'You choose your city — CivicFix does not guess it from the photograph or the AI label.',
                  'Both the primary suggestion and the alternatives are shown, with the reason for each.',
                  'Every channel states whether it is verified, when, and how it was checked.',
                  'Verified links open the authority’s own website in a new tab. Unverified ones are simply not linked.',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <BadgeCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Alert
              variant="warning"
              icon={TriangleAlert}
              title="This is guidance, not an official determination"
            >
              <p>
                CivicFix is not connected to any government body. It cannot confirm who legally owns a specific road,
                drain or streetlight, and it will not invent a portal, phone number or email address. Where a channel is
                not confirmed, the interface says so and explains how to find the office yourself.
              </p>
            </Alert>

            <Card className="gap-3">
              <CardContent className="space-y-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ShieldQuestion aria-hidden="true" className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Only verified channels get a link</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Channels are marked verified only when they were identified from the authority&rsquo;s own website or
                  official communication, and each one carries the date it was checked. Everything else is listed as
                  unverified so you can look it up rather than trust a guess.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">
                    <BadgeCheck aria-hidden="true" className="size-3.5" />
                    Verified channel
                  </Badge>
                  <Badge variant="warning">Unverified — no link</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardContent className="space-y-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <CircleHelp aria-hidden="true" className="size-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">When CivicFix cannot tell you</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  If your city or your issue category is not in the directory, CivicFix says so and gives you a short
                  process for finding the right office — check the asset signage, ask the local body, use only official
                  domains, and keep a record of what you sent.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/report">Try it with your own report</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  )
}
