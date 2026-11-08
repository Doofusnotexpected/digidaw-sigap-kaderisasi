import Link from 'next/link';

export default function TidakBerwenang() {
  return (
    <div className="panel p-8 max-w-xl">
      <h1 className="text-xl font-extrabold tracking-[-0.02em]">Halaman ini tidak tersedia untuk peran Anda</h1>
      <p className="text-sm text-graphite mt-2 leading-relaxed">
        Akses di SIGAP dibatasi menurut peran. Bila Anda merasa seharusnya punya akses, minta admin organisasi menambahkan peran yang sesuai.
      </p>
      <Link href="/beranda" className="btn btn-primary mt-5">Kembali ke beranda</Link>
    </div>
  );
}
