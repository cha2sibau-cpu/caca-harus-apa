/** @jest-environment node */

const mockTask = {
  id: '1', title: 'Test', description: null,
  quadrant: 'q1', completed: true, created_at: '2024-01-01',
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: mockTask, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}))

import { PATCH, DELETE } from '@/app/api/tasks/[id]/route'

describe('PATCH /api/tasks/[id]', () => {
  it('updates completed and returns task', async () => {
    const request = new Request('http://localhost:3000/api/tasks/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    const response = await PATCH(request, { params: { id: '1' } })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.completed).toBe(true)
  })
})

describe('DELETE /api/tasks/[id]', () => {
  it('deletes task and returns success', async () => {
    const request = new Request('http://localhost:3000/api/tasks/1', { method: 'DELETE' })
    const response = await DELETE(request, { params: { id: '1' } })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
