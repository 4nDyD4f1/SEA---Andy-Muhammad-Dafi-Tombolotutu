'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { BottomNav } from '@/components/layout/BottomNav'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, activeRole, logout } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/auth/login')
    } else if (activeRole !== 'DRIVER') {
      router.push('/auth/select-role')
    }
  }, [user, activeRole, router])

  if (!mounted || !user || activeRole !== 'DRIVER') return null

  const navItems = [
    { href: '/driver/dashboard', icon: 'local_shipping', label: 'Available Jobs' },
    { href: '/driver/orders', icon: 'map', label: 'Pesanan Aktif' },
    { href: '/driver/earnings', icon: 'account_balance_wallet', label: 'Komisi' },
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
            <div className="w-10 h-10 rounded-lg bg-tertiary text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-sm text-on-surface truncate">{user.name}</h3>
              <p className="text-[10px] uppercase font-bold tracking-wider text-tertiary mt-0.5">DRIVER MODE</p>
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
                    ? 'bg-tertiary/10 text-tertiary font-bold' 
                    : 'hover:bg-surface-container text-on-surface-variant hover:text-tertiary'
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

        <div className="p-4 border-t border-outline-variant shrink-0">
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
            <span className="material-symbols-outlined text-tertiary text-[20px]">two_wheeler</span>
            <h1 className="font-bold text-sm tracking-wider text-on-surface">DRIVER MODE</h1>
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

