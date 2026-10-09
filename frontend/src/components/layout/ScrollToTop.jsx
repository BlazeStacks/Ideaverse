import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restore the scroll position on navigation: jump to the top on a new route,
 * or to the referenced element when a hash anchor is present.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}
