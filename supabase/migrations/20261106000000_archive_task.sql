-- Постановщик может отправить отдельную задачу в архив из статусов new / in_progress / review.
-- Выполненные задачи не архивируются; из archived переходов нет.

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
        ('review', 'in_progress'),
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
    when 'new' then 'Новая'
    when 'in_progress' then 'В работе'
    when 'review' then 'На проверке'
    when 'done' then 'Выполнена'
    when 'archived' then 'В архиве'
  end;

  insert into public.task_history (task_id, author_id, text)
  values (p_task_id, auth.uid(), 'Статус: ' || v_label);
end;
$$;
