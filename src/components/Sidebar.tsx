'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  PenLine,
  ClipboardCheck,
  ChartColumn,
  Users,
  TriangleAlert,
  ScrollText,
  Settings2,
  House,
  UserRound,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Logo } from './Logo';
import { menuOrg, NAMA_PERAN, NAMA_PERAN_GLOBAL } from '@/lib/menu';
import type { PeranGlobal, PeranOrg } from '@/lib/types';
import { keluar } from '@/app/actions/auth';

const IKON: Record<string, React.ElementType> = {
  ringkasan: LayoutGrid,
  kontribusi: PenLine,
  verifikasi: ClipboardCheck,
  kandidat: ChartColumn,
  penetapan: Users,
  penanda: TriangleAlert,
  audit: ScrollText,
  kelola: Settings2,
};

export type OrgMenu = { slug: string; singkatan: string; nama: string; peran: PeranOrg[]; aktif: boolean };

export default function Sidebar({ nama, email, peranGlobal, orgs }: { nama: string; email: string; peranGlobal: PeranGlobal; orgs: OrgMenu[] }) {
  const path = usePathname();
  const [buka, setBuka] = useState(false);
  const [pilihOrg, setPilihOrg] = useState(false);
  useEffect(() => {
    setBuka(false);
    setPilihOrg(false);
  }, [path]);

  const slugAktif = path.startsWith('/o/') ? path.split('/')[2] : null;
  const global = peranGlobal !== 'MAHASISWA';
  const orgAktif = orgs.find((o) => o.slug === slugAktif) ?? null;
  const tersedia = orgs.filter((o) => o.aktif || global);
  const menu = orgAktif && (orgAktif.aktif || global) ? menuOrg(orgAktif.slug, orgAktif.aktif ? orgAktif.peran : [], peranGlobal) : [];

  const tautan = (href: string, label: string, Icon: React.ElementType, persis = false) => {
    const aktif = persis ? path === href : path === href || path.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={aktif ? 'page' : undefined}
        className="relative flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm font-semibold transition-colors"
        style={{ background: aktif ? 'var(--navy-2)' : 'transparent', color: aktif ? '#fff' : '#d5dde6' }}
      >
        {aktif && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: 'var(--telkom)' }} />}
        <Icon className="w-4 h-4 shrink-0" style={{ color: aktif ? '#fff' : 'var(--navy-text)' }} />
        {label}
      </Link>
    );
  };

  return (
    <aside className="on-navy lg:sticky lg:top-0 lg:h-screen lg:w-[268px] shrink-0 flex flex-col text-white" style={{ background: 'var(--navy)' }}>
      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/beranda" className="flex items-center gap-3">
          <Logo />
          <span className="leading-tight">
            <span className="block font-extrabold text-[1.02rem] tracking-[-0.02em]">SIGAP Kaderisasi</span>
            <span className="block text-xs" style={{ color: 'var(--navy-text)' }}>
              Telkom University
            </span>
          </span>
        </Link>
        <button className="lg:hidden btn btn-ghost !text-white !p-2" onClick={() => setBuka((v) => !v)} aria-expanded={buka} aria-label="Menu">
          {buka ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className={`${buka ? 'flex' : 'hidden'} lg:flex flex-col flex-1 min-h-0`}>
        {/* Pemilih organisasi */}
        <div className="px-3 pb-3">
          <div className="relative">
            <button
              onClick={() => setPilihOrg((v) => !v)}
              aria-expanded={pilihOrg}
              className="w-full flex items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left"
              style={{ background: 'var(--navy-2)' }}
            >
              <span className="min-w-0">
                <span className="block text-[0.7rem]" style={{ color: 'var(--navy-text)' }}>
                  Organisasi
                </span>
                <span className="block text-sm font-semibold truncate">{orgAktif?.singkatan ?? 'Pilih organisasi'}</span>
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--navy-text)' }} />
            </button>
            {pilihOrg && (
              <ul className="absolute z-30 left-0 right-0 mt-1 rounded-[10px] py-1 shadow-lg" style={{ background: '#fff' }}>
                {tersedia.length === 0 && <li className="px-3 py-2 text-xs text-graphite">Belum ada organisasi aktif.</li>}
                {tersedia.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/o/${o.slug}`} className="block px-3 py-2 text-sm text-ink hover:bg-surface-2">
                      <span className="font-semibold">{o.singkatan}</span>
                      <span className="block text-xs text-graphite truncate">{o.peran.length ? o.peran.map((p) => NAMA_PERAN[p]).join(', ') : 'Pembaca'}</span>
                    </Link>
                  </li>
                ))}
                <li className="border-t mt-1 pt-1" style={{ borderColor: 'var(--line)' }}>
                  <Link href="/beranda" className="block px-3 py-2 text-xs font-semibold text-graphite hover:bg-surface-2">
                    Gabung organisasi lain
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto" aria-label="Navigasi utama">
          {menu.length > 0 && (
            <div className="grid gap-0.5 pb-4">
              {menu.map((m) => tautan(m.href, m.label, IKON[m.ikon] ?? LayoutGrid, m.href === `/o/${slugAktif}`))}
            </div>
          )}
          <p className="px-3 pb-1.5 text-[0.7rem]" style={{ color: 'var(--navy-text)' }}>
            Akun
          </p>
          <div className="grid gap-0.5">
            {tautan('/beranda', 'Beranda', House, true)}
            {tautan('/profil', 'Profil dan ekspor', UserRound)}
            {peranGlobal === 'SUPERADMIN' && tautan('/admin', 'Administrasi kampus', ShieldCheck)}
          </div>
        </nav>

        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--navy-line)' }}>
          <p className="text-sm font-semibold truncate">{nama}</p>
          <p className="text-xs truncate" style={{ color: 'var(--navy-text)' }}>
            {email}
            {global && ` (${NAMA_PERAN_GLOBAL[peranGlobal]})`}
          </p>
          {orgAktif && orgAktif.peran.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--navy-text)' }}>
              {orgAktif.singkatan}: {orgAktif.peran.map((p) => NAMA_PERAN[p]).join(', ')}
            </p>
          )}
          <form action={keluar} className="mt-3">
            <button type="submit" className="btn btn-ghost btn-sm !text-[color:var(--navy-text)] hover:!text-white !px-0">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
