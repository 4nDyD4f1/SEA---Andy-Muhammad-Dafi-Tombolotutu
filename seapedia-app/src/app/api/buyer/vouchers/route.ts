import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request, 'BUYER')
    if (error) return error
    
    const userId = auth.userId

    // Fetch all user vouchers
    const userVouchers = await prisma.userVoucher.findMany({
      where: { userId },
      include: {
        voucher: {
          include: {
            store: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(userVouchers)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = requireAuth(request, 'BUYER')
    if (error) return error
    
    const userId = auth.userId

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Kode voucher harus diisi' }, { status: 400 })
    }

    // Find voucher by code
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!voucher) {
      return NextResponse.json({ error: 'Kode voucher tidak valid' }, { status: 404 })
    }

    // Check expiration
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      return NextResponse.json({ error: 'Voucher sudah kedaluwarsa' }, { status: 400 })
    }

    // Check if already claimed
    const existing = await prisma.userVoucher.findUnique({
      where: {
        userId_voucherId: {
          userId,
          voucherId: voucher.id
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Anda sudah mengklaim voucher ini' }, { status: 400 })
    }

    // Claim
    const userVoucher = await prisma.userVoucher.create({
      data: {
        userId,
        voucherId: voucher.id
      }
    })

    return NextResponse.json({ success: true, userVoucher }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
