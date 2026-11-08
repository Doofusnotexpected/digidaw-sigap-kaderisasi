'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { konteksOrg } from '@/lib/server/konteks';
import { catatAudit, sinkronPenanda } from '@/lib/server/data';
import { berhasil, gagal, galatZod, segarkanOrg, teks } from '@/lib/server/aksi';
import { bobotValid } from '@/lib/saw';
import type { Bobot, HasilAksi, Keanggotaan, PeranOrg, PeriodeSuksesi } from '@/lib/types';

const SEMUA_PERAN: PeranOrg[] = ['ANGGOTA', 'VERIFIKATOR', 'PANITIA', 'AUDITOR', 'ADMIN'];

async function ctxAdmin(fd: FormData) {
  const slug = teks(fd, 'slug');
  const ctx = await konteksOrg(slug);
  return { slug, ctx, boleh: ctx.akses.kelola };
}

const aktorDari = (ctx: Awaited<ReturnType<typeof konteksOrg>>) => ({ id: ctx.profil.id, nama: ctx.profil.nama });

async function jumlahAdminLain(orgId: string, kecuali: string) {
  const { count } = await createAdminClient()
    .from('keanggotaan')
    .select('id', { count: 'exact', head: true })
    .eq('organisasi_id', orgId)
    .eq('aktif', true)
    .contains('peran', ['ADMIN'])
    .neq('id', kecuali);
  return count ?? 0;
}

// ---------------------------------------------------------------- Anggota

export async function ubahKeanggotaan(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  if (!boleh) return gagal('Hanya admin organisasi yang dapat mengubah peran.');

  const admin = createAdminClient();
  const id = teks(fd, 'id');
  const { data: lamaData } = await admin.from('keanggotaan').select('*').eq('id', id).eq('organisasi_id', ctx.org.id).maybeSingle();
  const lama = lamaData as Keanggotaan | null;
  if (!lama) return gagal('Anggota tidak ditemukan.');

  const peran = SEMUA_PERAN.filter((p) => fd.getAll('peran').includes(p));
  if (peran.length === 0) return gagal('Pilih minimal satu peran.');
  const aktif = fd.get('aktif') === 'on';
  const jabatan = teks(fd, 'jabatan').slice(0, 80) || null;

  const kehilanganAdmin = lama.peran.includes('ADMIN') && lama.aktif && (!peran.includes('ADMIN') || !aktif);
  if (kehilanganAdmin && (await jumlahAdminLain(ctx.org.id, id)) === 0) {
    return gagal('Organisasi harus punya minimal satu admin aktif.');
  }

  await admin.from('keanggotaan').update({ peran, aktif, jabatan }).eq('id', id);
  const { data: p } = await admin.from('profil').select('nama').eq('id', lama.pengguna_id).maybeSingle();
  const nama = (p as { nama: string } | null)?.nama ?? 'Anggota';

  const perubahan: string[] = [];
  if (!lama.aktif && aktif) perubahan.push('keanggotaan disetujui');
  if (lama.aktif && !aktif) perubahan.push('keanggotaan dinonaktifkan');
  if (lama.peran.slice().sort().join() !== peran.slice().sort().join()) perubahan.push(`peran ${lama.peran.join(', ')} menjadi ${peran.join(', ')}`);
  if ((lama.jabatan ?? '') !== (jabatan ?? '')) perubahan.push(`jabatan "${jabatan ?? '-'}"`);

  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: aktorDari(ctx),
    aksi: 'Keanggotaan diubah',
    entitas: 'keanggotaan',
    entitas_id: id,
    keterangan: `${nama}: ${perubahan.join('; ') || 'tanpa perubahan'}.`,
    data: { sebelum: { peran: lama.peran, aktif: lama.aktif, jabatan: lama.jabatan }, sesudah: { peran, aktif, jabatan } },
  });
  segarkanOrg(slug);
  return berhasil(`Keanggotaan ${nama} diperbarui.`);
}

