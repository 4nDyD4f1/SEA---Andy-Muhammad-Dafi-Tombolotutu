import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { SLA_HOURS } from '@/lib/utils'

// POST /api/admin/time-simulator
// Advances system date by 1 day and triggers SLA check
export async function POST(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'ADMIN')
  if (error) return error

  try {
    // Get current system date
    const systemConfig = await prisma.systemConfig.findUnique({ where: { key: 'CURRENT_DATE' } })
    const currentDate = systemConfig ? new Date(systemConfig.value) : new Date()

    // Advance by 24 hours
    const newDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)

    // Update system date
    await prisma.systemConfig.upsert({
      where: { key: 'CURRENT_DATE' },
      update: { value: newDate.toISOString() },
      create: { key: 'CURRENT_DATE', value: newDate.toISOString() },
    })

    // Check SLA - find overdue orders
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: 'MENUNGGU_PENGIRIM',
        slaDeadline: { lte: newDate },
      },
      include: {
        items: { include: { product: true } },
      },
    })

    const refundedOrderIds: string[] = []

    for (const order of overdueOrders) {
      await prisma.$transaction(async (tx) => {
        // Change status to DIKEMBALIKAN
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'DIKEMBALIKAN' },
        })

        // Restore stock for each item
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }

        // Refund buyer wallet
        await tx.user.update({
          where: { id: order.buyerId },
          data: { walletBalance: { increment: order.total } },
        })

        // Create refund transaction log
        await tx.walletTransaction.create({
          data: {
            userId: order.buyerId,
            type: 'REFUND',
            amount: order.total,
            description: `Refund otomatis - SLA melebihi batas waktu (Order #${order.id.slice(-6).toUpperCase()})`,
          },
        })
      })

      refundedOrderIds.push(order.id)
    }

    return NextResponse.json({
      message: `Tanggal sistem dimajukan ke ${newDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      previousDate: currentDate.toISOString(),
      newDate: newDate.toISOString(),
      overdueOrdersProcessed: overdueOrders.length,
      refundedOrderIds,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET current system date
export async function GET(request: NextRequest) {
  const { auth, error } = requireAuth(request, 'ADMIN')
  if (error) return error

  const config = await prisma.systemConfig.findUnique({ where: { key: 'CURRENT_DATE' } })
  return NextResponse.json({
    systemDate: config?.value || new Date().toISOString(),
  })
}
