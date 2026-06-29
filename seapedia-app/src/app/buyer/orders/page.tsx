'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { useToast } from '@/components/ui/Toast'
import { ImageUploader } from '@/components/ui/ImageUploader'

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('SEMUA')
  
  const toast = useToast()
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewImage, setReviewImage] = useState<string | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/buyer/orders')
      const data = await res.json()
      if (res.ok) setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Apakah Anda yakin telah menerima pesanan ini dengan baik?')) return

    try {
      const res = await fetch(`/api/buyer/orders/${orderId}/complete`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pesanan berhasil diselesaikan!')
        fetchOrders()
      } else {
        toast.error(data.error || 'Gagal menyelesaikan pesanan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleReviewOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderId) return

    setIsSubmittingReview(true)
    try {
      const res = await fetch(`/api/buyer/orders/${selectedOrderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          imageUrl: reviewImage
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Ulasan berhasil dikirim!')
        setIsReviewModalOpen(false)
        fetchOrders()
      } else {
        toast.error(data.error || 'Gagal mengirim ulasan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleRefundOrder = async (orderId: string) => {
    if (!confirm('Anda yakin ingin mengajukan refund untuk pesanan ini?')) return

    try {
      const res = await fetch(`/api/buyer/orders/${orderId}/refund`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pengajuan refund berhasil dikirim ke penjual')
        fetchOrders()
      } else {
        toast.error(data.error || 'Gagal mengajukan refund')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengajukan refund')
    }
  }

  const tabs = [
    { id: 'SEMUA', label: 'Semua' },
    { id: 'SEDANG_DIKEMAS', label: 'Dikemas' },
    { id: 'MENUNGGU_PENGIRIM', label: 'Menunggu Kurir' },
    { id: 'SEDANG_DIKIRIM', label: 'Dikirim' },
    { id: 'MENUNGGU_REFUND', label: 'Menunggu Refund' },
    { id: 'PESANAN_SELESAI', label: 'Selesai' },
    { id: 'DIKEMBALIKAN', label: 'Dikembalikan' },
  ]

  const filteredOrders = activeTab === 'SEMUA' ? orders : orders.filter(o => o.status === activeTab)

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-headline-lg font-bold mb-6">Daftar Pesanan & Pengeluaran</h1>
      
      {/* Expenditure Report */}
      {!isLoading && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-white p-6 border-l-4 border-coral shadow-sm">
            <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-coral">payments</span>
              Total Pengeluaran Selesai
            </p>
            <h2 className="text-3xl font-black text-on-surface">
              Rp {orders.filter(o => o.status === 'PESANAN_SELESAI').reduce((sum, o) => sum + o.total, 0).toLocaleString('id-ID')}
            </h2>
          </div>
          <div className="card bg-white p-6 border-l-4 border-primary shadow-sm">
            <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Pesanan Sedang Berjalan
            </p>
            <h2 className="text-3xl font-black text-on-surface">
              {orders.filter(o => ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM', 'SEDANG_DIKIRIM'].includes(o.status)).length} Transaksi
            </h2>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors border ${
              activeTab === tab.id 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
            <div key={order.id} className="card bg-white overflow-hidden">
              <div className="p-4 bg-surface-container-low border-b border-outline-variant flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
                    <span className="font-bold text-on-surface">{order.store.name}</span>
                  </div>
                  <span className="text-on-surface-variant text-sm border-l border-outline-variant pl-4">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-outline-variant font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-grow space-y-4 border-b md:border-b-0 md:border-r border-outline-variant/50 pb-4 md:pb-0 md:pr-6">
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
                  {order.items.length > 1 && (
                    <p className="text-xs text-primary font-medium cursor-pointer hover:underline">
                      + {order.items.length - 1} produk lainnya
                    </p>
                  )}
                </div>

                <div className="md:w-64 flex flex-col justify-center">
                  <p className="text-sm text-on-surface-variant mb-1">Total Belanja</p>
                  <p className="text-xl font-bold text-coral">Rp {order.total.toLocaleString('id-ID')}</p>
                  
                  {order.driver && (
                    <div className="mt-4 flex items-center gap-2 bg-tertiary/10 p-2 rounded-lg text-xs font-medium text-tertiary">
                      <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
                      Kurir: {order.driver.name}
                    </div>
                  )}

                  {order.status === 'SEDANG_DIKIRIM' && (
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleCompleteOrder(order.id)}
                        className="w-full bg-primary hover:bg-primary-container text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                        Pesanan Diterima
                      </button>
                      <button
                        onClick={() => handleRefundOrder(order.id)}
                        className="w-full bg-error hover:bg-error-container text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
                        Ajukan Refund
                      </button>
                    </div>
                  )}

                  {order.status === 'PESANAN_SELESAI' && !order.review && (
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id)
                          setRating(5)
                          setComment('')
                          setReviewImage(null)
                          setIsReviewModalOpen(true)
                        }}
                        className="w-full bg-secondary hover:bg-secondary-container text-on-secondary hover:text-secondary-container-content py-2 rounded-lg font-bold text-sm transition-colors shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">rate_review</span>
                        Beri Penilaian
                      </button>
                      <button
                        onClick={() => handleRefundOrder(order.id)}
                        className="w-full bg-white hover:bg-error/10 text-error border border-error py-2 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
                        Ajukan Refund
                      </button>
                    </div>
                  )}

                  {order.status === 'PESANAN_SELESAI' && order.review && (
                    <div className="mt-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex text-primary text-[14px]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`material-symbols-outlined ${star <= order.review.rating ? '[font-variation-settings:\'FILL\'_1]' : 'text-outline-variant/50'}`}>star</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-md font-medium">
                          {new Date(order.review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {order.review.comment && (
                        <p className="text-sm text-on-surface mb-3 leading-relaxed">{order.review.comment}</p>
                      )}
                      
                      {order.review.imageUrl && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-container border border-outline-variant/30 mt-2 mb-3 shadow-sm group">
                          <Image src={order.review.imageUrl} alt="Review image" fill className="object-cover transition-transform group-hover:scale-110" />
                        </div>
                      )}
                      
                      {new Date().getTime() - new Date(order.review.createdAt).getTime() < 48 * 60 * 60 * 1000 && (
                        <div className="border-t border-outline-variant/30 mt-3 pt-3 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id)
                              setRating(order.review.rating)
                              setComment(order.review.comment || '')
                              // Note: cannot pre-fill image file in input, so leave null
                              setReviewImage(null) 
                              setIsReviewModalOpen(true)
                            }}
                            className="text-sm text-primary font-bold hover:text-primary-container transition-colors flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit Penilaian
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm mt-8">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">receipt_long</span>
          <h3 className="text-title-md font-bold text-on-surface">Tidak ada pesanan</h3>
          <p className="text-on-surface-variant mt-2">Belum ada pesanan dengan status ini.</p>
        </div>
      )}
      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-float w-[90vw] md:w-[500px] max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-on-surface">Beri Penilaian</h2>
              <button onClick={() => setIsReviewModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleReviewOrder} className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-on-surface-variant font-medium">Berapa bintang untuk pesanan ini?</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="group transition-transform hover:scale-110 active:scale-95"
                    >
                      <span className={`material-symbols-outlined text-4xl [font-variation-settings:'FILL'_1] ${star <= rating ? 'text-amber-400 drop-shadow-md' : 'text-outline-variant'}`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface">Ulasan Anda</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full p-4 bg-surface-container-lowest border-2 border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary transition-all min-h-[100px] resize-y"
                  placeholder="Ceritakan pengalaman Anda berbelanja di toko ini..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface">Foto Produk (Opsional)</label>
                <ImageUploader
                  images={reviewImage ? [reviewImage] : []}
                  onChange={(imgs) => setReviewImage(imgs[0] || null)}
                  maxImages={1}
                />
                <p className="text-xs text-on-surface-variant">Klik atau seret foto ke area di atas</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-3 font-bold text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !comment}
                  className="flex-1 py-3 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingReview ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Kirim Ulasan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
