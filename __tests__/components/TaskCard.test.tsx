import { render, screen, fireEvent } from '@testing-library/react'
import TaskCard from '@/components/TaskCard'
import type { Task } from '@/lib/types'

const mockTask: Task = {
  id: '1', title: 'Test task', description: 'A description',
  quadrant: 'q1', completed: false, created_at: '2024-01-01',
}

describe('TaskCard', () => {
  it('renders title and description', () => {
    render(<TaskCard task={mockTask} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('calls onToggle with new completed value', () => {
    const onToggle = jest.fn()
    render(<TaskCard task={mockTask} onToggle={onToggle} onDelete={jest.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = jest.fn()
    render(<TaskCard task={mockTask} onToggle={jest.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete "Test task"'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('shows strikethrough for completed task', () => {
    render(<TaskCard task={{ ...mockTask, completed: true }} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Test task')).toHaveClass('line-through')
  })
})
