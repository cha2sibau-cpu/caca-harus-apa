import { render, screen, fireEvent } from '@testing-library/react'
import AIChatDrawer from '@/components/AIChatDrawer'

describe('AIChatDrawer', () => {
  beforeEach(() => localStorage.clear())

  it('renders collapsed bar with AI Assistant label', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument()
  })

  it('expands when open button clicked', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Open AI assistant'))
    expect(screen.getByLabelText('Close AI assistant')).toBeInTheDocument()
  })

  it('collapses when close button clicked', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Open AI assistant'))
    fireEvent.click(screen.getByLabelText('Close AI assistant'))
    expect(screen.getByLabelText('Open AI assistant')).toBeInTheDocument()
  })

  it('shows context setup form on first open', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Open AI assistant'))
    expect(screen.getByPlaceholderText(/product manager/i)).toBeInTheDocument()
  })
})
