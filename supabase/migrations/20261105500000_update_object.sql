-- Постановщик редактирует название и адрес объекта

create function public.update_object(p_object_id uuid, p_name text, p_address text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_provider();

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Укажите название объекта' using errcode = '22023';
  end if;

  update public.objects
    set name = trim(p_name), address = coalesce(trim(p_address), '')
    where id = p_object_id;

  if not found then
    raise exception 'Объект не найден' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.update_object(uuid, text, text) from public, anon;
grant execute on function public.update_object(uuid, text, text) to authenticated;
