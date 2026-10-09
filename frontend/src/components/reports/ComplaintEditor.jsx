import {
  ArrowUp,
  Check,
  ClipboardCopy,
  Download,
  Info,
  PencilLine,
  Printer,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { CategorySelect } from '@/components/reports/CategoryPicker'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { getCityById, getEntriesForCity } from '@/config/authorityDirectory'
import { describeCategorySource, getCategoryLabel } from '@/config/issueCategories'
import { useAnalysisSession } from '@/context/AnalysisContext'
import { buildComplaintFileName, buildComplaintText } from '@/lib/complaint'
import { formatDateTime } from '@/lib/format'

const MAX_SUBJECT_LENGTH = 160

/**
 * "Prepare Your Complaint".
 *
 * The draft is generated deterministically from the analysis (see
 * `lib/complaint.js`) and then edited by the citizen. Edits are held in the
 * session context, so moving between sections — or to the dashboard and back —
 * never loses them.
 *
 * Nothing here sends anything: copying, downloading and printing are the only
 * outputs, and the interface says so repeatedly.
 *
 * @param {{
 *   effectiveCategoryId: string,
 *   categorySource: 'user'|'ai-suggestion'|'fallback',
 *   onCategoryChange: (categoryId: string) => void,
 * }} props
 */
export function ComplaintEditor({ effectiveCategoryId, categorySource, onCategoryChange }) {
  const {
    complaint,
    sessionId,
    analysis,
    request,
    ensureComplaintDraft,
    regenerateComplaint,
    updateComplaintDraft,
    authoritySelection,
  } = useAnalysisSession()

  const [copyState, setCopyState] = useState('idle')
  const [pendingCategoryId, setPendingCategoryId] = useState(null)
  const [printRoot, setPrintRoot] = useState(null)

  const authorityEntry = useMemo(() => {
    if (!authoritySelection?.cityId || !authoritySelection?.entryId) return null
    return (
      getEntriesForCity(authoritySelection.cityId).find((entry) => entry.id === authoritySelection.entryId) ?? null
    )
  }, [authoritySelection])

  const cityLabel = useMemo(
    () => (authoritySelection?.cityId ? (getCityById(authoritySelection.cityId)?.label ?? null) : null),
    [authoritySelection],
  )

  const desiredAddressee = authorityEntry
    ? `The Officer in Charge, ${authorityEntry.name}${cityLabel ? `, ${cityLabel}` : ''}`
    : null

  // Create the draft once per session. Never regenerates on its own.
  useEffect(() => {
    if (!analysis) return
    if (!complaint || complaint.sessionId !== sessionId) {
      ensureComplaintDraft({
        categoryId: effectiveCategoryId,
        authorityName: authorityEntry?.name ?? null,
        cityLabel,
      })
    }
  }, [analysis, authorityEntry, cityLabel, complaint, effectiveCategoryId, ensureComplaintDraft, sessionId])

  // Print view is portaled outside the app shell so the printed page contains
  // only the complaint document.
  useEffect(() => {
    const existing = document.getElementById('complaint-print-root')
    if (existing) {
      setPrintRoot(existing)
      document.body.classList.add('print-complaint')
      return () => document.body.classList.remove('print-complaint')
    }
    return undefined
  }, [])

  const documentText = useMemo(() => buildComplaintText(complaint), [complaint])

  const handleCopy = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(documentText)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    } finally {
      window.setTimeout(() => setCopyState('idle'), 4000)
    }
  }, [documentText])

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([documentText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = buildComplaintFileName(complaint)
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch {
      setCopyState('error')
    }
  }, [complaint, documentText])

  if (!complaint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Prepare Your Complaint</CardTitle>
          <CardDescription>Preparing the draft…</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The complaint draft is generated from the assessment in this browser. If this message stays here, the
            assessment is no longer in memory — return to the reporting form and analyse the issue again.
          </p>
        </CardContent>
      </Card>
    )
  }

  const addresseeMismatch = desiredAddressee && desiredAddressee !== complaint.addressee

  return (
    <Card id="prepare-complaint" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <PencilLine aria-hidden="true" className="size-4" />
          </span>
          <CardTitle as="h2">Prepare Your Complaint</CardTitle>
        </div>
        <CardDescription>
          A formal complaint drafted from this assessment and your own input. Edit anything you like — this is your
          wording, not the AI&rsquo;s, and nothing is sent from here.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert variant="info" icon={Info} title="AI-assisted draft — review it before you use it">
          <p>
            The draft is assembled from a fixed template and the assessment above. It contains no measurements, cost
            figures or engineering conclusions, because none of them have been verified on site. Check every line,
            correct anything wrong, and add your contact details before sending it.
          </p>
        </Alert>

        {complaint.warnings?.length ? (
          <Alert variant="warning" icon={TriangleAlert} title="Points to check before sending">
            <ul className="space-y-1.5">
              {complaint.warnings.map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-subject">Subject</Label>
              <Input
                id="complaint-subject"
                value={complaint.subject}
                maxLength={MAX_SUBJECT_LENGTH}
                onChange={(event) => updateComplaintDraft({ subject: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {complaint.subject.length}/{MAX_SUBJECT_LENGTH} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaint-addressee">Addressed to</Label>
              <Input
                id="complaint-addressee"
                value={complaint.addressee}
                onChange={(event) => updateComplaintDraft({ addressee: event.target.value })}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Edit this if you know the correct office. CivicFix does not know which officer will handle your
                complaint, so a generic addressee is used until you choose an authority.
              </p>
            </div>

            {addresseeMismatch ? (
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  You selected <span className="font-medium text-foreground">{authorityEntry.name}</span> as the
                  authority below. Use it as the addressee?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateComplaintDraft({ addressee: desiredAddressee })}
                  >
                    Update addressee
                  </Button>
                </div>
              </div>
            ) : null}

            <Separator />

            <CategorySelect
              id="complaint-category"
              value={pendingCategoryId ?? complaint.categoryId ?? effectiveCategoryId}
              onChange={(nextId) => setPendingCategoryId(nextId)}
              hint={
                <>
                  {describeCategorySource(categorySource)}.{' '}
                  {complaint.categoryId !== effectiveCategoryId
                    ? 'The complaint text still uses the previous category — regenerate it or edit the text to match.'
                    : null}
                </>
              }
            />

            {pendingCategoryId && pendingCategoryId !== (complaint.categoryId ?? effectiveCategoryId) ? (
              <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="text-xs leading-relaxed text-amber-900">
                  Change the category to{' '}
                  <span className="font-medium">{getCategoryLabel(pendingCategoryId)}</span>? Regenerating rewrites the
                  subject and the complaint text from the assessment and discards your edits.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onCategoryChange(pendingCategoryId)
                      regenerateComplaint({
                        categoryId: pendingCategoryId,
                        authorityName: authorityEntry?.name ?? null,
                        cityLabel,
                      })
                      setPendingCategoryId(null)
                    }}
                  >
                    <RefreshCw />
                    Regenerate text
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onCategoryChange(pendingCategoryId)
                      // Keep the citizen's wording, only record the new category.
                      updateComplaintDraft({ categoryId: pendingCategoryId })
                      setPendingCategoryId(null)
                    }}
                  >
                    Keep my text
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingCategoryId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Draft details</p>
              <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>Generated {formatDateTime(complaint.generatedAt) ?? 'just now'}</li>
                <li>{complaint.isEdited ? 'You have edited this draft' : 'Not edited yet'}</li>
                <li>Kept in this browser tab for this session only — it is never uploaded.</li>
                <li>
                  {request?.imageName
                    ? `References the photograph ${request.imageName}, which stays on your device.`
                    : 'The photograph is not attached to this document.'}
                </li>
              </ul>
            </div>

            <ConfirmButton
              label="Reset to the generated draft"
              question="Discard your edits?"
              confirmLabel="Discard edits"
              cancelLabel="Keep them"
              icon={RefreshCw}
              className="w-full"
              onConfirm={() => {
                regenerateComplaint({
                  categoryId: pendingCategoryId ?? effectiveCategoryId,
                  authorityName: authorityEntry?.name ?? null,
                  cityLabel,
                })
                setPendingCategoryId(null)
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="complaint-body">Complaint text</Label>
              <Textarea
                id="complaint-body"
                value={complaint.body}
                rows={22}
                spellCheck="true"
                onChange={(event) => updateComplaintDraft({ body: event.target.value })}
                className="font-normal"
                aria-describedby="complaint-body-hint"
              />
              <p id="complaint-body-hint" className="text-xs leading-relaxed text-muted-foreground">
                Plain text. Leave the blank lines intact, or paste this straight into the authority&rsquo;s complaint
                form.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleCopy} variant="default">
                {copyState === 'copied' ? <Check /> : <ClipboardCopy />}
                {copyState === 'copied' ? 'Copied' : 'Copy complaint'}
              </Button>
              <Button onClick={handleDownload} variant="outline">
                <Download />
                Download .txt
              </Button>
              <Button onClick={() => window.print()} variant="outline">
                <Printer />
                Print
              </Button>
            </div>

            <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">
              {copyState === 'copied'
                ? 'Copied to your clipboard. Pasting it into an official portal does not submit it — you still have to press submit there.'
                : copyState === 'error'
                  ? 'Copying or downloading was blocked by the browser. Select the text above and copy it manually.'
                  : 'Copying, downloading or printing a complaint does not submit it to anyone, and CivicFix records no submission.'}
            </p>
          </div>
        </div>
      </CardContent>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <ArrowUp aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Next: choose where to send this in{' '}
            <a href="#find-authority" className="font-medium text-primary underline underline-offset-2">
              Find the Appropriate Authority
            </a>
            , then record what you did in{' '}
            <a href="#submission-status" className="font-medium text-primary underline underline-offset-2">
              Submission status
            </a>
            .
          </p>
        </div>
      </CardContent>

      {printRoot
        ? createPortal(
            <article className="complaint-print-sheet">
              <header className="complaint-print-header">
                <p className="complaint-print-kicker">AI-assisted complaint draft — prepared with CivicFix AI</p>
                <h1>{complaint.subject}</h1>
              </header>
              <p className="complaint-print-addressee">To,</p>
              <p>{complaint.addressee}</p>
              <pre className="complaint-print-body">{complaint.body}</pre>
              {complaint.warnings?.length ? (
                <section>
                  <h2>Points to check before sending</h2>
                  <ul>
                    {complaint.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <footer className="complaint-print-footer">
                <p>
                  This draft was generated in your browser from an AI-assisted assessment. CivicFix is not a government
                  authority and has not submitted this complaint. Review every line before sending it.
                </p>
              </footer>
            </article>,
            printRoot,      ) : null}
    </Card>
  )
}
