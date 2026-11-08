-- =====================================================================
-- SIGAP Kaderisasi: hak akses tabel untuk peran API Supabase.
-- Proyek Supabase baru tidak lagi otomatis memberi GRANT pada tabel di
-- skema public, sehingga perlu dinyatakan eksplisit. RLS tetap berlaku
-- untuk anon/authenticated; service_role hanya dipakai di server.
-- Aman dijalankan berulang kali.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'setujui_dan_segel') then
    raise exception 'Migrasi utama SIGAP (20261108000000_sigap.sql) belum lengkap. Jalankan itu dulu.';
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Server (service_role): akses penuh, dibatasi oleh trigger append-only dan constraint
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Pengguna masuk: baca semua tabel, baris disaring oleh RLS
grant select on all tables in schema public to authenticated;
-- Tulis langsung hanya yang diizinkan RLS
grant insert, update, delete on public.kontribusi to authenticated;
revoke update on public.profil from authenticated;
grant update (nama, nim, jurusan, angkatan) on public.profil to authenticated;

-- Tamu: hanya daftar organisasi (halaman daftar)
grant select on public.organisasi to anon;

-- Fungsi bantu RLS harus bisa dieksekusi peran yang memicu kebijakan
grant execute on function
  public.pembaca_global(),
  public.anggota_aktif(uuid),
  public.punya_peran(uuid, public.peran_org[]),
  public.org_periode(uuid),
  public.bisa_lihat_pengguna(uuid),
  public.bobot_valid(jsonb)
to anon, authenticated;

-- Penyegelan tetap HANYA untuk service_role
revoke all on function public.setujui_dan_segel(uuid, uuid, timestamptz, smallint, smallint, smallint, smallint, text, text, text) from public, anon, authenticated;

-- Tabel yang dibuat kemudian oleh pemilik skema ikut mendapat hak yang sama
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant select on tables to authenticated;
