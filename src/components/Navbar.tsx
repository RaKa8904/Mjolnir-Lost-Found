import React, { useEffect } from "react"
import { Search, User as UserIcon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThorHangingCharm } from "@/components/ThorHangingCharm"
import type { User } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface NavbarProps {
  onOpenPost: (type?: "lost" | "found") => void
  onOpenCommandPalette: () => void
  usingFallback: boolean
  user: User | null
  onLogin: () => void
  onLogout: () => void
  onMyActivity?: () => void
  onAdminDashboard?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPost,
  onOpenCommandPalette,
  usingFallback,
  user,
  onLogin,
  onLogout,
  onMyActivity,
  onAdminDashboard
}) => {
  useEffect(() => {
    // Always enforce dark theme
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      {usingFallback && (
        <div className="border-b border-border bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
          Running in temporary in-memory mode because browser storage is restricted.
        </div>
      )}

      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 text-primary shrink-0 transition-transform group-hover:scale-105 shadow-xs">
            <svg
              width="15"
              height="18"
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
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Mjolnir
            </span>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground tracking-normal">
              Lost &amp; Found
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">


          <Button
            type="button"
            variant="outline"
            onClick={onOpenCommandPalette}
            className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-2 font-normal"
            title="Open command palette (Ctrl+K or Cmd+K)"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {!user ? (
            <Button variant="outline" size="default" className="h-10 px-4 text-sm" onClick={onLogin}>
              Sign in
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="mt-2">
                      <Badge variant="default" className="text-[10px]">
                        {user.role === 'admin' ? 'Admin' : 'Student'}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onMyActivity} className="cursor-pointer">My activity</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => alert("Passkeys UI is currently under construction for Phase 5!")}>Passkeys and security</DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={onAdminDashboard} className="cursor-pointer">Admin dashboard</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="relative inline-flex items-center group/btn">
            <Button
              variant="default"
              size="default"
              onClick={() => {
                if (!user) onLogin()
                else onOpenPost()
              }}
              className="h-10 px-4 text-sm font-semibold relative z-10 overflow-hidden"
            >
              <span className="pointer-events-none absolute -top-[1px] -right-[1px] w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                <span className="absolute top-0 right-0 w-2.5 h-[1.5px] bg-primary-foreground shadow-[0_0_4px_var(--primary)] animate-pulse" />
                <span className="absolute top-0 right-0 w-[1.5px] h-2.5 bg-primary-foreground shadow-[0_0_4px_var(--primary)] animate-pulse" />
              </span>
              <Zap className="h-4 w-4 mr-1.5 fill-current opacity-70 group-hover/btn:animate-pulse" />
              Post an item
            </Button>
            <div className="hidden sm:block absolute top-full -mt-1 right-5 z-30 pointer-events-auto">
              <ThorHangingCharm />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
