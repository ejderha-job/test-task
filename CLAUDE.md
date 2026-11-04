# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 + TypeScript app for managing objects (sites) and their tasks. All data (auth, objects, tasks, task history) comes from Supabase. Test data lives in `supabase/seed.sql`.

## UI

Chakra UI v3 (`ChakraProvider value={defaultSystem}` in `src/main.tsx`; requires `@emotion/react`). No custom CSS files — style with Chakra props and semantic tokens (`fg.muted`, `bg.subtle`, …) so dark mode works. Dark mode follows the OS via `src/theme/colorMode.ts`, which toggles the `dark` class on `<html>` (no `next-themes`). Shared bits: `FormFields` (renders a form from a field-config array — use it for every form), `ListItemCard` (clickable list card), `TaskStatusBadge`, `BackLink`, `Loading`/`LoadError` in `src/components/`. Router links are rendered through Chakra with `asChild`.

## Code style (JSX)

**Conditional rendering.** Inline conditions in JSX are allowed only when they fit on one line, e.g. `{error && <ErrorAlert message={error} />}` or a single `a ? <A /> : <B />`. Anything more (nested ternaries, multi-line branches, a chain of loading / error / empty / data states) goes into a separate component that picks the branch with plain `if` / `else` and early `return`s:

```tsx
// ✗ not like this
{loading ? <Loading /> : error ? <LoadError … /> : items.length === 0 ? <Empty /> : <List … />}

// ✓ like this
function ItemsContent({ loading, error, items }: Props) {
  if (loading) return <Loading />
  if (error) return <LoadError … />
  if (items.length === 0) return <Empty />
  return <List items={items} />
}
```

**Repeated blocks → config array + `.map`.** If several JSX blocks share the same structure and differ only in data (form fields, `DataList` rows, nav links, buttons), describe them as an array of config objects and render it with `.map`, instead of copy-pasting the markup:

```tsx
const fields = [
  { label: 'Исполнитель', value: personName(task.assignee) },
  { label: 'Срок', value: formatDate(task.due_date) },
]
// …
{fields.map((f) => (
  <DataList.Item key={f.label}>
    <DataList.ItemLabel>{f.label}</DataList.ItemLabel>
    <DataList.ItemValue>{f.value}</DataList.ItemValue>
  </DataList.Item>
))}
```

Static config that doesn't depend on props/state lives at module level, outside the component.

## Routing

`react-router-dom` v7 data router, defined in `src/router.tsx` and mounted via `RouterProvider` in `src/main.tsx`. Every screen lives in `src/pages/`. `/login` is standalone; all other routes are children of `src/App.tsx`, which is the shared layout (nav + `<Outlet />`). Routes: `/objects`, `/objects/new` (provider only), `/objects/:objectId`, `/objects/:objectId/tasks/new` (provider only), `/tasks/:taskId`, `/my-tasks` (executor only); `/` and unknown paths redirect.

## Supabase / auth

- Project ref `zmybghjwmghkvjzhbjvl`. Client in `src/lib/supabase.ts`, configured from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; template in `.env.example`). Only the public anon key belongs in the frontend.
- `src/auth/`: `AuthProvider` tracks session + the user's row from `public.profiles`; `useAuth()` reads it; `RequireAuth` guards the layout route and optionally a role (`role="executor"` on `/my-tasks`).
- Roles are `provider` and `executor` (`public.user_role`), stored in `profiles.role` and sourced from the user's `app_metadata.role` via triggers — see `supabase/migrations/`. Set roles only via the Admin API / service role, never `user_metadata`.
- Data access: all queries are in `src/api/index.ts` (typed client; `src/lib/database.types.ts` is generated — regenerate with the command in `src/lib/supabase.ts` after schema changes). Pages load via `useAsync` (`src/hooks/useAsync.ts`).
- Tables `objects`, `tasks`, `task_history` are read-only for clients via RLS. All writes go through RPCs that check the role (helper `assert_provider()`): `create_object` (provider only), `change_task_status` (status transitions, writes history), `create_task` (provider only; the assignee is required, must have role `executor`, and can never be changed afterwards — `tasks.assignee_id` is `not null` and there is no reassignment RPC). The frontend mirror of those rules (`availableActions` in `src/lib/tasks.ts`) only decides which buttons to show — keep both in sync.
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
