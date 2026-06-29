'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

export function BottomNav() {
  const pathname = usePathname()
  const { user, activeRole } = useAuthStore()
  const { getItemCount } = useCartStore()
  
  if (!user) return null

  const getNavItems = () => {
    switch(activeRole) {
      case 'BUYER':
        return [
          { href: '/buyer', icon: 'home', label: 'Home' },
          { href: '/buyer/cart', icon: 'shopping_cart', label: 'Keranjang', badge: getItemCount() },
          { href: '/buyer/orders', icon: 'receipt_long', label: 'Pesanan' },
          { href: '/buyer/wallet', icon: 'account_balance_wallet', label: 'Wallet' },
        ]
      case 'SELLER':
        return [
          { href: '/seller/dashboard', icon: 'dashboard', label: 'Dashboard' },
          { href: '/seller/products', icon: 'inventory_2', label: 'Produk' },
          { href: '/seller/orders', icon: 'list_alt', label: 'Pesanan' },
          { href: '/seller/reviews', icon: 'rate_review', label: 'Ulasan' },
          { href: '/seller/income', icon: 'payments', label: 'Income' },
        ]
      case 'DRIVER':
        return [
          { href: '/driver/dashboard', icon: 'local_shipping', label: 'Jobs' },
          { href: '/driver/orders', icon: 'map', label: 'Aktif' },
          { href: '/driver/earnings', icon: 'account_balance_wallet', label: 'Komisi' },
        ]
      case 'ADMIN':
        return [
          { href: '/admin/dashboard', icon: 'monitoring', label: 'Monitor' },
          { href: '/admin/vouchers', icon: 'local_activity', label: 'Voucher' },
          { href: '/admin/time-simulator', icon: 'history', label: 'Time' },
        ]
      default:
        return []
    }
  }

  const items = getNavItems()
  if (items.length === 0) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-lg border-t border-outline-variant shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-primary/15' : ''}`}>
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'material-symbols-filled' : ''}`}>
                  {item.icon}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-[22%] bg-coral text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
