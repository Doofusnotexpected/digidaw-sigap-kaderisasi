import Link from 'next/link';
import { Lock } from 'lucide-react';
import { konteksOrg } from '@/lib/server/konteks';
import { PilPeriode } from '@/components/ui';
import { tanggal } from '@/lib/format';

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);

  if (!ctx.akses.anggota) {
    return (
      <div className="panel p-8 max-w-xl">
        <h1 className="text-xl font-extrabold tracking-[-0.02em]">{ctx.keanggotaan ? 'Menunggu persetujuan admin' : 'Anda belum menjadi anggota'}</h1>
        <p className="text-sm text-graphite mt-2 leading-relaxed">
          {ctx.keanggotaan
            ? `Permintaan bergabung ke ${ctx.org.nama} sudah terkirim. Halaman organisasi terbuka setelah admin menyetujuinya.`
            : `Minta bergabung ke ${ctx.org.nama} dari beranda.`}
        </p>
        <Link href="/beranda" className="btn btn-primary mt-5">Ke beranda</Link>
      </div>
    );
  }

  const p = ctx.periode;
  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-graphite">
          <span className="font-semibold text-ink">{ctx.org.nama}</span>
          {p ? `, ${p.nama}` : ''}
        </p>
        {p ? (
          <div className="flex flex-wrap items-center gap-2 text-xs rounded-[10px] border px-3 py-2 bg-surface self-start md:self-auto" style={{ borderColor: 'var(--line)' }}>
            <PilPeriode status={p.status} />
            <span className="text-graphite">
              {p.status === 'DRAF' ? `Rencana dibuka ${tanggal(p.tanggal_buka)}` : p.status === 'DIBUKA' ? `Dibuka ${tanggal(p.tanggal_buka)}, tutup ${tanggal(p.tanggal_tutup)}` : `Ditutup ${tanggal(p.ditutup_pada)}`}
            </span>
            {p.status !== 'DRAF' && (
              <span className="inline-flex items-center gap-1 text-graphite">
                <Lock className="w-3 h-3" /> Bobot{' '}
                <b className="tabular text-ink">
                  {Math.round(p.bobot.kepemimpinan * 100)}/{Math.round(p.bobot.eksekusi * 100)}/{Math.round(p.bobot.kolaborasi * 100)}/{Math.round(p.bobot.dampak * 100)}
                </b>
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-graphite">Belum ada periode suksesi</span>
        )}
      </div>
      {children}
    </>
  );
}
