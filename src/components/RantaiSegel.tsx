'use client';

// Strip "rantai segel": elemen khas SIGAP. Segel yang isinya berubah ditandai merah,
// dan semua segel sesudahnya ikut ditandai karena bergantung padanya.
import { useState } from 'react';
import { ShieldCheck, ShieldAlert, X } from 'lucide-react';
import type { StatusSegel } from '@/lib/integritas';

export type SegelTampil = {
  urutan: number;
  status: StatusSegel;
  hash_sebelumnya: string;
  hash_entri: string;
  hash_hitung_ulang: string | null;
  milikOrgIni: boolean;
  pemilikId: string | null;
  label: string | null; // nama pemilik, hanya untuk entri organisasi ini
  kegiatan: string | null;
  disetujui: string | null;
};

const KET: Record<StatusSegel, string> = {
  utuh: 'Isi entri cocok dengan segelnya dan tersambung ke segel sebelumnya.',
  diubah: 'Isi entri berubah setelah disetujui. Hash yang dihitung ulang tidak sama dengan segel tersimpan.',
  putus: 'Sambungan ke segel sebelumnya tidak cocok. Ada segel yang disisipkan atau dicabut.',
  terdampak: 'Entri ini tidak berubah, tetapi segelnya bergantung pada segel yang rusak sebelumnya.',
  hilang: 'Entri yang disegel tidak ditemukan di basis data.',
};

export default function RantaiSegel({
  segel,
  utuh,
  tanpaSegel,
  diperiksaPada,
  aksi,
}: {
  segel: SegelTampil[];
  utuh: boolean;
  tanpaSegel: number;
  diperiksaPada: string;
  aksi?: React.ReactNode;
}) {
  const [aktif, setAktif] = useState<number | null>(null);
  const rusak = segel.filter((s) => s.status !== 'utuh').length;
  const pertama = segel.find((s) => s.status !== 'utuh' && s.status !== 'terdampak');
  const terpilih = segel.find((s) => s.urutan === aktif) ?? null;

  return (
    <section className="panel overflow-hidden" aria-label="Rantai segel">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: utuh ? 'var(--seal-soft)' : 'var(--telkom-soft)' }}>
            {utuh ? <ShieldCheck className="w-4 h-4" style={{ color: 'var(--seal)' }} /> : <ShieldAlert className="w-4 h-4" style={{ color: 'var(--telkom)' }} />}
          </span>
          <div>
            <p className="text-sm font-bold">
              {segel.length === 0
                ? 'Belum ada entri yang disegel'
                : utuh
                  ? `Rantai utuh, ${segel.length} segel cocok dengan datanya`
                  : pertama
                    ? `Perubahan terdeteksi mulai segel ${pertama.urutan}, ${rusak} segel tidak lagi cocok`
                    : `${tanpaSegel} entri disetujui tanpa segel`}
            </p>
            <p className="text-xs text-graphite mt-0.5">
              Diperiksa ulang dari isi basis data pada {new Date(diperiksaPada).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}. Segel organisasi lain tampil samar.
              {tanpaSegel > 0 && ` ${tanpaSegel} entri berstatus disetujui tanpa segel.`}
            </p>
          </div>
        </div>
        {aksi}
      </div>

      {segel.length > 0 && (
        <div className="scroll-x overflow-x-auto px-5 pb-4">
          <ol className="flex items-stretch w-max">
            <li className="flex items-center">
              <span className="text-[0.7rem] mono px-2 py-1 rounded-md bg-surface-2 text-muted">genesis</span>
            </li>
            {segel.map((s) => (
              <li key={s.urutan} className="flex items-stretch">
                <span className="link" data-broken={s.status !== 'utuh'} />
                <button
                  className="seal"
                  data-status={s.status}
                  data-active={aktif === s.urutan}
                  data-dim={!s.milikOrgIni && s.status === 'utuh'}
                  onClick={() => setAktif(aktif === s.urutan ? null : s.urutan)}
                  aria-label={`Segel ${s.urutan}, status ${s.status}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-bold tabular">Segel {s.urutan}</span>
                    <span className="seal-dot" />
                  </span>
                  <span className="block mono text-[0.7rem] mt-1.5 text-graphite">{s.hash_entri.slice(0, 8)}</span>
                  <span className="block text-[0.7rem] mt-0.5 truncate text-muted">{s.label ?? 'organisasi lain'}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {terpilih && (
        <div className="border-t px-5 py-4 grid gap-4 md:grid-cols-[1fr_1.4fr] bg-surface-2" style={{ borderColor: 'var(--line)' }}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">Segel {terpilih.urutan}</p>
              <button className="btn btn-ghost !p-1.5" onClick={() => setAktif(null)} aria-label="Tutup rincian segel">
                <X className="w-4 h-4" />
              </button>
            </div>
            {terpilih.milikOrgIni ? (
              <>
                <p className="text-sm mt-1">{terpilih.kegiatan}</p>
                <p className="text-xs text-graphite mt-1">
                  {terpilih.label}
                  {terpilih.disetujui && `, ${terpilih.disetujui}`}
                </p>
              </>
            ) : (
              <p className="text-xs text-graphite mt-1">Entri milik organisasi lain. Isinya tidak ditampilkan, hanya hash-nya.</p>
            )}
            <p className="text-xs mt-3 leading-relaxed font-semibold" style={{ color: terpilih.status === 'utuh' ? 'var(--seal)' : terpilih.status === 'terdampak' ? 'var(--amber)' : 'var(--telkom)' }}>
              {KET[terpilih.status]}
            </p>
          </div>
          <dl className="mono text-[0.72rem] leading-relaxed grid gap-2 min-w-0">
            <div>
              <dt className="text-muted">hash sebelumnya</dt>
              <dd className="break-all text-graphite">{terpilih.hash_sebelumnya}</dd>
            </div>
            <div>
              <dt className="text-muted">segel tersimpan</dt>
              <dd className="break-all font-medium">{terpilih.hash_entri}</dd>
            </div>
            {terpilih.hash_hitung_ulang && terpilih.hash_hitung_ulang !== terpilih.hash_entri && (
              <div>
                <dt style={{ color: 'var(--telkom)' }}>dihitung ulang dari isi sekarang</dt>
                <dd className="break-all" style={{ color: 'var(--telkom)' }}>
                  {terpilih.hash_hitung_ulang}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  );
}
