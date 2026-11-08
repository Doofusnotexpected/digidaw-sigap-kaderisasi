'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { Paperclip, Send, X } from 'lucide-react';
import { simpanKontribusi } from '@/app/actions/kontribusi';
import { createClient } from '@/lib/supabase/client';
import { TombolKirim } from '@/components/Tombol';
import { GalatField, PesanAksi } from '@/components/PesanAksi';
import { TIPE_BUKTI, UKURAN_BUKTI_MAKS } from '@/lib/konstanta';
import { hariIni } from '@/lib/format';
import type { Kontribusi } from '@/lib/types';

export default function FormKontribusi({ slug, penggunaId, awal }: { slug: string; penggunaId: string; awal: Kontribusi | null }) {
  const [hasil, aksi] = useFormState(simpanKontribusi, null);
  const [path, setPath] = useState(awal?.bukti_path ?? '');
  const [namaBerkas, setNamaBerkas] = useState(awal?.bukti_path ? awal.bukti_path.split('/').pop() ?? '' : '');
  const [unggah, setUnggah] = useState<'diam' | 'jalan' | 'gagal'>('diam');
  const [galatBerkas, setGalatBerkas] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const g = (k: string) => !!hasil?.galat?.[k];

  useEffect(() => {
    if (hasil?.ok && !awal) {
      formRef.current?.reset();
      setPath('');
      setNamaBerkas('');
    }
  }, [hasil, awal]);

  async function pilihBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setGalatBerkas('');
    if (!TIPE_BUKTI.includes(f.type)) return setGalatBerkas('Format harus PDF, PNG, JPG, atau WEBP.');
    if (f.size > UKURAN_BUKTI_MAKS) return setGalatBerkas('Ukuran berkas maksimal 5 MB.');
    setUnggah('jalan');
    const aman = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const tujuan = `${penggunaId}/${crypto.randomUUID()}-${aman}`;
    const { error } = await createClient().storage.from('bukti').upload(tujuan, f, { contentType: f.type, upsert: false });
    if (error) {
      setUnggah('gagal');
      setGalatBerkas('Unggahan gagal. Periksa koneksi lalu coba lagi.');
      return;
    }
    setPath(tujuan);
    setNamaBerkas(f.name);
    setUnggah('diam');
  }

  return (
    <form ref={formRef} action={aksi} className="grid gap-4" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={awal?.id ?? ''} />
      <input type="hidden" name="bukti_path" value={path} />

      <div>
        <label className="label" htmlFor="kegiatan">Nama kegiatan</label>
        <input id="kegiatan" name="kegiatan" defaultValue={awal?.kegiatan} className="field" placeholder="Telkom Leadership Camp 2026" aria-invalid={g('kegiatan')} />
        <GalatField hasil={hasil} nama="kegiatan" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="peran_kegiatan">Peran Anda</label>
          <input id="peran_kegiatan" name="peran_kegiatan" defaultValue={awal?.peran_kegiatan} className="field" placeholder="Koordinator divisi acara" aria-invalid={g('peran_kegiatan')} />
          <GalatField hasil={hasil} nama="peran_kegiatan" />
        </div>
        <div>
          <label className="label" htmlFor="periode_kegiatan">Periode</label>
          <input id="periode_kegiatan" name="periode_kegiatan" defaultValue={awal?.periode_kegiatan} className="field" placeholder="Agu – Okt 2026" aria-invalid={g('periode_kegiatan')} />
          <GalatField hasil={hasil} nama="periode_kegiatan" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tanggal_kegiatan">Tanggal kegiatan (atau tanggal selesai)</label>
        <input id="tanggal_kegiatan" name="tanggal_kegiatan" type="date" max={hariIni()} defaultValue={awal?.tanggal_kegiatan} className="field sm:max-w-[220px]" aria-invalid={g('tanggal_kegiatan')} />
        <GalatField hasil={hasil} nama="tanggal_kegiatan" />
      </div>
      <div>
        <label className="label" htmlFor="uraian">Uraian singkat</label>
        <textarea id="uraian" name="uraian" rows={3} defaultValue={awal?.uraian} className="field" placeholder="Apa yang Anda kerjakan dan hasilnya." />
        <GalatField hasil={hasil} nama="uraian" />
      </div>

      <fieldset className="inset p-4 grid gap-3">
        <legend className="text-sm font-semibold px-1">Bukti</legend>
        <div>
          <label className="label" htmlFor="bukti_url">Tautan bukti</label>
          <input id="bukti_url" name="bukti_url" defaultValue={awal?.bukti_url ?? ''} className="field" placeholder="https://drive.google.com/…" inputMode="url" aria-invalid={g('bukti_url')} />
          <GalatField hasil={hasil} nama="bukti_url" />
        </div>
        <div>
          <p className="label">atau unggah berkas</p>
          {path ? (
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="w-4 h-4 text-graphite" />
              <span className="truncate">{namaBerkas}</span>
              <button type="button" className="btn btn-ghost btn-sm !p-1" onClick={() => { setPath(''); setNamaBerkas(''); }} aria-label="Lepas berkas">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="btn btn-quiet cursor-pointer">
              <Paperclip className="w-4 h-4" /> {unggah === 'jalan' ? 'Mengunggah…' : 'Pilih berkas'}
              <input type="file" accept={TIPE_BUKTI.join(',')} className="sr-only" onChange={pilihBerkas} disabled={unggah === 'jalan'} />
            </label>
          )}
          {galatBerkas ? <p className="error-text">{galatBerkas}</p> : <p className="hint">PDF atau gambar, maksimal 5 MB. Hanya Anda dan pengurus berwenang yang dapat membukanya.</p>}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <TombolKirim disabled={unggah === 'jalan'}>
          <Send className="w-4 h-4" /> {awal ? 'Simpan dan kirim ulang' : 'Kirim untuk diverifikasi'}
        </TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}
