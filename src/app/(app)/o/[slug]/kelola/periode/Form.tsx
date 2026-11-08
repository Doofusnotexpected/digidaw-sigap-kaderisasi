'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { buatPeriode, simpanSlot, ubahPeriode } from '@/app/actions/kelola';
import { TombolKirim } from '@/components/Tombol';
import { GalatField, PesanAksi } from '@/components/PesanAksi';
import { ASPEK } from '@/lib/saw';
import { hariIni } from '@/lib/format';
import type { Bobot, PeriodeSuksesi, SlotPeran } from '@/lib/types';

function InputBobot({ awal, awalan = 'bobot_' }: { awal: Bobot; awalan?: string }) {
  const [n, setN] = useState(() => Object.fromEntries(ASPEK.map((a) => [a.key, Math.round(awal[a.key] * 100)])) as Record<string, number>);
  const total = Object.values(n).reduce((s, x) => s + (Number(x) || 0), 0);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ASPEK.map((a) => (
          <div key={a.key}>
            <label className="text-xs text-graphite block mb-1" htmlFor={`${awalan}${a.key}`}>{a.singkat} (%)</label>
            <input id={`${awalan}${a.key}`} name={`bobot_${a.key}`} type="number" min={0} max={100} step={1} value={n[a.key]} onChange={(e) => setN((s) => ({ ...s, [a.key]: Number(e.target.value) }))} className="field tabular !py-1.5" />
          </div>
        ))}
      </div>
      <p className="text-xs mt-1.5 font-semibold tabular" style={{ color: total === 100 ? 'var(--seal)' : 'var(--telkom)' }}>Jumlah {total}%{total !== 100 && ', harus 100%'}</p>
    </div>
  );
}

export function FormBuatPeriode({ slug }: { slug: string }) {
  const [hasil, aksi] = useFormState(buatPeriode, null);
  return (
    <form action={aksi} className="grid gap-4 max-w-2xl">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="label" htmlFor="nama">Nama periode</label>
        <input id="nama" name="nama" className="field" placeholder="Kabinet 2027" />
        <GalatField hasil={hasil} nama="nama" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="tanggal_buka">Tanggal buka</label>
          <input id="tanggal_buka" name="tanggal_buka" type="date" defaultValue={hariIni()} className="field" />
          <GalatField hasil={hasil} nama="tanggal_buka" />
        </div>
        <div>
          <label className="label" htmlFor="tanggal_tutup">Tanggal tutup</label>
          <input id="tanggal_tutup" name="tanggal_tutup" type="date" className="field" />
          <GalatField hasil={hasil} nama="tanggal_tutup" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <TombolKirim>Buat draf periode</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}

export function FormPengaturan({ slug, periode }: { slug: string; periode: PeriodeSuksesi }) {
  const [hasil, aksi] = useFormState(ubahPeriode, null);
  const a = periode.ambang;
  return (
    <form action={aksi} className="grid gap-5">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="nama">Nama periode</label>
          <input id="nama" name="nama" defaultValue={periode.nama} className="field" />
          <GalatField hasil={hasil} nama="nama" />
        </div>
        <div>
          <label className="label" htmlFor="tanggal_buka">Tanggal buka</label>
          <input id="tanggal_buka" name="tanggal_buka" type="date" defaultValue={periode.tanggal_buka} className="field" />
          <p className="hint">Acuan aturan lonjakan persetujuan.</p>
        </div>
        <div>
          <label className="label" htmlFor="tanggal_tutup">Tanggal tutup</label>
          <input id="tanggal_tutup" name="tanggal_tutup" type="date" defaultValue={periode.tanggal_tutup} className="field" />
          <GalatField hasil={hasil} nama="tanggal_tutup" />
        </div>
      </div>
      <fieldset>
        <legend className="label">Bobot aspek SAW</legend>
        <InputBobot awal={periode.bobot} awalan="p_" />
        <GalatField hasil={hasil} nama="bobot" />
      </fieldset>
      <fieldset>
        <legend className="label">Ambang penanda pola</legend>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end">
          {[
            ['lonjakan_jumlah', 'Lonjakan: lebih dari (entri)', a.lonjakan_jumlah],
            ['lonjakan_hari', 'Lonjakan: dalam (hari)', a.lonjakan_hari],
            ['dominan_persen', 'Dominan: lebih dari (%)', a.dominan_persen],
            ['dominan_min_entri', 'Dominan: minimal entri', a.dominan_min_entri],
            ['alasan_min_karakter', 'Alasan: minimal (karakter)', a.alasan_min_karakter],
          ].map(([k, l, v]) => (
            <div key={k as string}>
              <label className="text-xs text-graphite block mb-1" htmlFor={k as string}>{l}</label>
              <input id={k as string} name={k as string} type="number" defaultValue={v as number} className="field tabular !py-1.5" />
              <GalatField hasil={hasil} nama={k as string} />
            </div>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <TombolKirim>Simpan pengaturan</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}

export function FormSlot({ slug, slot, urutanBaru = 0 }: { slug: string; slot: SlotPeran | null; urutanBaru?: number }) {
  const [hasil, aksi] = useFormState(simpanSlot, null);
  const awal: Bobot = slot?.bobot ?? { kepemimpinan: 0.3, eksekusi: 0.3, kolaborasi: 0.2, dampak: 0.2 };
  return (
    <form action={aksi} className="grid gap-3 lg:grid-cols-[minmax(0,220px)_1fr_auto] lg:items-end">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={slot?.id ?? ''} />
      <input type="hidden" name="urutan" value={slot?.urutan ?? urutanBaru} />
      <div>
        <label className="text-xs text-graphite block mb-1" htmlFor={`nama-${slot?.id ?? 'baru'}`}>Nama peran</label>
        <input id={`nama-${slot?.id ?? 'baru'}`} name="nama" defaultValue={slot?.nama} placeholder="Kabid Humas" className="field !py-1.5 font-semibold" />
      </div>
      <InputBobot awal={awal} awalan={`s${slot?.id ?? 'baru'}_`} />
      <div className="flex items-center gap-2 lg:pb-6">
        <TombolKirim kelas="btn btn-quiet btn-sm">{slot ? 'Simpan' : 'Tambah'}</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}
