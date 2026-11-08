import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Organisasi } from '@/lib/types';
import FormDaftar from './FormDaftar';

export const metadata = { title: 'Daftar' };
export const dynamic = 'force-dynamic';

export default async function DaftarPage() {
  const { data } = await createAdminClient().from('organisasi').select('id, nama, singkatan').order('nama');
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em]">Buat akun</h1>
      <p className="text-sm text-graphite mt-1">Akun langsung aktif tanpa konfirmasi email. Keanggotaan organisasi disetujui oleh admin organisasi.</p>
      <FormDaftar organisasi={(data ?? []) as Pick<Organisasi, 'id' | 'nama' | 'singkatan'>[]} />
      <p className="text-sm text-graphite mt-6">
        Sudah punya akun?{' '}
        <Link href="/masuk" className="font-semibold text-ink underline underline-offset-2">
          Masuk
        </Link>
      </p>
    </>
  );
}
