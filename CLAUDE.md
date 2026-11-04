# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 + TypeScript app for managing objects (sites) and their tasks. All data (auth, objects, tasks, task history) comes from Supabase. Test data lives in `supabase/seed.sql`. `@chakra-ui/react` is installed but not wired up (no `ChakraProvider`).

## Routing

`react-router-dom` v7 data router, defined in `src/router.tsx` and mounted via `RouterProvider` in `src/main.tsx`. Every screen lives in `src/pages/`. `/login` is standalone; all other routes are children of `src/App.tsx`, which is the shared layout (nav + `<Outlet />`). Routes: `/objects`, `/objects/:objectId`, `/tasks/:taskId`, `/my-tasks`; `/` and unknown paths redirect.

## Supabase / auth

- Project ref `zmybghjwmghkvjzhbjvl`. Client in `src/lib/supabase.ts`, configured from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; template in `.env.example`). Only the public anon key belongs in the frontend.
- `src/auth/`: `AuthProvider` tracks session + the user's row from `public.profiles`; `useAuth()` reads it; `RequireAuth` guards the layout route and optionally a role (`role="executor"` on `/my-tasks`).
- Roles are `provider` and `executor` (`public.user_role`), stored in `profiles.role` and sourced from the user's `app_metadata.role` via triggers — see `supabase/migrations/`. Set roles only via the Admin API / service role, never `user_metadata`.
- Data access: all queries are in `src/api/index.ts` (typed client; `src/lib/database.types.ts` is generated — regenerate with the command in `src/lib/supabase.ts` after schema changes). Pages load via `useAsync` (`src/hooks/useAsync.ts`).
- Tables `objects`, `tasks`, `task_history` are read-only for clients via RLS. Status changes go only through the RPC `change_task_status`, which checks the transition and role and writes history. The frontend mirror of those rules (`availableActions` in `src/lib/tasks.ts`) only decides which buttons to show — keep both in sync.
- SQL is run with `supabase db query --linked --project-ref zmybghjwmghkvjzhbjvl -f <file>` (goes through the Management API). Commands needing a direct Postgres connection (`migration repair`, likely `db push`) hang in this environment.


## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`).

- `pnpm dev` — Vite dev server with HMR
- `pnpm build` — type-check (`tsc -b`) then production build to `dist/`
- `pnpm lint` — ESLint over the repo (currently broken: `typescript-eslint` 8.x refuses to run with TypeScript 7)
- `pnpm preview` — serve the built `dist/`

No test runner is configured.

## Structure and config notes

- Entry: `index.html` → `src/main.tsx` → `src/router.tsx`. Static files in `public/` are served from `/` (e.g. `/icons.svg#...` sprite references).
- TypeScript uses project references: `tsconfig.app.json` covers `src/`, `tsconfig.node.json` covers tooling config like `vite.config.ts`. `tsc -b` is type-check only (`noEmit`); Vite does the bundling.
- Notable compiler flags: `verbatimModuleSyntax` (type-only imports must use `import type`), `erasableSyntaxOnly` (no `enum`, `namespace`, or constructor parameter properties), `noUnusedLocals`/`noUnusedParameters`.
- ESLint flat config includes `react-hooks` and `react-refresh` rules — modules exporting components should export only components for Fast Refresh to work.
- React Compiler is not enabled.
