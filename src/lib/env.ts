// Variabel lingkungan. Kunci service_role tidak pernah dikirim ke browser.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  demoMode: process.env.DEMO_MODE === 'true',
};

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  // Pesan jelas saat .env.local belum diisi
  console.warn('[SIGAP] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi. Salin .env.example menjadi .env.local.');
}
