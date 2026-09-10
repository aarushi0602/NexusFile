import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const client = axios.create({ baseURL: BASE_URL })

export async function createCase(profile) {
  const res = await client.post('/case/create', profile)
  return res.data
}

export async function findCaseByEmail(email) {
  const res = await client.get('/case/lookup', { params: { email } })
  return res.data
}

export async function uploadInvoices(files, caseId) {
  const formData = new FormData()
  for (const file of files) formData.append('files', file)
  if (caseId) formData.append('case_id', caseId)

  const res = await client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function getCase(caseId) {
  const res = await client.get(`/case/${caseId}`)
  return res.data
}

export async function getCaseInvoices(caseId) {
  const res = await client.get(`/case/${caseId}/invoices`)
  return res.data.invoices
}

export async function reconcileCase(payload) {
  const res = await client.post('/reconcile', payload)
  return res.data
}

export async function createDraft(payload) {
  const res = await client.post('/draft', payload)
  return res.data
}

export async function approveAndFile(payload) {
  const res = await client.post('/approve', payload)
  return res.data
}

export async function emailVendorDiscrepancy(caseId, payload) {
  const res = await client.post(`/case/${caseId}/email-vendor`, payload)
  return res.data
}

export default client
