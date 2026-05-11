export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4'

export interface Task {
  id: string
  title: string
  description: string | null
  quadrant: Quadrant
  completed: boolean
  created_at: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  tasks: {
    title: string
    description: string
    quadrant: Quadrant
    reasoning: string
  }[]
  message: string
}
