import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { SUPPORTED_CITIES } from '@/config/authorityDirectory'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { MAX_IMAGE_SIZE_BYTES, MIN_LOCATION_LENGTH, MAX_LOCATION_LENGTH } from '@/lib/constants'
import { formatFileSize } from '@/lib/format'

const cityList = SUPPORTED_CITIES.map((city) => city.label).join(', ')

/**
 * Help-centre content. `links` render as small inline actions under an answer.
 * Every statement here must stay true to the current build: no automatic
 * submission, no status tracking and no stored reports.
 */
const FAQS = [
  {
    question: 'How do I report a civic issue?',
    answer: [
      'Open Report an Issue, choose a category (or let the AI decide), upload a photo and enter the location. Add optional details if they help, then run the analysis.',
      'You will see the assessment, an editable complaint draft and authority guidance.',
    ],
    links: [{ label: 'Report an Issue', to: '/report' }],
  },
  {
    question: 'What photographs can I upload?',
    answer: [
      `JPEG, PNG or WEBP images up to ${formatFileSize(MAX_IMAGE_SIZE_BYTES)}. Use a clear, well-lit photo that shows the problem itself. Avoid including faces or vehicle number plates where you can.`,
    ],
  },
  {
    question: 'How do I provide my location?',
    answer: [
      `Type a street, landmark or area (${MIN_LOCATION_LENGTH}–${MAX_LOCATION_LENGTH} characters). You can also tap “Use My Location” if your browser allows it.`,
      'Device location can be off by tens or hundreds of metres, so a typed landmark is usually clearer.',
    ],
  },
  {
    question: 'What does the AI assessment tell me?',
    answer: [
      'It describes what the photograph appears to show: the issue category, severity, confidence, observations, safety concerns and a suggested department. It may also include indicative cost and duration figures.',
      'These are preliminary and based on a photo only. They are not quotations, and they can be wrong, so please review them.',
    ],
    links: [{ label: 'More about assessments', to: '/about#assessment' }],
  },
  {
    question: 'Can I edit the generated complaint?',
    answer: [
      'Yes. The draft is only a starting point. Edit it freely, then copy it, download it as a .txt file or print it.',
    ],
  },
  {
    question: 'How do I find the appropriate authority?',
    answer: [
      `On the results page, choose your city and CivicFix shows the bodies that may be responsible, with reasons. The directory currently covers: ${cityList}.`,
      'Only channels checked against the authority’s own website are linked, each with the date it was verified. If your city or issue is not covered, CivicFix says so and explains how to find the office yourself. Suggestions are guidance, not an official ruling on who owns an asset.',
    ],
    links: [{ label: 'How recommendations work', to: '/about#authorities' }],
  },
  {
    question: 'Does CivicFix submit complaints automatically?',
    answer: [
      'No. CivicFix is not a government authority and has no connection to any complaint portal. Generating, copying, downloading or printing a complaint does not submit it. You send it yourself through the authority’s official channel.',
    ],
  },
  {
    question: 'What happens if the AI cannot identify the issue?',
    answer: [
      'The assessment will show low confidence, an “uncertain” result or missing fields, and CivicFix will not fill the gaps with guesses. You can pick the correct category yourself on the results page and edit the complaint.',
      'If the analysis service is unreachable you will see a clear error instead of a result. Try again later, or try a clearer photo.',
    ],
    links: [{ label: 'Try again', to: '/report' }],
  },
  {
    question: 'What happens to my photograph and location?',
    answer: [
      'They are sent once to the analysis service to produce the assessment. CivicFix does not store photographs in your browser or publish them, and it saves a report only when you press Save report on the results page.',
      'Avoid including personal information you do not want analysed.',
    ],
    links: [{ label: 'Privacy and limitations', to: '/about#privacy' }],
  },
  {
    question: 'Can I track whether an authority has resolved my complaint?',
    answer: [
      'Not through CivicFix. It cannot see authority portals, acknowledgements or repair progress, and it does not receive status updates from any government body. Keep the reference number the authority gives you and follow up through their own channel.',
      'The dashboard shows the reports you have saved. Any sample data on it is labelled as demo data.',
    ],
  },
]

const TROUBLESHOOTING = [
  {
    title: 'The upload is rejected',
    text: `Check that the file is a JPEG, PNG or WEBP under ${formatFileSize(MAX_IMAGE_SIZE_BYTES)}.`,
  },
  {
    title: '“Use My Location” does not work',
    text: 'Allow location access in your browser, or simply type the street or landmark instead.',
  },
  {
    title: 'The analysis fails or times out',
    text: 'The analysis service may be unavailable. Wait a moment and try again; nothing is sent to any authority.',
  },
  {
    title: 'My results disappeared after refreshing',
    text: 'Results are kept only in the open tab. If you need the complaint, copy or download it before closing the page.',
  },
]

export default function Help() {
  useDocumentTitle('Help')

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="How can we help?"
        description={<p>Quick answers about reporting an issue, complaints and what CivicFix can and cannot do.</p>}
        actions={
          <Button asChild>
            <Link to="/report">Report an Issue</Link>
          </Button>
        }
      />

      <section className="py-12 sm:py-16" aria-labelledby="faq-heading">
        <Container size="narrow">
          <h2 id="faq-heading" className="mb-6 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            Frequently asked questions
          </h2>

          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {FAQS.map(({ question, answer, links }) => (
              <details key={question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:text-base [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {answer.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {links?.length ? (
                    <p className="flex flex-wrap gap-x-4 gap-y-1">
                      {links.map((link) => (
                        <Link
                          key={link.to + link.label}
                          to={link.to}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {link.label} →
                        </Link>
                      ))}
                    </p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-12 sm:py-16" aria-labelledby="troubleshooting-heading">
        <Container size="narrow">
          <h2 id="troubleshooting-heading" className="mb-6 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            Troubleshooting
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {TROUBLESHOOTING.map(({ title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <dt className="mb-1.5 text-sm font-semibold text-foreground">{title}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-muted-foreground">
            Want the bigger picture?{' '}
            <Link to="/about" className="font-medium text-primary underline-offset-4 hover:underline">
              Read about CivicFix AI
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  )
}
