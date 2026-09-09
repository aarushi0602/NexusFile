import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeftRight, 
  CheckCircle2, 
  Activity, 
  Settings, 
  HelpCircle, 
  Plus, 
  Bell, 
  Menu, 
  X,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react'
import { getCase } from '../api/client'

const NAV_ITEMS = [
  { key: 'ingestion', label: 'Ingestion', icon: FileText },
  { key: 'reconciliation', label: 'Reconciliation', icon: ArrowLeftRight },
  { key: 'filing', label: 'Filing', icon: CheckCircle2 },
  { key: 'monitoring', label: 'Monitoring', icon: Activity },
]

export default function Layout() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [caseData, setCaseData] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showNotifModal, setShowNotifModal] = useState(false)

  useEffect(() => {
    if (caseId) {
      getCase(caseId).then(setCaseData).catch(console.error)
    }
  }, [caseId])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const gstin = caseData?.profile?.gstin || '27AAAAA0000A1Z5'
  const period = 'July 2024'

  return (
    <div className="app-shell">
      {/* Mobile drawer backdrop */}
      <div 
        className={`sidebar-backdrop ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">N</div>
          <div>
            <div className="sidebar-brand-text">NexusFile</div>
            <div className="sidebar-brand-sub">GST Copilot</div>
          </div>
          <button 
            className="icon-btn mobile-menu-btn" 
            style={{ marginLeft: 'auto', color: '#94A3B8' }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button className="new-analysis-btn" onClick={() => navigate('/')}>
          <Plus size={16} /> New Analysis
        </button>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.key}
                to={caseId ? `/case/${caseId}/${item.key}` : '/'}
                className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <a 
            className="sidebar-link" 
            href="#settings" 
            onClick={(e) => { e.preventDefault(); alert('NexusFile Settings: All compliance engines configured with WhiteBooks Sandbox and Gemini 3.6 Flash.') }}
          >
            <Settings size={17} />
            <span>Settings</span>
          </a>
          <a 
            className="sidebar-link" 
            href="#support" 
            onClick={(e) => { e.preventDefault(); alert('NexusFile Support: support@nexusfile.com | +91 98765 43210') }}
          >
            <HelpCircle size={17} />
            <span>Support</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-btn icon-btn" 
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <span className="topbar-title">NexusFile</span>
          </div>

          <div className="topbar-meta">
            <span className="topbar-tag mono">GSTIN: {gstin}</span>
            <span className="topbar-tag">Period: {period}</span>
          </div>

          <div className="topbar-actions">
            <button 
              className="icon-btn" 
              title="Notifications"
              onClick={() => setShowNotifModal(true)}
            >
              <Bell size={18} />
              <span className="notification-badge" />
            </button>

            <div 
              className="user-avatar" 
              title="Acme Innovations Ltd"
              onClick={() => alert(`Active Business: ${caseData?.profile?.business_name || 'Acme Innovations Ltd'}\nGSTIN: ${gstin}`)}
            >
              AI
            </div>

            <button 
              className="btn btn-dark" 
              style={{ fontSize: 12.5, padding: '6px 14px' }}
              onClick={() => setShowReviewModal(true)}
            >
              Review Now
            </button>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* Review Now Modal */}
      {showReviewModal && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">GST Compliance Review</h3>
              <button className="modal-close-btn" onClick={() => setShowReviewModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8 }}>
                <ShieldCheck color="#2563EB" size={24} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E40AF' }}>AI Agent Pipeline Status</div>
                  <div style={{ fontSize: 12, color: '#3B82F6' }}>All 6 agents active for Period: July 2024</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p>• <strong>Ingestion:</strong> Invoices, E-Way bills and Bank statements parsed.</p>
                <p>• <strong>Reconciliation:</strong> 1,102 matched, 45 mismatches, 98 missing in 2B.</p>
                <p>• <strong>Filing:</strong> Ready for Sandbox Filing with zero net cash liability.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>Close</button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setShowReviewModal(false)
                    navigate(`/case/${caseId || 'demo'}/filing`)
                  }}
                >
                  Go to Filing & Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifModal && (
        <div className="modal-backdrop" onClick={() => setShowNotifModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agent Notifications</h3>
              <button className="modal-close-btn" onClick={() => setShowNotifModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="activity-card-item">
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>Discrepancy Flagged on EWB-8839201</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  HSN code mismatch between E-Way Bill and invoice. Action required before filing.
                </div>
              </div>
              <div className="activity-card-item">
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>GSTR-2B Data Synced</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Fetched latest counterparty returns from GSTN Portal.
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowNotifModal(false)}>Mark as Read</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
