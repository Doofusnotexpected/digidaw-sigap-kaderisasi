'use client';

import { useFormState } from 'react-dom';
import { ubahProfil, ubahSandi } from '@/app/actions/akun';
import { TombolKirim } from '@/components/Tombol';
import { GalatField, PesanAksi } from '@/components/PesanAksi';
import type { Profil } from '@/lib/types';

export function FormProfil({ profil }: { profil: Profil }) {
  const [hasil, aksi] = useFormState(ubahProfil, null);
  return (
    <form action={aksi} className="grid gap-4">
      <div>
        <label className="label" htmlFor="nama">Nama lengkap</label>
        <input id="nama" name="nama" defaultValue={profil.nama} className="field" />
        <GalatField hasil={hasil} nama="nama" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="nim">NIM</label>
          <input id="nim" name="nim" defaultValue={profil.nim ?? ''} className="field mono" inputMode="numeric" />
          <GalatField hasil={hasil} nama="nim" />
        </div>
        <div>
          <label className="label" htmlFor="angkatan">Angkatan</label>
          <input id="angkatan" name="angkatan" type="number" defaultValue={profil.angkatan ?? ''} className="field" />
          <GalatField hasil={hasil} nama="angkatan" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="jurusan">Program studi</label>
        <input id="jurusan" name="jurusan" defaultValue={profil.jurusan ?? ''} className="field" />
        <GalatField hasil={hasil} nama="jurusan" />
      </div>
      <div>
        <label className="label">Email</label>
        <p className="text-sm text-graphite">{profil.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <TombolKirim>Simpan profil</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}

export function FormSandi() {
  const [hasil, aksi] = useFormState(ubahSandi, null);
  return (
    <form action={aksi} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="password">Kata sandi baru</label>
          <input id="password" name="password" type="password" autoComplete="new-password" className="field" />
          <GalatField hasil={hasil} nama="password" />
        </div>
        <div>
          <label className="label" htmlFor="password_ulang">Ulangi</label>
          <input id="password_ulang" name="password_ulang" type="password" autoComplete="new-password" className="field" />
          <GalatField hasil={hasil} nama="password_ulang" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <TombolKirim kelas="btn btn-quiet">Ganti kata sandi</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}
