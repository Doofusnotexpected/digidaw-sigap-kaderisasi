'use client';

import { useFormState } from 'react-dom';
import { buatOrganisasi } from '@/app/actions/akun';
import { TombolKirim } from '@/components/Tombol';
import { GalatField, PesanAksi } from '@/components/PesanAksi';

export default function FormOrganisasi() {
  const [hasil, aksi] = useFormState(buatOrganisasi, null);
  return (
    <form action={aksi} className="grid gap-4">
      <div>
        <label className="label" htmlFor="nama">Nama organisasi</label>
        <input id="nama" name="nama" className="field" placeholder="Himpunan Mahasiswa Informatika" />
        <GalatField hasil={hasil} nama="nama" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="singkatan">Singkatan</label>
          <input id="singkatan" name="singkatan" className="field" placeholder="HMIF" />
          <GalatField hasil={hasil} nama="singkatan" />
        </div>
        <div>
          <label className="label" htmlFor="jenis">Jenis</label>
          <select id="jenis" name="jenis" className="field"><option value="ORMAWA">Ormawa</option><option value="UKM">UKM</option></select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="slug">Alamat (slug)</label>
        <input id="slug" name="slug" className="field mono" placeholder="hmif" />
        <GalatField hasil={hasil} nama="slug" />
        <p className="hint">Dipakai di URL, misalnya /o/hmif.</p>
      </div>
      <div>
        <label className="label" htmlFor="deskripsi">Deskripsi singkat</label>
        <input id="deskripsi" name="deskripsi" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="email_admin">Email admin pertama (opsional)</label>
        <input id="email_admin" name="email_admin" type="email" className="field" />
        <GalatField hasil={hasil} nama="email_admin" />
      </div>
      <div className="flex items-center gap-3">
        <TombolKirim>Buat organisasi</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}
