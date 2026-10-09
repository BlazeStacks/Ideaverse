import { useEffect } from 'react'

import { APP_NAME } from '@/lib/constants'

/**
 * Set the document title for the active page.
 * @param {string} [title]
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
    return () => {
      document.title = previous
    }
  }, [title])
}
