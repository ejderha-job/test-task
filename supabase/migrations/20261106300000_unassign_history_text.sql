-- Снятие исполнителя: в историю пишется только смена статуса — «Статус: Открыта»
-- (статус new на экране теперь называется «Открыта»).

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
  if v_task.status not in ('new', 'in_progress', 'review') then
    raise exception 'Завершённую или архивную задачу изменить нельзя' using errcode = '42501';
  end if;
  if v_task.assignee_id is null then
    raise exception 'Исполнитель не назначен' using errcode = '42501';
  end if;

  update public.tasks set assignee_id = null, status = 'new' where id = p_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: Открыта');
end;
$$;
