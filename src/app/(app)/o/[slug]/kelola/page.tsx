import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { profilPeta } from '@/lib/server/data';
import { keluarkanAnggota } from '@/app/actions/kelola';
import { FormKonfirmasi } from '@/components/FormKonfirmasi';
import { Avatar, Judul, JudulHalaman, Kosong } from '@/components/ui';
import { tanggal } from '@/lib/format';
import type { Keanggotaan } from '@/lib/types';
import Tab from './Tab';
import { FormPeran, FormTambahAnggota } from './FormAnggota';

export const metadata = { title: 'Kelola organisasi' };

export default async function KelolaAnggota({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.kelola);
  const { data } = await createAdminClient().from('keanggotaan').select('*').eq('organisasi_id', ctx.org.id).order('dibuat_pada');
  const semua = (data ?? []) as Keanggotaan[];
  const profil = await profilPeta(semua.map((k) => k.pengguna_id));
  const menunggu = semua.filter((k) => !k.aktif);
  const aktif = semua.filter((k) => k.aktif).sort((a, b) => (profil.get(a.pengguna_id)?.nama ?? '').localeCompare(profil.get(b.pengguna_id)?.nama ?? ''));

  return (
    <>
      <JudulHalaman judul="Kelola organisasi" deskripsi="Setujui anggota baru dan atur peran. Satu orang boleh punya beberapa peran, tetapi tidak dapat memverifikasi entrinya sendiri." aksi={<Tab slug={ctx.org.slug} aktif="anggota" />} />

      {menunggu.length > 0 && (
        <section className="panel p-5">
          <Judul judul={`Permintaan bergabung (${menunggu.length})`} />
          <ul className="grid gap-2">
            {menunggu.map((k) => {
              const p = profil.get(k.pengguna_id);
              return (
                <li key={k.id} className="rounded-[12px] border px-4 py-3" style={{ borderColor: '#ead7b0', background: 'var(--amber-soft)' }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar nama={p?.nama ?? '?'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{p?.nama}</p>
                      <p className="text-xs text-graphite"><span className="mono">{p?.nim}</span>, {p?.jurusan}, {p?.email}. Meminta {tanggal(k.dibuat_pada)}</p>
                    </div>
                    <FormKonfirmasi aksi={keluarkanAnggota} data={{ slug: ctx.org.slug, id: k.id }} label="Tolak" konfirmasi="Ya, tolak" />
                  </div>
                  <div className="mt-3"><FormPeran slug={ctx.org.slug} k={k} setujui /></div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="panel p-5">
        <Judul judul={`Anggota aktif (${aktif.length})`} />
        {aktif.length === 0 ? (
          <Kosong judul="Belum ada anggota aktif" />
        ) : (
          <ul className="grid gap-2">
            {aktif.map((k) => {
              const p = profil.get(k.pengguna_id);
              return (
                <li key={k.id} className="rounded-[12px] border px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar nama={p?.nama ?? '?'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{p?.nama}{k.pengguna_id === ctx.profil.id && <span className="text-xs text-muted font-normal"> (Anda)</span>}</p>
                      <p className="text-xs text-graphite truncate"><span className="mono">{p?.nim}</span>, {p?.email}</p>
                    </div>
                    <FormKonfirmasi aksi={keluarkanAnggota} data={{ slug: ctx.org.slug, id: k.id }} label="Keluarkan" konfirmasi="Ya, keluarkan" kelas="btn btn-ghost btn-sm" />
                  </div>
                  <div className="mt-3"><FormPeran slug={ctx.org.slug} k={k} /></div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel p-5">
        <Judul judul="Tambah anggota dengan email" deskripsi="Untuk orang yang sudah punya akun SIGAP, misalnya Pembina yang akan menjadi verifikator." />
        <FormTambahAnggota slug={ctx.org.slug} />
      </section>
    </>
  );
}
