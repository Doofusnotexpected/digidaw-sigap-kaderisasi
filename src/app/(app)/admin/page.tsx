import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { penggunaWajib, wajib } from '@/lib/server/konteks';
import { ubahPeranGlobal } from '@/app/actions/akun';
import { JudulHalaman, Judul, Pil } from '@/components/ui';
import { TombolKirim } from '@/components/Tombol';
import { NAMA_PERAN_GLOBAL } from '@/lib/menu';
import type { Organisasi, Profil } from '@/lib/types';
import FormOrganisasi from './FormOrganisasi';

export const metadata = { title: 'Administrasi kampus' };

export default async function AdminPage({ searchParams }: { searchParams: { q?: string } }) {
  const { profil } = await penggunaWajib();
  wajib(profil.peran_global === 'SUPERADMIN');
  const admin = createAdminClient();
  const q = (searchParams.q ?? '').trim();

  let qp = admin.from('profil').select('*').order('nama').limit(50);
  if (q) qp = qp.or(`nama.ilike.%${q.replace(/[%,()]/g, '')}%,email.ilike.%${q.replace(/[%,()]/g, '')}%,nim.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const [{ data: orgs }, { data: users }, { data: jml }] = await Promise.all([
    admin.from('organisasi').select('*').order('nama'),
    qp,
    admin.from('keanggotaan').select('organisasi_id').eq('aktif', true),
  ]);
  const hitung = new Map<string, number>();
  for (const k of (jml ?? []) as { organisasi_id: string }[]) hitung.set(k.organisasi_id, (hitung.get(k.organisasi_id) ?? 0) + 1);

  return (
    <>
      <JudulHalaman atas="Superadmin" judul="Administrasi kampus" deskripsi="Kelola daftar organisasi dan peran lintas organisasi, misalnya auditor dari Direktorat Kemahasiswaan." />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr] items-start">
        <section className="panel p-5">
          <Judul judul="Organisasi" />
          <ul className="grid gap-2">
            {((orgs ?? []) as Organisasi[]).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                <span>
                  <Link href={`/o/${o.slug}`} className="text-sm font-semibold hover:underline">{o.nama}</Link>
                  <span className="block text-xs text-graphite">/{o.slug}, {hitung.get(o.id) ?? 0} anggota aktif</span>
                </span>
                <Pil>{o.jenis === 'UKM' ? 'UKM' : 'Ormawa'}</Pil>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-5">
          <Judul judul="Tambah organisasi" />
          <FormOrganisasi />
        </section>
      </div>

      <section className="panel p-5">
        <Judul
          judul="Pengguna dan peran global"
          deskripsi="Auditor kampus dapat membaca data, jejak audit, dan peringatan semua organisasi tanpa bisa mengubahnya."
          aksi={
            <form className="flex gap-2">
              <input name="q" defaultValue={q} placeholder="Cari nama, email, NIM" className="field !py-2 w-56" />
              <button className="btn btn-quiet">Cari</button>
            </form>
          }
        />
        <div className="overflow-x-auto scroll-x">
          <table className="tbl min-w-[680px]">
            <thead><tr><th>Nama</th><th>Email</th><th>NIM</th><th>Peran global</th></tr></thead>
            <tbody>
              {((users ?? []) as Profil[]).map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.nama}</td>
                  <td>{u.email}</td>
                  <td className="mono text-xs">{u.nim ?? '-'}</td>
                  <td>
                    <form action={ubahPeranGlobal} className="flex items-center gap-2">
                      <input type="hidden" name="profil_id" value={u.id} />
                      <select name="peran_global" defaultValue={u.peran_global} className="field !py-1.5 !w-auto" disabled={u.id === profil.id}>
                        {Object.entries(NAMA_PERAN_GLOBAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      {u.id !== profil.id && <TombolKirim kelas="btn btn-quiet btn-sm">Simpan</TombolKirim>}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
