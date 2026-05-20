import { useState, useEffect } from 'react'
import { Database, FileText, Clock, Activity } from 'lucide-react'
import api from '../services/api'

function SystemStats() {
  const [stats, setStats] = useState({
    documentCount: 0,
    vectorStoreStatus: 'unknown',
    lastUpdate: null
  })

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const data = await api.getHealth()
      setStats({
        documentCount: data.document_count || 0,
        vectorStoreStatus: data.vector_store ? 'active' : 'inactive',
        lastUpdate: new Date()
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.documentCount,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Vector Store',
      value: stats.vectorStoreStatus,
      icon: Database,
      color: stats.vectorStoreStatus === 'active' ? 'green' : 'red'
    },
    {
      title: 'Last Update',
      value: stats.lastUpdate
        ? stats.lastUpdate.toLocaleTimeString()
        : 'Never',
      icon: Clock,
      color: 'purple'
    },
    {
      title: 'System Status',
      value: 'Online',
      icon: Activity,
      color: 'green'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      red: 'bg-red-600',
      purple: 'bg-purple-600'
    }
    return colors[color] || 'bg-gray-600'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Statistics</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.title}</div>
            </div>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Backend API</span>
            <span>http://localhost:8000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Frontend</span>
            <span>http://localhost:3000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vector Database</span>
            <span>ChromaDB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">LLM Provider</span>
            <span>OpenAI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemStats
