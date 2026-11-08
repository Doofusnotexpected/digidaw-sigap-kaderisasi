import Link from 'next/link';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { konteksOrg } from '@/lib/server/konteks';
import { muatPenilaian } from '@/lib/server/data';
import { muatRantai } from '@/lib/server/segelTampil';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';
import { ASPEK, BOBOT_AWAL } from '@/lib/saw';
import { satuDesimal } from '@/lib/format';
import { simulasiUbahData, pulihkanSimulasi } from '@/app/actions/demo';
import RantaiSegel from '@/components/RantaiSegel';
import { TombolKirim } from '@/components/Tombol';
import { Avatar, Judul, JudulHalaman, Meter } from '@/components/ui';

export const metadata = { title: 'Ringkasan' };

export default async function Ringkasan({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  const { akses, org, periode, profil } = ctx;
  const bobot = periode?.bobot ?? BOBOT_AWAL;
  const admin = createAdminClient();

  const [{ laporan, segel }, penilaian, saya, antrean, penanda, slot, terisi] = await Promise.all([
    muatRantai(org.id),
    muatPenilaian(org.id, bobot),
    admin.from('kontribusi').select('status').eq('organisasi_id', org.id).eq('pengguna_id', profil.id),
    akses.verifikasi ? admin.from('kontribusi').select('id', { count: 'exact', head: true }).eq('organisasi_id', org.id).eq('status', 'MENUNGGU').neq('pengguna_id', profil.id) : Promise.resolve({ count: 0 }),
    akses.lihatPenanda && periode ? admin.from('penanda_pola').select('id', { count: 'exact', head: true }).eq('periode_id', periode.id).eq('aktif', true).is('ditinjau_pada', null) : Promise.resolve({ count: 0 }),
    periode ? admin.from('slot_peran').select('id', { count: 'exact', head: true }).eq('periode_id', periode.id) : Promise.resolve({ count: 0 }),
    periode ? admin.from('penetapan_peran').select('id', { count: 'exact', head: true }).eq('periode_id', periode.id) : Promise.resolve({ count: 0 }),
  ]);

  // Anggota biasa hanya melihat nama pada segel miliknya sendiri
  const strip = segel.map((s) => {
    if (akses.lihatAudit || !s.milikOrgIni) return s;
    return s.pemilikId === profil.id ? s : { ...s, label: 'anggota', kegiatan: 'Entri anggota lain', disetujui: null };
  });

  const skorSaya = penilaian.hasil.find((h) => h.id === profil.id);
  const status = ((saya.data ?? []) as { status: string }[]).reduce<Record<string, number>>((a, e) => ({ ...a, [e.status]: (a[e.status] ?? 0) + 1 }), {});

  return (
    <>
      <JudulHalaman judul="Ringkasan" deskripsi="Status rantai segel, kriteria penilaian, dan pekerjaan yang menunggu Anda." />

      <RantaiSegel
        segel={strip}
        utuh={laporan.utuh}
        tanpaSegel={laporan.tanpaSegel.length}
        diperiksaPada={laporan.diperiksaPada}
        aksi={
          env.demoMode && akses.kelola ? (
            <div className="flex gap-2">
              <form action={simulasiUbahData}>
                <input type="hidden" name="slug" value={org.slug} />
                <TombolKirim kelas="btn btn-danger"><FlaskConical className="w-4 h-4" /> Simulasikan pengubahan data</TombolKirim>
              </form>
              {!laporan.utuh && (
                <form action={pulihkanSimulasi}>
                  <input type="hidden" name="slug" value={org.slug} />
                  <TombolKirim kelas="btn btn-quiet"><RotateCcw className="w-4 h-4" /> Pulihkan</TombolKirim>
                </form>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {akses.kontribusi && (
          <section className="panel p-5">
            <Judul judul="Skor saya" />
            {skorSaya ? (
              <>
                <p className="tabular text-[2.2rem] font-extrabold tracking-[-0.03em] leading-none">{satuDesimal(skorSaya.skor)}</p>
                <p className="text-xs text-graphite mt-1">Dari {skorSaya.jumlahEntri} entri terverifikasi</p>
                <div className="grid gap-2.5 mt-4">
                  {ASPEK.map((a) => (
                    <div key={a.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{a.singkat}</span>
                        <span className="tabular font-semibold">{satuDesimal(skorSaya.rataRata[a.key])} / 5</span>
                      </div>
                      <Meter nilai={skorSaya.rataRata[a.key]} maks={5} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-graphite">Skor muncul setelah minimal satu entri Anda disetujui.</p>
            )}
            <p className="text-xs text-graphite mt-4">
              {status.MENUNGGU ?? 0} menunggu, {status.DISETUJUI ?? 0} disetujui, {status.DITOLAK ?? 0} ditolak.{' '}
              <Link href={`/o/${org.slug}/kontribusi`} className="font-semibold text-ink underline underline-offset-2">Catat kontribusi</Link>
            </p>
          </section>
        )}

        {akses.verifikasi && (
          <section className="panel p-5">
            <Judul judul="Antrean verifikasi" />
            <p className="tabular text-[2.2rem] font-extrabold tracking-[-0.03em] leading-none">{antrean.count ?? 0}</p>
            <p className="text-xs text-graphite mt-1">entri menunggu penilaian (di luar entri Anda sendiri)</p>
            <Link href={`/o/${org.slug}/verifikasi`} className="btn btn-primary mt-4">Buka antrean</Link>
          </section>
        )}

        {akses.lihatKandidat && (
          <section className="panel p-5 lg:col-span-1">
            <Judul judul="Kandidat teratas" />
            {penilaian.hasil.length === 0 ? (
              <p className="text-sm text-graphite">Belum ada kandidat dengan entri terverifikasi.</p>
            ) : (
              <ul className="grid gap-2">
                {penilaian.hasil.slice(0, 5).map((h) => (
                  <li key={h.id} className="flex items-center gap-3">
                    <span className="tabular text-xs font-bold w-4" style={{ color: h.peringkat === 1 ? 'var(--telkom)' : 'var(--muted)' }}>{h.peringkat}</span>
                    <Avatar nama={h.nama} ukuran={26} />
                    <span className="text-sm flex-1 truncate">{h.nama}</span>
                    <span className="tabular text-sm font-bold">{satuDesimal(h.skor)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-graphite mt-4">
              {periode ? `${terisi.count ?? 0} dari ${slot.count ?? 0} slot peran terisi. ` : ''}
              {akses.lihatPenanda && `${penanda.count ?? 0} penanda pola belum ditinjau.`}
            </p>
            <Link href={`/o/${org.slug}/kandidat`} className="btn btn-quiet mt-4">Lihat semua kandidat</Link>
          </section>
        )}
      </div>

      <section className="panel p-5">
        <Judul
          judul="Kriteria penilaian"
          deskripsi={periode && periode.status !== 'DRAF' ? 'Bobot ini terkunci sejak periode suksesi dibuka, supaya tidak disesuaikan demi calon tertentu.' : 'Bobot dapat diubah admin sebelum periode suksesi dibuka.'}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ASPEK.map((a) => (
            <div key={a.key} className="inset px-4 py-3.5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold">{a.label}</p>
                <p className="tabular text-lg font-extrabold">{Math.round(bobot[a.key] * 100)}%</p>
              </div>
              <p className="text-xs text-graphite mt-1 leading-relaxed">{a.yangDinilai}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-4">
          Skor SAW: nilai tiap aspek dirata-ratakan dari entri terverifikasi, dinormalkan terhadap nilai tertinggi di antara kandidat (r = x / maks x), lalu dijumlahkan dengan bobot dan ditampilkan dalam skala 100.
        </p>
      </section>
    </>
  );
}
