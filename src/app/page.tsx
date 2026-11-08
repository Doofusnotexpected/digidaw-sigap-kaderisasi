// src/app/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { DATA_PENGGUNA, INITIAL_ENTRI, INITIAL_SLOT_PERAN } from '@/data/seedData';
import { ENTRI_MENUNGGU, IDENTITAS_DEMO, INFO_ORMAWA } from '@/data/demoContext';
import { hitungMatriksSAW, periksaPenandaPola, BOBOT_SAW } from '@/lib/sawEngine';
import { verifikasiIntegritasRantai, segelEntriBaru } from '@/lib/hashEngine';
import { telusuriRantai, StatusSegel } from '@/lib/chainTrace';
import { skorKecocokan } from '@/lib/roleFit';
import { AuditLog, CabinetRoleKey, EntriKontribusi, OrmawaId, PeranDemo, PeranKabinet, SegelHash } from '@/types';

import Sidebar from '@/components/Sidebar';
import SealChain from '@/components/SealChain';
import PanitiaView from '@/components/PanitiaView';
import VerifikatorView from '@/components/VerifikatorView';
import AnggotaView, { FormKontribusi } from '@/components/AnggotaView';
import AuditorView from '@/components/AuditorView';
import JustifikasiModal, { ALASAN_SINGKAT } from '@/components/JustifikasiModal';
import { Penanda } from '@/components/PenandaPola';
import { pisahNama, tanggal } from '@/components/shared';

const GENESIS = '0'.repeat(64);
const ENTRI_UJI_MANIPULASI = 'entri-101';

const JUDUL: Record<PeranDemo, { t: string; d: string }> = {
  ANGGOTA: { t: 'Rekam jejak saya', d: 'Catat kontribusi dan pantau skor Anda sendiri.' },
  VERIFIKATOR: { t: 'Verifikasi kontribusi', d: 'Tinjau bukti, beri nilai, lalu setujui atau tolak.' },
  PANITIA: { t: 'Pencocokan peran', d: 'Bandingkan kandidat dari rekam jejak terverifikasi dan tetapkan pengurus.' },
  AUDITOR: { t: 'Audit suksesi', d: 'Akses baca saja: rantai segel, jejak audit, dan penanda pola.' },
};

let urutLog = 0;
const buatLog = (l: Omit<AuditLog, 'id'>): AuditLog => ({ id: `log-${++urutLog}`, ...l });

function logAwal(): AuditLog[] {
  return INITIAL_ENTRI.filter((e) => e.statusVerifikasi === 'DISETUJUI')
    .sort((a, b) => a.waktuVerifikasi.localeCompare(b.waktuVerifikasi))
    .map((e) =>
      buatLog({
        timestamp: e.waktuVerifikasi,
        aktorId: e.verifikatorNama,
        aksi: 'Entri disetujui dan disegel',
        keteranganTertulis: `${e.namaKegiatan}, milik ${pisahNama(DATA_PENGGUNA.find((u) => u.id === e.kandidatId)?.nama ?? '').nama}.`,
        penandaPola: [],
        ormawaId: e.ormawaId,
      })
    );
}

