import {
  BadgeCheck,
  Building2,
  Check,
  CircleHelp,
  ClipboardCopy,
  ExternalLink as ExternalLinkIcon,
  Phone,
  ShieldQuestion,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from '@/components/ui/external-link'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  DIRECTORY_REVIEWED_ON,
  OTHER_CITY_ID,
  VERIFICATION_STATUS,
  describeVerification,
  getEntriesForCity,
  getSupportedCities,
  getVerifiedChannels,
  recommendAuthorities,
  suggestCityFromLocationText,
} from '@/config/authorityDirectory'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { buildComplaintText } from '@/lib/complaint'

/**
 * "Where Should You Report This?"
 *
 * Guidance, not an official ruling. This component never guesses more than the
 * directory supports: it shows which bodies *may* be responsible, explains why,
 * states clearly when a reporting channel is unverified, and always lets the
 * citizen pick a different authority.
 *
 * It cannot submit anything. Every channel is a link the citizen opens
 * themselves, and the interface says so next to the button.
 *
 * @param {{ categoryId: string, categoryLabel: string, locationText?: string|null }} props
 */
export function AuthorityCard({ categoryId, categoryLabel, locationText = null }) {
  const { complaint, authoritySelection, setAuthoritySelection } = useAnalysisSession()
  const [copyState, setCopyState] = useState('idle')

  const cities = useMemo(() => getSupportedCities(), [])
  const citySuggestion = useMemo(() => suggestCityFromLocationText(locationText), [locationText])

  // Pre-fill the city from the citizen's own location text. It is labelled as a
  // suggestion and can be changed in one click — never applied silently.
  useEffect(() => {
    if (authoritySelection?.cityId) return
    if (!citySuggestion) return
    setAuthoritySelection({ cityId: citySuggestion.cityId, entryId: null, suggestedFrom: citySuggestion.matchedOn })
  }, [authoritySelection, citySuggestion, setAuthoritySelection])

  const cityId = authoritySelection?.cityId ?? ''
  const recommendation = useMemo(
    () => recommendAuthorities({ cityId: cityId || null, categoryId }),
    [categoryId, cityId],
  )

  const selectedEntry =
    recommendation.matches.find((entry) => entry.id === authoritySelection?.entryId) ?? recommendation.primary

  const cityEntries = cityId && cityId !== OTHER_CITY_ID ? getEntriesForCity(cityId) : []

  const handleCopy = useCallback(async () => {
    const text = buildComplaintText(complaint)
    if (!text) {
      setCopyState('error')
      return
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    } finally {
      window.setTimeout(() => setCopyState('idle'), 4000)
    }
  }, [complaint])

  const isSuggestion = Boolean(authoritySelection?.suggestedFrom) && !authoritySelection?.confirmed

  return (
    <Card id="find-authority" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Building2 aria-hidden="true" className="size-4" />
          </span>
          <CardTitle as="h2">Where Should You Report This?</CardTitle>
        </div>
        <CardDescription>
          CivicFix uses a small, hand-checked directory — not a government database. It tells you who may be
          responsible for a {categoryLabel.toLowerCase()} problem, and which channels have actually been verified.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Alert variant="neutral" icon={ShieldQuestion} title="CivicFix is not an authority and cannot send anything for you">
          <p>
            Ownership of roads and other assets is split between municipal, state and national bodies, and it depends on
            the exact location. Treat this as guidance: confirm the office when you contact them. Nothing here submits a
            complaint or files a grievance.
          </p>
        </Alert>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="authority-city">City or jurisdiction</Label>
            <Select
              id="authority-city"
              value={cityId}
              onChange={(event) =>
                setAuthoritySelection({
                  cityId: event.target.value,
                  entryId: null,
                  suggestedFrom: null,
                  confirmed: true,
                })
              }
            >
              <option value="">Choose your city…</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label} ({city.entryCount} entries)
                </option>
              ))}
              <option value={OTHER_CITY_ID}>My city is not listed</option>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isSuggestion
                ? `Suggested from the location text you typed (“${authoritySelection.suggestedFrom}”). Change it if that is wrong.`
                : 'CivicFix does not guess your city from the photographs or the AI classification.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authority-entry">Authority to address</Label>
            <Select
              id="authority-entry"
              value={authoritySelection?.entryId ?? selectedEntry?.id ?? ''}
              disabled={!cityEntries.length}
              onChange={(event) =>
                setAuthoritySelection({
                  cityId,
                  entryId: event.target.value || null,
                  suggestedFrom: null,
                  confirmed: true,
                })
              }
            >
              {cityEntries.length ? (
                cityEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.shortName} — {entry.authorityType}
                  </option>
                ))
              ) : (
                <option value="">No entries available</option>
              )}
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choosing a different authority updates the section you can address your complaint to.
            </p>
          </div>
        </div>

        <Separator />

        {recommendation.gap ? (
          <div className="space-y-4">
            <Alert variant="warning" icon={CircleHelp} title="CivicFix cannot name a responsible authority here">
              <p>{recommendation.message}</p>
            </Alert>

            {recommendation.alternatives.length ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Bodies CivicFix knows about in this city</p>
                <ul className="space-y-2">
                  {recommendation.alternatives.map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{entry.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <FindAuthorityGuidance />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">
                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                  Likely responsible body
                </Badge>
                <Badge variant="outline">Not a legal ruling</Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{selectedEntry.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedEntry.authorityType}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this suggestion</p>
                <p className="text-sm leading-relaxed text-foreground">{selectedEntry.reason}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Why this may still be wrong
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{selectedEntry.scopeNote}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Official channels</p>
              {getVerifiedChannels(selectedEntry).length ? (
                <ul className="space-y-3">
                  {getVerifiedChannels(selectedEntry).map((channel) => (
                    <li key={channel.id} className="rounded-lg border border-border bg-muted/40 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="success">
                          <BadgeCheck aria-hidden="true" className="size-3.5" />
                          Verified channel
                        </Badge>
                        <span className="text-xs text-muted-foreground">{describeVerification(channel)}</span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          {channel.type === 'phone' ? (
                            <Phone aria-hidden="true" className="size-3.5 text-muted-foreground" />
                          ) : (
                            <ExternalLinkIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                          )}
                          {channel.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{channel.method}</p>

                        {channel.url ? (
                          <ExternalLink href={channel.url} className="text-sm">
                            Continue to {channel.label}
                          </ExternalLink>
                        ) : null}

                        {channel.phone ? (
                          <p className="font-mono text-sm text-foreground">{channel.phone}</p>
                        ) : null}

                        {channel.verifiedHow ? (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            How it was verified: {channel.verifiedHow}
                          </p>
                        ) : null}
                        {channel.caveats ? (
                          <p className="text-xs leading-relaxed text-amber-800">{channel.caveats}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Alert variant="warning" icon={TriangleAlert} title="No verified reporting channel for this body yet">
                  <p>
                    CivicFix has not confirmed an official reporting channel for {selectedEntry.shortName}, so it will not
                    invent a link or a phone number. Open the body&rsquo;s official website yourself and look for its
                    grievance or complaint section, or ask at the local ward office.
                  </p>
                </Alert>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {getVerifiedChannels(selectedEntry)
                .filter((channel) => channel.url)
                .slice(0, 1)
                .map((channel) => (
                  <Button key={channel.id} asChild>
                    <a href={channel.url} target="_blank" rel="noopener noreferrer">
                      Continue to official website
                    </a>
                  </Button>
                ))}

              <Button variant="outline" onClick={handleCopy}>
                {copyState === 'copied' ? <Check /> : <ClipboardCopy />}
                {copyState === 'copied' ? 'Copied' : 'Copy complaint'}
              </Button>

              {recommendation.alternatives.length || recommendation.otherCityEntries?.length ? (
                <Button variant="ghost" asChild>
                  <a href="#alternative-channels">View alternative channels</a>
                </Button>
              ) : null}
            </div>

            <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">
              {copyState === 'copied'
                ? 'Complaint copied. Opening an official website and pasting text into it is still your action — CivicFix cannot tell whether anything was submitted.'
                : 'Opening one of these websites does not submit your complaint, and CivicFix cannot see what you do there.'}
            </p>

            {(recommendation.alternatives.length || recommendation.otherCityEntries?.length) ? (
              <div id="alternative-channels" className="scroll-mt-24 space-y-3">
                <Separator />
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users aria-hidden="true" className="size-4 text-primary" />
                  Alternative authorities to consider
                </p>
                <ul className="space-y-3">
                  {[...recommendation.alternatives, ...(recommendation.otherCityEntries ?? [])].map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.authorityType}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAuthoritySelection({ cityId, entryId: entry.id, suggestedFrom: null, confirmed: true })
                          }
                        >
                          Use this authority
                        </Button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entry.reason}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.scopeNote}</p>

                      {getVerifiedChannels(entry).length ? (
                        <ul className="mt-2 space-y-1.5">
                          {getVerifiedChannels(entry).map((channel) =>
                            channel.url ? (
                              <li key={channel.id}>
                                <ExternalLink href={channel.url} className="text-xs">
                                  {channel.label}
                                </ExternalLink>
                              </li>
                            ) : (
                              <li key={channel.id} className="text-xs text-muted-foreground">
                                {channel.label}: <span className="font-mono text-foreground">{channel.phone}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No verified online channel recorded for this body yet.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Directory last reviewed by hand on {DIRECTORY_REVIEWED_ON}. Only{' '}
          {Object.values(VERIFICATION_STATUS).length} verification states exist — verified or unverified — and channels
          are never presented as official on assumption. If CivicFix cannot establish the authority confidently, it says
          so instead of guessing.
        </p>
      </CardContent>
    </Card>
  )
}

/** Practical guidance when no directory entry can be recommended. */
function FindAuthorityGuidance() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <CircleHelp aria-hidden="true" className="size-4 text-primary" />
        How to find the right office
      </p>
      <ol className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">1. Identify who owns the asset.</span> Check the road or facility
          signage: a national highway (NH) or state highway (SH) number usually means a state or central body, not the
          municipal corporation.
        </li>
        <li>
          <span className="font-medium text-foreground">2. Ask the local body directly.</span> The municipal helpline or
          the ward office can say whether the stretch is theirs, and will often redirect you if it is not.
        </li>
        <li>
          <span className="font-medium text-foreground">3. Search only official domains.</span> Use the authority&rsquo;s
          own website. CivicFix deliberately does not link unverified portals, phone numbers or email addresses.
        </li>
        <li>
          <span className="font-medium text-foreground">4. Keep a record.</span> Note the date, the channel you used, and
          any reference number you are given — that is the only reliable proof of submission.
        </li>
      </ol>
    </div>
  )
}
