import { useState } from 'react'
import { Building2, Mail, Phone, CreditCard, FileCheck2, MapPin, ArrowRight } from 'lucide-react'

const initialForm = {
  business_name: 'Acme Innovations Ltd',
  email: 'finance@acme.com',
  phone: '+91 98765 43210',
  pan: 'AAECR1234F',
  gstin: '27AAAAA0000A1Z5',
  address: '123 Business Tower, MG Road, Bengaluru, Karnataka – 560001',
}

export default function OnboardingForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.business_name.trim()) errs.business_name = 'Business name is required'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Enter a valid corporate email'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Enter a valid phone number'
    }
    if (!form.pan.trim() || form.pan.length < 10) {
      errs.pan = 'Enter a valid 10-character PAN'
    }
    if (!form.gstin.trim() || form.gstin.length < 15) {
      errs.gstin = 'Enter a valid 15-character GSTIN'
    }
    if (!form.address.trim()) {
      errs.address = 'Business address is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    let phone = form.phone.trim()
    if (!phone.startsWith('+')) phone = '+91' + phone.replace(/\D/g, '')
    onSubmit({ ...form, phone })
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {/* Business Name */}
      <div className="form-field-group">
        <label className="form-field-label">
          Business Name <span className="req">*</span>
        </label>
        <div className="input-with-icon">
          <Building2 size={16} className="input-icon-lead" />
          <input
            className="form-input-styled"
            value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)}
            placeholder="Enter your business name"
          />
        </div>
        {errors.business_name && <span className="form-error">{errors.business_name}</span>}
      </div>

      {/* Email Address */}
      <div className="form-field-group">
        <label className="form-field-label">
          Email Address <span className="req">*</span>
        </label>
        <div className="input-with-icon">
          <Mail size={16} className="input-icon-lead" />
          <input
            className="form-input-styled"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      {/* Phone Number */}
      <div className="form-field-group">
        <label className="form-field-label">
          Phone Number <span className="req">*</span>
        </label>
        <div className="input-with-icon">
          <Phone size={16} className="input-icon-lead" />
          <input
            className="form-input-styled"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        {errors.phone && <span className="form-error">{errors.phone}</span>}
      </div>

      {/* PAN Number */}
      <div className="form-field-group">
        <label className="form-field-label">
          PAN Number <span className="req">*</span>
        </label>
        <div className="input-with-icon">
          <CreditCard size={16} className="input-icon-lead" />
          <input
            className="form-input-styled mono"
            value={form.pan}
            onChange={(e) => update('pan', e.target.value.toUpperCase())}
            placeholder="AAECR1234F"
            maxLength={10}
          />
        </div>
        {errors.pan && <span className="form-error">{errors.pan}</span>}
      </div>

      {/* GSTIN */}
      <div className="form-field-group">
        <label className="form-field-label">
          GSTIN <span className="req">*</span>
        </label>
        <div className="input-with-icon">
          <FileCheck2 size={16} className="input-icon-lead" />
          <input
            className="form-input-styled mono"
            value={form.gstin}
            onChange={(e) => update('gstin', e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
          />
        </div>
        {errors.gstin && <span className="form-error">{errors.gstin}</span>}
      </div>

      {/* Business Address */}
      <div className="form-field-group">
        <label className="form-field-label">
          Business Address <span className="req">*</span>
        </label>
        <div className="input-with-icon">
          <MapPin size={16} className="input-icon-lead" />
          <input
            className="form-input-styled"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Enter your complete business address"
          />
        </div>
        {errors.address && <span className="form-error">{errors.address}</span>}
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 600, marginTop: 8 }}
        disabled={submitting}
      >
        {submitting ? 'Setting up case...' : (
          <>Next: Upload Documents <ArrowRight size={16} /></>
        )}
      </button>

      <div className="form-footer-login">
        Already have an account? <a href="#login" onClick={(e) => { e.preventDefault(); alert('Logging in with active case!') }}>Log in</a>
      </div>
    </form>
  )
}
