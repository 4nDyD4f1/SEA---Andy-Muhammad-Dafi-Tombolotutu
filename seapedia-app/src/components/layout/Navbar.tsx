'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useState, useRef, useEffect } from 'react'

export function Navbar() {
  const router = useRouter()
  const { user, activeRole, logout, setActiveRole } = useAuthStore()
  const { getItemCount } = useCartStore()
  const itemCount = getItemCount()
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/chat/unread')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (err) {
        // silently ignore
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const handleRoleSwitch = (role: string) => {
    setActiveRole(role)
    setIsDropdownOpen(false)
    switch(role) {
      case 'BUYER': router.push('/buyer'); break;
      case 'SELLER': router.push('/seller/dashboard'); break;
      case 'DRIVER': router.push('/driver/dashboard'); break;
      case 'ADMIN': router.push('/admin/dashboard'); break;
    }
  }

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm">
      <div className="container-app h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo1.png" alt="SEAPEDIA" width={140} height={40} className="h-8 w-auto object-contain" priority />
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {(!user || activeRole === 'BUYER') && (
            <Link href="/buyer/cart" className="relative p-2 text-on-surface hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[26px]">shopping_cart</span>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce-gentle border-2 border-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          )}

          {user && (activeRole === 'BUYER' || activeRole === 'SELLER') && (
            <Link href={activeRole === 'BUYER' ? '/buyer/chat' : '/seller/chat'} className="relative p-2 text-on-surface hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[26px]">chat</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce-gentle border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {activeRole === 'SELLER' && (
            <Link href="/seller/dashboard" className="hidden md:flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-[18px]">storefront</span> Dashboard
            </Link>
          )}

          {activeRole === 'BUYER' && user && (
            <div className="hidden lg:flex items-center gap-4 mr-2">
              <Link href="/buyer/orders" className="text-sm font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span> Daftar Pesanan
              </Link>
              <Link href="/buyer/wallet" className="text-sm font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">account_circle</span> Profile
              </Link>
            </div>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold leading-tight">{user.name}</span>
                  <span className="text-[10px] font-bold text-primary tracking-wider">{activeRole}</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">expand_more</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-float border border-outline-variant overflow-hidden py-2 animate-fade-in">
                  <div className="px-4 py-3 border-b border-outline-variant mb-2 bg-surface-container-low">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    {activeRole === 'BUYER' && (
                      <p className="text-sm font-bold text-coral mt-2">
                        Rp {user.walletBalance.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                  
                  {activeRole === 'BUYER' && (
                    <div className="py-1">
                      <Link href="/buyer/wallet" className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2" onClick={() => setIsDropdownOpen(false)}>
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                        Profile
                      </Link>
                      <Link href="/buyer/orders" className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2" onClick={() => setIsDropdownOpen(false)}>
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        Pesanan Saya
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-outline-variant mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-container transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-ghost btn-sm hidden md:inline-flex">Masuk</Link>
              <Link href="/auth/register" className="btn-primary btn-sm">Daftar</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

