import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  X,
} from 'lucide-react'
import { uploadInvoices, getCaseInvoices } from '../api/client'

function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
}

function formatCompact(amount) {
  if (!amount) return '\u20b90'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 1, notation: 'compact',
  }).format(amount)
}

export default function IngestionPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [invoices, setInvoices] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showFullLog, setShowFullLog] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  async function loadInvoices() {
    try {
      const data = await getCaseInvoices(caseId)
      setInvoices(
        (data || []).map((inv) => ({
          ...inv,
          type: inv.category ? inv.category.replace('_', ' ').toUpperCase() : 'INVOICE',
          status: inv.vendor_gstin ? 'extracted' : 'requires_review',
        }))
      )
    } catch (err) {
      console.error('Could not load invoices for case', err)
    } finally {
      setLoaded(true)
    }
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const res = await uploadInvoices(Array.from(files), caseId)
      if (res && res.invoices) {
        const newRows = res.invoices.map((inv) => ({
          ...inv,
          type: inv.category ? inv.category.replace('_', ' ').toUpperCase() : 'INVOICE',
          status: inv.vendor_gstin ? 'extracted' : 'requires_review',
        }))
        setInvoices((prev) => [...newRows, ...prev])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files)
  }

  const totalITC = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0)
  const totalPendingValue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const extractedCount = invoices.filter((inv) => inv.status === 'extracted').length
  const confidenceScore = invoices.length > 0
    ? Math.round((extractedCount / invoices.length) * 100)
    : null
  const flaggedCount = invoices.filter((inv) => inv.status === 'requires_review').length

  const activityItems = []
  invoices.slice(0, 4).forEach((inv) => {
    if (inv.status === 'requires_review') {
      activityItems.push({
        key: `flag-${inv.invoice_id}`,
        type: 'warning',
        title: 'Discrepancy Flagged',
        desc: <>Missing GSTIN on <strong>{inv.invoice_number}</strong>. Requires human verification.</>,
        action: true,
      })
    } else {
      activityItems.push({
        key: `ok-${inv.invoice_id}`,
        type: 'success',
        title: 'Extraction Complete',
        desc: (
          <>
            Successfully extracted <strong>{inv.invoice_number}</strong> from {inv.vendor_name}.
            <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              GSTIN detected: {inv.vendor_gstin}
            </div>
          </>
        ),
      })
    }
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Compliance Health Overview
        </h2>

        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-card-label">TOTAL ITC CAPTURED</div>
            <div className="stat-card-value">{formatCompact(totalITC)}</div>
            <div className="stat-card-sub">
              {invoices.length > 0 ? `Across ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}` : 'Upload invoices to begin'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">PENDING RECONCILIATION</div>
            <div className="stat-card-value">{formatCompact(totalPendingValue)}</div>
            <div className="stat-card-sub">
              {invoices.length > 0 ? `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} awaiting match` : 'No invoices yet'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">AGENT CONFIDENCE SCORE</div>
            <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>
              {confidenceScore != null ? `${confidenceScore}%` : '\u2014'}
            </div>
            <div className="stat-card-sub">
              {flaggedCount > 0 ? `${flaggedCount} invoice${flaggedCount !== 1 ? 's' : ''} need review` : (invoices.length > 0 ? 'All invoices extracted cleanly' : 'No data yet')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <Sparkles size={17} color="var(--secondary)" />
                <span>Ingestion Agent</span>
              </div>
            </div>

            <div
              className={`dropzone-container ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="dropzone-icon-box">
                <UploadCloud size={24} />
              </div>
              <div className="dropzone-title">Drag & Drop Documents Here</div>
              <div className="dropzone-subtitle">
                Upload invoices, e-way bills, or bank statements. The agent will automatically extract and categorize data.
              </div>
              <button type="button" className="btn btn-secondary" disabled={uploading}>
                {uploading ? 'Extracting with Document AI\u2026' : 'Browse Files'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>Recently Ingested</span>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => navigate(`/case/${caseId}/reconciliation`)}
              >
                View All <ArrowUpRight size={13} />
              </button>
            </div>

            {!loaded ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading\u2026</p>
            ) : invoices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No documents yet</div>
                <p>Upload invoices above to see them extracted here.</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DOCUMENT ID</th>
                      <th>TYPE</th>
                      <th>SUPPLIER</th>
                      <th>AMOUNT (\u20b9)</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => (
                      <tr key={inv.invoice_id || idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedDoc(inv)}>
                        <td className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{inv.type || 'INVOICE'}</td>
                        <td style={{ fontWeight: 500 }}>{inv.vendor_name}</td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          {inv.total_amount ? formatCurrency(inv.total_amount) : '\u2014'}
                        </td>
                        <td>
                          {inv.status === 'extracted' && <span className="pill pill-accent">EXTRACTED</span>}
                          {inv.status === 'requires_review' && <span className="pill pill-danger">REQUIRES REVIEW</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <span className="dot dot-success" />
              <span>Agent Activity</span>
            </div>
          </div>

          <div className="activity-feed">
            {activityItems.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                No activity yet \u2014 upload a document to get started.
              </p>
            ) : (
              activityItems.map((item) => (
                <div
                  className="activity-card-item"
                  key={item.key}
                  style={item.type === 'warning' ? { borderColor: '#FECACA' } : undefined}
                >
                  <div className="activity-card-header">
                    <div className="activity-card-title" style={item.type === 'warning' ? { color: '#DC2626' } : undefined}>
                      {item.type === 'warning'
                        ? <AlertTriangle size={15} color="#DC2626" />
                        : <CheckCircle2 size={15} color="#059669" />}
                      <span>{item.title}</span>
                    </div>
                  </div>
                  <div className="activity-card-desc">{item.desc}</div>
                  {item.action && (
                    <div className="activity-card-action">
                      <button
                        className="btn btn-outline-primary"
                        style={{ fontSize: 11.5, padding: '4px 10px', color: '#DC2626', borderColor: '#FECACA' }}
                        onClick={() => navigate(`/case/${caseId}/reconciliation`)}
                      >
                        Review Now
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {invoices.length > 0 && (
            <div style={{ marginTop: 18, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button className="btn btn-secondary" style={{ width: '100%', fontSize: 12 }} onClick={() => setShowFullLog(true)}>
                View Full Log
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedDoc && (
        <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Document Inspection</h3>
              <button className="modal-close-btn" onClick={() => setSelectedDoc(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Document ID:</span>
                <span className="mono" style={{ fontWeight: 600 }}>{selectedDoc.invoice_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Supplier:</span>
                <span style={{ fontWeight: 600 }}>{selectedDoc.vendor_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Supplier GSTIN:</span>
                <span className="mono">{selectedDoc.vendor_gstin || 'Not detected (flagged)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
                <span className="num" style={{ fontWeight: 700 }}>\u20b9{formatCurrency(selectedDoc.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => setSelectedDoc(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFullLog && (
        <div className="modal-backdrop" onClick={() => setShowFullLog(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agent Execution Log</h3>
              <button className="modal-close-btn" onClick={() => setShowFullLog(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {invoices.map((inv, idx) => (
                <div className="activity-card-item" key={idx}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IngestionAgent</div>
                  <div style={{ fontSize: 12.5, marginTop: 2 }}>
                    Extracted {inv.invoice_number} from {inv.vendor_name} via Document AI.
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setShowFullLog(false)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
