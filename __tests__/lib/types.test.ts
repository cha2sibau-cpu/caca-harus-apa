import type { Task, Message, AIResponse, Quadrant } from '@/lib/types'

describe('types', () => {
  it('Task has required fields', () => {
    const task: Task = {
      id: '1',
      title: 'Test',
      description: null,
      quadrant: 'q1',
      completed: false,
      created_at: '2024-01-01',
    }
    expect(task.quadrant).toBe('q1')
  })

  it('Message role is user or assistant', () => {
    const msg: Message = { role: 'user', content: 'hello' }
    expect(msg.role).toBe('user')
  })
})
