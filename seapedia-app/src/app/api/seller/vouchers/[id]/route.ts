import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// DELETE /api/seller/vouchers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = requireAuth(request, 'SELLER')
  if (error) return error
  const { id } = await params

  try {
    const store = await prisma.store.findUnique({ where: { ownerId: auth.userId } })
    if (!store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })
    }

    const voucher = await prisma.voucher.findUnique({ where: { id } })
    if (!voucher || voucher.storeId !== store.id) {
      return NextResponse.json({ error: 'Voucher tidak ditemukan' }, { status: 404 })
    }

    await prisma.voucher.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
