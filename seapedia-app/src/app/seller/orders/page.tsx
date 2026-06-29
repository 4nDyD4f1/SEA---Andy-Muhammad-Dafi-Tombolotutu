'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useToast } from '@/components/ui/Toast'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('SEMUA')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/seller/orders')
      const data = await res.json()
      if (res.ok) setOrders(data.orders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessOrder = async (orderId: string) => {
    setIsProcessing(orderId)
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/process`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Pesanan diproses dan menunggu kurir!')
        // Update local state without refetching
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'MENUNGGU_PENGIRIM' } : o))
      } else {
        toast.error(data.error || 'Gagal memproses pesanan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsProcessing(null)
    }
  }

  const handleConfirmRefund = async (orderId: string) => {
    setIsProcessing(orderId)
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/confirm-refund`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Refund berhasil dikonfirmasi. Saldo dikembalikan ke pembeli.')
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'DIKEMBALIKAN' } : o))
      } else {
        toast.error(data.error || 'Gagal konfirmasi refund')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsProcessing(null)
    }
  }

  const tabs = [
    { id: 'SEMUA', label: 'Semua' },
    { id: 'SEDANG_DIKEMAS', label: 'Perlu Dikemas' },
    { id: 'MENUNGGU_PENGIRIM', label: 'Menunggu Kurir' },
    { id: 'SEDANG_DIKIRIM', label: 'Dikirim' },
    { id: 'MENUNGGU_REFUND', label: 'Refund/Retur' },
    { id: 'PESANAN_SELESAI', label: 'Selesai' },
    { id: 'DIKEMBALIKAN', label: 'Dikembalikan' },
  ]

  const filteredOrders = activeTab === 'SEMUA' ? orders : orders.filter(o => o.status === activeTab)

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <h1 className="text-headline-lg font-bold mb-2">Kelola Pesanan</h1>
      <p className="text-on-surface-variant mb-6">Proses pesanan pelanggan Anda tepat waktu untuk menghindari refund otomatis.</p>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6 border-b border-outline-variant">
        {tabs.map(tab => {
          const count = tab.id === 'SEMUA' ? orders.length : orders.filter(o => o.status === tab.id).length
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg whitespace-nowrap text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-white text-primary border-t-2 border-x-2 border-primary border-b-2 border-b-white translate-y-[2px] shadow-sm' 
                  : 'bg-transparent text-on-surface-variant hover:text-on-surface border-2 border-transparent'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 h-40 shimmer"></div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="card bg-white overflow-hidden border border-outline-variant">
              <div className="p-4 bg-surface-container-lowest border-b border-outline-variant flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                    <span className="font-bold text-on-surface">{order.buyer?.name}</span>
                  </div>
                  <span className="text-on-surface-variant text-sm border-l border-outline-variant pl-4">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-outline-variant font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-grow space-y-4 lg:border-r border-outline-variant/50 lg:pr-6">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 rounded-md bg-surface-container overflow-hidden shrink-0">
                        {item.product.imageUrl ? (
                          <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline-variant text-[20px]">image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">{item.quantity} barang x Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:w-64 flex flex-col justify-between shrink-0">
                  <div className="mb-4">
                    <p className="text-sm text-on-surface-variant mb-1">Pendapatan Bersih</p>
                    <p className="text-xl font-bold text-coral">Rp {(order.subtotal - order.discountAmount).toLocaleString('id-ID')}</p>
                    
                    <div className="mt-2 text-xs text-on-surface-variant space-y-1">
                      <p className="flex justify-between"><span>Subtotal:</span> <span>Rp {order.subtotal.toLocaleString('id-ID')}</span></p>
                      {order.discountAmount > 0 && (
                        <p className="flex justify-between text-tertiary"><span>Diskon:</span> <span>-Rp {order.discountAmount.toLocaleString('id-ID')}</span></p>
                      )}
                    </div>
                  </div>
                  
                  {order.status === 'SEDANG_DIKEMAS' && (
                    <button 
                      onClick={() => handleProcessOrder(order.id)}
                      disabled={isProcessing === order.id}
                      className="w-full btn-primary bg-secondary shadow-float flex justify-center items-center gap-2"
                    >
                      {isProcessing === order.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">package_2</span>
                          Proses Pesanan
                        </>
                      )}
                    </button>
                  )}

                  {order.status === 'MENUNGGU_REFUND' && (
                    <button 
                      onClick={() => handleConfirmRefund(order.id)}
                      disabled={isProcessing === order.id}
                      className="w-full bg-error hover:bg-error-container text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
                    >
                      {isProcessing === order.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">done_all</span>
                          Konfirmasi Refund
                        </>
                      )}
                    </button>
                  )}

                  {order.status === 'MENUNGGU_PENGIRIM' && order.slaDeadline && (
                    <div className="p-3 bg-error-container text-on-error-container rounded-lg text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">timer</span>
                      SLA: {new Date(order.slaDeadline).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm mt-8">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">list_alt</span>
          <h3 className="text-title-md font-bold text-on-surface">Tidak ada pesanan</h3>
          <p className="text-on-surface-variant mt-2">Belum ada pesanan dalam kategori ini.</p>
        </div>
      )}
    </div>
  )
}
