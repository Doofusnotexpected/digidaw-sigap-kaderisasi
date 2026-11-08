import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { muatPenilaian, profilPeta } from '@/lib/server/data';
import { skorKecocokan } from '@/lib/saw';
import { satuDesimal, waktu } from '@/lib/format';
import { Catatan, Judul, JudulHalaman, Kosong } from '@/components/ui';
import type { PenetapanPeran, SlotPeran } from '@/lib/types';
import PencocokanPeran from './PencocokanPeran';

export const metadata = { title: 'Pencocokan peran' };

export default async function PenetapanPage({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  const { periode, akses } = ctx;

  if (!periode) {
    return (
      <>
        <JudulHalaman judul="Pencocokan peran" />
        <Kosong judul="Belum ada periode suksesi" isi={akses.kelola ? 'Buat periode dari menu Kelola organisasi.' : 'Admin organisasi belum membuat periode suksesi.'} />
      </>
    );
  }
  if (!akses.lihatPenetapan) {
    return (
      <>
        <JudulHalaman judul="Hasil suksesi" />
        <Kosong judul="Hasil belum diumumkan" isi="Susunan pengurus terlihat oleh seluruh anggota setelah panitia menutup periode suksesi." />
      </>
    );
  }

  const admin = createAdminClient();
  const [{ data: slotData }, { data: penData }, { data: penanda }] = await Promise.all([
    admin.from('slot_peran').select('*').eq('periode_id', periode.id).order('urutan'),
    admin.from('penetapan_peran').select('*').eq('periode_id', periode.id),
    admin.from('penanda_pola').select('subjek_id').eq('periode_id', periode.id).eq('aktif', true).is('ditinjau_pada', null),
  ]);
  const slot = (slotData ?? []) as SlotPeran[];
  const penetapan = (penData ?? []) as PenetapanPeran[];
  const nama = await profilPeta(penetapan.flatMap((p) => [p.kandidat_id, p.ditetapkan_oleh, p.pembanding_id ?? '']));

  if (akses.tetapkan) {
    const { hasil, profil } = await muatPenilaian(ctx.org.id, periode.bobot);
    const ditandai = new Set(((penanda ?? []) as { subjek_id: string }[]).map((p) => p.subjek_id));
    return (
      <>
        <JudulHalaman judul="Pencocokan peran" deskripsi="Pilih kandidat, lalu tetapkan ke slot peran. Bila ada kandidat lain yang lebih cocok untuk peran itu, sistem meminta alasan tertulis yang disimpan di jejak audit." />
        <PencocokanPeran
          slug={ctx.org.slug}
          minKarakterPenanda={periode.ambang.alasan_min_karakter}
          kandidat={hasil.map((h) => ({
            id: h.id,
            nama: h.nama,
            jurusan: profil.get(h.id)?.jurusan ?? '',
            angkatan: profil.get(h.id)?.angkatan ?? null,
            skor: h.skor,
            peringkat: h.peringkat,
            jumlahEntri: h.jumlahEntri,
            rataRata: h.rataRata,
            ditandai: ditandai.has(h.id),
            cocok: Object.fromEntries(slot.map((s) => [s.id, skorKecocokan(h, s.bobot)])),
          }))}
          slot={slot.map((s) => ({ id: s.id, nama: s.nama, bobot: s.bobot }))}
          penetapan={penetapan.map((p) => ({ slot_id: p.slot_id, kandidat_id: p.kandidat_id, skor: Number(p.skor_kecocokan), alasan: p.alasan_tertulis }))}
        />
      </>
    );
  }

  // Tampilan baca saja: auditor, admin, verifikator, atau anggota setelah periode ditutup
  return (
    <>
      <JudulHalaman judul={periode.status === 'DITUTUP' ? 'Hasil suksesi' : 'Pencocokan peran'} deskripsi={periode.status === 'DITUTUP' ? `Susunan pengurus hasil ${periode.nama}.` : 'Tampilan baca saja. Penetapan dilakukan oleh panitia suksesi.'} />
      {periode.status === 'DIBUKA' && <Catatan>Periode masih dibuka; susunan di bawah dapat berubah sampai panitia menutup periode.</Catatan>}
      <section className="panel p-5">
        <Judul judul="Susunan peran" />
        <div className="overflow-x-auto scroll-x">
          <table className="tbl min-w-[720px]">
            <thead><tr><th>Peran</th><th>Kandidat</th><th className="text-right">Kecocokan</th><th className="text-right">Skor SAW</th><th>Alasan tertulis</th><th>Ditetapkan</th></tr></thead>
            <tbody>
              {slot.map((s) => {
                const p = penetapan.find((x) => x.slot_id === s.id);
                return (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.nama}</td>
                    <td>{p ? nama.get(p.kandidat_id)?.nama : <span className="text-muted">Belum terisi</span>}</td>
                    <td className="text-right tabular">{p ? satuDesimal(p.skor_kecocokan) : ''}</td>
                    <td className="text-right tabular">{p ? satuDesimal(p.skor_saw) : ''}</td>
                    <td className="text-xs max-w-[280px]">{p?.alasan_tertulis ? <>{p.alasan_tertulis}{p.pembanding_id && <span className="block text-muted mt-0.5">Pembanding: {nama.get(p.pembanding_id)?.nama} ({satuDesimal(p.kecocokan_tertinggi)})</span>}</> : ''}</td>
                    <td className="text-xs whitespace-nowrap">{p ? <>{nama.get(p.ditetapkan_oleh)?.nama}<span className="block text-muted">{waktu(p.ditetapkan_pada)}</span></> : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
