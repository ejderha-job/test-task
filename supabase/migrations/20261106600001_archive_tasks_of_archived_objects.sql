-- Раньше архивация объекта не трогала выполненные задачи. Теперь в архив уходят все задачи
-- объекта — доархивируем оставшиеся, с записью в истории на момент архивации объекта.
with archived as (
  update public.tasks t
    set archived_at = o.archived_at
    from public.objects o
    where o.id = t.object_id and o.archived_at is not null and t.archived_at is null
    returning t.id, o.archived_at
)
insert into public.task_history (task_id, author_id, text, created_at)
select id, null, 'Задача перенесена в архив (объект перенесён в архив)', archived_at from archived;
