'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { BottomNav } from '@/components/layout/BottomNav'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, activeRole, logout, storeProfile, setStoreProfile } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/auth/login')
    } else if (activeRole !== 'SELLER') {
      router.push('/auth/select-role')
    } else if (activeRole === 'SELLER') {
      fetch('/api/seller/store')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setStoreProfile({ name: data.name, imageUrl: data.imageUrl })
        })
        .catch(console.error)
    }
  }, [user, activeRole, router])

  if (!mounted || !user || activeRole !== 'SELLER') return null

  const navItems = [
    { href: '/seller/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/seller/products', icon: 'inventory_2', label: 'Produk' },
    { href: '/seller/orders', icon: 'list_alt', label: 'Pesanan' },
    { href: '/seller/vouchers', icon: 'local_offer', label: 'Voucher Toko' },
    { href: '/seller/chat', icon: 'forum', label: 'Chat Pembeli' },
    { href: '/seller/income', icon: 'payments', label: 'Pendapatan' },
    { href: '/seller/reviews', icon: 'rate_review', label: 'Penilaian' },
    { href: '/seller/settings', icon: 'settings', label: 'Pengaturan Toko' },
  ]

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-outline-variant fixed h-full z-40 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant shrink-0 bg-white">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-black tracking-tight logo-gradient">SEAPEDIA</span>
          </Link>
        </div>
        
        <div className="p-6 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            {storeProfile?.imageUrl ? (
              <img src={storeProfile.imageUrl} alt={storeProfile.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-coral text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {(storeProfile?.name || user.name).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <h3 className="font-bold text-sm text-on-surface truncate">{storeProfile?.name || user.name}</h3>
              <p className="text-[10px] uppercase font-bold tracking-wider text-coral mt-0.5">SELLER CENTER</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-secondary/10 text-secondary font-bold' 
                    : 'hover:bg-surface-container text-on-surface-variant hover:text-secondary'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'material-symbols-filled' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant shrink-0 space-y-2">
          <a 
            href="/"
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <span className="material-symbols-outlined">home</span>
            Lihat Beranda
          </a>
          <button 
            onClick={() => { logout(); router.push('/auth/login') }}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-semibold text-error hover:bg-error-container hover:text-on-error-container rounded-md transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 pb-20 md:pb-0 w-full bg-surface min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-14 bg-white border-b border-outline-variant flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-coral text-[20px]">storefront</span>
            <h1 className="font-bold text-sm tracking-wider text-on-surface">SELLER CENTER</h1>
          </div>
          <div className="flex items-center gap-2">
            {storeProfile?.imageUrl ? (
              <img src={storeProfile.imageUrl} alt={storeProfile.name} className="w-8 h-8 rounded-full object-cover border border-outline-variant" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center font-bold text-sm">
                {(storeProfile?.name || user.name).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

