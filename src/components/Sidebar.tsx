// src/components/Sidebar.tsx
'use client';

import React from 'react';
import { PenLine, ClipboardCheck, Users, Eye } from 'lucide-react';
import { OrmawaId, PeranDemo } from '@/types';
import { INFO_ORMAWA } from '@/data/demoContext';

const PERAN: { key: PeranDemo; nama: string; desc: string; Icon: React.ElementType }[] = [
  { key: 'ANGGOTA', nama: 'Anggota', desc: 'Catat kontribusi, lihat skor sendiri', Icon: PenLine },
  { key: 'VERIFIKATOR', nama: 'Verifikator', desc: 'Kabid atau Pembina menilai entri', Icon: ClipboardCheck },
  { key: 'PANITIA', nama: 'Panitia suksesi', desc: 'Bandingkan kandidat, tetapkan peran', Icon: Users },
  { key: 'AUDITOR', nama: 'Auditor', desc: 'Baca jejak audit, hanya lihat', Icon: Eye },
];

export default function Sidebar({
  peran,
  onPeran,
  ormawa,
  onOrmawa,
  identitas,
  badge,
}: {
  peran: PeranDemo;
  onPeran: (p: PeranDemo) => void;
  ormawa: OrmawaId;
  onOrmawa: (o: OrmawaId) => void;
  identitas: string;
  badge: Partial<Record<PeranDemo, number>>;
}) {
  return (
    <aside
      className="on-navy lg:sticky lg:top-0 lg:h-screen lg:w-[272px] shrink-0 flex flex-col text-white"
      style={{ background: 'var(--navy)' }}
    >
      {/* Wordmark */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <span className="relative w-9 h-9 rounded-[9px] flex items-center justify-center" style={{ background: 'var(--telkom)' }}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
            <rect x="3" y="3" width="6" height="6" rx="1.5" fill="#fff" />
            <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#fff" />
            <path d="M9 6h2.5a2.5 2.5 0 0 1 2.5 2.5V11" stroke="#fff" strokeWidth="1.6" fill="none" />
          </svg>
        </span>
        <div className="leading-tight">
          <div className="font-extrabold text-[1.05rem] tracking-[-0.02em]">SIGAP Kaderisasi</div>
          <div className="text-xs" style={{ color: 'var(--navy-text)' }}>
            Telkom University
          </div>
        </div>
      </div>

      {/* Ormawa */}
      <div className="px-3 pb-4">
        <p className="px-2 pb-2 text-xs" style={{ color: 'var(--navy-text)' }}>
          Organisasi
        </p>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-[10px]" style={{ background: 'var(--navy-2)' }}>
          {(Object.keys(INFO_ORMAWA) as OrmawaId[]).map((id) => {
            const aktif = id === ormawa;
            return (
              <button
                key={id}
                onClick={() => onOrmawa(id)}
                aria-pressed={aktif}
                className="text-[0.8rem] font-semibold py-2 rounded-[7px] transition-colors"
                style={{
                  background: aktif ? '#fff' : 'transparent',
                  color: aktif ? 'var(--navy)' : 'var(--navy-text)',
                }}
              >
                {INFO_ORMAWA[id].singkat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Peran */}
      <nav className="px-3 flex-1" aria-label="Peran demo">
        <p className="px-2 pb-2 text-xs" style={{ color: 'var(--navy-text)' }}>
          Masuk sebagai
        </p>
        <ul className="grid grid-cols-2 lg:grid-cols-1 gap-1">
          {PERAN.map(({ key, nama, desc, Icon }) => {
            const aktif = key === peran;
            return (
              <li key={key}>
                <button
                  onClick={() => onPeran(key)}
                  aria-current={aktif ? 'page' : undefined}
                  className="relative w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-[9px] transition-colors"
                  style={{ background: aktif ? 'var(--navy-2)' : 'transparent' }}
                >
                  {aktif && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full" style={{ background: 'var(--telkom)' }} />
                  )}
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: aktif ? '#fff' : 'var(--navy-text)' }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" style={{ color: aktif ? '#fff' : '#dfe6ee' }}>
                        {nama}
                      </span>
                      {!!badge[key] && (
                        <span
                          className="tabular text-[0.7rem] font-bold rounded-full px-1.5 min-w-[20px] text-center leading-[18px]"
                          style={{ background: aktif ? '#fff' : 'var(--navy-line)', color: aktif ? 'var(--navy)' : '#fff' }}
                        >
                          {badge[key]}
                        </span>
                      )}
                    </span>
                    <span className="hidden lg:block text-xs mt-0.5" style={{ color: 'var(--navy-text)' }}>
                      {desc}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden lg:block px-5 py-4 border-t text-xs leading-relaxed" style={{ borderColor: 'var(--navy-line)', color: 'var(--navy-text)' }}>
        <div className="text-white font-semibold text-[0.8rem]">{identitas}</div>
        Data contoh, seluruhnya fiktif. Sistem ini alat bantu; keputusan akhir tetap pada panitia.
      </div>
    </aside>
  );
}
