import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request, 'SELLER')
    if (error) return error
    
    const payload = auth

    const store = await prisma.store.findUnique({
      where: { ownerId: payload.userId as string }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const vouchers = await prisma.voucher.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(vouchers)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request, 'SELLER')
    if (error) return error
    
    const payload = auth

    const store = await prisma.store.findUnique({
      where: { ownerId: payload.userId as string }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await request.json()
    const { code, description, discountType, discountValue, minPurchase, maxUsage, expiresAt } = body

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newVoucher = await prisma.voucher.create({
      data: {
        storeId: store.id,
        code: code.toUpperCase(),
        description: description || '',
        discountType,
        discountValue,
        minPurchase: minPurchase || 0,
        maxUsage: maxUsage || 100,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    })

    return NextResponse.json(newVoucher, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
