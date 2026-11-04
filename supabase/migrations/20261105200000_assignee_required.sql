-- Исполнитель выбирается при создании задачи и больше не меняется.

-- Назначение/смена исполнителя после создания больше не поддерживается
drop function public.assign_task(uuid, uuid);

-- У каждой задачи должен быть исполнитель; удалить исполнителя с задачами нельзя
alter table public.tasks
  drop constraint tasks_assignee_id_fkey,
  add constraint tasks_assignee_id_fkey
    foreign key (assignee_id) references public.profiles (id) on delete restrict,
  alter column assignee_id set not null;

-- Исполнитель теперь обязательный параметр
drop function public.create_task(uuid, text, text, date, uuid);

create function public.create_task(
  p_object_id uuid,
  p_title text,
  p_assignee_id uuid,
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
  v_assignee_name text;
begin
  perform public.assert_provider();

  if coalesce(trim(p_title), '') = '' then
    raise exception 'Укажите название задачи' using errcode = '22023';
  end if;
  if p_assignee_id is null then
    raise exception 'Выберите исполнителя' using errcode = '22023';
  end if;
  if not exists (select 1 from public.objects where id = p_object_id) then
    raise exception 'Объект не найден' using errcode = 'P0002';
  end if;

  -- Заодно проверяет, что это пользователь с ролью executor
  v_assignee_name := public.executor_name(p_assignee_id);

  insert into public.tasks (object_id, title, description, due_date, assignee_id, created_by)
  values (p_object_id, trim(p_title), coalesce(p_description, ''), p_due_date, p_assignee_id, auth.uid())
  returning id into v_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (v_task_id, auth.uid(), 'Задача создана, исполнитель: ' || v_assignee_name);

  return v_task_id;
end;
$$;

revoke execute on function public.create_task(uuid, text, uuid, text, date) from public, anon;
grant execute on function public.create_task(uuid, text, uuid, text, date) to authenticated;
