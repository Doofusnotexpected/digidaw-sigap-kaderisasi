// src/components/JustifikasiModal.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const MIN_ALASAN = 20;
export const ALASAN_SINGKAT = 60;

export default function JustifikasiModal({
  namaPeran,
  pilihan,
  pembanding,
  onBatal,
  onSimpan,
}: {
  namaPeran: string;
  pilihan: { nama: string; skor: number };
  pembanding: { nama: string; skor: number };
  onBatal: () => void;
  onSimpan: (alasan: string) => void;
}) {
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onBatal();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onBatal]);

  const panjang = alasan.trim().length;
  const simpan = () => {
    if (panjang < MIN_ALASAN) {
      setGalat(`Tulis alasan minimal ${MIN_ALASAN} karakter. Alasan ini disimpan di jejak audit.`);
      return;
    }
    onSimpan(alasan.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(23,32,43,0.45)' }} onClick={onBatal}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-alasan"
        className="w-full max-w-lg rounded-[16px] p-6"
        style={{ background: 'var(--surface)', boxShadow: '0 24px 60px -20px rgba(23,32,43,0.45)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--amber-soft)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--amber)' }} />
          </span>
          <div>
            <h3 id="judul-alasan" className="font-bold text-[1.05rem] tracking-[-0.01em]">
              Tulis alasan penetapan
            </h3>
            <p className="text-sm text-[color:var(--graphite)] mt-1 leading-relaxed">
              {pilihan.nama} ({pilihan.skor.toFixed(1)}) dipilih sebagai {namaPeran}, padahal {pembanding.nama} punya kecocokan lebih tinggi ({pembanding.skor.toFixed(1)}).
              Pilihan ini boleh, asalkan alasannya tercatat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          {[pilihan, pembanding].map((p, i) => (
            <div key={p.nama} className="inset px-3 py-2.5">
              <p className="text-xs text-[color:var(--graphite)]">{i === 0 ? 'Pilihan panitia' : 'Kecocokan tertinggi'}</p>
              <p className="text-sm font-semibold truncate">{p.nama}</p>
              <p className="tabular text-lg font-extrabold">{p.skor.toFixed(1)}</p>
            </div>
          ))}
        </div>

        <label htmlFor="alasan" className="field-label mt-5">
          Alasan
        </label>
        <textarea
          id="alasan"
          ref={ref}
          rows={4}
          className="field"
          value={alasan}
          onChange={(e) => {
            setAlasan(e.target.value);
            setGalat('');
          }}
          placeholder="Contoh: Nadia lebih dibutuhkan di kebendaharaan; Raka memimpin PKKMB 2026 dengan tim 120 orang dan konsisten dua periode."
        />
        <div className="flex justify-between gap-3 mt-1.5 text-xs">
          <span style={{ color: galat ? 'var(--broken)' : 'var(--muted)' }} className={galat ? 'font-semibold' : ''}>
            {galat || (panjang > 0 && panjang < ALASAN_SINGKAT ? 'Alasan di bawah 60 karakter akan masuk penanda pola untuk ditinjau.' : 'Tersimpan permanen di jejak audit.')}
          </span>
          <span className="tabular text-[color:var(--muted)] shrink-0">{panjang} karakter</span>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onBatal}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={simpan}>
            Simpan penetapan
          </button>
        </div>
      </div>
    </div>
  );
}
