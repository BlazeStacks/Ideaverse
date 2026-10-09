import { CircleAlert, CircleCheckBig, GitBranch, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/layout/BrandMark'
import { Container } from '@/components/ui/container'
import { APP_NAME } from '@/lib/constants'

const NAV_COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Report an Issue', to: '/report' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Help', to: '/help' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
          {/* Brand col */}
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label={`${APP_NAME} — home`}
            >
              <BrandMark />
              <span
                className="text-base font-bold tracking-tight text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {APP_NAME}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A civic-tech tool that helps you document infrastructure problems and prepare clearer
              reports — not a government authority or official complaint portal.
            </p>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map((section) => (
            <nav key={section.title} aria-label={section.title} className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
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

          {/* Build status */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Build status
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <CircleCheckBig
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: 'var(--color-success)' }}
                />
                <span>Report, results and dashboard interfaces</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: 'var(--color-warning)' }}
                />
                <span>AI analysis — requires the separately developed backend</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <CircleCheckBig
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: 'var(--color-success)' }}
                />
                <span>Complaint drafting and authority guidance</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <ShieldQuestion
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <span>No complaint is submitted or tracked by CivicFix</span>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="my-8 h-px"
          style={{ background: 'var(--color-border)' }}
          role="separator"
        />

        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Independent civic-tech project — not
            affiliated with, endorsed by or integrated with any government body.
          </p>
          <p className="flex items-center gap-1.5">
            <GitBranch aria-hidden="true" className="size-3.5" />
            Frontend and backend developed independently.
          </p>
        </div>
      </Container>
    </footer>
  )
}
