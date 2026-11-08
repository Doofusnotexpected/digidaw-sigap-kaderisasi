// src/components/PenandaPola.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export type Penanda = {
  id: string;
  aturan: 'Lonjakan persetujuan' | 'Verifikator dominan' | 'Alasan terlalu singkat';
  subjek: string;
  rincian: string;
  batas: string;
};

export default function PenandaPola({ daftar, ringkas = false }: { daftar: Penanda[]; ringkas?: boolean }) {
  return (
    <div className="rounded-[12px] border" style={{ borderColor: '#ead7b0', background: 'var(--amber-soft)' }}>
      <div className="flex items-center gap-2 px-4 pt-3.5">
        <AlertTriangle className="w-4 h-4" style={{ color: 'var(--amber)' }} />
        <p className="text-sm font-bold" style={{ color: '#6f4a0f' }}>
          Penanda pola {daftar.length > 0 && <span className="tabular">({daftar.length})</span>}
        </p>
      </div>
      <p className="px-4 pt-1 text-xs leading-relaxed" style={{ color: '#7d5a1d' }}>
        Dicek dengan aturan sederhana, tanpa AI. Peringatan ini bahan tinjauan, bukan bukti pelanggaran.
      </p>
      {daftar.length === 0 ? (
        <p className="px-4 py-3 text-sm" style={{ color: '#6f4a0f' }}>
          Tidak ada aturan yang terpicu untuk organisasi ini.
        </p>
      ) : (
        <ul className="px-2 pb-2 pt-2 grid gap-1">
          {daftar.map((p) => (
            <li key={p.id} className="rounded-[9px] px-2.5 py-2.5" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <p className="text-[0.8rem] font-bold" style={{ color: '#5e3f0c' }}>
                {p.aturan}: {p.subjek}
              </p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6f4a0f' }}>
                {p.rincian}
              </p>
              {!ringkas && (
                <p className="text-[0.7rem] mt-1" style={{ color: '#9a7a3f' }}>
                  Aturan: {p.batas}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
