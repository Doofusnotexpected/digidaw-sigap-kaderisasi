'use client';

// Menangkap error di semua halaman dan layout di bawah root,
// supaya kegagalan server tidak tampil sebagai layar kosong.
export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="panel p-8 max-w-xl w-full">
        <h1 className="text-xl font-extrabold tracking-[-0.02em]">Halaman gagal dimuat</h1>
        <p className="text-sm text-graphite mt-2 leading-relaxed">
          Biasanya karena isi .env.local belum lengkap, migrasi database belum dijalankan, atau koneksi ke Supabase gagal. Detail lengkap ada di terminal tempat server berjalan.
        </p>
        {error.message && <pre className="inset mono text-xs p-3 mt-4 whitespace-pre-wrap break-words">{error.message}</pre>}
        {error.digest && <p className="text-xs text-muted mt-2 mono">Kode: {error.digest}</p>}
        <button className="btn btn-primary mt-5" onClick={reset}>Coba lagi</button>
      </div>
    </div>
  );
}
