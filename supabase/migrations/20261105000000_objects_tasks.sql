-- Объекты, задачи и история задач

create type public.task_status as enum ('new', 'in_progress', 'review', 'done');

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'new',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  due_date date,
  created_at timestamptz not null default now()
);

create index tasks_object_id_idx on public.tasks (object_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

create table public.task_history (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  text text not null,
  created_at timestamptz not null default now()
);

create index task_history_task_id_idx on public.task_history (task_id);

-- Чтение: всем вошедшим пользователям.
-- Изменение задач — только через функцию change_task_status ниже, прямых update/insert политик нет.
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

create policy "objects readable by authenticated" on public.objects
  for select to authenticated using (true);
create policy "tasks readable by authenticated" on public.tasks
  for select to authenticated using (true);
create policy "task history readable by authenticated" on public.task_history
  for select to authenticated using (true);

-- Смена статуса задачи с проверкой прав и записью в историю.
-- Исполнитель (назначенный на задачу): new → in_progress, in_progress → review.
-- Постановщик: review → done, review → in_progress.
create function public.change_task_status(p_task_id uuid, p_status public.task_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_role public.user_role;
  v_allowed boolean;
  v_label text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is null then
    raise exception 'Нет профиля пользователя' using errcode = '42501';
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Задача не найдена' using errcode = 'P0002';
  end if;

  v_allowed := case
    when v_role = 'executor' and v_task.assignee_id = auth.uid() then
      (v_task.status, p_status) in (('new', 'in_progress'), ('in_progress', 'review'))
    when v_role = 'provider' then
      (v_task.status, p_status) in (('review', 'done'), ('review', 'in_progress'))
    else false
  end;

  if not v_allowed then
    raise exception 'Недоступное действие' using errcode = '42501';
  end if;

  update public.tasks set status = p_status where id = p_task_id;

  v_label := case p_status
    when 'new' then 'Новая'
    when 'in_progress' then 'В работе'
    when 'review' then 'На проверке'
    when 'done' then 'Выполнена'
  end;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: ' || v_label);
end;
$$;

revoke execute on function public.change_task_status(uuid, public.task_status) from public, anon;
grant execute on function public.change_task_status(uuid, public.task_status) to authenticated;
