-- Новый порядок: задача создаётся без исполнителя, затем постановщик назначает его один раз.
-- Сменить или снять назначенного исполнителя нельзя.

alter table public.tasks alter column assignee_id drop not null;

drop function public.create_task(uuid, text, uuid, text, date);

create function public.create_task(
  p_object_id uuid,
  p_title text,
  p_description text default '',
  p_due_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task_id uuid;
begin
  perform public.assert_provider();

  if coalesce(trim(p_title), '') = '' then
    raise exception 'Укажите название задачи' using errcode = '22023';
  end if;
  if not exists (select 1 from public.objects where id = p_object_id) then
    raise exception 'Объект не найден' using errcode = 'P0002';
  end if;

  insert into public.tasks (object_id, title, description, due_date, created_by)
  values (p_object_id, trim(p_title), coalesce(p_description, ''), p_due_date, auth.uid())
  returning id into v_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (v_task_id, auth.uid(), 'Задача создана');

  return v_task_id;
end;
$$;

-- Назначить исполнителя — только если он ещё не назначен
create function public.assign_task(p_task_id uuid, p_assignee_id uuid)
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

revoke execute on function public.create_task(uuid, text, text, date) from public, anon;
revoke execute on function public.assign_task(uuid, uuid) from public, anon;
grant execute on function public.create_task(uuid, text, text, date) to authenticated;
grant execute on function public.assign_task(uuid, uuid) to authenticated;
