// Komponen tampilan dasar (aman untuk Server Component)
import type { ReactNode } from 'react';
import { inisial } from '@/lib/format';
import type { StatusKontribusi, StatusPeriode } from '@/lib/types';

export function Judul({ judul, deskripsi, aksi }: { judul: string; deskripsi?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
      <div className="max-w-2xl">
        <h2 className="text-[1.05rem] font-bold tracking-[-0.01em]">{judul}</h2>
        {deskripsi && <p className="text-sm text-graphite mt-1 leading-relaxed">{deskripsi}</p>}
      </div>
      {aksi}
    </div>
  );
}

export function JudulHalaman({ atas, judul, deskripsi, aksi }: { atas?: ReactNode; judul: string; deskripsi?: ReactNode; aksi?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {atas && <p className="text-sm text-graphite">{atas}</p>}
        <h1 className="text-[1.65rem] sm:text-[1.9rem] font-extrabold tracking-[-0.03em] leading-tight mt-1">{judul}</h1>
        {deskripsi && <p className="text-sm text-graphite mt-1 max-w-2xl leading-relaxed">{deskripsi}</p>}
      </div>
      {aksi}
    </header>
  );
}

export function Avatar({ nama, ukuran = 32, gelap = false }: { nama: string; ukuran?: number; gelap?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.36, background: gelap ? 'var(--navy-2)' : '#e3e8ed', color: gelap ? '#fff' : 'var(--navy)' }}
    >
      {inisial(nama)}
    </span>
  );
}

export function Meter({ nilai, maks = 1, warna }: { nilai: number; maks?: number; warna?: string }) {
  const p = Math.max(0, Math.min(100, (nilai / maks) * 100));
  return (
    <div className="meter" role="presentation">
      <span style={{ width: `${p}%`, background: warna }} />
    </div>
  );
}

type Nada = 'netral' | 'hijau' | 'amber' | 'merah' | 'navy';
const NADA: Record<Nada, { bg: string; fg: string }> = {
  netral: { bg: '#e9edf1', fg: 'var(--graphite)' },
  hijau: { bg: 'var(--seal-soft)', fg: 'var(--seal)' },
  amber: { bg: 'var(--amber-soft)', fg: 'var(--amber)' },
  merah: { bg: 'var(--telkom-soft)', fg: 'var(--telkom)' },
  navy: { bg: 'var(--navy)', fg: '#fff' },
};

export function Pil({ children, nada = 'netral' }: { children: ReactNode; nada?: Nada }) {
  const n = NADA[nada];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: n.bg, color: n.fg }}>
      {children}
    </span>
  );
}

export function PilStatus({ status }: { status: StatusKontribusi }) {
  if (status === 'DISETUJUI') return <Pil nada="hijau">Disetujui dan disegel</Pil>;
  if (status === 'DITOLAK') return <Pil nada="merah">Ditolak</Pil>;
  return <Pil nada="amber">Menunggu verifikasi</Pil>;
}

export function PilPeriode({ status }: { status: StatusPeriode }) {
  if (status === 'DIBUKA') return <Pil nada="hijau">Dibuka</Pil>;
  if (status === 'DITUTUP') return <Pil>Ditutup</Pil>;
  return <Pil nada="amber">Draf</Pil>;
}

export function Kosong({ judul, isi, aksi }: { judul: string; isi?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="inset px-5 py-8 text-center">
      <p className="text-sm font-semibold">{judul}</p>
      {isi && <p className="text-xs text-graphite mt-1 max-w-md mx-auto leading-relaxed">{isi}</p>}
      {aksi && <div className="mt-4 flex justify-center">{aksi}</div>}
    </div>
  );
}

export function Catatan({ children, nada = 'netral' }: { children: ReactNode; nada?: 'netral' | 'amber' | 'merah' | 'hijau' }) {
  const warna = {
    netral: { bg: 'var(--surface-2)', b: 'var(--line)', fg: 'var(--graphite)' },
    amber: { bg: 'var(--amber-soft)', b: '#ead7b0', fg: '#6f4a0f' },
    merah: { bg: 'var(--telkom-soft)', b: '#e7bfc1', fg: '#7e1a1e' },
    hijau: { bg: 'var(--seal-soft)', b: '#bfdccf', fg: '#1f4c3f' },
  }[nada];
  return (
    <div className="rounded-[10px] border px-4 py-3 text-sm leading-relaxed" style={{ background: warna.bg, borderColor: warna.b, color: warna.fg }}>
      {children}
    </div>
  );
}
