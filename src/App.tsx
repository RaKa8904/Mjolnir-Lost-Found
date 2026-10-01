import { useState, useRef, useMemo, useEffect } from "react"
import { Toaster, toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"

import type { LostFoundItem, ItemFormData, FilterType, SortOption, ItemType } from "@/types"
import { useItems } from "@/hooks/useItems"
import { useDebounce } from "@/hooks/useDebounce"
import { useHotkeys } from "@/hooks/useHotkeys"
import { scoreItem } from "@/lib/search"

// Components
import { LightningFlash } from "@/components/LightningFlash"
import { Navbar } from "@/components/Navbar"
import { HeroSection } from "@/components/HeroSection"
import { Toolbar } from "@/components/Toolbar"
import { ItemCard } from "@/components/ItemCard"
import { SkeletonCard } from "@/components/SkeletonCard"
import { EmptyState } from "@/components/EmptyState"
import { PostItemDialog } from "@/components/PostItemDialog"
import { EditItemDialog } from "@/components/EditItemDialog"
import { ContactDialog } from "@/components/ContactDialog"
import { ClaimDialog } from "@/components/ClaimDialog"
import { MyActivityDialog } from "@/components/MyActivityDialog"
import { AdminDashboardDialog } from "@/components/AdminDashboardDialog"
import { ImageLightbox } from "@/components/ImageLightbox"
import { CommandPalette } from "@/components/CommandPalette"
import { Footer } from "@/components/Footer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { LoginGateway } from "@/components/LoginGateway"

import { AuthModal } from "@/components/AuthModal"
import { useAuth } from "@/hooks/useAuth"

export function AppContent() {
  const { user, loading, logout } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const {
    items,
    stats,
    usingFallback,
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    toggleRecovered,
    checkDuplicate,
    resetSampleData,
  } = useItems()

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebounce(searchQuery, 150)
  const [currentTab, setCurrentTab] = useState<FilterType>("all")
  const [currentCategory, setCurrentCategory] = useState<string>("all")
  const [currentSort, setCurrentSort] = useState<SortOption>("newest")

  // Shimmer skeleton state on filter/search change (350ms)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 350)
    return () => clearTimeout(timer)
  }, [debouncedQuery, currentTab, currentCategory, currentSort])

  // Dialog states
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [postDefaultType, setPostDefaultType] = useState<ItemType>("lost")
  const [editingItem, setEditingItem] = useState<LostFoundItem | null>(null)
  const [contactItem, setContactItem] = useState<LostFoundItem | null>(null)
  const [claimItem, setClaimItem] = useState<LostFoundItem | null>(null)
  const [myActivityOpen, setMyActivityOpen] = useState(false)
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false)
  const [lightboxItem, setLightboxItem] = useState<LostFoundItem | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Single subtle 350ms lightning flash on post or mark recovered
  const [flashTrigger, setFlashTrigger] = useState(0)
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const gridSectionRef = useRef<HTMLDivElement>(null)

  // Global hotkeys
  useHotkeys({
    onSearchFocus: () => {
      searchInputRef.current?.focus()
      gridSectionRef.current?.scrollIntoView({ behavior: "smooth" })
    },
    onCommandPalette: () => setCommandPaletteOpen(true),
    onEscape: () => {
      if (searchQuery) setSearchQuery("")
    },
  })

  // Open Post Form with optional default type
  const handleOpenPost = (type: ItemType = "lost") => {
    setPostDefaultType(type)
    setPostModalOpen(true)
  }

  // Create new item
  const handleCreateItem = async (formData: ItemFormData) => {
    const res = await addItem(formData)
    if (!res.success || !res.item) {
      toast(res.error || "Unable to save item")
      return
    }

    setNewlyCreatedId(res.item.id)
    setFlashTrigger((prev) => prev + 1)

    toast("Posted. It's out there now.")

    setTimeout(() => setNewlyCreatedId(null), 3000)
  }

  // Update item
  const handleUpdateItem = (id: string, patch: Partial<LostFoundItem>) => {
    updateItem(id, patch)
    toast("Listing updated")
  }

  // Delete item with Undo
  const handleDeleteItem = async (item: LostFoundItem) => {
    const deleted = await deleteItem(item.id)
    if (deleted) {
      toast("Item removed", {
        description: deleted.name,
        action: {
          label: "Undo",
          onClick: () => {
            restoreItem(deleted)
            toast("Item restored")
          },
        },
      })
    }
  }

  // Toggle Recovered with Undo & dynamic tab title
  const handleToggleRecovered = (id: string) => {
    const result = toggleRecovered(id)
    if (!result) return

    setFlashTrigger((prev) => prev + 1)
    const { item } = result
    const isNowRecovered = item.status === "reunited"

    // Sync lightbox modal if open
    setLightboxItem((prev) => (prev && prev.id === id ? item : prev))

    if (isNowRecovered) {
      const origTitle = document.title
      document.title = "Recovered. Lost & Found"
      setTimeout(() => {
        document.title = origTitle || "Mjolnir Lost & Found"
      }, 4000)
    }

    toast(isNowRecovered ? "Back where it belongs." : "Returned to active listings", {
      description: item.name,
      action: isNowRecovered
        ? {
            label: "Undo",
            onClick: () => toggleRecovered(id),
          }
        : undefined,
    })
  }

  const handleClaimSubmit = async (itemId: string, data: any) => {
    try {
      const res = await fetch(`/api/items/${itemId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to submit claim")
      }
      toast("Claim submitted successfully. Pending Admin review.")
      // Ideally trigger a refresh of items here.
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      throw err
    }
  }


  // Quick chip click
  const handleChipClick = (chip: string) => {
    if (searchQuery.toLowerCase().includes(chip.toLowerCase())) {
      setSearchQuery("")
    } else {
      setSearchQuery(chip)
    }
    gridSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Filtered & Sorted items computation
  const filteredItems = useMemo(() => {
    const isSearching = debouncedQuery.trim().length > 0

    const mapped = items
      .map((item) => {
        // Tab filter
        if (currentTab === "lost" && (item.type !== "lost" || item.status === "reunited")) return null
        if (currentTab === "found" && (item.type !== "found" || item.status === "reunited")) return null
        if (currentTab === "reunited" && item.status !== "reunited") return null

        // Category filter
        if (currentCategory !== "all" && item.category !== currentCategory) return null

        // Search score
        if (isSearching) {
          const score = scoreItem(item, debouncedQuery)
          if (score <= 0) return null
          return { item, score }
        }

        return { item, score: 0 }
      })
      .filter((entry): entry is { item: LostFoundItem; score: number } => entry !== null)

    return mapped
      .sort((a, b) => {
        // When searching, sort strictly by best relevance score first
        if (isSearching && a.score !== b.score) {
          return b.score - a.score
        }

        // Secondary / default sort: by date
        const timeA = new Date(a.item.createdAt || a.item.date).getTime()
        const timeB = new Date(b.item.createdAt || b.item.date).getTime()
        return currentSort === "newest" ? timeB - timeA : timeA - timeB
      })
      .map((entry) => entry.item)
  }, [items, currentTab, currentCategory, debouncedQuery, currentSort])

  const counts = {
    all: items.length,
    lost: items.filter((i) => i.type === "lost" && i.status === "active").length,
    found: items.filter((i) => i.type === "found" && i.status === "active").length,
    reunited: items.filter((i) => i.status === "reunited").length,
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginGateway />
      </ErrorBoundary>
    )
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between antialiased">
      {/* 1. Subtle Lightning Flash overlay (350ms on post/recover) */}
      <LightningFlash trigger={flashTrigger} />

      {/* 2. Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border border-border bg-popover text-popover-foreground shadow-lg font-sans text-xs rounded-lg",
        }}
      />

      {/* 3. Header Navbar (h-16, sticky, bg-background/95 backdrop-blur-sm, bottom border) */}
      <Navbar
        onOpenPost={handleOpenPost}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        usingFallback={usingFallback}
        user={user}
        onLogin={() => setAuthModalOpen(true)}
        onLogout={logout}
        onMyActivity={() => setMyActivityOpen(true)}
        onAdminDashboard={() => setAdminDashboardOpen(true)}
      />

      {/* 4. Main Viewport (compacted vertical gap pt-5 pb-12) */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 pb-12 space-y-10">
        {/* Hero Section */}
        <HeroSection
          onPostLost={() => handleOpenPost("lost")}
          onPostFound={() => handleOpenPost("found")}
          recentItems={items}
          onItemClick={(item) => setLightboxItem(item)}
          onSelectTab={(tab) => {
            setCurrentTab(tab)
            gridSectionRef.current?.scrollIntoView({ behavior: "smooth" })
          }}
          stats={stats}
        />

        {/* Animated Moving Lightning Fracture Divider */}
        <div className="relative flex items-center justify-center my-4 py-2 select-none group" aria-hidden="true">
          {/* Hairline with subtle gradient fade at edges */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Central Prominent Lightning Fracture (280px wide) with active moving current */}
          <div className="absolute px-6 bg-background flex items-center justify-center">
            <svg
              width="280"
              height="32"
              viewBox="0 0 280 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary overflow-visible drop-shadow-[0_0_12px_rgba(245,185,66,0.4)] transition-transform duration-300 group-hover:scale-[1.03]"
            >
              <defs>
                <linearGradient id="movingElectricGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Left hairline bridge */}
              <line x1="0" y1="16" x2="60" y2="16" stroke="currentColor" strokeWidth="1" className="text-border" />

              {/* 1. Base Static Backbone (always visible foundation) */}
              <path
                d="M60 16 L85 16 L98 6 L108 26 L124 10 L135 22 L140 14 L146 18 L156 4 L170 28 L182 12 L195 16 L220 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              />

              {/* 2. Main Moving Electric Stream (traveling left to right continuously) */}
              <motion.path
                d="M60 16 L85 16 L98 6 L108 26 L124 10 L135 22 L140 14 L146 18 L156 4 L170 28 L182 12 L195 16 L220 16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="40 90"
                animate={{ strokeDashoffset: [260, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]"
              />

              {/* 3. Secondary White-Hot Electric Core Beam (offset counter-pulse) */}
              <motion.path
                d="M60 16 L85 16 L98 6 L108 26 L124 10 L135 22 L140 14 L146 18 L156 4 L170 28 L182 12 L195 16 L220 16"
                stroke="#fff"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="22 110"
                animate={{ strokeDashoffset: [260, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.35 }}
                className="drop-shadow-[0_0_6px_#ffffff]"
              />

              {/* 4. Traveling Golden Electric Spark Node 1 */}
              <motion.circle
                r="2.8"
                className="fill-primary drop-shadow-[0_0_8px_hsl(var(--primary))]"
                animate={{
                  cx: [60, 85, 98, 108, 124, 135, 140, 146, 156, 170, 182, 195, 220],
                  cy: [16, 16, 6, 26, 10, 22, 14, 18, 4, 28, 12, 16, 16],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* 5. Traveling White Electric Spark Node 2 (interleaved delay) */}
              <motion.circle
                r="1.8"
                className="fill-white drop-shadow-[0_0_6px_#fff]"
                animate={{
                  cx: [60, 85, 98, 108, 124, 135, 140, 146, 156, 170, 182, 195, 220],
                  cy: [16, 16, 6, 26, 10, 22, 14, 18, 4, 28, 12, 16, 16],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.8,
                }}
              />

              {/* Upper secondary crack branch with crackle jitter */}
              <motion.path
                d="M108 26 L118 29 L122 25"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ opacity: [0.2, 0.9, 0.3, 1, 0.2] }}
                transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }}
                className="text-primary/80 drop-shadow-[0_0_6px_hsl(var(--primary))]"
              />

              {/* Lower secondary crack branch with crackle jitter */}
              <motion.path
                d="M156 4 L162 2 L168 5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ opacity: [0.2, 0.9, 0.3, 1, 0.2] }}
                transition={{ duration: 0.85, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
                className="text-primary/80 drop-shadow-[0_0_6px_hsl(var(--primary))]"
              />

              {/* Pulsating Glowing Rune / Epicenter Diamond */}
              <motion.polygon
                points="140,8 144,14 140,20 136,14"
                className="fill-primary stroke-primary/80"
                strokeWidth="1"
                animate={{
                  scale: [1, 1.25, 1],
                  filter: [
                    "drop-shadow(0 0 4px hsl(var(--primary)))",
                    "drop-shadow(0 0 12px hsl(var(--primary)))",
                    "drop-shadow(0 0 4px hsl(var(--primary)))",
                  ],
                }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "140px 14px" }}
              />
              <circle cx="140" cy="14" r="1.5" className="fill-background" />

              {/* Right hairline bridge */}
              <line x1="220" y1="16" x2="280" y2="16" stroke="currentColor" strokeWidth="1" className="text-border" />
            </svg>
          </div>
        </div>

        {/* Toolbar & Items Grid */}
        <div ref={gridSectionRef} className="space-y-8">
          {/* Single Toolbar Card */}
          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            onChipClick={handleChipClick}
            inputRef={searchInputRef}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            currentCategory={currentCategory}
            onCategoryChange={setCurrentCategory}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            counts={counts}
            resultCount={filteredItems.length}
            totalCount={items.length}
          />

          {/* Items Grid with 350ms Shimmer Skeleton transition */}
          {isTransitioning ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: Math.min(filteredItems.length || 4, 8) }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    searchQuery={debouncedQuery}
                    currentUserRole={user?.role}
                    onContactClick={(selected) => setContactItem(selected)}
                    onClaimClick={(selected) => setClaimItem(selected)}
                    onImageClick={(selected) => setLightboxItem(selected)}
                    onEditClick={(selected) => setEditingItem(selected)}
                    onDeleteClick={handleDeleteItem}
                    onToggleRecovered={handleToggleRecovered}
                    isNew={newlyCreatedId === item.id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState
              type={searchQuery ? "search" : currentTab !== "all" || currentCategory !== "all" ? "filter" : "empty"}
              searchQuery={debouncedQuery}
              onReset={() => {
                setSearchQuery("")
                setCurrentTab("all")
                setCurrentCategory("all")
              }}
              onOpenPostForm={() => handleOpenPost("lost")}
            />
          )}
        </div>
      </main>

      {/* 5. Modals & Dialogs */}
      <PostItemDialog
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={handleCreateItem}
        defaultType={postDefaultType}
        allItems={items}
        checkDuplicate={checkDuplicate}
      />

      <EditItemDialog
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onUpdate={handleUpdateItem}
        allItems={items}
      />

      <ContactDialog
        item={contactItem}
        isOpen={!!contactItem}
        onClose={() => setContactItem(null)}
      />

      <ClaimDialog
        item={claimItem}
        isOpen={!!claimItem}
        onClose={() => setClaimItem(null)}
        onSubmit={handleClaimSubmit}
      />

      <MyActivityDialog
        isOpen={myActivityOpen}
        onClose={() => setMyActivityOpen(false)}
      />

      <AdminDashboardDialog
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
      />

      <ImageLightbox
        item={lightboxItem}
        isOpen={!!lightboxItem}
        onClose={() => setLightboxItem(null)}
        onContactClick={(selected) => {
          setLightboxItem(null)
          setContactItem(selected)
        }}
        onToggleRecovered={(id) => handleToggleRecovered(id)}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPost={(type) => handleOpenPost(type || "lost")}
        onSelectCategory={(cat) => {
          setCurrentCategory(cat)
          gridSectionRef.current?.scrollIntoView({ behavior: "smooth" })
        }}
        onSelectTab={(tab) => {
          setCurrentTab(tab)
          gridSectionRef.current?.scrollIntoView({ behavior: "smooth" })
        }}
        onResetSampleData={() => {
          resetSampleData()
          toast("Sample data restored")
        }}
      />

      {/* 6. Footer */}
      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
