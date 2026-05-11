import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: { completed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.completed !== 'boolean') {
    return NextResponse.json({ error: 'completed must be a boolean' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ completed: body.completed })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
