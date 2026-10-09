import { AssessmentSection } from '@/components/home/AssessmentSection'
import { AuthorityGuidanceSection } from '@/components/home/AuthorityGuidanceSection'
import { ComplaintPrepSection } from '@/components/home/ComplaintPrepSection'
import { CtaBand } from '@/components/home/CtaBand'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { IssueCategoryGrid } from '@/components/home/IssueCategoryGrid'
import { TransparencySection } from '@/components/home/TransparencySection'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function Home() {
  useDocumentTitle('Turn a photo of a civic problem into a report you can send')

  return (
    <>
      <Hero />
      <HowItWorks />
      <IssueCategoryGrid />
      <AssessmentSection />
      <ComplaintPrepSection />
      <AuthorityGuidanceSection />
      <TransparencySection />
      <CtaBand />
    </>
  )
}
