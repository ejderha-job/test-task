// Запросы к Supabase. Каждая функция бросает Error при ошибке.
import { supabase } from '../lib/supabase'
import type { TaskStatus } from '../lib/tasks'

type Result<D> = { data: D; error: { message: string } | null }

function unwrap<D>({ data, error }: Result<D>): NonNullable<D> {
  if (error) throw new Error(error.message)
  if (data == null) throw new Error('Пустой ответ')
  return data
}

// Для maybeSingle(): null — запись не найдена
function unwrapMaybe<D>({ data, error }: Result<D>): D {
  if (error) throw new Error(error.message)
  return data
}

// У tasks две ссылки на profiles (assignee_id и created_by), поэтому связь указана явно
const taskListFields =
  'id, title, status, due_date, assignee_id, assignee:profiles!tasks_assignee_id_fkey(full_name, email)'

export async function fetchObjects() {
  return unwrap(
    await supabase.from('objects').select('id, name, address, tasks(count)').order('name'),
  )
}

export async function fetchObjectWithTasks(objectId: string) {
  const object = unwrapMaybe(
    await supabase.from('objects').select('id, name, address').eq('id', objectId).maybeSingle(),
  )
  const tasks = unwrap(
    await supabase
      .from('tasks')
      .select(taskListFields)
      .eq('object_id', objectId)
      .order('created_at'),
  )
  return { object, tasks }
}

export async function fetchTask(taskId: string) {
  return unwrapMaybe(
    await supabase
      .from('tasks')
      .select(
        `id, title, description, status, due_date, assignee_id,
         object:objects(id, name),
         assignee:profiles!tasks_assignee_id_fkey(full_name, email),
         history:task_history(id, text, created_at, author:profiles(full_name, email))`,
      )
      .eq('id', taskId)
      .order('created_at', { referencedTable: 'task_history', ascending: false })
      .maybeSingle(),
  )
}

export async function fetchMyTasks(userId: string) {
  return unwrap(
    await supabase
      .from('tasks')
      .select('id, title, status, due_date, object:objects(name)')
      .eq('assignee_id', userId)
      .neq('status', 'done')
      .order('due_date'),
  )
}

export async function changeTaskStatus(taskId: string, status: TaskStatus) {
  const { error } = await supabase.rpc('change_task_status', {
    p_task_id: taskId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
}
