import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import UploadPanel from '../components/UploadPanel'
import ReconciliationView from '../components/ReconciliationView'
import ApprovalGate from '../components/ApprovalGate'
import CaseTimeline from '../components/CaseTimeline'
import { uploadInvoices, getCase, getCaseInvoices, reconcileCase, createDraft, approveAndFile } from '../api/client'

// Demo defaults — in a real flow these would come from the business's
// profile rather than being hardcoded here.
const DEMO_GSTIN = '27AAAPL1234C1Z9'
const DEMO_PERIOD = '082026'

export default function CaseDetail() {
  const { caseId } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [reconciliation, setReconciliation] = useState([])
  const [draft, setDraft] = useState(null)
  const [filed, setFiled] = useState(false)
  const [ackNumber, setAckNumber] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [filing, setFiling] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    refreshCase()
    loadInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  async function refreshCase() {
    try {
      const data = await getCase(caseId)
      setCaseData(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadInvoices() {
    try {
      const data = await getCaseInvoices(caseId)
      setInvoices(data)
    } catch (err) {
      console.error('Could not load invoices for case', err)
    }
  }

  async function handleUpload(files) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadInvoices(files, caseId)
      setInvoices((prev) => [...prev, ...result.invoices])
      await refreshCase()
    } catch (err) {
      setError('Upload failed — check the backend logs for details.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  async function handleReconcile() {
    setReconciling(true)
    setError(null)
    try {
      const result = await reconcileCase({
        case_id: caseId,
        gstin: DEMO_GSTIN,
        period: DEMO_PERIOD,
        invoices,
      })
      setReconciliation(result.reconciliation)
      await refreshCase()
    } catch (err) {
      setError('Reconciliation failed — check the backend logs for details.')
      console.error(err)
    } finally {
      setReconciling(false)
    }
  }

  async function handleDraft() {
    setError(null)
    try {
      const result = await createDraft({
        case_id: caseId,
        gstin: DEMO_GSTIN,
        period: DEMO_PERIOD,
        invoices,
        reconciliation,
      })
      setDraft(result.draft)
      await refreshCase()
    } catch (err) {
      setError('Could not generate draft — reconciliation may not be complete yet.')
      console.error(err)
    }
  }

  async function handleApprove() {
    setFiling(true)
    setError(null)
    try {
      const result = await approveAndFile({
        case_id: caseId,
        gstin: DEMO_GSTIN,
        period: DEMO_PERIOD,
        return_type: 'GSTR3B',
        draft,
        approved: true,
      })
      setAckNumber(result.acknowledgement_number)
      setFiled(true)
      await refreshCase()
    } catch (err) {
      setError('Filing failed — check that the GSP sandbox credentials are configured.')
      console.error(err)
    } finally {
      setFiling(false)
    }
  }

  const stage = caseData?.stage || 'created'

  return (
    <div>
      <h1 className="page-title">Case detail</h1>
      <p className="page-subtitle">
        <span className="case-id-tag">{caseId}</span>
      </p>

      <div className="ledger-section">
        <div className="ledger-section-title">Status</div>
        <CaseTimeline currentStage={stage} />
      </div>

      <div className="ledger-section">
        <div className="ledger-section-title">Add more invoices</div>
        <UploadPanel onUpload={handleUpload} uploading={uploading} />
      </div>

      <div className="ledger-section">
        <div className="ledger-section-title">Reconciliation</div>
        <ReconciliationView invoices={invoices} reconciliation={reconciliation} />
        {invoices.length > 0 && reconciliation.length === 0 && (
          <button
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={handleReconcile}
            disabled={reconciling}
          >
            {reconciling ? 'Matching against GSTR-2B…' : 'Run reconciliation'}
          </button>
        )}
        {reconciliation.length > 0 && !draft && (
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={handleDraft}>
            Generate return draft
          </button>
        )}
      </div>

      {draft && (
        <div className="ledger-section">
          <div className="ledger-section-title">Approval</div>
          <ApprovalGate
            draft={draft}
            onApprove={handleApprove}
            filing={filing}
            filed={filed}
            acknowledgementNumber={ackNumber}
          />
        </div>
      )}

      {error && <p style={{ color: 'var(--missing)', fontSize: 13.5 }}>{error}</p>}
    </div>
  )
}
