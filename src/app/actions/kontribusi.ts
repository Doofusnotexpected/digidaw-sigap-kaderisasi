'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { catatAudit } from '@/lib/server/data';
import { berhasil, gagal, galatZod, segarkanOrg, teks } from '@/lib/server/aksi';
import type { HasilAksi, Kontribusi } from '@/lib/types';

const skema = z
  .object({
    kegiatan: z.string().trim().min(3, 'Nama kegiatan minimal 3 karakter.').max(200),
    peran_kegiatan: z.string().trim().min(2, 'Isi peran Anda di kegiatan ini.').max(120),
    periode_kegiatan: z.string().trim().min(2, 'Isi periode kegiatan, misalnya "Agu – Okt 2026".').max(60),
    tanggal_kegiatan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal kegiatan.'),
    uraian: z.string().trim().max(2000, 'Uraian maksimal 2000 karakter.'),
    bukti_url: z.union([z.literal(''), z.string().trim().url('Tautan harus diawali http:// atau https://').regex(/^https?:\/\//i, 'Tautan harus diawali http:// atau https://')]),
    bukti_path: z.string().trim().max(400),
  })
  .refine((d) => d.bukti_url || d.bukti_path, { message: 'Lampirkan tautan atau unggah berkas bukti.', path: ['bukti_url'] });

export async function simpanKontribusi(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!ctx.akses.kontribusi) return gagal('Hanya anggota aktif yang dapat mencatat kontribusi.');

  const parsed = skema.safeParse({
    kegiatan: teks(fd, 'kegiatan'),
    peran_kegiatan: teks(fd, 'peran_kegiatan'),
    periode_kegiatan: teks(fd, 'periode_kegiatan'),
    tanggal_kegiatan: teks(fd, 'tanggal_kegiatan'),
    uraian: teks(fd, 'uraian'),
    bukti_url: teks(fd, 'bukti_url'),
    bukti_path: teks(fd, 'bukti_path'),
  });
  if (!parsed.success) return gagal('Periksa kembali isian yang ditandai.', galatZod(parsed.error.issues));
  const d = parsed.data;

  if (d.tanggal_kegiatan > new Date().toISOString().slice(0, 10)) {
    return gagal('Tanggal kegiatan tidak boleh di masa depan.', { tanggal_kegiatan: 'Tanggal kegiatan tidak boleh di masa depan.' });
  }
  if (d.bukti_path && !d.bukti_path.startsWith(`${ctx.profil.id}/`)) {
    return gagal('Berkas bukti tidak valid. Unggah ulang.');
  }

  const supabase = createClient();
  const id = teks(fd, 'id');
  const isi = {
    kegiatan: d.kegiatan,
    peran_kegiatan: d.peran_kegiatan,
    periode_kegiatan: d.periode_kegiatan,
    tanggal_kegiatan: d.tanggal_kegiatan,
    uraian: d.uraian,
    bukti_url: d.bukti_url || null,
    bukti_path: d.bukti_path || null,
  };

  if (id) {
    // Ubah entri yang masih menunggu, atau kirim ulang entri yang ditolak
    const { data, error } = await supabase
      .from('kontribusi')
      .update({ ...isi, status: 'MENUNGGU', verifikator_id: null, diverifikasi_pada: null, catatan_verifikator: null })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error || !data) return gagal('Entri tidak bisa diubah. Entri yang sudah disetujui terkunci.');
    await catatAudit({
      organisasi_id: ctx.org.id,
      aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
      aksi: 'Entri diperbarui dan dikirim ulang',
      entitas: 'kontribusi',
      entitas_id: id,
      keterangan: d.kegiatan,
    });
    segarkanOrg(slug);
    return berhasil(`${d.kegiatan} diperbarui dan masuk antrean verifikasi.`);
  }

  const { data, error } = await supabase
    .from('kontribusi')
    .insert({ ...isi, pengguna_id: ctx.profil.id, organisasi_id: ctx.org.id })
    .select()
    .single();
  if (error || !data) return gagal('Entri gagal disimpan. Coba lagi.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Entri baru dikirim',
    entitas: 'kontribusi',
    entitas_id: (data as Kontribusi).id,
    keterangan: d.kegiatan,
  });
  segarkanOrg(slug);
  return berhasil(`${d.kegiatan} terkirim dan masuk antrean verifikasi.`);
}

export async function hapusKontribusi(fd: FormData) {
  const slug = teks(fd, 'slug');
  const id = teks(fd, 'id');
  const ctx = await konteksOrg(slug);
  const supabase = createClient();
  const { data } = await supabase.from('kontribusi').delete().eq('id', id).eq('pengguna_id', ctx.profil.id).select().maybeSingle();
  const k = data as Kontribusi | null;
  if (!k) return;
  if (k.bukti_path) await createAdminClient().storage.from('bukti').remove([k.bukti_path]);
  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Entri dihapus oleh pengaju',
    entitas: 'kontribusi',
    entitas_id: id,
    keterangan: k.kegiatan,
  });
  segarkanOrg(slug);
}
