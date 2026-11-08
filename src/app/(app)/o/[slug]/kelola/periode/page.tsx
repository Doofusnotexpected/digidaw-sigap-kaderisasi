import { Lock } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { bukaPeriode, hapusPeriodeDraf, hapusSlot, tutupPeriode } from '@/app/actions/kelola';
import { FormKonfirmasi } from '@/components/FormKonfirmasi';
import { Catatan, Judul, JudulHalaman, PilPeriode } from '@/components/ui';
import { ASPEK } from '@/lib/saw';
import { NAMA_ATURAN, uraianAturan } from '@/lib/penanda';
import { tanggal } from '@/lib/format';
import type { AturanPola, PeriodeSuksesi, SlotPeran } from '@/lib/types';
import Tab from '../Tab';
import { FormBuatPeriode, FormPengaturan, FormSlot } from './Form';

export const metadata = { title: 'Periode suksesi' };

export default async function KelolaPeriode({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.kelola);
  const admin = createAdminClient();
  const { data: semua } = await admin.from('periode_suksesi').select('*').eq('organisasi_id', ctx.org.id).order('dibuat_pada', { ascending: false });
  const berjalan = ((semua ?? []) as PeriodeSuksesi[]).find((p) => p.status !== 'DITUTUP') ?? null;
  const { data: slotData } = berjalan ? await admin.from('slot_peran').select('*').eq('periode_id', berjalan.id).order('urutan') : { data: [] };
  const slot = (slotData ?? []) as SlotPeran[];
  const draf = berjalan?.status === 'DRAF';

  return (
    <>
      <JudulHalaman
        judul="Periode, bobot, dan slot"
        deskripsi="Bobot dan ambang dapat diubah selama periode masih draf. Begitu periode dibuka, semuanya terkunci di basis data supaya tidak disesuaikan demi calon tertentu."
        aksi={<Tab slug={ctx.org.slug} aktif="periode" />}
      />

      {!berjalan && (
        <section className="panel p-5">
          <Judul judul="Buat periode suksesi" deskripsi="Periode dibuat sebagai draf dengan bobot awal 30/30/20/20 dan lima slot peran bawaan." />
          <FormBuatPeriode slug={ctx.org.slug} />
        </section>
      )}

      {berjalan && (
        <>
          <section className="panel p-5">
            <Judul
              judul={berjalan.nama}
              deskripsi={draf ? 'Masih draf. Periksa bobot, ambang, dan slot sebelum membuka.' : `Dibuka ${tanggal(berjalan.dibuka_pada)}. Bobot, ambang, dan slot terkunci.`}
              aksi={
                <div className="flex flex-wrap items-center gap-2">
                  <PilPeriode status={berjalan.status} />
                  {draf && <FormKonfirmasi aksi={hapusPeriodeDraf} data={{ slug: ctx.org.slug }} label="Hapus draf" konfirmasi="Ya, hapus" kelas="btn btn-ghost btn-sm" />}
                  {draf && (
                    <FormKonfirmasi aksi={bukaPeriode} data={{ slug: ctx.org.slug }} label="Buka periode" konfirmasi="Buka dan kunci bobot" kelas="btn btn-primary btn-sm" kelasKonfirmasi="btn btn-primary btn-sm" />
                  )}
                  {berjalan.status === 'DIBUKA' && <FormKonfirmasi aksi={tutupPeriode} data={{ slug: ctx.org.slug }} label="Tutup periode" konfirmasi="Ya, tutup dan umumkan" />}
                </div>
              }
            />
            {draf ? (
              <FormPengaturan slug={ctx.org.slug} periode={berjalan} />
            ) : (
              <div className="grid gap-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ASPEK.map((a) => (
                    <div key={a.key} className="inset px-4 py-3">
                      <p className="text-xs text-graphite flex items-center gap-1"><Lock className="w-3 h-3" /> {a.label}</p>
                      <p className="tabular text-xl font-extrabold">{Math.round(berjalan.bobot[a.key] * 100)}%</p>
                    </div>
                  ))}
                </div>
                <ul className="grid gap-2 md:grid-cols-3">
                  {(['LONJAKAN_PERSETUJUAN', 'VERIFIKATOR_DOMINAN', 'ALASAN_SINGKAT'] as AturanPola[]).map((a) => (
                    <li key={a} className="inset px-4 py-3 text-xs leading-relaxed"><b className="text-sm block">{NAMA_ATURAN[a]}</b>{uraianAturan(a, berjalan.ambang)}</li>
                  ))}
                </ul>
                <p className="text-xs text-graphite">Rentang periode {tanggal(berjalan.tanggal_buka)} sampai {tanggal(berjalan.tanggal_tutup)}.</p>
              </div>
            )}
          </section>

          <section className="panel p-5">
            <Judul judul={`Slot peran (${slot.length})`} deskripsi="Tiap peran memakai bobot kecocokannya sendiri, misalnya keandalan eksekusi lebih tinggi untuk Bendahara." />
            {!draf && <div className="mb-4"><Catatan>Slot terkunci karena periode sudah dibuka.</Catatan></div>}
            <ul className="grid gap-3">
              {slot.map((s) => (
                <li key={s.id} className="rounded-[12px] border px-4 py-3.5" style={{ borderColor: 'var(--line)' }}>
                  {draf ? (
                    <div className="grid gap-2">
                      <FormSlot slug={ctx.org.slug} slot={s} />
                      <div><FormKonfirmasi aksi={hapusSlot} data={{ slug: ctx.org.slug, id: s.id }} label="Hapus slot" konfirmasi="Ya, hapus" kelas="btn btn-ghost btn-sm !px-0" /></div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-sm font-bold">{s.nama}</p>
                      <p className="text-xs text-graphite tabular">
                        {ASPEK.map((a) => `${a.singkat} ${Math.round(s.bobot[a.key] * 100)}%`).join(', ')}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {draf && (
              <div className="mt-4 inset p-4">
                <p className="text-sm font-semibold mb-3">Tambah slot</p>
                <FormSlot slug={ctx.org.slug} slot={null} urutanBaru={slot.length} />
              </div>
            )}
          </section>
        </>
      )}

      {((semua ?? []) as PeriodeSuksesi[]).filter((p) => p.status === 'DITUTUP').length > 0 && (
        <section className="panel p-5">
          <Judul judul="Periode sebelumnya" />
          <ul className="grid gap-2">
            {((semua ?? []) as PeriodeSuksesi[]).filter((p) => p.status === 'DITUTUP').map((p) => (
              <li key={p.id} className="inset px-4 py-3 flex justify-between text-sm">
                <span className="font-semibold">{p.nama}</span>
                <span className="text-graphite">{tanggal(p.tanggal_buka)} sampai {tanggal(p.ditutup_pada)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
