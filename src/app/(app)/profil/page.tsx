import { Download } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { organisasiSaya, penggunaWajib } from '@/lib/server/konteks';
import { JudulHalaman, Judul, PilStatus, Kosong } from '@/components/ui';
import { tanggal } from '@/lib/format';
import { NAMA_PERAN_GLOBAL } from '@/lib/menu';
import type { Kontribusi } from '@/lib/types';
import { FormProfil, FormSandi } from './Form';

export const metadata = { title: 'Profil' };

export default async function ProfilPage() {
  const { profil } = await penggunaWajib();
  const orgs = await organisasiSaya();
  const { data } = await createAdminClient().from('kontribusi').select('*').eq('pengguna_id', profil.id).order('tanggal_kegiatan', { ascending: false });
  const entri = (data ?? []) as Kontribusi[];
  const disetujui = entri.filter((e) => e.status === 'DISETUJUI').length;

  return (
    <>
      <JudulHalaman atas={NAMA_PERAN_GLOBAL[profil.peran_global]} judul="Profil dan rekam jejak" deskripsi="Rekam jejak Anda tersimpan lintas periode kepengurusan dan lintas organisasi." />

      <div className="grid gap-6 xl:grid-cols-2 items-start">
        <section className="panel p-5">
          <Judul judul="Data diri" />
          <FormProfil profil={profil} />
        </section>

        <div className="grid gap-6">
          <section className="panel p-5">
            <Judul
              judul="Ekspor rekam jejak"
              deskripsi={`${disetujui} entri terverifikasi beserta nomor dan hash segelnya. Hanya Anda sebagai pemilik data yang dapat mengekspor.`}
            />
            <div className="flex flex-wrap gap-2">
              <a href="/api/ekspor?format=csv" className="btn btn-quiet"><Download className="w-4 h-4" /> Unduh CSV</a>
              <a href="/api/ekspor?format=json" className="btn btn-quiet"><Download className="w-4 h-4" /> Unduh JSON</a>
            </div>
          </section>
          <section className="panel p-5">
            <Judul judul="Ganti kata sandi" />
            <FormSandi />
          </section>
        </div>
      </div>

      <section className="panel p-5">
        <Judul judul="Semua entri saya" />
        {entri.length === 0 ? (
          <Kosong judul="Belum ada entri" isi="Catat kontribusi dari halaman organisasi Anda." />
        ) : (
          <div className="overflow-x-auto scroll-x">
            <table className="tbl min-w-[640px]">
              <thead>
                <tr><th>Kegiatan</th><th>Organisasi</th><th>Tanggal</th><th>Status</th></tr>
              </thead>
              <tbody>
                {entri.map((e) => (
                  <tr key={e.id}>
                    <td><span className="font-semibold">{e.kegiatan}</span><span className="block text-xs text-graphite">{e.peran_kegiatan}</span></td>
                    <td>{orgs.find((o) => o.id === e.organisasi_id)?.singkatan ?? '-'}</td>
                    <td className="whitespace-nowrap">{tanggal(e.tanggal_kegiatan)}</td>
                    <td><PilStatus status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
