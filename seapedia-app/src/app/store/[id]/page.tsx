'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { ProductCard } from '@/components/product/ProductCard'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/store/authStore'

export default function StoreProfilePage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  
  const [store, setStore] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Beranda')
  
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])
  
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(`/api/store/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setStore(data)
        } else {
          toast.error('Gagal memuat data toko')
        }
      } catch (err) {
        console.error(err)
        toast.error('Terjadi kesalahan sistem')
      } finally {
        setIsLoading(false)
      }
    }
    if (params?.id) {
      fetchStore()
    }
  }, [params.id])

  const handleFollow = () => {
    toast.success(`Berhasil mem-follow toko ${store.name}!`)
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
          body: JSON.stringify({ storeId: params.id })
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
        <div className="container-app py-10">
          <div className="h-40 shimmer rounded-xl bg-white mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="aspect-square shimmer rounded-xl bg-white"></div>
             <div className="aspect-square shimmer rounded-xl bg-white"></div>
             <div className="aspect-square shimmer rounded-xl bg-white"></div>
             <div className="aspect-square shimmer rounded-xl bg-white"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <Navbar />
        <div className="container-app py-20 text-center bg-white mt-8 rounded-xl shadow-sm">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">store_off</span>
          <h1 className="text-2xl font-bold">Toko Tidak Ditemukan</h1>
          <button onClick={() => router.back()} className="btn-primary mt-6 inline-flex">Kembali</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col text-on-surface">
      <Navbar />

      <main className="flex-grow pt-6 pb-16">
        <div className="container-app">
          {/* BACK BUTTON */}
          <div className="mb-4 flex items-center gap-2 text-sm text-outline">
            <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{store.name}</span>
          </div>
          
          {/* STORE HEADER BLOCK */}
          <div className="bg-white rounded-md shadow-sm border border-outline-variant/20 overflow-hidden mb-6">
             <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                
                {/* Left: Info & Actions */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full md:w-auto">
                   {/* Avatar */}
                   <div className="w-24 h-24 rounded-full border border-outline-variant/30 overflow-hidden bg-surface-container-low shrink-0 relative flex items-center justify-center">
                     <Image 
                       src={store.imageUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + store.name} 
                       alt={store.name} 
                       fill 
                       className="object-cover" 
                     />
                   </div>
                   
                   {/* Name & Buttons */}
                   <div className="flex flex-col items-center md:items-start">
                     <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-4">
                       <span className="material-symbols-outlined text-primary text-[24px] [font-variation-settings:'FILL'_1]">verified</span>
                       {store.name}
                     </h1>
                     <div className="flex flex-wrap justify-center md:justify-start gap-3">
                       <button onClick={handleFollow} className="bg-primary hover:bg-secondary text-white font-bold py-2 px-8 rounded-sm text-sm transition-colors">
                         Follow
                       </button>
                       <button onClick={handleChat} className="border border-primary text-primary hover:bg-primary/5 font-bold py-2 px-6 rounded-sm text-sm transition-colors">
                         Chat Penjual
                       </button>
                       <button onClick={() => {}} className="border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container py-2 px-3 rounded-sm flex items-center justify-center transition-colors">
                         <span className="material-symbols-outlined text-[18px]">info</span>
                       </button>
                       <button onClick={() => {}} className="border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container py-2 px-3 rounded-sm flex items-center justify-center transition-colors">
                         <span className="material-symbols-outlined text-[18px]">share</span>
                       </button>
                     </div>
                   </div>
                </div>

                {/* Right: Mock Stats */}
                <div className="hidden md:flex items-center text-sm">
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-[#FFC107] text-[24px] [font-variation-settings:'FILL'_1]">star</span>
                     <div>
                       <div className="font-bold text-lg leading-tight">5.0 (29,5 rb) &bull; 98 rb terjual</div>
                       <div className="text-on-surface-variant text-xs">Rating & Ulasan</div>
                     </div>
                   </div>
                </div>
             </div>

             {/* TABS */}
             <div className="border-t border-outline-variant/20 px-6 md:px-8 flex items-center gap-8 text-sm font-medium">
                {['Beranda', 'Produk', 'Ulasan'].map(tab => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`py-4 px-2 border-b-[3px] transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                   >
                     {tab}
                   </button>
                ))}
             </div>
          </div>

          {/* STORE CONTENT */}
          <div className="bg-white rounded-md shadow-sm border border-outline-variant/20 p-6 md:p-8 min-h-[50vh]">
             {activeTab === 'Beranda' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Sesuai incaran kamu di toko ini</h2>
                  
                  {store.products && store.products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {store.products.map((product: any) => (
                         // Injecting store details into product since ProductCard expects product.store.name
                         <ProductCard key={product.id} product={{ ...product, store: { id: store.id, name: store.name } }} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-outline flex flex-col items-center">
                       <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                       <p>Toko ini belum memiliki produk.</p>
                    </div>
                  )}
                </div>
             )}

             {activeTab === 'Produk' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Semua Produk</h2>
                    <div className="flex items-center gap-2 text-sm text-outline">
                      Urutkan: <select className="border border-outline-variant rounded p-1"><option>Terbaru</option><option>Terlaris</option></select>
                    </div>
                  </div>
                  {store.products && store.products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {store.products.map((product: any) => (
                         <ProductCard key={product.id} product={{ ...product, store: { id: store.id, name: store.name } }} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-outline flex flex-col items-center">
                       <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                       <p>Toko ini belum memiliki produk.</p>
                    </div>
                  )}
                </div>
             )}

             {activeTab === 'Ulasan' && (
                <div className="py-20 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">rate_review</span>
                  <p className="text-on-surface-variant font-medium">Toko ini belum memiliki ulasan</p>
                  <p className="text-sm text-outline mt-1">Belum ada pembeli yang memberikan penilaian karena toko masih baru.</p>
                </div>
             )}
          </div>

        </div>
      </main>

      {/* CHAT MODAL */}
      <Modal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} title={`Chat dengan ${store.name}`}>
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
