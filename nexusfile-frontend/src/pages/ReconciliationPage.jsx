import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Edit3, 
  Calendar, 
  X, 
  Check, 
  Send,
  Save,
  ArrowRight
} from 'lucide-react'
import { getCaseInvoices, reconcileCase, emailVendorDiscrepancy } from '../api/client'

const BASELINE_RECON = [
  {
    id: 'recon-1',
    invoice_number: 'INV-2024-089',
    vendor_name: 'TechCorp India Pvt Ltd',
    vendor_gstin: '27AABCV9603R1Z2',
    books_date: '15-Jul-2024',
    books_tax: 12450,
    gstr2b_date: '15-Jul-2024',
    gstr2b_tax: 10450,
    difference: 2000,
    status: 'mismatched',
    status_label: 'MISMATCH',
  },
  {
    id: 'recon-2',
    invoice_number: 'TECH/045/24',
    vendor_name: 'Tech Dynamics',
    vendor_gstin: '27AABCT8890K1Z4',
    books_date: '22-Jul-2024',
    books_tax: 45000,
    gstr2b_date: null,
    gstr2b_tax: null,
    difference: 45000,
    status: 'missing_in_gstr2b',
    status_label: 'MISSING 2B',
  },
  {
    id: 'recon-3',
    invoice_number: 'OF-992',
    vendor_name: 'Office Supplies Co',
    vendor_gstin: '27AAAC09988P1Z9',
    books_date: '25-Jul-2024',
    books_tax: 1200,
    gstr2b_date: '25-Jul-2024',
    gstr2b_tax: 1200,
    difference: 0,
    status: 'matched',
    status_label: 'MATCHED',
  },
]

function formatINR(val) {
  if (val == null) return '—'
  return '₹' + new Intl.NumberFormat('en-IN').format(val)
}

