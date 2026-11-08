// src/components/shared.tsx
import React from 'react';
import { BOBOT_SAW } from '@/lib/sawEngine';

export const ASPEK = [
  { key: 'kepemimpinan', label: 'Konsistensi kepemimpinan', singkat: 'Konsistensi', bobot: BOBOT_SAW.kepemimpinan },
  { key: 'eksekusi', label: 'Keandalan eksekusi', singkat: 'Keandalan', bobot: BOBOT_SAW.eksekusi },
  { key: 'kolaborasi', label: 'Kolaborasi', singkat: 'Kolaborasi', bobot: BOBOT_SAW.kolaborasi },
  { key: 'dampak', label: 'Dampak organisasi', singkat: 'Dampak', bobot: BOBOT_SAW.dampak },
] as const;

export type AspekKey = (typeof ASPEK)[number]['key'];

/** "Raka Pratama Wijaya (Kandidat A)" -> { nama: "Raka Pratama Wijaya", label: "Kandidat A" } */
export function pisahNama(namaLengkap: string): { nama: string; label: string | null } {
  const m = namaLengkap.match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { nama: m[1], label: m[2] } : { nama: namaLengkap, label: null };
}

export function inisial(nama: string): string {
  return pisahNama(nama)
    .nama.split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

const fmtTanggal = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
const fmtWaktu = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

export const tanggal = (iso: string) => (iso ? fmtTanggal.format(new Date(iso)) : '');
export const waktu = (iso: string) => (iso ? fmtWaktu.format(new Date(iso)).replace('.', ':') : '');
export const potongHash = (h: string, n = 6) => (h ? `${h.slice(0, n)}…${h.slice(-4)}` : '');

export function Avatar({ nama, size = 32, tone = 'light' }: { nama: string; size?: number; tone?: 'light' | 'dark' }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: tone === 'dark' ? 'var(--navy-2)' : '#e3e8ed',
        color: tone === 'dark' ? '#fff' : 'var(--navy)',
      }}
    >
      {inisial(nama)}
    </span>
  );
}

export function Meter({ value, max = 1, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="meter" role="presentation">
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function SectionHead({
  title,
  desc,
  aside,
}: {
  title: string;
  desc?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
      <div className="max-w-2xl">
        <h2 className="text-[1.05rem] font-bold tracking-[-0.01em]">{title}</h2>
        {desc && <p className="text-sm text-[color:var(--graphite)] mt-1 leading-relaxed">{desc}</p>}
      </div>
      {aside}
    </div>
  );
}

export function StatusPill({ status }: { status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' }) {
  const map = {
    MENUNGGU: { t: 'Menunggu verifikasi', bg: 'var(--amber-soft)', fg: 'var(--amber)' },
    DISETUJUI: { t: 'Disetujui dan disegel', bg: 'var(--seal-soft)', fg: 'var(--seal)' },
    DITOLAK: { t: 'Ditolak', bg: 'var(--telkom-soft)', fg: 'var(--broken)' },
  }[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ background: map.bg, color: map.fg }}
    >
      {map.t}
    </span>
  );
}
