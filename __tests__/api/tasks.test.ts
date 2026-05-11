const mockTask = {
  id: '1',
  title: 'Test',
  description: null,
  quadrant: 'q1',
  completed: false,
  created_at: '2024-01-01',
}

// Mock before importing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [mockTask], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockTask, error: null })),
        })),
      })),
    })),
  },
}))

import { GET, POST } from '@/app/api/tasks/route'

describe('Tasks API Routes', () => {
  describe('GET /api/tasks', () => {
    it('returns tasks array with status 200', async () => {
      const response = await GET()
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0].title).toBe('Test')
    })
  })

  describe('POST /api/tasks', () => {
    it('creates a task and returns status 201', async () => {
      const request = new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', description: null, quadrant: 'q1' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.title).toBe('Test')
    })
  })
})
