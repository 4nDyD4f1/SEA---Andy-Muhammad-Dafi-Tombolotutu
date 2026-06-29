'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import DOMPurify from 'isomorphic-dompurify'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { addItem, storeName, clearCart } = useCartStore()
  const toast = useToast()
  
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [isBuyNow, setIsBuyNow] = useState(false)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])

  // Review Filtering State
  const [reviewFilter, setReviewFilter] = useState<string>('SEMUA')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProduct()
  }, [params.id])

  const handleAddToCart = async (directCheckout = false) => {
    if (!user || user.activeRole !== 'BUYER') {
      toast.info('Silakan login sebagai Pembeli terlebih dahulu')
      router.push('/auth/login')
      return
    }

    if (product.store.ownerId === user.id) {
      toast.error('Tidak dapat membeli produk dari toko Anda sendiri!')
      return
    }

    const status = addItem(product, product.store.id, product.store.name, quantity)
    
    if (status === 'different_store') {
      setIsBuyNow(directCheckout)
      setIsWarningOpen(true)
    } else {
      toast.success(`${product.name} dimasukkan ke keranjang`)
      try {
        await fetch('/api/buyer/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity })
        })
        if (directCheckout) {
          router.push('/buyer/checkout')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleReplaceCart = async () => {
    clearCart()
    try {
      await fetch('/api/buyer/cart', { method: 'DELETE' })
      
      addItem(product, product.store.id, product.store.name, quantity)
      await fetch('/api/buyer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity })
      })
      toast.success('Keranjang diperbarui')
      if (isBuyNow) {
        router.push('/buyer/checkout')
      }
    } catch (err) {
      toast.error('Gagal memperbarui')
    } finally {
      setIsWarningOpen(false)
    }
  }

  const handleClaimVoucher = async (code: string) => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      return router.push('/auth/login')
    }
    
    try {
      const res = await fetch('/api/buyer/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Voucher ${code} berhasil diklaim!`)
      } else {
        toast.error(data.error || 'Gagal mengklaim voucher')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    }
  }

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/${id}`)
      if (res.ok) {
        const data = await res.json()
        setChatHistory(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleChat = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      return router.push('/auth/login')
    }
    
    setIsChatOpen(true)
    
    // Init chat room
    if (!roomId) {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: product.store.id })
        })
        if (res.ok) {
          const room = await res.json()
          setRoomId(room.id)
          fetchMessages(room.id)
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      fetchMessages(roomId)
    }
  }

  // Poll messages while chat is open
  useEffect(() => {
    let interval: any;
    if (isChatOpen && roomId) {
      interval = setInterval(() => fetchMessages(roomId), 5000)
    }
    return () => clearInterval(interval)
  }, [isChatOpen, roomId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !roomId) return
    
    const sentText = chatMessage
    setChatMessage('')
    
    // Optimistic
    setChatHistory([...chatHistory, { 
      id: Date.now().toString(), 
      senderId: user?.id, 
      text: sentText, 
      createdAt: new Date().toISOString() 
    }])
    
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentText })
      })
      if (!res.ok) {
         fetchMessages(roomId)
         toast.error('Gagal mengirim pesan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <Navbar />
        <div className="container-app py-10 flex gap-8">
          <div className="w-[40%] aspect-square shimmer rounded-xl bg-white p-4"></div>
          <div className="flex-1 space-y-4 bg-white p-8 rounded-xl">
            <div className="h-10 shimmer w-3/4 rounded"></div>
            <div className="h-8 shimmer w-1/4 rounded"></div>
            <div className="h-32 shimmer w-full rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <Navbar />
        <div className="container-app py-20 text-center bg-white mt-8 rounded-xl shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">search_off</span>
          <h1 className="text-2xl font-bold">Produk Tidak Ditemukan</h1>
          <Link href="/" className="btn-primary mt-6 inline-flex">Kembali ke Beranda</Link>
        </div>
      </div>
    )
  }

  let imgs: string[] = []
  if (product.images) {
    try {
      imgs = JSON.parse(product.images)
    } catch (e) {
      imgs = product.imageUrl ? [product.imageUrl] : []
    }
  } else {
    imgs = product.imageUrl ? [product.imageUrl] : []
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  const reviews = product.reviews || []
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col text-on-surface">
      <Navbar />
      
      {/* BREADCRUMB */}
      <div className="container-app py-4 text-sm text-outline flex items-center gap-2">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 hover:text-primary transition-colors mr-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link href="/" className="hover:text-primary transition-colors">SEAPEDIA</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="hover:text-primary transition-colors cursor-pointer">{product.category || 'Umum'}</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="truncate max-w-xs">{product.name}</span>
      </div>

      <main className="flex-grow pb-12">
        <div className="container-app space-y-6">
          
          {/* 1. TOP HERO SECTION */}
          <div className="bg-white rounded shadow-sm flex flex-col md:flex-row">
            {/* Image Gallery - Swipeable */}
            <div className="w-full md:w-[40%] shrink-0 p-4">
              {/* Main Image with swipe */}
              <div 
                className="relative w-full aspect-square bg-surface-container rounded-sm overflow-hidden mb-4 cursor-grab active:cursor-grabbing"
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  const diff = touchStartX - e.changedTouches[0].clientX
                  if (Math.abs(diff) > 40 && imgs.length > 0) {
                    if (diff > 0) setSelectedImageIdx(i => Math.min(i + 1, imgs.length - 1))
                    else setSelectedImageIdx(i => Math.max(i - 1, 0))
                  }
                }}
              >
                {imgs.length > 0 ? (
                  <Image src={imgs[selectedImageIdx]} alt={product.name} fill className="object-cover transition-opacity duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-outline-variant">image</span>
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white px-6 py-2 rounded-full text-xl font-bold border-2 border-white">STOK HABIS</span>
                  </div>
                )}
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImageIdx(i => Math.max(i - 1, 0))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button onClick={() => setSelectedImageIdx(i => Math.min(i + 1, imgs.length - 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imgs.map((_, i) => (
                        <button key={i} onClick={() => setSelectedImageIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === selectedImageIdx ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                {/* Thumbnail Gallery */}
                {imgs.map((url, i) => (
                  <div key={i} onClick={() => setSelectedImageIdx(i)} className={`w-16 h-16 relative border-2 ${i === selectedImageIdx ? 'border-coral' : 'border-transparent'} hover:border-coral cursor-pointer rounded-sm overflow-hidden transition-all`}>
                     <Image src={url} alt={`Thumb ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-on-surface-variant">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('Link produk berhasil disalin!')
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">link</span> <span className="font-medium">Share</span>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="flex-grow p-6 md:p-8 flex flex-col">
              <h1 className="text-xl md:text-2xl text-on-surface font-medium mb-3 leading-snug">{product.name}</h1>
              
              <div className="flex items-center gap-4 text-sm mb-6 pb-4 border-b border-outline-variant/30">
                <div className="flex items-center gap-1 text-on-surface font-medium border-r border-outline-variant/30 pr-4">
                  <span className="text-base">{avgRating}</span>
                  <div className="flex text-primary text-[14px]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`material-symbols-outlined ${star <= Math.round(Number(avgRating)) ? '[font-variation-settings:\'FILL\'_1]' : 'text-outline-variant/50'}`}>star</span>
                    ))}
                  </div>
                </div>
                <div className="text-on-surface font-medium border-r border-outline-variant/30 pr-4 cursor-pointer hover:text-primary transition-colors">
                  {totalReviews} <span className="text-on-surface-variant font-normal">Penilaian</span>
                </div>
                <div className="text-on-surface font-medium">
                  0 <span className="text-on-surface-variant font-normal">Terjual</span>
                </div>
                <button className="ml-auto text-on-surface-variant hover:text-error transition-colors">
                  Laporkan
                </button>
              </div>

              {/* Price Tag */}
              <div className={`rounded-md p-4 mb-6 ${hasDiscount ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container-low border border-outline-variant/30'}`}>
                {hasDiscount && (
                  <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 inline-flex items-center gap-1 mb-2 rounded-sm">
                    <span className="material-symbols-outlined text-[14px]">bolt</span> POTONGAN HARGA
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-black text-primary">Rp{product.price.toLocaleString('id-ID')}</div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="line-through text-outline text-sm">Rp{product.originalPrice.toLocaleString('id-ID')}</span>
                      <span className="bg-primary/20 text-primary text-xs font-bold px-1 rounded-sm">-{discountPercent}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vouchers & Shipping Info */}
              <div className="grid grid-cols-[100px_1fr] gap-4 text-sm text-on-surface-variant mb-8">
                <div>Pengiriman</div>
                <div>
                  <div className="flex items-center gap-2 text-primary font-medium mb-1">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span> Garansi tiba Hari Ini, jika pesan sebelum 10:00
                  </div>
                  <div className="text-xs text-outline ml-6">Dapatkan Voucher s/d Rp10.000 jika pesanan terlambat.</div>
                </div>

                <div>Jaminan SEAPEDIA</div>
                <div className="text-on-surface flex items-center gap-1 text-xs">
                  <span className="material-symbols-outlined text-coral text-[16px]">verified_user</span> 
                  15 Hari Pengembalian &bull; 100% Original
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <span className="w-[100px] text-sm text-on-surface-variant">Kuantitas</span>
                  <div className="flex items-center border border-outline-variant rounded-sm overflow-hidden h-8">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface font-medium border-r border-outline-variant transition-colors">-</button>
                    <div className="w-12 h-full flex items-center justify-center text-sm font-medium">{quantity}</div>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock} className="w-8 h-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface font-medium border-l border-outline-variant transition-colors disabled:opacity-50">+</button>
                  </div>
                  <span className="text-sm text-on-surface-variant">Sisa {product.stock} buah</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 ml-[100px]">
                  <button onClick={() => handleAddToCart(false)} disabled={product.stock <= 0} className="flex-1 btn bg-coral/10 text-coral border border-coral hover:bg-coral/20 font-bold px-4 py-3 min-h-[48px] rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:border-outline disabled:text-outline disabled:bg-surface">
                    <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                    Masukkan Keranjang
                  </button>
                  <button onClick={() => handleAddToCart(true)} disabled={product.stock <= 0} className="flex-1 btn bg-coral hover:bg-secondary text-white font-bold px-4 py-3 min-h-[48px] rounded-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-outline">
                    Beli Sekarang
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 2. STORE INFO SECTION */}
          <div className="bg-white rounded shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
             {/* Store Avatar & Action */}
             <div className="flex items-center gap-4 md:w-1/3 shrink-0 md:border-r border-outline-variant/30 md:pr-8">
                <div className="w-20 h-20 rounded-full border border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0 relative bg-surface-container-low">
                   <Image src={product.store.imageUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + product.store.name} alt={product.store.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">{product.store.name}</h3>
                  <p className="text-xs text-on-surface-variant mb-2">Aktif 4 Menit Lalu</p>
                  <div className="flex gap-2">
                    <button onClick={handleChat} className="flex items-center gap-1 bg-primary/10 text-primary border border-primary px-2 py-1 text-xs rounded-sm hover:bg-primary/20 transition-colors font-medium">
                      <span className="material-symbols-outlined text-[14px]">chat</span> Chat Sekarang
                    </button>
                    <Link href={`/store/${product.store.id}`} className="flex items-center gap-1 border border-outline-variant text-on-surface px-2 py-1 text-xs rounded-sm hover:bg-surface-container transition-colors font-medium">
                      <span className="material-symbols-outlined text-[14px]">storefront</span> Kunjungi Toko
                    </Link>
                  </div>
                </div>
             </div>

             {/* Store Stats */}
             <div className="flex-grow grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm pt-4 md:pt-0">
                <div className="flex justify-between md:justify-start md:gap-4"><span className="text-on-surface-variant">Penilaian</span><span className="text-primary font-bold">0</span></div>
                <div className="flex justify-between md:justify-start md:gap-4"><span className="text-on-surface-variant">Persentase Chat Dibalas</span><span className="text-primary font-bold">100%</span></div>
                <div className="flex justify-between md:justify-start md:gap-4"><span className="text-on-surface-variant">Bergabung</span><span className="text-primary font-bold">Baru saja</span></div>
                <div className="flex justify-between md:justify-start md:gap-4"><span className="text-on-surface-variant">Produk</span><span className="text-primary font-bold">1</span></div>
                <div className="flex justify-between md:justify-start md:gap-4"><span className="text-on-surface-variant">Waktu Chat Dibalas</span><span className="text-primary font-bold">hitungan menit</span></div>
                <div className="flex justify-between md:justify-start md:gap-4"><span className="text-on-surface-variant">Pengikut</span><span className="text-primary font-bold">0</span></div>
             </div>
          </div>

          {/* 3. PRODUCT DETAILS & SPECS */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-grow space-y-6">
              
              {/* Specs */}
              <div className="bg-white rounded shadow-sm p-6 md:p-8">
                <div className="bg-surface-container-low p-3 mb-6 rounded-sm">
                  <h2 className="text-lg font-bold text-on-surface">Spesifikasi Produk</h2>
                </div>
                <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] gap-4 text-sm text-on-surface mb-8">
                  <div className="text-on-surface-variant">Kategori</div>
                  <div className="flex items-center gap-1 text-primary cursor-pointer hover:underline">
                    SEAPEDIA <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span> {product.category || 'Umum'}
                  </div>
                  
                  <div className="text-on-surface-variant">Merek</div>
                  <div className="text-primary hover:underline cursor-pointer">Original Brand</div>
                  
                  <div className="text-on-surface-variant">Negara Asal</div>
                  <div>Indonesia</div>

                  <div className="text-on-surface-variant">Masa Garansi</div>
                  <div>12 Bulan</div>

                  <div className="text-on-surface-variant">Stok</div>
                  <div>{product.stock}</div>

                  <div className="text-on-surface-variant">Dikirim Dari</div>
                  <div>Kota Jakarta Pusat, DKI Jakarta</div>
                </div>

                {/* Description */}
                <div className="bg-surface-container-low p-3 mb-6 rounded-sm mt-10">
                  <h2 className="text-lg font-bold text-on-surface">Deskripsi Produk</h2>
                </div>
                <div 
                  className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap font-sans"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || 'Tidak ada deskripsi rinci untuk produk ini.') }}
                ></div>
              </div>

              {/* 4. RATINGS & REVIEWS */}
              <div className="bg-white rounded shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold text-on-surface mb-6">Penilaian Produk</h2>
                
                {(() => {
                  const counts = {
                    '5': reviews.filter((r: any) => r.rating === 5).length,
                    '4': reviews.filter((r: any) => r.rating === 4).length,
                    '3': reviews.filter((r: any) => r.rating === 3).length,
                    '2': reviews.filter((r: any) => r.rating === 2).length,
                    '1': reviews.filter((r: any) => r.rating === 1).length,
                    'KOMENTAR': reviews.filter((r: any) => r.comment && r.comment.length > 0).length,
                    'MEDIA': reviews.filter((r: any) => !!r.imageUrl).length,
                  }

                  const filteredReviews = reviews.filter((r: any) => {
                    if (reviewFilter === 'SEMUA') return true
                    if (reviewFilter === 'KOMENTAR') return r.comment && r.comment.length > 0
                    if (reviewFilter === 'MEDIA') return !!r.imageUrl
                    return r.rating === parseInt(reviewFilter)
                  })

                  const activeClass = "bg-white border border-primary text-primary px-4 py-2 rounded-sm text-sm"
                  const inactiveClass = "bg-white border border-outline-variant text-on-surface px-4 py-2 rounded-sm text-sm hover:border-primary transition-colors"

                  return (
                    <>
                      {/* Summary Box */}
                      <div className="bg-primary/5 border border-primary/20 rounded-md p-6 flex flex-col md:flex-row items-center gap-8 mb-8">
                        <div className="text-center shrink-0">
                          <div className="text-primary flex items-baseline justify-center gap-1 mb-1">
                            <span className="text-5xl font-black">{avgRating}</span>
                            <span className="text-xl">dari 5</span>
                          </div>
                          <div className="flex text-primary/30 text-2xl justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`material-symbols-outlined ${star <= Math.round(Number(avgRating)) ? 'text-primary [font-variation-settings:\'FILL\'_1]' : ''}`}>star</span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
                          <button onClick={() => setReviewFilter('SEMUA')} className={reviewFilter === 'SEMUA' ? activeClass : inactiveClass}>Semua ({totalReviews})</button>
                          <button onClick={() => setReviewFilter('5')} className={reviewFilter === '5' ? activeClass : inactiveClass}>5 Bintang ({counts['5']})</button>
                          <button onClick={() => setReviewFilter('4')} className={reviewFilter === '4' ? activeClass : inactiveClass}>4 Bintang ({counts['4']})</button>
                          <button onClick={() => setReviewFilter('3')} className={reviewFilter === '3' ? activeClass : inactiveClass}>3 Bintang ({counts['3']})</button>
                          <button onClick={() => setReviewFilter('2')} className={reviewFilter === '2' ? activeClass : inactiveClass}>2 Bintang ({counts['2']})</button>
                          <button onClick={() => setReviewFilter('1')} className={reviewFilter === '1' ? activeClass : inactiveClass}>1 Bintang ({counts['1']})</button>
                          <button onClick={() => setReviewFilter('KOMENTAR')} className={reviewFilter === 'KOMENTAR' ? activeClass : inactiveClass}>Dengan Komentar ({counts['KOMENTAR']})</button>
                          <button onClick={() => setReviewFilter('MEDIA')} className={reviewFilter === 'MEDIA' ? activeClass : inactiveClass}>Dengan Media ({counts['MEDIA']})</button>
                        </div>
                      </div>

                      {/* Review Items */}
                      <div className="space-y-6">
                        {filteredReviews.length > 0 ? filteredReviews.map((review: any, i: number) => (
                          <div key={review.id} className={`${i !== 0 ? 'border-t border-outline-variant/30 pt-6' : ''}`}>
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-surface-container shrink-0 flex items-center justify-center font-bold text-outline-variant overflow-hidden">
                                <Image src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.name}`} alt={review.name} width={40} height={40} />
                              </div>
                              <div className="flex-grow">
                                <div className="text-xs font-semibold text-on-surface mb-1">{review.name}</div>
                                <div className="flex text-primary text-[12px] mb-2">
                                  {[1,2,3,4,5].map(star => (
                                    <span key={star} className={`material-symbols-outlined ${star <= review.rating ? '[font-variation-settings:\'FILL\'_1]' : ''}`}>star</span>
                                  ))}
                                </div>
                                <div className="text-xs text-on-surface-variant mb-4">{new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                
                                <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed mb-3">
                                  {review.comment}
                                </p>

                                {review.imageUrl && (
                                   <div className="flex gap-2 mb-3">
                                      <div className="w-16 h-16 bg-surface-container rounded-sm border border-outline-variant/30 flex items-center justify-center overflow-hidden">
                                        <Image src={review.imageUrl} alt="Review" width={64} height={64} className="w-full h-full object-cover" />
                                      </div>
                                   </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-12 flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">rate_review</span>
                            <p className="text-on-surface-variant font-medium">Belum ada penilaian</p>
                            <p className="text-sm text-outline mt-1">Jadilah yang pertama memberikan penilaian setelah membeli!</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Right Sidebar (Vouchers - Desktop Only) */}
            <div className="hidden lg:block w-[300px] shrink-0">
               <div className="bg-white rounded shadow-sm p-4 sticky top-24 border border-outline-variant/30">
                  <h3 className="font-bold text-sm text-on-surface mb-4">Voucher Toko</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto hide-scrollbar">
                     {product.store.vouchers && product.store.vouchers.length > 0 ? (
                       product.store.vouchers.map((v: any) => (
                         <div key={v.id} className="flex bg-primary/5 border border-primary/20 rounded overflow-hidden">
                            <div className="flex-grow p-3 border-r border-dashed border-primary/40 relative">
                               <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-primary/20"></div>
                               <div className="text-primary font-bold text-sm">
                                 {v.discountType === 'FIXED' ? `Diskon Rp${(v.discountValue / 1000).toLocaleString('id-ID')}RB` : `Diskon ${v.discountValue}%`}
                               </div>
                               <div className="text-xs text-on-surface-variant mb-2">Min. Blj Rp{(v.minPurchase / 1000).toLocaleString('id-ID')}RB</div>
                               <div className="text-[10px] text-primary/80">Kode: {v.code}</div>
                            </div>
                            <div className="w-[72px] shrink-0 flex items-center justify-center p-2">
                               <button onClick={() => handleClaimVoucher(v.code)} className="bg-primary text-white text-xs font-bold py-1.5 px-3 rounded-sm hover:bg-primary-container w-full transition-colors">Klaim</button>
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-xs text-outline italic">Belum ada voucher.</div>
                     )}
                  </div>
               </div>
            </div>
          </div>

        </div>
      </main>

      <Modal isOpen={isWarningOpen} onClose={() => setIsWarningOpen(false)} title="Peringatan Toko Berbeda">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-secondary mx-auto flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <p className="text-body-lg mb-4">
            Keranjang Anda saat ini berisi produk dari toko <strong>{storeName}</strong>. 
            Apakah Anda ingin mengosongkan keranjang dan mulai belanja dari toko <strong>{product?.store?.name}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsWarningOpen(false)} className="btn-outline flex-1">
              Batal
            </button>
            <button onClick={handleReplaceCart} className="btn-primary bg-secondary flex-1">
              Ya, Ganti Toko
            </button>
          </div>
        </div>
      </Modal>

      {/* CHAT MODAL */}
      <Modal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} title={`Chat dengan ${product?.store?.name}`}>
        <div className="flex flex-col h-[60vh] md:h-[400px]">
          <div className="flex-grow overflow-y-auto bg-surface-container-lowest p-4 space-y-4">
            {chatHistory.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface-container-low text-on-surface rounded-tl-none'}`}>
                    <div>{msg.text}</div>
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-container/80 text-right' : 'text-outline text-left'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t border-outline-variant/30 pt-4">
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Tulis pesan..." 
              className="flex-grow border border-outline-variant rounded-full px-4 py-2 text-sm focus:outline-primary"
            />
            <button type="submit" disabled={!chatMessage.trim()} className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary disabled:opacity-50 disabled:bg-outline transition-colors">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
