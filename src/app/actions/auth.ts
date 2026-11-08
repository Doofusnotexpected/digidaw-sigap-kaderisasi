'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { catatAudit } from '@/lib/server/data';
import { gagal, galatZod, jalurAman, teks } from '@/lib/server/aksi';
import type { HasilAksi } from '@/lib/types';

export async function masuk(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const email = teks(fd, 'email').toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!email || !password) return gagal('Isi email dan kata sandi.');

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return gagal('Email atau kata sandi salah.');
  redirect(jalurAman(teks(fd, 'lanjut')));
}

const skemaDaftar = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120),
  nim: z.string().trim().regex(/^[0-9]{6,15}$/, 'NIM hanya angka, 6 sampai 15 digit.'),
  jurusan: z.string().trim().min(2, 'Isi program studi.').max(120),
  angkatan: z.coerce.number().int().min(2000, 'Angkatan tidak valid.').max(2100, 'Angkatan tidak valid.'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(72),
  organisasi_id: z.string().uuid().optional().or(z.literal('')),
});

/**
 * Pendaftaran tanpa konfirmasi email: akun dibuat lewat Admin API dengan
 * email_confirm = true, lalu langsung masuk. Pengaturan "Confirm email"
 * di dashboard Supabase tidak berpengaruh pada alur ini.
 */
export async function daftar(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const parsed = skemaDaftar.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return gagal('Periksa kembali isian yang ditandai.', galatZod(parsed.error.issues));
  const d = parsed.data;
  const admin = createAdminClient();

  const { data: nimDipakai } = await admin.from('profil').select('id').eq('nim', d.nim).maybeSingle();
  if (nimDipakai) return gagal('NIM ini sudah terdaftar.', { nim: 'NIM ini sudah terdaftar. Masuk dengan akun yang ada.' });

  const { data: dibuat, error } = await admin.auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
    user_metadata: { nama: d.nama, nim: d.nim, jurusan: d.jurusan, angkatan: String(d.angkatan) },
  });
  if (error || !dibuat.user) {
    const sudahAda = /already|registered|exists/i.test(error?.message ?? '');
    return gagal(sudahAda ? 'Email ini sudah terdaftar.' : 'Akun gagal dibuat. Coba lagi.', sudahAda ? { email: 'Email ini sudah terdaftar.' } : undefined);
  }

  if (d.organisasi_id) {
    await admin.from('keanggotaan').insert({ pengguna_id: dibuat.user.id, organisasi_id: d.organisasi_id, peran: ['ANGGOTA'], aktif: false });
    await catatAudit({
      organisasi_id: d.organisasi_id,
      aktor: { id: dibuat.user.id, nama: d.nama },
      aksi: 'Permintaan bergabung',
      entitas: 'keanggotaan',
      entitas_id: dibuat.user.id,
      keterangan: `${d.nama} (${d.nim}) mendaftar dan meminta bergabung sebagai anggota.`,
    });
  }

  const supabase = createClient();
  const { error: galatMasuk } = await supabase.auth.signInWithPassword({ email: d.email, password: d.password });
  if (galatMasuk) redirect('/masuk?baru=1');
  redirect('/beranda');
}

export async function keluar() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/masuk');
}
