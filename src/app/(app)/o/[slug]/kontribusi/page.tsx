import Link from 'next/link';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { profilPeta } from '@/lib/server/data';
import { hapusKontribusi } from '@/app/actions/kontribusi';
import { FormKonfirmasi } from '@/components/FormKonfirmasi';
import { Judul, JudulHalaman, Kosong, PilStatus } from '@/components/ui';
import { tanggal, waktu } from '@/lib/format';
import { ASPEK } from '@/lib/saw';
import type { Kontribusi } from '@/lib/types';
import FormKontribusi from './FormKontribusi';

export const metadata = { title: 'Kontribusi saya' };

export default async function KontribusiPage({ params, searchParams }: { params: { slug: string }; searchParams: { ubah?: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.kontribusi);
  const { data } = await createAdminClient()
    .from('kontribusi')
    .select('*')
    .eq('organisasi_id', ctx.org.id)
    .eq('pengguna_id', ctx.profil.id)
    .order('dibuat_pada', { ascending: false });
  const entri = (data ?? []) as Kontribusi[];
  const verif = await profilPeta(entri.map((e) => e.verifikator_id ?? ''));
  const diubah = entri.find((e) => e.id === searchParams.ubah && e.status !== 'DISETUJUI') ?? null;

  return (
    <>
      <JudulHalaman judul="Kontribusi saya" deskripsi="Catat kegiatan beserta buktinya. Kabid atau Pembina akan menilai dan menyegelnya." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        <section className="panel p-5">
          <Judul
            judul={diubah ? (diubah.status === 'DITOLAK' ? 'Perbaiki dan kirim ulang' : 'Ubah entri') : 'Catat kontribusi baru'}
            deskripsi="Bukti wajib dilampirkan: sertifikat, SK kepanitiaan, atau dokumentasi."
            aksi={diubah ? <Link href={`/o/${ctx.org.slug}/kontribusi`} className="btn btn-ghost btn-sm">Batal ubah</Link> : undefined}
          />
          <FormKontribusi key={diubah?.id ?? 'baru'} slug={ctx.org.slug} penggunaId={ctx.profil.id} awal={diubah} />
        </section>

        <section className="panel p-5">
          <Judul judul="Rekam jejak" deskripsi={`${entri.length} entri di ${ctx.org.singkatan}. Entri yang disetujui terkunci dan tidak bisa diubah.`} />
          {entri.length === 0 ? (
            <Kosong judul="Belum ada entri" isi="Mulai dari kegiatan terakhir yang Anda ikuti." />
          ) : (
            <ul className="grid gap-2.5">
              {entri.map((e) => (
                <li key={e.id} className="rounded-[12px] border px-4 py-3.5" style={{ borderColor: e.id === diubah?.id ? 'var(--navy)' : 'var(--line)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{e.kegiatan}</p>
                      <p className="text-xs text-graphite mt-0.5">{e.peran_kegiatan}, {e.periode_kegiatan}. Kegiatan {tanggal(e.tanggal_kegiatan)}</p>
                    </div>
                    <PilStatus status={e.status} />
                  </div>
                  {e.status === 'DISETUJUI' && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {ASPEK.map((a) => (
                        <div key={a.key} className="text-center inset py-1.5">
                          <p className="text-[0.68rem] text-graphite">{a.singkat}</p>
                          <p className="tabular text-sm font-bold">{e[`nilai_${a.key}` as const]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {e.catatan_verifikator && (
                    <p className="text-xs mt-2.5 text-graphite border-l-2 pl-2.5" style={{ borderColor: e.status === 'DITOLAK' ? 'var(--telkom)' : 'var(--line-strong)' }}>
                      {verif.get(e.verifikator_id ?? '')?.nama ?? 'Verifikator'}: {e.catatan_verifikator}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <a href={`/api/bukti/${e.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm !px-1.5">
                      Bukti <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {e.status !== 'DISETUJUI' && (
                      <>
                        <Link href={`?ubah=${e.id}`} className="btn btn-ghost btn-sm !px-1.5"><Pencil className="w-3.5 h-3.5" /> {e.status === 'DITOLAK' ? 'Perbaiki' : 'Ubah'}</Link>
                        <FormKonfirmasi aksi={hapusKontribusi} data={{ slug: ctx.org.slug, id: e.id }} label="Hapus" konfirmasi="Ya, hapus" kelas="btn btn-ghost btn-sm !px-1.5" ikon={<Trash2 className="w-3.5 h-3.5" />} />
                      </>
                    )}
                    {e.status === 'DISETUJUI' && <span className="text-xs text-muted">Disetujui {waktu(e.diverifikasi_pada)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
