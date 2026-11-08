import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { organisasiSaya, penggunaWajib } from '@/lib/server/konteks';
import { batalGabung, gabungOrganisasi } from '@/app/actions/akun';
import { JudulHalaman, Judul, Pil, Kosong } from '@/components/ui';
import { TombolKirim } from '@/components/Tombol';
import { NAMA_PERAN } from '@/lib/menu';
import type { Organisasi } from '@/lib/types';

export const metadata = { title: 'Beranda' };

export default async function Beranda() {
  const { profil } = await penggunaWajib();
  const orgs = await organisasiSaya();
  const { data: semua } = await createAdminClient().from('organisasi').select('*').order('nama');
  const global = profil.peran_global !== 'MAHASISWA';
  const aktif = orgs.filter((o) => o.aktif || global);
  const menunggu = orgs.filter((o) => !o.aktif && o.peran.length > 0 && !global);
  const terdaftar = new Set(orgs.filter((o) => o.peran.length > 0).map((o) => o.id));
  const lain = ((semua ?? []) as Organisasi[]).filter((o) => !terdaftar.has(o.id) && !global);

  return (
    <>
      <JudulHalaman atas={`Halo, ${profil.nama.split(' ')[0]}`} judul="Organisasi Anda" deskripsi="Pilih organisasi untuk mencatat kontribusi, memverifikasi, atau mengelola suksesi sesuai peran Anda." />

      <section className="panel p-5">
        <Judul judul={global ? 'Semua organisasi' : 'Keanggotaan aktif'} deskripsi={global ? 'Anda punya akses baca lintas organisasi sebagai pengguna kampus.' : undefined} />
        {aktif.length === 0 ? (
          <Kosong judul="Belum ada keanggotaan aktif" isi="Minta bergabung ke organisasi di bawah. Admin organisasi akan menyetujui permintaan Anda." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {aktif.map((o) => (
              <li key={o.id}>
                <Link href={`/o/${o.slug}`} className="block rounded-[12px] border px-4 py-4 hover:border-[color:var(--navy)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{o.singkatan}</p>
                    <Pil>{o.jenis === 'UKM' ? 'UKM' : 'Ormawa'}</Pil>
                  </div>
                  <p className="text-sm text-graphite mt-0.5">{o.nama}</p>
                  <p className="text-xs text-muted mt-3">{o.peran.length ? o.peran.map((p) => NAMA_PERAN[p]).join(', ') : 'Akses baca kampus'}{o.jabatan ? `, ${o.jabatan}` : ''}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {menunggu.length > 0 && (
        <section className="panel p-5">
          <Judul judul="Menunggu persetujuan" deskripsi="Admin organisasi belum menyetujui permintaan bergabung ini." />
          <ul className="grid gap-2">
            {menunggu.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 inset px-4 py-3">
                <span className="text-sm font-semibold">{o.nama}</span>
                <form action={batalGabung}>
                  <input type="hidden" name="organisasi_id" value={o.id} />
                  <TombolKirim kelas="btn btn-ghost btn-sm">Batalkan permintaan</TombolKirim>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lain.length > 0 && (
        <section className="panel p-5">
          <Judul judul="Gabung organisasi" deskripsi="Anda bergabung sebagai anggota. Peran lain diberikan oleh admin organisasi." />
          <ul className="grid gap-2">
            {lain.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                <span>
                  <span className="text-sm font-semibold">{o.nama}</span>
                  {o.deskripsi && <span className="block text-xs text-graphite">{o.deskripsi}</span>}
                </span>
                <form action={gabungOrganisasi}>
                  <input type="hidden" name="organisasi_id" value={o.id} />
                  <TombolKirim kelas="btn btn-quiet btn-sm">Minta bergabung</TombolKirim>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
