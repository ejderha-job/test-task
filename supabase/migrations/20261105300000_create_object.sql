-- Постановщик создаёт объекты. Как и для задач — только через функцию, прямой insert закрыт RLS.

create function public.create_object(p_name text, p_address text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_object_id uuid;
begin
  perform public.assert_provider();

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Укажите название объекта' using errcode = '22023';
  end if;

  insert into public.objects (name, address)
  values (trim(p_name), coalesce(trim(p_address), ''))
  returning id into v_object_id;

  return v_object_id;
end;
$$;

revoke execute on function public.create_object(text, text) from public, anon;
grant execute on function public.create_object(text, text) to authenticated;
