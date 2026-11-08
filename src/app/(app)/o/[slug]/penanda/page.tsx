import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { profilPeta } from '@/lib/server/data';
import { jalankanPemeriksaan } from '@/app/actions/penanda';
import { NAMA_ATURAN, uraianAturan } from '@/lib/penanda';
import { waktu } from '@/lib/format';
import { Judul, JudulHalaman, Kosong, Pil } from '@/components/ui';
import { TombolKirim } from '@/components/Tombol';
import type { AturanPola, PenandaPola } from '@/lib/types';
import FormTinjau from './FormTinjau';

export const metadata = { title: 'Penanda pola' };

export default async function PenandaPage({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.lihatPenanda);
  const { periode } = ctx;
  if (!periode) {
    return (
      <>
        <JudulHalaman judul="Penanda pola" />
        <Kosong judul="Belum ada periode suksesi" isi="Penanda pola diperiksa terhadap tanggal buka periode suksesi." />
      </>
    );
  }
  const { data } = await createAdminClient().from('penanda_pola').select('*').eq('periode_id', periode.id).order('aktif', { ascending: false }).order('diperbarui_pada', { ascending: false });
  const semua = (data ?? []) as PenandaPola[];
  const nama = await profilPeta(semua.flatMap((p) => [p.subjek_id, p.ditinjau_oleh ?? '']));
  const aktif = semua.filter((p) => p.aktif);
  const padam = semua.filter((p) => !p.aktif);

  return (
    <>
      <JudulHalaman
        judul="Penanda pola"
        deskripsi="Aturan sederhana tanpa AI. Setiap peringatan menyebut aturan yang terpicu dan data yang mendasarinya. Peringatan adalah bahan tinjauan, bukan bukti pelanggaran."
        aksi={
          periode.status !== 'DITUTUP' && (
            <form action={jalankanPemeriksaan}>
              <input type="hidden" name="slug" value={ctx.org.slug} />
              <TombolKirim kelas="btn btn-quiet"><RefreshCw className="w-4 h-4" /> Periksa ulang sekarang</TombolKirim>
            </form>
          )
        }
      />

      <section className="panel p-5">
        <Judul judul="Aturan yang dipakai" deskripsi={periode.status === 'DRAF' ? 'Ambang dapat diatur admin selama periode masih draf.' : 'Ambang terkunci bersama bobot sejak periode dibuka.'} />
        <ul className="grid gap-3 md:grid-cols-3">
          {(['LONJAKAN_PERSETUJUAN', 'VERIFIKATOR_DOMINAN', 'ALASAN_SINGKAT'] as AturanPola[]).map((a) => (
            <li key={a} className="inset px-4 py-3.5">
              <p className="text-sm font-bold">{NAMA_ATURAN[a]}</p>
              <p className="text-xs text-graphite mt-1 leading-relaxed">{uraianAturan(a, periode.ambang)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <Judul judul={`Peringatan aktif (${aktif.length})`} />
        {aktif.length === 0 ? (
          <Kosong judul="Tidak ada aturan yang terpicu" isi="Pemeriksaan berjalan otomatis setiap ada persetujuan entri dan penetapan peran." />
        ) : (
          <ul className="grid gap-3">
            {aktif.map((p) => (
              <li key={p.id} className="rounded-[12px] border px-4 py-4" style={{ borderColor: p.ditinjau_pada ? 'var(--line)' : '#ead7b0', background: p.ditinjau_pada ? 'var(--surface)' : 'var(--amber-soft)' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">
                      {NAMA_ATURAN[p.aturan]}:{' '}
                      <Link href={`/o/${ctx.org.slug}/kandidat/${p.subjek_id}`} className="underline underline-offset-2">{nama.get(p.subjek_id)?.nama}</Link>
                    </p>
                    <p className="text-sm mt-1 leading-relaxed">{p.keterangan}</p>
                    <p className="text-xs text-muted mt-1">Pertama terpicu {waktu(p.dibuat_pada)}, diperbarui {waktu(p.diperbarui_pada)}</p>
                  </div>
                  {p.ditinjau_pada ? <Pil nada="hijau">Sudah ditinjau</Pil> : <Pil nada="amber">Belum ditinjau</Pil>}
                </div>
                {p.ditinjau_pada ? (
                  <p className="text-xs mt-3 border-l-2 pl-2.5 text-graphite" style={{ borderColor: 'var(--seal)' }}>
                    {nama.get(p.ditinjau_oleh ?? '')?.nama}, {waktu(p.ditinjau_pada)}: {p.catatan_tinjauan}
                  </p>
                ) : (
                  ctx.akses.tinjauPenanda && <FormTinjau slug={ctx.org.slug} id={p.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {padam.length > 0 && (
        <section className="panel p-5">
          <Judul judul="Tidak lagi terpicu" deskripsi="Data berubah sehingga aturan tidak terpenuhi lagi. Disimpan sebagai riwayat." />
          <ul className="grid gap-2">
            {padam.map((p) => (
              <li key={p.id} className="inset px-4 py-3 text-sm">
                <b>{NAMA_ATURAN[p.aturan]}</b>: {p.keterangan}
                {p.catatan_tinjauan && <span className="block text-xs text-graphite mt-1">Tinjauan: {p.catatan_tinjauan}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
