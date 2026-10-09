import { ArrowRight, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export function CtaBand() {
  return (
    <section className="bg-navy py-14 text-navy-foreground sm:py-16">
      <Container className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-2xl leading-tight text-navy-foreground sm:text-3xl">
            Start with a single report
          </h2>
          <p className="text-base leading-relaxed text-navy-muted">
            Submit a photograph and see exactly what the platform is able to tell you. If the analysis backend is not
            running, you will get a clear explanation rather than a plausible-looking result.
          </p>
          <p className="flex items-start gap-2 text-sm text-navy-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-300" />
            No complaint is filed with any authority by this application, and photographs are never stored in your
            browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" variant="onDark">
            <Link to="/report">
              Report an Issue
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="onDarkOutline">
            <Link to="/dashboard">
              <LayoutDashboard />
              Open the dashboard
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
