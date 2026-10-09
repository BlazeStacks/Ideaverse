import { CalendarClock, ImageOff, MapPin, Tag, Waves } from 'lucide-react'
import { useState } from 'react'

import { ConfidenceMeter } from '@/components/reports/ConfidenceMeter'
import { SeverityBadge, SeverityScale } from '@/components/reports/SeverityBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { resolveEstimateStatus } from '@/lib/analysis'
import { formatDateTime } from '@/lib/format'

/**
 * Key facts from an analysis: what was identified, how severe it looks, how
 * confident the model is, and where and when the report was captured.
 *
 * @param {{
 *   analysis: ReturnType<import('@/lib/analysis').normalizeAnalysis>,
 *   request?: { location?: string|null, imageName?: string|null } | null,
 *   receivedAt?: string | null,
 *   previewUrl?: string | null,
 * }} props
 */
export function AnalysisSummary({ analysis, request, receivedAt, previewUrl }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(previewUrl) && !imageFailed
  const estimateStatus = resolveEstimateStatus(analysis.estimateStatus)
  const location = analysis.location ?? request?.location ?? null

  const facts = [
    {
      icon: Tag,
      label: 'Identified issue',
      value: analysis.issueType ?? 'Not identified',
      muted: !analysis.issueType,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: location ?? 'Not provided',
      muted: !location,
    },
    {
      icon: Waves,
      label: 'Estimate status',
      value: estimateStatus.label,
      muted: false,
    },
    {
      icon: CalendarClock,
      label: 'Analysis received',
      value: formatDateTime(receivedAt) ?? 'Time not recorded',
      muted: !receivedAt,
    },
  ]

  return (
    <Card className="gap-5">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">AI-assisted assessment</Badge>
          <SeverityBadge value={analysis.severityValue} />
          {analysis.isCivicIssue === false ? <Badge variant="warning">Not identified as a civic issue</Badge> : null}
        </div>
        <CardTitle as="h2" className="text-xl sm:text-2xl">
          {analysis.issueType ?? 'Issue not classified'}
        </CardTitle>
        <CardDescription>{analysis.description ?? 'The analysis response did not include a description.'}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1.1fr]">
        <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50">
          {showImage ? (
            <img
              src={previewUrl}
              alt={`Photograph submitted for analysis${request?.imageName ? `: ${request.imageName}` : ''}`}
              onError={() => setImageFailed(true)}
              className="max-h-80 w-full object-contain"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 p-6 text-center">
              <ImageOff aria-hidden="true" className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Image preview unavailable</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                {imageFailed
                  ? 'The browser could not render the submitted image file.'
                  : 'Previews are kept in memory for this session only. Reloading the page clears them, and the photograph is not stored in your browser.'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Severity</p>
            <SeverityScale value={analysis.severityValue} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confidence</p>
            <ConfidenceMeter value={analysis.confidence} />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
                <fact.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd className={fact.muted ? 'text-sm text-muted-foreground' : 'text-sm font-medium text-foreground'}>
                    {fact.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>

      {estimateStatus.detail ? (
        <CardContent>
          <p className="text-xs leading-relaxed text-muted-foreground">{estimateStatus.detail}</p>
        </CardContent>
      ) : null}
    </Card>
  )
}
