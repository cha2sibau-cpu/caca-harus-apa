import { render, screen, waitFor } from '@testing-library/react'
import Board from '@/components/Board'

global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve([]),
  ok: true,
}) as jest.Mock

describe('Board', () => {
  it('renders all four quadrant labels', async () => {
    render(<Board />)
    await waitFor(() => {
      expect(screen.getByText(/DO FIRST/i)).toBeInTheDocument()
      expect(screen.getByText(/SCHEDULE/i)).toBeInTheDocument()
      expect(screen.getByText(/DELEGATE/i)).toBeInTheDocument()
      expect(screen.getByText(/ELIMINATE/i)).toBeInTheDocument()
    })
  })

  it('renders the app header', () => {
    render(<Board />)
    expect(screen.getByText('Eisenhower Board')).toBeInTheDocument()
  })
})