export async function keluarkanAnggota(fd: FormData) {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  if (!boleh) return;
  const admin = createAdminClient();
  const id = teks(fd, 'id');
  const { data } = await admin.from('keanggotaan').select('*').eq('id', id).eq('organisasi_id', ctx.org.id).maybeSingle();
  const k = data as Keanggotaan | null;
  if (!k) return;
  if (k.peran.includes('ADMIN') && (await jumlahAdminLain(ctx.org.id, id)) === 0) return;

  await admin.from('keanggotaan').delete().eq('id', id);
  const { data: p } = await admin.from('profil').select('nama').eq('id', k.pengguna_id).maybeSingle();
  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: aktorDari(ctx),
    aksi: k.aktif ? 'Anggota dikeluarkan' : 'Permintaan bergabung ditolak',
    entitas: 'keanggotaan',
    entitas_id: id,
    keterangan: `${(p as { nama: string } | null)?.nama ?? 'Anggota'}. Rekam jejak kontribusinya tetap tersimpan.`,
  });
  segarkanOrg(slug);
}

export async function tambahAnggota(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  if (!boleh) return gagal('Hanya admin organisasi yang dapat menambah anggota.');
  const email = teks(fd, 'email').toLowerCase();
  const peran = SEMUA_PERAN.filter((p) => fd.getAll('peran').includes(p));
  if (!email) return gagal('Isi email pengguna.', { email: 'Wajib diisi.' });
  if (peran.length === 0) return gagal('Pilih minimal satu peran.');

  const admin = createAdminClient();
  const { data: p } = await admin.from('profil').select('id, nama').eq('email', email).maybeSingle();
  const prof = p as { id: string; nama: string } | null;
  if (!prof) return gagal('Belum ada akun dengan email ini. Minta yang bersangkutan mendaftar dulu.', { email: 'Akun tidak ditemukan.' });

  const { error } = await admin
    .from('keanggotaan')
    .upsert({ pengguna_id: prof.id, organisasi_id: ctx.org.id, peran, aktif: true, jabatan: teks(fd, 'jabatan') || null }, { onConflict: 'pengguna_id,organisasi_id' });
  if (error) return gagal('Anggota gagal ditambahkan.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    aktor: aktorDari(ctx),
    aksi: 'Anggota ditambahkan',
    entitas: 'keanggotaan',
    entitas_id: prof.id,
    keterangan: `${prof.nama} dengan peran ${peran.join(', ')}.`,
  });
  segarkanOrg(slug);
  return berhasil(`${prof.nama} ditambahkan.`);
}

// ---------------------------------------------------------------- Periode

const persen = z.coerce.number().min(0, 'Tidak boleh negatif.').max(100, 'Maksimal 100.');

function bobotDariForm(fd: FormData, awalan = 'bobot_'): Bobot | null {
  const b = {
    kepemimpinan: Number(fd.get(`${awalan}kepemimpinan`)) / 100,
    eksekusi: Number(fd.get(`${awalan}eksekusi`)) / 100,
    kolaborasi: Number(fd.get(`${awalan}kolaborasi`)) / 100,
    dampak: Number(fd.get(`${awalan}dampak`)) / 100,
  };
  // bulatkan agar 0.1 + 0.2 tidak menjadi 0.30000000000000004
  (Object.keys(b) as (keyof Bobot)[]).forEach((k) => (b[k] = Math.round(b[k] * 10000) / 10000));
  return bobotValid(b) ? b : null;
}

const SLOT_AWAL: { nama: string; bobot: Bobot }[] = [
  { nama: 'Ketua', bobot: { kepemimpinan: 0.4, eksekusi: 0.25, kolaborasi: 0.2, dampak: 0.15 } },
  { nama: 'Wakil Ketua', bobot: { kepemimpinan: 0.3, eksekusi: 0.25, kolaborasi: 0.3, dampak: 0.15 } },
  { nama: 'Sekretaris', bobot: { kepemimpinan: 0.15, eksekusi: 0.45, kolaborasi: 0.25, dampak: 0.15 } },
  { nama: 'Bendahara', bobot: { kepemimpinan: 0.15, eksekusi: 0.5, kolaborasi: 0.15, dampak: 0.2 } },
  { nama: 'Kabid HR dan Kaderisasi', bobot: { kepemimpinan: 0.25, eksekusi: 0.2, kolaborasi: 0.35, dampak: 0.2 } },
];

