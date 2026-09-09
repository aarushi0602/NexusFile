function formatINR(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const STATUS_LABEL = {
  matched: 'Matched',
  mismatched: 'Amount mismatch',
  missing_in_gstr2b: 'Missing in GSTR-2B',
}

function StatusMark({ status }) {
  return (
    <span className={`status-mark status-${status}`}>
      <span className="status-dot" />
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export default function ReconciliationView({ invoices, reconciliation }) {
  const reconByInvoiceId = Object.fromEntries(
    (reconciliation || []).map((r) => [r.invoice_id, r])
  )

  const matchedCount = (reconciliation || []).filter((r) => r.status === 'matched').length
  const mismatchCount = (reconciliation || []).length - matchedCount
  const totalAtRisk = (reconciliation || [])
    .filter((r) => r.status !== 'matched')
    .reduce((sum, r) => sum + (r.expected_amount || 0), 0)

  if (!invoices || invoices.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No invoices yet</div>
        <p>Upload invoices to see them reconciled against GSTR-2B here.</p>
      </div>
    )
  }

  return (
    <div>
      {reconciliation && reconciliation.length > 0 && (
        <div className="summary-strip">
          <div>
            <div className="summary-stat-value num">{matchedCount}</div>
            <div className="summary-stat-label">Matched</div>
          </div>
          <div>
            <div className="summary-stat-value num" style={{ color: 'var(--mismatch)' }}>
              {mismatchCount}
            </div>
            <div className="summary-stat-label">Need review</div>
          </div>
          <div>
            <div className="summary-stat-value num" style={{ color: 'var(--missing)' }}>
              {formatINR(totalAtRisk)}
            </div>
            <div className="summary-stat-label">ITC at risk</div>
          </div>
        </div>
      )}

      <div className="ledger-section-title">
        {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
      </div>
      <div className="ledger">
        {invoices.map((inv) => {
          const recon = reconByInvoiceId[inv.invoice_id]
          return (
            <div className="ledger-row" key={inv.invoice_id}>
              <div className="ledger-row-main">
                <div className="ledger-row-title">{inv.vendor_name}</div>
                <div className="ledger-row-meta">
                  {inv.invoice_number} · {inv.invoice_date} · {inv.category || 'uncategorized'}
                </div>
              </div>
              <div className="ledger-amount num">{formatINR(inv.total_amount)}</div>
              <div>{recon ? <StatusMark status={recon.status} /> : (
                <span className="status-mark" style={{ color: 'var(--slate-light)' }}>
                  <span className="status-dot" style={{ background: 'var(--slate-light)' }} />
                  Not yet reconciled
                </span>
              )}</div>
              <div></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
