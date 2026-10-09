import { CircleAlert, CircleCheckBig, GitBranch, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/layout/BrandMark'
import { Container } from '@/components/ui/container'
import { Separator } from '@/components/ui/separator'
import { ISSUE_CATEGORIES } from '@/config/issueCategories'
import { APP_NAME } from '@/lib/constants'

const FOOTER_SECTIONS = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Report an Issue', to: '/report' },
      { label: 'Latest analysis', to: '/results' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} — home`}>
              <BrandMark />
              <span className="text-base font-semibold tracking-tight text-foreground">{APP_NAME}</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A civic-tech platform for reporting infrastructure problems and reviewing AI-assisted
              assessments, severity grading and preliminary repair planning.
            </p>
          </div>

          <nav aria-label="Supported issues" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Supported issues
            </p>
            <ul className="space-y-2">
              {ISSUE_CATEGORIES.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link
                    to="/report"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/#issue-categories"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  All {ISSUE_CATEGORIES.length} categories
                </Link>
              </li>
            </ul>
          </nav>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Build status
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <CircleCheckBig aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>Frontend reporting, results and dashboard interfaces</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>AI analysis requires the separately developed backend</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <CircleCheckBig aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>Complaint drafting and authority guidance (verification marked per channel)</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <ShieldQuestion aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>No complaint is submitted or tracked by CivicFix</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Independent civic-tech project — not affiliated
            with, endorsed by, or integrated with any municipal or government body.
          </p>
          <p className="flex items-center gap-1.5">
            <GitBranch aria-hidden="true" className="size-3.5" />
            Frontend and backend are developed independently in the same repository.
          </p>
        </div>
      </Container>
    </footer>
  )
}
