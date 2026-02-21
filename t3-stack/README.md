# T3 Press

A full-stack publishing platform built with the [T3 Stack](https://create.t3.gg/).

## Features

- **Two roles** — Publishers create & manage posts; Readers browse, like, and bookmark
- **Authentication** — Email/password + Google OAuth (NextAuth.js v5)
- **Posts** — Create, edit, delete, publish/draft, cover photo (URL or file upload)
- **Feed** — Infinite scroll, full-text search, like & bookmark any post
- **Bookmarks** — Personal saved posts list with infinite scroll
- **Profile** — Upload profile photo, edit display name, change password
- **Analytics** — Daily likes & publishing frequency charts (Recharts), per-post performance
- **Notifications** — Real-time bell badge for publishers when someone likes a post
- **Dark mode** — System-preference aware, persisted to localStorage, no FOUC
- **Fully responsive** — Mobile-first with hamburger drawer navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | NextAuth.js v5 beta |
| API | tRPC v11 + React Query v5 |
| ORM | Prisma 6 |
| Database | Neon PostgreSQL (serverless) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd t3-stack
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# Generate with: npx auth secret
AUTH_SECRET=""

# From Google Cloud Console → OAuth 2.0 credentials
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# From Neon dashboard
DATABASE_URL=""   # Pooled connection (pgbouncer)
DIRECT_URL=""     # Direct connection (for migrations)
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── auth/             # signin, signup, choose-role
│   ├── feed/             # Reader feed with search
│   ├── bookmarks/        # Saved posts
│   ├── profile/          # Profile settings
│   └── publisher/
│       ├── dashboard/    # Post management + post-form-modal
│       └── analytics/    # Charts & stats
├── components/
│   ├── navbar.tsx        # Responsive navbar with notification bell
│   ├── theme-provider.tsx
│   └── ui/               # shadcn/ui components
└── server/
    ├── auth/             # NextAuth config
    ├── db.ts             # Prisma client
    └── api/
        └── routers/      # post, like, bookmark, auth, analytics, notification
```

## Deployment

Deploy to [Vercel](https://vercel.com) in one click — set the environment variables in the Vercel dashboard and it will pick up Prisma automatically.

For the database, a [Neon](https://neon.tech) free tier is sufficient for development and small production workloads.
