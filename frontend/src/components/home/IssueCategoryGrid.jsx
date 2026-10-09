import { Link } from 'react-router-dom'

import { Container } from '@/components/ui/container'
import { ISSUE_CATEGORIES } from '@/config/issueCategories'

/**
 * Homepage category showcase — shows 8 representative categories.
 * The full list is available on the reporting form.
 * Category IDs come from the central catalogue so this view can never drift.
 */

// 8 representative category IDs chosen from the full catalogue
const FEATURED_IDS = [
  'road-damage',
  'drainage-sewage',
  'water-supply-leakage',
  'waste-management',
  'streetlights-electrical',
  'traffic-road-safety',
  'footpaths-accessibility',
  'public-infrastructure',
]

const FEATURED = ISSUE_CATEGORIES.filter((c) => FEATURED_IDS.includes(c.id))

export function IssueCategoryGrid() {
  return (
    <section
      id="issue-categories"
      className="scroll-mt-20 py-16 sm:py-24"
      style={{
        background: 'var(--color-navy)',
        borderBottom: '1px solid var(--color-navy-border)',
      }}
    >
      <Container>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow-dark mb-3">Supported issues</p>
            <h2
              className="text-3xl sm:text-4xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-navy-foreground)',
              }}
            >
              What can you report?
            </h2>
          </div>
          <Link
            to="/report"
            className="text-sm font-medium underline-offset-2 hover:underline shrink-0"
            style={{ color: 'var(--color-amber-vivid)' }}
          >
            See all {ISSUE_CATEGORIES.length} categories →
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map((category) => {
            const { Icon } = category
            return (
              <li key={category.id}>
                <Link
                  to="/report"
                  className="flex h-full items-start gap-3 rounded-xl p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    border: '1px solid var(--color-navy-border)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(232,129,10,0.10)'
                    e.currentTarget.style.borderColor = 'rgba(232,129,10,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'var(--color-navy-border)'
                  }}
                >
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: 'rgba(232,129,10,0.12)',
                      color: 'var(--color-amber-vivid)',
                    }}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--color-navy-foreground)',
                      }}
                    >
                      {category.label}
                    </h3>
                    <p
                      className="mt-0.5 text-xs leading-relaxed"
                      style={{ color: 'var(--color-navy-muted)' }}
                    >
                      {category.description}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-sm" style={{ color: 'var(--color-navy-muted)' }}>
          Not sure which fits?{' '}
          <Link
            to="/report"
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--color-amber-vivid)' }}
          >
            Let AI identify it
          </Link>{' '}
          — you can always correct the category afterwards.
        </p>
      </Container>
    </section>
  )
}
