-- Исправление: миграция 20261105900001 перевела в статус archived задачи объектов,
-- заархивированных ещё до появления этого статуса, но не записала это в историю.
-- Добавляем недостающую запись датой архивации объекта. Кто архивировал, не сохранялось — автор пустой.
-- Идемпотентно: задачи, у которых запись уже есть, пропускаются.

insert into public.task_history (task_id, author_id, text, created_at)
select t.id, null, 'Статус: В архиве (объект перенесён в архив)', o.archived_at
from public.tasks t
join public.objects o on o.id = t.object_id
where t.status = 'archived'
  and o.archived_at is not null
  and not exists (
    select 1 from public.task_history h
    where h.task_id = t.id and h.text like 'Статус: В архиве%'
  );
