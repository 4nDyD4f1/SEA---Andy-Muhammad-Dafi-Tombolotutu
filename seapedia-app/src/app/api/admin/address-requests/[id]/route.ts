import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

const updateRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'])
})

// PUT /api/admin/address-requests/[id]
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAuth(request, 'ADMIN')
  if (error) return error
  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updateRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const { status } = parsed.data

    const addressRequest = await prisma.addressChangeRequest.findUnique({
      where: { id },
      include: { store: true }
    })

    if (!addressRequest) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
    }

    if (addressRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Pengajuan ini sudah diproses' }, { status: 400 })
    }

    // Process update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update request status
      await tx.addressChangeRequest.update({
        where: { id },
        data: { status }
      })

      // 2. If approved, update the store's address
      if (status === 'APPROVED') {
        await tx.store.update({
          where: { id: addressRequest.storeId },
          data: { address: addressRequest.newAddress }
        })
      }
    })

    return NextResponse.json({ success: true, status })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
