// src/components/PanitiaView.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, Lock, UserPlus, X } from 'lucide-react';
import { CabinetRoleKey, EntriKontribusi, PeranKabinet, Pengguna } from '@/types';
import { SkorKandidatSAW } from '@/lib/sawEngine';
import { BOBOT_PERAN, skorKecocokan } from '@/lib/roleFit';
import { DATA_PENGGUNA } from '@/data/seedData';
import PenandaPola, { Penanda } from './PenandaPola';
import { ASPEK, Avatar, Meter, SectionHead, pisahNama } from './shared';

export default function PanitiaView({
  hasilSAW,
  belumDinilai,
  entriList,
  slotPeran,
  penanda,
  kandidatDiubah,
  dipilih,
  onPilih,
  onTetapkan,
  onKosongkan,
}: {
  hasilSAW: SkorKandidatSAW[];
  belumDinilai: Pengguna[];
  entriList: EntriKontribusi[];
  slotPeran: PeranKabinet[];
  penanda: Penanda[];
  kandidatDiubah: string[];
  dipilih: string | null;
  onPilih: (id: string | null) => void;
  onTetapkan: (kode: CabinetRoleKey) => void;
  onKosongkan: (kode: CabinetRoleKey) => void;
}) {
  const [rincianTerbuka, setRincianTerbuka] = useState(false);
  const kandidatDipilih = hasilSAW.find((h) => h.kandidatId === dipilih) ?? null;
  const flagged = new Set(penanda.map((p) => p.subjek));

  const jumlahEntri = (id: string) => entriList.filter((e) => e.kandidatId === id && e.statusVerifikasi === 'DISETUJUI').length;
  const selisihTipis = hasilSAW.length > 1 && hasilSAW[0].skorAkhirSAW - hasilSAW[1].skorAkhirSAW < 3;

  return (
    <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* ---------------- Kandidat ---------------- */}
      <section className="panel p-5">
        <SectionHead
          title="Kandidat"
          desc="Diurutkan dari skor SAW atas entri yang sudah diverifikasi. Pilih satu kandidat, lalu tetapkan ke slot peran di sebelah."
        />

        <ul className="grid gap-2">
          {hasilSAW.map((k) => {
            const { nama, label } = pisahNama(k.namaKandidat);
            const user = DATA_PENGGUNA.find((u) => u.id === k.kandidatId);
            const aktif = dipilih === k.kandidatId;
            const slot = slotPeran.find((s) => s.kandidatTerpilihId === k.kandidatId);
            return (
              <li key={k.kandidatId}>
                <button
                  onClick={() => onPilih(aktif ? null : k.kandidatId)}
                  aria-pressed={aktif}
                  className="w-full text-left rounded-[12px] border px-4 py-3.5 transition-colors"
                  style={{
                    borderColor: aktif ? 'var(--navy)' : 'var(--line)',
                    background: aktif ? '#f3f6f9' : 'var(--surface)',
                    boxShadow: aktif ? 'inset 0 0 0 1px var(--navy)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="tabular text-sm font-bold w-6 text-center shrink-0"
                      style={{ color: k.peringkat === 1 ? 'var(--telkom)' : 'var(--muted)' }}
                    >
                      {k.peringkat}
                    </span>
                    <Avatar nama={k.namaKandidat} size={36} tone={aktif ? 'dark' : 'light'} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.95rem] font-semibold truncate">
                        {nama}
                        {label && <span className="ml-2 text-xs font-medium text-[color:var(--muted)]">{label}</span>}
                      </p>
                      <p className="text-xs text-[color:var(--graphite)] truncate">
                        {user?.jurusan}, angkatan {user?.angkatan}. {jumlahEntri(k.kandidatId)} entri terverifikasi
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="tabular text-[1.35rem] font-extrabold leading-none tracking-[-0.02em]">{k.skorAkhirSAW.toFixed(1)}</p>
                      <p className="text-[0.7rem] text-[color:var(--muted)] mt-1">skor SAW</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-3 pl-9">
                    {ASPEK.map((a) => (
                      <div key={a.key}>
                        <div className="flex justify-between text-[0.7rem] text-[color:var(--graphite)] mb-1">
                          <span>{a.singkat}</span>
                          <span className="tabular font-semibold text-[color:var(--ink)]">{k.skorMentah[a.key].toFixed(1)}</span>
                        </div>
                        <Meter value={k.skorMentah[a.key]} max={5} />
                      </div>
                    ))}
                  </div>

                  {(flagged.has(nama) || slot || kandidatDiubah.includes(k.kandidatId)) && (
                    <div className="flex flex-wrap gap-2 mt-3 pl-9">
                      {kandidatDiubah.includes(k.kandidatId) && (
                        <span className="inline-flex text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'var(--telkom-soft)', color: 'var(--broken)' }}>
                          Nilai berubah setelah disegel, skor tidak bisa dipercaya
                        </span>
                      )}
                      {flagged.has(nama) && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
                          <AlertTriangle className="w-3 h-3" /> Perlu ditinjau
                        </span>
                      )}
                      {slot && (
                        <span className="inline-flex text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'var(--seal-soft)', color: 'var(--seal)' }}>
                          {slot.namaPeran}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {selisihTipis && (
          <p className="text-xs leading-relaxed mt-3 px-1 text-[color:var(--graphite)]">
            Selisih dua teratas kurang dari 3 poin. Bahas lewat rincian aspek dan buktinya, jangan diputuskan oleh angka saja.
          </p>
        )}

        {belumDinilai.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-[color:var(--graphite)] mb-2">Belum bisa dinilai, belum ada entri yang disetujui</p>
            <div className="flex flex-wrap gap-2">
              {belumDinilai.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-2 text-xs rounded-full pl-1 pr-3 py-1 border" style={{ borderColor: 'var(--line)' }}>
                  <Avatar nama={u.nama} size={22} />
                  {pisahNama(u.nama).nama}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rincian perhitungan */}
        <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <button className="btn btn-ghost !px-1" onClick={() => setRincianTerbuka((v) => !v)} aria-expanded={rincianTerbuka}>
            <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: rincianTerbuka ? 'rotate(180deg)' : undefined }} />
            Rincian perhitungan SAW
          </button>
          {rincianTerbuka && (
            <div className="mt-3">
              <p className="text-xs text-[color:var(--graphite)] leading-relaxed mb-3">
                Nilai tiap aspek dirata-ratakan dari entri terverifikasi, dinormalkan menjadi r, lalu dijumlahkan dengan bobot:
                <span className="mono ml-1">V = Σ (w × r) × 100</span>
              </p>
              <div className="overflow-x-auto scroll-x">
                <table className="w-full text-xs tabular">
                  <thead>
                    <tr className="text-left text-[color:var(--graphite)]">
                      <th className="font-semibold py-2 pr-3">Kandidat</th>
                      {ASPEK.map((a) => (
                        <th key={a.key} className="font-semibold py-2 px-2 text-right whitespace-nowrap">
                          {a.singkat} <span className="font-normal text-[color:var(--muted)]">{Math.round(a.bobot * 100)}%</span>
                        </th>
                      ))}
                      <th className="font-semibold py-2 pl-2 text-right">V</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasilSAW.map((k) => (
                      <tr key={k.kandidatId} className="border-t" style={{ borderColor: 'var(--line)' }}>
                        <td className="py-2 pr-3 whitespace-nowrap font-medium">{pisahNama(k.namaKandidat).nama}</td>
                        {ASPEK.map((a) => (
                          <td key={a.key} className="py-2 px-2 text-right whitespace-nowrap">
                            {k.skorMentah[a.key].toFixed(2)}
                            <span className="text-[color:var(--muted)]"> / {k.skorNormalisasi[a.key].toFixed(3)}</span>
                          </td>
                        ))}
                        <td className="py-2 pl-2 text-right font-bold">{k.skorAkhirSAW.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[0.7rem] text-[color:var(--muted)] mt-2">Format sel: rata-rata nilai / nilai ternormalisasi.</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Slot peran ---------------- */}
      <div className="grid grid-cols-1 gap-6 content-start">
        <section className="panel p-5">
          <SectionHead
            title="Slot peran"
            desc={
              kandidatDipilih ? (
                <>
                  Kecocokan <b className="text-[color:var(--ink)]">{pisahNama(kandidatDipilih.namaKandidat).nama}</b> dengan tiap peran. Setiap peran memakai bobotnya sendiri.
                </>
              ) : (
                'Pilih kandidat dulu untuk melihat kecocokannya dengan tiap peran.'
              )
            }
          />
          <ul className="grid gap-2.5">
            {slotPeran.map((slot) => {
              const terisi = DATA_PENGGUNA.find((u) => u.id === slot.kandidatTerpilihId);
              const fitDipilih = kandidatDipilih ? skorKecocokan(kandidatDipilih, slot.kodePeran) : null;
              const terbaik = [...hasilSAW]
                .filter((h) => !slotPeran.some((s) => s.kodePeran !== slot.kodePeran && s.kandidatTerpilihId === h.kandidatId))
                .sort((a, b) => skorKecocokan(b, slot.kodePeran) - skorKecocokan(a, slot.kodePeran))[0];
              const alasan = slot.alasanTertulis;
              const w = BOBOT_PERAN[slot.kodePeran];
              const bobotTeks = `Konsistensi ${w.kepemimpinan * 100}, keandalan ${w.eksekusi * 100}, kolaborasi ${w.kolaborasi * 100}, dampak ${w.dampak * 100}`;

              return (
                <li
                  key={slot.kodePeran}
                  className="rounded-[12px] px-4 py-3.5"
                  style={{
                    border: terisi ? '1px solid var(--line)' : '1px dashed var(--line-strong)',
                    background: terisi ? 'var(--surface)' : 'var(--surface-2)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{slot.namaPeran}</p>
                      <p className="text-[0.7rem] text-[color:var(--muted)] mt-0.5" title="Bobot kecocokan peran (%)">
                        {bobotTeks}
                      </p>
                    </div>
                    {terisi && (
                      <button className="btn btn-ghost !p-1.5 -mr-1.5 -mt-1" onClick={() => onKosongkan(slot.kodePeran)} aria-label={`Kosongkan ${slot.namaPeran}`}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {terisi ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar nama={terisi.nama} size={28} />
                        <span className="text-sm font-semibold flex-1 truncate">{pisahNama(terisi.nama).nama}</span>
                        <span className="tabular text-sm font-bold">{slot.skorKecocokan.toFixed(1)}</span>
                      </div>
                      <div className="mt-2">
                        <Meter value={slot.skorKecocokan} max={100} color="var(--seal)" />
                      </div>
                      {alasan && (
                        <p className="text-xs mt-2.5 leading-relaxed text-[color:var(--graphite)] border-l-2 pl-2.5" style={{ borderColor: 'var(--amber)' }}>
                          Alasan tertulis: {alasan}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[color:var(--muted)] mt-2">Belum terisi</p>
                  )}

                  {fitDipilih !== null && kandidatDipilih && slot.kandidatTerpilihId !== kandidatDipilih.kandidatId && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[color:var(--graphite)]">
                            Kecocokan {pisahNama(kandidatDipilih.namaKandidat).nama.split(' ')[0]}
                            {terbaik && terbaik.kandidatId !== kandidatDipilih.kandidatId && (
                              <span className="text-[color:var(--muted)]">
                                {' '}
                                (tertinggi {pisahNama(terbaik.namaKandidat).nama.split(' ')[0]} {skorKecocokan(terbaik, slot.kodePeran).toFixed(1)})
                              </span>
                            )}
                          </span>
                          <span className="tabular font-bold">{fitDipilih.toFixed(1)}</span>
                        </div>
                        <Meter value={fitDipilih} max={100} />
                      </div>
                      <button className="btn btn-primary" onClick={() => onTetapkan(slot.kodePeran)}>
                        <UserPlus className="w-4 h-4" />
                        Tetapkan
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="flex items-center gap-1.5 text-xs text-[color:var(--muted)] mt-4">
            <Lock className="w-3.5 h-3.5" /> Bobot dikunci sejak periode suksesi dibuka.
          </p>
        </section>

        <PenandaPola daftar={penanda} />
      </div>
    </div>
  );
}
