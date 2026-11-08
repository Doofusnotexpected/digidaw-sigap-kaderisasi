import Link from 'next/link';
import { redirect } from 'next/navigation';
import { pengguna } from '@/lib/server/konteks';
import { Logo } from '@/components/Logo';

export default async function Landing() {
  if (await pengguna()) redirect('/beranda');

  const langkah = [
    ['Catat kontribusi', 'Anggota mengisi kegiatan, peran, periode, uraian, dan bukti.'],
    ['Verifikasi', 'Kabid atau Pembina menilai empat aspek pada skala 1 sampai 5.'],
    ['Segel', 'Entri yang disetujui disegel SHA-256 bersama segel sebelumnya.'],
    ['Nilai', 'Skor kandidat dihitung dengan Simple Additive Weighting.'],
    ['Cocokkan peran', 'Panitia menetapkan peran. Pilihan berskor lebih rendah wajib beralasan.'],
  ];

  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-extrabold tracking-[-0.02em]">SIGAP Kaderisasi</span>
        </div>
        <div className="flex gap-2">
          <Link href="/masuk" className="btn btn-quiet">Masuk</Link>
          <Link href="/daftar" className="btn btn-primary">Daftar</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 pb-16">
        <section className="pt-10 pb-12 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-end">
          <div>
            <p className="text-sm text-graphite">Untuk ormawa dan UKM Telkom University</p>
            <h1 className="text-[2.4rem] sm:text-[3.2rem] font-extrabold leading-[1.05] tracking-[-0.04em] mt-3 max-w-3xl">
              Regenerasi organisasi berdasarkan rekam jejak yang terverifikasi, bukan kedekatan.
            </h1>
            <p className="text-graphite mt-5 max-w-xl leading-relaxed">
              Kontribusi anggota diverifikasi, disegel dengan hash berantai, dinilai lewat SAW, lalu dicocokkan dengan peran. Setiap keputusan panitia meninggalkan jejak audit.
            </p>
            <div className="flex flex-wrap gap-2 mt-7">
              <Link href="/daftar" className="btn btn-primary !py-3 !px-5">Buat akun</Link>
              <Link href="/masuk" className="btn btn-quiet !py-3 !px-5">Masuk ke akun</Link>
            </div>
          </div>
          <div className="panel p-5">
            <p className="text-sm font-bold">Bobot awal penilaian</p>
            <p className="text-xs text-graphite mt-1">Terbuka sejak awal, terkunci begitu periode suksesi dibuka.</p>
            <ul className="mt-4 grid gap-3">
              {[
                ['Konsistensi kepemimpinan', 30],
                ['Keandalan eksekusi', 30],
                ['Kolaborasi', 20],
                ['Dampak organisasi', 20],
              ].map(([n, w]) => (
                <li key={n as string}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{n}</span>
                    <span className="tabular font-bold">{w}%</span>
                  </div>
                  <div className="meter"><span style={{ width: `${(w as number) * 2.5}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel p-6">
          <p className="text-sm font-bold mb-4">Alur kerja</p>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {langkah.map(([j, d], i) => (
              <li key={j}>
                <span className="tabular text-xs font-bold" style={{ color: i === 2 ? 'var(--telkom)' : 'var(--muted)' }}>Langkah {i + 1}</span>
                <p className="font-bold mt-1">{j}</p>
                <p className="text-sm text-graphite mt-1 leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-xs text-muted mt-8 max-w-2xl leading-relaxed">
          SIGAP adalah alat bantu keputusan dan pelengkap TAK, bukan pengganti. Hash berantai mendeteksi perubahan setelah entri disetujui; kebenaran isi awal tetap bergantung pada bukti dan ketelitian verifikator.
        </p>
      </main>
    </div>
  );
}
