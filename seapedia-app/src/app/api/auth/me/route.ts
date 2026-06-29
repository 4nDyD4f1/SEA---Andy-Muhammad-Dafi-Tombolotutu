import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { signToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/auth/me
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request)
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { roles: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((r) => r.role),
    activeRole: auth.activeRole,
    walletBalance: user.walletBalance,
  })
}
