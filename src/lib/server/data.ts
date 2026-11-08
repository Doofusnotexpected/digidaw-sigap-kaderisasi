// Akses data bersama di server: jejak audit, penilaian SAW, penanda pola, integritas.
import 'server-only';
import { createAdminClient, type AdminClient } from '../supabase/admin';
import { hitungSAW, type HasilSAW } from '../saw';
import { periksaPola } from '../penanda';
import { telusuriRantai, type LaporanIntegritas } from '../integritas';
import type { Bobot, Keanggotaan, Kontribusi, PenetapanPeran, PeriodeSuksesi, Profil, SegelHash, SlotPeran } from '../types';

type Admin = AdminClient;

/** Supabase membatasi 1000 baris per permintaan; ambil per halaman. */
export async function ambilSemua<T>(buat: (dari: number, sampai: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const hasil: T[] = [];
  const ukuran = 1000;
  for (let dari = 0; ; dari += ukuran) {
    const { data, error } = await buat(dari, dari + ukuran - 1);
    if (error) throw error;
    const baris = (data ?? []) as T[];
    hasil.push(...baris);
    if (baris.length < ukuran) break;
  }
  return hasil;
}

export async function catatAudit(e: {
  organisasi_id?: string | null;
  periode_id?: string | null;
  aktor?: { id: string; nama: string } | null;
  aksi: string;
  entitas?: string;
  entitas_id?: string;
  keterangan?: string;
  data?: Record<string, unknown>;
}) {
  const { error } = await createAdminClient()
    .from('jejak_audit')
    .insert({
      organisasi_id: e.organisasi_id ?? null,
      periode_id: e.periode_id ?? null,
      aktor_id: e.aktor?.id ?? null,
      aktor_nama: e.aktor?.nama ?? 'Sistem',
      aksi: e.aksi,
      entitas: e.entitas ?? null,
      entitas_id: e.entitas_id ?? null,
      keterangan: e.keterangan ?? null,
      data: e.data ?? {},
    });
  if (error) console.error('[SIGAP] gagal mencatat jejak audit', error);
}

export async function profilPeta(ids: string[], admin: Admin = createAdminClient()) {
  const unik = [...new Set(ids.filter(Boolean))];
  if (unik.length === 0) return new Map<string, Profil>();
  const { data } = await admin.from('profil').select('*').in('id', unik);
  return new Map(((data ?? []) as Profil[]).map((p) => [p.id, p]));
}

export type Penilaian = {
  hasil: HasilSAW[];
  entri: Kontribusi[]; // seluruh entri disetujui di organisasi
  profil: Map<string, Profil>;
  belumDinilai: Profil[]; // anggota aktif tanpa entri disetujui
};

/**
 * Hitung SAW untuk seluruh kandidat organisasi. Kandidat = anggota aktif berperan
 * ANGGOTA yang punya minimal satu entri disetujui. Dijalankan dengan service_role
 * karena normalisasi butuh nilai tertinggi semua kandidat; halaman yang memanggil
 * yang menentukan bagian mana boleh ditampilkan.
 */
export async function muatPenilaian(orgId: string, bobot: Bobot): Promise<Penilaian> {
  const admin = createAdminClient();
  const [anggota, entri] = await Promise.all([
    ambilSemua<Keanggotaan>((a, b) => admin.from('keanggotaan').select('*').eq('organisasi_id', orgId).eq('aktif', true).contains('peran', ['ANGGOTA']).range(a, b)),
    ambilSemua<Kontribusi>((a, b) => admin.from('kontribusi').select('*').eq('organisasi_id', orgId).eq('status', 'DISETUJUI').order('diverifikasi_pada').range(a, b)),
  ]);
  const ids = anggota.map((a) => a.pengguna_id);
  const profil = await profilPeta([...ids, ...entri.map((e) => e.verifikator_id ?? '')], admin);

  const kandidat = ids
    .map((id) => ({
      id,
      nama: profil.get(id)?.nama ?? 'Tanpa nama',
      entri: entri
        .filter((e) => e.pengguna_id === id)
        .map((e) => ({
          kepemimpinan: e.nilai_kepemimpinan ?? 0,
          eksekusi: e.nilai_eksekusi ?? 0,
          kolaborasi: e.nilai_kolaborasi ?? 0,
          dampak: e.nilai_dampak ?? 0,
        })),
    }))
    .filter((k) => k.entri.length > 0);

  const hasil = hitungSAW(kandidat, bobot);
  const adaSkor = new Set(hasil.map((h) => h.id));
  const belumDinilai = ids
    .filter((id) => !adaSkor.has(id))
    .map((id) => profil.get(id))
    .filter((p): p is Profil => !!p);

  return { hasil, entri, profil, belumDinilai };
}

/** Jalankan mesin aturan dan simpan hasilnya di tabel penanda_pola. */
export async function sinkronPenanda(periode: PeriodeSuksesi) {
  const admin = createAdminClient();
  const { hasil, entri, profil } = await muatPenilaian(periode.organisasi_id, periode.bobot);

  const [{ data: penetapan }, { data: slot }] = await Promise.all([
    admin.from('penetapan_peran').select('*').eq('periode_id', periode.id),
    admin.from('slot_peran').select('*').eq('periode_id', periode.id),
  ]);
  const slotPeta = new Map(((slot ?? []) as SlotPeran[]).map((s) => [s.id, s.nama]));

  const temuan = periksaPola({
    kandidat: hasil.map((h) => ({ id: h.id, nama: h.nama })),
    entri: entri.map((e) => ({
      id: e.id,
      pengguna_id: e.pengguna_id,
      verifikator_id: e.verifikator_id ?? '',
      verifikator_nama: profil.get(e.verifikator_id ?? '')?.nama ?? 'Verifikator',
      diverifikasi_pada: e.diverifikasi_pada ?? e.dibuat_pada,
    })),
    tanggalBuka: periode.tanggal_buka,
    ambang: periode.ambang,
    penetapan: ((penetapan ?? []) as PenetapanPeran[]).map((p) => ({
      kandidat_id: p.kandidat_id,
      slot_nama: slotPeta.get(p.slot_id) ?? 'Peran',
      alasan_tertulis: p.alasan_tertulis,
      skor_kecocokan: Number(p.skor_kecocokan),
      kecocokan_tertinggi: p.kecocokan_tertinggi === null ? null : Number(p.kecocokan_tertinggi),
    })),
  });

  const sekarang = new Date().toISOString();
  if (temuan.length) {
    await admin.from('penanda_pola').upsert(
      temuan.map((t) => ({ periode_id: periode.id, ...t, aktif: true, diperbarui_pada: sekarang })),
      { onConflict: 'periode_id,aturan,subjek_id' }
    );
  }
  // Penanda yang tidak lagi terpicu dinonaktifkan, tidak dihapus
  const { data: lama } = await admin.from('penanda_pola').select('id, aturan, subjek_id').eq('periode_id', periode.id).eq('aktif', true);
  const masihAda = new Set(temuan.map((t) => `${t.aturan}:${t.subjek_id}`));
  const padam = (lama ?? []).filter((l: { aturan: string; subjek_id: string }) => !masihAda.has(`${l.aturan}:${l.subjek_id}`)).map((l: { id: string }) => l.id);
  if (padam.length) await admin.from('penanda_pola').update({ aktif: false, diperbarui_pada: sekarang }).in('id', padam);

  return temuan.length;
}

/** Sinkronkan penanda untuk periode yang sedang berjalan di organisasi (bila ada). */
export async function sinkronPenandaOrg(orgId: string) {
  const { data } = await createAdminClient().from('periode_suksesi').select('*').eq('organisasi_id', orgId).in('status', ['DRAF', 'DIBUKA']).maybeSingle();
  if (data) await sinkronPenanda(data as PeriodeSuksesi);
}

/** Periksa seluruh rantai segel (rantai bersifat global, lintas organisasi). */
export async function periksaIntegritas(): Promise<LaporanIntegritas> {
  const admin = createAdminClient();
  const segel = await ambilSemua<SegelHash>((a, b) => admin.from('segel_hash').select('*').order('urutan').range(a, b));
  const kontribusi = await ambilSemua<Kontribusi>((a, b) => admin.from('kontribusi').select('*').eq('status', 'DISETUJUI').range(a, b));
  // Entri yang disegel tapi statusnya sudah bukan DISETUJUI juga harus ikut diperiksa
  const ada = new Set(kontribusi.map((k) => k.id));
  const kurang = segel.map((s) => s.kontribusi_id).filter((id) => !ada.has(id));
  for (let i = 0; i < kurang.length; i += 200) {
    const { data } = await admin.from('kontribusi').select('*').in('id', kurang.slice(i, i + 200));
    kontribusi.push(...((data ?? []) as Kontribusi[]));
  }
  return telusuriRantai(segel, kontribusi);
}
