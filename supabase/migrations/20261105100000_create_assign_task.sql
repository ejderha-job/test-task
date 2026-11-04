-- Постановщик создаёт задачи и назначает исполнителя (сразу или позже).
-- Как и смена статуса, всё идёт через функции: прямых insert/update политик на tasks нет.

-- Проверка, что текущий пользователь — постановщик
create function public.assert_provider()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'provider') then
    raise exception 'Действие доступно только постановщику' using errcode = '42501';
  end if;
end;
$$;

-- Имя исполнителя для истории; заодно проверяет, что это действительно исполнитель
create function public.executor_name(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  select coalesce(full_name, email) into v_name
    from public.profiles
    where id = p_user_id and role = 'executor';
  if v_name is null then
    raise exception 'Исполнитель не найден' using errcode = 'P0002';
  end if;
  return v_name;
end;
$$;

create function public.create_task(
  p_object_id uuid,
  p_title text,
  p_description text default '',
  p_due_date date default null,
  p_assignee_id uuid default null
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

  if p_assignee_id is not null then
    perform public.assign_task(v_task_id, p_assignee_id);
  end if;

  return v_task_id;
end;
$$;

-- Назначить или сменить исполнителя. Выполненную задачу переназначить нельзя.
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
  if v_task.status = 'done' then
    raise exception 'Задача уже выполнена' using errcode = '42501';
  end if;

  v_name := public.executor_name(p_assignee_id);

  if v_task.assignee_id is not distinct from p_assignee_id then
    return;
  end if;

  update public.tasks set assignee_id = p_assignee_id where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Назначен исполнитель: ' || v_name);
end;
$$;

revoke execute on function public.assert_provider() from public, anon, authenticated;
revoke execute on function public.executor_name(uuid) from public, anon, authenticated;
revoke execute on function public.create_task(uuid, text, text, date, uuid) from public, anon;
revoke execute on function public.assign_task(uuid, uuid) from public, anon;
grant execute on function public.create_task(uuid, text, text, date, uuid) to authenticated;
grant execute on function public.assign_task(uuid, uuid) to authenticated;
