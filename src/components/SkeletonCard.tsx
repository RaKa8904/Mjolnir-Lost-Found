import React from "react"

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl bg-card border border-border h-full shadow-sm relative">
      {/* Subtle faint amber shimmer overlay sweep (5% opacity) */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent z-10" />

      {/* Image block shimmer */}
      <div className="aspect-[4/3] w-full bg-muted/80 animate-pulse" />

      {/* Body lines */}
      <div className="p-4 space-y-2.5 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3.5 w-full rounded bg-muted/80 animate-pulse" />
        <div className="h-3.5 w-2/3 rounded bg-muted/70 animate-pulse" />

        <div className="pt-2 border-t border-border space-y-1.5">
          <div className="h-3 w-1/2 rounded bg-muted/60 animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-muted/60 animate-pulse" />
        </div>
      </div>

      {/* Footer bar */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <div className="h-10 flex-1 rounded-lg bg-muted animate-pulse" />
        <div className="h-9 w-9 rounded-lg bg-muted animate-pulse shrink-0" />
      </div>
    </div>
  )
}
