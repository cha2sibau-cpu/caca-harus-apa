'use client'
import { useState, useEffect, useCallback } from 'react'
import Quadrant from './Quadrant'
import AIChatDrawer from './AIChatDrawer'
import type { Task, Quadrant as QuadrantType } from '@/lib/types'

const QUADRANTS: QuadrantType[] = ['q1', 'q2', 'q3', 'q4']

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleToggle(id: string, completed: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-800">Eisenhower Board</h1>
      </header>
      <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 pb-16">
        {QUADRANTS.map(q => (
          <Quadrant
            key={q}
            quadrant={q}
            tasks={tasks.filter(t => t.quadrant === q)}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </main>
      <AIChatDrawer onTasksAdded={fetchTasks} />
    </div>
  )
}
