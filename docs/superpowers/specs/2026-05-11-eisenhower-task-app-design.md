# Eisenhower Task App — Design Spec
_Date: 2026-05-11_

## Overview

A personal productivity app combining an Eisenhower priority matrix with an AI assistant that automatically classifies and adds tasks. Device-gated via a local password (no server-side auth). Accessible from any device via URL; tasks persisted in Supabase.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS (light mode) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Password hashing | `bcryptjs` (client-side, localStorage) |

All Supabase and Anthropic SDK calls are **server-side only** (API routes). No secrets exposed to the browser.

---

## Architecture

### File Structure

```
/app
  layout.tsx                  — root layout, fonts, global styles
  page.tsx                    — entry point: password gate → board
  /api
    /tasks
      route.ts                — GET (list all), POST (create)
      /[id]
        route.ts              — PATCH (toggle complete), DELETE
    /chat
      route.ts                — POST: Claude inference + task creation
/components
  PasswordGate.tsx            — create/enter password flow
  Board.tsx                   — 2×2 grid, fetches + owns task state
  Quadrant.tsx                — single quadrant with task list
  TaskCard.tsx                — task row: complete, delete, title, description
  AIChatDrawer.tsx            — bottom bar + expandable chat panel
/lib
  supabase.ts                 — server-side Supabase client
  types.ts                    — Task, Quadrant, AIResponse types
/.env.local                   — SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
```

---

## Data Model

### Supabase — `tasks` table

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

### TypeScript types (`/lib/types.ts`)

```typescript
export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  quadrant: Quadrant;
  completed: boolean;
  created_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  tasks: {
    title: string;
    description: string;
    quadrant: Quadrant;
    reasoning: string;
  }[];
  message: string;
}
```

---

## API Routes

| Method | Path | Request body | Response |
|--------|------|-------------|----------|
| `GET` | `/api/tasks` | — | `Task[]` ordered by `created_at` desc |
| `POST` | `/api/tasks` | `{title, description, quadrant}` | Created `Task` |
| `PATCH` | `/api/tasks/[id]` | `{completed: boolean}` | Updated `Task` |
| `DELETE` | `/api/tasks/[id]` | — | `{success: true}` |
| `POST` | `/api/chat` | `{message: string, context: string, history: Message[]}` | `{tasks: Task[], message: string}` |

The `/api/chat` route:
1. Builds a system prompt instructing Claude to return only valid JSON matching `AIResponse`
2. Prepends the user's `context` as the first user turn
3. Sends the full conversation `history` for multi-turn awareness
4. Parses the JSON response
5. Inserts all returned tasks into Supabase
6. Returns the created tasks + Claude's `message` string

### Claude system prompt contract

```
You are a task prioritization assistant. The user will describe tasks in natural language.
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
  q4 = not urgent + not important (eliminate)
```

---

## Features

### 1. Password Gate

- **First visit** (no `device_password_hash` in localStorage):
  - Show "Create your password" form (password + confirm)
  - On submit: hash with `bcryptjs.hash(password, 10)` → store as `device_password_hash` in localStorage
  - Immediately show the board
- **Return visit** (hash exists):
  - Show "Enter your password" form
  - On submit: `bcryptjs.compare(input, storedHash)` → show board on match
  - On mismatch: shake animation + "Incorrect password" error, no lockout
- Password never leaves the device. No server involvement.

### 2. Board

- `Board.tsx` owns task state; fetches from `GET /api/tasks` on mount
- Layout: `grid-cols-2 grid-rows-2` on `md+`, single column (`flex-col`) on mobile
- Quadrant color system (light mode):
  | Quadrant | Label | Background | Border | Text |
  |---------|-------|-----------|--------|------|
  | Q1 | DO FIRST | `red-50` | `red-300` | `red-600` |
  | Q2 | SCHEDULE | `blue-50` | `blue-300` | `blue-600` |
  | Q3 | DELEGATE | `amber-50` | `amber-300` | `amber-600` |
  | Q4 | ELIMINATE | `gray-50` | `gray-300` | `gray-500` |
- Each quadrant header: full label (`Q1 — DO FIRST`) + task count badge
- Tasks sorted: incomplete first, completed at bottom (strikethrough, muted)
- `TaskCard`: checkbox (PATCH toggle), trash icon (DELETE), title, truncated description (1 line)
- Board refreshes after AI adds tasks (callback from `AIChatDrawer`)

### 3. AI Chat Drawer

**Collapsed state** (default):
- Fixed bottom bar: "✦ AI Assistant" label + chevron-up button
- Height: ~48px

**Expanded state**:
- Slides up to ~50vh on desktop, full screen on mobile
- Divided into: pinned context chip (top) → chat history (scrollable middle) → input row (bottom)

**Context setup** (first open):
- Required textarea: "Describe your role and situation (e.g. 'I'm a product manager at a startup…')"
- Chat input disabled until context is saved
- Context stored as `ai_context` in localStorage
- On subsequent opens: shown as a pinned chip with pencil icon to edit

**Chat flow**:
1. User types task description → Send (or Enter)
2. Optimistic user bubble added to chat
3. `POST /api/chat` with `{message, context, history}`
4. Loading indicator (animated dots)
5. Claude response: assistant bubble with `message` text + "Added N tasks to your board" notice
6. Board silently refreshes via callback
7. History kept in component state (cleared on page refresh)

---

## Supabase Setup Guide

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, region closest to you, and a database password → **Create**
3. Wait ~1 minute for the project to provision
4. Go to **Project Settings → API**:
   - Copy **Project URL** → this is your `SUPABASE_URL`
   - Copy **anon public** key → this is your `SUPABASE_ANON_KEY`
5. Go to **SQL Editor** → **New query** → paste and run:
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
6. Create `.env.local` in the project root:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJh...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

---

## Responsive Behaviour

| Breakpoint | Board | AI Drawer |
|-----------|-------|-----------|
| Mobile (`< md`) | Single column, quadrants stacked | Expands to full screen overlay |
| Desktop (`md+`) | 2×2 grid | Slides up ~50vh, board still visible above |

---

## Out of Scope

- Multi-user / server-side auth
- Task editing (title/description after creation)
- Drag-and-drop between quadrants
- Push notifications
- Offline support
