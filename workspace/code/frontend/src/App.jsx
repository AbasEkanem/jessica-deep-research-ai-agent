import { useState, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import DocumentUpload from './components/DocumentUpload'
import SystemStats from './components/SystemStats'
import SettingsPanel from './components/SettingsPanel'
import { MessageSquare, FileText, BarChart3, Settings } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [systemHealth, setSystemHealth] = useState(null)

  useEffect(() => {
    // Check system health on load
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemHealth(data))
      .catch(err => console.error('Health check failed:', err))
  }, [])

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'upload', label: 'Documents', icon: FileText },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            RAG Agent
          </h1>
          {systemHealth && (
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-400">{systemHealth.status}</span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'upload' && <DocumentUpload />}
        {activeTab === 'stats' && <SystemStats />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default App
