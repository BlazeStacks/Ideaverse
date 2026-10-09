import { CircleHelp } from 'lucide-react'

import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { getFollowUpQuestions, getIssueCategory } from '@/config/issueCategories'

/**
 * Optional, category-specific questions.
 *
 * Deliberately short: one or two questions per category, every answer optional,
 * and nothing here can block submission. Answers are folded into the
 * `additional_details` text (and into the complaint) because the documented
 * backend contract has no field for them.
 *
 * @param {{
 *   categoryId: string,
 *   answers: Record<string, string>,
 *   onChange: (questionId: string, value: string) => void,
 *   disabled?: boolean,
 * }} props
 */
export function CategoryFollowUps({ categoryId, answers = {}, onChange, disabled = false }) {
  const category = getIssueCategory(categoryId)
  const questions = getFollowUpQuestions(categoryId)

  if (!category || questions.length === 0) return null

  const answeredCount = questions.filter((question) => answers[question.id]).length

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-start gap-2.5">
        <CircleHelp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            A couple of optional questions about {category.label.toLowerCase()}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Answering these helps the authority prioritise the work. Every answer is optional, and you can submit
            without them.
            {answeredCount ? ` ${answeredCount} answered.` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {questions.map((question) => (
          <Field key={question.id} id={`followup-${question.id}`} label={question.label} optional hint={question.helper}>
            {({ id, describedBy }) => (
              <Select
                id={id}
                value={answers[question.id] ?? ''}
                disabled={disabled}
                aria-describedby={describedBy}
                onChange={(event) => onChange(question.id, event.target.value)}
              >
                <option value="">No answer</option>
                {question.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ))}
      </div>
    </div>
  )
}
