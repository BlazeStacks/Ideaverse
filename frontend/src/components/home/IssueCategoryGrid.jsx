import { Link } from 'react-router-dom'

import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { ISSUE_CATEGORIES } from '@/config/issueCategories'

/**
 * Supported issue categories, rendered straight from the central catalogue so the
 * landing page can never drift from what the reporting form actually offers.
 */
export function IssueCategoryGrid() {
  return (
    <section id="issue-categories" className="scroll-mt-20 border-b border-border bg-card py-14 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          eyebrow="Supported categories"
          title="Civic problems this platform is built for"
          description="Eleven categories cover the problems citizens report most often. The category you choose tailors the optional questions, the complaint subject and the authority suggestions — and you can always correct it after the assessment."
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ISSUE_CATEGORIES.map((category) => {
            const { Icon } = category

            return (
              <li key={category.id}>
                <Link
                  to="/report"
                  className="flex h-full flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-primary">
                    <Icon aria-hidden="true" className="size-4.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{category.description}</p>
                  <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {category.commonIssues.map((issue) => (
                      <li
                        key={issue}
                        className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {issue}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="text-sm text-muted-foreground">
          Not sure which one fits? Choose <span className="font-medium text-foreground">Let AI identify the issue</span> on
          the reporting form and correct the category afterwards — CivicFix never replaces your own choice silently.
        </p>
      </Container>
    </section>
  )
}
