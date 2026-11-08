'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { Check, ExternalLink, Inbox, X } from 'lucide-react';
import { setujuiKontribusi, tolakKontribusi } from '@/app/actions/verifikasi';
import { TombolKirim } from '@/components/Tombol';
import { PesanAksi } from '@/components/PesanAksi';
import { Avatar, Kosong, PilStatus } from '@/components/ui';
import { ASPEK } from '@/lib/saw';
import { tanggal, waktu } from '@/lib/format';
import type { StatusKontribusi } from '@/lib/types';

export type EntriAntrean = {
  id: string;
  kegiatan: string;
  peran: string;
  periode: string;
  tanggal: string;
  uraian: string;
  adaBukti: boolean;
  jenisBukti: 'berkas' | 'tautan';
  dikirim: string;
  pengaju: { nama: string; nim: string; jurusan: string; angkatan: number | null };
  milikSendiri: boolean;
  riwayat: { total: number; olehSaya: number };
};

type Riwayat = { id: string; kegiatan: string; status: StatusKontribusi; waktu: string | null };

export default function PanelVerifikasi({ slug, antrean, riwayat }: { slug: string; antrean: EntriAntrean[]; riwayat: Riwayat[] }) {
  const [aktifId, setAktifId] = useState<string | null>(antrean.find((a) => !a.milikSendiri)?.id ?? antrean[0]?.id ?? null);
  // State aksi disimpan di sini supaya pesan tetap tampil setelah entri hilang dari antrean
  const [hSetuju, setuju] = useFormState(setujuiKontribusi, null);
  const [hTolak, tolak] = useFormState(tolakKontribusi, null);
  const aktif = antrean.find((a) => a.id === aktifId) ?? null;

  useEffect(() => {
    if (!aktif && antrean.length) setAktifId(antrean.find((a) => !a.milikSendiri)?.id ?? antrean[0].id);
  }, [antrean, aktif]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start">
      <section className="panel p-5">
        <h2 className="text-[1.05rem] font-bold">Antrean</h2>
        <p className="text-sm text-graphite mt-1 mb-4">{antrean.length} entri menunggu, diurutkan dari yang paling lama.</p>
        <div className="mb-3 grid gap-1">
          <PesanAksi hasil={hSetuju} />
          <PesanAksi hasil={hTolak} />
        </div>
        {antrean.length === 0 ? (
          <div className="inset px-4 py-8 text-center">
            <Inbox className="w-5 h-5 mx-auto text-muted" />
            <p className="text-sm font-semibold mt-2">Antrean kosong</p>
            <p className="text-xs text-graphite mt-1">Entri baru dari anggota akan muncul di sini.</p>
          </div>
        ) : (
          <ul className="grid gap-1">
            {antrean.map((e) => {
              const on = e.id === aktifId;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setAktifId(e.id)}
                    aria-pressed={on}
                    className="w-full text-left flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors"
                    style={{ background: on ? '#f1f4f7' : 'transparent', boxShadow: on ? 'inset 3px 0 0 var(--navy)' : undefined }}
                  >
                    <Avatar nama={e.pengaju.nama} ukuran={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{e.kegiatan}</span>
                      <span className="block text-xs text-graphite truncate">
                        {e.pengaju.nama}
                        {e.milikSendiri ? ' (entri Anda)' : ''}
                      </span>
                    </span>
                    <span className="text-[0.7rem] text-muted shrink-0">{tanggal(e.dikirim)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {riwayat.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-graphite mb-2">Terakhir Anda proses</p>
            <ul className="grid gap-1.5">
              {riwayat.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-[8px] bg-surface-2">
                  <span className="truncate">{r.kegiatan}</span>
                  <PilStatus status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel p-5">
        {aktif ? <Penilaian key={aktif.id} slug={slug} e={aktif} setuju={setuju} tolak={tolak} /> : <Kosong judul="Tidak ada entri dipilih" isi="Pilih entri dari antrean untuk mulai menilai." />}
      </section>
    </div>
  );
}

function Penilaian({ slug, e, setuju, tolak }: { slug: string; e: EntriAntrean; setuju: (fd: FormData) => void; tolak: (fd: FormData) => void }) {
  const [nilai, setNilai] = useState<Record<string, number>>({});
  const [catatan, setCatatan] = useState('');
  const lengkap = ASPEK.every((a) => nilai[a.key]);

  return (
    <>
      <div className="flex items-start gap-3">
        <Avatar nama={e.pengaju.nama} ukuran={40} />
        <div className="min-w-0">
          <h2 className="text-[1.05rem] font-bold tracking-[-0.01em]">{e.kegiatan}</h2>
          <p className="text-sm text-graphite mt-0.5">
            {e.pengaju.nama} <span className="mono text-xs">{e.pengaju.nim}</span>
            {e.pengaju.jurusan && `, ${e.pengaju.jurusan}`}
            {e.pengaju.angkatan && ` ${e.pengaju.angkatan}`}
          </p>
        </div>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5 text-sm">
        <div><dt className="text-xs text-muted">Peran</dt><dd>{e.peran}</dd></div>
        <div><dt className="text-xs text-muted">Periode</dt><dd>{e.periode}, kegiatan {tanggal(e.tanggal)}</dd></div>
        <div>
          <dt className="text-xs text-muted">Bukti</dt>
          <dd>
            {e.adaBukti ? (
              <a href={`/api/bukti/${e.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                Buka {e.jenisBukti} bukti <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              'Tidak ada'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Riwayat pengaju</dt>
          <dd>
            {e.riwayat.total} entri disetujui{e.riwayat.total > 0 && `, ${e.riwayat.olehSaya} oleh Anda`}
          </dd>
        </div>
        {e.uraian && (
          <div className="sm:col-span-2"><dt className="text-xs text-muted">Uraian</dt><dd className="leading-relaxed max-w-prose">{e.uraian}</dd></div>
        )}
      </dl>

      {e.milikSendiri ? (
        <p className="mt-6 text-sm font-semibold" style={{ color: 'var(--amber)' }}>
          Ini entri Anda sendiri. Pengaju tidak dapat menyetujui entrinya sendiri; verifikator lain yang akan menilainya.
        </p>
      ) : (
        <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
          <p className="text-sm font-bold">Nilai empat aspek</p>
          <p className="text-xs text-graphite mt-0.5">1 berarti sangat kurang, 5 berarti sangat baik.</p>

          <form action={setuju} id="form-setuju">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="catatan" value={catatan} />
            <div className="grid gap-4 mt-4">
              {ASPEK.map((a) => (
                <fieldset key={a.key} className="grid sm:grid-cols-[1fr_auto] gap-2 sm:items-center">
                  <legend className="sr-only">{a.label}</legend>
                  <div>
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-xs text-muted">{a.yangDinilai}</p>
                  </div>
                  <div className="inline-flex rounded-[9px] border p-0.5 w-fit" style={{ borderColor: 'var(--line-strong)' }}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const on = nilai[a.key] === n;
                      return (
                        <label key={n} className="cursor-pointer">
                          <input type="radio" name={`nilai_${a.key}`} value={n} className="sr-only peer" checked={on} onChange={() => setNilai((s) => ({ ...s, [a.key]: n }))} />
                          <span
                            className="tabular w-9 h-8 text-sm font-semibold rounded-[7px] flex items-center justify-center peer-focus-visible:outline peer-focus-visible:outline-2"
                            style={{ background: on ? 'var(--navy)' : 'transparent', color: on ? '#fff' : 'var(--graphite)' }}
                          >
                            {n}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </form>

          <label className="label mt-5" htmlFor="catatan">Catatan untuk pengaju</label>
          <textarea id="catatan" rows={3} className="field" value={catatan} onChange={(ev) => setCatatan(ev.target.value)} placeholder="Wajib bila menolak. Contoh: SK panitia belum dilampirkan." />

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <p className="text-xs text-muted max-w-xs">Menyetujui akan menyegel entri ini. Setelah itu isinya tidak bisa diubah tanpa ketahuan.</p>
            <div className="flex gap-2">
              <form action={tolak}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="catatan" value={catatan} />
                <TombolKirim kelas="btn btn-danger"><X className="w-4 h-4" /> Tolak</TombolKirim>
              </form>
              <TombolSetuju lengkap={lengkap} />
            </div>
          </div>
          <div className="mt-3 grid gap-1">
            {!lengkap && <p className="text-xs text-muted">Tombol setujui aktif setelah keempat aspek dinilai.</p>}
          </div>
          <p className="text-[0.7rem] text-muted mt-2">Dikirim {waktu(e.dikirim)}.</p>
        </div>
      )}
    </>
  );
}

function TombolSetuju({ lengkap }: { lengkap: boolean }) {
  const [kirim, setKirim] = useState(false);
  useEffect(() => {
    if (!kirim) return;
    const t = setTimeout(() => setKirim(false), 4000);
    return () => clearTimeout(t);
  }, [kirim]);
  return (
    <button type="submit" form="form-setuju" className="btn btn-primary" disabled={!lengkap} aria-busy={kirim} onClick={() => lengkap && setKirim(true)}>
      <Check className="w-4 h-4" /> {kirim ? 'Menyegel…' : 'Setujui dan segel'}
    </button>
  );
}
