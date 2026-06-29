import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

const voucherSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf kapital dan angka'),
  description: z.string().max(200).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  maxUsage: z.number().int().positive(),
  minPurchase: z.number().min(0).optional(),
  expiresAt: z.string().optional(),
})

// GET /api/admin/vouchers
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'ADMIN')
  if (error) return error

  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vouchers)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/vouchers
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'ADMIN')
  if (error) return error

  try {
    const body = await request.json()
    const parsed = voucherSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.voucher.findUnique({ where: { code: parsed.data.code } })
    if (existing) {
      return NextResponse.json({ error: 'Kode voucher sudah digunakan' }, { status: 409 })
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: parsed.data.code,
        description: parsed.data.description || null,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        maxUsage: parsed.data.maxUsage,
        minPurchase: parsed.data.minPurchase || 0,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    })

    return NextResponse.json(voucher, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