export default function SigapDashboard() {
  const [peran, setPeran] = useState<PeranDemo>('PANITIA');
  const [ormawa, setOrmawa] = useState<OrmawaId>('BEM_TELU');
  const [entriList, setEntriList] = useState<EntriKontribusi[]>(() => [...INITIAL_ENTRI, ...ENTRI_MENUNGGU]);
  const [segelList, setSegelList] = useState<SegelHash[]>([]);
  const [statusList, setStatusList] = useState<StatusSegel[]>([]);
  const [logPemeriksaan, setLogPemeriksaan] = useState<string[]>([]);
  const [sedangMemeriksa, setSedangMemeriksa] = useState(false);
  const [tampered, setTampered] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLog[]>(logAwal);
  const [slotPeran, setSlotPeran] = useState<Record<OrmawaId, PeranKabinet[]>>({
    BEM_TELU: INITIAL_SLOT_PERAN.map((s) => ({ ...s })),
    UKM_SEARCH: INITIAL_SLOT_PERAN.map((s) => ({ ...s })),
  });
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [modal, setModal] = useState<{ kode: CabinetRoleKey; kandidatId: string; fit: number; pembanding: { nama: string; skor: number } } | null>(null);

  const identitas = IDENTITAS_DEMO[ormawa];
  const info = INFO_ORMAWA[ormawa];
  const tambahLog = (l: Omit<AuditLog, 'id'>) => setAuditLog((prev) => [...prev, buatLog(l)]);

  // 1. Segel semua entri yang sudah disetujui, berurutan sesuai waktu persetujuan
  useEffect(() => {
    (async () => {
      const urut = INITIAL_ENTRI.filter((e) => e.statusVerifikasi === 'DISETUJUI').sort((a, b) => a.waktuVerifikasi.localeCompare(b.waktuVerifikasi));
      const hasil: SegelHash[] = [];
      let prev = GENESIS;
      for (const e of urut) {
        const s = await segelEntriBaru(e, prev);
        hasil.push(s);
        prev = s.hashSaatIni;
      }
      setSegelList(hasil);
    })();
  }, []);

  // 2. Telusuri ulang rantai setiap kali data atau segel berubah
  const periksa = useCallback(async () => {
    if (!segelList.length) return;
    setSedangMemeriksa(true);
    const [status, verif] = await Promise.all([telusuriRantai(segelList, entriList), verifikasiIntegritasRantai(segelList, entriList)]);
    setStatusList(status);
    setLogPemeriksaan(verif.logAudit);
    setSedangMemeriksa(false);
  }, [segelList, entriList]);

  useEffect(() => {
    periksa();
  }, [periksa]);

  // 3. Skor SAW, hanya untuk kandidat yang punya entri terverifikasi
  const anggotaOrmawa = DATA_PENGGUNA.filter((u) => u.ormawaId === ormawa);
  const adaEntri = (id: string) => entriList.some((e) => e.kandidatId === id && e.statusVerifikasi === 'DISETUJUI');
  const hasilSAW = useMemo(
    () =>
      hitungMatriksSAW(
        anggotaOrmawa.filter((u) => adaEntri(u.id)).map((k) => ({ id: k.id, nama: k.nama, entri: entriList.filter((e) => e.kandidatId === k.id) }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ormawa, entriList]
  );
  const belumDinilai = anggotaOrmawa.filter((u) => !adaEntri(u.id));
  const slots = slotPeran[ormawa];

  // 4. Penanda pola (tiga aturan pada proposal)
  const penanda: Penanda[] = useMemo(() => {
    const out: Penanda[] = [];
    for (const k of hasilSAW) {
      const nama = pisahNama(k.namaKandidat).nama;
      const flags = periksaPenandaPola(k.kandidatId, entriList);
      const disetujui = entriList.filter((e) => e.kandidatId === k.kandidatId && e.statusVerifikasi === 'DISETUJUI');
      if (flags.some((f) => f.includes('Lonjakan'))) {
        const n = disetujui.filter((e) => {
          const d = (new Date(`${info.dibuka}T00:00:00Z`).getTime() - new Date(e.waktuVerifikasi).getTime()) / 864e5;
          return d >= 0 && d <= 7;
        }).length;
        out.push({
          id: `lonjakan-${k.kandidatId}`,
          aturan: 'Lonjakan persetujuan',
          subjek: nama,
          rincian: `${n} entri disetujui dalam 7 hari sebelum periode suksesi dibuka ${tanggal(info.dibuka)}.`,
          batas: 'lebih dari 5 entri disetujui dalam 7 hari sebelum periode dibuka',
        });
      }
      if (flags.some((f) => f.includes('Verifikator dominan'))) {
        const hitung: Record<string, number> = {};
        disetujui.forEach((e) => (hitung[e.verifikatorNama] = (hitung[e.verifikatorNama] ?? 0) + 1));
        const [v, n] = Object.entries(hitung).sort((a, b) => b[1] - a[1])[0];
        out.push({
          id: `dominan-${k.kandidatId}`,
          aturan: 'Verifikator dominan',
          subjek: nama,
          rincian: `${v} menyetujui ${n} dari ${disetujui.length} entri (${Math.round((n / disetujui.length) * 100)}%).`,
          batas: 'satu verifikator menyetujui lebih dari 70% entri seorang kandidat',
        });
      }
    }
    for (const s of slots) {
      if (s.alasanTertulis && s.alasanTertulis.length < ALASAN_SINGKAT) {
        const u = DATA_PENGGUNA.find((x) => x.id === s.kandidatTerpilihId);
        out.push({
          id: `alasan-${s.kodePeran}`,
          aturan: 'Alasan terlalu singkat',
          subjek: pisahNama(u?.nama ?? '').nama,
          rincian: `Ditetapkan sebagai ${s.namaPeran} dengan alasan ${s.alasanTertulis.length} karakter: "${s.alasanTertulis}"`,
          batas: `alasan tertulis di bawah ${ALASAN_SINGKAT} karakter untuk kandidat berskor lebih rendah`,
        });
      }
    }
    return out;
  }, [hasilSAW, entriList, slots, info.dibuka]);

  // ---------- Tindakan ----------
  const gantiOrmawa = (o: OrmawaId) => {
    setOrmawa(o);
    setDipilih(null);
  };

  const toggleManipulasi = () => {
    const asli = INITIAL_ENTRI.find((e) => e.id === ENTRI_UJI_MANIPULASI)!;
    setEntriList((list) =>
      list.map((e) =>
        e.id !== ENTRI_UJI_MANIPULASI ? e : tampered ? asli : { ...e, skorEksekusi: 5.0, namaKegiatan: `${asli.namaKegiatan} (nilai diubah)` }
      )
    );
    tambahLog({
      timestamp: new Date().toISOString(),
      aktorId: 'Mode demo',
      aksi: tampered ? 'Simulasi selesai, data asli dipulihkan' : 'Simulasi: nilai entri diubah langsung di basis data',
      keteranganTertulis: tampered ? '' : `Nilai keandalan pada "${asli.namaKegiatan}" diubah dari ${asli.skorEksekusi} ke 5.0 tanpa melalui aplikasi.`,
      penandaPola: [],
      ormawaId: asli.ormawaId,
    });
    setTampered((t) => !t);
  };

  const terapkan = (kode: CabinetRoleKey, kandidatId: string, fit: number, alasan?: string) => {
    const slot = slots.find((s) => s.kodePeran === kode)!;
    const nama = pisahNama(DATA_PENGGUNA.find((u) => u.id === kandidatId)?.nama ?? '').nama;
    setSlotPeran((prev) => ({
      ...prev,
      [ormawa]: prev[ormawa].map((s) =>
        s.kodePeran === kode
          ? { ...s, kandidatTerpilihId: kandidatId, skorKecocokan: fit, alasanTertulis: alasan }
          : s.kandidatTerpilihId === kandidatId
            ? { ...s, kandidatTerpilihId: null, skorKecocokan: 0, alasanTertulis: undefined }
            : s
      ),
    }));
    tambahLog({
      timestamp: new Date().toISOString(),
      aktorId: identitas.panitia,
      aksi: `Penetapan ${slot.namaPeran}: ${nama}`,
      keteranganTertulis: alasan ? `Alasan: ${alasan}` : `Kecocokan tertinggi untuk peran ini (${fit.toFixed(1)}).`,
      penandaPola: alasan && alasan.length < ALASAN_SINGKAT ? ['Penanda: alasan terlalu singkat'] : [],
      ormawaId: ormawa,
    });
    setDipilih(null);
    setModal(null);
  };

  const tetapkan = (kode: CabinetRoleKey) => {
    const k = hasilSAW.find((h) => h.kandidatId === dipilih);
    if (!k) return;
    const fit = skorKecocokan(k, kode);
    const pesaing = hasilSAW
      .filter((h) => h.kandidatId !== k.kandidatId && !slots.some((s) => s.kodePeran !== kode && s.kandidatTerpilihId === h.kandidatId))
      .map((h) => ({ h, f: skorKecocokan(h, kode) }))
      .sort((a, b) => b.f - a.f)[0];
    if (pesaing && pesaing.f > fit) {
      setModal({ kode, kandidatId: k.kandidatId, fit, pembanding: { nama: pisahNama(pesaing.h.namaKandidat).nama, skor: pesaing.f } });
    } else {
      terapkan(kode, k.kandidatId, fit);
    }
  };

  const kosongkan = (kode: CabinetRoleKey) => {
    const slot = slots.find((s) => s.kodePeran === kode)!;
    setSlotPeran((prev) => ({
      ...prev,
      [ormawa]: prev[ormawa].map((s) => (s.kodePeran === kode ? { ...s, kandidatTerpilihId: null, skorKecocokan: 0, alasanTertulis: undefined } : s)),
    }));
    tambahLog({ timestamp: new Date().toISOString(), aktorId: identitas.panitia, aksi: `${slot.namaPeran} dikosongkan`, keteranganTertulis: '', penandaPola: [], ormawaId: ormawa });
  };

  const setujui = async (id: string, skor: Record<'kepemimpinan' | 'eksekusi' | 'kolaborasi' | 'dampak', number>, catatan: string) => {
    const lama = entriList.find((e) => e.id === id);
    if (!lama) return;
    const baru: EntriKontribusi = {
      ...lama,
      skorKepemimpinan: skor.kepemimpinan,
      skorEksekusi: skor.eksekusi,
      skorKolaborasi: skor.kolaborasi,
      skorDampak: skor.dampak,
      statusVerifikasi: 'DISETUJUI',
      verifikatorId: identitas.verifikator.id,
      verifikatorNama: identitas.verifikator.nama,
      waktuVerifikasi: new Date().toISOString(),
      catatanVerifikator: catatan || undefined,
    };
    const segel = await segelEntriBaru(baru, segelList[segelList.length - 1]?.hashSaatIni ?? GENESIS);
    setEntriList((list) => list.map((e) => (e.id === id ? baru : e)));
    setSegelList((s) => [...s, segel]);
    tambahLog({
      timestamp: baru.waktuVerifikasi,
      aktorId: identitas.verifikator.nama,
      aksi: 'Entri disetujui dan disegel',
      keteranganTertulis: `${baru.namaKegiatan}, milik ${pisahNama(DATA_PENGGUNA.find((u) => u.id === baru.kandidatId)?.nama ?? '').nama}. Nilai ${skor.kepemimpinan}/${skor.eksekusi}/${skor.kolaborasi}/${skor.dampak}.`,
      penandaPola: [],
      ormawaId: baru.ormawaId,
    });
  };

  const tolak = (id: string, catatan: string) => {
    const now = new Date().toISOString();
    const lama = entriList.find((e) => e.id === id)!;
    setEntriList((list) =>
      list.map((e) =>
        e.id === id
          ? { ...e, statusVerifikasi: 'DITOLAK', verifikatorId: identitas.verifikator.id, verifikatorNama: identitas.verifikator.nama, waktuVerifikasi: now, catatanVerifikator: catatan }
          : e
      )
    );
    tambahLog({ timestamp: now, aktorId: identitas.verifikator.nama, aksi: 'Entri ditolak', keteranganTertulis: `${lama.namaKegiatan}. Catatan: ${catatan}`, penandaPola: [], ormawaId: lama.ormawaId });
  };

  const kirim = (f: FormKontribusi) => {
    const now = new Date();
    const e: EntriKontribusi = {
      id: `entri-u-${now.getTime()}`,
      kandidatId: identitas.anggotaId,
      ormawaId: ormawa,
      namaKegiatan: f.namaKegiatan,
      peranKegiatan: f.peranKegiatan,
      periode: f.periode,
      uraian: f.uraian,
      tautanBukti: f.tautanBukti,
      tanggalKegiatan: now.toISOString().slice(0, 10),
      skorKepemimpinan: 0,
      skorEksekusi: 0,
      skorKolaborasi: 0,
      skorDampak: 0,
      statusVerifikasi: 'MENUNGGU',
      verifikatorId: '',
      verifikatorNama: '',
      waktuVerifikasi: '',
    };
    setEntriList((list) => [...list, e]);
    const nama = pisahNama(DATA_PENGGUNA.find((u) => u.id === identitas.anggotaId)?.nama ?? '').nama;
    tambahLog({ timestamp: now.toISOString(), aktorId: nama, aksi: 'Entri baru dikirim', keteranganTertulis: f.namaKegiatan, penandaPola: [], ormawaId: ormawa });
  };

  // ---------- Data per tampilan ----------
  const antrean = entriList.filter((e) => e.ormawaId === ormawa && e.statusVerifikasi === 'MENUNGGU');
  const riwayatVerif = entriList.filter((e) => e.verifikatorId === identitas.verifikator.id && e.statusVerifikasi !== 'MENUNGGU' && !INITIAL_ENTRI.some((x) => x.id === e.id));
  const anggota = DATA_PENGGUNA.find((u) => u.id === identitas.anggotaId)!;
  const segelRusak = statusList.filter((s) => s !== 'utuh').length;
  const namaIdentitas =
    peran === 'ANGGOTA'
      ? pisahNama(anggota.nama).nama
      : peran === 'VERIFIKATOR'
        ? identitas.verifikator.nama
        : peran === 'PANITIA'
          ? identitas.panitia
          : identitas.auditor;

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        peran={peran}
        onPeran={(p) => {
          setPeran(p);
          setDipilih(null);
        }}
        ormawa={ormawa}
        onOrmawa={gantiOrmawa}
        identitas={namaIdentitas}
        badge={{ VERIFIKATOR: antrean.length, AUDITOR: segelRusak }}
      />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 grid grid-cols-1 gap-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-[color:var(--graphite)]">
                {info.nama}, {info.periode}
              </p>
              <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold tracking-[-0.03em] leading-tight mt-1">{JUDUL[peran].t}</h1>
              <p className="text-sm text-[color:var(--graphite)] mt-1">{JUDUL[peran].d}</p>
            </div>
            <div className="flex items-center gap-2 text-xs rounded-[10px] border px-3 py-2 self-start md:self-auto" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
              <Lock className="w-3.5 h-3.5 text-[color:var(--muted)]" />
              <span className="text-[color:var(--graphite)]">
                Periode dibuka {tanggal(info.dibuka)}. Bobot terkunci{' '}
                <b className="tabular text-[color:var(--ink)]">
                  {Object.values(BOBOT_SAW)
                    .map((w) => Math.round(w * 100))
                    .join('/')}
                </b>
              </span>
            </div>
          </header>

          <SealChain
            segelList={segelList}
            statusList={statusList}
            entriList={entriList}
            tampered={tampered}
            onToggleTamper={toggleManipulasi}
            allowTamper={peran === 'PANITIA' || peran === 'AUDITOR'}
          />

          {peran === 'PANITIA' && (
            <PanitiaView
              hasilSAW={hasilSAW}
              belumDinilai={belumDinilai}
              entriList={entriList}
              slotPeran={slots}
              penanda={penanda}
              kandidatDiubah={segelList
                .filter((_, i) => statusList[i] === 'diubah')
                .map((s) => entriList.find((e) => e.id === s.entriId)?.kandidatId ?? '')}
              dipilih={dipilih}
              onPilih={setDipilih}
              onTetapkan={tetapkan}
              onKosongkan={kosongkan}
            />
          )}
          {peran === 'VERIFIKATOR' && (
            <VerifikatorView key={ormawa} antrean={antrean} riwayat={riwayatVerif} verifikator={identitas.verifikator} onSetujui={setujui} onTolak={tolak} />
          )}
          {peran === 'ANGGOTA' && (
            <AnggotaView
              key={ormawa}
              anggota={anggota}
              entriSaya={entriList.filter((e) => e.kandidatId === anggota.id)}
              skorSaya={hasilSAW.find((h) => h.kandidatId === anggota.id) ?? null}
              onKirim={kirim}
            />
          )}
          {peran === 'AUDITOR' && (
            <AuditorView
              ormawa={ormawa}
              segelList={segelList}
              statusList={statusList}
              entriList={entriList}
              auditLog={auditLog}
              penanda={penanda}
              logPemeriksaan={logPemeriksaan}
              onPeriksa={periksa}
              sedangMemeriksa={sedangMemeriksa}
            />
          )}
        </div>
      </main>

      {modal && (
        <JustifikasiModal
          namaPeran={slots.find((s) => s.kodePeran === modal.kode)!.namaPeran}
          pilihan={{ nama: pisahNama(hasilSAW.find((h) => h.kandidatId === modal.kandidatId)!.namaKandidat).nama, skor: modal.fit }}
          pembanding={modal.pembanding}
          onBatal={() => setModal(null)}
          onSimpan={(alasan) => terapkan(modal.kode, modal.kandidatId, modal.fit, alasan)}
        />
      )}
    </div>
  );
}
