import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ragAPI } from '../services/api';

function SettingsPanel() {
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    retrievalK: 4,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await ragAPI.updateParameters({
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        retrievalK: settings.retrievalK,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      temperature: 0.7,
      maxTokens: 1000,
      retrievalK: 4,
    });
    setSaved(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure RAG pipeline parameters
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Generation Settings */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Generation Parameters
          </h3>
        </div>

        <div className="space-y-6">
          {/* Temperature */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Temperature
              </label>
              <span className="text-sm text-gray-600">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                setSettings({ ...settings, temperature: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Controls randomness: Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="4000"
              value={settings.maxTokens}
              onChange={(e) =>
                setSettings({ ...settings, maxTokens: parseInt(e.target.value) })
              }
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum length of the generated response
            </p>
          </div>
        </div>
      </div>

      {/* Retrieval Settings */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Retrieval Parameters
          </h3>
        </div>

        <div className="space-y-6">
          {/* Retrieval K */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Number of Documents to Retrieve (K)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.retrievalK}
              onChange={(e) =>
                setSettings({ ...settings, retrievalK: parseInt(e.target.value) })
              }
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of relevant documents to retrieve for context
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 btn-secondary"
          disabled={saving}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Parameter Guidelines
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Temperature (0-2):</strong> Use 0.0-0.3 for factual answers, 0.7-1.0 for creative responses</li>
          <li>• <strong>Max Tokens:</strong> Adjust based on desired response length</li>
          <li>• <strong>Retrieval K:</strong> Higher values provide more context but may increase response time</li>
        </ul>
      </div>
    </div>
  );
}

export default SettingsPanel;
