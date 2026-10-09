import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { BrandMark } from '@/components/layout/BrandMark'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { APP_NAME, NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

function navLinkClassName({ isActive }) {
  return cn(
    'relative px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-lg',
    isActive
      ? 'text-foreground bg-muted'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-all duration-200',
        scrolled
          ? 'border-border bg-card/96 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
          : 'border-transparent bg-card/90 backdrop-blur-sm',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`${APP_NAME} — home`}
        >
          <BrandMark />
          <span className="flex flex-col leading-tight">
            <span
              className="text-base font-bold tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {APP_NAME}
            </span>
            <span className="hidden text-[10px] font-medium tracking-wide uppercase text-muted-foreground sm:block">
              Civic infrastructure
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClassName}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/report">Report an Issue</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </Container>

      {/* Mobile menu */}
      {isMenuOpen ? (
        <div id="mobile-navigation" className="border-t border-border bg-card md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button asChild className="mt-2 w-full">
              <Link to="/report">Report an Issue</Link>
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  )
}
