// src/components/ChatbotWidget.jsx
// Gemini-powered AI chatbot with real Google Maps store cards

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleChatbot } from '../store/slices/chatbotSlice'
import { useLocation } from '../hooks/useLocation'
import api from '../services/api'

// ─── Minimal markdown renderer ────────────────────────────
function MarkdownText({ text }) {
  if (!text) return null

  const renderLine = (line, i) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} className="ml-4 list-disc">
          <InlineMarkdown text={line.replace(/^[-•]\s/, '')} />
        </li>
      )
    }
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={i} className="ml-4 list-decimal">
          <InlineMarkdown text={line.replace(/^\d+\.\s/, '')} />
        </li>
      )
    }
    if (line.startsWith('## ')) {
      return <p key={i} className="font-bold text-emerald-700 dark:text-emerald-400 mt-2">{line.replace('## ', '')}</p>
    }
    if (line === '') return <br key={i} />
    return <p key={i}><InlineMarkdown text={line} /></p>
  }

  const lines = text.split('\n')
  return <div className="space-y-0.5">{lines.map((line, i) => renderLine(line, i))}</div>
}

function InlineMarkdown({ text }) {
  const parts = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/)
    if (linkMatch) {
      const before = remaining.slice(0, linkMatch.index)
      if (before) parts.push(<span key={key++}>{before}</span>)
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 font-medium">
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length)
      continue
    }
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index)
      if (before) parts.push(<span key={key++}>{before}</span>)
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      continue
    }
    const italicMatch = remaining.match(/\*([^*]+)\*/)
    if (italicMatch) {
      const before = remaining.slice(0, italicMatch.index)
      if (before) parts.push(<span key={key++}>{before}</span>)
      parts.push(<em key={key++}>{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length)
      continue
    }
    parts.push(<span key={key++}>{remaining}</span>)
    break
  }

  return <>{parts}</>
}

