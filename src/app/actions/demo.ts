'use server';

// Mode demo untuk juri: mengubah isi entri yang sudah disegel langsung di
// basis data (melewati aplikasi), lalu memulihkannya. Hanya aktif bila
// DEMO_MODE=true dan dijalankan oleh admin organisasi atau superadmin.
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { catatAudit } from '@/lib/server/data';
import { segarkanOrg, teks } from '@/lib/server/aksi';
import { env } from '@/lib/env';
import type { Kontribusi, RiwayatPerubahan } from '@/lib/types';

const KOLOM_ISI = [
  'kegiatan',
  'peran_kegiatan',
  'periode_kegiatan',
  'tanggal_kegiatan',
  'uraian',
  'bukti_url',
  'bukti_path',
  'status',
  'nilai_kepemimpinan',
  'nilai_eksekusi',
  'nilai_kolaborasi',
  'nilai_dampak',
  'catatan_verifikator',
  'verifikator_id',
  'diverifikasi_pada',
] as const;

export async function simulasiUbahData(fd: FormData) {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!env.demoMode || !ctx.akses.kelola) return;

  const admin = createAdminClient();
  // Entri tersegel paling awal milik organisasi ini
  const { data: segel } = await admin.from('segel_hash').select('kontribusi_id, urutan, kontribusi!inner(organisasi_id)').eq('kontribusi.organisasi_id', ctx.org.id).order('urutan').limit(1).maybeSingle();
  if (!segel) return;
  const id = (segel as { kontribusi_id: string }).kontribusi_id;
  const { data } = await admin.from('kontribusi').select('*').eq('id', id).single();
  const k = data as Kontribusi;
  const baru = k.nilai_eksekusi === 5 ? 4 : 5;

  await admin.from('kontribusi').update({ nilai_eksekusi: baru }).eq('id', id);
  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Simulasi: nilai entri diubah langsung di basis data (mode demo)',
    entitas: 'kontribusi',
    entitas_id: id,
    keterangan: `Nilai keandalan pada "${k.kegiatan}" diubah dari ${k.nilai_eksekusi} ke ${baru} tanpa melalui alur verifikasi.`,
  });
  segarkanOrg(slug);
}

export async function pulihkanSimulasi(fd: FormData) {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!env.demoMode || !ctx.akses.kelola) return;

  const admin = createAdminClient();
  const { data } = await admin.from('riwayat_perubahan').select('*').eq('organisasi_id', ctx.org.id).order('id');
  const riwayat = (data ?? []) as RiwayatPerubahan[];
  // Data_lama pertama tiap entri = isi saat disegel
  const asli = new Map<string, Partial<Kontribusi>>();
  for (const r of riwayat) if (!asli.has(r.kontribusi_id)) asli.set(r.kontribusi_id, r.data_lama);

  let n = 0;
  for (const [id, lama] of asli) {
    const isi = Object.fromEntries(KOLOM_ISI.map((c) => [c, lama[c] ?? null]));
    const { data: kini } = await admin.from('kontribusi').select('*').eq('id', id).maybeSingle();
    if (!kini) continue;
    const beda = KOLOM_ISI.some((c) => JSON.stringify((kini as Record<string, unknown>)[c] ?? null) !== JSON.stringify(isi[c]));
    if (!beda) continue;
    await admin.from('kontribusi').update(isi).eq('id', id);
    n++;
  }
  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Simulasi selesai: data dipulihkan dari riwayat perubahan (mode demo)',
    keterangan: `${n} entri dikembalikan ke isi saat disegel.`,
  });
  segarkanOrg(slug);
}
