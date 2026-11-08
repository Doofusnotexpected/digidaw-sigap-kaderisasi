-- =====================================================================
-- SIGAP Kaderisasi: skema basis data
-- Mengikuti Gambar 3 proposal (pengguna, organisasi, periode_suksesi,
-- kontribusi, segel_hash, penetapan_peran, penanda_pola) ditambah
-- keanggotaan, slot_peran, jejak_audit, dan riwayat_perubahan.
--
-- Prinsip akses:
--   * RLS mengatur siapa boleh MEMBACA apa, sesuai peran.
--   * Penulisan langsung dari browser hanya untuk hal milik sendiri
--     (profil, kontribusi yang belum disetujui).
--   * Tindakan berwenang (verifikasi, penyegelan, penetapan, kelola)
--     dijalankan di server Next.js setelah pengecekan peran.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------
create type public.peran_org as enum ('ANGGOTA', 'VERIFIKATOR', 'PANITIA', 'AUDITOR', 'ADMIN');
create type public.peran_global as enum ('MAHASISWA', 'AUDITOR_KAMPUS', 'SUPERADMIN');
create type public.jenis_organisasi as enum ('ORMAWA', 'UKM');
create type public.status_kontribusi as enum ('MENUNGGU', 'DISETUJUI', 'DITOLAK');
create type public.status_periode as enum ('DRAF', 'DIBUKA', 'DITUTUP');
create type public.aturan_pola as enum ('LONJAKAN_PERSETUJUAN', 'VERIFIKATOR_DOMINAN', 'ALASAN_SINGKAT');

-- ---------------------------------------------------------------------
-- Validasi bobot: empat aspek, tidak negatif, jumlahnya 1
-- ---------------------------------------------------------------------
create or replace function public.bobot_valid(b jsonb)
returns boolean
language sql
immutable
as $$
  select b ?& array['kepemimpinan', 'eksekusi', 'kolaborasi', 'dampak']
     and (b->>'kepemimpinan')::numeric >= 0
     and (b->>'eksekusi')::numeric >= 0
     and (b->>'kolaborasi')::numeric >= 0
     and (b->>'dampak')::numeric >= 0
     and abs(
           (b->>'kepemimpinan')::numeric + (b->>'eksekusi')::numeric
         + (b->>'kolaborasi')::numeric + (b->>'dampak')::numeric - 1
         ) < 0.0001
$$;

-- ---------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------
create table public.organisasi (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  nama        text not null check (char_length(nama) between 3 and 120),
  singkatan   text not null check (char_length(singkatan) between 2 and 30),
  jenis       public.jenis_organisasi not null,
  deskripsi   text,
  dibuat_pada timestamptz not null default now()
);

create table public.profil (
  id           uuid primary key references auth.users (id) on delete cascade,
  nama         text not null check (char_length(nama) between 2 and 120),
  email        text not null,
  nim          text unique check (nim ~ '^[0-9]{6,15}$'),
  jurusan      text,
  angkatan     int check (angkatan between 2000 and 2100),
  peran_global public.peran_global not null default 'MAHASISWA',
  dibuat_pada  timestamptz not null default now()
);

create table public.keanggotaan (
  id            uuid primary key default gen_random_uuid(),
  pengguna_id   uuid not null references public.profil (id) on delete cascade,
  organisasi_id uuid not null references public.organisasi (id) on delete cascade,
  peran         public.peran_org[] not null default '{ANGGOTA}',
  jabatan       text,
  aktif         boolean not null default false, -- false = menunggu persetujuan admin
  dibuat_pada   timestamptz not null default now(),
  unique (pengguna_id, organisasi_id),
  check (cardinality(peran) > 0)
);

create table public.periode_suksesi (
  id            uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi (id) on delete cascade,
  nama          text not null check (char_length(nama) between 3 and 80),
  tanggal_buka  date not null,
  tanggal_tutup date not null,
  status        public.status_periode not null default 'DRAF',
  bobot         jsonb not null default '{"kepemimpinan":0.3,"eksekusi":0.3,"kolaborasi":0.2,"dampak":0.2}',
  ambang        jsonb not null default '{"lonjakan_jumlah":5,"lonjakan_hari":7,"dominan_persen":70,"dominan_min_entri":4,"alasan_min_karakter":60}',
  dibuka_pada   timestamptz,
  ditutup_pada  timestamptz,
  dibuat_pada   timestamptz not null default now(),
  check (tanggal_tutup >= tanggal_buka),
  check (public.bobot_valid(bobot))
);
-- Satu periode yang belum ditutup per organisasi
create unique index periode_aktif_unik on public.periode_suksesi (organisasi_id) where status in ('DRAF', 'DIBUKA');

