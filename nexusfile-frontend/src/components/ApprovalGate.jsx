function formatINR(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function ApprovalGate({ draft, onApprove, filing, filed, acknowledgementNumber }) {
  if (!draft) return null

  if (filed) {
    return (
      <div className="approval-panel">
        <div className="timeline-label" style={{ marginBottom: 6 }}>Filed successfully</div>
        <p className="ledger-row-meta">
          Acknowledgement number:{' '}
          <span className="case-id-tag" style={{ color: 'var(--matched)' }}>
            {acknowledgementNumber || 'pending from GSP'}
          </span>
        </p>
      </div>
    )
  }

  const { summary, flagged_for_review } = draft

  return (
    <div className="approval-panel">
      <div className="timeline-label" style={{ marginBottom: 14 }}>
        Review before filing {draft.return_type}
      </div>

      <div className="approval-summary-row">
        <span>Total taxable value</span>
        <span className="num">{formatINR(summary.total_taxable_value)}</span>
      </div>
      <div className="approval-summary-row">
        <span>Total tax payable</span>
        <span className="num">{formatINR(summary.total_tax_payable)}</span>
      </div>
      <div className="approval-summary-row">
        <span>Eligible ITC</span>
        <span className="num">{formatINR(summary.eligible_itc)}</span>
      </div>
      <div className="approval-summary-row">
        <span>Net tax liability</span>
        <span className="num">{formatINR(summary.net_tax_liability)}</span>
      </div>

      {flagged_for_review && flagged_for_review.length > 0 && (
        <p className="ledger-row-meta" style={{ marginTop: 14, color: 'var(--mismatch)' }}>
          {flagged_for_review.length} invoice{flagged_for_review.length !== 1 ? 's' : ''} flagged
          for review — filing proceeds, but ITC on these is not guaranteed until suppliers
          correct their filings.
        </p>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={onApprove} disabled={filing}>
          {filing ? 'Filing…' : 'Approve and file'}
        </button>
      </div>
    </div>
  )
}
