// Memuat pengguna, organisasi, peran, dan hak akses untuk setiap halaman.
import 'server-only';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import type { Keanggotaan, Organisasi, PeranOrg, PeriodeSuksesi, Profil } from '../types';

export const pengguna = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  let { data: profil } = await admin.from('profil').select('*').eq('id', user.id).maybeSingle();
  if (!profil) {
    // Akun dibuat di luar alur aplikasi (misal lewat dashboard): buat profil minimal
    const nama = String(user.user_metadata?.nama ?? user.email?.split('@')[0] ?? 'Pengguna baru').slice(0, 120).padEnd(2, '.');
    ({ data: profil } = await admin.from('profil').upsert({ id: user.id, nama, email: user.email ?? '' }).select().single());
  }
  if (!profil) return null;
  return { user, profil: profil as Profil };
});

export async function penggunaWajib() {
  const p = await pengguna();
  if (!p) redirect('/masuk');
  return p;
}

export type OrgSaya = Organisasi & { peran: PeranOrg[]; aktif: boolean; jabatan: string | null };

/** Organisasi milik pengguna (termasuk yang menunggu persetujuan). Pembaca global melihat semua. */
export const organisasiSaya = cache(async (): Promise<OrgSaya[]> => {
  const p = await pengguna();
  if (!p) return [];
  const admin = createAdminClient();
  const { data: angg } = await admin.from('keanggotaan').select('*').eq('pengguna_id', p.profil.id);
  const keanggotaan = (angg ?? []) as Keanggotaan[];
  const global = p.profil.peran_global !== 'MAHASISWA';

  let q = admin.from('organisasi').select('*').order('nama');
  if (!global) q = q.in('id', keanggotaan.map((k) => k.organisasi_id).concat('00000000-0000-0000-0000-000000000000'));
  const { data: orgs } = await q;

  return ((orgs ?? []) as Organisasi[]).map((o) => {
    const k = keanggotaan.find((x) => x.organisasi_id === o.id);
    return { ...o, peran: k?.peran ?? [], aktif: k?.aktif ?? false, jabatan: k?.jabatan ?? null };
  });
});

export type Akses = {
  anggota: boolean; // keanggotaan aktif atau pembaca global
  kontribusi: boolean;
  verifikasi: boolean;
  lihatKandidat: boolean;
  tetapkan: boolean;
  lihatPenetapan: boolean;
  lihatPenanda: boolean;
  tinjauPenanda: boolean;
  lihatAudit: boolean;
  kelola: boolean;
  bacaSaja: boolean; // auditor tanpa peran lain
};

export function hitungAkses(peran: Set<PeranOrg>, peranGlobal: Profil['peran_global'], aktif: boolean, periode: PeriodeSuksesi | null): Akses {
  const superadmin = peranGlobal === 'SUPERADMIN';
  const globalBaca = peranGlobal === 'AUDITOR_KAMPUS' || superadmin;
  const punya = (...p: PeranOrg[]) => aktif && p.some((x) => peran.has(x));
  const anggota = aktif || globalBaca;
  return {
    anggota,
    kontribusi: punya('ANGGOTA'),
    verifikasi: punya('VERIFIKATOR'),
    lihatKandidat: punya('PANITIA', 'AUDITOR', 'ADMIN') || globalBaca,
    tetapkan: punya('PANITIA') && periode?.status === 'DIBUKA',
    lihatPenetapan: punya('PANITIA', 'AUDITOR', 'ADMIN', 'VERIFIKATOR') || globalBaca || (anggota && periode?.status === 'DITUTUP'),
    lihatPenanda: punya('PANITIA', 'AUDITOR', 'ADMIN') || globalBaca,
    tinjauPenanda: punya('PANITIA', 'ADMIN') || superadmin,
    lihatAudit: punya('PANITIA', 'AUDITOR', 'ADMIN') || globalBaca,
    kelola: punya('ADMIN') || superadmin,
    bacaSaja: !punya('ANGGOTA', 'VERIFIKATOR', 'PANITIA', 'ADMIN') && !superadmin,
  };
}

/** Periode yang sedang berjalan (draf/dibuka), atau periode terakhir yang ditutup. */
export async function periodeOrg(orgId: string): Promise<PeriodeSuksesi | null> {
  const admin = createAdminClient();
  const { data: aktif } = await admin
    .from('periode_suksesi')
    .select('*')
    .eq('organisasi_id', orgId)
    .in('status', ['DRAF', 'DIBUKA'])
    .maybeSingle();
  if (aktif) return aktif as PeriodeSuksesi;
  const { data: terakhir } = await admin
    .from('periode_suksesi')
    .select('*')
    .eq('organisasi_id', orgId)
    .order('ditutup_pada', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (terakhir as PeriodeSuksesi) ?? null;
}

export const konteksOrg = cache(async (slug: string) => {
  const p = await penggunaWajib();
  const admin = createAdminClient();
  const { data: org } = await admin.from('organisasi').select('*').eq('slug', slug).maybeSingle();
  if (!org) notFound();

  const { data: k } = await admin
    .from('keanggotaan')
    .select('*')
    .eq('organisasi_id', org.id)
    .eq('pengguna_id', p.profil.id)
    .maybeSingle();
  const keanggotaan = (k as Keanggotaan) ?? null;
  const peran = new Set<PeranOrg>(keanggotaan?.aktif ? keanggotaan.peran : []);
  const periode = await periodeOrg(org.id);
  const akses = hitungAkses(peran, p.profil.peran_global, !!keanggotaan?.aktif, periode);

  return { ...p, org: org as Organisasi, keanggotaan, peran, periode, akses };
});

/** Pakai di halaman: hentikan bila tidak berhak. */
export function wajib(syarat: boolean) {
  if (!syarat) redirect('/tidak-berwenang');
}
