import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/buyer/wallet
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      balance: user.walletBalance,
      transactions,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
