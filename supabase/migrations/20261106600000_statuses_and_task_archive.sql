-- Новый набор статусов задачи и архив как отдельный признак (не статус).
--
-- Статусы: new «Новая», in_progress «В работе», review «На проверке», accepted «Принята»,
-- rework «На доработке». Статуса archived больше нет — у задачи есть tasks.archived_at,
-- а в истории архивация — отдельная запись «Задача перенесена в архив» (не «Статус: …»).
--
-- Переходы:
--   исполнитель: new → in_progress, in_progress → review, rework → in_progress
--   постановщик: review → accepted (change_task_status), review → rework (return_task_for_rework, с комментарием)
--   постановщик: unassign_task — любая незавершённая задача → new без исполнителя
-- Архивная задача заморожена целиком: ни переходов, ни правок, ни назначения.

-- 1. Архивный признак у задачи
alter table public.tasks add column archived_at timestamptz;

-- 2. История: старые тексты под новые названия; архивация — не статус
update public.task_history set text = 'Статус: Новая' where text = 'Статус: Открыта';
update public.task_history set text = 'Статус: Принята' where text = 'Статус: Выполнена';
update public.task_history set text = 'Статус: На доработке'
  where text = 'Статус: В работе (возвращена на доработку)';
update public.task_history set text = 'Задача перенесена в архив' where text = 'Статус: В архиве';
update public.task_history set text = 'Задача перенесена в архив (объект перенесён в архив)'
  where text = 'Статус: В архиве (объект перенесён в архив)';

-- 3. Архивные задачи: время архивации — из записи истории (или из архивации объекта)
update public.tasks t
set archived_at = coalesce(
  (select max(h.created_at) from public.task_history h
    where h.task_id = t.id and h.text like 'Задача перенесена в архив%'),
  (select o.archived_at from public.objects o where o.id = t.object_id),
  now()
)
where t.status = 'archived';

-- 4. Пересоздаём enum: значение из enum удалить нельзя, только через новый тип
alter function public.change_task_status(uuid, public.task_status) rename to change_task_status_old;
alter type public.task_status rename to task_status_old;
create type public.task_status as enum ('new', 'in_progress', 'review', 'accepted', 'rework');

-- Новый статус считаем заранее (в USING подзапросы нельзя).
-- Бывшие архивные: статус до архивации — последняя запись «Статус: …» в истории.
alter table public.tasks add column new_status text;
update public.tasks t set new_status = case t.status::text
  when 'done' then 'accepted'
  when 'archived' then coalesce(
    (select case h.text
              when 'Статус: В работе' then 'in_progress'
              when 'Статус: На проверке' then 'review'
              when 'Статус: На доработке' then 'rework'
              else 'new'
            end
       from public.task_history h
      where h.task_id = t.id and h.text like 'Статус: %'
      order by h.created_at desc, h.id desc
      limit 1),
    'new')
  else t.status::text
end;

alter table public.tasks alter column status drop default;
alter table public.tasks alter column status type public.task_status using new_status::public.task_status;
alter table public.tasks drop column new_status;
alter table public.tasks alter column status set default 'new';

drop function public.change_task_status_old(uuid, public.task_status_old);
drop type public.task_status_old;

-- 5. Общая проверка: архивную задачу менять нельзя
create function public.assert_task_not_archived(p_task public.tasks)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_task.archived_at is not null then
    raise exception 'Задача в архиве' using errcode = '42501';
  end if;
end;
$$;

-- 6. Смена статуса
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
  perform public.assert_task_not_archived(v_task);

  v_allowed := case
    when v_role = 'executor' and v_task.assignee_id = auth.uid() then
      (v_task.status, p_status) in (
        ('new', 'in_progress'),
        ('in_progress', 'review'),
        ('rework', 'in_progress')
      )
    when v_role = 'provider' then
      (v_task.status, p_status) in (('review', 'accepted'))
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
    when 'accepted' then 'Принята'
    when 'rework' then 'На доработке'
  end;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: ' || v_label);
end;
$$;

revoke execute on function public.change_task_status(uuid, public.task_status) from public, anon;
grant execute on function public.change_task_status(uuid, public.task_status) to authenticated;

