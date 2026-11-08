import Sidebar from '@/components/Sidebar';
import { organisasiSaya, penggunaWajib } from '@/lib/server/konteks';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profil } = await penggunaWajib();
  const orgs = await organisasiSaya();
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        nama={profil.nama}
        email={profil.email}
        peranGlobal={profil.peran_global}
        orgs={orgs.map((o) => ({ slug: o.slug, singkatan: o.singkatan, nama: o.nama, peran: o.peran, aktif: o.aktif }))}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 grid grid-cols-1 gap-6">{children}</div>
      </main>
    </div>
  );
}
