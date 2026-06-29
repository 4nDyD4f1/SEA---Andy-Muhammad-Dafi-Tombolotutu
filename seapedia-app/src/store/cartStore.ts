import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartProduct {
  id: string
  name: string
  price: number
  imageUrl: string | null
  stock: number
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartState {
  items: CartItem[]
  storeId: string | null
  storeName: string | null
  
  addItem: (product: CartProduct, storeId: string, storeName: string, addQuantity?: number) => 'added' | 'different_store'
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      storeName: null,

      addItem: (product, storeId, storeName, addQuantity = 1) => {
        const { items, storeId: currentStoreId } = get()

        // Single-store rule check
        if (currentStoreId && currentStoreId !== storeId && items.length > 0) {
          return 'different_store'
        }

        const existingItem = items.find((i) => i.product.id === product.id)

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: Math.min(i.quantity + addQuantity, product.stock) }
                : i
            ),
          })
        } else {
          set({
            items: [...items, { product, quantity: Math.min(addQuantity, product.stock) }],
            storeId,
            storeName,
          })
        }

        return 'added'
      },

      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.product.id !== productId)
          return {
            items: newItems,
            storeId: newItems.length === 0 ? null : state.storeId,
            storeName: newItems.length === 0 ? null : state.storeName,
          }
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => {
        set({ items: [], storeId: null, storeName: null })
      },

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'seapedia-cart',
    }
  )
)
