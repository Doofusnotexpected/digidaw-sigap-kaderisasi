'use client';

import { useFormState } from 'react-dom';
import { tambahAnggota, ubahKeanggotaan } from '@/app/actions/kelola';
import { TombolKirim } from '@/components/Tombol';
import { GalatField, PesanAksi } from '@/components/PesanAksi';
import { NAMA_PERAN } from '@/lib/menu';
import type { Keanggotaan, PeranOrg } from '@/lib/types';

const PERAN: PeranOrg[] = ['ANGGOTA', 'VERIFIKATOR', 'PANITIA', 'AUDITOR', 'ADMIN'];

function PilihPeran({ awal }: { awal: PeranOrg[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PERAN.map((p) => (
        <label key={p} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold cursor-pointer has-[:checked]:bg-[color:var(--navy)] has-[:checked]:text-white has-[:checked]:border-[color:var(--navy)]" style={{ borderColor: 'var(--line-strong)' }}>
          <input type="checkbox" name="peran" value={p} defaultChecked={awal.includes(p)} className="sr-only" />
          {NAMA_PERAN[p]}
        </label>
      ))}
    </div>
  );
}

export function FormPeran({ slug, k, setujui = false }: { slug: string; k: Keanggotaan; setujui?: boolean }) {
  const [hasil, aksi] = useFormState(ubahKeanggotaan, null);
  return (
    <form action={aksi} className="flex flex-col lg:flex-row lg:items-center gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={k.id} />
      {setujui ? <input type="hidden" name="aktif" value="on" /> : null}
      <PilihPeran awal={k.peran} />
      <input name="jabatan" defaultValue={k.jabatan ?? ''} placeholder="Jabatan, misal Kabid Internal" className="field !py-1.5 lg:max-w-[220px]" />
      {!setujui && (
        <label className="inline-flex items-center gap-1.5 text-xs">
          <input type="checkbox" name="aktif" defaultChecked={k.aktif} /> Aktif
        </label>
      )}
      <div className="flex items-center gap-2">
        <TombolKirim kelas={setujui ? 'btn btn-primary btn-sm' : 'btn btn-quiet btn-sm'}>{setujui ? 'Setujui dengan peran ini' : 'Simpan'}</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}

export function FormTambahAnggota({ slug }: { slug: string }) {
  const [hasil, aksi] = useFormState(tambahAnggota, null);
  return (
    <form action={aksi} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="email-tambah">Email akun</label>
          <input id="email-tambah" name="email" type="email" className="field" />
          <GalatField hasil={hasil} nama="email" />
        </div>
        <div>
          <label className="label" htmlFor="jabatan-tambah">Jabatan</label>
          <input id="jabatan-tambah" name="jabatan" className="field" placeholder="Pembina" />
        </div>
      </div>
      <PilihPeran awal={['ANGGOTA']} />
      <div className="flex items-center gap-3">
        <TombolKirim>Tambahkan</TombolKirim>
        <PesanAksi hasil={hasil} />
      </div>
    </form>
  );
}
