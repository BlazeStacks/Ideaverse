import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AssessmentSection } from '@/components/about/AssessmentSection'
import { AuthorityGuidanceSection } from '@/components/about/AuthorityGuidanceSection'
import { ComplaintPrepSection } from '@/components/about/ComplaintPrepSection'
import { TransparencySection } from '@/components/about/TransparencySection'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function About() {
  useDocumentTitle('About')

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Making civic problems easier to report"
        description={
          <p>
            CivicFix AI helps you turn a photograph of a public-infrastructure problem into a clear
            assessment and a complaint draft, and points you to the authority that may be
            responsible. It is an independent tool, not a government service.
          </p>
        }
        actions={
          <Button asChild>
            <Link to="/report">
              Report an Issue
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <section className="border-b border-border py-10 sm:py-12">
        <Container>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            <strong className="text-foreground">In short:</strong> you upload a photo and a
            location, review the AI assessment, edit the complaint draft, and then send it
            yourself through the authority’s own channel. Questions about using the site?{' '}
            <Link to="/help" className="font-medium text-primary underline-offset-4 hover:underline">
              Visit the Help page
            </Link>
            .
          </p>
        </Container>
      </section>

      <AssessmentSection />
      <ComplaintPrepSection />
      <AuthorityGuidanceSection />
      <TransparencySection />
    </>
  )
}
