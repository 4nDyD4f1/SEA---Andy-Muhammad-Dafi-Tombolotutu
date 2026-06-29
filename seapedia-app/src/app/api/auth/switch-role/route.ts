import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { signToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/auth/switch-role
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request)
  if (error) return error

  const body = await request.json()
  const { role } = body

  if (!auth.roles.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { roles: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles.map((r) => r.role),
    activeRole: role,
  })

  const response = NextResponse.json({ message: 'Role switched', token, activeRole: role })

  response.cookies.set('seapedia_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
