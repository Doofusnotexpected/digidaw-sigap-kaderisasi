// src/components/VerifikatorView.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Check, X, Inbox } from 'lucide-react';
import { EntriKontribusi } from '@/types';
import { DATA_PENGGUNA } from '@/data/seedData';
import { ASPEK, AspekKey, Avatar, SectionHead, StatusPill, pisahNama, tanggal } from './shared';

type Skor = Record<AspekKey, number>;
const KOSONG: Skor = { kepemimpinan: 0, eksekusi: 0, kolaborasi: 0, dampak: 0 };

const PANDUAN: Record<AspekKey, string> = {
  kepemimpinan: 'Keberlanjutan peran dan tanggung jawab antarperiode',
  eksekusi: 'Tugas selesai sesuai target dan waktu',
  kolaborasi: 'Kerja sama dengan pengurus dan anggota lain',
  dampak: 'Hasil kegiatan bagi organisasi dan anggotanya',
};

export default function VerifikatorView({
  antrean,
  riwayat,
  verifikator,
  onSetujui,
  onTolak,
}: {
  antrean: EntriKontribusi[];
  riwayat: EntriKontribusi[];
  verifikator: { id: string; nama: string };
  onSetujui: (id: string, skor: Skor, catatan: string) => void;
  onTolak: (id: string, catatan: string) => void;
}) {
  const [aktifId, setAktifId] = useState<string | null>(antrean[0]?.id ?? null);
  const [skor, setSkor] = useState<Skor>(KOSONG);
  const [catatan, setCatatan] = useState('');
  const [galat, setGalat] = useState('');

  const aktif = antrean.find((e) => e.id === aktifId) ?? null;

  useEffect(() => {
    if (!aktif) setAktifId(antrean[0]?.id ?? null);
  }, [antrean, aktif]);

  useEffect(() => {
    setSkor(KOSONG);
    setCatatan('');
    setGalat('');
  }, [aktifId]);

  const pemilik = aktif ? DATA_PENGGUNA.find((u) => u.id === aktif.kandidatId) : null;
  const milikSendiri = aktif?.kandidatId === verifikator.id;
  const lengkap = Object.values(skor).every((v) => v > 0);

  const setujui = () => {
    if (!aktif) return;
    if (!lengkap) return setGalat('Beri nilai 1 sampai 5 pada keempat aspek sebelum menyetujui.');
    onSetujui(aktif.id, skor, catatan.trim());
  };
  const tolak = () => {
    if (!aktif) return;
    if (catatan.trim().length < 10) return setGalat('Tulis catatan penolakan agar pengaju tahu apa yang perlu diperbaiki.');
    onTolak(aktif.id, catatan.trim());
  };

  return (
    <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section className="panel p-5 content-start">
        <SectionHead title="Antrean verifikasi" desc={`${antrean.length} entri menunggu penilaian Anda.`} />
        {antrean.length === 0 ? (
          <div className="inset px-4 py-8 text-center">
            <Inbox className="w-5 h-5 mx-auto text-[color:var(--muted)]" />
            <p className="text-sm font-semibold mt-2">Antrean kosong</p>
            <p className="text-xs text-[color:var(--graphite)] mt-1">Entri baru dari anggota akan muncul di sini.</p>
          </div>
        ) : (
          <ul className="grid gap-1.5">
            {antrean.map((e) => {
              const u = DATA_PENGGUNA.find((x) => x.id === e.kandidatId);
              const on = e.id === aktifId;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setAktifId(e.id)}
                    aria-pressed={on}
                    className="w-full text-left flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors"
                    style={{ background: on ? '#f1f4f7' : 'transparent', boxShadow: on ? 'inset 3px 0 0 var(--navy)' : undefined }}
                  >
                    <Avatar nama={u?.nama ?? '?'} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{e.namaKegiatan}</span>
                      <span className="block text-xs text-[color:var(--graphite)] truncate">
                        {pisahNama(u?.nama ?? '').nama}, {e.peranKegiatan}
                      </span>
                    </span>
                    <span className="text-[0.7rem] text-[color:var(--muted)] shrink-0">{tanggal(e.tanggalKegiatan)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {riwayat.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-[color:var(--graphite)] mb-2">Sudah Anda proses</p>
            <ul className="grid gap-1.5">
              {riwayat.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-[8px]" style={{ background: 'var(--surface-2)' }}>
                  <span className="truncate">{e.namaKegiatan}</span>
                  <StatusPill status={e.statusVerifikasi} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel p-5 content-start">
        {!aktif ? (
          <p className="text-sm text-[color:var(--graphite)]">Pilih entri dari antrean untuk mulai menilai.</p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Avatar nama={pemilik?.nama ?? '?'} size={40} />
              <div className="min-w-0">
                <h2 className="text-[1.05rem] font-bold tracking-[-0.01em]">{aktif.namaKegiatan}</h2>
                <p className="text-sm text-[color:var(--graphite)] mt-0.5">
                  {pisahNama(pemilik?.nama ?? '').nama} <span className="mono text-xs">{pemilik?.nim}</span>, {aktif.peranKegiatan}
                </p>
              </div>
            </div>

            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5 text-sm">
              <div>
                <dt className="text-xs text-[color:var(--muted)]">Periode</dt>
                <dd>{aktif.periode ?? tanggal(aktif.tanggalKegiatan)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--muted)]">Bukti</dt>
                <dd>
                  <a href={aktif.tautanBukti} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 decoration-[color:var(--line-strong)] hover:decoration-[color:var(--ink)]">
                    Buka berkas bukti <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </dd>
              </div>
              {aktif.uraian && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[color:var(--muted)]">Uraian dari pengaju</dt>
                  <dd className="leading-relaxed max-w-prose">{aktif.uraian}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
              <p className="text-sm font-bold">Nilai empat aspek</p>
              <p className="text-xs text-[color:var(--graphite)] mt-0.5">1 berarti sangat kurang, 5 berarti sangat baik.</p>
              <div className="grid gap-4 mt-4">
                {ASPEK.map((a) => (
                  <fieldset key={a.key} className="grid sm:grid-cols-[1fr_auto] gap-2 sm:items-center">
                    <legend className="sr-only">{a.label}</legend>
                    <div>
                      <p className="text-sm font-semibold">{a.label}</p>
                      <p className="text-xs text-[color:var(--muted)]">{PANDUAN[a.key]}</p>
                    </div>
                    <div className="inline-flex rounded-[9px] border p-0.5 w-fit" style={{ borderColor: 'var(--line-strong)' }}>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const on = skor[a.key] === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setSkor((s) => ({ ...s, [a.key]: n }));
                              setGalat('');
                            }}
                            aria-pressed={on}
                            aria-label={`${a.label} ${n}`}
                            className="tabular w-9 h-8 text-sm font-semibold rounded-[7px] transition-colors"
                            style={{ background: on ? 'var(--navy)' : 'transparent', color: on ? '#fff' : 'var(--graphite)' }}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>

              <label className="field-label mt-5" htmlFor="catatan-verif">
                Catatan untuk pengaju
              </label>
              <textarea
                id="catatan-verif"
                rows={3}
                className="field"
                value={catatan}
                onChange={(e) => {
                  setCatatan(e.target.value);
                  setGalat('');
                }}
                placeholder="Wajib bila menolak. Contoh: SK panitia belum dilampirkan."
              />

              {galat && (
                <p role="alert" className="text-xs font-semibold mt-2" style={{ color: 'var(--broken)' }}>
                  {galat}
                </p>
              )}
              {milikSendiri && (
                <p className="text-xs font-semibold mt-2" style={{ color: 'var(--amber)' }}>
                  Ini entri milik Anda sendiri. Pengaju tidak dapat menyetujui entrinya sendiri.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                <p className="text-xs text-[color:var(--muted)] max-w-xs">
                  Menyetujui akan menyegel entri ini ke rantai. Setelah itu isinya tidak bisa diubah tanpa ketahuan.
                </p>
                <div className="flex gap-2">
                  <button className="btn btn-danger" onClick={tolak} disabled={milikSendiri}>
                    <X className="w-4 h-4" /> Tolak
                  </button>
                  <button className="btn btn-primary" onClick={setujui} disabled={milikSendiri}>
                    <Check className="w-4 h-4" /> Setujui dan segel
                  </button>
                </div>
              </div>
              <p className="text-[0.7rem] text-[color:var(--muted)] mt-3">
                Masuk sebagai {verifikator.nama}. Nama dan waktu persetujuan ikut tersegel.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
