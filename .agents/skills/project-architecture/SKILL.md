---
name: project-architecture
description: Understand, explain, design, or change the architecture of the Alcohol Consumption Tracker. Use when working on project architecture, cross-layer features, or architectural decisions.
---

# Project architecture

Start with `.github/copilot-instructions.md`, then inspect the relevant code and existing patterns. Treat the guidelines as intended conventions, not proof of current behavior; flag discrepancies instead of inventing requirements.

## Architecture map

- `frontend/src/pages/` contains React pages, `services/` calls the API, `store/` manages Zustand state, and `i18n/` supplies translated UI text.
- `backend/src/routes/` exposes Express resource routes; use the shared Prisma client in `backend/src/prisma/client.ts`. Authentication, admin authorization, user ownership and input validation belong on the server.
- `backend/prisma/schema.prisma` is the production PostgreSQL schema; `backend/prisma/sqlite/` contains the local SQLite schema and migrations. Consider both when changing data models.
- `backend/src/index.ts`, `api/`, and `vercel.json` connect local development and the Vercel deployment. Preserve both normal and `/api` route behavior when changing routing.

## Working approach

1. Trace the affected flow across UI, state, services, routes and data storage as needed. Identify existing contracts and domain rules, including user ownership and alcohol calculations.
2. Prefer the smallest design consistent with project conventions. Explain tradeoffs and ask before making a consequential architectural or behavioral decision that is not specified.
3. If implementing a change, keep dependent layers, translations, database schemas and migrations consistent where applicable. Do not change unrelated architecture.
4. Validate with relevant existing checks and report important risks or unverified assumptions. When asked only to explain or propose architecture, do not modify files.
