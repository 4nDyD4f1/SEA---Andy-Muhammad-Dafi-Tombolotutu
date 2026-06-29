import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/vouchers/validate?code=XXX&subtotal=XXX - Public voucher validation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const subtotal = parseFloat(searchParams.get('subtotal') || '0')
  const storeId = searchParams.get('storeId')

  if (!code) {
    return NextResponse.json({ error: 'Kode voucher diperlukan' }, { status: 400 })
  }

  try {
    const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } })

    if (!voucher) {
      return NextResponse.json({ valid: false, error: 'Kode voucher tidak valid' })
    }

    // Check if it's a global voucher or store-specific
    if (voucher.storeId && voucher.storeId !== storeId) {
      return NextResponse.json({ valid: false, error: 'Voucher ini tidak berlaku untuk toko ini' })
    }

    const now = new Date()
    if (voucher.expiresAt && new Date(voucher.expiresAt) < now) {
      return NextResponse.json({ valid: false, error: 'Voucher sudah kadaluarsa' })
    }

    if (voucher.usedCount >= voucher.maxUsage) {
      return NextResponse.json({ valid: false, error: 'Kuota voucher sudah habis' })
    }

    if (subtotal < voucher.minPurchase) {
      return NextResponse.json({
        valid: false,
        error: `Minimum pembelian Rp ${voucher.minPurchase.toLocaleString('id-ID')}`,
      })
    }

    const discountAmount =
      voucher.discountType === 'PERCENTAGE'
        ? (subtotal * voucher.discountValue) / 100
        : voucher.discountValue

    return NextResponse.json({
      valid: true,
      voucher,
      discountAmount,
      remainingQuota: voucher.maxUsage - voucher.usedCount,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
