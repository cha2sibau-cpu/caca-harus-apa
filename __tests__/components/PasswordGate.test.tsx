import { render, screen, fireEvent } from '@testing-library/react'
import PasswordGate from '@/components/PasswordGate'

describe('PasswordGate', () => {
  beforeEach(() => localStorage.clear())

  it('shows create form when no hash stored', () => {
    render(<PasswordGate onUnlock={jest.fn()} />)
    expect(screen.getByText('Create your password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<PasswordGate onUnlock={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'xyz' } })
    fireEvent.click(screen.getByRole('button', { name: /create password/i }))
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
  })
})