const skemaPeriode = z
  .object({
    nama: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(80),
    tanggal_buka: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal.'),
    tanggal_tutup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal.'),
  })
  .refine((d) => d.tanggal_tutup >= d.tanggal_buka, { message: 'Tanggal tutup harus setelah tanggal buka.', path: ['tanggal_tutup'] });

export async function buatPeriode(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  if (!boleh) return gagal('Hanya admin organisasi yang dapat membuat periode.');
  const parsed = skemaPeriode.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return gagal('Periksa isian periode.', galatZod(parsed.error.issues));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('periode_suksesi')
    .insert({ organisasi_id: ctx.org.id, ...parsed.data })
    .select()
    .single();
  if (error || !data) {
    const ganda = error?.code === '23505';
    return gagal(ganda ? 'Masih ada periode yang belum ditutup. Tutup dulu sebelum membuat yang baru.' : 'Periode gagal dibuat.');
  }
  const periode = data as PeriodeSuksesi;
  await admin.from('slot_peran').insert(SLOT_AWAL.map((s, i) => ({ periode_id: periode.id, nama: s.nama, bobot: s.bobot, urutan: i })));

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: aktorDari(ctx),
    aksi: 'Periode suksesi dibuat',
    entitas: 'periode_suksesi',
    entitas_id: periode.id,
    keterangan: `${periode.nama}, rencana dibuka ${periode.tanggal_buka}. Masih draf: bobot dan slot dapat diubah.`,
  });
  segarkanOrg(slug);
  return berhasil('Periode dibuat sebagai draf. Atur bobot dan slot sebelum membukanya.');
}

export async function ubahPeriode(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  const periode = ctx.periode;
  if (!boleh || !periode) return gagal('Hanya admin organisasi yang dapat mengubah periode.');
  if (periode.status !== 'DRAF') return gagal('Bobot dan tanggal terkunci karena periode sudah dibuka.');

  const parsed = skemaPeriode.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return gagal('Periksa isian periode.', galatZod(parsed.error.issues));
  const bobot = bobotDariForm(fd);
  if (!bobot) return gagal('Jumlah bobot keempat aspek harus 100%.', { bobot: 'Jumlah harus 100%.' });

  const a = z
    .object({
      lonjakan_jumlah: z.coerce.number().int().min(1).max(100),
      lonjakan_hari: z.coerce.number().int().min(1).max(90),
      dominan_persen: persen,
      dominan_min_entri: z.coerce.number().int().min(1).max(100),
      alasan_min_karakter: z.coerce.number().int().min(20).max(1000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!a.success) return gagal('Periksa ambang penanda pola.', galatZod(a.error.issues));

  const { error } = await createAdminClient()
    .from('periode_suksesi')
    .update({ ...parsed.data, bobot, ambang: a.data })
    .eq('id', periode.id)
    .eq('status', 'DRAF');
  if (error) return gagal(error.message.includes('terkunci') ? 'Periode sudah terkunci.' : 'Perubahan gagal disimpan.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: aktorDari(ctx),
    aksi: 'Pengaturan periode diubah',
    entitas: 'periode_suksesi',
    entitas_id: periode.id,
    keterangan: `Bobot ${Math.round(bobot.kepemimpinan * 100)}/${Math.round(bobot.eksekusi * 100)}/${Math.round(bobot.kolaborasi * 100)}/${Math.round(bobot.dampak * 100)}.`,
    data: { sebelum: { bobot: periode.bobot, ambang: periode.ambang }, sesudah: { bobot, ambang: a.data } },
  });
  segarkanOrg(slug);
  return berhasil('Pengaturan periode tersimpan.');
}

export async function bukaPeriode(fd: FormData) {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  const periode = ctx.periode;
  if (!boleh || !periode || periode.status !== 'DRAF') return;
  const admin = createAdminClient();
  const { count } = await admin.from('slot_peran').select('id', { count: 'exact', head: true }).eq('periode_id', periode.id);
  if (!count) return;

  const { data } = await admin
    .from('periode_suksesi')
    .update({ status: 'DIBUKA', dibuka_pada: new Date().toISOString() })
    .eq('id', periode.id)
    .eq('status', 'DRAF')
    .select()
    .single();
  if (!data) return;

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: aktorDari(ctx),
    aksi: 'Periode suksesi dibuka',
    entitas: 'periode_suksesi',
    entitas_id: periode.id,
    keterangan: `${periode.nama} dibuka. Bobot, ambang, dan slot peran kini terkunci.`,
    data: { bobot: periode.bobot, ambang: periode.ambang },
  });
  await sinkronPenanda(data as PeriodeSuksesi);
  segarkanOrg(slug);
}

