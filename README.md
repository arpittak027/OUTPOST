<div align="center">

# Outpost

**An agentic AI workspace: chat with an AI agent that draws on a live whiteboard canvas and writes docs, while your team works alongside it in real time.**

Developed by [Arpit Tak](https://github.com/arpittak027)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth%20%26%20Orgs-6c47ff?style=flat&logo=clerk)](https://clerk.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Agent-4285f4?style=flat&logo=google)](https://aistudio.google.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00ad9f?style=flat&logo=netlify)](https://outpost-arpit.netlify.app)
[![CI](https://github.com/arpittak027/OUTPOST/actions/workflows/ci.yml/badge.svg)](https://github.com/arpittak027/OUTPOST/actions/workflows/ci.yml)

</div>

---

## Overview

**Outpost** is an agentic collaborative workspace that brings AI directly into the creative and technical planning process. Instead of just answering with static text or code snippets, the AI agent actively controls and updates two live surfaces simultaneously:
- **Infinite Canvas (tldraw):** The agent generates flowcharts, architectural diagrams, and entity-relationship tables (ERDs) shape-by-shape in real time.
- **Collaborative Document (BlockNote):** The agent drafts technical specifications, roadmaps, and requirements docs with real-time multiplayer cursors via Yjs and Supabase Realtime.

---

## Core Features

- **Dual-Surface AI Agent:** Ask for "a database schema, documented" and it draws the ERD on the canvas while authoring the spec in the document.
- **Custom Interactive ERD Shapes:** Editable table shapes with primary key (PK) & foreign key (FK) badges, responsive columns, and relationship connectors that automatically snap to table rows.
- **Real-Time Multiplayer Collaboration:** Live cursors, simultaneous edits, and collaborative canvas & doc syncing over Supabase Realtime and tldraw sync.
- **Team Workspaces with Clerk Organizations:** Multi-tenant architecture with personal and organization workspaces, role-based access, and member management.
- **Interactive Kanban Board:** Drag-and-drop workspace organization across Planning, In Progress, In Review, and Done states.
- **Sharing & PDF Export:** One-click public read-only links and high-fidelity PDF export of both documents and canvas diagrams.
- **Usage Quotas & Billing:** Tiered plans (Free, Pro, Team, Enterprise), custom workspace limits, and monthly prompt tracking.

---

## Tech Stack

| Area | Technologies |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org) (App Router, Server Actions, React 19) |
| **Authentication & Orgs** | [Clerk](https://clerk.com) (Organizations & Clerk Billing) |
| **Database & Realtime** | [Supabase](https://supabase.com) (PostgreSQL & Realtime Broadcast Channels) |
| **ORM** | [Prisma](https://www.prisma.io) |
| **AI Engine** | [Vercel AI SDK](https://ai-sdk.dev) with Google Gemini (`gemini-3.5-flash-lite`) |
| **Whiteboard Canvas** | [tldraw](https://tldraw.dev) with tldraw sync |
| **Document Editor** | [BlockNote](https://www.blocknotejs.org) & [Yjs](https://yjs.dev) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) & [shadcn/ui](https://ui.shadcn.com) |

---

## Getting Started

### Prerequisites

- **Node.js:** v22 or later
- Free accounts on:
  - [Clerk](https://clerk.com)
  - [Supabase](https://supabase.com)
  - [Google AI Studio](https://aistudio.google.com)

### 1. Clone & Install

```bash
git clone https://github.com/arpittak027/OUTPOST.git
cd OUTPOST
npm install
```

### 2. Environment Variables

Create your local environment file:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Supabase PostgreSQL (Database > Connect)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Realtime (Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Google Gemini (https://aistudio.google.com/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Canvas Sync (Optional - leave blank for default demo sync)
NEXT_PUBLIC_TLDRAW_SYNC_URL=
NEXT_PUBLIC_TLDRAW_LICENSE_KEY=
```

### 3. Deploy Database Migrations

Apply the database schema to your Supabase PostgreSQL instance:

```bash
npx prisma migrate deploy
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using Outpost!

---

## Project Structure

```
app/
├── (main)/dashboard/         # Prompt box and recent workspaces
├── (main)/workspaces/        # Kanban board of all workspaces
├── (main)/workspace/[id]/    # The workspace: doc, canvas and agent
├── shared/[token]/           # Public read-only shared view
├── api/agent/                # AI Agent: Gemini, tools and streaming
actions/                      # Server Actions (workspaces, docs, canvas, usage)
components/                   # Shared UI components and tldraw ERD shapes
hooks/                        # Agent chat, collaborative doc and state hooks
lib/
├── agent-tools.ts            # Agent tool definitions and schemas
├── agent-canvas.ts           # Canvas tool executors in browser
├── agent-doc.ts              # Doc tool executors in browser
├── billing.ts                # Plan entitlements and prompt tracking
├── supabase-yjs-provider.ts  # Real-time doc sync over Supabase
prisma/                       # Database schema and migration files
tldraw-sync/                  # Dedicated canvas sync Cloudflare Worker
```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the production application |
| `npm run start` | Serves the production build |
| `npm run lint` | Runs ESLint |
| `npm run seed -- you@email.com` | Seeds demo workspaces into your account |

---

## Author

- **Arpit Tak** — [@arpittak027](https://github.com/arpittak027)

## License

This project is licensed under the [GPL-3.0 License](LICENSE).
