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
    await supabase
      .from('objects')
      .select('id, name, address, tasks(count)')
      .is('archived_at', null)
      .order('name'),
  )
}

export async function fetchObjectWithTasks(objectId: string) {
  const object = unwrapMaybe(
    await supabase
      .from('objects')
      .select('id, name, address, archived_at')
      .eq('id', objectId)
      .maybeSingle(),
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
      // !inner + фильтр — задачи архивных объектов не показываем
      .select('id, title, status, due_date, object:objects!inner(name)')
      .is('object.archived_at', null)
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

export async function fetchExecutors() {
  return unwrap(
    await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'executor')
      .order('full_name'),
  )
}

export type NewTask = {
  objectId: string
  title: string
  description: string
  dueDate: string | null
}

// Возвращает id созданной задачи
export async function createTask(task: NewTask) {
  return unwrap(
    await supabase.rpc('create_task', {
      p_object_id: task.objectId,
      p_title: task.title,
      p_description: task.description,
      p_due_date: task.dueDate ?? undefined,
    }),
  )
}

// Возвращает id созданного объекта
export async function createObject(object: { name: string; address: string }) {
  return unwrap(
    await supabase.rpc('create_object', { p_name: object.name, p_address: object.address }),
  )
}

// Назначить исполнителя задаче без исполнителя (сменить потом нельзя)
export async function assignTask(taskId: string, assigneeId: string) {
  const { error } = await supabase.rpc('assign_task', {
    p_task_id: taskId,
    p_assignee_id: assigneeId,
  })
  if (error) throw new Error(error.message)
}

export async function updateObject(objectId: string, object: { name: string; address: string }) {
  const { error } = await supabase.rpc('update_object', {
    p_object_id: objectId,
    p_name: object.name,
    p_address: object.address,
  })
  if (error) throw new Error(error.message)
}

// Мягкое удаление объекта
export async function archiveObject(objectId: string) {
  const { error } = await supabase.rpc('archive_object', { p_object_id: objectId })
  if (error) throw new Error(error.message)
}
