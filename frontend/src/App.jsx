import { Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AnalysisProvider } from '@/context/AnalysisContext'
import Dashboard from '@/pages/Dashboard'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import ReportDetail from '@/pages/ReportDetail'
import ReportIssue from '@/pages/ReportIssue'
import ReportResults from '@/pages/ReportResults'

/**
 * Route table.
 *
 * /results reads the in-memory analysis session, so it must live inside the
 * AnalysisProvider. Dashboard detail pages are nested under /dashboard so the
 * reports workspace keeps a single entry point.
 */
export default function App() {
  return (
    <AnalysisProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/results" element={<ReportResults />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/reports/:reportId" element={<ReportDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnalysisProvider>
  )
}
