'use client';

import { useFormState } from 'react-dom';
import { daftar } from '@/app/actions/auth';
import { TombolKirim } from '@/components/Tombol';
import { GalatField, PesanAksi } from '@/components/PesanAksi';
import type { Organisasi } from '@/lib/types';

export default function FormDaftar({ organisasi }: { organisasi: Pick<Organisasi, 'id' | 'nama' | 'singkatan'>[] }) {
  const [hasil, aksi] = useFormState(daftar, null);
  const g = (k: string) => !!hasil?.galat?.[k];
  return (
    <form action={aksi} className="grid gap-4 mt-6" noValidate>
      <div>
        <label className="label" htmlFor="nama">Nama lengkap</label>
        <input id="nama" name="nama" className="field" autoComplete="name" aria-invalid={g('nama')} required />
        <GalatField hasil={hasil} nama="nama" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="nim">NIM</label>
          <input id="nim" name="nim" className="field mono" inputMode="numeric" aria-invalid={g('nim')} required />
          <GalatField hasil={hasil} nama="nim" />
        </div>
        <div>
          <label className="label" htmlFor="angkatan">Angkatan</label>
          <input id="angkatan" name="angkatan" type="number" min={2000} max={2100} className="field" placeholder="2023" aria-invalid={g('angkatan')} required />
          <GalatField hasil={hasil} nama="angkatan" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="jurusan">Program studi</label>
        <input id="jurusan" name="jurusan" className="field" placeholder="S1 Informatika" aria-invalid={g('jurusan')} required />
        <GalatField hasil={hasil} nama="jurusan" />
      </div>
      <div>
        <label className="label" htmlFor="organisasi_id">Organisasi yang ingin diikuti</label>
        <select id="organisasi_id" name="organisasi_id" className="field" defaultValue="">
          <option value="">Pilih nanti</option>
          {organisasi.map((o) => (
            <option key={o.id} value={o.id}>{o.nama}</option>
          ))}
        </select>
        <p className="hint">Admin organisasi akan menyetujui keanggotaan Anda.</p>
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="field" aria-invalid={g('email')} required />
        <GalatField hasil={hasil} nama="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="field" aria-invalid={g('password')} required />
        <GalatField hasil={hasil} nama="password" />
        {!g('password') && <p className="hint">Minimal 8 karakter.</p>}
      </div>
      <PesanAksi hasil={hasil} />
      <TombolKirim kelas="btn btn-primary w-full !py-3">Buat akun dan masuk</TombolKirim>
    </form>
  );
}
