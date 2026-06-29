'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { ProductCard, Product } from '@/components/product/ProductCard'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import DOMPurify from 'isomorphic-dompurify'

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Elektronik')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          fetch('/api/products?limit=50'),
          fetch('/api/reviews')
        ])
        const prods = await prodRes.json()
        const revs = await revRes.json()
        
        if (prodRes.ok) setProducts(prods.products || [])
        if (revRes.ok) setReviews(revs)
      } catch (error) {
        console.error('Failed to fetch data', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesTab = activeTab === 'Semua' || p.category?.toLowerCase().includes(activeTab.toLowerCase()) || activeTab.toLowerCase().includes(p.category?.toLowerCase() || '')
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Ulasan berhasil ditambahkan!')
        setIsReviewModalOpen(false)
        setReviews([data, ...reviews])
        setReviewName('')
        setReviewComment('')
        setReviewRating(5)
      } else {
        toast.error(data.error || 'Gagal menambahkan ulasan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative hero-gradient text-white overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1600')] bg-cover bg-center mix-blend-overlay opacity-10"></div>
          
          <div className="container-app relative z-10 flex flex-col items-center text-center animate-slide-up">
            <h1 className="text-display-lg font-black mb-6 drop-shadow-md leading-tight">
              Samudra Belanja <br className="md:hidden" />
              <span className="text-coral">Terbaik Indonesia</span>
            </h1>
            <p className="text-body-lg md:text-title-md max-w-2xl text-white/90 mb-10">
              SEAPEDIA adalah marketplace multi-peran yang mempertemukan pembeli, penjual, dan driver dalam satu ekosistem yang terintegrasi dan aman.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/auth/login" className="btn bg-coral hover:bg-secondary text-white shadow-float text-lg px-8 py-3 w-full sm:w-auto">
                Mulai Belanja
              </Link>
              <Link href="/auth/register" className="btn border-2 border-white text-white hover:bg-white hover:text-primary transition-colors text-lg px-8 py-3 w-full sm:w-auto">
                Daftar Gratis
              </Link>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
            <svg className="relative block w-full h-[60px] md:h-[120px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#f9f9fc" fillOpacity="0.3" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,144C1248,149,1344,203,1392,229.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#f9f9fc" fillOpacity="0.5" d="M0,128L48,144C96,160,192,192,288,181.3C384,171,480,117,576,106.7C672,96,768,128,864,160C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#f9f9fc" fillOpacity="0.7" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,213.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#f9f9fc" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,202.7C384,192,480,160,576,149.3C672,139,768,149,864,165.3C960,181,1056,203,1152,213.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="bg-surface relative z-20 -mt-8 mb-16 px-4">
          <div className="container-app">
            <div className="bg-white rounded-2xl shadow-modal grid grid-cols-3 divide-x divide-outline-variant p-6 max-w-4xl mx-auto border border-outline-variant/30">
              <div className="text-center flex flex-col items-center justify-center p-2">
                <span className="material-symbols-outlined text-4xl text-primary mb-2">shopping_bag</span>
                <h3 className="text-xl md:text-3xl font-black text-on-surface">10K+</h3>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium">Produk</p>
              </div>
              <div className="text-center flex flex-col items-center justify-center p-2">
                <span className="material-symbols-outlined text-4xl text-coral mb-2">storefront</span>
                <h3 className="text-xl md:text-3xl font-black text-on-surface">500+</h3>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium">Penjual Aktif</p>
              </div>
              <div className="text-center flex flex-col items-center justify-center p-2">
                <span className="material-symbols-outlined text-4xl text-tertiary mb-2">group</span>
                <h3 className="text-xl md:text-3xl font-black text-on-surface">50K+</h3>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium">Pembeli</p>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOG SECTION */}
        <section className="page-section bg-surface">
          <div className="container-app">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-headline-lg font-bold mb-2">Produk Terbaru</h2>
                <p className="text-on-surface-variant">Temukan berbagai produk unggulan dari penjual terpercaya.</p>
              </div>
              
              <div className="w-full md:w-auto flex flex-col items-end gap-3">
                <div className="relative w-full md:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input 
                    type="text" 
                    placeholder="Cari produk..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full rounded-full"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 max-w-[100vw] sm:max-w-none">
                  {['Semua', 'Elektronik', 'Fashion', 'Makanan', 'Otomotif'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors border ${
                        activeTab === tab 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="card overflow-hidden h-[300px] flex flex-col">
                    <div className="w-full aspect-square shimmer"></div>
                    <div className="p-4 flex-grow flex flex-col gap-2">
                      <div className="h-4 shimmer rounded w-3/4"></div>
                      <div className="h-4 shimmer rounded w-1/2"></div>
                      <div className="h-8 shimmer rounded mt-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={() => {
                      toast.info('Silakan login sebagai Pembeli terlebih dahulu')
                      router.push('/auth/login')
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-outline-variant shadow-sm">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">search_off</span>
                <h3 className="text-title-md font-bold text-on-surface">Tidak ada produk</h3>
                <p className="text-on-surface-variant mt-2">Belum ada produk untuk kategori ini.</p>
              </div>
            )}
            
            {!isLoading && products.length > 0 && (
              <div className="text-center mt-10">
                <button 
                  onClick={() => {
                    setActiveTab('Semua')
                    setSearchQuery('')
                  }}
                  className="btn-outline border-outline-variant text-on-surface hover:border-primary hover:text-primary hover:bg-transparent bg-white shadow-sm">
                  Lihat Semua Produk
                </button>
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="page-section bg-surface-container-lowest border-y border-outline-variant">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-headline-lg font-bold mb-4">Cara Kerja SEAPEDIA</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">Satu platform dengan 4 peran berbeda. Anda bisa mendaftar dan memilih peran yang sesuai dengan kebutuhan Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { title: 'Pembeli', icon: 'shopping_bag', color: 'text-coral', bg: 'bg-secondary-fixed', points: ['Cari produk dengan mudah', 'Checkout aman', 'Lacak pesanan realtime'] },
                { title: 'Penjual', icon: 'storefront', color: 'text-primary', bg: 'bg-primary-fixed', points: ['Buka toko gratis', 'Kelola stok produk', 'Tarik penghasilan'] },
                { title: 'Driver', icon: 'local_shipping', color: 'text-tertiary', bg: 'bg-tertiary-fixed', points: ['Ambil job pengiriman', 'SLA 24 jam', 'Komisi tiap sukses'] },
              ].map(role => (
                <div key={role.title} className="card p-6 text-center hover:shadow-float transition-all duration-500 ease-out hover:-translate-y-2">
                  <div className={`w-16 h-16 rounded-2xl mx-auto ${role.bg} flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined text-[32px] ${role.color}`}>{role.icon}</span>
                  </div>
                  <h3 className="text-title-md font-bold mb-4">{role.title}</h3>
                  <ul className="text-left text-sm text-on-surface-variant space-y-2">
                    {role.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS SECTION */}
        <section className="page-section bg-surface overflow-hidden">
          <div className="container-app">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
              <div>
                <h2 className="text-headline-lg font-bold mb-2 text-center sm:text-left">Ulasan Pengguna</h2>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-3xl font-black text-amber-500">{avgRating}</span>
                  <div className="flex text-amber-500">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={`material-symbols-outlined ${star <= Math.round(Number(avgRating)) ? 'material-symbols-filled' : ''}`}>star</span>
                    ))}
                  </div>
                  <span className="text-on-surface-variant text-sm">({reviews.length} ulasan)</span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden pb-8 -mx-4 px-4 md:mx-0 md:px-0 group">
              {/* Fade masks for smooth edges */}
              <div className="absolute top-0 left-0 w-8 md:w-16 h-full bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-8 md:w-16 h-full bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none"></div>
              
              <div className="flex gap-4 md:gap-6 w-max animate-marquee">
                {/* Duplicate reviews to create seamless loop */}
                {[...(reviews || []), ...(reviews || []), ...(reviews || []), ...(reviews || [])].map((review, index) => (
                  <div key={`${review.id}-${index}`} className="card min-w-[280px] max-w-[320px] p-6 shrink-0 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{review.name}</h4>
                        <div className="flex text-amber-500 text-[14px]">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={`material-symbols-outlined text-[16px] ${star <= review.rating ? 'material-symbols-filled' : ''}`}>star</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p 
                      className="text-on-surface-variant text-sm italic"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.comment) }}
                    ></p>
                  </div>
                ))}
                {(!reviews || reviews.length === 0) && !isLoading && (
                  <div className="w-full text-center py-10 text-on-surface-variant">Belum ada ulasan. Jadilah yang pertama!</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#001B3C] text-white/90 py-12 border-t border-white/10 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="container-app relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center justify-center md:justify-start mb-4">
                <Image src="/logo2.png" alt="SEAPEDIA" width={140} height={40} className="h-8 w-auto object-contain" />
              </div>
              <p className="text-white/60 text-sm text-center md:text-left">
                Marketplace Multi-Peran Terbaik & Terpercaya
              </p>
            </div>
            
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-primary transition-colors">Tentang Kami</a>
              <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-primary transition-colors">Bantuan</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-xs">
            &copy; {new Date().getFullYear()} SEAPEDIA. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modal Review */}
      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        title="Tulis Ulasan"
      >
        <form onSubmit={submitReview} className="space-y-4">
          <div>
            <label className="label">Nama Anda</label>
            <input 
              type="text" 
              value={reviewName} 
              onChange={e => setReviewName(e.target.value)} 
              className="input" 
              required 
            />
          </div>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1 text-amber-500 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`material-symbols-outlined text-[32px] hover:scale-110 transition-transform ${star <= reviewRating ? 'material-symbols-filled' : ''}`}
                >
                  star
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Ulasan</label>
            <textarea 
              value={reviewComment} 
              onChange={e => setReviewComment(e.target.value)} 
              className="input min-h-[100px] resize-y" 
              placeholder="Bagaimana pengalaman Anda menggunakan SEAPEDIA?"
              required 
            ></textarea>
          </div>
          <button type="submit" disabled={isSubmittingReview} className="w-full btn-primary mt-4">
            {isSubmittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

