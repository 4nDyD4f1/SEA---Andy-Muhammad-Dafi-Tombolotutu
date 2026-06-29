import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

const topupSchema = z.object({
  amount: z.number().positive().min(10000).max(10000000),
})

// POST /api/buyer/wallet/topup
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'BUYER')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = topupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Jumlah tidak valid (min Rp 10.000, max Rp 10.000.000)' }, { status: 400 })
    }

    const { amount } = parsed.data

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.userId },
        data: { walletBalance: { increment: amount } },
      })
      await tx.walletTransaction.create({
        data: {
          userId: auth.userId,
          type: 'TOPUP',
          amount,
          description: `Top-up saldo Rp ${amount.toLocaleString('id-ID')}`,
        },
      })
    })

    const updatedUser = await prisma.user.findUnique({ where: { id: auth.userId } })
    return NextResponse.json({
      message: `Saldo berhasil ditambahkan Rp ${amount.toLocaleString('id-ID')}`,
      newBalance: updatedUser?.walletBalance,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
