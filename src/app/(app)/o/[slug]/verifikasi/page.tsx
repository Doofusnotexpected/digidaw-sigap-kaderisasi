import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg, wajib } from '@/lib/server/konteks';
import { profilPeta } from '@/lib/server/data';
import { JudulHalaman } from '@/components/ui';
import type { Kontribusi } from '@/lib/types';
import PanelVerifikasi, { type EntriAntrean } from './PanelVerifikasi';

export const metadata = { title: 'Verifikasi' };

export default async function VerifikasiPage({ params }: { params: { slug: string } }) {
  const ctx = await konteksOrg(params.slug);
  wajib(ctx.akses.verifikasi);
  const admin = createAdminClient();
  const [{ data: menunggu }, { data: riwayat }, { data: disetujui }] = await Promise.all([
    admin.from('kontribusi').select('*').eq('organisasi_id', ctx.org.id).eq('status', 'MENUNGGU').order('dibuat_pada'),
    admin.from('kontribusi').select('*').eq('organisasi_id', ctx.org.id).eq('verifikator_id', ctx.profil.id).neq('status', 'MENUNGGU').order('diverifikasi_pada', { ascending: false }).limit(15),
    admin.from('kontribusi').select('pengguna_id, verifikator_id').eq('organisasi_id', ctx.org.id).eq('status', 'DISETUJUI'),
  ]);
  const antrean = (menunggu ?? []) as Kontribusi[];
  const profil = await profilPeta(antrean.map((e) => e.pengguna_id));
  const hitung = (id: string) => {
    const milik = ((disetujui ?? []) as { pengguna_id: string; verifikator_id: string }[]).filter((d) => d.pengguna_id === id);
    return { total: milik.length, olehSaya: milik.filter((d) => d.verifikator_id === ctx.profil.id).length };
  };

  const data: EntriAntrean[] = antrean.map((e) => {
    const p = profil.get(e.pengguna_id);
    const h = hitung(e.pengguna_id);
    return {
      id: e.id,
      kegiatan: e.kegiatan,
      peran: e.peran_kegiatan,
      periode: e.periode_kegiatan,
      tanggal: e.tanggal_kegiatan,
      uraian: e.uraian,
      adaBukti: !!(e.bukti_url || e.bukti_path),
      jenisBukti: e.bukti_path ? 'berkas' : 'tautan',
      dikirim: e.dibuat_pada,
      pengaju: { nama: p?.nama ?? 'Anggota', nim: p?.nim ?? '', jurusan: p?.jurusan ?? '', angkatan: p?.angkatan ?? null },
      milikSendiri: e.pengguna_id === ctx.profil.id,
      riwayat: h,
    };
  });

  return (
    <>
      <JudulHalaman
        judul="Verifikasi kontribusi"
        deskripsi="Tinjau bukti, beri nilai 1 sampai 5 pada empat aspek, lalu setujui atau tolak dengan catatan. Entri yang disetujui langsung disegel."
      />
      <PanelVerifikasi
        slug={ctx.org.slug}
        antrean={data}
        riwayat={((riwayat ?? []) as Kontribusi[]).map((r) => ({ id: r.id, kegiatan: r.kegiatan, status: r.status, waktu: r.diverifikasi_pada }))}
      />
    </>
  );
}
