import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Singleton del cliente de Supabase. Importar `supabase` desde aquí; nunca
// llamar a createClient dentro de un route.ts. Solo servidor: usa la
// service_role key (las tablas tienen RLS activo y sin policies).
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}

// Se cachea en globalThis para sobrevivir al hot-reload de `next dev`.
const globalForSupabase = globalThis as unknown as { __supabase?: SupabaseClient };

export const supabase: SupabaseClient =
  globalForSupabase.__supabase ??
  createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

if (process.env.NODE_ENV !== 'production') globalForSupabase.__supabase = supabase;
