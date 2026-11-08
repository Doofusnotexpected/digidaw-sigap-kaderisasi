'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { catatAudit, sinkronPenanda } from '@/lib/server/data';
import { berhasil, gagal, segarkanOrg, teks } from '@/lib/server/aksi';
import type { HasilAksi, PenandaPola } from '@/lib/types';

export async function tinjauPenanda(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!ctx.akses.tinjauPenanda || !ctx.periode) return gagal('Hanya panitia atau admin yang dapat menandai peringatan sudah ditinjau.');

  const catatan = teks(fd, 'catatan');
  if (catatan.length < 10) return gagal('Tulis hasil tinjauan minimal 10 karakter.', { catatan: 'Minimal 10 karakter.' });

  const { data } = await createAdminClient()
    .from('penanda_pola')
    .update({ ditinjau_oleh: ctx.profil.id, ditinjau_pada: new Date().toISOString(), catatan_tinjauan: catatan.slice(0, 1000) })
    .eq('id', teks(fd, 'id'))
    .eq('periode_id', ctx.periode.id)
    .select()
    .maybeSingle();
  if (!data) return gagal('Penanda tidak ditemukan.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: ctx.periode.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Penanda pola ditinjau',
    entitas: 'penanda_pola',
    entitas_id: (data as PenandaPola).id,
    keterangan: `${(data as PenandaPola).keterangan} Hasil tinjauan: ${catatan}`,
  });
  segarkanOrg(slug);
  return berhasil('Hasil tinjauan tersimpan di jejak audit.');
}

export async function jalankanPemeriksaan(fd: FormData) {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!ctx.akses.lihatPenanda || !ctx.periode || ctx.periode.status === 'DITUTUP') return;
  const n = await sinkronPenanda(ctx.periode);
  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: ctx.periode.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Pemeriksaan penanda pola dijalankan',
    keterangan: `${n} aturan terpicu.`,
  });
  segarkanOrg(slug);
}
