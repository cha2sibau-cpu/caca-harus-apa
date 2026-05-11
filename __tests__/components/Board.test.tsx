import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Board from '@/components/Board'
import type { Task } from '@/lib/types'

const mockIncomplete: Task = {
  id: '1', title: 'Finish report', description: null,
  quadrant: 'q1', completed: false, created_at: '2026-01-01T00:00:00Z',
}
const mockDone: Task = {
  id: '2', title: 'Buy groceries', description: null,
  quadrant: 'q4', completed: true, created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve([mockIncomplete, mockDone]),
    ok: true,
  }) as jest.Mock
})

describe('Board', () => {
  it('renders app header', () => {
    render(<Board />)
    expect(screen.getByText('Eisenhower Board')).toBeInTheDocument()
  })

  it('shows Board and Done tabs', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^board$/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /done/i })).toBeInTheDocument()
    })
  })

  it('Done tab label shows count of completed tasks', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /done \(1\)/i })).toBeInTheDocument()
    })
  })

  it('Board tab is active by default and shows quadrants', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByText(/DO FIRST/i)).toBeInTheDocument()
      expect(screen.getByText(/SCHEDULE/i)).toBeInTheDocument()
      expect(screen.getByText(/DELEGATE/i)).toBeInTheDocument()
      expect(screen.getByText(/ELIMINATE/i)).toBeInTheDocument()
    })
  })

  it('incomplete tasks appear on Board tab', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByText('Finish report')).toBeInTheDocument()
    })
  })

  it('completed tasks do not appear on Board tab', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument()
    })
  })

  it('switching to Done tab shows completed tasks', async () => {
    render(<Board />)
    await waitFor(() => screen.getByRole('tab', { name: /done \(1\)/i }))
    fireEvent.click(screen.getByRole('tab', { name: /done/i }))
    await waitFor(() => expect(screen.getByText('Buy groceries')).toBeInTheDocument())
  })

  it('switching to Done tab hides quadrants', async () => {
    render(<Board />)
    await waitFor(() => screen.getByRole('tab', { name: /done \(1\)/i }))
    fireEvent.click(screen.getByRole('tab', { name: /done/i }))
    await waitFor(() => expect(screen.queryByText(/DO FIRST/i)).not.toBeInTheDocument())
  })
})
