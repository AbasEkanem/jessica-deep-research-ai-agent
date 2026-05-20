import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import api from '../services/api'

function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    k: 4,
    temperature: 0.7,
    max_tokens: 500
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await api.query(userMessage, settings)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        queryTime: response.query_time
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      <div className="bg-gray-800 rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg mb-2">Start a conversation</p>
            <p className="text-sm">Upload documents and ask questions to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 ml-auto max-w-[80%]'
                    : msg.isError
                    ? 'bg-red-900/50 max-w-[80%]'
                    : 'bg-gray-700 max-w-[80%]'
                }`}
              >
                <div className="font-semibold mb-2">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-sm text-gray-400 mb-2">Sources:</div>
                    {msg.sources.map((source, sIdx) => (
                      <div key={sIdx} className="text-xs bg-gray-800 p-2 rounded mb-1">
                        <div className="font-semibold text-blue-400">{source.source}</div>
                        <div className="text-gray-400 mt-1">{source.content}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {msg.queryTime && (
                  <div className="text-xs text-gray-500 mt-2">
                    Query time: {msg.queryTime.toFixed(2)}s
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="bg-gray-700 p-4 rounded-lg max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  )
}

export default ChatInterface
