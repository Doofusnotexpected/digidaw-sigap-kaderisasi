// src/components/SealChain.tsx
'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, RotateCcw, FlaskConical, X } from 'lucide-react';
import { EntriKontribusi, SegelHash } from '@/types';
import { DATA_PENGGUNA } from '@/data/seedData';
import { StatusSegel } from '@/lib/chainTrace';
import { pisahNama, waktu } from './shared';

const KET: Record<StatusSegel, string> = {
  utuh: 'Isi entri cocok dengan segelnya.',
  diubah: 'Isi entri berubah setelah disetujui. Hash yang dihitung ulang tidak sama dengan segel tersimpan.',
  terdampak: 'Entri ini tidak berubah, tetapi segelnya bergantung pada segel yang rusak sebelumnya.',
  hilang: 'Entri yang disegel tidak ditemukan di basis data.',
};

export default function SealChain({
  segelList,
  statusList,
  entriList,
  tampered,
  onToggleTamper,
  allowTamper,
}: {
  segelList: SegelHash[];
  statusList: StatusSegel[];
  entriList: EntriKontribusi[];
  tampered: boolean;
  onToggleTamper: () => void;
  allowTamper: boolean;
}) {
  const [aktif, setAktif] = useState<number | null>(null);
  const rusak = statusList.filter((s) => s !== 'utuh').length;
  const pertamaRusak = statusList.findIndex((s) => s === 'diubah' || s === 'hilang');
  const utuh = segelList.length > 0 && rusak === 0;

  const segelAktif = aktif !== null ? segelList[aktif] : null;
  const entriAktif = segelAktif ? entriList.find((e) => e.id === segelAktif.entriId) : null;
  const pemilik = entriAktif ? DATA_PENGGUNA.find((u) => u.id === entriAktif.kandidatId) : null;

  return (
    <section className="panel overflow-hidden" aria-label="Rantai segel">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: utuh ? 'var(--seal-soft)' : 'var(--telkom-soft)' }}
          >
            {utuh ? (
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--seal)' }} />
            ) : (
              <ShieldAlert className="w-4 h-4" style={{ color: 'var(--broken)' }} />
            )}
          </span>
          <div aria-live="polite">
            <p className="text-sm font-bold">
              {segelList.length === 0
                ? 'Menyiapkan rantai segel'
                : utuh
                  ? `Rantai utuh, ${segelList.length} segel cocok dengan datanya`
                  : `Perubahan terdeteksi pada segel ${pertamaRusak + 1}, ${rusak} segel tidak lagi cocok`}
            </p>
            <p className="text-xs text-[color:var(--graphite)] mt-0.5">
              Tiap entri yang disetujui disegel SHA-256 bersama segel sebelumnya. Klik segel untuk melihat isinya.
            </p>
          </div>
        </div>
        {allowTamper && (
          <button onClick={onToggleTamper} className={tampered ? 'btn btn-quiet' : 'btn btn-danger'}>
            {tampered ? <RotateCcw className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
            {tampered ? 'Pulihkan data asli' : 'Simulasikan pengubahan data'}
          </button>
        )}
      </div>

      <div className="scroll-x overflow-x-auto px-5 pb-4">
        <ol className="flex items-stretch w-max">
          <li className="flex items-center">
            <span className="text-[0.7rem] mono px-2 py-1 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              genesis
            </span>
          </li>
          {segelList.map((s, i) => {
            const st = statusList[i] ?? 'utuh';
            const e = entriList.find((x) => x.id === s.entriId);
            const owner = e ? pisahNama(DATA_PENGGUNA.find((u) => u.id === e.kandidatId)?.nama ?? '').nama.split(' ')[0] : '?';
            const delay = st === 'utuh' ? 0 : Math.max(0, i - Math.max(pertamaRusak, 0)) * 70;
            return (
              <li key={s.id} className="flex items-stretch">
                <span className="link" data-broken={st !== 'utuh'} style={{ transitionDelay: `${delay}ms` }} />
                <button
                  className="seal"
                  data-status={st}
                  data-active={aktif === i}
                  style={{ transitionDelay: `${delay}ms` }}
                  onClick={() => setAktif(aktif === i ? null : i)}
                  aria-label={`Segel ${i + 1}, ${owner}, status ${st}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-bold tabular">Segel {i + 1}</span>
                    <span className="seal-dot" />
                  </span>
                  <span className="block mono text-[0.7rem] mt-1.5 text-[color:var(--graphite)]">{s.hashSaatIni.slice(0, 8)}</span>
                  <span className="block text-[0.7rem] mt-0.5 truncate text-[color:var(--muted)]">{owner}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {segelAktif && (
        <div className="border-t px-5 py-4 grid gap-4 md:grid-cols-[1fr_1.3fr]" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">Segel {aktif! + 1}</p>
              <button className="btn btn-ghost !p-1.5" onClick={() => setAktif(null)} aria-label="Tutup rincian segel">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mt-1">{entriAktif?.namaKegiatan ?? 'Entri tidak ditemukan'}</p>
            <p className="text-xs text-[color:var(--graphite)] mt-1">
              {pemilik ? pisahNama(pemilik.nama).nama : ''}
              {entriAktif?.verifikatorNama ? `, disetujui ${entriAktif.verifikatorNama}` : ''}
              {entriAktif?.waktuVerifikasi ? ` pada ${waktu(entriAktif.waktuVerifikasi)}` : ''}
            </p>
            <p
              className="text-xs mt-3 leading-relaxed"
              style={{ color: statusList[aktif!] === 'utuh' ? 'var(--seal)' : statusList[aktif!] === 'diubah' ? 'var(--broken)' : 'var(--amber)' }}
            >
              {KET[statusList[aktif!] ?? 'utuh']}
            </p>
          </div>
          <dl className="mono text-[0.72rem] leading-relaxed grid gap-2 min-w-0">
            <div>
              <dt className="text-[color:var(--muted)]">hash sebelumnya</dt>
              <dd className="break-all text-[color:var(--graphite)]">{segelAktif.hashSebelumnya}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted)]">segel entri ini</dt>
              <dd className="break-all font-medium">{segelAktif.hashSaatIni}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

