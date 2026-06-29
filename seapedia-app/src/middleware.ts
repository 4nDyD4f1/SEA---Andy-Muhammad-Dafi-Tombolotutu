import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_PREFIXES: Record<string, string[]> = {
  '/buyer': ['BUYER'],
  '/seller': ['SELLER'],
  '/driver': ['DRIVER'],
  '/admin': ['ADMIN'],
}

function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Find matching protected prefix
  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((prefix) =>
    pathname.startsWith(prefix)
  )

  if (!matchedPrefix) return NextResponse.next()

  const token = request.cookies.get('seapedia_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    const payload = decodeJwtPayload(token)
    if (!payload) throw new Error('Invalid token')
    
    const allowedRoles = ROLE_PREFIXES[matchedPrefix]
    
    if (!allowedRoles.includes(payload.activeRole)) {
      return NextResponse.redirect(new URL('/auth/select-role', request.url))
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('seapedia_token')
    return response
  }
}

export const config = {
  matcher: ['/buyer/:path*', '/seller/:path*', '/driver/:path*', '/admin/:path*'],
}
