import React, { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES } from "@/lib/validators"
import type { FilterType, SortOption } from "@/types"

interface ToolbarProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  onClearSearch: () => void
  onChipClick: (chip: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  currentTab: FilterType
  onTabChange: (tab: FilterType) => void
  currentCategory: string
  onCategoryChange: (cat: string) => void
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  counts: {
    all: number
    lost: number
    found: number
    reunited: number
  }
  resultCount: number
  totalCount: number
}

const QUICK_CHIPS = ["Books", "Keys", "Bags", "Phone", "ID Card", "Wallet"]

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onChipClick,
  inputRef,
  currentTab,
  onTabChange,
  currentCategory,
  onCategoryChange,
  currentSort,
  onSortChange,
  counts,
  resultCount,
  totalCount,
}) => {
  const localRef = useRef<HTMLInputElement>(null)
  const actualRef = inputRef || localRef

  // Search strike animation trigger on query change
  const [strikeKey, setStrikeKey] = useState<number>(0)

  useEffect(() => {
    if (searchQuery.trim()) {
      setStrikeKey((prev: number) => prev + 1)
    }
  }, [searchQuery])

  const tabs: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "lost", label: "Lost", count: counts.lost },
    { id: "found", label: "Found", count: counts.found },
    { id: "reunited", label: "Recovered", count: counts.reunited },
  ]

  return (
    <Card className="p-3 bg-card border-border shadow-sm space-y-6">
      {/* Row 1: Search input (icon left, "/" kbd hint right), h-11 */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3.5 flex items-center text-muted-foreground">
          <Search className="h-4 w-4" strokeWidth={1.75} />
        </div>

        <Input
          ref={actualRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items by name, campus location, or description... (Press '/' to focus)"
          className="h-11 pl-10 pr-24 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring shadow-sm"
        />

        {/* Search Strike: 300ms jagged amber line along bottom border on search update */}
        {searchQuery.trim() && (
          <div
            key={strikeKey}
            className="pointer-events-none absolute bottom-0 left-2 right-2 h-[3px] overflow-hidden rounded-b-lg"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 600 4"
              preserveAspectRatio="none"
              className="w-full h-full text-primary animate-search-strike"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M0 2 L120 2 L135 0 L150 4 L165 1 L180 3 L300 2 L420 2 L435 0 L450 4 L465 1 L480 3 L600 2" />
            </svg>
          </div>
        )}

        <div className="absolute right-3 flex items-center gap-2">
          {searchQuery ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Clear search (Esc)"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex h-6 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Row 2: Quick chips on the left; Category select and Sort select on the right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Quick Chips on the left */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground font-mono text-[11px] mr-1 select-none">
            Quick:
          </span>
          {QUICK_CHIPS.map((chip) => {
            const isSelected = searchQuery.toLowerCase().includes(chip.toLowerCase())
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onChipClick(chip)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all select-none ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {chip}
              </button>
            )
          })}
        </div>

        {/* Category & Sort selects on the right */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Category Select */}
          <div className="w-full sm:w-48">
            <Select
              value={currentCategory}
              onValueChange={(val) => onCategoryChange(val)}
            >
              <SelectTrigger className="h-10 bg-background border-border text-xs font-medium">
                <SelectValue placeholder="Category">
                  Category: {currentCategory === "all" ? "All" : currentCategory}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Category: All</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    Category: {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Select */}
          <div className="w-full sm:w-44">
            <Select
              value={currentSort}
              onValueChange={(val) => onSortChange(val as SortOption)}
            >
              <SelectTrigger className="h-10 bg-background border-border text-xs font-medium">
                <SelectValue placeholder="Sort">
                  Sort: {currentSort === "newest" ? "Newest" : "Oldest"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort: Newest</SelectItem>
                <SelectItem value="oldest">Sort: Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Row 3: Tabs (All, Lost, Found, Recovered with counts) sit under it */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/60">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1 border border-border">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors select-none ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-background border border-border rounded-md shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  <span className="font-mono text-[11px] opacity-75 tabular-nums">
                    {tab.count}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="font-mono text-xs text-muted-foreground self-center sm:self-auto tabular-nums">
          Showing <span className="text-foreground font-semibold">{resultCount}</span> of {totalCount} items
        </div>
      </div>
    </Card>
  )
}
