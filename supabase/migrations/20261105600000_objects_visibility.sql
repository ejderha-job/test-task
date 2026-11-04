-- Исполнитель видит только объекты, где на него назначена хотя бы одна задача.
-- Постановщик видит все объекты.

-- Роль текущего пользователя. security definer — чтобы политики не зависели от RLS на profiles.
create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

drop policy "objects readable by authenticated" on public.objects;

-- (select ...) — чтобы Postgres вычислял функцию один раз на запрос, а не на каждую строку
create policy "objects: provider sees all, executor sees objects with own tasks"
  on public.objects for select to authenticated
  using (
    (select public.current_user_role()) = 'provider'
    or exists (
      select 1 from public.tasks t
      where t.object_id = objects.id
        and t.assignee_id = (select auth.uid())
    )
  );
