# Alcohol Consumption Tracker — Project Guidelines

Personal alcohol consumption tracking app with an Express + Prisma backend and a React + Zustand frontend.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Express 5, TypeScript, Prisma (SQLite), Zod, JWT auth, bcrypt |
| Frontend | React 19, TypeScript, Vite, Zustand (persist), React Hook Form, Tailwind CSS + DaisyUI |

## Build & Run

```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev

# DB migrations
cd backend && npx prisma migrate dev

# Seed translations / create admin
cd backend && npm run seed:translations
cd backend && npm run ensure:admin
```

## Architecture

- **Monorepo**: `backend/` and `frontend/` are independent npm projects at the repo root.
- **Backend routes** live in `backend/src/routes/` — one file per resource (`auth.ts`, `drinks.ts`, `entries.ts`, `stats.ts`, `translations.ts`).
- **Frontend pages** live in `frontend/src/pages/` (PascalCase). Services in `services/`, stores in `store/`, types in `types/index.ts`.
- **Auth flow**: JWT bearer tokens. First registered user is auto-promoted to admin. Middleware: `authenticate()`, `requireAdmin()`.
- **Ownership model**: Drinks and entries are user-scoped. Always verify `userId` matches before update/delete.

## Conventions

### Backend

- Route handlers: `async (req, res) => {}` with try-catch, return `{ error: string }` on failure.
- Validate input with **Zod** `.safeParse()`. Return 400 on validation failure.
- Use Prisma singleton from `src/prisma/client.ts` — never instantiate another `PrismaClient`.
- Log admin actions via `logAdminAction()` from `src/utils/auditLog.ts`.
- Success: `res.json(data)` or `res.status(201).json(data)`. Errors: `res.status(code).json({ error })`.

### Frontend

- **All UI text** must use the `tr` object from `src/i18n/tr.ts` — never hardcode user-facing strings.
- Translation term codes use dot notation scoped by feature: `layout.menu.dashboard`, `drinks.form.name`.
- State management with **Zustand** stores — keep stores thin, call services for API work.
- Forms use **react-hook-form** `useForm<Type>()` + `register()` pattern.
- Style with Tailwind utility classes + DaisyUI component classes (`btn`, `card`, `input`, `table`, etc.).
- Theming: light/dark via `data-theme` attribute, managed in `settingsStore`.

### Naming

| Item | Convention | Example |
|------|-----------|---------|
| Components/Pages | PascalCase `.tsx` | `Dashboard.tsx`, `Button.tsx` |
| Services | camelCase `.ts` | `drinksService.ts` |
| Stores | camelCase + `Store` suffix | `authStore.ts` |
| Backend routes | camelCase `.ts` | `drinks.ts` |
| API paths | kebab-case, resource-based | `/drinks`, `/auth/admin/users` |
| Types | PascalCase | `User`, `Drink`, `AuthResponse` |
| i18n codes | dot-notation | `settings.defaultDrink.label` |

## Domain Logic

- **Pure alcohol formula**: `volumeMl × (alcoholPct / 100) × 0.789` — this constant (ethanol density) is used in stats and display.
- **Supported languages**: `en`, `cs`. Fallback chain: remote dictionary → built-in dictionary → EN dictionary → fallback text.
- **Roles**: `user` (default), `admin`. Admin-only pages: Translations, Users, Audit Logs.
