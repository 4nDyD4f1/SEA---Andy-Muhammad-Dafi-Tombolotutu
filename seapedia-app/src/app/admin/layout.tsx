'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, activeRole, logout } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/auth/login')
    } else if (activeRole !== 'ADMIN') {
      router.push('/')
    }
  }, [user, activeRole, router])

  if (!mounted || !user || activeRole !== 'ADMIN') return null

  const navItems = [
    { href: '/admin/dashboard', icon: 'monitoring', label: 'Monitor Pusat' },
    { href: '/admin/vouchers', icon: 'local_activity', label: 'Kelola Voucher' },
    { href: '/admin/address-requests', icon: 'share_location', label: 'Permintaan Alamat' },
    { href: '/admin/time-simulator', icon: 'history', label: 'Time Simulator' },
  ]

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-outline-variant fixed h-full z-40 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant shrink-0 bg-white">
          <Link href="/" className="flex items-center">
            <Image src="/SEAPEDIA-LOGO.png" alt="SEAPEDIA" width={120} height={30} className="h-12 w-auto object-contain scale-[2.5] origin-left" priority />
          </Link>
        </div>
        
        <div className="p-6 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-sm text-on-surface truncate">{user.name}</h3>
              <p className="text-[10px] uppercase font-bold tracking-wider text-primary mt-0.5">GOD EYE ADMIN</p>
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
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'hover:bg-surface-container text-on-surface-variant hover:text-primary'
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
            <span className="material-symbols-outlined text-primary text-[20px]">admin_panel_settings</span>
            <h1 className="font-bold text-sm tracking-wider text-on-surface">GOD EYE</h1>
          </div>

        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* We use the shared BottomNav for mobile */}
      <BottomNav />
    </div>
  )
}

