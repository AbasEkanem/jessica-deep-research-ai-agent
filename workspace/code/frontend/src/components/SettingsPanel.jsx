import { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'

function SettingsPanel() {
  const [settings, setSettings] = useState({
    k: 4,
    temperature: 0.7,
    maxTokens: 500
  })

  const handleSave = () => {
    // In a real app, this would save to backend or localStorage
    localStorage.setItem('ragSettings', JSON.stringify(settings))
    alert('Settings saved!')
  }

  const handleReset = () => {
    setSettings({
      k: 4,
      temperature: 0.7,
      maxTokens: 500
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        {/* Retrieval Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Retrieval Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Documents to Retrieve (K)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.k}
                onChange={(e) => setSettings({...settings, k: parseInt(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many similar documents to use for context
              </p>
            </div>
          </div>
        </div>

        {/* Generation Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Generation Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Precise (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="2000"
                step="100"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum length of generated response
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            <Save size={18} />
            Save Settings
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* API Configuration Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>
            <strong className="text-white">OpenAI API Key:</strong> Configure in backend .env file
          </p>
          <p>
            <strong className="text-white">Backend URL:</strong> http://localhost:8000
          </p>
          <p>
            <strong className="text-white">Frontend URL:</strong> http://localhost:3000
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
