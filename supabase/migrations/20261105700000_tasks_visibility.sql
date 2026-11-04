-- Исполнитель видит только назначенные на него задачи и их историю.
-- Постановщик видит всё.

drop policy "tasks readable by authenticated" on public.tasks;

create policy "tasks: provider sees all, executor sees own"
  on public.tasks for select to authenticated
  using (
    (select public.current_user_role()) = 'provider'
    or assignee_id = (select auth.uid())
  );

drop policy "task history readable by authenticated" on public.task_history;

create policy "task history: provider sees all, executor sees own tasks"
  on public.task_history for select to authenticated
  using (
    (select public.current_user_role()) = 'provider'
    or exists (
      select 1 from public.tasks t
      where t.id = task_history.task_id
        and t.assignee_id = (select auth.uid())
    )
  );
