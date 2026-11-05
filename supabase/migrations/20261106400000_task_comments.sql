-- Комментарии к задачам. Первый сценарий: постановщик возвращает задачу на доработку
-- (review → in_progress) только с комментарием.

create table public.task_comments (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  text text not null check (trim(text) <> ''),
  created_at timestamptz not null default now()
);

create index task_comments_task_id_idx on public.task_comments (task_id);

alter table public.task_comments enable row level security;

-- Видимость как у истории: постановщик — все, исполнитель — по своим задачам.
-- Политик на запись нет: комментарии добавляются только через функции.
create policy "task comments: provider sees all, executor sees own tasks"
  on public.task_comments for select to authenticated
  using (
    (select public.current_user_role()) = 'provider'
    or exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and t.assignee_id = (select auth.uid())
    )
  );

-- Вернуть задачу на доработку: только постановщик, только из review, комментарий обязателен
create function public.return_task_for_rework(p_task_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_comment text := trim(coalesce(p_comment, ''));
begin
  perform public.assert_provider();

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Задача не найдена' using errcode = 'P0002';
  end if;
  if v_task.status <> 'review' then
    raise exception 'Вернуть на доработку можно только задачу на проверке' using errcode = '42501';
  end if;
  if v_comment = '' then
    raise exception 'Напишите комментарий: что нужно доработать' using errcode = '22023';
  end if;

  update public.tasks set status = 'in_progress' where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: В работе (возвращена на доработку)');

  insert into public.task_comments (task_id, author_id, text)
  values (p_task_id, auth.uid(), v_comment);
end;
$$;

revoke execute on function public.return_task_for_rework(uuid, text) from public, anon;
grant execute on function public.return_task_for_rework(uuid, text) to authenticated;

-- Переход review → in_progress без комментария убран: теперь только через return_task_for_rework
create or replace function public.change_task_status(p_task_id uuid, p_status public.task_status)
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
      (v_task.status, p_status) in (
        ('review', 'done'),
        ('new', 'archived'),
        ('in_progress', 'archived'),
        ('review', 'archived')
      )
    else false
  end;

  if not v_allowed then
    raise exception 'Недоступное действие' using errcode = '42501';
  end if;

  update public.tasks set status = p_status where id = p_task_id;

  v_label := case p_status
    when 'new' then 'Открыта'
    when 'in_progress' then 'В работе'
    when 'review' then 'На проверке'
    when 'done' then 'Выполнена'
    when 'archived' then 'В архиве'
  end;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: ' || v_label);
end;
$$;
