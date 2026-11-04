# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 + TypeScript app for managing objects (sites) and their tasks. All data currently comes from `src/data/mock.ts` — there is no API or real auth yet (marked with `TODO` where requests should go). `@chakra-ui/react` is installed but not wired up (no `ChakraProvider`).

## Routing

`react-router-dom` v7 data router, defined in `src/router.tsx` and mounted via `RouterProvider` in `src/main.tsx`. Every screen lives in `src/pages/`. `/login` is standalone; all other routes are children of `src/App.tsx`, which is the shared layout (nav + `<Outlet />`). Routes: `/objects`, `/objects/:objectId`, `/tasks/:taskId`, `/my-tasks`; `/` and unknown paths redirect.

Task status transitions available on the task page are driven by `statusActions` in `mock.ts`.

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
