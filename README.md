# Объекты и задачи

Веб-приложение для постановщиков (`provider`) и исполнителей (`executor`): объекты, задачи, статусы, история. Фронтенд — Vite + React + Chakra UI, бэкенд — Supabase (Auth, Postgres, RLS, RPC). Подробности архитектуры и правил доступа — в `CLAUDE.md`.

## Локальный запуск

```sh
cp .env.example .env.local   # вписать URL проекта и anon key
pnpm install
pnpm dev
```

## Тестовые пользователи

| Пользователь | Роль | Email | Пароль |
|---|---|---|---|
| Анна Смирнова | Постановщик (`provider`) | anna@example.com | `9RF0_OB2dGYdccxr` |
| Ольга Кузнецова | Постановщик (`provider`) | olga@example.com | `FNSaz_XD63IzuGeO` |
| Иван Петров | Исполнитель (`executor`) | ivan@example.com | `eavvOBjw_ybd1buD` |
| Пётр Сидоров | Исполнитель (`executor`) | petr@example.com | `p-RA-YOaeiKRBmjK` |

## Деплой на Vercel

1. Импортировать репозиторий в Vercel (или `vercel` из CLI). Настройки сборки берутся из `vercel.json`: `pnpm install --frozen-lockfile`, `pnpm build`, папка `dist`, Node 22.
2. В **Project → Settings → Environment Variables** добавить (для Production и Preview):
   - `VITE_SUPABASE_URL` — `https://zmybghjwmghkvjzhbjvl.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` — публичный anon key (Supabase → Project Settings → API).

   Переменные `VITE_*` встраиваются в сборку, поэтому после их изменения нужен redeploy. Ключ `service_role` во фронтенд и в Vercel **не добавлять**.
3. В Supabase → **Authentication → URL Configuration** указать адрес сайта на Vercel в *Site URL* (и в *Redirect URLs*) — нужно для ссылок из писем (сброс пароля и т. п.).
4. В Supabase → **Authentication → Sign In / Providers** выключить «Allow new users to sign up»: пользователи создаются вручную, с ролью в `app_metadata.role`.

`vercel.json` перенаправляет все пути на `index.html`, поэтому прямые ссылки вида `/tasks/<id>` открываются и после перезагрузки страницы.

## База данных

Схема и функции — в `supabase/migrations/`, тестовые данные — `supabase/seed.sql`. Миграции уже применены к проекту `zmybghjwmghkvjzhbjvl`; при деплое фронтенда база не меняется.
