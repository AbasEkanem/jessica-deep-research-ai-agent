import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Health check
export const getHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

// Upload document
export const uploadDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Query RAG system
export const query = async (queryText, settings = {}) => {
  const response = await api.post('/query', {
    query: queryText,
    k: settings.k || 4,
    temperature: settings.temperature || 0.7,
    max_tokens: settings.max_tokens || 500,
  })
  return response.data
}

// List documents
export const listDocuments = async () => {
  const response = await api.get('/documents')
  return response.data
}

// Delete document
export const deleteDocument = async (docId) => {
  const response = await api.delete(`/documents/${docId}`)
  return response.data
}

export default {
  getHealth,
  uploadDocument,
  query,
  listDocuments,
  deleteDocument,
}
