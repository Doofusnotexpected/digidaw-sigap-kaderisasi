// src/components/AnggotaView.tsx
'use client';

import React, { useState } from 'react';
import { Send, ExternalLink } from 'lucide-react';
import { EntriKontribusi, Pengguna } from '@/types';
import { SkorKandidatSAW } from '@/lib/sawEngine';
import { ASPEK, Avatar, Meter, SectionHead, StatusPill, pisahNama, tanggal } from './shared';

export type FormKontribusi = {
  namaKegiatan: string;
  peranKegiatan: string;
  periode: string;
  uraian: string;
  tautanBukti: string;
};

const AWAL: FormKontribusi = { namaKegiatan: '', peranKegiatan: '', periode: '', uraian: '', tautanBukti: '' };

export default function AnggotaView({
  anggota,
  entriSaya,
  skorSaya,
  onKirim,
}: {
  anggota: Pengguna;
  entriSaya: EntriKontribusi[];
  skorSaya: SkorKandidatSAW | null;
  onKirim: (f: FormKontribusi) => void;
}) {
  const [form, setForm] = useState<FormKontribusi>(AWAL);
  const [galat, setGalat] = useState<Partial<Record<keyof FormKontribusi, string>>>({});
  const [terkirim, setTerkirim] = useState<string | null>(null);

  const ubah = (k: keyof FormKontribusi) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setGalat((g) => ({ ...g, [k]: undefined }));
    setTerkirim(null);
  };

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const g: typeof galat = {};
    if (!form.namaKegiatan.trim()) g.namaKegiatan = 'Isi nama kegiatan.';
    if (!form.peranKegiatan.trim()) g.peranKegiatan = 'Isi peran Anda di kegiatan ini.';
    if (!form.periode.trim()) g.periode = 'Isi periode kegiatan.';
    if (!/^https?:\/\/\S+\.\S+/.test(form.tautanBukti.trim())) g.tautanBukti = 'Bukti wajib berupa tautan yang dimulai dengan http:// atau https://';
    setGalat(g);
    if (Object.keys(g).length) return;
    onKirim({ ...form, namaKegiatan: form.namaKegiatan.trim() });
    setTerkirim(form.namaKegiatan.trim());
    setForm(AWAL);
  };

  return (
    <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="panel p-5 content-start">
        <SectionHead title="Catat kontribusi" desc="Entri akan dinilai Kabid atau Pembina. Lampirkan bukti seperti sertifikat, SK kepanitiaan, atau dokumentasi." />
        <form onSubmit={kirim} noValidate className="grid gap-4">
          <div>
            <label className="field-label" htmlFor="f-nama">
              Nama kegiatan
            </label>
            <input id="f-nama" className="field" value={form.namaKegiatan} onChange={ubah('namaKegiatan')} placeholder="Contoh: Telkom Leadership Camp 2026" aria-invalid={!!galat.namaKegiatan} />
            {galat.namaKegiatan && <Galat t={galat.namaKegiatan} />}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="f-peran">
                Peran Anda
              </label>
              <input id="f-peran" className="field" value={form.peranKegiatan} onChange={ubah('peranKegiatan')} placeholder="Koordinator divisi acara" aria-invalid={!!galat.peranKegiatan} />
              {galat.peranKegiatan && <Galat t={galat.peranKegiatan} />}
            </div>
            <div>
              <label className="field-label" htmlFor="f-periode">
                Periode
              </label>
              <input id="f-periode" className="field" value={form.periode} onChange={ubah('periode')} placeholder="Agu – Okt 2026" aria-invalid={!!galat.periode} />
              {galat.periode && <Galat t={galat.periode} />}
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="f-uraian">
              Uraian singkat
            </label>
            <textarea id="f-uraian" rows={3} className="field" value={form.uraian} onChange={ubah('uraian')} placeholder="Apa yang Anda kerjakan dan hasilnya." />
          </div>
          <div>
            <label className="field-label" htmlFor="f-bukti">
              Tautan bukti
            </label>
            <input id="f-bukti" className="field" value={form.tautanBukti} onChange={ubah('tautanBukti')} placeholder="https://drive.google.com/…" inputMode="url" aria-invalid={!!galat.tautanBukti} />
            {galat.tautanBukti && <Galat t={galat.tautanBukti} />}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary">
              <Send className="w-4 h-4" /> Kirim untuk diverifikasi
            </button>
            {terkirim && (
              <p role="status" className="text-xs font-semibold" style={{ color: 'var(--seal)' }}>
                {terkirim} terkirim dan masuk antrean verifikasi.
              </p>
            )}
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-6 content-start">
        <section className="panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar nama={anggota.nama} size={40} tone="dark" />
            <div>
              <p className="font-bold">{pisahNama(anggota.nama).nama}</p>
              <p className="text-xs text-[color:var(--graphite)]">
                {anggota.jurusan}, angkatan {anggota.angkatan} <span className="mono">{anggota.nim}</span>
              </p>
            </div>
          </div>
          {skorSaya ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="tabular text-[2.25rem] font-extrabold tracking-[-0.03em] leading-none">{skorSaya.skorAkhirSAW.toFixed(1)}</span>
                <span className="text-sm text-[color:var(--graphite)]">skor SAW Anda</span>
              </div>
              <div className="grid gap-3 mt-5">
                {ASPEK.map((a) => (
                  <div key={a.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        {a.label} <span className="text-[color:var(--muted)]">bobot {Math.round(a.bobot * 100)}%</span>
                      </span>
                      <span className="tabular font-semibold">{skorSaya.skorMentah[a.key].toFixed(1)} / 5</span>
                    </div>
                    <Meter value={skorSaya.skorMentah[a.key]} max={5} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="inset px-4 py-4">
              <p className="text-sm font-semibold">Skor Anda muncul setelah satu entri disetujui.</p>
              <p className="text-xs text-[color:var(--graphite)] mt-1 leading-relaxed">
                Penilaian memakai empat aspek dengan bobot yang sama untuk semua kandidat:{' '}
                {ASPEK.map((a) => `${a.singkat.toLowerCase()} ${Math.round(a.bobot * 100)}%`).join(', ')}.
              </p>
            </div>
          )}
        </section>

        <section className="panel p-5">
          <SectionHead title="Rekam jejak saya" desc="Entri yang disetujui tersimpan lintas periode kepengurusan." />
          {entriSaya.length === 0 ? (
            <p className="text-sm text-[color:var(--graphite)]">Belum ada entri. Mulai dari kegiatan terakhir yang Anda ikuti.</p>
          ) : (
            <ul className="grid gap-2">
              {entriSaya.map((e) => (
                <li key={e.id} className="rounded-[10px] border px-3.5 py-3" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{e.namaKegiatan}</p>
                      <p className="text-xs text-[color:var(--graphite)] mt-0.5">
                        {e.peranKegiatan}, {e.periode ?? tanggal(e.tanggalKegiatan)}
                      </p>
                    </div>
                    <StatusPill status={e.statusVerifikasi} />
                  </div>
                  {e.catatanVerifikator && (
                    <p className="text-xs mt-2 text-[color:var(--graphite)] border-l-2 pl-2.5" style={{ borderColor: 'var(--line-strong)' }}>
                      {e.verifikatorNama}: {e.catatanVerifikator}
                    </p>
                  )}
                  <a href={e.tautanBukti} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs mt-2 text-[color:var(--graphite)] hover:text-[color:var(--ink)]">
                    Bukti <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Galat({ t }: { t: string }) {
  return (
    <p className="text-xs font-semibold mt-1.5" style={{ color: 'var(--broken)' }}>
      {t}
    </p>
  );
}
