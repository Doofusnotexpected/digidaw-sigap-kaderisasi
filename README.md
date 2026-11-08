# SIGAP Kaderisasi - Telkom University - Hackathon Project
> Sistem Integritas Kaderisasi & Audit Suksesi Ormawa Telkom University (CR YOUTH 2026)

🔗 **Live Demo:** https://digidaw-sigap-kaderisasi-y8qu.vercel.app

# Sistem Integritas Kaderisasi & Audit Suksesi Ormawa

> **Finalis Hackathon CR YOUTH 2026 - Tim Digidaw (Universitas Telkom)**  
> Subtema: *Future Leadership and Human Capital Management*

---

## Ringkasan Eksekutif
**SIGAP Kaderisasi** adalah platform tata kelola suksesi kepemimpinan organisasi mahasiswa (Ormawa/UKM) berbasis bukti rekam jejak digital terverifikasi. SIGAP dirancang sebagai pelengkap kualitatif bagi sistem Transkrip Aktivitas Kemahasiswaan (TAK Telkom University - SK Rektor KR 2971/2014) dengan menyediakan:
1. **Segel Kriptografis Berantai SHA-256:** Memastikan setiap log kontribusi yang disetujui tidak dapat diubah secara sepihak pasca-persetujuan (*tamper-evident ledger*).
2. **Mesin Pemeringkatan Objektif SAW (Simple Additive Weighting):** Menilai kelayakan kompetensi calon pemimpin secara transparan berdasarkan 4 dimensi kriteria.
3. **Simulator Penempatan Kabinet & Penanda Pola:** Alat bantu visual pencocokan peran berbasis aturan (*rule-based*) untuk mencegah nepotisme dan penunjukan subjektif tanpa justifikasi.

---

## Tim Pengembang (Tim Digidaw)
| Nama Anggota | Program Studi | Peran Teknis & Tanggung Jawab |
| :--- | :--- | :--- |
| **Devan Saputra Lawolo** | S1 ADBIS (FEB) | Ketua Tim, Strategi Bisnis, Penyusunan Laporan & Materi Pitching |
| **Muhammad Bevand Januartama** | S1 Rekayasa Perangkat Lunak | Arsitektur Antarmuka (Frontend UI/UX), Alur Pengguna & Desain Komponen |
| **Muhammad Avandra Lukito** | S1 Informatika | Logika Sisi Server, Kriptografi SHA-256, Mesin SAW & Integritas Basis Data |

---

## Status Fungsionalitas Prototipe (12 Jam Hackathon)
Sesuai Bab 8 Laporan Pengembangan & Ketentuan Guidebook CR YOUTH 2026:

| Modul Fitur | Status Fungsional | Deskripsi Implementasi |
| :--- | :--- | :--- |
| **Pencatatan Kontribusi** | **Fungsional (100%)** | Input rekam jejak, peran, tautan artefak, dan pembobotan aspek (1–5) |
| **Audit Trail SHA-256** | **Fungsional (100%)** | Penyegelan hash berantai (`prevHash + payload -> currentHash`) |
| **Uji Deteksi Manipulasi** | **Fungsional (100%)** | Verifikasi integritas otomatis dengan pendeteksian kegagalan saat data diubah |
| **Mesin Scoring SAW** | **Fungsional (100%)** | Normalisasi matriks kompetensi benefit (Target Benchmark: A=90.0, B=92.2, C=84.4) |
| **Simulator Peran Kabinet** | **Fungsional (100%)** | Pencocokan kandidat ke slot peran dengan persentase Role Fit real-time |
| **Deteksi Penanda Pola** | **Fungsional (100%)** | Aturan deterministik (lonjakan >5 persetujuan H-7 & verifikator dominan >70%) |
| **Basis Data Ormawa** | *Data Contoh (Seed)* | 2 Ormawa (BEM Kema & UKM SEARCH) dengan 12 kandidat realistis |
| **Autentikasi Pengguna** | *Mockup Role Switcher* | Penggantian peran cepat (Anggota, Verifikator, Panitia, Auditor) |

---

## Kredensial Pengujian (Demo Panitia & Juri)
Aplikasi menyediakan *Mockup Role Switcher* instan serta akun uji coba berikut (Tabel 10 Laporan Pengembangan):

| Peran | Username | Kata Sandi | Akses Utama |
| :--- | :--- | :--- | :--- |
| **Anggota** | `anggota@bem.telu` | `demo123` | Pengajuan rekam jejak & pemantauan status segel |
| **Verifikator** | `kabid@bem.telu` | `demo123` | Validasi berkas & penilaian 4 dimensi kompetensi |
| **Panitia Suksesi** | `panitia@bem.telu` | `demo123` | Simulasi penempatan kabinet & justifikasi tertulis |
| **Auditor** | `auditor.kemahasiswaan@telkomuniversity.ac.id` | `demo123` | Audit integritas rantai hash & penanda anomali |

---

## Panduan Menjalankan Sistem Lokal ($0 Cost Stack)

```bash
# 1. Unduh repositori
git clone [https://github.com/Doofusnotexpected/digidaw-sigap-kaderisasi.git](https://github.com/Doofusnotexpected/digidaw-sigap-kaderisasi.git)
cd digidaw-sigap-kaderisasi

# 2. Pasang dependensi
npm install

# 3. Jalankan pengujian verifikasi backend di terminal
node test-checkpoint1.mjs

# 4. Jalankan aplikasi web lokal
npm run dev
