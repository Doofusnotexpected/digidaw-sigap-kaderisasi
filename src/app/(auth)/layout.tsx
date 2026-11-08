import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden lg:flex flex-col justify-between p-10 text-white" style={{ background: 'var(--navy)' }}>
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-extrabold text-lg tracking-[-0.02em]">SIGAP Kaderisasi</span>
        </Link>
        <div className="max-w-md">
          <p className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.03em]">Regenerasi organisasi berdasarkan rekam jejak yang terverifikasi, bukan kedekatan.</p>
          <ol className="mt-8 grid gap-3 text-sm" style={{ color: 'var(--navy-text)' }}>
            <li><b className="text-white">1. Catat.</b> Anggota mencatat kontribusi beserta buktinya.</li>
            <li><b className="text-white">2. Verifikasi.</b> Kabid atau Pembina menilai empat aspek.</li>
            <li><b className="text-white">3. Segel.</b> Entri yang disetujui disegel SHA-256 berantai.</li>
            <li><b className="text-white">4. Nilai.</b> Skor dihitung dengan metode SAW.</li>
            <li><b className="text-white">5. Cocokkan.</b> Panitia menetapkan peran, dengan alasan bila perlu.</li>
          </ol>
        </div>
        <p className="text-xs" style={{ color: 'var(--navy-text)' }}>
          Alat bantu keputusan. Keputusan akhir tetap pada panitia.
        </p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
            <Logo />
            <span className="font-extrabold text-lg tracking-[-0.02em]">SIGAP Kaderisasi</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
