/** @jest-environment node */

const mockInsertedTask = {
  id: '1', title: 'Test task', description: 'Desc',
  quadrant: 'q1', completed: false, created_at: '2024-01-01',
}

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              tasks: [{ title: 'Test task', description: 'Desc', quadrant: 'q1', reasoning: 'Urgent' }],
              message: 'Added 1 task to your board.',
            }),
          }],
        }),
      },
    })),
  }
})

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockInsertedTask, error: null }),
        }),
      }),
    }),
  },
}))

import { POST } from '@/app/api/chat/route'

describe('POST /api/chat', () => {
  it('returns tasks and message from Claude', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I have a board review today',
        context: 'Product manager at a startup',
        history: [],
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('Added 1 task to your board.')
    expect(Array.isArray(data.tasks)).toBe(true)
  })
})
