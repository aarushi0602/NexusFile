import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Search, 
  AlertTriangle, 
  RotateCw, 
  CheckCircle2, 
  Bot, 
  User, 
  MoreHorizontal,
  X
} from 'lucide-react'
import { getCase } from '../api/client'

export default function MonitoringPage() {
  const { caseId } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState('Just now')
  const [showAllLogs, setShowAllLogs] = useState(false)

  useEffect(() => {
    getCase(caseId).then(setCaseData).catch(console.error)
  }, [caseId])

  const ackNumber = caseData?.acknowledgement_number || 'AA2707241234567'

  function handleScanNow() {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setLastScanTime('Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 1200)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Post-Filing Monitoring</h1>
          <div className="page-subtitle">
            Agent is actively monitoring your compliance status and historic filings.
          </div>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid-2col">
        {/* Left Column: Compliance Calendar & Agent Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Compliance Calendar */}
          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <Calendar size={18} color="var(--secondary)" />
                <span>Compliance Calendar</span>
              </div>
              <button 
                className="icon-btn" 
                title="Options"
                onClick={() => alert('Compliance alerts active for all upcoming GST deadlines.')}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Event 1: GSTR-3B */}
              <div className="calendar-entry">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="calendar-date-tag">
                    <div>AUG</div>
                    <div style={{ fontSize: 16, color: 'var(--text-primary)' }}>20</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>GSTR-3B Filing</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      July 2024 Period
                    </div>
                  </div>
                </div>
                <span className="pill pill-accent">UPCOMING</span>
              </div>

              {/* Event 2: GSTR-1 */}
              <div className="calendar-entry">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="calendar-date-tag" style={{ borderLeft: '3px solid #10B981' }}>
                    <div>AUG</div>
                    <div style={{ fontSize: 16, color: 'var(--text-primary)' }}>11</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>GSTR-1 Filing</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      July 2024 Period
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                      ARN: {ackNumber}
                    </div>
                  </div>
                </div>
                <span className="pill pill-success">FILED</span>
              </div>
            </div>
          </div>

          {/* Agent Insights */}
          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <Sparkles size={17} color="var(--secondary)" />
                <span>Agent Insights</span>
              </div>
              <span className="pill pill-accent" style={{ fontSize: 10 }}>AI GENERATED</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Insight 1: Tax Planning */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>
                  <Search size={15} color="#2563EB" />
                  <span>Tax Planning: ITC Accumulation</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Agent detected a consistent 15% month-over-month increase in unutilized ITC. Consider reviewing procurement strategies or applying for a refund under inverted duty structure if applicable.
                </p>
              </div>

              {/* Insight 2: Risk Flag */}
              <div style={{ border: '1px solid #FECACA', borderRadius: 8, padding: 14, backgroundColor: '#FFF5F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#DC2626', fontWeight: 600, fontSize: 13 }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span>Risk Flag: Vendor Compliance</span>
                </div>
                <p style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.45 }}>
                  3 key vendors (accounting for 22% of total ITC) have not yet filed their GSTR-1 for July. This may impact your GSTR-2B reconciliation next week.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notice Watch & Activity Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Notice Watch Card */}
          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <span className="dot dot-success" />
                <span>Notice Watch</span>
              </div>
            </div>

            <div className="notice-watch-box">
              <ShieldCheck className="notice-shield-icon" strokeWidth={1.5} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                No Active Notices
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                Your compliance record is clear.
              </div>
            </div>

            <div className="notice-watch-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--text-muted)" />
                <span>Next scan in 04:22:18</span>
              </div>
              <button 
                className="btn btn-outline-primary"
                style={{ fontSize: 11.5, padding: '4px 10px', border: 'none', fontWeight: 700 }}
                disabled={scanning}
                onClick={handleScanNow}
              >
                {scanning ? <><RotateCw size={12} className="spin" /> SCANNING…</> : 'SCAN NOW'}
              </button>
            </div>
          </div>

          {/* Activity Log Card */}
          <div className="card">
            <div className="card-title">
              <div className="card-title-left">
                <Clock size={16} color="var(--text-muted)" />
                <span>Activity Log</span>
              </div>
              <a 
                href="#all" 
                style={{ fontSize: 11.5, color: 'var(--secondary)', fontWeight: 600 }}
                onClick={(e) => {
                  e.preventDefault()
                  setShowAllLogs(true)
                }}
              >
                View All
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Activity 1 */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={15} />
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>SYSTEM AGENT</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today, 09:45 AM</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Initiated automated cross-check of GSTR-1 vs E-way bills for July 2024.
                  </div>
                </div>
              </div>

              {/* Activity 2 */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={15} />
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>J. DOE (USER)</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Yesterday, 14:28</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Approved GSTR-3B draft for filing.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Logs Modal */}
      {showAllLogs && (
        <div className="modal-backdrop" onClick={() => setShowAllLogs(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Complete Compliance Activity Log</h3>
              <button className="modal-close-btn" onClick={() => setShowAllLogs(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflowY: 'auto' }}>
              <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Today, 09:45 AM - System Agent</div>
                <div>Initiated automated cross-check of GSTR-1 vs E-way bills for July 2024.</div>
              </div>
              <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Yesterday, 14:28 - User (J. Doe)</div>
                <div>Approved GSTR-3B draft for filing. Dispatched confirmation.</div>
              </div>
              <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Yesterday, 14:25 - NotificationAgent</div>
                <div>Filing confirmation email delivered to finance@acme.com.</div>
              </div>
              <div style={{ padding: '8px 0', fontSize: 12.5 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>15-Jul-2024, 10:42 AM - IngestionAgent</div>
                <div>Completed automated invoice extraction from vendor portal batch.</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setShowAllLogs(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
