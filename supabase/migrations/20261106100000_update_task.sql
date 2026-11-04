-- Постановщик редактирует название, описание и срок задачи (исполнитель не меняется).
-- Только для незавершённых задач: new / in_progress / review.

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
  if v_task.status not in ('new', 'in_progress', 'review') then
    raise exception 'Завершённую или архивную задачу изменить нельзя' using errcode = '42501';
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

revoke execute on function public.update_task(uuid, text, text, date) from public, anon;
grant execute on function public.update_task(uuid, text, text, date) to authenticated;
