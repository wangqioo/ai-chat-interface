import { useState, useCallback } from 'react'
import { streamChat, PROVIDER_PRESETS } from './utils/aiApi'
import SettingsModal from './components/SettingsModal'
import './App.css'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const STORAGE_KEY = 'ai-chat-settings'

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function CodeBlock({ children, className }) {
  const lang = className?.replace('language-', '') || ''
  const code = String(children).trim()
  return (
    <div style={{ margin: '10px 0', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)', padding: '6px 12px' }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lang}</span>
        <button
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 4, fontSize: 11 }}
          onClick={() => navigator.clipboard.writeText(code)}
        >
          复制
        </button>
      </div>
      <SyntaxHighlighter style={vscDarkPlus} language={lang || 'text'} customStyle={{ margin: 0, borderRadius: 0, fontSize: 12 }}>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)

  const hasConfig = settings.apiKey && settings.baseUrl && settings.model

  function handleSaveSettings(s) {
    setSettings(s)
    saveSettings(s)
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming || !hasConfig) return
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    await streamChat({
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      messages: newMessages,
      onChunk: (chunk) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + chunk }
          return updated
        })
      },
      onDone: () => setStreaming(false),
      onError: (err) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: `**错误**: ${err}`, error: true }
          return updated
        })
        setStreaming(false)
      },
    })
  }, [messages, streaming, hasConfig, settings])

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <div className="app-title">
          <span style={{ fontSize: 18 }}>🤖</span>
          <span>AI Chat Interface</span>
          {settings.model && <span className="header-model">{settings.model}</span>}
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙ 配置</button>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p>支持 OpenAI / Anthropic / DeepSeek / Qwen / GLM 等主流大模型</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>点击右上角 ⚙ 配置 API Key 后开始对话</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
            <div className="msg-body">
              {msg.role === 'assistant' ? (
                <ReactMarkdown components={{ code({ inline, className, children }) {
                  if (inline) return <code style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{children}</code>
                  return <CodeBlock className={className}>{children}</CodeBlock>
                }}}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="cursor-blink">▋</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input-area">
        {!hasConfig && (
          <div className="no-config">请先点击右上角 ⚙ 配置 API Key</div>
        )}
        <div className="input-row">
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={hasConfig ? '输入消息... (Enter 发送, Shift+Enter 换行)' : '请先配置 API Key'}
            disabled={!hasConfig || streaming}
            rows={3}
          />
          <button
            className={`send-btn ${streaming ? 'stop' : ''}`}
            onClick={() => sendMessage(input)}
            disabled={!hasConfig || streaming || !input.trim()}
          >
            {streaming ? '...' : '发送'}
          </button>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
