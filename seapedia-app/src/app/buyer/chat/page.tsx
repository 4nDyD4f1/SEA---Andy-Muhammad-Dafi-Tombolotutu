'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function BuyerChatPage() {
  const router = useRouter()
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [rooms, setRooms] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const { user } = useAuthStore()
  const toast = useToast()

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/buyer/chat')
      if (res.ok) {
        const data = await res.json()
        setRooms(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/${roomId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 10000) // Poll rooms
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId)
      const interval = setInterval(() => fetchMessages(activeRoomId), 5000) // Poll active room messages
      return () => clearInterval(interval)
    }
  }, [activeRoomId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeRoomId) return
    
    const sentText = message
    setMessage('')
    
    // Optimistic update
    const optimisticMsg = {
      id: Date.now().toString(),
      roomId: activeRoomId,
      senderId: user?.id,
      text: sentText,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch(`/api/chat/${activeRoomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentText })
      })
      if (!res.ok) {
        toast.error('Gagal mengirim pesan')
        fetchMessages(activeRoomId)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const activeRoomData = rooms.find(r => r.id === activeRoomId)
  
  const avatarColors = ['bg-[#0B5ED7]', 'bg-coral', 'bg-tertiary', 'bg-[#6f42c1]', 'bg-[#e83e8c]', 'bg-secondary']
  
  // Use a stable string hash for color
  const getAvatarColor = (name: string) => {
    if (!name) return avatarColors[0]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash) % avatarColors.length]
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold">Pesan Saya</h1>
      </div>
      
      <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-lg shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-full md:w-1/3 border-r border-outline-variant/30 flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input type="text" placeholder="Cari percakapan..." className="input pl-10 rounded-full py-2 text-sm bg-surface-container-low border-transparent focus:bg-white" />
            </div>
          </div>
          <div className="overflow-y-auto flex-grow">
            {rooms.length === 0 ? (
              <div className="p-8 text-center text-outline text-sm">Belum ada pesan</div>
            ) : rooms.map(room => {
              const partner = room.store
              const partnerName = partner?.name || 'Toko'
              const lastMessage = room.messages?.[0]?.text || 'Mulai obrolan'
              
              // Unread count
              const hasUnread = room.messages?.[0]?.isRead === false && room.messages?.[0]?.senderId !== user?.id
              
              return (
                <div 
                  key={room.id} 
                  onClick={() => setActiveRoomId(room.id)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-container-low transition-colors ${activeRoomId === room.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                >
                  <div className={`w-12 h-12 rounded-full ${!partner.imageUrl ? getAvatarColor(partnerName) : 'bg-surface-container'} text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm relative overflow-hidden`}>
                    {partner.imageUrl ? (
                      <img src={partner.imageUrl} alt={partnerName} className="w-full h-full object-cover" />
                    ) : (
                      partnerName.charAt(0).toUpperCase()
                    )}
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold text-sm truncate ${hasUnread ? 'text-on-surface' : 'text-on-surface-variant'}`}>{partnerName}</span>
                    </div>
                    <div className={`text-xs truncate ${hasUnread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{lastMessage}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        {activeRoomData ? (
          <div className="hidden md:flex w-2/3 flex-col bg-surface-container-lowest">
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${!activeRoomData.store.imageUrl ? getAvatarColor(activeRoomData.store.name) : 'bg-surface-container'} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm overflow-hidden`}>
                  {activeRoomData.store.imageUrl ? (
                    <img src={activeRoomData.store.imageUrl} alt={activeRoomData.store.name} className="w-full h-full object-cover" />
                  ) : (
                    activeRoomData.store.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-on-surface">{activeRoomData.store.name}</div>
                </div>
              </div>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-[#f8f9fa] relative flex flex-col">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[70%] p-3 rounded-xl shadow-sm text-sm ${isMe ? 'bg-primary text-white border border-primary rounded-tr-sm' : 'bg-white text-on-surface border border-outline-variant/20 rounded-tl-sm'}`}>
                      {msg.text}
                      <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-primary-container/80' : 'text-outline'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <span className="material-symbols-outlined text-[14px]">done_all</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="p-4 bg-white border-t border-outline-variant/30">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ketik pesan Anda di sini..." 
                  className="input flex-grow rounded-full px-4 border-outline-variant/50 focus:border-primary"
                />
                <button type="submit" disabled={!message.trim()} className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-outline hover:bg-secondary transition-all hover:scale-105 active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex w-2/3 flex-col items-center justify-center text-outline bg-surface-container-lowest">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">forum</span>
            </div>
            <p className="font-medium text-on-surface-variant">Belum ada obrolan yang dipilih</p>
          </div>
        )}
      </div>
    </div>
  )
}
