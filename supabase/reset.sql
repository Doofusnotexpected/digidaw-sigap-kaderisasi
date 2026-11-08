-- Menghapus SEMUA data SIGAP agar `npm run seed` bisa dijalankan ulang.
-- Jalankan di Supabase Dashboard > SQL Editor. Struktur tabel tetap ada.
-- TRUNCATE tidak memicu trigger baris, sehingga tabel append-only ikut terhapus.
truncate table
  public.penanda_pola,
  public.penetapan_peran,
  public.segel_hash,
  public.riwayat_perubahan,
  public.jejak_audit,
  public.kontribusi,
  public.slot_peran,
  public.periode_suksesi,
  public.keanggotaan,
  public.organisasi
restart identity cascade;

-- Akun demo (profil ikut terhapus lewat ON DELETE CASCADE)
delete from auth.users where email like '%@sigap.test';

-- Berkas bukti di storage (opsional)
-- delete from storage.objects where bucket_id = 'bukti';
