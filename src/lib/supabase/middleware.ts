// Menyegarkan sesi Supabase di setiap request dan melindungi halaman.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const HALAMAN_TAMU = ['/masuk', '/daftar'];

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new NextResponse('SIGAP: salin .env.example menjadi .env.local lalu isi kunci Supabase (lihat README).', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Jangan taruh kode apa pun di antara createServerClient dan getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const tamu = HALAMAN_TAMU.some((p) => path.startsWith(p));
  const publik = tamu || path.startsWith('/api/') || path === '/';

  if (!user && !publik) {
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.searchParams.set('lanjut', path);
    return NextResponse.redirect(url);
  }
  if (user && tamu) {
    const url = request.nextUrl.clone();
    url.pathname = '/beranda';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return response;
}
