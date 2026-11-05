-- Комментарий — не отдельная сущность у задачи, а поле записи истории.
-- Заполняется только у записи «Статус: В работе (возвращена на доработку)».

alter table public.task_history
  add column comment text check (comment is null or trim(comment) <> '');

-- Перенос уже написанных комментариев: комментарий и запись истории вставлялись
-- в одной транзакции, поэтому у них совпадают task_id и created_at.
update public.task_history h
set comment = c.text
from public.task_comments c
where c.task_id = h.task_id
  and c.created_at = h.created_at
  and h.text = 'Статус: В работе (возвращена на доработку)';

drop table public.task_comments;

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
  if v_task.status <> 'review' then
    raise exception 'Вернуть на доработку можно только задачу на проверке' using errcode = '42501';
  end if;
  if v_comment = '' then
    raise exception 'Напишите комментарий: что нужно доработать' using errcode = '22023';
  end if;

  update public.tasks set status = 'in_progress' where id = p_task_id;

  insert into public.task_history (task_id, author_id, text, comment)
  values (p_task_id, auth.uid(), 'Статус: В работе (возвращена на доработку)', v_comment);
end;
$$;
