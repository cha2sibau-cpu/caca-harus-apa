import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Quadrant } from '@/lib/types'

const VALID_QUADRANTS: Quadrant[] = ['q1', 'q2', 'q3', 'q4']

export async function GET() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  let body: { title?: unknown; description?: unknown; quadrant?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, description, quadrant } = body

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!quadrant || !VALID_QUADRANTS.includes(quadrant as Quadrant)) {
    return NextResponse.json({ error: 'quadrant must be q1, q2, q3, or q4' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: title.trim(),
      description: description && typeof description === 'string' ? description.trim() : null,
      quadrant,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
