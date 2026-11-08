import 'server-only';
import { createAdminClient } from '../supabase/admin';
import { periksaIntegritas, profilPeta } from './data';
import { waktu } from '../format';
import type { SegelTampil } from '@/components/RantaiSegel';
import type { Kontribusi } from '../types';

/** Laporan integritas + data tampilan strip rantai untuk satu organisasi */
export async function muatRantai(orgId: string) {
  const laporan = await periksaIntegritas();
  const admin = createAdminClient();
  const milikOrg = laporan.hasil.filter((h) => h.organisasi_id === orgId).map((h) => h.kontribusi_id);
  const entri: Kontribusi[] = [];
  for (let i = 0; i < milikOrg.length; i += 200) {
    const { data } = await admin.from('kontribusi').select('*').in('id', milikOrg.slice(i, i + 200));
    entri.push(...((data ?? []) as Kontribusi[]));
  }
  const peta = new Map(entri.map((e) => [e.id, e]));
  const profil = await profilPeta(entri.flatMap((e) => [e.pengguna_id, e.verifikator_id ?? '']), admin);

  const segel: SegelTampil[] = laporan.hasil.map((h) => {
    const e = peta.get(h.kontribusi_id);
    return {
      urutan: h.urutan,
      status: h.status,
      hash_sebelumnya: h.hash_sebelumnya,
      hash_entri: h.hash_entri,
      hash_hitung_ulang: h.hash_hitung_ulang,
      milikOrgIni: !!e,
      pemilikId: e?.pengguna_id ?? null,
      label: e ? profil.get(e.pengguna_id)?.nama.split(' ')[0] ?? null : null,
      kegiatan: e?.kegiatan ?? null,
      disetujui: e ? `disetujui ${profil.get(e.verifikator_id ?? '')?.nama ?? ''} pada ${waktu(e.diverifikasi_pada)}` : null,
    };
  });
  return { laporan, segel };
}
