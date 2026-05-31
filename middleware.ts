import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = token.role as string

    // RECEPCIONISTA cannot access historias or documentos
    if (role === 'RECEPCIONISTA') {
      if (
        pathname.startsWith('/historias') ||
        pathname.startsWith('/documentos')
      ) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Only ADMINISTRADOR can access contabilidad and configuracion
    if (
      pathname.startsWith('/contabilidad') ||
      pathname.startsWith('/configuracion')
    ) {
      if (role !== 'ADMINISTRADOR') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pacientes/:path*',
    '/agenda/:path*',
    '/historias/:path*',
    '/contabilidad/:path*',
    '/configuracion/:path*',
    '/documentos/:path*',
  ],
}
