const STAGES = [
  { key: 'created', label: 'Case started', desc: 'Ready to receive invoices' },
  { key: 'classified', label: 'Ingested & classified', desc: 'Invoices read and tagged' },
  { key: 'reconciled', label: 'Reconciled', desc: 'Matched against GSTR-2B' },
  { key: 'awaiting_approval', label: 'Draft ready', desc: 'Awaiting your approval' },
  { key: 'filed', label: 'Filed', desc: 'Submitted to GSTN via GSP' },
]

export default function CaseTimeline({ currentStage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage)

  return (
    <div className="timeline">
      {STAGES.map((stage, i) => (
        <div className="timeline-item" key={stage.key}>
          <div className={'timeline-dot' + (i <= currentIndex ? ' done' : '')} />
          <div>
            <div className="timeline-label">{stage.label}</div>
            <div className="timeline-desc">{stage.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
