import { Check, Sparkles, Tag, TriangleAlert } from 'lucide-react'

import { CategorySelect } from '@/components/reports/CategoryPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  describeCategorySource,
  getCategoryLabel,
  getIssueCategory,
  resolveEffectiveCategory,
} from '@/config/issueCategories'

/**
 * Category confirmation.
 *
 * The AI classification is displayed as what it is — a classification of the
 * photograph — and is never written over the citizen's own choice. When the two
 * disagree, both are shown and the citizen decides.
 *
 * @param {{
 *   analysis: object,
 *   userCategoryId: string|null,
 *   effectiveCategoryId: string,
 *   categorySource: 'user'|'ai-suggestion'|'fallback',
 *   onChange: (categoryId: string) => void,
 * }} props
 */
export function CategoryConfirmation({ analysis, userCategoryId, effectiveCategoryId, categorySource, onChange }) {
  const effective = getIssueCategory(effectiveCategoryId)
  const aiSuggestion = resolveEffectiveCategory({ userCategoryId: null, analysis })
  const aiLabel = analysis?.issueType ?? null
  const aiSuggestedCategory = aiSuggestion.source === 'ai-suggestion' ? getIssueCategory(aiSuggestion.categoryId) : null

  const suggestionDiffers = Boolean(aiSuggestedCategory) && aiSuggestedCategory.id !== effectiveCategoryId
  const userChoiceDiffersFromAi =
    categorySource === 'user' &&
    aiLabel &&
    aiSuggestedCategory &&
    aiSuggestedCategory.id !== userCategoryId

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Tag aria-hidden="true" className="size-4" />
          </span>
          <CardTitle as="h3">Issue category</CardTitle>
        </div>
        <CardDescription>
          This category decides how your complaint is titled, which authority is suggested, and which questions were
          asked. Change it here at any time.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Category in use
            </dt>
            <dd className="text-sm font-medium text-foreground">{effective?.label ?? 'Uncategorised'}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">{describeCategorySource(categorySource)}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              AI classification
            </dt>
            <dd className="text-sm font-medium text-foreground">{aiLabel ?? 'Not reported'}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              {aiLabel
                ? 'The label the assessment gave the photograph.'
                : 'The assessment did not return an issue type.'}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your selection
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {userCategoryId ? getCategoryLabel(userCategoryId) : 'Let the AI identify the issue'}
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              Your choice is never replaced automatically.
            </dd>
          </div>
        </dl>

        {userChoiceDiffersFromAi ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              You reported this as <span className="font-medium text-foreground">{getCategoryLabel(userCategoryId)}</span>
              , while the assessment classified the image as{' '}
              <span className="font-medium text-foreground">&ldquo;{aiLabel}&rdquo;</span>. Both are kept: your choice is
              used for the complaint and the authority suggestion. Switch if the photograph says otherwise.
            </p>
          </div>
        ) : null}

        {suggestionDiffers ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
            <Sparkles aria-hidden="true" className="size-4 shrink-0 text-sky-700" />
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-sky-900">
              The assessment looks like{' '}
              <span className="font-medium">{aiSuggestedCategory.label}</span>
              {aiSuggestion.matchedOn ? ` (matched on “${aiSuggestion.matchedOn}”)` : ''}. That was only a suggestion —
              confirm it if you agree.
            </p>
            <Button size="sm" variant="outline" onClick={() => onChange(aiSuggestedCategory.id)}>
              <Check />
              Use this category
            </Button>
          </div>
        ) : null}

        {!aiSuggestedCategory && !userCategoryId && aiLabel ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-amber-700" />
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
              The assessment returned &ldquo;{aiLabel}&rdquo;, which does not map cleanly onto a known category. Pick the
              closest one so the complaint and the authority suggestion stay accurate.
            </p>
            <Badge variant="warning">Manual choice needed</Badge>
          </div>
        ) : null}

        <div className="max-w-sm">
          <CategorySelect
            id="results-category"
            value={effectiveCategoryId}
            onChange={onChange}
            hint="Changing the category does not change the AI classification shown above."
          />
        </div>
      </CardContent>
    </Card>
  )
}
