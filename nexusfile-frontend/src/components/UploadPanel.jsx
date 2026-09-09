import { useRef, useState } from 'react'

export default function UploadPanel({ onUpload, uploading }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(fileList) {
    const files = Array.from(fileList)
    if (files.length > 0) onUpload(files)
  }

  return (
    <div
      className={'dropzone' + (dragOver ? ' dragover' : '')}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
    >
      <div className="dropzone-icon">{uploading ? '⋯' : '⤓'}</div>
      <div className="dropzone-title">
        {uploading ? 'Reading invoices…' : 'Drag & Drop Documents Here'}
      </div>
      <div className="dropzone-hint">or click to browse — PDF, PNG, or JPG, multiple at once</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg"
        className="file-input-hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
