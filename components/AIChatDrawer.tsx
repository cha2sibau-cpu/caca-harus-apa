'use client'
import { useState, useRef, useEffect } from 'react'
import type { Message } from '@/lib/types'

const CONTEXT_KEY = 'ai_context'

interface AIChatDrawerProps {
  onTasksAdded: () => void
}

export default function AIChatDrawer({ onTasksAdded }: AIChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState('')
  const [savedContext, setSavedContext] = useState('')
  const [editingContext, setEditingContext] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(CONTEXT_KEY) ?? ''
    setSavedContext(saved)
  }, [])

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isOpen])

  function saveContext() {
    if (!context.trim()) return
    localStorage.setItem(CONTEXT_KEY, context.trim())
    setSavedContext(context.trim())
    setEditingContext(false)
    setContext('')
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context: savedContext, history: messages }),
      })
      const data = await res.json()
      setMessages([...newHistory, { role: 'assistant', content: data.message }])
      onTasksAdded()
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const contextReady = !!savedContext && !editingContext

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-blue-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-600">✦ AI Assistant</span>
          <button onClick={() => setIsOpen(true)} className="text-blue-600 hover:text-blue-700 p-1" aria-label="Open AI assistant">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl flex flex-col h-1/2 md:h-1/2">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
            <span className="text-sm font-medium text-blue-600">✦ AI Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close AI assistant">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {!savedContext || editingContext ? (
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-xs text-gray-500 mb-2">
                {editingContext ? 'Edit your context:' : 'Describe your role and situation so I can prioritize better:'}
              </p>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="e.g. I'm a product manager at a startup, juggling sprint planning..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveContext} disabled={!context.trim()} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 disabled:opacity-50">
                  Save
                </button>
                {editingContext && (
                  <button onClick={() => { setEditingContext(false); setContext('') }} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 border-b border-gray-100 shrink-0 flex items-start gap-2">
              <p className="text-xs text-gray-500 flex-1 truncate">
                <span className="font-medium text-gray-700">Context:</span> {savedContext}
              </p>
              <button onClick={() => { setEditingContext(true); setContext(savedContext) }} className="text-gray-400 hover:text-gray-600 shrink-0" aria-label="Edit context">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {messages.length === 0 && contextReady && (
              <p className="text-xs text-gray-400 text-center mt-4">Describe your tasks in natural language and I'll add them to the board.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-50 text-blue-900 self-end' : 'bg-gray-100 text-gray-800 self-start'}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-xl self-start">
                <span className="animate-pulse">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 shrink-0 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!contextReady || loading}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder={contextReady ? 'Describe your tasks...' : 'Save your context first'}
            />
            <button type="submit" disabled={!contextReady || !input.trim() || loading} className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
