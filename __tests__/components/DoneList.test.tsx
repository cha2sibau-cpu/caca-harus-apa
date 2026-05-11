import { render, screen, fireEvent } from '@testing-library/react'
import DoneList from '@/components/DoneList'
import type { Task } from '@/lib/types'

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Buy groceries',
  description: null,
  quadrant: 'q4',
  completed: true,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const QUADRANT_LABELS: Record<string, string> = {
  q1: 'Q1 — Do First',
  q2: 'Q2 — Schedule',
  q3: 'Q3 — Delegate',
  q4: 'Q4 — Eliminate',
}

describe('DoneList', () => {
  it('renders empty state when no tasks', () => {
    render(<DoneList tasks={[]} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText(/nothing done yet/i)).toBeInTheDocument()
  })

  it('renders each done task with its title', () => {
    const tasks = [makeTask({ title: 'Buy groceries' }), makeTask({ id: '2', title: 'Call dentist', quadrant: 'q2' })]
    render(<DoneList tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('Call dentist')).toBeInTheDocument()
  })

  it('shows the original quadrant label for each task', () => {
    const tasks = [makeTask({ quadrant: 'q1' }), makeTask({ id: '2', quadrant: 'q3', title: 'Other' })]
    render(<DoneList tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText(QUADRANT_LABELS['q1'])).toBeInTheDocument()
    expect(screen.getByText(QUADRANT_LABELS['q3'])).toBeInTheDocument()
  })

  it('calls onToggle with (id, false) when unchecked', () => {
    const onToggle = jest.fn()
    render(<DoneList tasks={[makeTask()]} onToggle={onToggle} onDelete={jest.fn()} />)
    const checkbox = screen.getByRole('checkbox', { name: /mark "buy groceries" as incomplete/i })
    fireEvent.click(checkbox)
    expect(onToggle).toHaveBeenCalledWith('1', false)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = jest.fn()
    render(<DoneList tasks={[makeTask()]} onToggle={jest.fn()} onDelete={onDelete} />)
    const btn = screen.getByRole('button', { name: /delete "buy groceries"/i })
    fireEvent.click(btn)
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