create table public.slot_peran (
  id          uuid primary key default gen_random_uuid(),
  periode_id  uuid not null references public.periode_suksesi (id) on delete cascade,
  nama        text not null check (char_length(nama) between 2 and 80),
  urutan      int not null default 0,
  bobot       jsonb not null default '{"kepemimpinan":0.3,"eksekusi":0.3,"kolaborasi":0.2,"dampak":0.2}',
  dibuat_pada timestamptz not null default now(),
  check (public.bobot_valid(bobot))
);

create table public.kontribusi (
  id                  uuid primary key default gen_random_uuid(),
  pengguna_id         uuid not null references public.profil (id) on delete restrict,
  organisasi_id       uuid not null references public.organisasi (id) on delete restrict,
  kegiatan            text not null check (char_length(kegiatan) between 3 and 200),
  peran_kegiatan      text not null check (char_length(peran_kegiatan) between 2 and 120),
  periode_kegiatan    text not null check (char_length(periode_kegiatan) between 2 and 60),
  tanggal_kegiatan    date not null,
  uraian              text not null default '' check (char_length(uraian) <= 2000),
  bukti_url           text check (bukti_url ~* '^https?://'),
  bukti_path          text,
  status              public.status_kontribusi not null default 'MENUNGGU',
  nilai_kepemimpinan  smallint check (nilai_kepemimpinan between 1 and 5),
  nilai_eksekusi      smallint check (nilai_eksekusi between 1 and 5),
  nilai_kolaborasi    smallint check (nilai_kolaborasi between 1 and 5),
  nilai_dampak        smallint check (nilai_dampak between 1 and 5),
  catatan_verifikator text check (char_length(catatan_verifikator) <= 1000),
  verifikator_id      uuid references public.profil (id),
  diverifikasi_pada   timestamptz,
  dibuat_pada         timestamptz not null default now(),
  diubah_pada         timestamptz not null default now(),
  constraint bukti_wajib check (bukti_url is not null or bukti_path is not null),
  constraint nilai_lengkap check (
    status <> 'DISETUJUI' or (
      nilai_kepemimpinan is not null and nilai_eksekusi is not null and
      nilai_kolaborasi is not null and nilai_dampak is not null and
      verifikator_id is not null and diverifikasi_pada is not null
    )
  ),
  -- Pengaju tidak dapat menyetujui entrinya sendiri
  constraint bukan_diri_sendiri check (verifikator_id is null or verifikator_id <> pengguna_id)
);
create index kontribusi_org_status on public.kontribusi (organisasi_id, status);
create index kontribusi_pengguna on public.kontribusi (pengguna_id);

create table public.segel_hash (
  id              uuid primary key default gen_random_uuid(),
  urutan          bigint generated always as identity unique,
  kontribusi_id   uuid not null unique references public.kontribusi (id) on delete restrict,
  -- unique: satu segel hanya boleh punya satu penerus, rantai tidak bisa bercabang
  hash_sebelumnya text not null unique check (hash_sebelumnya ~ '^[0-9a-f]{64}$'),
  hash_entri      text not null unique check (hash_entri ~ '^[0-9a-f]{64}$'),
  dibuat_pada     timestamptz not null default now()
);

create table public.penetapan_peran (
  id                  uuid primary key default gen_random_uuid(),
  periode_id          uuid not null references public.periode_suksesi (id) on delete cascade,
  slot_id             uuid not null unique references public.slot_peran (id) on delete cascade,
  kandidat_id         uuid not null references public.profil (id),
  skor_kecocokan      numeric(5, 1) not null,
  skor_saw            numeric(5, 1) not null,
  kecocokan_tertinggi numeric(5, 1),
  pembanding_id       uuid references public.profil (id),
  alasan_tertulis     text,
  ditetapkan_oleh     uuid not null references public.profil (id),
  ditetapkan_pada     timestamptz not null default now(),
  unique (periode_id, kandidat_id)
);

create table public.penanda_pola (
  id               uuid primary key default gen_random_uuid(),
  periode_id       uuid not null references public.periode_suksesi (id) on delete cascade,
  aturan           public.aturan_pola not null,
  subjek_id        uuid not null references public.profil (id),
  keterangan       text not null,
  data             jsonb not null default '{}',
  aktif            boolean not null default true,
  ditinjau_oleh    uuid references public.profil (id),
  ditinjau_pada    timestamptz,
  catatan_tinjauan text,
  dibuat_pada      timestamptz not null default now(),
  diperbarui_pada  timestamptz not null default now(),
  unique (periode_id, aturan, subjek_id)
);

