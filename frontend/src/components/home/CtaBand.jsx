import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export function CtaBand() {
  return (
    <section
      className="py-16 sm:py-24"
      style={{ background: 'var(--color-navy)' }}
    >
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow-dark mb-4">Get started</p>
          <h2
            className="mb-4 text-3xl sm:text-4xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-navy-foreground)',
            }}
          >
            Spotted a civic problem?
          </h2>
          <p
            className="mb-7 text-base leading-[1.7]"
            style={{ color: 'var(--color-navy-muted)' }}
          >
            Turn what you see into a clearer report and find out how to take the next step.
          </p>
          <Button asChild size="lg">
            <Link to="/report">
              Report an Issue
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
