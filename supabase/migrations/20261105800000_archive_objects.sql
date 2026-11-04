-- Мягкое удаление объектов: архивирование. Данные остаются, объект помечается archived_at.
-- Архивный объект нельзя редактировать и добавлять в него задачи.

alter table public.objects add column archived_at timestamptz;

create function public.archive_object(p_object_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_archived_at timestamptz;
begin
  perform public.assert_provider();

  select archived_at into v_archived_at from public.objects where id = p_object_id for update;
  if not found then
    raise exception 'Объект не найден' using errcode = 'P0002';
  end if;
  if v_archived_at is not null then
    raise exception 'Объект уже в архиве' using errcode = '42501';
  end if;

  update public.objects set archived_at = now() where id = p_object_id;
end;
$$;

revoke execute on function public.archive_object(uuid) from public, anon;
grant execute on function public.archive_object(uuid) to authenticated;

-- Проверка: объект существует и не в архиве
create function public.assert_object_active(p_object_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_archived_at timestamptz;
begin
  select archived_at into v_archived_at from public.objects where id = p_object_id;
  if not found then
    raise exception 'Объект не найден' using errcode = 'P0002';
  end if;
  if v_archived_at is not null then
    raise exception 'Объект в архиве' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.assert_object_active(uuid) from public, anon, authenticated;

create or replace function public.update_object(p_object_id uuid, p_name text, p_address text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_provider();
  perform public.assert_object_active(p_object_id);

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Укажите название объекта' using errcode = '22023';
  end if;

  update public.objects
    set name = trim(p_name), address = coalesce(trim(p_address), '')
    where id = p_object_id;
end;
$$;

create or replace function public.create_task(
  p_object_id uuid,
  p_title text,
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
begin
  perform public.assert_provider();
  perform public.assert_object_active(p_object_id);

  if coalesce(trim(p_title), '') = '' then
    raise exception 'Укажите название задачи' using errcode = '22023';
  end if;

  insert into public.tasks (object_id, title, description, due_date, created_by)
  values (p_object_id, trim(p_title), coalesce(p_description, ''), p_due_date, auth.uid())
  returning id into v_task_id;

  insert into public.task_history (task_id, author_id, text)
  values (v_task_id, auth.uid(), 'Задача создана');

  return v_task_id;
end;
$$;
