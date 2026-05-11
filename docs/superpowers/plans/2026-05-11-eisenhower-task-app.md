# Eisenhower Task App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 App Router app with an Eisenhower priority board, device-local password gate, and an AI chat drawer that auto-classifies tasks using Claude Sonnet.

**Architecture:** All API keys stay server-side in Next.js API routes. The browser talks only to `/api/*` endpoints. Device password is hashed with bcryptjs and stored in localStorage — no server-side auth. Tasks persist in a Supabase `tasks` table via server-side Supabase client calls.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `bcryptjs`, Jest + React Testing Library

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/layout.tsx` | Root layout, Inter font, metadata |
| `app/page.tsx` | Entry: password gate → board |
| `app/globals.css` | Tailwind directives + `animate-shake` keyframe |
| `app/api/tasks/route.ts` | GET all tasks, POST create task |
| `app/api/tasks/[id]/route.ts` | PATCH toggle complete, DELETE |
| `app/api/chat/route.ts` | POST: Claude inference + task insertion |
| `lib/types.ts` | Task, Message, AIResponse, Quadrant types |
| `lib/supabase.ts` | Server-side Supabase client singleton |
| `components/PasswordGate.tsx` | Create/enter device password UI |
| `components/Board.tsx` | 2×2 grid, owns task state |
| `components/Quadrant.tsx` | Single quadrant: header + task list |
| `components/TaskCard.tsx` | Task row: checkbox, delete, title, description |
| `components/AIChatDrawer.tsx` | Bottom bar + expandable chat panel |
| `jest.config.ts` | Jest config via next/jest |
| `jest.setup.ts` | `@testing-library/jest-dom` setup |
| `__tests__/components/PasswordGate.test.tsx` | Password gate unit tests |
| `__tests__/components/TaskCard.test.tsx` | Task card unit tests |
| `__tests__/components/Quadrant.test.tsx` | Quadrant render tests |
| `__tests__/components/Board.test.tsx` | Board render + fetch mock tests |
| `__tests__/components/AIChatDrawer.test.tsx` | Drawer open/close tests |
| `__tests__/api/tasks.test.ts` | Tasks route handler tests |
| `__tests__/api/tasks-id.test.ts` | Task PATCH/DELETE route tests |
| `__tests__/api/chat.test.ts` | Chat route tests |

---

## Task 1: Scaffold project + install dependencies + Jest

**Files:**
- Create: entire Next.js project in current directory
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Scaffold Next.js project**

Run in `/Users/nursatya/Documents/caca-harus-apa`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```
When prompted interactively, choose:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Turbopack for dev server: No (use default Webpack)
- Customize import alias: Yes → `@/*`

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Install Jest and React Testing Library**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 4: Add test script to package.json**

Open `package.json` and add `"test": "jest"` to the `scripts` section:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest"
}
```

- [ ] **Step 5: Create jest.config.ts**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 6: Create jest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create .env.local**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

(Fill in real values from Supabase dashboard and Anthropic console before running the app. See the Supabase Setup Guide in the design spec.)

- [ ] **Step 8: Git init and initial commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with dependencies"
```

Expected: `git log --oneline` shows one commit.

---

## Task 2: Types and Supabase client

**Files:**
- Create: `lib/types.ts`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Write failing test for types module**

Create `__tests__/lib/types.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="types"
```
Expected: FAIL — cannot find module `@/lib/types`

- [ ] **Step 3: Create lib/types.ts**

```typescript
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
```

- [ ] **Step 4: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- --testPathPattern="types"
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/supabase.ts __tests__/lib/types.test.ts
git commit -m "feat: add types and Supabase client"
```

---

## Task 3: Tasks API route — GET and POST

**Files:**
- Create: `app/api/tasks/route.ts`
- Create: `__tests__/api/tasks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/tasks.test.ts`:
```typescript
const mockTask = {
  id: '1', title: 'Test', description: null,
  quadrant: 'q1', completed: false, created_at: '2024-01-01',
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [mockTask], error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockTask, error: null }),
        }),
      }),
    }),
  },
}))

import { GET, POST } from '@/app/api/tasks/route'

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="api/tasks\\.test"
```
Expected: FAIL — cannot find module `@/app/api/tasks/route`

- [ ] **Step 3: Create app/api/tasks/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { title, description, quadrant } = await request.json()

  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, description, quadrant })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="api/tasks\\.test"
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/tasks/route.ts __tests__/api/tasks.test.ts
git commit -m "feat: add tasks GET and POST API routes"
```

