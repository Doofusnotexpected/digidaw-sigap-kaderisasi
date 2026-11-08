import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { muatPenilaian } from '@/lib/server/data';
import { ASPEK, BOBOT_AWAL } from '@/lib/saw';
import { satuDesimal } from '@/lib/format';
import { Avatar, Judul, JudulHalaman, Kosong, Meter, Pil } from '@/components/ui';

export const metadata = { title: 'Kandidat dan skor' };

export default async function KandidatPage({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.lihatKandidat);
  const bobot = ctx.periode?.bobot ?? BOBOT_AWAL;
  const { hasil, belumDinilai, profil } = await muatPenilaian(ctx.org.id, bobot);
  const { data: pen } = ctx.periode
    ? await createAdminClient().from('penanda_pola').select('subjek_id').eq('periode_id', ctx.periode.id).eq('aktif', true).is('ditinjau_pada', null)
    : { data: [] };
  const ditandai = new Set(((pen ?? []) as { subjek_id: string }[]).map((p) => p.subjek_id));
  const maks = ASPEK.reduce((m, a) => ({ ...m, [a.key]: Math.max(0, ...hasil.map((h) => h.rataRata[a.key])) }), {} as Record<string, number>);
  const tipis = hasil.length > 1 && hasil[0].skor - hasil[1].skor < 3;

  return (
    <>
      <JudulHalaman
        judul="Kandidat dan skor"
        deskripsi="Peringkat dari rata-rata nilai entri terverifikasi dengan metode SAW. Rincian tiap aspek ditampilkan di samping skor akhir supaya keputusan tidak bertumpu pada angka saja."
      />

      <section className="panel p-5">
        <Judul judul={`${hasil.length} kandidat`} deskripsi="Klik nama untuk melihat entri dan buktinya." />
        {hasil.length === 0 ? (
          <Kosong judul="Belum ada kandidat yang bisa dinilai" isi="Kandidat muncul setelah minimal satu entrinya disetujui verifikator." />
        ) : (
          <ul className="grid gap-2">
            {hasil.map((h) => {
              const p = profil.get(h.id);
              return (
                <li key={h.id}>
                  <Link href={`/o/${ctx.org.slug}/kandidat/${h.id}`} className="block rounded-[12px] border px-4 py-3.5 hover:border-[color:var(--navy)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center gap-3">
                      <span className="tabular text-sm font-bold w-6 text-center shrink-0" style={{ color: h.peringkat === 1 ? 'var(--telkom)' : 'var(--muted)' }}>{h.peringkat}</span>
                      <Avatar nama={h.nama} ukuran={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.95rem] font-semibold truncate">{h.nama}</p>
                        <p className="text-xs text-graphite truncate">
                          {p?.jurusan ?? '-'}, angkatan {p?.angkatan ?? '-'}. {h.jumlahEntri} entri terverifikasi
                        </p>
                      </div>
                      {ditandai.has(h.id) && <Pil nada="amber"><TriangleAlert className="w-3 h-3" /> Perlu ditinjau</Pil>}
                      <div className="text-right shrink-0">
                        <p className="tabular text-[1.35rem] font-extrabold leading-none tracking-[-0.02em]">{satuDesimal(h.skor)}</p>
                        <p className="text-[0.7rem] text-muted mt-1">skor SAW</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-3 sm:pl-9">
                      {ASPEK.map((a) => (
                        <div key={a.key}>
                          <div className="flex justify-between text-[0.7rem] text-graphite mb-1">
                            <span>{a.singkat}</span>
                            <span className="tabular font-semibold text-ink">{satuDesimal(h.rataRata[a.key])}</span>
                          </div>
                          <Meter nilai={h.rataRata[a.key]} maks={5} />
                        </div>
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {tipis && <p className="text-xs text-graphite mt-3">Selisih dua teratas kurang dari 3 poin. Bahas lewat rincian aspek dan buktinya, jangan diputuskan oleh angka saja.</p>}
        {belumDinilai.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-graphite mb-2">Anggota yang belum bisa dinilai (belum ada entri disetujui)</p>
            <div className="flex flex-wrap gap-2">
              {belumDinilai.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-2 text-xs rounded-full pl-1 pr-3 py-1 border" style={{ borderColor: 'var(--line)' }}>
                  <Avatar nama={u.nama} ukuran={22} />
                  {u.nama}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {hasil.length > 0 && (
        <section className="panel p-5">
          <Judul judul="Rincian perhitungan SAW" deskripsi={<>r = x / maks(x) per aspek, lalu V = Σ (w × r) × 100. Format sel: rata-rata x / nilai ternormalisasi r.</>} />
          <div className="overflow-x-auto scroll-x">
            <table className="tbl tabular min-w-[760px]">
              <thead>
                <tr>
                  <th>Kandidat</th>
                  {ASPEK.map((a) => (
                    <th key={a.key} className="text-right">{a.singkat} <span className="font-normal text-muted">w = {Math.round(bobot[a.key] * 100)}%</span></th>
                  ))}
                  <th className="text-right">V</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-xs text-muted">maks(x)</td>
                  {ASPEK.map((a) => <td key={a.key} className="text-right text-xs text-muted">{maks[a.key].toFixed(2)}</td>)}
                  <td />
                </tr>
                {hasil.map((h) => (
                  <tr key={h.id}>
                    <td className="font-medium whitespace-nowrap">{h.nama}</td>
                    {ASPEK.map((a) => (
                      <td key={a.key} className="text-right whitespace-nowrap">
                        {h.rataRata[a.key].toFixed(2)} <span className="text-muted">/ {h.normalisasi[a.key].toFixed(3)}</span>
                      </td>
                    ))}
                    <td className="text-right font-bold">{satuDesimal(h.skor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
