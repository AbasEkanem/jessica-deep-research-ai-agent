import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, CheckCircle } from 'lucide-react'
import api from '../services/api'

function DocumentUpload() {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [dragActive, setDragActive] = useState(false)

  const loadDocuments = async () => {
    try {
      const data = await api.listDocuments()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = async (file) => {
    setUploading(true)
    try {
      const result = await api.uploadDocument(file)
      alert(`Document uploaded successfully! Processed ${result.chunks_processed} chunks.`)
      loadDocuments()
    } catch (error) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await api.deleteDocument(docId)
      loadDocuments()
    } catch (error) {
      alert(`Delete failed: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
          accept=".pdf,.txt,.md,.docx"
          disabled={uploading}
        />
        
        <Upload size={48} className="mx-auto mb-4 text-gray-500" />
        <p className="text-lg mb-2">Drag and drop your documents here</p>
        <p className="text-sm text-gray-500 mb-4">
          Supports PDF, TXT, MD, and DOCX files
        </p>
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <FileText size={20} />
              <span>Browse Files</span>
            </>
          )}
        </label>
      </div>

      {/* Documents List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
        
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <div>
                    <div className="font-semibold">{doc.source}</div>
                    <div className="text-sm text-gray-400">ID: {doc.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                  title="Delete document"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload
