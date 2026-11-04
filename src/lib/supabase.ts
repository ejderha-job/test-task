import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (см. .env.example)')
}

// Типы сгенерированы: supabase gen types typescript --project-id zmybghjwmghkvjzhbjvl --schema public > src/lib/database.types.ts
export const supabase = createClient<Database>(url, anonKey)