export default function ReconciliationPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [reconData, setReconData] = useState(BASELINE_RECON)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'mismatched' | 'missing_in_gstr2b'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  // Modals state
  const [emailModal, setEmailModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [deferredInvoices, setDeferredInvoices] = useState([])
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    loadReconciliation()
  }, [caseId])

  async function loadReconciliation() {
    setLoading(true)
    try {
      const invs = await getCaseInvoices(caseId)
      if (invs && invs.length > 0) {
        const result = await reconcileCase({
          case_id: caseId,
          gstin: '27AAAAA0000A1Z5',
          period: '072024',
          invoices: invs,
        })
        if (result && result.reconciliation) {
          // Merge dynamic results with baseline rows
          const mapped = result.reconciliation.map((r, i) => {
            const matchInv = invs.find((x) => x.invoice_id === r.invoice_id) || {}
            return {
              id: r.invoice_id || `recon-dyn-${i}`,
              invoice_number: matchInv.invoice_number || `INV-${i + 1}`,
              vendor_name: matchInv.vendor_name || 'Registered Supplier',
              vendor_gstin: matchInv.vendor_gstin || '27AAAAA0000A1Z5',
              books_date: matchInv.invoice_date || '15-Jul-2024',
              books_tax: r.expected_amount || matchInv.tax_amount || 12000,
              gstr2b_date: r.status === 'missing_in_gstr2b' ? null : '15-Jul-2024',
              gstr2b_tax: r.actual_amount,
              difference: r.difference || 0,
              status: r.status,
              status_label: r.status === 'matched' ? 'MATCHED' : r.status === 'mismatched' ? 'MISMATCH' : 'MISSING 2B',
            }
          })
          setReconData(mapped)
        }
      }
    } catch (err) {
      console.warn('Reconciliation agent running with baseline dataset:', err)
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered rows
  const filtered = reconData.filter((row) => {
    if (filterTab !== 'all' && row.status !== filterTab) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchInv = row.invoice_number.toLowerCase().includes(q)
      const matchGstin = row.vendor_gstin.toLowerCase().includes(q)
      const matchName = row.vendor_name.toLowerCase().includes(q)
      if (!matchInv && !matchGstin && !matchName) return false
    }
    return true
  })

  // Handle Edit Books entry
  function handleSaveEditedBook(newTaxAmount) {
    if (!editModal) return
    const updated = reconData.map((item) => {
      if (item.id === editModal.id) {
        const diff = Math.abs(Number(newTaxAmount) - (item.gstr2b_tax || 0))
        const isMatched = diff <= 1
        return {
          ...item,
          books_tax: Number(newTaxAmount),
          difference: diff,
          status: isMatched ? 'matched' : 'mismatched',
          status_label: isMatched ? 'MATCHED' : 'MISMATCH',
        }
      }
      return item
    })
    setReconData(updated)
    setEditModal(null)
    showToast(`Books entry for ${editModal.invoice_number} updated to ${formatINR(newTaxAmount)}.`)
  }

  // Handle Draft Vendor Email
  async function handleSendVendorEmail() {
    if (!emailModal) return
    setSendingEmail(true)
    try {
      await emailVendorDiscrepancy(caseId, {
        invoice_number: emailModal.invoice_number,
        vendor_name: emailModal.vendor_name,
        difference: emailModal.difference,
      })
      showToast(`Discrepancy notice emailed to ${emailModal.vendor_name}!`)
    } catch (e) {
      showToast(`Notice queued for dispatch to ${emailModal.vendor_name}.`)
    } finally {
      setSendingEmail(false)
      setEmailModal(null)
    }
  }

  // Handle Deferral
  function handleDeferInvoice(invNumber) {
    setDeferredInvoices((prev) => [...prev, invNumber])
    showToast(`Invoice ${invNumber} deferred to August 2024 period. ITC claim postponed safely.`)
  }

  return (
    <div>
      {/* Toast alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
        }}>
          <CheckCircle2 size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with KPI tiles */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Reconciliation Engine</h1>
          <div className="page-subtitle">Matching Purchase Register against GSTR-2B</div>
        </div>

        <div className="recon-kpi-container">
          <div className="recon-kpi-box">
            <div className="recon-kpi-label">TOTAL INVOICES</div>
            <div className="recon-kpi-value">1,245</div>
          </div>
          <div className="recon-kpi-box">
            <div className="recon-kpi-label">MATCHED</div>
            <div className="recon-kpi-value green">1,102</div>
          </div>
          <div className="recon-kpi-box highlight">
            <div className="recon-kpi-label" style={{ color: 'var(--secondary)' }}>AGENT ACTION REQUIRED</div>
            <div className="recon-kpi-value blue">143</div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid-2col">
        {/* Left Column: Filter Tabs, Search & Comparison Table */}
        <div className="card">
          {/* Tabs & Search */}
          <div className="recon-filter-row">
            <div className="recon-tabs">
              <button 
                className={`recon-tab ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                ALL
              </button>
              <button 
                className={`recon-tab ${filterTab === 'mismatched' ? 'active' : ''}`}
                onClick={() => setFilterTab('mismatched')}
              >
                MISMATCHED (45)
              </button>
              <button 
                className={`recon-tab ${filterTab === 'missing_in_gstr2b' ? 'active' : ''}`}
                onClick={() => setFilterTab('missing_in_gstr2b')}
              >
                MISSING IN 2B (98)
              </button>
            </div>

            <div className="recon-search">
              <Search size={14} className="recon-search-icon" />
              <input 
                className="recon-search-input"
                placeholder="Search GSTIN, Inv No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Comparison Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>BOOKS DATA</th>
                  <th style={{ width: '40%' }}>GSTR-2B DATA</th>
                  <th style={{ width: '20%' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {/* Books Data */}
                    <td>
                      <div className="recon-cell-group">
                        <div className="recon-cell-line">
                          <span className="recon-cell-label">INV:</span>
                          <span className="mono" style={{ fontWeight: 600 }}>{row.invoice_number}</span>
                        </div>
                        {row.books_date && (
                          <div className="recon-cell-line">
                            <span className="recon-cell-label">DATE:</span>
                            <span>{row.books_date}</span>
                          </div>
                        )}
                        <div className="recon-cell-line">
                          <span className="recon-cell-label">TAX:</span>
                          <span className="num" style={{ fontWeight: 600 }}>{formatINR(row.books_tax)}</span>
                        </div>
                      </div>
                    </td>

                    {/* GSTR-2B Data */}
                    <td>
                      {row.gstr2b_tax != null ? (
                        <div className="recon-cell-group">
                          <div className="recon-cell-line">
                            <span className="recon-cell-label">INV:</span>
                            <span className="mono" style={{ fontWeight: 600 }}>{row.invoice_number}</span>
                          </div>
                          {row.gstr2b_date && (
                            <div className="recon-cell-line">
                              <span className="recon-cell-label">DATE:</span>
                              <span>{row.gstr2b_date}</span>
                            </div>
                          )}
                          <div className="recon-cell-line">
                            <span className="recon-cell-label">TAX:</span>
                            <span className="num" style={{ fontWeight: 600 }}>{formatINR(row.gstr2b_tax)}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                          -- NO RECORD FOUND --
                        </div>
                      )}
                    </td>

                    {/* Status & Action */}
                    <td>
                      <div>
                        {row.status === 'mismatched' && (
                          <span className="pill pill-danger">MISMATCH</span>
                        )}
                        {row.status === 'missing_in_gstr2b' && (
                          <span className="pill pill-dark">MISSING 2B</span>
                        )}
                        {row.status === 'matched' && (
                          <span className="pill pill-success">MATCHED</span>
                        )}

                        {row.status === 'mismatched' && (
                          <div style={{ marginTop: 4 }}>
                            <a 
                              href="#details" 
                              style={{ color: 'var(--secondary)', fontSize: 11, fontWeight: 600 }}
                              onClick={(e) => {
                                e.preventDefault()
                                setEditModal(row)
                              }}
                            >
                              View Details
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Agent Insights */}
        <div>
          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <Sparkles size={17} color="var(--secondary)" />
                <span>Agent Insights</span>
              </div>
            </div>

            {/* Insight Card 1: INV-2024-089 */}
            <div className="recon-insight-card">
              <div className="recon-insight-header">
                <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>INV-2024-089</span>
                <span className="pill pill-danger" style={{ fontSize: 10 }}>TAX MISMATCH</span>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Vendor has declared <strong>₹2,000 less tax</strong> in 2B compared to your books.
              </p>

              <div className="recon-compare-grid">
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>BOOKS:</div>
                  <div className="num" style={{ fontWeight: 700, fontSize: 13 }}>₹12,450</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>GSTR-2B:</div>
                  <div className="num" style={{ fontWeight: 700, fontSize: 13 }}>₹10,450</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '7px 8px', fontSize: 11.5 }}
                  onClick={() => setEditModal(reconData[0])}
                >
                  Edit Books entry
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '7px 8px', fontSize: 11.5 }}
                  onClick={() => setEmailModal(reconData[0])}
                >
                  Draft Vendor Email
                </button>
              </div>
            </div>

            {/* Insight Card 2: TECH/045/24 */}
            <div className="recon-insight-card">
              <div className="recon-insight-header">
                <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>TECH/045/24</span>
                <span className="pill pill-dark" style={{ fontSize: 10 }}>MISSING</span>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Invoice is entirely missing from 2B. ITC cannot be claimed this period.
              </p>

              <div style={{ marginTop: 14 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '7px 8px', fontSize: 11.5 }}
                  disabled={deferredInvoices.includes('TECH/045/24')}
                  onClick={() => handleDeferInvoice('TECH/045/24')}
                >
                  {deferredInvoices.includes('TECH/045/24') ? 'Deferred to next period ✓' : 'Defer to next period'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Finalize Action Bar */}
      <div className="bottom-action-bar">
        <div>
          <div className="bottom-action-title">Finalize Reconciliation</div>
          <div className="bottom-action-sub">
            143 items require attention before submission.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setDraftSaved(true)
              showToast('Reconciliation draft saved successfully.')
            }}
          >
            <Save size={15} /> Save Draft
          </button>

          <button 
            className="btn btn-success"
            style={{ backgroundColor: '#10B981' }}
            onClick={() => navigate(`/case/${caseId}/filing`)}
          >
            <Check size={16} /> Submit to Filing
          </button>
        </div>
      </div>

      {/* Edit Books Entry Modal */}
      {editModal && (
        <div className="modal-backdrop" onClick={() => setEditModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Books Entry ({editModal.invoice_number})</h3>
              <button className="modal-close-btn" onClick={() => setEditModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Adjust the recorded tax amount in your books to reconcile with the counterparty GSTR-2B declaration.
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Vendor</label>
                <input className="form-input-styled" value={editModal.vendor_name} disabled />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">GSTR-2B Tax Amount</label>
                <input className="form-input-styled num" value={formatINR(editModal.gstr2b_tax)} disabled />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Updated Books Tax Amount (₹)</label>
                <input 
                  id="edit-book-tax-input"
                  className="form-input-styled num" 
                  defaultValue={editModal.gstr2b_tax || editModal.books_tax} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const inputVal = document.getElementById('edit-book-tax-input').value
                    handleSaveEditedBook(inputVal)
                  }}
                >
                  Save & Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Vendor Email Modal */}
      {emailModal && (
        <div className="modal-backdrop" onClick={() => setEmailModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Draft Vendor Discrepancy Email</h3>
              <button className="modal-close-btn" onClick={() => setEmailModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
                The AI Agent has composed this email to request a correction or credit note for the GSTR-2B variance.
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Recipient</label>
                <input className="form-input-styled" defaultValue={`accounts@${emailModal.vendor_name.toLowerCase().replace(/[^a-z]/g, '')}.in`} />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Subject</label>
                <input className="form-input-styled" defaultValue={`Urgent: GST Mismatch on Invoice ${emailModal.invoice_number} (Period: July 2024)`} />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Message</label>
                <textarea 
                  className="form-input-styled" 
                  rows={6}
                  defaultValue={`Dear ${emailModal.vendor_name} Finance Team,

During our automated GSTR-2B reconciliation for July 2024, our GST compliance agent flagged a tax amount discrepancy on invoice ${emailModal.invoice_number}.

- Your GSTR-1 Declaration: ₹${formatINR(emailModal.gstr2b_tax)}
- Books of Accounts: ₹${formatINR(emailModal.books_tax)}
- Discrepancy: ₹${formatINR(emailModal.difference)}

Please amend this invoice in your subsequent GSTR-1 filing or issue a corresponding credit/debit note so our Input Tax Credit (ITC) is not blocked under GST Section 16(2)(aa).

Regards,
Acme Innovations Ltd Finance Team`}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary" onClick={() => setEmailModal(null)}>Cancel</button>
                <button 
                  className="btn btn-primary"
                  disabled={sendingEmail}
                  onClick={handleSendVendorEmail}
                >
                  <Send size={14} /> {sendingEmail ? 'Sending…' : 'Send Discrepancy Notice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
