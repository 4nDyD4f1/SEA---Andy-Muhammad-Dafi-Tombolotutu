import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from './auth'

export function getAuthFromRequest(request: NextRequest): JWTPayload | null {
  try {
    // Try cookie first
    const cookieToken = request.cookies.get('seapedia_token')?.value
    if (cookieToken) return verifyToken(cookieToken)

    // Try Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      return verifyToken(token)
    }

    return null
  } catch {
    return null
  }
}

export function requireAuth(
  request: NextRequest,
  requiredRole?: string
): { auth: JWTPayload; error?: never } | { auth?: never; error: NextResponse } {
  const auth = getAuthFromRequest(request)

  if (!auth) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const currentRole = auth.activeRole || (auth.roles && auth.roles[0])

  if (requiredRole && currentRole !== requiredRole) {
    return {
      error: NextResponse.json(
        { error: `Access denied. Required role: ${requiredRole}` },
        { status: 403 }
      ),
    }
  }

  // Ensure activeRole is set on the returned auth object for downstream use
  if (!auth.activeRole && currentRole) {
    auth.activeRole = currentRole;
  }

  return { auth }
}
