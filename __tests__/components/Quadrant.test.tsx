import { render, screen } from '@testing-library/react'
import Quadrant from '@/components/Quadrant'
import type { Task } from '@/lib/types'

const tasks: Task[] = [
  { id: '1', title: 'First task', description: null, quadrant: 'q1', completed: false, created_at: '2024-01-01' },
  { id: '2', title: 'Done task', description: null, quadrant: 'q1', completed: true, created_at: '2024-01-02' },
]

describe('Quadrant', () => {
  it('renders quadrant label and task count', () => {
    render(<Quadrant quadrant="q1" tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText(/DO FIRST/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders all task titles', () => {
    render(<Quadrant quadrant="q1" tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Done task')).toBeInTheDocument()
  })

  it('renders incomplete tasks before completed', () => {
    render(<Quadrant quadrant="q1" tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    const items = screen.getAllByRole('checkbox')
    expect(items[0]).not.toBeChecked()
    expect(items[1]).toBeChecked()
  })
})