-- Jejak audit: hanya boleh ditambah. Tanpa FK supaya tetap utuh walau data induk dihapus.
create table public.jejak_audit (
  id            bigint generated always as identity primary key,
  organisasi_id uuid,
  periode_id    uuid,
  aktor_id      uuid,
  aktor_nama    text,
  aksi          text not null,
  entitas       text,
  entitas_id    text,
  keterangan    text,
  data          jsonb not null default '{}',
  dibuat_pada   timestamptz not null default now()
);
create index jejak_audit_org on public.jejak_audit (organisasi_id, dibuat_pada desc);

-- Riwayat perubahan pada kontribusi yang sudah disetujui (diisi trigger)
create table public.riwayat_perubahan (
  id            bigint generated always as identity primary key,
  kontribusi_id uuid not null,
  organisasi_id uuid,
  data_lama     jsonb not null,
  data_baru     jsonb,
  diubah_oleh   uuid,
  peran_db      text not null default current_user,
  diubah_pada   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------

-- Profil otomatis saat akun dibuat (tanpa konfirmasi email)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nama     text;
  v_nim      text;
  v_angkatan int;
begin
  -- Nilai metadata yang tidak valid diabaikan agar pembuatan akun tidak gagal
  v_nama := left(trim(coalesce(nullif(new.raw_user_meta_data->>'nama', ''), split_part(new.email, '@', 1))), 120);
  if char_length(v_nama) < 2 then
    v_nama := 'Pengguna baru';
  end if;
  v_nim := nullif(new.raw_user_meta_data->>'nim', '');
  if v_nim !~ '^[0-9]{6,15}$' then
    v_nim := null;
  end if;
  if coalesce(new.raw_user_meta_data->>'angkatan', '') ~ '^(20[0-9]{2}|2100)$' then
    v_angkatan := (new.raw_user_meta_data->>'angkatan')::int;
  end if;

  insert into public.profil (id, nama, email, nim, jurusan, angkatan)
  values (new.id, v_nama, new.email, v_nim, nullif(new.raw_user_meta_data->>'jurusan', ''), v_angkatan);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bobot, ambang, dan tanggal buka terkunci begitu periode dibuka
create or replace function public.jaga_periode()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'DRAF' and (
       new.bobot is distinct from old.bobot or
       new.ambang is distinct from old.ambang or
       new.tanggal_buka is distinct from old.tanggal_buka
     ) then
    raise exception 'Bobot, ambang, dan tanggal buka terkunci setelah periode dibuka';
  end if;
  if old.status = 'DIBUKA' and new.status = 'DRAF' then
    raise exception 'Periode yang sudah dibuka tidak bisa dikembalikan ke draf';
  end if;
  if old.status = 'DITUTUP' and new.status <> 'DITUTUP' then
    raise exception 'Periode yang sudah ditutup tidak bisa dibuka lagi';
  end if;
  return new;
end;
$$;

create trigger periode_terkunci
  before update on public.periode_suksesi
  for each row execute function public.jaga_periode();

-- Slot dan bobot peran hanya bisa diubah saat periode masih draf
create or replace function public.jaga_slot()
returns trigger
language plpgsql
as $$
declare
  v_status public.status_periode;
begin
  select status into v_status
  from public.periode_suksesi
  where id = coalesce(new.periode_id, old.periode_id);

  -- v_status null berarti periode induk sedang dihapus (cascade) saat masih draf
  if v_status is not null and v_status <> 'DRAF' then
    raise exception 'Slot peran terkunci setelah periode dibuka';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger slot_terkunci
  before insert or update or delete on public.slot_peran
  for each row execute function public.jaga_slot();

-- Waktu ubah kontribusi
create or replace function public.set_diubah_pada()
returns trigger
language plpgsql
as $$
begin
  new.diubah_pada := now();
  return new;
end;
$$;

create trigger kontribusi_diubah
  before update on public.kontribusi
  for each row execute function public.set_diubah_pada();

-- Catat setiap perubahan pada entri yang sudah disetujui
create or replace function public.catat_perubahan_kontribusi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.riwayat_perubahan (kontribusi_id, organisasi_id, data_lama, data_baru, diubah_oleh)
  values (
    old.id,
    old.organisasi_id,
    to_jsonb(old) - 'diubah_pada',
    case when tg_op = 'DELETE' then null else to_jsonb(new) - 'diubah_pada' end,
    auth.uid()
  );
  return null;
end;
$$;

create trigger kontribusi_riwayat
  after update or delete on public.kontribusi
  for each row
  when (old.status = 'DISETUJUI')
  execute function public.catat_perubahan_kontribusi();

-- Segel dan jejak audit tidak bisa diubah atau dihapus per baris
create or replace function public.tolak_ubah()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Tabel % hanya boleh ditambah, tidak boleh diubah atau dihapus', tg_table_name;
end;
$$;

create trigger segel_tetap
  before update or delete on public.segel_hash
  for each row execute function public.tolak_ubah();

create trigger jejak_tetap
  before update or delete on public.jejak_audit
  for each row execute function public.tolak_ubah();

create trigger riwayat_tetap
  before update or delete on public.riwayat_perubahan
  for each row execute function public.tolak_ubah();

-- ---------------------------------------------------------------------
-- Penyegelan atomik.
-- Hash dihitung di server Next.js (modul hash berantai, SHA-256);
-- fungsi ini memastikan persetujuan dan segel tersimpan dalam satu
-- transaksi dan berurutan.
-- ---------------------------------------------------------------------
create or replace function public.setujui_dan_segel(
  p_kontribusi_id   uuid,
  p_verifikator_id  uuid,
  p_waktu           timestamptz,
  p_kepemimpinan    smallint,
  p_eksekusi        smallint,
  p_kolaborasi      smallint,
  p_dampak          smallint,
  p_catatan         text,
  p_hash_sebelumnya text,
  p_hash_entri      text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terakhir text;
  v_urutan   bigint;
begin
  perform pg_advisory_xact_lock(hashtext('sigap_segel'));

  select hash_entri into v_terakhir
  from public.segel_hash
  order by urutan desc
  limit 1;

  if coalesce(v_terakhir, repeat('0', 64)) <> p_hash_sebelumnya then
    raise exception 'RANTAI_BERGESER';
  end if;

  update public.kontribusi
     set status              = 'DISETUJUI',
         nilai_kepemimpinan  = p_kepemimpinan,
         nilai_eksekusi      = p_eksekusi,
         nilai_kolaborasi    = p_kolaborasi,
         nilai_dampak        = p_dampak,
         catatan_verifikator = p_catatan,
         verifikator_id      = p_verifikator_id,
         diverifikasi_pada   = p_waktu
   where id = p_kontribusi_id
     and status = 'MENUNGGU';

  if not found then
    raise exception 'SUDAH_DIPROSES';
  end if;

  insert into public.segel_hash (kontribusi_id, hash_sebelumnya, hash_entri)
  values (p_kontribusi_id, p_hash_sebelumnya, p_hash_entri)
  returning urutan into v_urutan;

  return v_urutan;
end;
$$;

revoke all on function public.setujui_dan_segel(uuid, uuid, timestamptz, smallint, smallint, smallint, smallint, text, text, text) from public, anon, authenticated;
grant execute on function public.setujui_dan_segel(uuid, uuid, timestamptz, smallint, smallint, smallint, smallint, text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- Fungsi bantu untuk RLS (security definer agar tidak rekursif)
-- ---------------------------------------------------------------------
create or replace function public.pembaca_global()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profil
    where id = auth.uid() and peran_global in ('AUDITOR_KAMPUS', 'SUPERADMIN')
  );
$$;

create or replace function public.anggota_aktif(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.keanggotaan
    where pengguna_id = auth.uid() and organisasi_id = p_org and aktif
  );
$$;

create or replace function public.punya_peran(p_org uuid, p_peran public.peran_org[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.keanggotaan
    where pengguna_id = auth.uid() and organisasi_id = p_org and aktif and peran && p_peran
  );
$$;

create or replace function public.org_periode(p_periode uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisasi_id from public.periode_suksesi where id = p_periode;
$$;

create or replace function public.bisa_lihat_pengguna(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_target = auth.uid()
      or public.pembaca_global()
      or exists (
        select 1
        from public.keanggotaan saya
        join public.keanggotaan dia on dia.organisasi_id = saya.organisasi_id
        where saya.pengguna_id = auth.uid()
          and saya.aktif
          and saya.peran && '{VERIFIKATOR,PANITIA,AUDITOR,ADMIN}'::public.peran_org[]
          and dia.pengguna_id = p_target
      );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.organisasi        enable row level security;
alter table public.profil            enable row level security;
alter table public.keanggotaan       enable row level security;
alter table public.periode_suksesi   enable row level security;
alter table public.slot_peran        enable row level security;
alter table public.kontribusi        enable row level security;
alter table public.segel_hash        enable row level security;
alter table public.penetapan_peran   enable row level security;
alter table public.penanda_pola      enable row level security;
alter table public.jejak_audit       enable row level security;
alter table public.riwayat_perubahan enable row level security;

-- organisasi: daftar nama organisasi publik (dipakai di halaman daftar)
create policy organisasi_baca on public.organisasi
  for select to anon, authenticated using (true);

-- profil
create policy profil_baca on public.profil
  for select to authenticated using (public.bisa_lihat_pengguna(id));
create policy profil_ubah_sendiri on public.profil
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profil from authenticated;
grant update (nama, nim, jurusan, angkatan) on public.profil to authenticated;

-- keanggotaan
create policy keanggotaan_baca on public.keanggotaan
  for select to authenticated using (
    pengguna_id = auth.uid()
    or public.pembaca_global()
    or public.punya_peran(organisasi_id, '{VERIFIKATOR,PANITIA,AUDITOR,ADMIN}')
  );

-- periode & slot: semua anggota aktif organisasi boleh membaca (kriteria terbuka)
create policy periode_baca on public.periode_suksesi
  for select to authenticated using (public.pembaca_global() or public.anggota_aktif(organisasi_id));
create policy slot_baca on public.slot_peran
  for select to authenticated using (public.pembaca_global() or public.anggota_aktif(public.org_periode(periode_id)));

-- kontribusi
create policy kontribusi_baca on public.kontribusi
  for select to authenticated using (
    pengguna_id = auth.uid()
    or public.pembaca_global()
    or public.punya_peran(organisasi_id, '{VERIFIKATOR,PANITIA,AUDITOR,ADMIN}')
  );
create policy kontribusi_tambah on public.kontribusi
  for insert to authenticated with check (
    pengguna_id = auth.uid()
    and status = 'MENUNGGU'
    and public.punya_peran(organisasi_id, '{ANGGOTA}')
    and verifikator_id is null and diverifikasi_pada is null
    and nilai_kepemimpinan is null and nilai_eksekusi is null
    and nilai_kolaborasi is null and nilai_dampak is null
  );
create policy kontribusi_ubah on public.kontribusi
  for update to authenticated
  using (pengguna_id = auth.uid() and status in ('MENUNGGU', 'DITOLAK'))
  with check (
    pengguna_id = auth.uid()
    and status = 'MENUNGGU'
    and public.punya_peran(organisasi_id, '{ANGGOTA}')
    and verifikator_id is null and diverifikasi_pada is null
    and nilai_kepemimpinan is null and nilai_eksekusi is null
    and nilai_kolaborasi is null and nilai_dampak is null
  );
create policy kontribusi_hapus on public.kontribusi
  for delete to authenticated using (pengguna_id = auth.uid() and status in ('MENUNGGU', 'DITOLAK'));

-- segel: hash tidak membuka isi data, boleh dibaca semua pengguna masuk
create policy segel_baca on public.segel_hash
  for select to authenticated using (true);

-- penetapan: panitia/auditor/admin/verifikator; anggota setelah periode ditutup
create policy penetapan_baca on public.penetapan_peran
  for select to authenticated using (
    public.pembaca_global()
    or public.punya_peran(public.org_periode(periode_id), '{VERIFIKATOR,PANITIA,AUDITOR,ADMIN}')
    or (
      public.anggota_aktif(public.org_periode(periode_id))
      and exists (select 1 from public.periode_suksesi p where p.id = periode_id and p.status = 'DITUTUP')
    )
  );

create policy penanda_baca on public.penanda_pola
  for select to authenticated using (
    public.pembaca_global() or public.punya_peran(public.org_periode(periode_id), '{PANITIA,AUDITOR,ADMIN}')
  );

create policy jejak_baca on public.jejak_audit
  for select to authenticated using (
    public.pembaca_global() or public.punya_peran(organisasi_id, '{PANITIA,AUDITOR,ADMIN}')
  );

create policy riwayat_baca on public.riwayat_perubahan
  for select to authenticated using (
    public.pembaca_global() or public.punya_peran(organisasi_id, '{PANITIA,AUDITOR,ADMIN}')
  );

-- ---------------------------------------------------------------------
-- Storage: bukti kontribusi (privat). Pengguna mengunggah ke folder
-- miliknya sendiri; orang lain melihat lewat URL bertanda tangan yang
-- dibuat server setelah cek peran.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bukti', 'bukti', false, 5242880, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy bukti_unggah on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text);

create policy bukti_baca_sendiri on storage.objects
  for select to authenticated
  using (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text);

create policy bukti_hapus_sendiri on storage.objects
  for delete to authenticated
  using (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text);
