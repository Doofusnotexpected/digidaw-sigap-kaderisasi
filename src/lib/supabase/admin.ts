// Klien service_role: melewati RLS. HANYA dipakai di server setelah
// pengecekan peran dilakukan secara eksplisit.
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

// Tipe ditulis eksplisit. ReturnType<typeof createClient> membuat skema
// bertipe never sehingga insert/update ditolak TypeScript saat build.
export type AdminClient = SupabaseClient<any, 'public', any>;

let cache: AdminClient | null = null;

export function createAdminClient(): AdminClient {
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    throw new Error('SIGAP: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local. Isi lalu restart server.');
  }
  if (!cache) {
    cache = createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cache;
}
