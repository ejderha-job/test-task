-- Роли пользователей и профили

create type public.user_role as enum ('provider', 'executor');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Профили видны всем вошедшим пользователям (нужно, чтобы показывать исполнителей задач).
-- Политик на insert/update/delete нет: роли меняются только сервером (service_role).
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Профиль создаётся автоматически при регистрации пользователя.
-- Роль берётся из app_metadata: его может задать только сервер, не сам пользователь.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'executor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Supabase Admin API записывает app_metadata отдельным UPDATE после INSERT,
-- поэтому роль синхронизируется и при изменении app_metadata.
create function public.handle_user_role_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'role' is not null then
    update public.profiles
      set role = (new.raw_app_meta_data ->> 'role')::public.user_role
      where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_role_updated
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.handle_user_role_update();
