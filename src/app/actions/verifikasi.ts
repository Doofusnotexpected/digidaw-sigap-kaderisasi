'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { catatAudit, sinkronPenandaOrg } from '@/lib/server/data';
import { berhasil, gagal, segarkanOrg, teks } from '@/lib/server/aksi';
import { GENESIS, hitungSegel } from '@/lib/segel';
import type { HasilAksi, Kontribusi } from '@/lib/types';

const nilai = z.coerce.number().int().min(1).max(5);
const skemaNilai = z.object({
  nilai_kepemimpinan: nilai,
  nilai_eksekusi: nilai,
  nilai_kolaborasi: nilai,
  nilai_dampak: nilai,
});

async function ambilEntri(id: string, orgId: string) {
  const { data } = await createAdminClient().from('kontribusi').select('*').eq('id', id).eq('organisasi_id', orgId).maybeSingle();
  return data as Kontribusi | null;
}

/**
 * Setujui entri dan segel ke rantai.
 * 1. Cek peran verifikator dan larangan menyetujui entri sendiri.
 * 2. Hitung segel SHA-256 dari isi entri final + segel terakhir.
 * 3. Simpan persetujuan dan segel dalam satu transaksi (RPC setujui_dan_segel).
 */
export async function setujuiKontribusi(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!ctx.akses.verifikasi) return gagal('Hanya verifikator organisasi ini yang dapat menyetujui entri.');

  const parsed = skemaNilai.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return gagal('Beri nilai 1 sampai 5 pada keempat aspek.');
  const n = parsed.data;
  const catatan = teks(fd, 'catatan').slice(0, 1000) || null;

  const entri = await ambilEntri(teks(fd, 'id'), ctx.org.id);
  if (!entri) return gagal('Entri tidak ditemukan.');
  if (entri.status !== 'MENUNGGU') return gagal('Entri ini sudah diproses verifikator lain.');
  if (entri.pengguna_id === ctx.profil.id) return gagal('Pengaju tidak dapat menyetujui entrinya sendiri.');

  const admin = createAdminClient();
  const waktu = new Date().toISOString();
  const final: Kontribusi = {
    ...entri,
    status: 'DISETUJUI',
    ...n,
    catatan_verifikator: catatan,
    verifikator_id: ctx.profil.id,
    diverifikasi_pada: waktu,
  };

  let urutan: number | null = null;
  for (let percobaan = 0; percobaan < 5 && urutan === null; percobaan++) {
    const { data: terakhir } = await admin.from('segel_hash').select('hash_entri').order('urutan', { ascending: false }).limit(1).maybeSingle();
    const sebelumnya = (terakhir as { hash_entri: string } | null)?.hash_entri ?? GENESIS;
    const hash = hitungSegel(sebelumnya, final);

    const { data, error } = await admin.rpc('setujui_dan_segel', {
      p_kontribusi_id: entri.id,
      p_verifikator_id: ctx.profil.id,
      p_waktu: waktu,
      p_kepemimpinan: n.nilai_kepemimpinan,
      p_eksekusi: n.nilai_eksekusi,
      p_kolaborasi: n.nilai_kolaborasi,
      p_dampak: n.nilai_dampak,
      p_catatan: catatan,
      p_hash_sebelumnya: sebelumnya,
      p_hash_entri: hash,
    });
    if (!error) {
      urutan = Number(data);
      break;
    }
    if (error.message.includes('SUDAH_DIPROSES')) return gagal('Entri ini sudah diproses verifikator lain.');
    if (!error.message.includes('RANTAI_BERGESER')) {
      console.error('[SIGAP] gagal menyegel', error);
      return gagal('Persetujuan gagal disimpan. Coba lagi.');
    }
    // Ada segel baru dari verifikator lain di saat yang sama: hitung ulang
  }
  if (urutan === null) return gagal('Rantai sedang sibuk. Coba lagi beberapa detik lagi.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: ctx.periode?.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Entri disetujui dan disegel',
    entitas: 'kontribusi',
    entitas_id: entri.id,
    keterangan: `${entri.kegiatan}. Nilai ${n.nilai_kepemimpinan}/${n.nilai_eksekusi}/${n.nilai_kolaborasi}/${n.nilai_dampak}. Segel nomor ${urutan}.`,
    data: { pengaju_id: entri.pengguna_id, urutan_segel: urutan, catatan },
  });
  await sinkronPenandaOrg(ctx.org.id);
  segarkanOrg(slug);
  return berhasil(`Disetujui dan disegel sebagai segel nomor ${urutan}.`);
}

export async function tolakKontribusi(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  if (!ctx.akses.verifikasi) return gagal('Hanya verifikator organisasi ini yang dapat menolak entri.');

  const catatan = teks(fd, 'catatan');
  if (catatan.length < 10) return gagal('Tulis catatan penolakan minimal 10 karakter agar pengaju tahu apa yang perlu diperbaiki.', { catatan: 'Minimal 10 karakter.' });

  const entri = await ambilEntri(teks(fd, 'id'), ctx.org.id);
  if (!entri || entri.status !== 'MENUNGGU') return gagal('Entri ini sudah diproses.');
  if (entri.pengguna_id === ctx.profil.id) return gagal('Pengaju tidak dapat memproses entrinya sendiri.');

  const { data } = await createAdminClient()
    .from('kontribusi')
    .update({ status: 'DITOLAK', catatan_verifikator: catatan.slice(0, 1000), verifikator_id: ctx.profil.id, diverifikasi_pada: new Date().toISOString() })
    .eq('id', entri.id)
    .eq('status', 'MENUNGGU')
    .select()
    .maybeSingle();
  if (!data) return gagal('Entri ini sudah diproses.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: ctx.periode?.id,
    aktor: { id: ctx.profil.id, nama: ctx.profil.nama },
    aksi: 'Entri ditolak',
    entitas: 'kontribusi',
    entitas_id: entri.id,
    keterangan: `${entri.kegiatan}. Catatan: ${catatan}`,
    data: { pengaju_id: entri.pengguna_id },
  });
  segarkanOrg(slug);
  return berhasil('Entri ditolak. Catatan Anda terkirim ke pengaju.');
}
