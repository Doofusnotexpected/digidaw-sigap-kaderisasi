import Link from 'next/link';
import FormMasuk from './FormMasuk';

export const metadata = { title: 'Masuk' };

export default function MasukPage({ searchParams }: { searchParams: { lanjut?: string; baru?: string } }) {
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em]">Masuk</h1>
      <p className="text-sm text-graphite mt-1">Gunakan email dan kata sandi akun SIGAP Anda.</p>
      {searchParams.baru && <p className="text-sm mt-4 font-semibold" style={{ color: 'var(--seal)' }}>Akun berhasil dibuat. Silakan masuk.</p>}
      <FormMasuk lanjut={searchParams.lanjut ?? ''} />
      <p className="text-sm text-graphite mt-6">
        Belum punya akun?{' '}
        <Link href="/daftar" className="font-semibold text-ink underline underline-offset-2">
          Daftar
        </Link>
      </p>
    </>
  );
}
