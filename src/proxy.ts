import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const sessionCode = request.cookies.get('session_code')?.value
    const { pathname } = request.nextUrl

    // Protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        if (!sessionCode) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Redirect to dashboard if logged in and visiting home
    if (pathname === '/' && sessionCode) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/admin/:path*'],
}
