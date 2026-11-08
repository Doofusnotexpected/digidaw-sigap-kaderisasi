// Menu organisasi menurut peran. Dipakai di sidebar (browser) dan untuk konsistensi dengan hak akses server.
import type { PeranGlobal, PeranOrg } from './types';

export type ItemMenu = { href: string; label: string; ikon: string };

export function menuOrg(slug: string, peran: PeranOrg[], peranGlobal: PeranGlobal): ItemMenu[] {
  const g = peranGlobal !== 'MAHASISWA';
  const punya = (...p: PeranOrg[]) => p.some((x) => peran.includes(x));
  const base = `/o/${slug}`;
  const m: ItemMenu[] = [{ href: base, label: 'Ringkasan', ikon: 'ringkasan' }];
  if (punya('ANGGOTA')) m.push({ href: `${base}/kontribusi`, label: 'Kontribusi saya', ikon: 'kontribusi' });
  if (punya('VERIFIKATOR')) m.push({ href: `${base}/verifikasi`, label: 'Verifikasi', ikon: 'verifikasi' });
  if (punya('PANITIA', 'AUDITOR', 'ADMIN') || g) m.push({ href: `${base}/kandidat`, label: 'Kandidat dan skor', ikon: 'kandidat' });
  m.push({ href: `${base}/penetapan`, label: punya('PANITIA') ? 'Pencocokan peran' : 'Hasil suksesi', ikon: 'penetapan' });
  if (punya('PANITIA', 'AUDITOR', 'ADMIN') || g) {
    m.push({ href: `${base}/penanda`, label: 'Penanda pola', ikon: 'penanda' });
    m.push({ href: `${base}/audit`, label: 'Jejak audit', ikon: 'audit' });
  }
  if (punya('ADMIN') || peranGlobal === 'SUPERADMIN') m.push({ href: `${base}/kelola`, label: 'Kelola organisasi', ikon: 'kelola' });
  return m;
}

export const NAMA_PERAN: Record<PeranOrg, string> = {
  ANGGOTA: 'Anggota',
  VERIFIKATOR: 'Verifikator',
  PANITIA: 'Panitia suksesi',
  AUDITOR: 'Auditor',
  ADMIN: 'Admin',
};

export const NAMA_PERAN_GLOBAL: Record<PeranGlobal, string> = {
  MAHASISWA: 'Mahasiswa',
  AUDITOR_KAMPUS: 'Auditor kampus',
  SUPERADMIN: 'Superadmin',
};
