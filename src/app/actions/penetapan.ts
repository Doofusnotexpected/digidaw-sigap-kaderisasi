'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { catatAudit, muatPenilaian, sinkronPenanda } from '@/lib/server/data';
import { berhasil, gagal, segarkanOrg, teks } from '@/lib/server/aksi';
import { pembandingTertinggi, skorKecocokan } from '@/lib/saw';
import { MIN_ALASAN } from '@/lib/konstanta';

import type { HasilAksi, PenetapanPeran, SlotPeran } from '@/lib/types';

/**
 * Tetapkan kandidat ke slot peran (proposal Bab 4.2 langkah 5).
 * Bila ada kandidat lain yang lebih cocok untuk slot ini dan belum
 * ditetapkan di slot lain, alasan tertulis wajib diisi.
 */
export async function tetapkanPeran(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  const periode = ctx.periode;
  if (!ctx.akses.tetapkan || !periode) return gagal('Penetapan hanya dapat dilakukan panitia suksesi saat periode dibuka.');

  const admin = createAdminClient();
  const slotId = teks(fd, 'slot_id');
  const kandidatId = teks(fd, 'kandidat_id');
  const alasan = teks(fd, 'alasan').slice(0, 2000);

  const { data: slotData } = await admin.from('slot_peran').select('*').eq('id', slotId).eq('periode_id', periode.id).maybeSingle();
  const slot = slotData as SlotPeran | null;
  if (!slot) return gagal('Slot peran tidak ditemukan pada periode ini.');

  const { hasil, profil } = await muatPenilaian(ctx.org.id, periode.bobot);
  const kandidat = hasil.find((h) => h.id === kandidatId);
  if (!kandidat) return gagal('Kandidat belum punya entri terverifikasi sehingga belum bisa ditetapkan.');

  const { data: adaData } = await admin.from('penetapan_peran').select('*').eq('periode_id', periode.id);
  const ada = (adaData ?? []) as PenetapanPeran[];
  const diSlotLain = new Set(ada.filter((p) => p.slot_id !== slot.id && p.kandidat_id !== kandidatId).map((p) => p.kandidat_id));

  const kecocokan = skorKecocokan(kandidat, slot.bobot);
  const pembanding = pembandingTertinggi(hasil, kandidatId, slot.bobot, diSlotLain);

  if (pembanding && alasan.length < MIN_ALASAN) {
    return gagal(`Tulis alasan minimal ${MIN_ALASAN} karakter. ${pembanding.kandidat.nama} punya kecocokan lebih tinggi untuk ${slot.nama}.`, {
      alasan: `Minimal ${MIN_ALASAN} karakter.`,
    });
  }

  // Satu kandidat satu slot, satu slot satu kandidat
  await admin.from('penetapan_peran').delete().eq('periode_id', periode.id).or(`slot_id.eq.${slot.id},kandidat_id.eq.${kandidatId}`);
  const { error } = await admin.from('penetapan_peran').insert({
    periode_id: periode.id,
    slot_id: slot.id,
    kandidat_id: kandidatId,
    skor_kecocokan: kecocokan,
    skor_saw: kandidat.skor,
    kecocokan_tertinggi: pembanding?.skor ?? kecocokan,
    pembanding_id: pembanding?.kandidat.id ?? null,
    alasan_tertulis: pembanding ? alasan : alasan || null,
    ditetapkan_oleh: ctx.profil.id,
  });
  if (error) {
    console.error('[SIGAP] penetapan gagal', error);
    return gagal('Penetapan gagal disimpan. Coba lagi.');
  }

  const nama = profil.get(kandidatId)?.nama ?? kandidat.nama;
  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: `Penetapan ${slot.nama}`,
    entitas: 'penetapan_peran',
    entitas_id: slot.id,
    keterangan: pembanding
      ? `${nama} (kecocokan ${kecocokan}) dipilih meski ${pembanding.kandidat.nama} lebih cocok (${pembanding.skor}). Alasan: ${alasan}`
      : `${nama} ditetapkan dengan kecocokan tertinggi yang tersedia (${kecocokan}).${alasan ? ` Catatan: ${alasan}` : ''}`,
    data: { kandidat_id: kandidatId, kecocokan, skor_saw: kandidat.skor, pembanding_id: pembanding?.kandidat.id ?? null, pembanding_skor: pembanding?.skor ?? null, alasan: alasan || null },
  });
  await sinkronPenanda(periode);
  segarkanOrg(slug);
  return berhasil(`${nama} ditetapkan sebagai ${slot.nama}.`);
}

export async function kosongkanSlot(fd: FormData) {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  const periode = ctx.periode;
  if (!ctx.akses.tetapkan || !periode) return;

  const admin = createAdminClient();
  const slotId = teks(fd, 'slot_id');
  const { data } = await admin.from('penetapan_peran').delete().eq('periode_id', periode.id).eq('slot_id', slotId).select().maybeSingle();
  if (!data) return;
  const row = data as PenetapanPeran;
  const [{ data: p }, { data: s }] = await Promise.all([
    admin.from('profil').select('nama').eq('id', row.kandidat_id).maybeSingle(),
    admin.from('slot_peran').select('nama').eq('id', slotId).maybeSingle(),
  ]);

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: `${(s as { nama: string } | null)?.nama ?? 'Slot'} dikosongkan`,
    entitas: 'penetapan_peran',
    entitas_id: slotId,
    keterangan: `${(p as { nama: string } | null)?.nama ?? 'Kandidat'} dilepas dari slot ini.`,
  });
  await sinkronPenanda(periode);
  segarkanOrg(slug);
}
