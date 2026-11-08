// src/components/AuditorView.tsx
'use client';

import React, { useState } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { AuditLog, EntriKontribusi, OrmawaId, SegelHash } from '@/types';
import { DATA_PENGGUNA } from '@/data/seedData';
import { StatusSegel } from '@/lib/chainTrace';
import PenandaPola, { Penanda } from './PenandaPola';
import { SectionHead, pisahNama, potongHash, waktu } from './shared';

const WARNA: Record<StatusSegel, { t: string; fg: string; bg: string }> = {
  utuh: { t: 'Cocok', fg: 'var(--seal)', bg: 'var(--seal-soft)' },
  diubah: { t: 'Isi berubah', fg: 'var(--broken)', bg: 'var(--telkom-soft)' },
  terdampak: { t: 'Terdampak', fg: 'var(--amber)', bg: 'var(--amber-soft)' },
  hilang: { t: 'Entri hilang', fg: 'var(--broken)', bg: 'var(--telkom-soft)' },
};

export default function AuditorView({
  ormawa,
  segelList,
  statusList,
  entriList,
  auditLog,
  penanda,
  logPemeriksaan,
  onPeriksa,
  sedangMemeriksa,
}: {
  ormawa: OrmawaId;
  segelList: SegelHash[];
  statusList: StatusSegel[];
  entriList: EntriKontribusi[];
  auditLog: AuditLog[];
  penanda: Penanda[];
  logPemeriksaan: string[];
  onPeriksa: () => void;
  sedangMemeriksa: boolean;
}) {
  const [logTerbuka, setLogTerbuka] = useState(false);
  const baris = segelList
    .map((s, i) => ({ s, i, e: entriList.find((x) => x.id === s.entriId), st: statusList[i] ?? 'utuh' }))
    .filter((r) => !r.e || r.e.ormawaId === ormawa);
  const jejak = auditLog.filter((l) => !l.ormawaId || l.ormawaId === ormawa).slice().reverse();
  const tidakCocok = baris.filter((r) => r.st !== 'utuh').length;
  const denganAlasan = jejak.filter((l) => l.aksi.startsWith('Penetapan') && l.keteranganTertulis.startsWith('Alasan:')).length;

  return (
    <div className="grid grid-cols-1 gap-6">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-[14px] overflow-hidden border" style={{ background: 'var(--line)', borderColor: 'var(--line)' }}>
        {[
          { k: 'Segel organisasi ini', v: baris.length },
          { k: 'Segel tidak cocok', v: tidakCocok, warn: tidakCocok > 0 },
          { k: 'Penanda pola aktif', v: penanda.length, warn: penanda.length > 0 },
          { k: 'Penetapan dengan alasan tertulis', v: denganAlasan },
        ].map((x) => (
          <div key={x.k} className="px-5 py-4" style={{ background: 'var(--surface)' }}>
            <dt className="text-xs text-[color:var(--graphite)]">{x.k}</dt>
            <dd className="tabular text-2xl font-extrabold tracking-[-0.02em] mt-1" style={{ color: x.warn ? 'var(--broken)' : undefined }}>
              {x.v}
            </dd>
          </div>
        ))}
      </dl>

      <section className="panel p-5">
        <SectionHead
          title="Buku segel"
          desc="Setiap baris adalah entri yang disetujui. Segel dihitung ulang dari isi entri saat ini dan dibandingkan dengan segel tersimpan."
          aside={
            <button className="btn btn-quiet" onClick={onPeriksa} disabled={sedangMemeriksa}>
              <RefreshCw className={`w-4 h-4 ${sedangMemeriksa ? 'animate-spin' : ''}`} />
              Periksa ulang rantai
            </button>
          }
        />
        <div className="overflow-x-auto scroll-x -mx-5 px-5">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-[color:var(--graphite)]">
                <th className="font-semibold py-2 pr-3 w-12">No.</th>
                <th className="font-semibold py-2 pr-3">Kegiatan</th>
                <th className="font-semibold py-2 pr-3">Pemilik</th>
                <th className="font-semibold py-2 pr-3">Disetujui oleh</th>
                <th className="font-semibold py-2 pr-3">Segel</th>
                <th className="font-semibold py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {baris.map(({ s, i, e, st }) => (
                <tr key={s.id} className="border-t align-top" style={{ borderColor: 'var(--line)', background: st === 'diubah' ? 'var(--telkom-soft)' : undefined }}>
                  <td className="py-2.5 pr-3 tabular text-[color:var(--muted)]">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium">{e?.namaKegiatan ?? 'Tidak ditemukan'}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">{pisahNama(DATA_PENGGUNA.find((u) => u.id === e?.kandidatId)?.nama ?? '').nama}</td>
                  <td className="py-2.5 pr-3">
                    <span className="block">{e?.verifikatorNama}</span>
                    <span className="block text-xs text-[color:var(--muted)]">{waktu(e?.waktuVerifikasi ?? '')}</span>
                  </td>
                  <td className="py-2.5 pr-3 mono text-xs text-[color:var(--graphite)] whitespace-nowrap" title={s.hashSaatIni}>
                    {potongHash(s.hashSaatIni, 8)}
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ color: WARNA[st].fg, background: WARNA[st].bg }}>
                      {WARNA[st].t}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn btn-ghost !px-1 mt-3" onClick={() => setLogTerbuka((v) => !v)} aria-expanded={logTerbuka}>
          <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: logTerbuka ? 'rotate(180deg)' : undefined }} />
          Log pemeriksaan terakhir
        </button>
        {logTerbuka && (
          <pre className="inset mono text-[0.72rem] leading-relaxed p-3 mt-2 overflow-x-auto whitespace-pre-wrap">{logPemeriksaan.join('\n') || 'Belum ada pemeriksaan.'}</pre>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="panel p-5">
          <SectionHead title="Jejak audit" desc="Semua tindakan tercatat berurutan dan tidak bisa dihapus dari layar ini." />
          <ol className="relative grid gap-0">
            {jejak.map((l, idx) => (
              <li key={l.id} className="relative pl-6 pb-4">
                {idx < jejak.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px" style={{ background: 'var(--line)' }} />}
                <span
                  className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2"
                  style={{
                    borderColor: l.penandaPola.length ? 'var(--amber)' : l.aksi.includes('Simulasi') ? 'var(--broken)' : 'var(--navy)',
                    background: 'var(--surface)',
                  }}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold">{l.aksi}</p>
                  <time className="text-xs text-[color:var(--muted)] tabular">{waktu(l.timestamp)}</time>
                </div>
                <p className="text-xs text-[color:var(--graphite)] mt-0.5">{l.aktorId}</p>
                {l.keteranganTertulis && <p className="text-[0.8rem] mt-1 leading-relaxed max-w-prose">{l.keteranganTertulis}</p>}
                {l.penandaPola.map((p) => (
                  <p key={p} className="text-xs mt-1 font-semibold" style={{ color: 'var(--amber)' }}>
                    {p}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        </section>
        <div className="content-start">
          <PenandaPola daftar={penanda} />
        </div>
      </div>
    </div>
  );
}
