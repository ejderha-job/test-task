-- Тестовые данные (бывший src/data/mock.ts).
-- Пользователи anna@example.com (provider) и ivan@example.com (executor) должны уже существовать.

do $$
declare
  v_anna uuid := (select id from public.profiles where email = 'anna@example.com');
  v_ivan uuid := (select id from public.profiles where email = 'ivan@example.com');
  v_o1 uuid;
  v_o2 uuid;
  v_t uuid;
begin
  insert into public.objects (name, address) values ('ЖК «Северный»', 'ул. Ленина, 10') returning id into v_o1;
  insert into public.objects (name, address) values ('Офисный центр «Плаза»', 'пр. Мира, 25') returning id into v_o2;

  insert into public.tasks (object_id, title, description, status, assignee_id, created_by, due_date, created_at)
  values (v_o1, 'Проверить электрощитовую', 'Осмотреть щитовую на 1 этаже, составить акт.',
          'new', v_ivan, v_anna, '2026-11-10', '2026-11-01 09:00+03')
  returning id into v_t;
  insert into public.task_history (task_id, author_id, text, created_at) values
    (v_t, v_anna, 'Задача создана', '2026-11-01 09:00+03');

  insert into public.tasks (object_id, title, description, status, assignee_id, created_by, due_date, created_at)
  values (v_o1, 'Замена ламп в подъезде 2', 'Заменить перегоревшие лампы на 3–5 этажах.',
          'in_progress', v_ivan, v_anna, '2026-11-07', '2026-10-30 10:00+03')
  returning id into v_t;
  insert into public.task_history (task_id, author_id, text, created_at) values
    (v_t, v_anna, 'Задача создана', '2026-10-30 10:00+03'),
    (v_t, v_ivan, 'Статус: В работе', '2026-10-31 12:30+03');

  insert into public.tasks (object_id, title, description, status, assignee_id, created_by, due_date, created_at)
  values (v_o2, 'Ремонт кондиционера', 'Кондиционер в переговорной 304 не охлаждает.',
          'review', v_ivan, v_anna, '2026-11-05', '2026-10-28 08:15+03')
  returning id into v_t;
  insert into public.task_history (task_id, author_id, text, created_at) values
    (v_t, v_anna, 'Задача создана', '2026-10-28 08:15+03'),
    (v_t, v_ivan, 'Статус: В работе', '2026-10-29 11:00+03'),
    (v_t, v_ivan, 'Статус: На проверке', '2026-11-03 17:40+03');
end;
$$;
