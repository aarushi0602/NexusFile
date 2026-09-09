import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  FileText, 
  Layers,
  X,
  Plus
} from 'lucide-react'
import { uploadInvoices, getCaseInvoices } from '../api/client'

const BASELINE_INVOICES = [
  {
    invoice_id: 'inv-base-1',
    invoice_number: 'INV-2024-089',
    type: 'B2B Invoice',
    vendor_name: 'TechCorp India Pvt Ltd',
    vendor_gstin: '27AABCV9603R1Z2',
    total_amount: 125000,
    status: 'extracted',
  },
  {
    invoice_id: 'inv-base-2',
    invoice_number: 'EWB-8839201',
    type: 'E-Way Bill',
    vendor_name: 'Logistics Hub Ltd',
    vendor_gstin: '27AAACH1234F1Z1',
    total_amount: 45600,
    status: 'requires_review',
  },
  {
    invoice_id: 'inv-base-3',
    invoice_number: 'STMT-JULY-HDFC',
    type: 'Bank Statement',
    vendor_name: 'HDFC Bank',
    vendor_gstin: '',
    total_amount: null,
    status: 'processing',
  },
]

function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function IngestionPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [invoices, setInvoices] = useState(BASELINE_INVOICES)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showFullLog, setShowFullLog] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [caseId])

  async function loadInvoices() {
    try {
      const data = await getCaseInvoices(caseId)
      if (data && data.length > 0) {
        // Merge with base table structure
        const formatted = data.map((inv) => ({
          ...inv,
          type: inv.category ? `${inv.category.replace('_', ' ').toUpperCase()}` : 'B2B Invoice',
          status: inv.vendor_gstin ? 'extracted' : 'requires_review',
        }))
        setInvoices(formatted)
      }
    } catch (err) {
      console.warn('Using baseline invoices for display:', err)
    }
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return
    setUploading(true)
    const fileList = Array.from(files)
    try {
      const res = await uploadInvoices(fileList, caseId)
      if (res && res.invoices) {
        const newRows = res.invoices.map((inv) => ({
          ...inv,
          type: 'B2B Invoice',
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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div>
      {/* Section 1: Compliance Health Overview */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Compliance Health Overview
        </h2>

        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-card-label">TOTAL ITC CAPTURED</div>
            <div className="stat-card-value">₹45.2L</div>
            <div className="stat-card-sub trend-up">
              ↗ +12% vs last month
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">PENDING RECONCILIATION</div>
            <div className="stat-card-value">₹12.8L</div>
            <div className="stat-card-sub">
              42 invoices pending
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">AGENT CONFIDENCE SCORE</div>
            <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>94%</div>
            <div className="stat-card-sub">
              High accuracy on latest batch
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid-2col">
        {/* Left main: Ingestion Agent & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Ingestion Agent Dropzone */}
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
                Upload Invoices, E-Way Bills, or Bank Statements. The agent will automatically extract and categorize data.
              </div>
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={uploading}
              >
                {uploading ? 'Extracting with Document AI…' : 'Browse Files'}
              </button>
            </div>
          </div>

          {/* Recently Ingested Table */}
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

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>DOCUMENT ID</th>
                    <th>TYPE</th>
                    <th>SUPPLIER</th>
                    <th>AMOUNT (₹)</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr 
                      key={inv.invoice_id || idx}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDoc(inv)}
                    >
                      <td className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {inv.type || 'B2B Invoice'}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {inv.vendor_name}
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {inv.total_amount ? formatCurrency(inv.total_amount) : '—'}
                      </td>
                      <td>
                        {inv.status === 'extracted' && (
                          <span className="pill pill-accent">EXTRACTED</span>
                        )}
                        {inv.status === 'requires_review' && (
                          <span className="pill pill-danger">REQUIRES REVIEW</span>
                        )}
                        {inv.status === 'processing' && (
                          <span className="pill pill-neutral">PROCESSING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side: Agent Activity Feed */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <span className="dot dot-success" />
              <span>Agent Activity</span>
            </div>
          </div>

          <div className="activity-feed">
            {/* Activity 1 */}
            <div className="activity-card-item">
              <div className="activity-card-header">
                <div className="activity-card-title">
                  <CheckCircle2 size={15} color="#059669" />
                  <span>Extraction Complete</span>
                </div>
                <span className="activity-card-time">10:42 AM</span>
              </div>
              <div className="activity-card-desc">
                Successfully extracted 15 data points from <strong>INV-2024-089</strong>.
                <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  GSTIN detected: 27AABCV9603R1Z2
                </div>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="activity-card-item" style={{ borderColor: '#FECACA' }}>
              <div className="activity-card-header">
                <div className="activity-card-title" style={{ color: '#DC2626' }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span>Discrepancy Flagged</span>
                </div>
                <span className="activity-card-time">10:38 AM</span>
              </div>
              <div className="activity-card-desc">
                HSN code mismatch on <strong>EWB-8839201</strong>. Requires human verification.
              </div>
              <div className="activity-card-action">
                <button 
                  className="btn btn-outline-primary" 
                  style={{ fontSize: 11.5, padding: '4px 10px', color: '#DC2626', borderColor: '#FECACA' }}
                  onClick={() => navigate(`/case/${caseId}/reconciliation`)}
                >
                  Review Now
                </button>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="activity-card-item">
              <div className="activity-card-header">
                <div className="activity-card-title">
                  <Layers size={15} color="#2563EB" />
                  <span>Batch Uploaded</span>
                </div>
                <span className="activity-card-time">10:15 AM</span>
              </div>
              <div className="activity-card-desc">
                Received 45 new documents via email ingestion channel.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', fontSize: 12 }}
              onClick={() => setShowFullLog(true)}
            >
              View Full Log
            </button>
          </div>
        </div>
      </div>

      {/* Document Detail Modal */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
                <span className="num" style={{ fontWeight: 700 }}>₹{formatCurrency(selectedDoc.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Agent Confidence:</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>98.2%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => setSelectedDoc(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Activity Log Modal */}
      {showFullLog && (
        <div className="modal-backdrop" onClick={() => setShowFullLog(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agent Execution Audit Log</h3>
              <button className="modal-close-btn" onClick={() => setShowFullLog(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="activity-card-item">
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>10:42:15 AM - IngestionAgent</div>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>Normalized 15 fields for invoice INV-2024-089 via Document AI processor.</div>
              </div>
              <div className="activity-card-item">
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>10:38:04 AM - ClassificationAgent</div>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>Flagged HSN code variance for Logistics Hub Ltd against GST tariff table.</div>
              </div>
              <div className="activity-card-item">
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>10:15:00 AM - IngestionAgent</div>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>Automated mailbox polling retrieved 45 PDF attachments.</div>
              </div>
              <div className="activity-card-item">
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>09:30:20 AM - Orchestrator</div>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>Initialized case workflow for Period July 2024.</div>
              </div>
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