---

## Task 4: Task API route — PATCH and DELETE

**Files:**
- Create: `app/api/tasks/[id]/route.ts`
- Create: `__tests__/api/tasks-id.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/tasks-id.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="tasks-id"
```
Expected: FAIL — cannot find module `@/app/api/tasks/[id]/route`

- [ ] **Step 3: Create app/api/tasks/[id]/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { completed } = await request.json()

  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="tasks-id"
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/tasks/[id]/route.ts __tests__/api/tasks-id.test.ts
git commit -m "feat: add task PATCH and DELETE API routes"
```

---

## Task 5: Chat API route

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `__tests__/api/chat.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/chat.test.ts`:
```typescript
const mockInsertedTask = {
  id: '1', title: 'Test task', description: 'Desc',
  quadrant: 'q1', completed: false, created_at: '2024-01-01',
}

jest.mock('@anthropic-ai/sdk', () => {
  return {
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="api/chat"
```
Expected: FAIL — cannot find module `@/app/api/chat/route`

- [ ] **Step 3: Create app/api/chat/route.ts**

```typescript
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import type { Message, AIResponse } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
  const { message, context, history }: { message: string; context: string; history: Message[] } =
    await request.json()

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `My context: ${context}` },
    { role: 'assistant', content: "Understood. Describe your tasks and I'll prioritize them for you." },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed: AIResponse = JSON.parse(text)

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="api/chat"
```
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts __tests__/api/chat.test.ts
git commit -m "feat: add Claude chat API route"
```

---

## Task 6: PasswordGate component

**Files:**
- Create: `components/PasswordGate.tsx`
- Create: `__tests__/components/PasswordGate.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/PasswordGate.test.tsx`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="PasswordGate"
```
Expected: FAIL — cannot find module `@/components/PasswordGate`

- [ ] **Step 3: Create components/PasswordGate.tsx**

```typescript
'use client'
import { useState, useEffect } from 'react'
import bcrypt from 'bcryptjs'

const STORAGE_KEY = 'device_password_hash'

interface PasswordGateProps {
  onUnlock: () => void
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [hasHash, setHasHash] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    setHasHash(!!localStorage.getItem(STORAGE_KEY))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    const hash = await bcrypt.hash(password, 10)
    localStorage.setItem(STORAGE_KEY, hash)
    onUnlock()
  }

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault()
    const hash = localStorage.getItem(STORAGE_KEY)!
    const match = await bcrypt.compare(password, hash)
    if (match) {
      onUnlock()
    } else {
      setError('Incorrect password')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const btnClass = 'w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700'

  if (hasHash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form
          onSubmit={handleEnter}
          className={`bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm ${shake ? 'animate-shake' : ''}`}
        >
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Enter your password</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Password"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button type="submit" className={btnClass}>Unlock</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleCreate} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Create your password</h1>
        <p className="text-sm text-gray-500 mb-6">This password is stored only on this device.</p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={inputClass}
          placeholder="Password"
        />
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className={inputClass}
          placeholder="Confirm password"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button type="submit" className={btnClass}>Create password</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="PasswordGate"
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/PasswordGate.tsx __tests__/components/PasswordGate.test.tsx
git commit -m "feat: add PasswordGate component"
```

---

## Task 7: TaskCard component

**Files:**
- Create: `components/TaskCard.tsx`
- Create: `__tests__/components/TaskCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/TaskCard.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import TaskCard from '@/components/TaskCard'
import type { Task } from '@/lib/types'

const mockTask: Task = {
  id: '1', title: 'Test task', description: 'A description',
  quadrant: 'q1', completed: false, created_at: '2024-01-01',
}

describe('TaskCard', () => {
  it('renders title and description', () => {
    render(<TaskCard task={mockTask} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('calls onToggle with new completed value', () => {
    const onToggle = jest.fn()
    render(<TaskCard task={mockTask} onToggle={onToggle} onDelete={jest.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = jest.fn()
    render(<TaskCard task={mockTask} onToggle={jest.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete "Test task"'))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('shows strikethrough for completed task', () => {
    render(<TaskCard task={{ ...mockTask, completed: true }} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Test task')).toHaveClass('line-through')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="TaskCard"
```
Expected: FAIL — cannot find module `@/components/TaskCard`

- [ ] **Step 3: Create components/TaskCard.tsx**

```typescript
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border group ${
        task.completed ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'
      }`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id, !task.completed)}
        className="mt-0.5 shrink-0 accent-blue-600 cursor-pointer"
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-tight ${
            task.completed ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Delete "${task.title}"`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="TaskCard"
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/TaskCard.tsx __tests__/components/TaskCard.test.tsx
git commit -m "feat: add TaskCard component"
```

---

## Task 8: Quadrant component

**Files:**
- Create: `components/Quadrant.tsx`
- Create: `__tests__/components/Quadrant.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/Quadrant.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import Quadrant from '@/components/Quadrant'
import type { Task } from '@/lib/types'

const tasks: Task[] = [
  { id: '1', title: 'First task', description: null, quadrant: 'q1', completed: false, created_at: '2024-01-01' },
  { id: '2', title: 'Done task', description: null, quadrant: 'q1', completed: true, created_at: '2024-01-02' },
]

describe('Quadrant', () => {
  it('renders quadrant label and task count', () => {
    render(<Quadrant quadrant="q1" tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText(/DO FIRST/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders all task titles', () => {
    render(<Quadrant quadrant="q1" tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Done task')).toBeInTheDocument()
  })

  it('renders incomplete tasks before completed', () => {
    render(<Quadrant quadrant="q1" tasks={tasks} onToggle={jest.fn()} onDelete={jest.fn()} />)
    const items = screen.getAllByRole('checkbox')
    expect(items[0]).not.toBeChecked()
    expect(items[1]).toBeChecked()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="Quadrant"
```
Expected: FAIL — cannot find module `@/components/Quadrant`

- [ ] **Step 3: Create components/Quadrant.tsx**

```typescript
import type { Task, Quadrant as QuadrantType } from '@/lib/types'
import TaskCard from './TaskCard'

const CONFIG = {
  q1: { label: 'Q1 — DO FIRST',    bg: 'bg-red-50',   border: 'border-red-200',   header: 'text-red-600',   badge: 'bg-red-100 text-red-600' },
  q2: { label: 'Q2 — SCHEDULE',    bg: 'bg-blue-50',  border: 'border-blue-200',  header: 'text-blue-600',  badge: 'bg-blue-100 text-blue-600' },
  q3: { label: 'Q3 — DELEGATE',    bg: 'bg-amber-50', border: 'border-amber-200', header: 'text-amber-600', badge: 'bg-amber-100 text-amber-600' },
  q4: { label: 'Q4 — ELIMINATE',   bg: 'bg-gray-50',  border: 'border-gray-200',  header: 'text-gray-500',  badge: 'bg-gray-100 text-gray-500' },
}

interface QuadrantProps {
  quadrant: QuadrantType
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export default function Quadrant({ quadrant, tasks, onToggle, onDelete }: QuadrantProps) {
  const { label, bg, border, header, badge } = CONFIG[quadrant]
  const sorted = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed))

  return (
    <div className={`rounded-xl border ${bg} ${border} flex flex-col overflow-hidden`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b ${border}`}>
        <span className={`text-xs font-bold uppercase tracking-wide ${header}`}>{label}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badge}`}>{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-28">
        {sorted.map(task => (
          <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="Quadrant"
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/Quadrant.tsx __tests__/components/Quadrant.test.tsx
git commit -m "feat: add Quadrant component"
```

---

## Task 9: Board component

**Files:**
- Create: `components/Board.tsx`
- Create: `__tests__/components/Board.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/Board.test.tsx`:
```typescript
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

  it('renders the app header', async () => {
    render(<Board />)
    expect(screen.getByText('Eisenhower Board')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="Board"
```
Expected: FAIL — cannot find module `@/components/Board`

- [ ] **Step 3: Create components/Board.tsx**

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import Quadrant from './Quadrant'
import AIChatDrawer from './AIChatDrawer'
import type { Task, Quadrant as QuadrantType } from '@/lib/types'

const QUADRANTS: QuadrantType[] = ['q1', 'q2', 'q3', 'q4']

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(data)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleToggle(id: string, completed: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-800">Eisenhower Board</h1>
      </header>
      <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 pb-16">
        {QUADRANTS.map(q => (
          <Quadrant
            key={q}
            quadrant={q}
            tasks={tasks.filter(t => t.quadrant === q)}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </main>
      <AIChatDrawer onTasksAdded={fetchTasks} />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="Board"
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/Board.tsx __tests__/components/Board.test.tsx
git commit -m "feat: add Board component"
```

---

## Task 10: AIChatDrawer component

**Files:**
- Create: `components/AIChatDrawer.tsx`
- Create: `__tests__/components/AIChatDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/AIChatDrawer.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import AIChatDrawer from '@/components/AIChatDrawer'

describe('AIChatDrawer', () => {
  beforeEach(() => localStorage.clear())

  it('renders collapsed bar with AI Assistant label', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument()
  })

  it('expands when open button clicked', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Open AI assistant'))
    expect(screen.getByLabelText('Close AI assistant')).toBeInTheDocument()
  })

  it('collapses when close button clicked', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Open AI assistant'))
    fireEvent.click(screen.getByLabelText('Close AI assistant'))
    expect(screen.getByLabelText('Open AI assistant')).toBeInTheDocument()
  })

  it('shows context setup form on first open', () => {
    render(<AIChatDrawer onTasksAdded={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Open AI assistant'))
    expect(screen.getByPlaceholderText(/product manager/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="AIChatDrawer"
```
Expected: FAIL — cannot find module `@/components/AIChatDrawer`

- [ ] **Step 3: Create components/AIChatDrawer.tsx**

```typescript
'use client'
import { useState, useRef, useEffect } from 'react'
import type { Message } from '@/lib/types'

const CONTEXT_KEY = 'ai_context'

interface AIChatDrawerProps {
  onTasksAdded: () => void
}

export default function AIChatDrawer({ onTasksAdded }: AIChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState('')
  const [savedContext, setSavedContext] = useState('')
  const [editingContext, setEditingContext] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(CONTEXT_KEY) ?? ''
    setSavedContext(saved)
  }, [])

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  function saveContext() {
    if (!context.trim()) return
    localStorage.setItem(CONTEXT_KEY, context.trim())
    setSavedContext(context.trim())
    setEditingContext(false)
    setContext('')
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context: savedContext, history: messages }),
      })
      const data = await res.json()
      setMessages([...newHistory, { role: 'assistant', content: data.message }])
      onTasksAdded()
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const contextReady = !!savedContext && !editingContext

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-blue-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-600">✦ AI Assistant</span>
          <button onClick={() => setIsOpen(true)} className="text-blue-600 hover:text-blue-700 p-1" aria-label="Open AI assistant">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl flex flex-col h-1/2 md:h-1/2">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
            <span className="text-sm font-medium text-blue-600">✦ AI Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close AI assistant">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {!savedContext || editingContext ? (
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="text-xs text-gray-500 mb-2">
                {editingContext ? 'Edit your context:' : 'Describe your role and situation so I can prioritize better:'}
              </p>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="e.g. I'm a product manager at a startup, juggling sprint planning..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveContext} disabled={!context.trim()} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 disabled:opacity-50">
                  Save
                </button>
                {editingContext && (
                  <button onClick={() => { setEditingContext(false); setContext('') }} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 border-b border-gray-100 shrink-0 flex items-start gap-2">
              <p className="text-xs text-gray-500 flex-1 truncate">
                <span className="font-medium text-gray-700">Context:</span> {savedContext}
              </p>
              <button onClick={() => { setEditingContext(true); setContext(savedContext) }} className="text-gray-400 hover:text-gray-600 shrink-0" aria-label="Edit context">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {messages.length === 0 && contextReady && (
              <p className="text-xs text-gray-400 text-center mt-4">Describe your tasks in natural language and I'll add them to the board.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-50 text-blue-900 self-end' : 'bg-gray-100 text-gray-800 self-start'}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-xl self-start">
                <span className="animate-pulse">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 shrink-0 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!contextReady || loading}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder={contextReady ? 'Describe your tasks...' : 'Save your context first'}
            />
            <button type="submit" disabled={!contextReady || !input.trim() || loading} className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="AIChatDrawer"
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/AIChatDrawer.tsx __tests__/components/AIChatDrawer.test.tsx
git commit -m "feat: add AIChatDrawer component"
```

---

## Task 11: Root page + layout + globals.css

**Files:**
- Modify: `app/page.tsx` (replace default content)
- Modify: `app/layout.tsx` (replace default content)
- Modify: `app/globals.css` (add shake animation)

- [ ] **Step 1: Replace app/page.tsx**

```typescript
'use client'
import { useState } from 'react'
import PasswordGate from '@/components/PasswordGate'
import Board from '@/components/Board'

export default function Home() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />
  return <Board />
}
```

- [ ] **Step 2: Replace app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Eisenhower Board',
  description: 'Priority task management with AI assistance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-8px); }
    80%       { transform: translateX(4px); }
  }
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: All tests PASS (no failures)

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx app/globals.css
git commit -m "feat: wire root page and layout"
```

---

## Task 12: Supabase setup + smoke test

**This task requires real credentials — run it after creating your Supabase project.**

- [ ] **Step 1: Create Supabase project**

1. Go to https://supabase.com → Sign in → **New project**
2. Name: `eisenhower-board` (or any name)
3. Choose region closest to you
4. Set a database password → **Create new project**
5. Wait ~1 minute for provisioning

- [ ] **Step 2: Copy credentials**

In your Supabase project:
1. Go to **Project Settings** (gear icon) → **API**
2. Copy **Project URL** — paste as `SUPABASE_URL` in `.env.local`
3. Copy **anon / public** key — paste as `SUPABASE_ANON_KEY` in `.env.local`

Also add your Anthropic API key (from https://console.anthropic.com):
```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 3: Create the tasks table**

In Supabase dashboard → **SQL Editor** → **New query** → paste and click **Run**:
```sql
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  quadrant     text not null check (quadrant in ('q1','q2','q3','q4')),
  completed    boolean not null default false,
  created_at   timestamptz not null default now()
);
```
Expected: "Success. No rows returned."

- [ ] **Step 4: Start the dev server**

```bash
npm run dev
```
Expected: `ready - started server on 0.0.0.0:3000`

- [ ] **Step 5: Smoke test password gate**

Open http://localhost:3000 in your browser.
- Should see "Create your password" form
- Enter a password and confirm → should see the board with 4 empty quadrants
- Refresh the page → should see "Enter your password"
- Enter the correct password → board appears
- Enter wrong password → form shakes with "Incorrect password"

- [ ] **Step 6: Smoke test AI assistant**

- Click "✦ AI Assistant" bar at the bottom → drawer slides up
- Enter context: "I'm a software developer with a deadline tomorrow"
- Click **Save**
- Type: "I need to fix a production bug, write unit tests, read a book, and clean my desk"
- Click **Send**
- Expected: Claude responds, 4 tasks appear on the board in appropriate quadrants

- [ ] **Step 7: Smoke test task management**

- Check a task's checkbox → task moves to bottom with strikethrough
- Hover a task → delete (✕) icon appears → click it → task disappears
- Verify changes persist after page refresh (they live in Supabase)

- [ ] **Step 8: Commit .env.local to .gitignore**

Verify `.env.local` is in `.gitignore` (create-next-app adds this by default):
```bash
grep ".env.local" .gitignore
```
Expected: `.env.local` appears in output. If not, add it:
```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "chore: ensure .env.local is gitignored"
```

---

## Self-Review Notes

| Spec requirement | Covered in |
|-----------------|-----------|
| Q1–Q4 board with task count | Task 8 (Quadrant), Task 9 (Board) |
| Mark complete | Task 7 (TaskCard checkbox), Task 4 (PATCH route) |
| Delete tasks | Task 7 (TaskCard delete), Task 4 (DELETE route) |
| Device password gate (create + enter) | Task 6 (PasswordGate) |
| Hash stored in localStorage | Task 6 (bcryptjs + STORAGE_KEY) |
| AI panel with context input | Task 10 (AIChatDrawer) |
| Claude sonnet-4-6 model | Task 5 (chat route) |
| Structured JSON response parsing | Task 5 (chat route) |
| Tasks auto-added to board | Task 5 (Supabase insert) + Task 9 (onTasksAdded callback) |
| Supabase CRUD via API routes | Tasks 3, 4, 5 |
| Mobile-responsive layout | Task 9 (grid-cols-1 md:grid-cols-2), Task 10 (h-1/2) |
| Supabase setup guide | Task 12 (step-by-step) |
| Light mode | Tailwind default + white/gray/colored backgrounds throughout |
| Shake animation on wrong password | Task 11 (globals.css + Task 6 animate-shake) |
