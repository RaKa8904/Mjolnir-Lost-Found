import React from "react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  type: "search" | "empty" | "filter"
  searchQuery?: string
  onReset?: () => void
  onOpenPostForm?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  onReset,
  onOpenPostForm,
}) => {
  return (
    <div className="mx-auto my-12 flex max-w-sm flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      {/* Hand-crafted line art illustration: hammer outline in muted stroke with one amber bolt stroke */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/50">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground"
          aria-hidden="true"
        >
          {/* Hammer Head outline */}
          <rect
            x="8"
            y="6"
            width="16"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            className="text-muted-foreground/60"
          />
          {/* Hammer Handle */}
          <line
            x1="16"
            y1="16"
            x2="16"
            y2="25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-muted-foreground/60"
          />
          {/* Single crisp amber lightning bolt cutting across */}
          <path
            d="M17 4 L13 13 L17 14 L14 22"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary drop-shadow-[0_0_6px_var(--primary)]"
          />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-foreground">
        {type === "search"
          ? "Nothing has answered the call yet."
          : type === "filter"
          ? "No items match these filters."
          : "Nothing logged yet."}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xs">
        {type === "search"
          ? searchQuery
            ? `No records found for "${searchQuery}". Check for typos or post it to the campus ledger.`
            : "No records found matching your query."
          : type === "filter"
          ? "Try resetting the category filter or switching tabs."
          : "Be the first to post a lost item or report a found discovery."}
      </p>

      <div className="mt-5 flex items-center gap-2">
        {onOpenPostForm && (
          <Button
            size="sm"
            onClick={onOpenPostForm}
            className="h-9 px-4 font-semibold"
          >
            Post an item
          </Button>
        )}

        {type === "search" && onReset && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="h-9 px-3 border-border bg-background"
          >
            Clear search
          </Button>
        )}
      </div>
    </div>
  )
}