-- 7. Вернуть на доработку: review → rework, комментарий в записи истории
create or replace function public.return_task_for_rework(p_task_id uuid, p_comment text)
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
  perform public.assert_task_not_archived(v_task);
  if v_task.status <> 'review' then
    raise exception 'Вернуть на доработку можно только задачу на проверке' using errcode = '42501';
  end if;
  if v_comment = '' then
    raise exception 'Напишите комментарий: что нужно доработать' using errcode = '22023';
  end if;

  update public.tasks set status = 'rework' where id = p_task_id;

  insert into public.task_history (task_id, author_id, text, comment)
  values (p_task_id, auth.uid(), 'Статус: На доработке', v_comment);
end;
$$;

-- 8. Архивация задачи — отдельная функция, статус не меняется
create function public.archive_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  perform public.assert_provider();

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Задача не найдена' using errcode = 'P0002';
  end if;
  if v_task.archived_at is not null then
    raise exception 'Задача уже в архиве' using errcode = '42501';
  end if;

  update public.tasks set archived_at = now() where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Задача перенесена в архив');
end;
$$;

revoke execute on function public.archive_task(uuid) from public, anon;
grant execute on function public.archive_task(uuid) to authenticated;

-- 9. Архивация объекта: в архив уходят все его задачи (статусы сохраняются)
create or replace function public.archive_object(p_object_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archived_at timestamptz;
begin
  perform public.assert_provider();

  select archived_at into v_archived_at from public.objects where id = p_object_id for update;
  if not found then
    raise exception 'Объект не найден' using errcode = 'P0002';
  end if;
  if v_archived_at is not null then
    raise exception 'Объект уже в архиве' using errcode = '42501';
  end if;

  update public.objects set archived_at = now() where id = p_object_id;

  with archived as (
    update public.tasks
      set archived_at = now()
      where object_id = p_object_id and archived_at is null
      returning id
  )
  insert into public.task_history (task_id, author_id, text)
  select id, auth.uid(), 'Задача перенесена в архив (объект перенесён в архив)' from archived;
end;
$$;

-- 10. Назначение / снятие исполнителя и правка — с проверкой архива и новых статусов
create or replace function public.assign_task(p_task_id uuid, p_assignee_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_name text;
begin
  perform public.assert_provider();

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Задача не найдена' using errcode = 'P0002';
  end if;
  perform public.assert_task_not_archived(v_task);
  if v_task.assignee_id is not null then
    raise exception 'Исполнитель уже назначен' using errcode = '42501';
  end if;

  -- Заодно проверяет, что это пользователь с ролью executor
  v_name := public.executor_name(p_assignee_id);

  update public.tasks set assignee_id = p_assignee_id where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Назначен исполнитель: ' || v_name);
end;
$$;

create or replace function public.unassign_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  perform public.assert_provider();

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Задача не найдена' using errcode = 'P0002';
  end if;
  perform public.assert_task_not_archived(v_task);
  if v_task.status = 'accepted' then
    raise exception 'Принятую задачу изменить нельзя' using errcode = '42501';
  end if;
  if v_task.assignee_id is null then
    raise exception 'Исполнитель не назначен' using errcode = '42501';
  end if;

  update public.tasks set assignee_id = null, status = 'new' where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: Новая');
end;
$$;

create or replace function public.update_task(
  p_task_id uuid,
  p_title text,
  p_description text default '',
  p_due_date date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_title text := trim(coalesce(p_title, ''));
  v_description text := coalesce(p_description, '');
  v_changes text[] := '{}';
begin
  perform public.assert_provider();

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Задача не найдена' using errcode = 'P0002';
  end if;
  perform public.assert_task_not_archived(v_task);
  if v_task.status = 'accepted' then
    raise exception 'Принятую задачу изменить нельзя' using errcode = '42501';
  end if;
  if v_title = '' then
    raise exception 'Укажите название задачи' using errcode = '22023';
  end if;

  if v_title <> v_task.title then v_changes := array_append(v_changes, 'название'); end if;
  if v_description <> v_task.description then v_changes := array_append(v_changes, 'описание'); end if;
  if p_due_date is distinct from v_task.due_date then v_changes := array_append(v_changes, 'срок'); end if;

  -- Ничего не поменялось — не трогаем задачу и не пишем историю
  if cardinality(v_changes) = 0 then
    return;
  end if;

  update public.tasks
    set title = v_title, description = v_description, due_date = p_due_date
    where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Изменено: ' || array_to_string(v_changes, ', '));
end;
$$;
