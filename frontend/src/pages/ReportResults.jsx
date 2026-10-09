import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleHelp,
  ClipboardList,
  FileSearch,
  FileWarning,
  History,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  PencilLine,
  ServerCrash,
  ShieldAlert,
  Siren,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { AnalysisRawPanel } from '@/components/reports/AnalysisRawPanel'
import { AnalysisSummary } from '@/components/reports/AnalysisSummary'
import { AuthorityCard } from '@/components/reports/AuthorityCard'
import { CategoryConfirmation } from '@/components/reports/CategoryConfirmation'
import { ComplaintEditor } from '@/components/reports/ComplaintEditor'
import { DetailListCard } from '@/components/reports/DetailListCard'
import { EstimateCard } from '@/components/reports/EstimateCard'
import { SaveReportCard } from '@/components/reports/SaveReportCard'
import { ResourceList } from '@/components/reports/ResourceList'
import { AuthorityStatusBadge } from '@/components/reports/StatusBadge'
import { SubmissionStatusPanel } from '@/components/reports/SubmissionStatusPanel'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import { getCategoryLabel, resolveEffectiveCategory } from '@/config/issueCategories'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { resolveAuthorityStatus } from '@/lib/analysis'
import { formatDateTime } from '@/lib/format'

export default function ReportResults() {
  useDocumentTitle('Assessment result')

  const { session, analysis, request, receivedAt, previewUrl, error, status } = useAnalysisSession()

  // The citizen's correction on this page, kept in component state so it is
  // applied consistently to the complaint and the authority suggestion.
  const [categoryOverride, setCategoryOverride] = useState(null)

  const catalogSelection = useMemo(() => {
    if (!analysis) return null
    return resolveEffectiveCategory({
      userCategoryId: categoryOverride ?? request?.chosenCategoryId ?? null,
      analysis,
    })
  }, [analysis, categoryOverride, request])

  const handleCategoryChange = useCallback((categoryId) => {
    setCategoryOverride(categoryId)
  }, [])

  /* ---------------------------------------------------------------- */
  /* No analysis in memory (for example after a page refresh)          */
  /* ---------------------------------------------------------------- */
  if (!session || !analysis) {
    const failed = status === 'error' && error

    return (
      <>
        <PageHeader
          eyebrow="Assessment result"
          title={failed ? 'The last analysis did not complete' : 'No assessment is available in this session'}
        />
        <Container className="py-10">
          <EmptyState
            icon={failed ? ServerCrash : History}
            tone={failed ? 'warning' : 'neutral'}
            title={failed ? 'The previous request failed' : 'Nothing to display here'}
            description={
              failed ? (
                <p>{error.message}</p>
              ) : (
                <>
                  <p>
                    Assessments, your complaint draft and the submission status are held in memory for the current tab
                    only. Nothing is stored in your browser or on a server, and photographs are never written to local
                    storage — so a refresh or a new tab clears everything.
                  </p>
                  <p>This page will not show invented or cached results in that situation.</p>
                </>
              )
            }
            actions={
              <>
                <Button asChild>
                  <Link to="/report">
                    <FileSearch />
                    Start a new report
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back to home</Link>
                </Button>
              </>
            }
          />
        </Container>
      </>
    )
  }

  const authorityStatus = resolveAuthorityStatus(analysis.authorityStatus)
  const locationLabel = analysis.location ?? request?.location ?? null
  const effectiveCategoryId = catalogSelection.categoryId
  const categorySource = catalogSelection.source
  const categoryLabel = getCategoryLabel(effectiveCategoryId)

  return (
    <>
      <PageHeader
        eyebrow="AI-assisted assessment"
        title={analysis.issueType ?? 'Assessment result'}
        description={
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {locationLabel ? (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4" />
                {locationLabel}
              </span>
            ) : (
              <span>No location reported by the backend</span>
            )}
            <span>Received {formatDateTime(receivedAt) ?? 'just now'}</span>
            {request?.imageName ? <span className="break-all">{request.imageName}</span> : null}
          </p>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/report">
                <ArrowLeft />
                Back to the form
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/dashboard">
                <LayoutDashboard />
                Dashboard
              </Link>
            </Button>
          </>
        }
      />

      <Container className="space-y-8 py-8 sm:py-10">
        {/* Response-integrity notices ---------------------------------- */}
        {!analysis.usable ? (
          <Alert variant="warning" icon={FileWarning} title="This response does not match the documented schema" role="alert">
            <p>
              The request succeeded, but the body contained none of the agreed fields. The raw response is shown at the
              bottom of this page so the contract can be corrected.
            </p>
          </Alert>
        ) : null}

        {analysis.isCivicIssue === false ? (
          <Alert variant="warning" icon={TriangleAlert} title="This image was not identified as a supported civic issue">
            <p>
              The analysis service could not recognise a civic infrastructure problem in this photograph. Try a clearer
              image of the damaged asset, taken from a closer and safer position. You can still prepare a complaint, but
              check first that you are describing a problem on public land.
            </p>
          </Alert>
        ) : null}

        {analysis.isCivicIssue === null ? (
          <Alert variant="neutral" icon={CircleHelp} title="The response did not say whether this is a supported civic issue">
            <p>
              The field <span className="font-mono text-xs">is_civic_issue</span> was absent or null, so the interface
              cannot tell you whether the image was accepted as a civic issue.
            </p>
          </Alert>
        ) : null}

        {analysis.needsSiteInspection === true ? (
          <Alert
            variant="warning"
            icon={ShieldAlert}
            title="A site inspection is required before repair work can be planned"
          >
            <p>
              The analysis flagged this issue as needing a physical inspection. Cost, duration and material figures are
              therefore provisional and should not be treated as a work order.
            </p>
          </Alert>
        ) : null}

        {/* A. Issue summary -------------------------------------------- */}
        <section aria-labelledby="section-summary" className="scroll-mt-24 space-y-6">
          <h2 id="section-summary" className="sr-only">
            Issue summary
          </h2>
          <AnalysisSummary analysis={analysis} request={request} receivedAt={receivedAt} previewUrl={previewUrl} />
          <CategoryConfirmation
            analysis={analysis}
            userCategoryId={categoryOverride ?? request?.chosenCategoryId ?? null}
            effectiveCategoryId={effectiveCategoryId}
            categorySource={categorySource}
            onChange={handleCategoryChange}
          />
        </section>

        {/* B. What the AI observed ------------------------------------- */}
        <section aria-labelledby="section-observed" className="scroll-mt-24 space-y-6">
          <h2 id="section-observed" className="text-xl text-foreground">
            What the assessment observed
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <DetailListCard
              title="Visible observations"
              description="What the assessment reports seeing in the photograph. Observations, not measurements."
              icon={FileSearch}
              items={analysis.observations}
              emptyMessage="The analysis response did not include visible observations."
            />

            <DetailListCard
              title="Safety concerns"
              description="Risks to the public or to workers, as reported by the analysis."
              icon={Siren}
              items={analysis.safetyConcerns}
              emptyMessage="The analysis response did not report any safety concerns."
            />
          </div>
        </section>

        {/* C. Recommended next steps ----------------------------------- */}
        <section aria-labelledby="section-next-steps" className="scroll-mt-24 space-y-6">
          <h2 id="section-next-steps" className="text-xl text-foreground">
            Recommended next steps
          </h2>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ClipboardList aria-hidden="true" className="size-4" />
                </span>
                <CardTitle as="h3">What usually happens next</CardTitle>
              </div>
              <CardDescription>
                Suggestions produced by the analysis. They describe a likely handling path — they are not confirmed
                assignments, and no department has been contacted.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Building2 aria-hidden="true" className="size-4 text-primary" />
                    Department suggested by the assessment
                  </p>
                  {analysis.suggestedDepartment ? (
                    <p className="text-sm text-foreground">{analysis.suggestedDepartment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">The analysis response did not suggest a department.</p>
                  )}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A suggestion from the model, not a jurisdiction lookup. See &ldquo;Find the Appropriate
                    Authority&rdquo; below for what CivicFix can and cannot establish.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ListChecks aria-hidden="true" className="size-4 text-primary" />
                    Corrective actions
                  </p>
                  {analysis.recommendedActions.length ? (
                    <ul className="space-y-2">
                      {analysis.recommendedActions.map((action, index) => (
                        <li key={`${action}-${index}`} className="flex gap-2 text-sm leading-relaxed text-foreground">
                          <BadgeCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="min-w-0">{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      The analysis response did not list recommended actions.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Package aria-hidden="true" className="size-4 text-primary" />
                    Materials and equipment
                  </p>
                  <ResourceList resources={analysis.resources} />
                </div>
              </div>

              <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                These are planning aids based on a photograph. Treat them as possibilities to be confirmed on site, not
                as guaranteed solutions or approved work.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* D. Repair estimates ----------------------------------------- */}
        <section aria-labelledby="section-estimates" className="scroll-mt-24 space-y-6">
          <h2 id="section-estimates" className="text-xl text-foreground">
            Preliminary repair estimates
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <EstimateCard
              title="Preliminary cost estimate"
              icon={Building2}
              estimate={analysis.cost}
              kind="cost"
              unavailableMessage="The analysis service did not return a usable cost range. That normally means the photograph and the information provided are not enough to estimate a figure — a site inspection is usually required first."
            />
            <EstimateCard
              title="Preliminary duration estimate"
              icon={ClipboardList}
              estimate={analysis.duration}
              kind="duration"
              unavailableMessage="The analysis service did not return a usable duration range. Repair time depends on site conditions, access and material availability."
            />
          </div>

          <DetailListCard
            title="Information still needed"
            description="Details the analysis needs before a repair can be planned properly."
            icon={CircleHelp}
            items={analysis.missingInformation}
            emptyMessage="The analysis response did not list any missing information."
            footer={
              analysis.needsSiteInspection === true ? (
                <p className="text-xs leading-relaxed text-amber-800">
                  A physical site inspection was flagged for this issue, so at least some of this will be gathered on
                  site.
                </p>
              ) : analysis.needsSiteInspection === false ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The analysis did not require a site inspection for this issue.
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The analysis response did not state whether a site inspection is required.
                </p>
              )
            }
          />
        </section>

        {/* Save to Supabase ------------------------------------------- */}
        <SaveReportCard categoryId={effectiveCategoryId} />

        {/* E. Prepare your complaint ----------------------------------- */}
        <section aria-labelledby="section-complaint" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2">
            <PencilLine aria-hidden="true" className="size-5 text-primary" />
            <h2 id="section-complaint" className="text-xl text-foreground">
              E. Prepare your complaint
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Turn the assessment into a formal complaint you can edit, copy, download or print. It stays in this browser
            tab, and nothing is sent from here.
          </p>
          <ComplaintEditor
            effectiveCategoryId={effectiveCategoryId}
            categorySource={categorySource}
            onCategoryChange={handleCategoryChange}
          />
        </section>

        {/* F. Find the appropriate authority --------------------------- */}
        <section aria-labelledby="section-authority" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 aria-hidden="true" className="size-5 text-primary" />
            <h2 id="section-authority" className="text-xl text-foreground">
              F. Find the appropriate authority
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Guidance on which body may be responsible for a {categoryLabel.toLowerCase()} problem, and which official
            channels have actually been verified. CivicFix does not know who legally owns every asset, and it will say so
            rather than guess.
          </p>
          <AuthorityCard
            categoryId={effectiveCategoryId}
            categoryLabel={categoryLabel}
            locationText={locationLabel}
          />
        </section>

        {/* G. Submission status ---------------------------------------- */}
        <section aria-labelledby="section-status" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="size-5 text-primary" />
            <h2 id="section-status" className="text-xl text-foreground">
              G. Submission status
            </h2>
          </div>
          <SubmissionStatusPanel />
        </section>

        {/* Backend-reported authority status (kept separate from the
            citizen-declared status above, and clearly labelled) --------- */}
        <Card>
          <CardHeader>
            <CardTitle as="h3">What the analysis response said about submission</CardTitle>
            <CardDescription>
              This is the value the backend returned in <span className="font-mono text-xs">authority_status</span>. It is
              not the same as the status you record above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuthorityStatusBadge value={analysis.authorityStatus} />
            <p className="text-sm leading-relaxed text-foreground">{authorityStatus.detail}</p>
            <Separator />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Completing an AI analysis only means the image was understood. Submission to a municipal or government
              authority requires workflow features that are planned, and no such request is made from this application.
            </p>
          </CardContent>
        </Card>

        {analysis.missingFields.length || analysis.unexpectedFields.length ? (
          <Alert variant="info" icon={FileWarning} title="Response completeness notes">
            {analysis.missingFields.length ? (
              <p>
                Not returned by the backend:{' '}
                <span className="font-mono text-xs">{analysis.missingFields.join(', ')}</span>
              </p>
            ) : null}
            {analysis.unexpectedFields.length ? (
              <p>
                Additional fields not in the documented contract:{' '}
                <span className="font-mono text-xs">{analysis.unexpectedFields.join(', ')}</span>
              </p>
            ) : null}
          </Alert>
        ) : null}

        <AnalysisRawPanel payload={analysis.source} />

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/report">
              <FileSearch />
              Analyse another issue
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <LayoutDashboard />
              Open the dashboard
            </Link>
          </Button>
        </div>
      </Container>
    </>
  )
}
