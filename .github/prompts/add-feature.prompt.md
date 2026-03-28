---
description: "Scaffold an end-to-end CRUD feature: Prisma model, Express route, frontend service/store/page, types, translations, and route registration."
agent: "agent"
argument-hint: "Resource name and fields, e.g. 'Goal: name (string), targetMl (number), startDate (DateTime)'"
---

# Add Feature: end-to-end CRUD resource

Scaffold a complete CRUD feature for the resource described below. Follow every convention in [copilot-instructions.md](../.github/copilot-instructions.md).

## Input

{{input}}

Parse the resource **name** (singular PascalCase) and its **fields** (name + type pairs) from the input above.

## Steps — execute all of them in order

### 1. Prisma schema (`backend/prisma/schema.prisma`)

- Add a new model with the parsed fields plus the standard columns: `id Int @id @default(autoincrement())`, `userId Int`, `createdAt DateTime @default(now())`.
- Add a relation to `User` (`user User @relation(fields: [userId], references: [id])`) and add the back-relation `resourceName[]` to the `User` model.
- Run `npx prisma migrate dev --name add-<resource>` in `backend/` to generate the migration.

### 2. Backend route (`backend/src/routes/<resource>.ts`)

Create a new Express router file following the pattern in [drinks.ts](../backend/src/routes/drinks.ts):

- `router.use(authenticate)` at the top.
- **GET /**  — `findMany` filtered by `req.userId`, ordered by `createdAt desc`.
- **POST /** — validate required fields (Zod `.safeParse()` preferred), `create` with `userId: req.userId!`.
- **PUT /:id** — ownership check via `findFirst({ where: { id, userId } })`, then `update`.
- **DELETE /:id** — ownership check, then `delete`.
- Error pattern: try-catch, `res.status(code).json({ error })`.

Register the router in [backend/src/index.ts](../backend/src/index.ts):
```ts
import resourceRouter from './routes/<resource>';
app.use('/<resource>', resourceRouter);
```

### 3. Frontend types (`frontend/src/types/index.ts`)

Add a TypeScript interface matching the Prisma model fields (camelCase, `id`, `userId`, `createdAt` as string).

### 4. Frontend service (`frontend/src/services/<resource>Service.ts`)

Create a service object following the pattern in [drinksService.ts](../frontend/src/services/drinksService.ts):
- `getAll()`, `create()`, `update()`, `delete()` — all using the `api` axios instance.

### 5. Frontend store (`frontend/src/store/<resource>Store.ts`)

Create a Zustand store following the pattern in [drinksStore.ts](../frontend/src/store/drinksStore.ts):
- State: `items: Resource[]`, `isLoading`, `error`.
- Actions: `fetch`, `add`, `update`, `delete` — delegate to the service.

### 6. Frontend page (`frontend/src/pages/<Resource>.tsx`)

Create a page component following the pattern in [Drinks.tsx](../frontend/src/pages/Drinks.tsx):
- Use `react-hook-form` for the create/edit form.
- Display items in a DaisyUI `table`.
- Include edit and delete buttons per row.
- All user-facing strings via `tr.<resource>.*` calls — **never hardcode text**.

### 7. Translations

#### a. Dictionary (`frontend/src/i18n/dictionary.ts`)
Add EN entries under the new resource scope using dot notation, e.g.:
```
'<resource>.title': '<Resource>s',
'<resource>.form.name': 'Name',
'<resource>.noItems': 'No <resource>s yet.',
```

#### b. `tr` object (`frontend/src/i18n/tr.ts`)
Add corresponding getter methods under a new `<resource>` key, following the existing pattern.

### 8. Route registration (`frontend/src/App.tsx`)

Add a `<Route path="/<resource>" element={<ResourcePage />} />` inside the protected `<Layout>` routes.

### 9. Navigation (`frontend/src/components/Layout.tsx`)

Add a sidebar link for the new page, using a `tr` call for the label.

## Output

After finishing, list every file created or modified with a one-line summary of the change.
