'use client'
import { useState, useEffect } from 'react'
import bcrypt from 'bcryptjs'

const STORAGE_KEY = 'device_password_hash'

interface PasswordGateProps {
  onUnlock: () => void
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [hasHash, setHasHash] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    setHasHash(!!localStorage.getItem(STORAGE_KEY))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    const hash = await bcrypt.hash(password, 10)
    localStorage.setItem(STORAGE_KEY, hash)
    onUnlock()
  }

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault()
    const hash = localStorage.getItem(STORAGE_KEY)!
    const match = await bcrypt.compare(password, hash)
    if (match) {
      onUnlock()
    } else {
      setError('Incorrect password')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const btnClass = 'w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700'

  if (hasHash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form
          onSubmit={handleEnter}
          className={`bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm ${shake ? 'animate-shake' : ''}`}
        >
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Enter your password</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Password"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button type="submit" className={btnClass}>Unlock</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleCreate} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Create your password</h1>
        <p className="text-sm text-gray-500 mb-6">This password is stored only on this device.</p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={inputClass}
          placeholder="Password"
        />
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className={inputClass}
          placeholder="Confirm password"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button type="submit" className={btnClass}>Create password</button>
      </form>
    </div>
  )
}
