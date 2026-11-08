'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { penggunaWajib } from '@/lib/server/konteks';
import { catatAudit } from '@/lib/server/data';
import { berhasil, gagal, galatZod, teks } from '@/lib/server/aksi';
import type { HasilAksi, Organisasi, PeranGlobal } from '@/lib/types';

// ---------------------------------------------------------------- Profil

const skemaProfil = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(120),
  nim: z.string().trim().regex(/^[0-9]{6,15}$/, 'NIM hanya angka, 6 sampai 15 digit.'),
  jurusan: z.string().trim().min(2, 'Isi program studi.').max(120),
  angkatan: z.coerce.number().int().min(2000).max(2100),
});

export async function ubahProfil(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const { profil } = await penggunaWajib();
  const parsed = skemaProfil.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return gagal('Periksa isian yang ditandai.', galatZod(parsed.error.issues));

  // Lewat klien pengguna: RLS + grant kolom hanya mengizinkan kolom ini
  const { error } = await createClient().from('profil').update(parsed.data).eq('id', profil.id);
  if (error) return gagal(error.code === '23505' ? 'NIM ini sudah dipakai akun lain.' : 'Profil gagal disimpan.', error.code === '23505' ? { nim: 'Sudah dipakai.' } : undefined);
  revalidatePath('/', 'layout');
  return berhasil('Profil tersimpan.');
}

export async function ubahSandi(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  await penggunaWajib();
  const baru = String(fd.get('password') ?? '');
  const ulang = String(fd.get('password_ulang') ?? '');
  if (baru.length < 8) return gagal('Kata sandi minimal 8 karakter.', { password: 'Minimal 8 karakter.' });
  if (baru !== ulang) return gagal('Kedua kata sandi tidak sama.', { password_ulang: 'Tidak sama.' });
  const { error } = await createClient().auth.updateUser({ password: baru });
  if (error) return gagal('Kata sandi gagal diubah.');
  return berhasil('Kata sandi diperbarui.');
}

// ---------------------------------------------------------------- Bergabung

export async function gabungOrganisasi(fd: FormData) {
  const { profil } = await penggunaWajib();
  const orgId = teks(fd, 'organisasi_id');
  const admin = createAdminClient();
  const { data: org } = await admin.from('organisasi').select('*').eq('id', orgId).maybeSingle();
  if (!org) return;
  // Ubah baris 52 menjadi seperti ini:
const { error } = await (admin.from('keanggotaan') as any).insert({ 
  pengguna_id: profil.id, 
  organisasi_id: orgId, 
  peran: ['ANGGOTA'], 
  aktif: false 
});
  if (error) return; // sudah pernah meminta
  await catatAudit({
    organisasi_id: orgId,
    aktor: { id: profil.id, nama: profil.nama },
    aksi: 'Permintaan bergabung',
    entitas: 'keanggotaan',
    entitas_id: profil.id,
    keterangan: `${profil.nama} meminta bergabung ke ${(org as Organisasi).singkatan}.`,
  });
  revalidatePath('/beranda');
}

export async function batalGabung(fd: FormData) {
  const { profil } = await penggunaWajib();
  await createAdminClient().from('keanggotaan').delete().eq('pengguna_id', profil.id).eq('organisasi_id', teks(fd, 'organisasi_id')).eq('aktif', false);
  revalidatePath('/beranda');
}

// ---------------------------------------------------------------- Superadmin

async function superadminWajib() {
  const p = await penggunaWajib();
  return p.profil.peran_global === 'SUPERADMIN' ? p : null;
}

const skemaOrg = z.object({
  nama: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(120),
  singkatan: z.string().trim().min(2, 'Minimal 2 karakter.').max(30),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, 'Huruf kecil, angka, dan tanda hubung, 2 sampai 40 karakter.'),
  jenis: z.enum(['ORMAWA', 'UKM']),
  deskripsi: z.string().trim().max(500),
  email_admin: z.union([z.literal(''), z.string().trim().toLowerCase().email('Format email tidak valid.')]),
});

export async function buatOrganisasi(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const p = await superadminWajib();
  if (!p) return gagal('Hanya superadmin.');
  const parsed = skemaOrg.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return gagal('Periksa isian yang ditandai.', galatZod(parsed.error.issues));
  const { email_admin, ...d } = parsed.data;
  const admin = createAdminClient();

  const { data: org, error } = await admin
    .from('organisasi')
    .insert({ ...d, deskripsi: d.deskripsi || null })
    .select()
    .single();
  if (error || !org) return gagal(error?.code === '23505' ? 'Slug sudah dipakai.' : 'Organisasi gagal dibuat.', error?.code === '23505' ? { slug: 'Sudah dipakai.' } : undefined);

  let catatanAdmin = '';
  if (email_admin) {
    const { data: u } = await admin.from('profil').select('id, nama').eq('email', email_admin).maybeSingle();
    if (u) {
      await admin.from('keanggotaan').insert({ pengguna_id: (u as { id: string }).id, organisasi_id: (org as Organisasi).id, peran: ['ADMIN'], aktif: true });
      catatanAdmin = ` Admin: ${(u as { nama: string }).nama}.`;
    } else {
      catatanAdmin = ' Email admin belum terdaftar, tambahkan admin nanti.';
    }
  }
  await catatAudit({
    organisasi_id: (org as Organisasi).id,
    aktor: { id: p.profil.id, nama: p.profil.nama },
    aksi: 'Organisasi dibuat',
    keterangan: `${d.nama} (${d.jenis}).${catatanAdmin}`,
  });
  revalidatePath('/', 'layout');
  return berhasil(`${d.singkatan} dibuat.${catatanAdmin}`);
}

export async function ubahPeranGlobal(fd: FormData) {
  const p = await superadminWajib();
  if (!p) return;
  const target = teks(fd, 'profil_id');
  const peran = teks(fd, 'peran_global') as PeranGlobal;
  if (!['MAHASISWA', 'AUDITOR_KAMPUS', 'SUPERADMIN'].includes(peran)) return;
  if (target === p.profil.id && peran !== 'SUPERADMIN') return; // tidak menurunkan diri sendiri

  const admin = createAdminClient();
  const { data: lama } = await admin.from('profil').select('nama, peran_global').eq('id', target).maybeSingle();
  if (!lama) return;
  await admin.from('profil').update({ peran_global: peran }).eq('id', target);
  await catatAudit({
    aktor: { id: p.profil.id, nama: p.profil.nama },
    aksi: 'Peran global diubah',
    entitas: 'profil',
    entitas_id: target,
    keterangan: `${(lama as { nama: string }).nama}: ${(lama as { peran_global: string }).peran_global} menjadi ${peran}.`,
  });
  revalidatePath('/admin');
}
