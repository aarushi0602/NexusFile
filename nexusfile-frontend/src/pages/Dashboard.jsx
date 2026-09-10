import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  ShieldCheck, 
  Zap, 
  Headphones, 
  Mail, 
  Phone, 
  MapPin, 
  UploadCloud, 
  Check, 
  ArrowRight,
  FileCheck2
} from 'lucide-react'
import OnboardingForm from '../components/OnboardingForm'
import { createCase, uploadInvoices, findCaseByEmail } from '../api/client'

export default function Dashboard() {
  const [step, setStep] = useState(1) // 1 = Business Details, 2 = Upload Documents
  const [caseId, setCaseId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [error, setError] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const navigate = useNavigate()

  async function handleLogin(email) {
    setLoggingIn(true)
    setLoginError(null)
    try {
      const found = await findCaseByEmail(email)
      navigate(`/case/${found.case_id}/ingestion`)
    } catch (err) {
      setLoginError('No account found for that email — check the spelling, or create a new account below.')
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleProfileSubmit(profileData) {
    setSubmitting(true)
    setError(null)
    try {
      const result = await createCase(profileData)
      setCaseId(result.case_id)
      setProfile(profileData)
      setStep(2)
    } catch (err) {
      console.error('Could not create case:', err)
      setError('Could not create your account — check that the backend is running and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFilesSelected(files) {
    if (!files || files.length === 0 || !caseId) return
    setUploading(true)
    setError(null)
    const fileList = Array.from(files)

    try {
      await uploadInvoices(fileList, caseId)
      setUploadedFiles((prev) => [...prev, ...fileList.map((f) => f.name)])
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Upload failed — check that the backend is running and try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleProceedToHub() {
    if (!caseId) return
    navigate(`/case/${caseId}/ingestion`)
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-grid">
        {/* Left Hero & Feature Column */}
        <section className="onboarding-left">
          <div>
            <div className="onboarding-hero-logo">
              <div className="sidebar-brand-mark">N</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>NexusFile</div>
                <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>GST Copilot</div>
              </div>
            </div>

            <h1 className="onboarding-hero-title">
              Simplify Your<br />
              GST Compliance<br />
              <span className="highlight">with AI</span>
            </h1>

            <p className="onboarding-hero-desc">
              NexusFile automates invoice processing, reconciles with GSTR-2B, and helps you file with confidence — all in one place.
            </p>

            <div className="feature-bullets">
              <div className="feature-bullet">
                <div className="feature-icon-box blue">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="feature-bullet-title">AI-Powered Ingestion</div>
                  <div className="feature-bullet-desc">
                    Upload invoices, receipts and bank statements. We extract and structure the data automatically.
                  </div>
                </div>
              </div>

              <div className="feature-bullet">
                <div className="feature-icon-box green">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="feature-bullet-title">Smart Reconciliation</div>
                  <div className="feature-bullet-desc">
                    Match with GSTR-2B, identify mismatches and missing ITC with high accuracy.
                  </div>
                </div>
              </div>

              <div className="feature-bullet">
                <div className="feature-icon-box purple">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="feature-bullet-title">Compliant & Efficient</div>
                  <div className="feature-bullet-desc">
                    Generate GSTR-1 and GSTR-3B drafts, then file with confidence.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stylized Compliance Illustration */}
          <div className="onboarding-illustration">
            <svg viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
              {/* Laptop base */}
              <path d="M40 145 L300 145 L280 160 L60 160 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
              <rect x="75" y="45" width="190" height="100" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <rect x="83" y="53" width="174" height="84" rx="4" fill="#F8FAFC" />
              
              {/* Screen chart elements */}
              <line x1="95" y1="70" x2="160" y2="70" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
              <rect x="95" y="80" width="40" height="40" rx="3" fill="#EFF6FF" />
              <rect x="145" y="80" width="40" height="40" rx="3" fill="#ECFDF5" />
              <rect x="195" y="80" width="50" height="40" rx="3" fill="#FAF5FF" />
              
              {/* Floating Invoice */}
              <g transform="translate(15, 60)">
                <rect width="65" height="75" rx="4" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
                <rect x="8" y="10" width="30" height="4" rx="2" fill="#2563EB" />
                <line x1="8" y1="22" x2="57" y2="22" stroke="#E2E8F0" strokeWidth="2" />
                <line x1="8" y1="30" x2="45" y2="30" stroke="#E2E8F0" strokeWidth="2" />
                <line x1="8" y1="38" x2="50" y2="38" stroke="#E2E8F0" strokeWidth="2" />
                <text x="8" y="60" fill="#2563EB" fontSize="8" fontWeight="bold">INVOICE</text>
              </g>

              {/* Floating Tags */}
              <g transform="translate(245, 45)">
                <rect width="78" height="22" rx="11" fill="#ECFDF5" stroke="#A7F3D0" />
                <circle cx="12" cy="11" r="5" fill="#10B981" />
                <text x="24" y="14" fill="#065F46" fontSize="9" fontWeight="600">GSTR-2B ✓</text>
              </g>

              <g transform="translate(255, 75)">
                <rect width="72" height="22" rx="11" fill="#EFF6FF" stroke="#BFDBFE" />
                <circle cx="12" cy="11" r="5" fill="#2563EB" />
                <text x="24" y="14" fill="#1E40AF" fontSize="9" fontWeight="600">GSTR-1 ✓</text>
              </g>

              <g transform="translate(250, 105)">
                <rect width="76" height="22" rx="11" fill="#FAF5FF" stroke="#E9D5FF" />
                <circle cx="12" cy="11" r="5" fill="#9333EA" />
                <text x="24" y="14" fill="#6B21A8" fontSize="9" fontWeight="600">GSTR-3B ✓</text>
              </g>
            </svg>
          </div>
        </section>

        {/* Center Onboarding Wizard */}
        <section className="onboarding-center">
          {/* 2-Step Progress Indicator */}
          <div className="stepper-header">
            <div className={`stepper-step ${step >= 1 ? 'active' : ''}`}>
              <div className="stepper-circle">
                {step > 1 ? <Check size={16} /> : 1}
              </div>
              <span>Business Details</span>
            </div>

            <div className={`stepper-line ${step >= 2 ? 'active' : ''}`} />

            <div className={`stepper-step ${step >= 2 ? 'active' : ''}`}>
              <div className="stepper-circle">2</div>
              <span>Upload Documents</span>
            </div>
          </div>

          {step === 1 ? (
            <div>
              <h2 className="onboarding-form-title">Create Your Account</h2>
              <p className="onboarding-form-desc">
                Get started by providing your business details. This will help us create your account and set up your case.
              </p>

              <OnboardingForm
                onSubmit={handleProfileSubmit}
                submitting={submitting}
                onLogin={handleLogin}
                loggingIn={loggingIn}
                loginError={loginError}
              />
            </div>
          ) : (
            <div>
              <h2 className="onboarding-form-title">Upload Documents</h2>
              <p className="onboarding-form-desc">
                Invoices, receipts, E-Way bills, or bank statements for <strong>{profile?.business_name || 'your business'}</strong>.
                NexusFile reads, classifies, and reconciles them against GSTR-2B automatically.
              </p>

              <div 
                className="dropzone-container"
                onClick={() => document.getElementById('onboard-file-input').click()}
              >
                <input 
                  id="onboard-file-input"
                  type="file" 
                  multiple 
                  style={{ display: 'none' }}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div className="dropzone-icon-box">
                  <UploadCloud size={26} />
                </div>
                <div className="dropzone-title">Drag & Drop Documents Here</div>
                <div className="dropzone-subtitle">
                  Upload Invoices, E-Way Bills, or Bank Statements (PDF, PNG, JPG).
                </div>
                <button type="button" className="btn btn-secondary">
                  Browse Files
                </button>
              </div>

              {uploading && (
                <div style={{ marginTop: 14, fontSize: 13, color: 'var(--secondary)' }}>
                  Processing documents through Ingestion Agent…
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Ready for analysis:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {uploadedFiles.map((name, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                        <FileCheck2 size={15} color="#10B981" />
                        <span>{name}</span>
                        <span className="pill pill-success" style={{ marginLeft: 'auto', fontSize: 10 }}>Ready</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: '#DC2626' }}>{error}</div>
              )}

              <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleProceedToHub}
                  disabled={uploadedFiles.length === 0}
                  style={{ flex: 1, padding: '11px 16px' }}
                >
                  Proceed to Ingestion Hub <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Help & Support Column */}
        <section className="onboarding-right">
          <div className="help-card">
            <div className="help-head-icon">
              <Headphones size={22} />
            </div>
            <div>
              <h3 className="help-title">Need Help?</h3>
              <p className="help-desc">Our support team is here to assist you with any questions or issues.</p>
            </div>

            <div className="contact-item">
              <Mail size={16} className="contact-icon" />
              <div>
                <div className="contact-label">Email</div>
                <a href="mailto:support@nexusfile.com" className="contact-val">support@nexusfile.com</a>
              </div>
            </div>

            <div className="contact-item">
              <Phone size={16} className="contact-icon" />
              <div>
                <div className="contact-label">Phone</div>
                <div className="contact-val">+91 98765 43210</div>
                <div className="contact-sub">Mon – Fri, 9 AM – 6 PM</div>
              </div>
            </div>

            <div className="contact-item">
              <MapPin size={16} className="contact-icon" />
              <div>
                <div className="contact-label">Address</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  123 Business Tower, MG Road, Bengaluru, Karnataka – 560001
                </div>
              </div>
            </div>
          </div>

          <div className="security-card">
            <ShieldCheck size={24} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="security-card-title">Your data is secure</div>
              <div className="security-card-desc">
                We use industry-standard encryption to keep your information safe.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
