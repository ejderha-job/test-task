# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 + TypeScript app for managing objects (sites) and their tasks. All data (auth, objects, tasks, task history) comes from Supabase. Test data lives in `supabase/seed.sql`.

## UI

Chakra UI v3 (`ChakraProvider value={defaultSystem}` in `src/main.tsx`; requires `@emotion/react`). No custom CSS files — style with Chakra props and semantic tokens (`fg.muted`, `bg.subtle`, …) so dark mode works. Dark mode follows the OS via `src/theme/colorMode.ts`, which toggles the `dark` class on `<html>` (no `next-themes`). Creating objects and tasks happens in dialogs (`NewObjectDialog` on `/objects`, `NewTaskDialog` on the object page, `AssignExecutorDialog` on the task page, `EditObjectDialog` on the object page). Field configs shared between create and edit forms live in `src/forms/`, not on separate pages — new create/edit forms should use `FormDialog` (trigger button + dialog + `FormFields` + submit/error handling). Shared bits: `FormFields` (renders a form from a field-config array — use it for every form), `ListItemCard` (clickable list card), `TaskStatusBadge`, `BackLink`, `Loading`/`LoadError` in `src/components/`. Router links are rendered through Chakra with `asChild`.

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

`react-router-dom` v7 data router, defined in `src/router.tsx` and mounted via `RouterProvider` in `src/main.tsx`. Every screen lives in `src/pages/`. `/login` is standalone; all other routes are children of `src/App.tsx`, which is the shared layout (nav + `<Outlet />`). Routes: `/objects`, `/objects/:objectId`, `/tasks/:taskId`, `/my-tasks` (executor only); `/` and unknown paths redirect.

## Supabase / auth

- Project ref `zmybghjwmghkvjzhbjvl`. Client in `src/lib/supabase.ts`, configured from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; template in `.env.example`). Only the public anon key belongs in the frontend.
- `src/auth/`: `AuthProvider` tracks session + the user's row from `public.profiles`; `useAuth()` reads it; `RequireAuth` guards the layout route and optionally a role (`role="executor"` on `/my-tasks`).
- Roles are `provider` and `executor` (`public.user_role`), stored in `profiles.role` and sourced from the user's `app_metadata.role` via triggers — see `supabase/migrations/`. Set roles only via the Admin API / service role, never `user_metadata`.
- Data access: all queries are in `src/api/index.ts` (typed client; `src/lib/database.types.ts` is generated — regenerate with the command in `src/lib/supabase.ts` after schema changes). Pages load via `useAsync` (`src/hooks/useAsync.ts`).
- Visibility (RLS): providers see all objects; executors see only objects that have at least one task assigned to them (policy uses `current_user_role()`). Executors likewise see only tasks assigned to them and those tasks' history (so task counts / object task lists are per-executor). Providers see everything.
- Tables `objects`, `tasks`, `task_history` are read-only for clients via RLS. All writes go through RPCs that check the role (helper `assert_provider()`): `create_object` / `update_object` / `archive_object` (provider only). Objects are soft-deleted via `objects.archived_at`: archiving also moves the object's non-`done` tasks to task status `archived` (terminal: no transitions, no assignment; executors still see them in «Мои задачи»). A provider can also archive a single task (`new`/`in_progress`/`review` → `archived` via `change_task_status`; UI: `ArchiveTaskDialog`, rule mirrored in `canArchiveTask`). Executors don't see `archived` tasks unless they tick «Показать архивированные» (`ShowArchivedCheckbox`, state in the URL as `?archived=1` via `useShowArchived`) on «Мои задачи» (server-side filter) and on the object page (client-side filter); providers always see everything. This is a UI filter, not RLS. Archived objects are filtered out in `fetchObjects` (not by RLS), still open read-only by direct link, and `update_object` / `create_task` reject them (`assert_object_active()`). Destructive actions use `ConfirmDialog`. `change_task_status` (status transitions, writes history), `create_task` (provider only; creates the task without an assignee), `assign_task` (provider only; sets the assignee exactly once — fails if one is already set; assignee must have role `executor`). There is no way to change or remove an assignee. Until assigned, nobody can move the task out of `new`. The frontend mirror of those rules (`availableActions` in `src/lib/tasks.ts`) only decides which buttons to show — keep both in sync.
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
