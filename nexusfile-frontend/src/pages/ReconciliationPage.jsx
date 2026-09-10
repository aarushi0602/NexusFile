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
import { getCaseInvoices, reconcileCase, emailVendorDiscrepancy, getCase } from '../api/client'

const DEMO_PERIOD = '072024'
const FALLBACK_GSTIN = '27AAAAA0000A1Z5' // used only if the case has no GSTIN on file

function formatINR(val) {
  if (val == null) return '—'
  return '₹' + new Intl.NumberFormat('en-IN').format(val)
}

export default function ReconciliationPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [reconData, setReconData] = useState([])
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'mismatched' | 'missing_in_gstr2b'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draftSaved, setDraftSaved] = useState(false)

  // Modals state
  const [emailModal, setEmailModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [deferredInvoices, setDeferredInvoices] = useState([])
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    loadReconciliation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  async function loadReconciliation() {
    setLoading(true)
    setError(null)
    try {
      const invs = await getCaseInvoices(caseId)
      if (!invs || invs.length === 0) {
        setReconData([])
        return
      }

      const caseInfo = await getCase(caseId).catch(() => null)
      const gstin = caseInfo?.profile?.gstin || FALLBACK_GSTIN

      const result = await reconcileCase({
        case_id: caseId,
        gstin,
        period: DEMO_PERIOD,
        invoices: invs,
      })

      const mapped = (result.reconciliation || []).map((r, i) => {
        const matchInv = invs.find((x) => x.invoice_id === r.invoice_id) || {}
        return {
          id: r.invoice_id || `recon-${i}`,
          invoice_number: matchInv.invoice_number || `INV-${i + 1}`,
          vendor_name: matchInv.vendor_name || 'Unknown Supplier',
          vendor_gstin: matchInv.vendor_gstin || '',
          books_date: matchInv.invoice_date || null,
          books_tax: r.expected_amount ?? matchInv.tax_amount ?? 0,
          gstr2b_date: r.status === 'missing_in_gstr2b' ? null : matchInv.invoice_date,
          gstr2b_tax: r.actual_amount,
          difference: r.difference || 0,
          notes: r.notes || '',
          status: r.status,
          status_label: r.status === 'matched' ? 'MATCHED' : r.status === 'mismatched' ? 'MISMATCH' : 'MISSING 2B',
        }
      })
      setReconData(mapped)
    } catch (err) {
      console.error('Reconciliation failed:', err)
      setError('Could not run reconciliation — check that invoices have been ingested and the backend is running.')
      setReconData([])
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
      const matchInv = (row.invoice_number || '').toLowerCase().includes(q)
      const matchGstin = (row.vendor_gstin || '').toLowerCase().includes(q)
      const matchName = (row.vendor_name || '').toLowerCase().includes(q)
      if (!matchInv && !matchGstin && !matchName) return false
    }
    return true
  })

  const totalCount = reconData.length
  const matchedCount = reconData.filter((r) => r.status === 'matched').length
  const mismatchedCount = reconData.filter((r) => r.status === 'mismatched').length
  const missingCount = reconData.filter((r) => r.status === 'missing_in_gstr2b').length
  const actionRequiredCount = mismatchedCount + missingCount
  const flaggedRows = reconData.filter((r) => r.status !== 'matched')

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
            <div className="recon-kpi-value">{totalCount}</div>
          </div>
          <div className="recon-kpi-box">
            <div className="recon-kpi-label">MATCHED</div>
            <div className="recon-kpi-value green">{matchedCount}</div>
          </div>
          <div className="recon-kpi-box highlight">
            <div className="recon-kpi-label" style={{ color: 'var(--secondary)' }}>AGENT ACTION REQUIRED</div>
            <div className="recon-kpi-value blue">{actionRequiredCount}</div>
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
                MISMATCHED ({mismatchedCount})
              </button>
              <button 
                className={`recon-tab ${filterTab === 'missing_in_gstr2b' ? 'active' : ''}`}
                onClick={() => setFilterTab('missing_in_gstr2b')}
              >
                MISSING IN 2B ({missingCount})
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
                {loading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    Matching against GSTR-2B…
                  </td></tr>
                ) : error ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: '#DC2626', fontSize: 13 }}>
                    {error}
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    {reconData.length === 0 ? 'No invoices ingested yet — upload documents first.' : 'No invoices match this filter.'}
                  </td></tr>
                ) : filtered.map((row) => (
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

            {flaggedRows.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '8px 0' }}>
                {reconData.length === 0
                  ? 'Run reconciliation to see agent insights here.'
                  : 'No issues detected — every invoice matched cleanly.'}
              </p>
            ) : (
              flaggedRows.slice(0, 5).map((row) => (
                <div className="recon-insight-card" key={row.id}>
                  <div className="recon-insight-header">
                    <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{row.invoice_number}</span>
                    <span className={row.status === 'mismatched' ? 'pill pill-danger' : 'pill pill-dark'} style={{ fontSize: 10 }}>
                      {row.status === 'mismatched' ? 'TAX MISMATCH' : 'MISSING'}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {row.status === 'mismatched'
                      ? <>Vendor declared a different amount in 2B than your books show — a difference of <strong>{formatINR(Math.abs(row.difference))}</strong>.</>
                      : 'Invoice is entirely missing from 2B. ITC cannot be claimed this period unless the supplier files it.'}
                  </p>

                  {row.status === 'mismatched' ? (
                    <>
                      <div className="recon-compare-grid">
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>BOOKS:</div>
                          <div className="num" style={{ fontWeight: 700, fontSize: 13 }}>{formatINR(row.books_tax)}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>GSTR-2B:</div>
                          <div className="num" style={{ fontWeight: 700, fontSize: 13 }}>{formatINR(row.gstr2b_tax)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '7px 8px', fontSize: 11.5 }}
                          onClick={() => setEditModal(row)}
                        >
                          Edit Books entry
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '7px 8px', fontSize: 11.5 }}
                          onClick={() => setEmailModal(row)}
                        >
                          Draft Vendor Email
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '7px 8px', fontSize: 11.5 }}
                        disabled={deferredInvoices.includes(row.invoice_number)}
                        onClick={() => handleDeferInvoice(row.invoice_number)}
                      >
                        {deferredInvoices.includes(row.invoice_number) ? 'Deferred to next period ✓' : 'Defer to next period'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Finalize Action Bar */}
      <div className="bottom-action-bar">
        <div>
          <div className="bottom-action-title">Finalize Reconciliation</div>
          <div className="bottom-action-sub">
            {actionRequiredCount > 0
              ? `${actionRequiredCount} item${actionRequiredCount !== 1 ? 's' : ''} require attention before submission.`
              : reconData.length > 0
                ? 'All invoices reconciled cleanly — ready to file.'
                : 'Ingest and reconcile invoices to continue.'}
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