// ─── Real Google Maps store card ─────────────────────────
function StoreCard({ store }) {
  const priceDots = store.priceLevel !== null && store.priceLevel !== undefined
    ? '₨'.repeat(store.priceLevel + 1)
    : null

  return (
    <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 mt-1.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{store.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">{store.address}</p>
        </div>
        {store.distanceText && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
            📍 {store.distanceText}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {store.rating && (
          <span className="text-xs flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
            ⭐ {store.rating.toFixed(1)}
            <span className="text-slate-400 font-normal">({store.totalRatings})</span>
          </span>
        )}
        {store.isOpenNow === true && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">✅ Open</span>
        )}
        {store.isOpenNow === false && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">❌ Closed</span>
        )}
        {priceDots && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{priceDots}</span>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <a
          href={store.directionsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg transition-colors font-medium"
        >
          🗺️ Directions
        </a>
        <a
          href={store.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 py-1.5 rounded-lg transition-colors font-medium"
        >
          📌 View on Maps
        </a>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────
function MessageBubble({ msg, onSuggestion, onEnableLocation }) {
  const isUser = msg.from === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 shadow-sm">
          🌿
        </div>
      )}

      <div className="max-w-[84%] space-y-2">
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
        }`}>
          {isUser
            ? <span>{msg.text}</span>
            : <MarkdownText text={msg.text} />
          }
        </div>

        {msg.stores?.length > 0 && (
          <div className="space-y-1.5">
            {msg.stores.map((store, i) => (
              <StoreCard key={store.placeId || i} store={store} />
            ))}
          </div>
        )}

        {msg.requiresLocation && (
          <button
            onClick={onEnableLocation}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl transition-colors font-medium shadow-sm"
          >
            📍 Enable Location Access
          </button>
        )}

        {!isUser && msg.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {msg.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion?.(s)}
                className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full hover:bg-emerald-50 dark:hover:bg-slate-600 hover:border-emerald-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {msg.timestamp && (
          <p className={`text-xs text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(msg.timestamp).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Loading dots ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
        🌿
      </div>
      <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Widget ──────────────────────────────────────────
// Navbar height = h-16 = 64px (z-50)
// Floating button: bottom-6, h-14 = 56px → button top = viewport - 24 - 56 = viewport - 80px
// Chat window: bottom = 24 + 56 + 8 = 88px (bottom-[88px])
// Max height = viewport - navbar(64) - bottom(88) - gap(16) = viewport - 168px
const NAVBAR_H = 64   // px  (h-16)
const BTN_BOTTOM = 24  // px  (bottom-6)
const BTN_H = 56       // px  (h-14)
const GAP = 8          // px  gap between button and chat window

export default function ChatbotWidget() {
  const dispatch = useDispatch()
  const { open } = useSelector((s) => s.chatbot)
  const { hasLocation, hasConsent, promptForLocation, effectiveCity } = useLocation()

  const [messages, setMessages] = useState([{
    id: 1,
    from: 'bot',
    text: `Assalam-o-Alaikum! I'm DIETORA's AI health assistant powered by **Gemini**. 🌿\n\nI have access to your health profile, meal plan, and can find **real nearby stores** using Google Maps.\n\nHow can I help you today?`,
    suggestions: ['What should I eat for diabetes?', 'Analyze my meal plan', 'Where can I buy chicken?'],
    timestamp: new Date().toISOString(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim()
    if (!trimmed || loading) return

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chatbot', { message: trimmed })
      const data = res.data.data

      const needsLocation = trimmed.toLowerCase().match(/where|kahan|buy|store|near/) && !hasConsent

      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: data.reply,
        stores: data.stores || [],
        requiresLocation: needsLocation && !data.hasStoreResults,
        suggestions: generateSuggestions(data),
        timestamp: data.timestamp,
      }])
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Connection error. Please try again.'
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: `⚠️ ${errMsg}`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, hasConsent])

  const generateSuggestions = (data) => {
    if (data.hasStoreResults) {
      return ['Show more stores', 'Get directions', 'What else can I buy nearby?']
    }
    if (data.intent === 'store_search') {
      return ['Enable GPS for exact stores', 'Find stores in my area']
    }
    return []
  }

  const clearChat = useCallback(async () => {
    try { await api.delete('/chatbot/history') } catch {}
    setMessages([{
      id: Date.now(), from: 'bot',
      text: 'Chat cleared! Ask me anything about your diet or where to buy ingredients. 🌿',
      suggestions: ['Analyze my health profile', 'Where can I buy dal?'],
      timestamp: new Date().toISOString(),
    }])
  }, [])

  const quickQuestions = [
    '🥗 Meal plan review',
    '🏥 Diabetes diet tips',
    '🛒 Where to buy chicken?',
    '💰 Budget meal ideas',
  ]

  // Chat window bottom position = button bottom + button height + gap
  const chatBottom = BTN_BOTTOM + BTN_H + GAP  // 88px

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => dispatch(toggleChatbot())}
        className="fixed z-[150] w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ bottom: `${BTN_BOTTOM}px`, right: '24px' }}
        title="DIETORA AI Assistant (Gemini)"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed right-6 z-[149] w-[22rem] sm:w-[26rem] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/20 border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden"
          style={{
            bottom: `${chatBottom}px`,
            // Max height: screen - navbar - chatBottom - small margin
            maxHeight: `calc(100vh - ${NAVBAR_H + chatBottom + 16}px)`,
            height: '560px',
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">🤖</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">DIETORA AI</p>
                <p className="text-emerald-100 text-xs flex items-center gap-1">
                  Powered by Gemini 2.0
                  {hasConsent && <span className="text-green-300 ml-1">• 📍 {effectiveCity || 'GPS ON'}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!hasConsent && (
                <button
                  onClick={promptForLocation}
                  title="Enable location for store finder"
                  className="text-emerald-100 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/15 transition-colors flex items-center gap-1"
                >
                  📍 <span className="hidden sm:inline">Location</span>
                </button>
              )}
              <button
                onClick={clearChat}
                className="text-emerald-100 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Quick Questions */}
          <div className="px-3 py-2 bg-emerald-50 dark:bg-slate-900/40 border-b border-emerald-100 dark:border-slate-700 flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q.replace(/^[^\s]+\s/, ''))}
                  className="text-xs bg-white dark:bg-slate-700 border border-emerald-200 dark:border-slate-600 text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-slate-600 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSuggestion={sendMessage}
                onEnableLocation={promptForLocation}
              />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-700 flex gap-2 flex-shrink-0 bg-white dark:bg-slate-800">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder='Ask about diet, health, or "Where to buy dal?"'
              disabled={loading}
              className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-60 transition-all"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-600 dark:disabled:to-slate-600 text-white disabled:text-slate-400 rounded-xl transition-all shadow-sm disabled:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
