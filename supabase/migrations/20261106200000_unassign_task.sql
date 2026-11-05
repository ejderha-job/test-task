-- Постановщик снимает исполнителя: задача возвращается в статус new без исполнителя,
-- после чего можно назначить другого через assign_task.
-- Только для незавершённых задач: new / in_progress / review.

create function public.unassign_task(p_task_id uuid)
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
  if v_task.status not in ('new', 'in_progress', 'review') then
    raise exception 'Завершённую или архивную задачу изменить нельзя' using errcode = '42501';
  end if;
  if v_task.assignee_id is null then
    raise exception 'Исполнитель не назначен' using errcode = '42501';
  end if;

  select coalesce(full_name, email) into v_name from public.profiles where id = v_task.assignee_id;

  update public.tasks set assignee_id = null, status = 'new' where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (
    p_task_id,
    auth.uid(),
    'Исполнитель снят: ' || coalesce(v_name, '—')
      || case when v_task.status <> 'new' then '. Статус: Новая' else '' end
  );
end;
$$;

revoke execute on function public.unassign_task(uuid) from public, anon;
grant execute on function public.unassign_task(uuid) to authenticated;
