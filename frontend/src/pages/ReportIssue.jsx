import {
  Check,
  CircleCheckBig,
  Loader2,
  RotateCcw,
  ScanSearch,
  ServerCrash,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { CategoryFollowUps } from '@/components/reports/CategoryFollowUps'
import { CategoryPicker } from '@/components/reports/CategoryPicker'
import { ImageDropzone } from '@/components/reports/ImageDropzone'
import { LocationField } from '@/components/reports/LocationField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Container } from '@/components/ui/container'
import { Field } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { AI_DECIDE_CATEGORY_ID, getIssueCategory } from '@/config/issueCategories'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { MAX_DETAILS_LENGTH } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { buildReportSubmission } from '@/lib/reportPayload'
import { validateReportForm } from '@/lib/validation'
import {
  API_BASE_URL,
  API_ERROR_CODES,
} from '@/services/civicfixApi'

/** One numbered form section; the number turns into a tick once the step is complete. */
function StepCard({ number, done, title, description, optional = false, children }) {
  return (
    <Card className="gap-5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
              done ? 'bg-emerald-600 text-white' : 'bg-secondary text-secondary-foreground',
            )}
          >
            {done ? <Check className="size-4" /> : number}
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle as="h2" className="flex flex-wrap items-center gap-2 text-lg">
              {title}
              {optional ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Optional
                </span>
              ) : null}
              {done ? <span className="sr-only">(completed)</span> : null}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

/** What the backend's HTTP status codes mean for this form (see backend/main.py). */
function describeHttpHint(status) {
  switch (status) {
    case 400:
      return 'The backend could not read that file as an image. Choose a different photograph and try again.'
    case 413:
      return 'The backend rejected the image as too large (over 8 MB, or more than 50 megapixels). Choose a smaller photograph.'
    case 415:
      return 'The backend only accepts JPEG, PNG or WEBP images.'
    case 422:
      return 'The backend rejected the submitted fields. Check that a photograph is attached.'
    case 429:
      return 'The AI provider is rate limiting requests. Wait a minute and try again.'
    case 503:
    case 504:
      return 'The AI provider could not be reached in time. Nothing was analysed. Try again in a moment.'
    case 502:
      return 'The AI service did not return a usable assessment (an invalid answer, a rate limit or a provider problem). Nothing was analysed. Try again in a moment.'
    default:
      return 'The backend returned an error status. The message above is what it reported.'
  }
}

/** Extra guidance per API failure code. */
function describeApiError(error) {
  const base = { title: 'The analysis could not be completed', message: error.message, hint: null }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'this origin'

  switch (error.code) {
    case API_ERROR_CODES.NETWORK:
      return {
        ...base,
        hint: `Confirm the backend is running at ${API_BASE_URL} and that CORS_ORIGINS in backend/.env includes ${origin}. Your photograph and details stay in the form, so you can retry once it is available.`,
      }
    case API_ERROR_CODES.TIMEOUT:
      return {
        ...base,
        hint: 'Large images and first-request model warm-up can take a while. Try again, or submit a smaller photograph.',
      }
    case API_ERROR_CODES.HTTP:
      return { ...base, hint: describeHttpHint(error.status) }
    case API_ERROR_CODES.UNEXPECTED_SCHEMA:
    case API_ERROR_CODES.MALFORMED_RESPONSE:
      return {
        ...base,
        hint: 'The request reached the service, but the response could not be read as an assessment. Your photograph and details are still in the form, so you can try again.',
      }
    case API_ERROR_CODES.VALIDATION:
      return { ...base, hint: 'Correct the highlighted field and submit again.' }
    default:
      return base
  }
}

