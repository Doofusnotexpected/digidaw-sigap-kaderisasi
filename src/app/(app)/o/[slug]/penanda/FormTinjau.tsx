'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { tinjauPenanda } from '@/app/actions/penanda';
import { TombolKirim } from '@/components/Tombol';
import { PesanAksi } from '@/components/PesanAksi';

export default function FormTinjau({ slug, id }: { slug: string; id: string }) {
  const [buka, setBuka] = useState(false);
  const [hasil, aksi] = useFormState(tinjauPenanda, null);
  if (!buka) {
    return <button className="btn btn-quiet btn-sm mt-3" onClick={() => setBuka(true)}>Catat hasil tinjauan</button>;
  }
  return (
    <form action={aksi} className="mt-3 grid gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={id} />
      <label className="label !mb-0" htmlFor={`tinjau-${id}`}>Hasil tinjauan</label>
      <textarea id={`tinjau-${id}`} name="catatan" rows={2} className="field" placeholder="Contoh: enam kepanitiaan memang berlangsung serentak, bukti SK lengkap dan sudah dicek ke Kabid lain." />
      <div className="flex items-center gap-2">
        <TombolKirim kelas="btn btn-primary btn-sm">Simpan tinjauan</TombolKirim>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBuka(false)}>Batal</button>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}
