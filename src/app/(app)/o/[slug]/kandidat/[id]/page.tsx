import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { muatPenilaian, profilPeta } from '@/lib/server/data';
import { ASPEK, BOBOT_AWAL, skorKecocokan } from '@/lib/saw';
import { NAMA_ATURAN } from '@/lib/penanda';
import { potongHash, satuDesimal, tanggal, waktu } from '@/lib/format';
import { Avatar, Catatan, Judul, Meter } from '@/components/ui';
import type { PenandaPola, SegelHash, SlotPeran } from '@/lib/types';

export default async function DetailKandidat({ params }: { params: { slug: string; id: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.lihatKandidat);
  const bobot = ctx.periode?.bobot ?? BOBOT_AWAL;
  const { hasil, entri, profil } = await muatPenilaian(ctx.org.id, bobot);
  const h = hasil.find((x) => x.id === params.id);
  const p = profil.get(params.id);
  if (!p) notFound();

  const milik = entri.filter((e) => e.pengguna_id === params.id).sort((a, b) => b.tanggal_kegiatan.localeCompare(a.tanggal_kegiatan));
  const admin = createAdminClient();
  const [{ data: segel }, { data: slot }, { data: pen }] = await Promise.all([
    milik.length ? admin.from('segel_hash').select('*').in('kontribusi_id', milik.map((e) => e.id)) : Promise.resolve({ data: [] }),
    ctx.periode ? admin.from('slot_peran').select('*').eq('periode_id', ctx.periode.id).order('urutan') : Promise.resolve({ data: [] }),
    ctx.periode ? admin.from('penanda_pola').select('*').eq('periode_id', ctx.periode.id).eq('subjek_id', params.id).eq('aktif', true) : Promise.resolve({ data: [] }),
  ]);
  const segelPeta = new Map(((segel ?? []) as SegelHash[]).map((s) => [s.kontribusi_id, s]));
  const verif = await profilPeta(milik.map((e) => e.verifikator_id ?? ''));

  return (
    <>
      <Link href={`/o/${ctx.org.slug}/kandidat`} className="btn btn-ghost btn-sm !px-1 w-fit"><ArrowLeft className="w-4 h-4" /> Semua kandidat</Link>
      <header className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar nama={p.nama} ukuran={56} gelap />
        <div className="flex-1">
          <h1 className="text-[1.65rem] font-extrabold tracking-[-0.03em]">{p.nama}</h1>
          <p className="text-sm text-graphite"><span className="mono">{p.nim}</span>, {p.jurusan}, angkatan {p.angkatan}</p>
        </div>
        {h && (
          <div className="text-right">
            <p className="tabular text-[2.4rem] font-extrabold tracking-[-0.03em] leading-none">{satuDesimal(h.skor)}</p>
            <p className="text-xs text-graphite mt-1">skor SAW, peringkat {h.peringkat} dari {hasil.length}</p>
          </div>
        )}
      </header>

      {((pen ?? []) as PenandaPola[]).map((x) => (
        <Catatan key={x.id} nada="amber"><b>{NAMA_ATURAN[x.aturan]}.</b> {x.keterangan} {x.ditinjau_pada ? `Sudah ditinjau: ${x.catatan_tinjauan}` : 'Belum ditinjau.'}</Catatan>
      ))}

      <div className="grid gap-6 xl:grid-cols-2 items-start">
        {h && (
          <section className="panel p-5">
            <Judul judul="Rincian aspek" />
            <div className="grid gap-3">
              {ASPEK.map((a) => (
                <div key={a.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{a.label} <span className="text-muted text-xs">bobot {Math.round(bobot[a.key] * 100)}%</span></span>
                    <span className="tabular font-semibold">{satuDesimal(h.rataRata[a.key])} / 5</span>
                  </div>
                  <Meter nilai={h.rataRata[a.key]} maks={5} />
                </div>
              ))}
            </div>
          </section>
        )}
        {h && ((slot ?? []) as SlotPeran[]).length > 0 && (
          <section className="panel p-5">
            <Judul judul="Kecocokan per peran" deskripsi="Tiap peran memakai bobotnya sendiri." />
            <div className="grid gap-3">
              {((slot ?? []) as SlotPeran[]).map((s) => {
                const f = skorKecocokan(h, s.bobot);
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1"><span>{s.nama}</span><span className="tabular font-semibold">{satuDesimal(f)}</span></div>
                    <Meter nilai={f} maks={100} warna="var(--seal)" />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <section className="panel p-5">
        <Judul judul={`Entri terverifikasi (${milik.length})`} />
        <div className="overflow-x-auto scroll-x">
          <table className="tbl min-w-[860px]">
            <thead><tr><th>Kegiatan</th><th>Tanggal</th>{ASPEK.map((a) => <th key={a.key} className="text-center">{a.singkat}</th>)}<th>Verifikator</th><th>Segel</th><th /></tr></thead>
            <tbody>
              {milik.map((e) => {
                const s = segelPeta.get(e.id);
                return (
                  <tr key={e.id}>
                    <td><span className="font-semibold">{e.kegiatan}</span><span className="block text-xs text-graphite">{e.peran_kegiatan}</span></td>
                    <td className="whitespace-nowrap">{tanggal(e.tanggal_kegiatan)}</td>
                    {ASPEK.map((a) => <td key={a.key} className="text-center tabular font-semibold">{e[`nilai_${a.key}` as const]}</td>)}
                    <td><span className="block">{verif.get(e.verifikator_id ?? '')?.nama}</span><span className="text-xs text-muted">{waktu(e.diverifikasi_pada)}</span></td>
                    <td className="mono text-xs whitespace-nowrap">{s ? <>#{s.urutan} {potongHash(s.hash_entri, 6)}</> : <span style={{ color: 'var(--telkom)' }}>tanpa segel</span>}</td>
                    <td><a href={`/api/bukti/${e.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm !px-1.5">Bukti <ExternalLink className="w-3.5 h-3.5" /></a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
