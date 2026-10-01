import { useState, useEffect, useCallback, useRef } from "react"
import type { LostFoundItem, ItemFormData, ItemCategory, ItemType, ContactType } from "@/types"

export function useItems() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const itemsRef = useRef<LostFoundItem[]>([])

  // Fetch items from the server
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        const mapped: LostFoundItem[] = data.items.map((dbItem: any) => ({
          id: dbItem.id,
          type: dbItem.kind as ItemType,
          name: dbItem.name,
          category: dbItem.category as ItemCategory,
          description: dbItem.description,
          location: dbItem.location,
          date: dbItem.created_at.slice(0, 10),
          imageUrl: dbItem.image_url,
          contactInfo: dbItem.contact_value || "Contact hidden",
          contactType: dbItem.contact_type as ContactType,
          status: dbItem.status === 'open' ? 'active' : dbItem.status === 'recovered' ? 'reunited' : dbItem.status,
          createdAt: dbItem.created_at,
          updatedAt: dbItem.updated_at,
        }))
        setItems(mapped)
        itemsRef.current = mapped
        setUsingFallback(false)
      }
    } catch (err) {
      console.error('Failed to fetch items', err)
      setUsingFallback(true)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = useCallback(
    async (formData: ItemFormData): Promise<{ success: boolean; item?: LostFoundItem; error?: string }> => {
      try {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (res.ok) {
          await fetchItems()
          return { success: true }
        } else {
          return { success: false, error: data.error || 'Failed to add item' }
        }
      } catch (err) {
        return { success: false, error: 'Network error' }
      }
    },
    [fetchItems]
  )

  const updateItem = useCallback(
    async (id: string, patch: Partial<LostFoundItem>) => {
      // For now, only admin can update. Students shouldn't.
      await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      await fetchItems()
    },
    [fetchItems]
  )

  const deleteItem = useCallback(
    async (id: string): Promise<LostFoundItem | null> => {
      await fetch(`/api/items/${id}`, { method: 'DELETE' })
      const target = itemsRef.current.find(i => i.id === id)
      await fetchItems()
      return target || null
    },
    [fetchItems]
  )

  const restoreItem = useCallback(
    (_item: LostFoundItem) => {
      // Undo delete not supported yet with real backend
    },
    []
  )

  const toggleRecovered = useCallback(
    (_id: string): { item: LostFoundItem; previousStatus: "active" | "reunited" } | null => {
      // Need proper claim workflow.
      return null
    },
    []
  )

  const checkDuplicate = useCallback(
    (_name: string, _category: ItemCategory, _type: ItemType): boolean => {
      return false // handled by server limits/checks ideally
    },
    []
  )

  const resetSampleData = useCallback(() => {
    // handled by db seed script
  }, [])

  const stats = {
    total: items.length,
    lost: items.filter((i) => i.type === "lost" && i.status === "active").length,
    found: items.filter((i) => i.type === "found" && i.status === "active").length,
    recovered: items.filter((i) => i.status === "reunited").length,
  }

  return {
    items,
    isInitialized,
    usingFallback,
    stats,
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    toggleRecovered,
    checkDuplicate,
    resetSampleData,
  }
}
