'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { TriangleAlert, UserPlus, X } from 'lucide-react';
import { tetapkanPeran, kosongkanSlot } from '@/app/actions/penetapan';
import { TombolKirim } from '@/components/Tombol';
import { PesanAksi } from '@/components/PesanAksi';
import { Avatar, Meter, Pil } from '@/components/ui';
import { ASPEK } from '@/lib/saw';
import { MIN_ALASAN } from '@/lib/konstanta';
import { satuDesimal } from '@/lib/format';
import type { Bobot } from '@/lib/types';

type Kandidat = {
  id: string;
  nama: string;
  jurusan: string;
  angkatan: number | null;
  skor: number;
  peringkat: number;
  jumlahEntri: number;
  rataRata: Record<'kepemimpinan' | 'eksekusi' | 'kolaborasi' | 'dampak', number>;
  ditandai: boolean;
  cocok: Record<string, number>;
};
type Slot = { id: string; nama: string; bobot: Bobot };
type Penetapan = { slot_id: string; kandidat_id: string; skor: number; alasan: string | null };

export default function PencocokanPeran({
  slug,
  kandidat,
  slot,
  penetapan,
  minKarakterPenanda,
}: {
  slug: string;
  kandidat: Kandidat[];
  slot: Slot[];
  penetapan: Penetapan[];
  minKarakterPenanda: number;
}) {
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [modal, setModal] = useState<{ slot: Slot; pembanding: { nama: string; skor: number } } | null>(null);
  const [hasil, aksi] = useFormState(tetapkanPeran, null);
  const formLangsung = useRef<HTMLFormElement>(null);
  const [slotLangsung, setSlotLangsung] = useState('');

  const k = kandidat.find((x) => x.id === dipilih) ?? null;
  const nama = useMemo(() => new Map(kandidat.map((x) => [x.id, x.nama])), [kandidat]);

  useEffect(() => {
    if (hasil?.ok) {
      setDipilih(null);
      setModal(null);
    }
  }, [hasil]);

  useEffect(() => {
    if (slotLangsung) {
      formLangsung.current?.requestSubmit();
      setSlotLangsung('');
    }
  }, [slotLangsung]);

  function pembanding(slotId: string, kandidatId: string) {
    const diSlotLain = new Set(penetapan.filter((p) => p.slot_id !== slotId && p.kandidat_id !== kandidatId).map((p) => p.kandidat_id));
    const skorPilihan = kandidat.find((x) => x.id === kandidatId)?.cocok[slotId] ?? 0;
    let terbaik: { nama: string; skor: number } | null = null;
    for (const c of kandidat) {
      if (c.id === kandidatId || diSlotLain.has(c.id)) continue;
      const s = c.cocok[slotId];
      if (s > skorPilihan && (!terbaik || s > terbaik.skor)) terbaik = { nama: c.nama, skor: s };
    }
    return terbaik;
  }

  function tetapkan(s: Slot) {
    if (!k) return;
    const p = pembanding(s.id, k.id);
    if (p) setModal({ slot: s, pembanding: p });
    else setSlotLangsung(s.id);
  }

  const tipis = kandidat.length > 1 && kandidat[0].skor - kandidat[1].skor < 3;

  return (
    <>
      <div className="grid gap-6 items-start xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="panel p-5">
          <h2 className="text-[1.05rem] font-bold">Kandidat</h2>
          <p className="text-sm text-graphite mt-1 mb-4">Klik untuk memilih. Urutan dari skor SAW.</p>
          <ul className="grid gap-2">
            {kandidat.map((c) => {
              const on = c.id === dipilih;
              const di = penetapan.find((p) => p.kandidat_id === c.id);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setDipilih(on ? null : c.id)}
                    aria-pressed={on}
                    className="w-full text-left rounded-[12px] border px-4 py-3.5 transition-colors"
                    style={{ borderColor: on ? 'var(--navy)' : 'var(--line)', background: on ? '#f3f6f9' : 'var(--surface)', boxShadow: on ? 'inset 0 0 0 1px var(--navy)' : undefined }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="tabular text-sm font-bold w-6 text-center shrink-0" style={{ color: c.peringkat === 1 ? 'var(--telkom)' : 'var(--muted)' }}>{c.peringkat}</span>
                      <Avatar nama={c.nama} ukuran={36} gelap={on} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.95rem] font-semibold truncate">{c.nama}</p>
                        <p className="text-xs text-graphite truncate">{c.jurusan}{c.angkatan ? `, ${c.angkatan}` : ''}. {c.jumlahEntri} entri terverifikasi</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular text-[1.3rem] font-extrabold leading-none">{satuDesimal(c.skor)}</p>
                        <p className="text-[0.7rem] text-muted mt-1">skor SAW</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-x-4 gap-y-2 mt-3 sm:pl-9">
                      {ASPEK.map((a) => (
                        <div key={a.key}>
                          <div className="flex justify-between text-[0.7rem] text-graphite mb-1">
                            <span>{a.singkat}</span>
                            <span className="tabular font-semibold text-ink">{satuDesimal(c.rataRata[a.key])}</span>
                          </div>
                          <Meter nilai={c.rataRata[a.key]} maks={5} />
                        </div>
                      ))}
                    </div>
                    {(c.ditandai || di) && (
                      <div className="flex flex-wrap gap-2 mt-3 sm:pl-9">
                        {c.ditandai && <Pil nada="amber"><TriangleAlert className="w-3 h-3" /> Perlu ditinjau</Pil>}
                        {di && <Pil nada="hijau">{slot.find((s) => s.id === di.slot_id)?.nama}</Pil>}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {kandidat.length === 0 && <p className="text-sm text-graphite">Belum ada kandidat dengan entri terverifikasi.</p>}
          {tipis && <p className="text-xs text-graphite mt-3">Selisih dua teratas kurang dari 3 poin. Bahas lewat rincian aspek dan buktinya.</p>}
        </section>

        <section className="panel p-5">
          <h2 className="text-[1.05rem] font-bold">Slot peran</h2>
          <p className="text-sm text-graphite mt-1 mb-4">{k ? <>Kecocokan <b className="text-ink">{k.nama}</b> dengan tiap peran.</> : 'Pilih kandidat dulu untuk melihat kecocokannya.'}</p>
          <div className="mb-3"><PesanAksi hasil={hasil} /></div>

          <form ref={formLangsung} action={aksi} className="hidden">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="slot_id" value={slotLangsung} />
            <input type="hidden" name="kandidat_id" value={dipilih ?? ''} />
          </form>

          <ul className="grid gap-2.5">
            {slot.map((s) => {
              const p = penetapan.find((x) => x.slot_id === s.id);
              const fit = k ? k.cocok[s.id] : null;
              const pb = k ? pembanding(s.id, k.id) : null;
              return (
                <li key={s.id} className="rounded-[12px] px-4 py-3.5" style={{ border: p ? '1px solid var(--line)' : '1px dashed var(--line-strong)', background: p ? 'var(--surface)' : 'var(--surface-2)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{s.nama}</p>
                      <p className="text-[0.7rem] text-muted mt-0.5">
                        Bobot: konsistensi {Math.round(s.bobot.kepemimpinan * 100)}, keandalan {Math.round(s.bobot.eksekusi * 100)}, kolaborasi {Math.round(s.bobot.kolaborasi * 100)}, dampak {Math.round(s.bobot.dampak * 100)}
                      </p>
                    </div>
                    {p && (
                      <form action={kosongkanSlot}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="slot_id" value={s.id} />
                        <button className="btn btn-ghost !p-1.5 -mr-1.5 -mt-1" aria-label={`Kosongkan ${s.nama}`}><X className="w-4 h-4" /></button>
                      </form>
                    )}
                  </div>
                  {p ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar nama={nama.get(p.kandidat_id) ?? '?'} ukuran={28} />
                        <span className="text-sm font-semibold flex-1 truncate">{nama.get(p.kandidat_id)}</span>
                        <span className="tabular text-sm font-bold">{satuDesimal(p.skor)}</span>
                      </div>
                      <div className="mt-2"><Meter nilai={p.skor} maks={100} warna="var(--seal)" /></div>
                      {p.alasan && (
                        <p className="text-xs mt-2.5 leading-relaxed text-graphite border-l-2 pl-2.5" style={{ borderColor: p.alasan.length < minKarakterPenanda ? 'var(--amber)' : 'var(--line-strong)' }}>
                          Alasan tertulis: {p.alasan}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted mt-2">Belum terisi</p>
                  )}

                  {k && fit !== null && p?.kandidat_id !== k.id && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-3" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-graphite truncate">
                            Kecocokan {k.nama.split(' ')[0]}
                            {pb && <span className="text-muted"> (tertinggi {pb.nama.split(' ')[0]} {satuDesimal(pb.skor)})</span>}
                          </span>
                          <span className="tabular font-bold">{satuDesimal(fit)}</span>
                        </div>
                        <Meter nilai={fit} maks={100} />
                      </div>
                      <button className="btn btn-primary" onClick={() => tetapkan(s)}><UserPlus className="w-4 h-4" /> Tetapkan</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {modal && k && (
        <ModalAlasan
          slug={slug}
          slot={modal.slot}
          kandidat={k}
          pembanding={modal.pembanding}
          minPenanda={minKarakterPenanda}
          aksi={aksi}
          galat={hasil && !hasil.ok ? hasil.pesan ?? null : null}
          onBatal={() => setModal(null)}
        />
      )}
    </>
  );
}

function ModalAlasan({
  slug,
  slot,
  kandidat,
  pembanding,
  minPenanda,
  aksi,
  galat,
  onBatal,
}: {
  slug: string;
  slot: Slot;
  kandidat: Kandidat;
  pembanding: { nama: string; skor: number };
  minPenanda: number;
  aksi: (fd: FormData) => void;
  galat: string | null;
  onBatal: () => void;
}) {
  const [alasan, setAlasan] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onBatal();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onBatal]);
  const n = alasan.trim().length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(23,32,43,0.45)' }} onClick={onBatal}>
      <div role="dialog" aria-modal="true" aria-labelledby="judul-alasan" className="w-full max-w-lg rounded-[16px] p-6 bg-surface" style={{ boxShadow: '0 24px 60px -20px rgba(23,32,43,0.45)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--amber-soft)' }}>
            <TriangleAlert className="w-4 h-4" style={{ color: 'var(--amber)' }} />
          </span>
          <div>
            <h3 id="judul-alasan" className="font-bold text-[1.05rem]">Tulis alasan penetapan</h3>
            <p className="text-sm text-graphite mt-1 leading-relaxed">
              {kandidat.nama} ({satuDesimal(kandidat.cocok[slot.id])}) dipilih sebagai {slot.nama}, padahal {pembanding.nama} punya kecocokan lebih tinggi ({satuDesimal(pembanding.skor)}). Pilihan ini boleh, asalkan alasannya tercatat.
            </p>
          </div>
        </div>
        <form action={aksi} className="mt-5">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="slot_id" value={slot.id} />
          <input type="hidden" name="kandidat_id" value={kandidat.id} />
          <label htmlFor="alasan" className="label">Alasan</label>
          <textarea id="alasan" ref={ref} name="alasan" rows={4} className="field" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Contoh: dua periode memimpin divisi acara dan sudah dikenal mitra eksternal; kandidat dengan skor lebih tinggi lebih dibutuhkan di bendahara." />
          <div className="flex justify-between gap-3 mt-1.5 text-xs">
            <span className={galat ? 'font-semibold' : ''} style={{ color: galat ? 'var(--telkom)' : n > 0 && n < minPenanda ? 'var(--amber)' : 'var(--muted)' }}>
              {galat ?? (n < MIN_ALASAN ? `Minimal ${MIN_ALASAN} karakter.` : n < minPenanda ? `Alasan di bawah ${minPenanda} karakter akan masuk penanda pola untuk ditinjau.` : 'Tersimpan permanen di jejak audit.')}
            </span>
            <span className="tabular text-muted shrink-0">{n} karakter</span>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-ghost" onClick={onBatal}>Batal</button>
            <TombolKirim disabled={n < MIN_ALASAN}>Simpan penetapan</TombolKirim>
          </div>
        </form>
      </div>
    </div>
  );
}
