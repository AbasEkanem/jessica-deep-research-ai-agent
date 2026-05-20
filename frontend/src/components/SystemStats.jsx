import { useState, useEffect } from 'react';
import { BarChart3, Database, Cpu, Activity, Loader2, RefreshCw } from 'lucide-react';
import { ragAPI } from '../services/api';

function SystemStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ragAPI.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading statistics: {error}</p>
      </div>
    );
  }

  const vectorStats = stats?.vector_store || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Statistics</h2>
          <p className="text-gray-600 mt-1">
            Monitor your RAG system performance and usage
          </p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center space-x-2 btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900">
                {vectorStats.document_count || 0}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Uploaded Files</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.uploaded_files || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Collection</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {vectorStats.collection_name || 'N/A'}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="text-lg font-bold text-green-600">Active</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Cpu className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vector Store Details */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Vector Store Details
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Collection Name</span>
              <span className="font-medium text-gray-900">
                {vectorStats.collection_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Document Count</span>
              <span className="font-medium text-gray-900">
                {vectorStats.document_count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Persist Directory</span>
              <span className="font-medium text-gray-900 text-sm truncate max-w-xs">
                {vectorStats.persist_directory || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Embedding Model</span>
              <span className="font-medium text-gray-900 text-sm truncate max-w-xs">
                {vectorStats.embedding_model || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              System Information
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Upload Directory</span>
              <span className="font-medium text-gray-900 text-sm truncate max-w-xs">
                {stats.upload_directory || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Uploaded Files</span>
              <span className="font-medium text-gray-900">
                {stats.uploaded_files || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">API Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Performance Metrics
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Response Time</p>
            <p className="text-2xl font-bold text-blue-600">~2-5s</p>
            <p className="text-xs text-gray-500 mt-1">Estimated</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Retrieval Accuracy</p>
            <p className="text-2xl font-bold text-green-600">High</p>
            <p className="text-xs text-gray-500 mt-1">Based on embeddings</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Storage Efficiency</p>
            <p className="text-2xl font-bold text-purple-600">Optimized</p>
            <p className="text-xs text-gray-500 mt-1">ChromaDB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemStats;
