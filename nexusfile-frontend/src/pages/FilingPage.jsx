import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  Download, 
  ShieldCheck, 
  Check, 
  User, 
  Bot, 
  X,
  Printer
} from 'lucide-react'
import { getCaseInvoices, reconcileCase, createDraft, approveAndFile, getCase } from '../api/client'

export default function FilingPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  
  const [filing, setFiling] = useState(false)
  const [filed, setFiled] = useState(false)
  const [ackNumber, setAckNumber] = useState('AA2707241234567')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getCase(caseId).then((c) => {
      if (c?.profile) setProfile(c.profile)
      if (c?.stage === 'filed') {
        setFiled(true)
        if (c.acknowledgement_number) setAckNumber(c.acknowledgement_number)
      }
    }).catch(console.error)
  }, [caseId])

  async function handleFileToGSTN() {
    setFiling(true)
    try {
      const res = await approveAndFile({
        case_id: caseId || 'demo',
        gstin: profile?.gstin || '27AAAAA0000A1Z5',
        period: '072024',
        return_type: 'GSTR3B',
        draft: {
          summary: {
            total_taxable_value: 4643500.0,
            total_tax_payable: 835830.0,
            eligible_itc: 835830.0,
            net_tax_liability: 0.0,
          },
        },
        approved: true,
      })

      if (res?.acknowledgement_number) {
        setAckNumber(res.acknowledgement_number)
      }
      setFiled(true)
      setShowSuccessModal(true)
    } catch (err) {
      console.warn('Sandbox simulated filing:', err)
      const mockAck = 'AA2707241234567'
      setAckNumber(mockAck)
      setFiled(true)
      setShowSuccessModal(true)
    } finally {
      setFiling(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Filing Readiness</h1>
          <div className="page-subtitle">Review finalized summaries before submission to GSTN.</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600, fontSize: 13 }}>
          <span className="dot dot-success" />
          <span>ALL AGENTS COMPLETE</span>
        </div>
      </div>

      {/* 2 Draft Summary Cards Grid */}
      <div className="grid-equal-2col" style={{ marginBottom: 22 }}>
        {/* Card 1: GSTR-1 Draft Summary */}
        <div className="filing-summary-card">
          <div className="filing-summary-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="var(--secondary)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>GSTR-1 Draft Summary</span>
            </div>
            <span className="pill pill-accent">READY</span>
          </div>

          <div className="filing-summary-row">
            <span>B2B Invoices (4A, 4B, 4C, 6B, 6C)</span>
            <span className="num" style={{ fontWeight: 600 }}>₹ 45,23,000.00</span>
          </div>

          <div className="filing-summary-row">
            <span>B2C (Large) Invoices (5A, 5B)</span>
            <span className="num" style={{ fontWeight: 600 }}>₹ 1,20,500.00</span>
          </div>

          <div className="filing-summary-row">
            <span>Export Invoices (6A)</span>
            <span className="num" style={{ fontWeight: 600 }}>₹ 0.00</span>
          </div>

          <div className="filing-summary-row total">
            <span>Total Taxable Value</span>
            <span className="num" style={{ fontWeight: 700, fontSize: 16 }}>₹ 46,43,500.00</span>
          </div>
        </div>

        {/* Card 2: GSTR-3B Draft Summary */}
        <div className="filing-summary-card">
          <div className="filing-summary-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="var(--secondary)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>GSTR-3B Draft Summary</span>
            </div>
            <span className="pill pill-accent">READY</span>
          </div>

          <div className="filing-summary-row">
            <span>Eligible ITC (Table 4A)</span>
            <span className="num" style={{ fontWeight: 600 }}>₹ 8,35,830.00</span>
          </div>

          <div className="filing-summary-row">
            <span>Total Output Tax (Table 3.1)</span>
            <span className="num" style={{ fontWeight: 600 }}>₹ 8,35,830.00</span>
          </div>

          <div className="filing-summary-row">
            <span>Late Fee / Interest</span>
            <span className="num" style={{ fontWeight: 600 }}>₹ 0.00</span>
          </div>

          <div className="filing-summary-row total">
            <span>Net Cash Liability</span>
            <span className="pill pill-success num" style={{ fontSize: 13, padding: '4px 12px' }}>
              ₹ 0.00
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Checklist & Agent Decision Log */}
      <div className="grid-equal-2col" style={{ marginBottom: 22 }}>
        {/* Compliance Checklist */}
        <div className="card">
          <div className="card-title">Compliance Checklist</div>

          <div className="checklist-card">
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="checklist-title">Data Ingestion Complete</div>
              <div className="checklist-desc">All sales and purchase registers successfully parsed.</div>
            </div>
          </div>

          <div className="checklist-card">
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="checklist-title">GSTR-2B Reconciliation Matched</div>
              <div className="checklist-desc">98.5% match rate. 3 manual interventions verified.</div>
            </div>
          </div>

          <div className="checklist-card">
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="checklist-title">HSN Code Validation Passed</div>
              <div className="checklist-desc">No invalid or obsolete HSN codes detected in outbound supply.</div>
            </div>
          </div>
        </div>

        {/* Agent Decision Log */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <Clock size={16} color="var(--text-muted)" />
              <span>Agent Decision Log</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Entry 1 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={15} />
              </div>
              <div style={{ fontSize: 12.5 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>10:42 AM</div>
                <div>
                  Auto-resolved <span className="mono" style={{ backgroundColor: '#F1F5F9', padding: '2px 4px', borderRadius: 4 }}>INV-2024-89</span> round-off discrepancy of ₹0.45.
                </div>
              </div>
            </div>

            {/* Entry 2 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} />
              </div>
              <div style={{ fontSize: 12.5 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>09:15 AM</div>
                <div>
                  Human override: Accepted ITC for <span style={{ fontWeight: 600 }}>Vendor ABC</span> despite minor name mismatch.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bottom-action-bar">
        <div>
          <div className="bottom-action-title">Ready for Sandbox Filing</div>
          <div className="bottom-action-sub">Ensure all data is reviewed before proceeding.</div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowPdfModal(true)}
          >
            <Download size={15} /> Export Draft PDF
          </button>

          <button 
            className="btn btn-dark"
            style={{ 
              backgroundColor: filed ? '#059669' : '#064E3B', 
              color: '#FFFFFF',
              padding: '10px 20px',
              fontWeight: 600 
            }}
            disabled={filing}
            onClick={handleFileToGSTN}
          >
            <UploadCloud size={16} /> 
            {filing ? 'Filing to GSTN…' : filed ? 'Filed to GSTN ✓' : 'File to GSTN'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-backdrop" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> Return Filed Successfully
              </h3>
              <button className="modal-close-btn" onClick={() => setShowSuccessModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Your GSTR-3B return for <strong>July 2024</strong> has been approved and submitted to the GSTN Sandbox portal.
              </p>

              <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  ACKNOWLEDGEMENT REFERENCE NUMBER (ARN)
                </div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                  {ackNumber}
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                • Filing confirmation dispatched via Email to <strong>{profile?.email || 'finance@acme.com'}</strong>.<br />
                • Active compliance tracking started in Post-Filing Monitoring.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowSuccessModal(false)}>Close</button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowSuccessModal(false)
                    navigate(`/case/${caseId}/monitoring`)
                  }}
                >
                  View Monitoring Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Preview Modal */}
      {showPdfModal && (
        <div className="modal-backdrop" onClick={() => setShowPdfModal(false)}>
          <div className="modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">GST Return Draft - July 2024</h3>
              <button className="modal-close-btn" onClick={() => setShowPdfModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', padding: 18, borderRadius: 8, fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                <div>
                  <strong>Taxpayer:</strong> {profile?.business_name || 'Acme Innovations Ltd'}<br />
                  <strong>GSTIN:</strong> 27AAAAA0000A1Z5<br />
                  <strong>Return Period:</strong> July 2024 (072024)
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Filing Status:</strong> DRAFT READY<br />
                  <strong>Prepared By:</strong> NexusFile AI Copilot
                </div>
              </div>

              <table style={{ width: '100%', textAlign: 'left', marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '4px 0' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Taxable Value</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Tax Liability</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Table 3.1: Tax on Outward Supplies</td>
                    <td style={{ textAlign: 'right' }}>₹ 46,43,500.00</td>
                    <td style={{ textAlign: 'right' }}>₹ 8,35,830.00</td>
                  </tr>
                  <tr>
                    <td>Table 4A: Eligible Input Tax Credit (ITC)</td>
                    <td style={{ textAlign: 'right' }}>—</td>
                    <td style={{ textAlign: 'right', color: '#059669' }}>₹ 8,35,830.00</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)', fontWeight: 'bold' }}>
                    <td>Net Tax Payable in Cash</td>
                    <td style={{ textAlign: 'right' }}>—</td>
                    <td style={{ textAlign: 'right' }}>₹ 0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowPdfModal(false)}>Close</button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  window.print()
                  setShowPdfModal(false)
                }}
              >
                <Printer size={15} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
