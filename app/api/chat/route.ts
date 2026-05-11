import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import type { Message, AIResponse } from '@/lib/types'

const SYSTEM_PROMPT = `You are a task prioritization assistant. The user will describe tasks in natural language.
Return ONLY valid JSON — no markdown, no extra text — in this exact shape:
{
  "tasks": [
    { "title": "...", "description": "...", "quadrant": "q1"|"q2"|"q3"|"q4", "reasoning": "..." }
  ],
  "message": "A brief human-readable summary of what you added."
}
Quadrant rules:
  q1 = urgent + important (do first)
  q2 = not urgent + important (schedule)
  q3 = urgent + not important (delegate)
  q4 = not urgent + not important (eliminate)`

export async function POST(request: Request) {
  let body: { message?: unknown; context?: unknown; history?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message, context, history } = body

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  if (!context || typeof context !== 'string' || context.trim() === '') {
    return NextResponse.json({ error: 'context is required' }, { status: 400 })
  }

  const safeHistory: Message[] = Array.isArray(history)
    ? history.filter(
        (m): m is Message =>
          m && typeof m === 'object' &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
    : []

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `My context: ${context.trim()}` },
    { role: 'assistant', content: "Understood. Describe your tasks and I'll prioritize them for you." },
    ...safeHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message.trim() },
  ]

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  let parsed: AIResponse
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    parsed = JSON.parse(text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `AI request failed: ${msg}` }, { status: 502 })
  }

  if (!Array.isArray(parsed.tasks)) {
    return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 })
  }

  const insertedTasks = await Promise.all(
    parsed.tasks.map(async t => {
      const { data } = await supabase
        .from('tasks')
        .insert({ title: t.title, description: t.description, quadrant: t.quadrant })
        .select()
        .single()
      return data
    })
  )

  return NextResponse.json({ tasks: insertedTasks, message: parsed.message })
}
