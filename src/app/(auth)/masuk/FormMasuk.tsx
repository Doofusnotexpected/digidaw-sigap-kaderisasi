'use client';

import { useFormState } from 'react-dom';
import { masuk } from '@/app/actions/auth';
import { TombolKirim } from '@/components/Tombol';
import { PesanAksi } from '@/components/PesanAksi';

export default function FormMasuk({ lanjut }: { lanjut: string }) {
  const [hasil, aksi] = useFormState(masuk, null);
  return (
    <form action={aksi} className="grid gap-4 mt-6">
      <input type="hidden" name="lanjut" value={lanjut} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" placeholder="nama@student.telkomuniversity.ac.id" />
      </div>
      <div>
        <label className="label" htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <PesanAksi hasil={hasil} />
      <TombolKirim kelas="btn btn-primary w-full !py-3">Masuk</TombolKirim>
    </form>
  );
}
