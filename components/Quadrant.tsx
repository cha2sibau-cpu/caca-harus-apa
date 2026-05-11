import type { Task, Quadrant as QuadrantType } from '@/lib/types'
import TaskCard from './TaskCard'

const CONFIG = {
  q1: { label: 'Q1 — DO FIRST',    bg: 'bg-red-50',   border: 'border-red-200',   header: 'text-red-600',   badge: 'bg-red-100 text-red-600' },
  q2: { label: 'Q2 — SCHEDULE',    bg: 'bg-blue-50',  border: 'border-blue-200',  header: 'text-blue-600',  badge: 'bg-blue-100 text-blue-600' },
  q3: { label: 'Q3 — DELEGATE',    bg: 'bg-amber-50', border: 'border-amber-200', header: 'text-amber-600', badge: 'bg-amber-100 text-amber-600' },
  q4: { label: 'Q4 — ELIMINATE',   bg: 'bg-gray-50',  border: 'border-gray-200',  header: 'text-gray-500',  badge: 'bg-gray-100 text-gray-500' },
}

interface QuadrantProps {
  quadrant: QuadrantType
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export default function Quadrant({ quadrant, tasks, onToggle, onDelete }: QuadrantProps) {
  const { label, bg, border, header, badge } = CONFIG[quadrant]
  const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed))

  return (
    <div className={`rounded-xl border ${bg} ${border} flex flex-col overflow-hidden`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b ${border}`}>
        <span className={`text-xs font-bold uppercase tracking-wide ${header}`}>{label}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badge}`}>{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-28">
        {sorted.map(task => (
          <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
