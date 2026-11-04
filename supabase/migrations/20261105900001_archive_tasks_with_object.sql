-- При архивации объекта его незавершённые задачи переходят в статус «В архиве».
-- Из этого статуса переходов нет (change_task_status его не разрешает), назначить исполнителя тоже нельзя.

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
      set status = 'archived'
      where object_id = p_object_id and status <> 'done'
      returning id
  )
  insert into public.task_history (task_id, author_id, text)
  select id, auth.uid(), 'Статус: В архиве (объект перенесён в архив)' from archived;
end;
$$;

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
  if v_task.status = 'archived' then
    raise exception 'Задача в архиве' using errcode = '42501';
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

-- Задачи уже архивных объектов (если такие есть)
update public.tasks t
  set status = 'archived'
  from public.objects o
  where o.id = t.object_id and o.archived_at is not null and t.status <> 'done';
