import React from "react"

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-border bg-background py-8 text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-foreground">
          <svg
            width="10"
            height="12"
            viewBox="0 0 12 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
            aria-hidden="true"
          >
            <path
              d="M7 1L1 8H6L5 13L11 6H6L7 1Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-sans font-medium text-muted-foreground">
            Campus Lost &amp; Found
          </span>
        </div>

        <div className="text-muted-foreground">
          Built for the Asgard finals.
        </div>
      </div>
    </footer>
  )
}
