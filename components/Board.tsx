'use client'
import { useState, useEffect, useCallback } from 'react'
import Quadrant from './Quadrant'
import AIChatDrawer from './AIChatDrawer'
import DoneList from './DoneList'
import type { Task, Quadrant as QuadrantType } from '@/lib/types'

const QUADRANTS: QuadrantType[] = ['q1', 'q2', 'q3', 'q4']

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'board' | 'done'>('board')

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

  const incompleteTasks = tasks.filter(t => !t.completed)
  const doneTasks = tasks.filter(t => t.completed)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Eisenhower Board</h1>
          <div role="tablist" aria-label="View" className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              role="tab"
              aria-selected={activeTab === 'board'}
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Board
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'done'}
              onClick={() => setActiveTab('done')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                activeTab === 'done'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Done {doneTasks.length > 0 && `(${doneTasks.length})`}
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'board' ? (
        <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 pb-16">
          {QUADRANTS.map(q => (
            <Quadrant
              key={q}
              quadrant={q}
              tasks={incompleteTasks.filter(t => t.quadrant === q)}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </main>
      ) : (
        <DoneList
          tasks={doneTasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}

      <AIChatDrawer onTasksAdded={fetchTasks} />
    </div>
  )
}
