import type { Task, Quadrant } from '@/lib/types'

const QUADRANT_LABELS: Record<Quadrant, string> = {
  q1: 'Q1 — Do First',
  q2: 'Q2 — Schedule',
  q3: 'Q3 — Delegate',
  q4: 'Q4 — Eliminate',
}

interface DoneListProps {
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export default function DoneList({ tasks, onToggle, onDelete }: DoneListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        Nothing done yet
      </div>
    )
  }

  return (
    <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto pb-16">
      {tasks.map(task => (
        <div
          key={task.id}
          className="flex items-start gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50 group"
        >
          <input
            type="checkbox"
            checked={true}
            onChange={() => onToggle(task.id, false)}
            className="mt-0.5 shrink-0 accent-gray-400 cursor-pointer"
            aria-label={`Mark "${task.title}" as incomplete`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight line-through text-gray-400">
              {task.title}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              {QUADRANT_LABELS[task.quadrant]}
            </p>
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Delete "${task.title}"`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
