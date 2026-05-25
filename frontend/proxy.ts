import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CENTRALIZED EDGE ROUTING PROXY (proxy.ts)
 * 
 * Analogy:
 * Think of this proxy function like a strict bouncer standing at the main entrance gate
 * of an exclusive, private club (our application).
 * Before a visitor is allowed to take a single step inside the main lounge (/dashboard) or
 * visit the ticket counter (/login or /register), the bouncer stops them at the door,
 * inspects their entry pass (our session cookies), and instantly directs them to the correct
 * room before they can even look around, preventing any awkward confusion or layout flashes!
 */
export function proxy(request: NextRequest) {
  // 1. Extract the active URL pathname that the user is trying to access.
  const { pathname } = request.nextUrl;

  // 2. Sniff out the authentication access token from our secure request cookies.
  const isAuthenticated = request.cookies.has('access_token');

  // 3. Define our edge network routing rules.

  // RULE A: Protect the secure dashboard zone from unauthenticated traffic.
  // If the user tries to access a path starting with '/dashboard' but is not logged in:
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    // Instantly reroute them to the sign-in page to establish their session.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RULE B: Block authenticated users from accessing public entry paths.
  // If they are logged in and try to access '/login' or '/register':
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    // Instantly reroute them back to the secure root dashboard area, preventing redundant log-ins.
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Continue to the intended route if no routing rules are triggered.
  return NextResponse.next();
}

/**
 * PROXY MATCHER FILTER CONFIGURATION
 * 
 * We configure our edge filter pattern to intercept only target application paths,
 * while bypassing all static resources, assets, images, and standard web icons
 * to guarantee optimal routing speed and zero latency loops!
 */
export const config = {
  matcher: [
    // Apply our bouncer check exclusively on pages, preventing interference with Next.js background static compiler modules
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
