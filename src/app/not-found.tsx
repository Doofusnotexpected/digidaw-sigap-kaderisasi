import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="panel p-8 max-w-md">
        <h1 className="text-xl font-extrabold tracking-[-0.02em]">Halaman tidak ditemukan</h1>
        <p className="text-sm text-graphite mt-2">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
        <Link href="/beranda" className="btn btn-primary mt-5">Ke beranda</Link>
      </div>
    </div>
  );
}