export async function tutupPeriode(fd: FormData) {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  const periode = ctx.periode;
  if (!boleh || !periode || periode.status !== 'DIBUKA') return;
  const admin = createAdminClient();
  await admin.from('periode_suksesi').update({ status: 'DITUTUP', ditutup_pada: new Date().toISOString() }).eq('id', periode.id).eq('status', 'DIBUKA');
  const { count } = await admin.from('penetapan_peran').select('id', { count: 'exact', head: true }).eq('periode_id', periode.id);
  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: aktorDari(ctx),
    aksi: 'Periode suksesi ditutup',
    entitas: 'periode_suksesi',
    entitas_id: periode.id,
    keterangan: `${periode.nama} ditutup dengan ${count ?? 0} peran terisi. Hasil kini terlihat oleh seluruh anggota.`,
  });
  segarkanOrg(slug);
}

export async function hapusPeriodeDraf(fd: FormData) {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  const periode = ctx.periode;
  if (!boleh || !periode || periode.status !== 'DRAF') return;
  await createAdminClient().from('periode_suksesi').delete().eq('id', periode.id).eq('status', 'DRAF');
  await catatAudit({ organisasi_id: ctx.org.id, aktor: aktorDari(ctx), aksi: 'Draf periode dihapus', keterangan: periode.nama });
  segarkanOrg(slug);
}

// ---------------------------------------------------------------- Slot peran

export async function simpanSlot(_: HasilAksi, fd: FormData): Promise<HasilAksi> {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  const periode = ctx.periode;
  if (!boleh || !periode) return gagal('Hanya admin organisasi yang dapat mengatur slot.');
  if (periode.status !== 'DRAF') return gagal('Slot peran terkunci karena periode sudah dibuka.');

  const nama = teks(fd, 'nama');
  if (nama.length < 2) return gagal('Isi nama peran.', { nama: 'Wajib diisi.' });
  const bobot = bobotDariForm(fd);
  if (!bobot) return gagal('Jumlah bobot peran harus 100%.', { bobot: 'Jumlah harus 100%.' });
  const urutan = Number(fd.get('urutan')) || 0;
  const id = teks(fd, 'id');

  const admin = createAdminClient();
  const { error } = id
    ? await admin.from('slot_peran').update({ nama, bobot, urutan }).eq('id', id).eq('periode_id', periode.id)
    : await admin.from('slot_peran').insert({ periode_id: periode.id, nama, bobot, urutan });
  if (error) return gagal('Slot gagal disimpan.');

  await catatAudit({
    organisasi_id: ctx.org.id,
    periode_id: periode.id,
    aktor: aktorDari(ctx),
    aksi: id ? 'Slot peran diubah' : 'Slot peran ditambahkan',
    entitas: 'slot_peran',
    entitas_id: id || undefined,
    keterangan: `${nama}: bobot ${Math.round(bobot.kepemimpinan * 100)}/${Math.round(bobot.eksekusi * 100)}/${Math.round(bobot.kolaborasi * 100)}/${Math.round(bobot.dampak * 100)}.`,
  });
  segarkanOrg(slug);
  return berhasil(`Slot ${nama} tersimpan.`);
}

export async function hapusSlot(fd: FormData) {
  const { slug, ctx, boleh } = await ctxAdmin(fd);
  const periode = ctx.periode;
  if (!boleh || !periode || periode.status !== 'DRAF') return;
  const { data } = await createAdminClient().from('slot_peran').delete().eq('id', teks(fd, 'id')).eq('periode_id', periode.id).select('nama').maybeSingle();
  if (!data) return;
  await catatAudit({ organisasi_id: ctx.org.id, periode_id: periode.id, aktor: aktorDari(ctx), aksi: 'Slot peran dihapus', keterangan: (data as { nama: string }).nama });
  segarkanOrg(slug);
}
