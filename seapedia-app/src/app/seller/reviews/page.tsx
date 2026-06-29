'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/seller/reviews')
        const data = await res.json()
        if (res.ok) setReviews(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchReviews()
  }, [])

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <h1 className="text-headline-lg font-bold mb-2">Penilaian Pembeli</h1>
      <p className="text-on-surface-variant mb-6">Pantau dan kelola ulasan dari produk Anda.</p>

      {!isLoading && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-white p-6 border-l-4 border-amber-400 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">star</span>
                Rata-Rata Rating
              </p>
              <h2 className="text-4xl font-black text-on-surface flex items-baseline gap-2">
                {averageRating} <span className="text-lg font-medium text-on-surface-variant">/ 5.0</span>
              </h2>
            </div>
            <div className="text-amber-400">
              <span className="material-symbols-outlined text-5xl [font-variation-settings:'FILL'_1]">star</span>
            </div>
          </div>
          <div className="card bg-white p-6 border-l-4 border-primary shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                Total Ulasan
              </p>
              <h2 className="text-4xl font-black text-on-surface">
                {reviews.length}
              </h2>
            </div>
            <div className="text-primary/20">
              <span className="material-symbols-outlined text-5xl">forum</span>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 h-40 shimmer"></div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="card bg-white p-6 flex flex-col md:flex-row gap-6 shadow-sm border border-outline-variant hover:shadow transition-shadow">
              
              {/* Product Info */}
              <div className="md:w-1/3 shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/50 pb-4 md:pb-0 md:pr-6 space-y-3">
                <p className="text-xs font-semibold text-primary mb-2">No. Pesanan: #{review.order?.id.slice(-6).toUpperCase()}</p>
                {review.order?.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded bg-surface-container overflow-hidden shrink-0">
                      {item.product?.imageUrl ? (
                        <Image src={item.product.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline-variant text-[16px]">inventory_2</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Content */}
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-on-surface">{review.name}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`material-symbols-outlined text-lg ${star <= review.rating ? 'text-amber-400 [font-variation-settings:"FILL"_1]' : 'text-outline-variant'}`}
                    >
                      star
                    </span>
                  ))}
                </div>

                <p className="text-sm text-on-surface mb-4 whitespace-pre-wrap">{review.comment}</p>

                {review.imageUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-outline-variant cursor-pointer hover:opacity-90 transition-opacity">
                    <Image src={review.imageUrl} alt="Review Image" fill className="object-cover" />
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm mt-8">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">rate_review</span>
          <h3 className="text-title-md font-bold text-on-surface">Belum ada penilaian</h3>
          <p className="text-on-surface-variant mt-2">Ulasan dari pembeli akan muncul di sini setelah mereka mengonfirmasi penerimaan pesanan.</p>
        </div>
      )}
    </div>
  )
}
