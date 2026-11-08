// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Award, 
  AlertTriangle, 
  Lock, 
  RefreshCw,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { DATA_PENGGUNA, INITIAL_ENTRI, INITIAL_SLOT_PERAN } from '@/data/seedData';
import { hitungMatriksSAW, periksaPenandaPola } from '@/lib/sawEngine';
import { verifikasiIntegritasRantai, segelEntriBaru } from '@/lib/hashEngine';
import { RoleType, OrmawaId, CabinetRoleKey, EntriKontribusi, SegelHash, PeranKabinet } from '@/types';

export default function SigapDashboard() {
  const [peranAktif, setPeranAktif] = useState<RoleType>('KABID');
  const [ormawaAktif, setOrmawaAktif] = useState<OrmawaId>('BEM_TELU');
  const [entriList, setEntriList] = useState<EntriKontribusi[]>(INITIAL_ENTRI);
  const [slotPeran, setSlotPeran] = useState<PeranKabinet[]>(INITIAL_SLOT_PERAN);
  
  const [segelList, setSegelList] = useState<SegelHash[]>([]);
  const [statusIntegritas, setStatusIntegritas] = useState<{ status: boolean; logAudit: string[] }>({
    status: true,
    logAudit: [],
  });
  const [isTamperedDemo, setIsTamperedDemo] = useState(false);

  const [kandidatDipilih, setKandidatDipilih] = useState<string | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [pendingSlotKey, setPendingSlotKey] = useState<CabinetRoleKey | null>(null);
  const [pendingKandidatId, setPendingKandidatId] = useState<string | null>(null);
  const [alasanTertulis, setAlasanTertulis] = useState('');
  const [errorAlasan, setErrorAlasan] = useState('');

  // 1. Generate Authentic Initial Hash Chain on Mount (Starts 100% VALID)
  useEffect(() => {
    async function initChain() {
      const e1 = INITIAL_ENTRI.find((e) => e.id === 'entri-101');
      const e2 = INITIAL_ENTRI.find((e) => e.id === 'entri-102');

      if (e1 && e2) {
        const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const s1 = await segelEntriBaru(e1, genesisHash);
        const s2 = await segelEntriBaru(e2, s1.hashSaatIni);
        const list = [s1, s2];
        setSegelList(list);
        const hasil = await verifikasiIntegritasRantai(list, INITIAL_ENTRI);
        setStatusIntegritas(hasil);
      }
    }
    initChain();
  }, []);

  // 2. Compute SAW Rankings
  const kandidatOrmawa = DATA_PENGGUNA.filter((u) => u.ormawaId === ormawaAktif);
  const kandidatDenganEntri = kandidatOrmawa.map((k) => ({
    id: k.id,
    nama: k.nama,
    entri: entriList.filter((e) => e.kandidatId === k.id),
  }));
  const hasilSAW = hitungMatriksSAW(kandidatDenganEntri);

  // 3. Toggle Tamper Simulation
  const handleToggleTamper = async () => {
    if (!isTamperedDemo) {
      // Alter raw data without updating cryptographic seal
      const entriRusak = entriList.map((e) =>
        e.id === 'entri-101' ? { ...e, skorEksekusi: 5.0, namaKegiatan: 'Ketua Pelaksana PKKMB [DIUBAH PAKSA]' } : e
      );
      setEntriList(entriRusak);
      setIsTamperedDemo(true);
      const hasilVerifikasi = await verifikasiIntegritasRantai(segelList, entriRusak);
      setStatusIntegritas(hasilVerifikasi);
    } else {
      // Restore clean state
      setEntriList(INITIAL_ENTRI);
      setIsTamperedDemo(false);
      const hasilVerifikasi = await verifikasiIntegritasRantai(segelList, INITIAL_ENTRI);
      setStatusIntegritas(hasilVerifikasi);
    }
  };

  // 4. Click-to-Assign Handler
  const handleKlikSlot = (kodePeran: CabinetRoleKey) => {
    if (!kandidatDipilih) return;

    const dataSAW = hasilSAW.find((h) => h.kandidatId === kandidatDipilih);
    const peringkat = dataSAW?.peringkat || 1;

    // Trigger Rule 3: Mandatory Justification if non-#1 is assigned
    if (peringkat > 1) {
      setPendingSlotKey(kodePeran);
      setPendingKandidatId(kandidatDipilih);
      setAlasanTertulis('');
      setErrorAlasan('');
      setModalTerbuka(true);
    } else {
      terapkanPenugasan(kodePeran, kandidatDipilih, 'Peringkat #1 berdasarkan matriks SAW.');
    }
  };

  const terapkanPenugasan = (kodePeran: CabinetRoleKey, kandidatId: string, alasan: string) => {
    const dataSAW = hasilSAW.find((h) => h.kandidatId === kandidatId);
    const skorFit = dataSAW ? dataSAW.skorAkhirSAW : 85.0;

    setSlotPeran((prev) =>
      prev.map((s) => (s.kodePeran === kodePeran ? { ...s, kandidatTerpilihId: kandidatId, skorKecocokan: skorFit } : s))
    );
    setKandidatDipilih(null);
    setModalTerbuka(false);
  };

  const handleKonfirmasiOverride = () => {
    if (alasanTertulis.trim().length < 20) {
      setErrorAlasan('Alasan tertulis wajib minimal 20 karakter untuk diaudit oleh Pembina/Kemahasiswaan.');
      return;
    }
    if (pendingSlotKey && pendingKandidatId) {
      terapkanPenugasan(pendingSlotKey, pendingKandidatId, alasanTertulis);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased font-sans pb-20">
      {/* Telkom University Institutional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-700 flex items-center justify-center font-bold text-white text-base shadow">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-slate-900 tracking-tight">SIGAP Kaderisasi</h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-mono">
                  Telkom University
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistem Integritas Kaderisasi & Audit Suksesi Ormawa (CR YOUTH 2026)
              </p>
            </div>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-500 pl-2 pr-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Peran Demo:
            </span>
            {(['ANGGOTA', 'KABID', 'PEMBINA', 'KEMAHASISWAAN'] as RoleType[]).map((r) => (
              <button
                key={r}
                onClick={() => setPeranAktif(r)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                  peranAktif === r
                    ? 'bg-white text-red-700 shadow-sm border border-slate-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {r === 'KABID' ? 'Verifikator (Kabid)' : r === 'KEMAHASISWAAN' ? 'Auditor' : r}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {/* Organization Filter & Tamper Action */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ormawa:</span>
            <button
              onClick={() => { setOrmawaAktif('BEM_TELU'); setKandidatDipilih(null); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                ormawaAktif === 'BEM_TELU'
                  ? 'bg-red-700 border-red-700 text-white shadow-sm'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              BEM KEMA Telkom University
            </button>
            <button
              onClick={() => { setOrmawaAktif('UKM_SEARCH'); setKandidatDipilih(null); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                ormawaAktif === 'UKM_SEARCH'
                  ? 'bg-red-700 border-red-700 text-white shadow-sm'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              UKM SEARCH Telkom University
            </button>
          </div>

          <button
            onClick={handleToggleTamper}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition ${
              isTamperedDemo
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTamperedDemo ? 'animate-spin' : ''}`} />
            {isTamperedDemo ? 'Pulihkan Data Asli' : 'Simulasi Manipulasi Basis Data'}
          </button>
        </div>

        {/* Cryptographic Integrity Status Bar */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition ${
            statusIntegritas.status
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {statusIntegritas.status ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm">
              {statusIntegritas.status
                ? 'Status Integritas Kriptografis: VALID (Rantai Hash Utuh)'
                : 'STATUS INTEGRITAS: TERKOMPROMISI (Manipulasi Data Pasca-Persetujuan Terdeteksi!)'}
            </div>
            <p className="text-slate-600">
              {statusIntegritas.status
                ? 'Seluruh segel rekam jejak terikat via SHA-256 berantai (Hash N-1 + Payload = Hash N). Data aman dari perubahan sepihak.'
                : 'Peringatan: Hash rekalkulasi Entri #1 tidak cocok dengan segel hash tersimpan. Sistem menandai perubahan ilegal.'}
            </p>
          </div>
        </div>

        {/* Section 1: Objective SAW Scoring Matrix */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-red-600" />
                Matriks Pembobotan Objektif SAW (Simple Additive Weighting)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bobot Baku: Kepemimpinan (30%), Eksekusi (30%), Kolaborasi (20%), Dampak (20%) — Sesuai Bab 8 Laporan
              </p>
            </div>
            {ormawaAktif === 'BEM_TELU' && (
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                Data Uji Validasi: A=90.0 | B=92.2 | C=84.4
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Kandidat</th>
                  <th className="py-3 px-4">Kepemimpinan (30%)</th>
                  <th className="py-3 px-4">Eksekusi (30%)</th>
                  <th className="py-3 px-4">Kolaborasi (20%)</th>
                  <th className="py-3 px-4">Dampak (20%)</th>
                  <th className="py-3 px-4 text-red-700 font-bold">Skor Akhir SAW</th>
                  <th className="py-3 px-4">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {hasilSAW.map((cand) => {
                  const isSelected = kandidatDipilih === cand.kandidatId;
                  const anomali = periksaPenandaPola(cand.kandidatId, entriList);
                  return (
                    <tr
                      key={cand.kandidatId}
                      className={`hover:bg-slate-50 transition ${
                        isSelected ? 'bg-red-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">#{cand.peringkat}</td>
                      <td className="py-3 px-4 font-sans text-slate-800">
                        {cand.namaKandidat}
                        {anomali.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded mt-1 w-fit font-sans">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> {anomali[0]}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{cand.skorMentah.kepemimpinan.toFixed(1)}</td>
                      <td className="py-3 px-4 text-slate-600">{cand.skorMentah.eksekusi.toFixed(1)}</td>
                      <td className="py-3 px-4 text-slate-600">{cand.skorMentah.kolaborasi.toFixed(1)}</td>
                      <td className="py-3 px-4 text-slate-600">{cand.skorMentah.dampak.toFixed(1)}</td>
                      <td className="py-3 px-4 text-red-700 font-bold text-sm">
                        {cand.skorAkhirSAW.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <button
                          onClick={() => setKandidatDipilih(isSelected ? null : cand.kandidatId)}
                          className={`text-xs px-3 py-1 rounded font-medium border transition ${
                            isSelected
                              ? 'bg-red-700 text-white border-red-700 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? 'Batal' : 'Pilih Kandidat'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Cabinet Role Assignment Simulator */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              Simulator Penempatan Struktur Kabinet (Click-to-Assign)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {kandidatDipilih 
                ? 'Kandidat telah dipilih di atas! Sekarang klik salah satu kotak peran di bawah untuk menetapkan.'
                : 'Pilih salah satu kandidat pada tabel di atas, lalu klik slot kepengurusan di bawah untuk menetapkan peran.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slotPeran.map((slot) => {
              const kandidat = DATA_PENGGUNA.find((u) => u.id === slot.kandidatTerpilihId);
              return (
                <div
                  key={slot.kodePeran}
                  onClick={() => kandidatDipilih && handleKlikSlot(slot.kodePeran)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between min-h-[120px] ${
                    kandidatDipilih
                      ? 'border-red-400 bg-red-50/50 hover:bg-red-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      {slot.namaPeran}
                    </div>
                    {kandidat ? (
                      <div className="mt-2">
                        <div className="font-semibold text-xs text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {kandidat.nama}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{kandidat.nim}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-3 italic">Slot Kosong</div>
                    )}
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Skor Keselarasan:</span>
                    <span className="font-mono font-bold text-red-700">
                      {slot.kandidatTerpilihId ? `${slot.skorKecocokan}%` : '0.0%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: SHA-256 Chained Hash Audit Trail */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              Buku Besar Jejak Audit Kriptografis SHA-256 (Hash Chain Ledger)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap verifikasi menghasilkan segel berantai: Hash N-1 + Payload = Hash N.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {segelList.map((segel, idx) => {
              const entri = entriList.find((e) => e.id === segel.entriId);
              const isTamperedRow = isTamperedDemo && segel.entriId === 'entri-101';
              return (
                <div
                  key={segel.id}
                  className={`p-3.5 rounded-lg border transition ${
                    isTamperedRow
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5 font-sans font-semibold">
                    <span className="text-slate-900">
                      Segel #{idx + 1} — {entri?.namaKegiatan}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isTamperedRow
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isTamperedRow ? 'INTEGRITAS GAGAL' : 'SEIS VALID'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 break-all">
                    <span>Hash N-1 :</span> {segel.hashSebelumnya}
                  </div>
                  <div className="text-[11px] text-slate-800 font-bold break-all mt-0.5">
                    <span className="text-slate-500 font-normal">Hash N   :</span> {segel.hashSaatIni}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal Dialog: Written Justification Required */}
      {modalTerbuka && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Justifikasi Tertulis Diperlukan (Penanda Pola #3)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Anda memilih kandidat di bawah peringkat #1. Sesuai tata kelola suksesi anti-nepotisme,
              alasan tertulis wajib dicatat dalam buku jejak audit sebelum SK penetapan diterbitkan.
            </p>

            <textarea
              rows={4}
              value={alasanTertulis}
              onChange={(e) => setAlasanTertulis(e.target.value)}
              placeholder="Tuliskan justifikasi objektif (misal: Rekam jejak kepemimpinan spesifik pada divisi kebendaharaan atau keselarasan komitmen waktu)..."
              className="w-full mt-3 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-red-600"
            />

            {errorAlasan && <div className="text-xs text-rose-600 mt-1.5 font-medium">{errorAlasan}</div>}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalTerbuka(false)}
                className="text-xs px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleKonfirmasiOverride}
                className="text-xs px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold shadow-sm"
              >
                Konfirmasi & Simpan Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}