import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IngestionPage from './pages/IngestionPage'
import ReconciliationPage from './pages/ReconciliationPage'
import FilingPage from './pages/FilingPage'
import MonitoringPage from './pages/MonitoringPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/case/:caseId" element={<Layout />}>
        <Route index element={<Navigate to="ingestion" replace />} />
        <Route path="ingestion" element={<IngestionPage />} />
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="filing" element={<FilingPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
      </Route>
    </Routes>
  )
}
