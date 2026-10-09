import { Check, Sparkles } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AI_DECIDE_CATEGORY_ID, ISSUE_CATEGORIES, getIssueCategory } from '@/config/issueCategories'
import { cn } from '@/lib/utils'

/**
 * Issue category selection.
 *
 * Implemented with native radio inputs styled as cards: keyboard arrow
 * navigation, screen-reader semantics and the selected state all come from the
 * platform, so no custom keyboard handling can drift out of sync.
 *
 * "Let the AI identify the issue" is offered as an explicit option rather than
 * a default the citizen cannot see.
 *
 * @param {{
 *   value: string,
 *   onChange: (categoryId: string) => void,
 *   disabled?: boolean,
 *   describedBy?: string,
 * }} props
 */
export function CategoryPicker({ value, onChange, disabled = false, describedBy }) {
  const selected = getIssueCategory(value)

  return (
    <fieldset disabled={disabled} aria-describedby={describedBy} className="space-y-4">
      <legend className="sr-only">Issue category</legend>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CategoryCard
          id={AI_DECIDE_CATEGORY_ID}
          label="Let AI identify the issue"
          description="Not sure which category fits? The assessment will classify the problem from your photograph. You can change it afterwards."
          Icon={Sparkles}
          isSelected={value === AI_DECIDE_CATEGORY_ID}
          onSelect={onChange}
        />

        {ISSUE_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            id={category.id}
            label={category.label}
            description={category.description}
            commonIssues={category.commonIssues}
            Icon={category.Icon}
            isSelected={value === category.id}
            onSelect={onChange}
          />
        ))}
      </div>

      <p aria-live="polite" className="text-xs leading-relaxed text-muted-foreground">
        {selected
          ? `Selected: ${selected.label}. The optional questions below are tailored to this category.`
          : 'Selected: let the AI identify the issue. The assessment will classify it from the photograph.'}
      </p>
    </fieldset>
  )
}

function CategoryCard({ id, label, description, commonIssues = [], Icon, isSelected, onSelect }) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
        isSelected
          ? 'border-primary bg-secondary/60 ring-1 ring-primary'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50',
      )}
    >
      <input
        type="radio"
        name="issue-category"
        value={id}
        checked={isSelected}
        onChange={() => onSelect(id)}
        className="sr-only"
      />

      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg border',
          isSelected ? 'border-primary/40 bg-card text-primary' : 'border-border bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4.5" />
      </span>

      <span className="min-w-0 flex-1 pr-5">
        <span className={cn('block text-sm font-semibold', isSelected ? 'text-secondary-foreground' : 'text-foreground')}>
          {label}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>

        {isSelected && commonIssues.length ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {commonIssues.map((issue) => (
              <span
                key={issue}
                className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {issue}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      {isSelected ? (
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="size-3" />
        </span>
      ) : null}
    </label>
  )
}

/**
 * Compact category selector used where a full grid would be too heavy — for
 * example correcting the category while preparing a complaint.
 *
 * @param {{
 *   id: string,
 *   value: string,
 *   onChange: (categoryId: string) => void,
 *   label?: React.ReactNode,
 *   includeAiOption?: boolean,
 *   disabled?: boolean,
 *   hint?: React.ReactNode,
 * }} props
 */
export function CategorySelect({
  id,
  value,
  onChange,
  label = 'Issue category',
  includeAiOption = false,
  disabled = false,
  hint,
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {includeAiOption ? <option value={AI_DECIDE_CATEGORY_ID}>Let the AI identify the issue</option> : null}
        {ISSUE_CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </Select>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