export default function ReportIssue() {
  useDocumentTitle('Report an issue')

  const navigate = useNavigate()
  const { runAnalysis, isAnalyzing, error: apiError, reset } = useAnalysisSession()

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [categoryId, setCategoryId] = useState(AI_DECIDE_CATEGORY_ID)
  const [followUpAnswers, setFollowUpAnswers] = useState({})
  const [location, setLocation] = useState('')
  const [landmark, setLandmark] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [errors, setErrors] = useState({})
  const [submitNotice, setSubmitNotice] = useState(null)

  const locationSectionRef = useRef(null)
  const fileSectionRef = useRef(null)
  const detailsRef = useRef(null)

  const selectedCategory = getIssueCategory(categoryId)
  const categoryIsUserChosen = categoryId !== AI_DECIDE_CATEGORY_ID

  const releasePreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }, [])

  const handleSelectFile = useCallback(
    (selected) => {
      releasePreview()
      setFile(selected)
      const isImage = typeof selected.type === 'string' && selected.type.startsWith('image/')
      setPreviewUrl(isImage ? URL.createObjectURL(selected) : null)
      setErrors((previous) => ({ ...previous, file: undefined }))
      setSubmitNotice(null)
    },
    [releasePreview],
  )

  const handleClearFile = useCallback(() => {
    releasePreview()
    setFile(null)
    setSubmitNotice(null)
  }, [releasePreview])

  const handleCategoryChange = useCallback((nextCategoryId) => {
    setCategoryId(nextCategoryId)
    // Answers belong to the previous category's questions, so they are dropped
    // rather than silently carried across.
    setFollowUpAnswers({})
  }, [])

  const handleFollowUpChange = useCallback((questionId, value) => {
    setFollowUpAnswers((previous) => {
      if (!value) {
        const next = { ...previous }
        delete next[questionId]
        return next
      }
      return { ...previous, [questionId]: value }
    })
  }, [])

  const handleCoordinatesChange = useCallback((next) => {
    setCoordinates(next)
  }, [])

  const handleResetForm = useCallback(() => {
    releasePreview()
    setFile(null)
    setCategoryId(AI_DECIDE_CATEGORY_ID)
    setFollowUpAnswers({})
    setLocation('')
    setLandmark('')
    setCoordinates(null)
    setAdditionalDetails('')
    setErrors({})
    setSubmitNotice(null)
    setConnection({ state: 'idle', detail: null })
    reset()
  }, [releasePreview, reset])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      // Ignore a second submit while one is running (button disabled + guard).
      if (isAnalyzing) return
      setSubmitNotice(null)

      const validation = validateReportForm({ file, location, landmark, additionalDetails, coordinates })
      setErrors(validation.errors)

      if (!validation.valid) {
        setSubmitNotice({ tone: 'invalid', message: validation.firstError })
        if (validation.errors.file) fileSectionRef.current?.focus()
        else if (validation.errors.location || validation.errors.landmark) locationSectionRef.current?.focus()
        else if (validation.errors.additionalDetails) detailsRef.current?.focus()
        return
      }

      const submission = buildReportSubmission({
        file,
        location,
        landmark,
        additionalDetails,
        categoryId,
        followUpAnswers,
        coordinates,
        categoryIsUserChosen,
      })

      const result = await runAnalysis({
        file: submission.file,
        location: submission.location,
        additionalDetails: submission.additionalDetails,
        categoryId: submission.issueCategory ?? categoryId,
        followUpAnswers: submission.followUpAnswers,
        coordinates: submission.coordinates,
        userDetails: submission.userDetails,
      })

      if (result.ok) {
        setSubmitNotice({ tone: 'success', message: 'The analysis returned a result. Opening the assessment…' })
        navigate('/results')
        return
      }

      // A duplicate click while a request runs is ignored, not reported as a failure.
      if (result.error.code === API_ERROR_CODES.DUPLICATE) return

      // Only a real failure reaches this branch; nothing is simulated. The form
      // state (photograph, location, details) is left untouched so the citizen
      // can retry without starting again.
      setSubmitNotice({ tone: 'error', message: result.error.message })
    },
    [
      additionalDetails,
      categoryId,
      categoryIsUserChosen,
      coordinates,
      file,
      followUpAnswers,
      isAnalyzing,
      landmark,
      location,
      navigate,
      runAnalysis,
    ],
  )

  const apiErrorDisplay = useMemo(() => (apiError ? describeApiError(apiError) : null), [apiError])

  const isBusy = isAnalyzing
  const hasPhoto = Boolean(file)
  const hasLocation = Boolean(location.trim()) || Boolean(coordinates)
  const hasExtras = categoryIsUserChosen || additionalDetails.trim().length > 0
  const requiredDone = Number(hasPhoto) + Number(hasLocation)

  return (
    <>
      <PageHeader
        eyebrow="Citizen report"
        title="Report a civic problem"
        description="Add a photograph and a location. You'll get an AI assessment, an editable complaint and guidance on who to send it to."
        actions={
          <ConfirmButton
            label="Clear form"
            question="Clear everything you have entered?"
            confirmLabel="Clear"
            icon={RotateCcw}
            disabled={isBusy}
            onConfirm={handleResetForm}
          />
        }
      />

      <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
        <form id="report-form" onSubmit={handleSubmit} noValidate className="space-y-5">
          <StepCard
            number={1}
            done={hasPhoto}
            title="Add a photograph"
            description="One clear image taken from a safe position, showing the extent of the problem."
          >
            <div ref={fileSectionRef} tabIndex={-1} className="rounded-xl focus-visible:outline-none">
              <ImageDropzone
                file={file}
                previewUrl={previewUrl}
                error={errors.file}
                disabled={isBusy}
                onSelectFile={handleSelectFile}
                onClear={handleClearFile}
              />
            </div>
            {errors.file ? (
              <p className="text-xs font-medium text-destructive" role="alert">
                {errors.file}
              </p>
            ) : null}
          </StepCard>

          <StepCard
            number={2}
            done={hasLocation}
            title="Where is it?"
            description="Type the address or area, use your current position, or tap the map to drop a pin."
          >
            <div ref={locationSectionRef} tabIndex={-1} className="rounded-xl focus-visible:outline-none">
              <LocationField
                location={location}
                landmark={landmark}
                coordinates={coordinates}
                errors={{ location: errors.location, landmark: errors.landmark }}
                disabled={isBusy}
                onLocationChange={setLocation}
                onLandmarkChange={setLandmark}
                onCoordinatesChange={handleCoordinatesChange}
              />
            </div>
          </StepCard>

          <StepCard
            number={3}
            done={hasExtras}
            optional
            title="Category and details"
            description="Not sure what it is? Leave it on “Let AI identify the issue” — you can still change it later."
          >
            <CategoryPicker
              value={categoryId}
              onChange={handleCategoryChange}
              disabled={isBusy}
            />

            {selectedCategory ? (
              <>
                <Separator />
                <CategoryFollowUps
                  categoryId={categoryId}
                  answers={followUpAnswers}
                  onChange={handleFollowUpChange}
                  disabled={isBusy}
                />
              </>
            ) : null}

            <Separator />

            <Field
              id="report-details"
              label="Anything else the photograph cannot show?"
              optional
              error={errors.additionalDetails}
              hint="How long has it been like this? Does it get worse after rain? Has anyone been hurt?"
              labelAccessory={
                <span className="text-xs text-muted-foreground" data-slot="metric">
                  {additionalDetails.length}/{MAX_DETAILS_LENGTH}
                </span>
              }
            >
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  ref={detailsRef}
                  name="additional_details"
                  rows={4}
                  value={additionalDetails}
                  disabled={isBusy}
                  maxLength={MAX_DETAILS_LENGTH}
                  onChange={(event) => setAdditionalDetails(event.target.value)}
                  placeholder="Optional context for the assessment and the complaint"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              )}
            </Field>
          </StepCard>

          {apiErrorDisplay ? (
            <Alert variant="danger" icon={ServerCrash} title={apiErrorDisplay.title} role="alert">
              <p>{apiErrorDisplay.message}</p>
              {apiErrorDisplay.hint ? <p className="text-xs">{apiErrorDisplay.hint}</p> : null}
            </Alert>
          ) : null}

          {!apiErrorDisplay && submitNotice?.tone === 'invalid' ? (
            <Alert variant="warning" icon={TriangleAlert} title="Check the form before submitting" role="alert">
              <p>{submitNotice.message}</p>
            </Alert>
          ) : null}

          {submitNotice?.tone === 'success' ? (
            <Alert variant="success" icon={CircleCheckBig}>
              {submitNotice.message}
            </Alert>
          ) : null}

          {/* Sticky submit bar: always reachable, shows progress at a glance. */}
          <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {isBusy
                  ? 'Analysing your photograph…'
                  : requiredDone === 2
                    ? 'Ready to analyse'
                    : `${requiredDone} of 2 required steps done`}
              </p>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={2}
                aria-valuenow={requiredDone}
                aria-label="Required steps completed"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isBusy ? 'w-full animate-pulse bg-primary' : 'bg-emerald-600',
                  )}
                  style={isBusy ? undefined : { width: `${(requiredDone / 2) * 100}%` }}
                />
              </div>
              {isBusy ? (
                <p className="text-xs text-muted-foreground">This can take up to a minute the first time.</p>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={isBusy} className="w-full sm:w-auto">
              {isBusy ? <Loader2 className="animate-spin" /> : <ScanSearch />}
              {isBusy ? 'Analysing…' : 'Analyse issue'}
            </Button>
          </div>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle as="h2">What happens next</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-sm">
                {[
                  ['Assessment', 'What the photograph shows, with severity and confidence.'],
                  ['Complaint draft', 'A formal complaint you can edit, copy, download or print.'],
                  ['Who to contact', 'The authority likely responsible for this category and city.'],
                  ['Your record', 'Note whether you sent it. CivicFix cannot submit or track it for you.'],
                ].map(([title, text], index) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">
                      <span className="block font-medium text-foreground">{title}</span>
                      {text}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-4">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your photograph and details are sent to an AI service to produce the assessment. Nothing is filed with
              any government department, and your photograph is not kept in your browser.
            </p>
          </div>
        </aside>
      </Container>
    </>
  )
}
