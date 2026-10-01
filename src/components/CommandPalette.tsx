import React, { useEffect } from "react"
import { Command } from "cmdk"
import {
  Search,
  RotateCcw,
  Check,
  Tag,
  ArrowRight,
} from "lucide-react"
import { CATEGORIES } from "@/lib/validators"
import type { FilterType } from "@/types"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenPost: (defaultType?: "lost" | "found") => void
  onSelectCategory: (cat: string) => void
  onSelectTab: (tab: FilterType) => void
  onResetSampleData: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenPost,
  onSelectCategory,
  onSelectTab,
  onResetSampleData,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (isOpen) onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Palette" className="w-full flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Header Search Input (48px tall) */}
          <div className="flex h-12 items-center border-b border-border px-3.5 shrink-0 bg-popover">
            <Search className="mr-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Type a command, category, or action..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] sm:max-h-[440px] overflow-y-auto overscroll-contain p-2 text-sm divide-y divide-border/40">
            <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
              No matching command found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Quick actions" className="p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => {
                  onClose()
                  onOpenPost("lost")
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                  <span>Post a lost item</span>
                </div>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  onClose()
                  onOpenPost("found")
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                  <span>Post a found item</span>
                </div>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
            </Command.Group>

            {/* Status Views */}
            <Command.Group heading="Filter by status" className="p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => {
                  onSelectTab("all")
                  onClose()
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span>All items</span>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  onSelectTab("lost")
                  onClose()
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span>Lost items only</span>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  onSelectTab("found")
                  onClose()
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span>Found items only</span>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  onSelectTab("reunited")
                  onClose()
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Recovered items only</span>
                </div>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
            </Command.Group>

            {/* Categories */}
            <Command.Group heading="Filter by category" className="p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              {CATEGORIES.map((cat) => (
                <Command.Item
                  key={cat}
                  onSelect={() => {
                    onSelectCategory(cat)
                    onClose()
                  }}
                  className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>Category: {cat}</span>
                  </div>
                  <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Maintenance */}
            <Command.Group heading="Maintenance" className="p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => {
                  onResetSampleData()
                  onClose()
                }}
                className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Reset sample data (12 items)</span>
                </div>
                <kbd className="text-xs text-muted-foreground font-mono">↵</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
