'use client'
import { useState } from 'react'
import PasswordGate from '@/components/PasswordGate'
import Board from '@/components/Board'

export default function Home() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />
  return <Board />
}
