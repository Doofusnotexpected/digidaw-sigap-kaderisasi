import Link from 'next/link';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { profilPeta } from '@/lib/server/data';
import { muatRantai } from '@/lib/server/segelTampil';
import { env } from '@/lib/env';
import { potongHash, waktu } from '@/lib/format';
import { simulasiUbahData, pulihkanSimulasi } from '@/app/actions/demo';
import RantaiSegel from '@/components/RantaiSegel';
import { TombolKirim } from '@/components/Tombol';
import { Catatan, Judul, JudulHalaman, Kosong, Pil } from '@/components/ui';
import type { JejakAudit, RiwayatPerubahan } from '@/lib/types';

export const metadata = { title: 'Jejak audit' };

const PER_HAL = 30;
const KOLOM_DIBANDING = ['kegiatan', 'peran_kegiatan', 'periode_kegiatan', 'tanggal_kegiatan', 'uraian', 'bukti_url', 'status', 'nilai_kepemimpinan', 'nilai_eksekusi', 'nilai_kolaborasi', 'nilai_dampak', 'catatan_verifikator', 'verifikator_id'] as const;

export default async function AuditPage({ params, searchParams }: { params: { slug: string }; searchParams: { hal?: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.lihatAudit);
  const hal = Math.max(1, Number(searchParams.hal) || 1);
  const admin = createAdminClient();

  const [rantai, { data: jejak, count }, { data: riwayat }] = await Promise.all([
    muatRantai(ctx.org.id),
    admin.from('jejak_audit').select('*', { count: 'exact' }).eq('organisasi_id', ctx.org.id).order('dibuat_pada', { ascending: false }).order('id', { ascending: false }).range((hal - 1) * PER_HAL, hal * PER_HAL - 1),
    admin.from('riwayat_perubahan').select('*').eq('organisasi_id', ctx.org.id).order('id', { ascending: false }).limit(20),
  ]);
  const { laporan, segel }: Awaited<ReturnType<typeof muatRantai>> = rantai;
  const log = (jejak ?? []) as JejakAudit[];
  const ubah = (riwayat ?? []) as RiwayatPerubahan[];
  const nama = await profilPeta(ubah.map((r) => r.diubah_oleh ?? ''));
  const segelOrg = segel.filter((s) => s.milikOrgIni);
  const totalHal = Math.max(1, Math.ceil((count ?? 0) / PER_HAL));

  const WARNA = { utuh: 'hijau', diubah: 'merah', putus: 'merah', hilang: 'merah', terdampak: 'amber' } as const;
  const LABEL = { utuh: 'Cocok', diubah: 'Isi berubah', putus: 'Sambungan putus', hilang: 'Entri hilang', terdampak: 'Terdampak' } as const;

  return (
    <>
      <JudulHalaman judul="Jejak audit" deskripsi="Pemeriksaan rantai segel, riwayat perubahan data yang sudah disetujui, dan catatan seluruh tindakan. Jejak audit hanya bisa ditambah, tidak bisa diubah atau dihapus." />

      <RantaiSegel
        segel={segel}
        utuh={laporan.utuh}
        tanpaSegel={laporan.tanpaSegel.length}
        diperiksaPada={laporan.diperiksaPada}
        aksi={
          env.demoMode && ctx.akses.kelola ? (
            <div className="flex gap-2">
              <form action={simulasiUbahData}>
                <input type="hidden" name="slug" value={ctx.org.slug} />
                <TombolKirim kelas="btn btn-danger"><FlaskConical className="w-4 h-4" /> Simulasikan pengubahan data</TombolKirim>
              </form>
              {!laporan.utuh && (
                <form action={pulihkanSimulasi}>
                  <input type="hidden" name="slug" value={ctx.org.slug} />
                  <TombolKirim kelas="btn btn-quiet"><RotateCcw className="w-4 h-4" /> Pulihkan</TombolKirim>
                </form>
              )}
            </div>
          ) : undefined
        }
      />

      <section className="panel p-5">
        <Judul judul="Buku segel organisasi ini" deskripsi={`${segelOrg.length} entri tersegel. Segel dihitung ulang dari isi entri saat ini dan dibandingkan dengan segel tersimpan.`} aksi={<a href="/api/integritas" target="_blank" rel="noreferrer" className="btn btn-quiet btn-sm">Laporan JSON</a>} />
        {segelOrg.length === 0 ? (
          <Kosong judul="Belum ada segel" />
        ) : (
          <div className="overflow-x-auto scroll-x">
            <table className="tbl min-w-[780px]">
              <thead><tr><th>No.</th><th>Kegiatan</th><th>Pemilik</th><th>Disetujui</th><th>Segel</th><th>Status</th></tr></thead>
              <tbody>
                {segelOrg.map((s) => (
                  <tr key={s.urutan} style={{ background: s.status === 'diubah' || s.status === 'putus' ? 'var(--telkom-soft)' : undefined }}>
                    <td className="tabular text-muted">{s.urutan}</td>
                    <td className="font-medium">{s.kegiatan}</td>
                    <td>{s.label}</td>
                    <td className="text-xs">{s.disetujui?.replace(/^disetujui /, '')}</td>
                    <td className="mono text-xs whitespace-nowrap" title={s.hash_entri}>{potongHash(s.hash_entri)}</td>
                    <td><Pil nada={WARNA[s.status]}>{LABEL[s.status]}</Pil></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {laporan.tanpaSegel.length > 0 && (
          <div className="mt-4"><Catatan nada="merah">{laporan.tanpaSegel.length} entri berstatus disetujui tetapi tidak punya segel. Status kemungkinan diubah langsung di basis data, di luar alur verifikasi.</Catatan></div>
        )}
      </section>

      <section className="panel p-5">
        <Judul judul="Riwayat perubahan entri yang sudah disetujui" deskripsi="Dicatat otomatis oleh basis data setiap kali entri yang sudah disetujui diubah, termasuk perubahan di luar aplikasi." />
        {ubah.length === 0 ? (
          <Kosong judul="Tidak ada perubahan" isi="Entri yang sudah disetujui belum pernah diubah." />
        ) : (
          <ul className="grid gap-2">
            {ubah.map((r) => {
              const beda = KOLOM_DIBANDING.filter((k) => JSON.stringify(r.data_lama?.[k] ?? null) !== JSON.stringify(r.data_baru?.[k] ?? null));
              return (
                <li key={r.id} className="inset px-4 py-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-sm font-semibold">{String(r.data_lama?.kegiatan ?? r.kontribusi_id)}</p>
                    <p className="text-xs text-muted">{waktu(r.diubah_pada)}, oleh {r.diubah_oleh ? nama.get(r.diubah_oleh)?.nama : `peran basis data ${r.peran_db}`}</p>
                  </div>
                  <ul className="mt-1.5 text-xs grid gap-0.5">
                    {beda.length === 0 && <li className="text-muted">Tidak ada kolom isi yang berubah.</li>}
                    {beda.map((k) => (
                      <li key={k} className="mono">
                        {k}: <span style={{ color: 'var(--telkom)' }}>{JSON.stringify(r.data_lama?.[k] ?? null)}</span> menjadi <span style={{ color: 'var(--seal)' }}>{JSON.stringify(r.data_baru?.[k] ?? null)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel p-5">
        <Judul judul="Catatan tindakan" deskripsi={`${count ?? 0} catatan, terbaru di atas.`} />
        <ol className="grid">
          {log.map((l, i) => (
            <li key={l.id} className="relative pl-6 pb-4">
              {i < log.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px" style={{ background: 'var(--line)' }} />}
              <span
                className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 bg-surface"
                style={{ borderColor: /Simulasi|tanpa/i.test(l.aksi) ? 'var(--telkom)' : /Penetapan|Penanda/.test(l.aksi) ? 'var(--amber)' : 'var(--navy)' }}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-semibold">{l.aksi}</p>
                <time className="text-xs text-muted tabular">{waktu(l.dibuat_pada)}</time>
              </div>
              <p className="text-xs text-graphite mt-0.5">{l.aktor_nama ?? 'Sistem'}</p>
              {l.keterangan && <p className="text-[0.82rem] mt-1 leading-relaxed max-w-prose">{l.keterangan}</p>}
            </li>
          ))}
        </ol>
        {totalHal > 1 && (
          <div className="flex items-center gap-2 mt-2">
            {hal > 1 && <Link href={`?hal=${hal - 1}`} className="btn btn-quiet btn-sm">Lebih baru</Link>}
            <span className="text-xs text-graphite">Halaman {hal} dari {totalHal}</span>
            {hal < totalHal && <Link href={`?hal=${hal + 1}`} className="btn btn-quiet btn-sm">Lebih lama</Link>}
          </div>
        )}
      </section>
    </>
  );
}
