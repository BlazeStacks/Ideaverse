import { ArrowLeft, Compass, FileSearch, LayoutDashboard } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { EmptyState } from '@/components/ui/empty-state'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFound() {
  const location = useLocation()
  useDocumentTitle('Page not found')

  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        icon={Compass}
        titleAs="h1"
        title="That page does not exist"
        description={
          <>
            <p>
              Nothing is published at{' '}
              <span className="break-all font-mono text-xs text-foreground">{location.pathname}</span>.
            </p>
            <p>The links below cover everything this build currently implements.</p>
          </>
        }
        actions={
          <>
            <Button asChild>
              <Link to="/report">
                <FileSearch />
                Report an issue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <LayoutDashboard />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">
                <ArrowLeft />
                Home
              </Link>
            </Button>
          </>
        }
      />
    </Container>
  )
}
