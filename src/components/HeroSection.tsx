import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { LostFoundItem } from "@/types"
import { formatRelativeTime } from "@/lib/utils"

interface HeroSectionProps {
  onPostLost: () => void
  onPostFound: () => void
  recentItems: LostFoundItem[]
  onItemClick: (item: LostFoundItem) => void
  onSelectTab?: (tab: "all" | "lost" | "found" | "reunited") => void
  stats: {
    total: number
    lost: number
    found: number
    recovered: number
  }
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value <= 0) {
      setDisplay(0)
      return
    }
    const duration = 600
    const stepTime = 20
    const steps = duration / stepTime
    let current = 0
    const increment = value / steps

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.round(current))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  return <span>{display}</span>
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onPostLost,
  onPostFound,
  recentItems,
  onItemClick,
  onSelectTab,
  stats,
}) => {
  return (
    <section className="relative space-y-12">
      {/* Hand-drawn-style single lightning line (amber, 1px, 900ms draw animation) */}
      <div
        className="pointer-events-none absolute top-0 right-4 sm:right-12 h-36 w-60 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 240 140"
          className="h-full w-full text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="animate-draw-crack"
            d="M210 0 L185 45 L202 48 L165 92 L178 95 L130 140"
          />
        </svg>
      </div>

      {/* 2 columns on lg (copy left, "Recently posted" list card right), stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Headline + Copy + 2 Buttons */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="font-serif text-4xl sm:text-5xl lg:text-[52px] font-normal leading-[1.1] tracking-tight text-foreground"
          >
            Lost something on campus? <br />
            <span className="italic text-foreground/90">Let&apos;s bring it home.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
            className="max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed font-sans"
          >
            A calm, community ledger for recovered notebooks, keys, electronics, and IDs.
            Search records with instant typo tolerance or post what you found.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <Button
              variant="default"
              size="lg"
              onClick={onPostLost}
              className="h-11 px-6 font-semibold"
            >
              I lost something
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onPostFound}
              className="h-11 px-6 font-semibold border-border bg-background"
            >
              I found something
            </Button>
          </motion.div>
        </div>

        {/* Right Column: "Recently posted" list card */}
        <div className="lg:col-span-5 text-left">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Recently posted
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Live campus feed
              </span>
            </div>

            <div className="space-y-2">
              {recentItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        item.type === "lost"
                          ? "bg-foreground text-background font-semibold"
                          : "border border-border bg-background text-foreground font-medium"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Stats row: 4 interactive animated columns with hover surge and quick filtering */}
      <Card className="overflow-hidden p-0 border border-border bg-card shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* 1. Total items */}
          <div
            onClick={() => onSelectTab?.("all")}
            className="group relative p-5 text-left cursor-pointer transition-all duration-300 hover:bg-primary/[0.06] select-none"
            title="Click to view all items"
          >
            <div className="flex items-center justify-between">
              <div className="text-[28px] font-semibold tabular-nums text-foreground font-mono leading-none transition-all duration-200 group-hover:text-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
                <AnimatedNumber value={stats.total} />
              </div>
              <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary shrink-0">
                <path d="M7 1L1 8H6L5 13L11 6H6L7 1Z"/>
              </svg>
            </div>
            <div className="w-6 group-hover:w-full h-[2px] bg-primary/40 group-hover:bg-primary rounded-full mt-2 transition-all duration-300 ease-out group-hover:shadow-[0_0_6px_var(--primary)]" />
            <div className="text-[12px] text-muted-foreground font-sans mt-1.5 transition-colors group-hover:text-foreground">
              Total items listed
            </div>
          </div>

          {/* 2. Still missing */}
          <div
            onClick={() => onSelectTab?.("lost")}
            className="group relative p-5 text-left cursor-pointer transition-all duration-300 hover:bg-primary/[0.06] select-none"
            title="Click to view missing items"
          >
            <div className="flex items-center justify-between">
              <div className="text-[28px] font-semibold tabular-nums text-foreground font-mono leading-none transition-all duration-200 group-hover:text-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
                <AnimatedNumber value={stats.lost} />
              </div>
              <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary shrink-0">
                <path d="M7 1L1 8H6L5 13L11 6H6L7 1Z"/>
              </svg>
            </div>
            <div className="w-6 group-hover:w-full h-[2px] bg-primary/40 group-hover:bg-primary rounded-full mt-2 transition-all duration-300 ease-out group-hover:shadow-[0_0_6px_var(--primary)]" />
            <div className="text-[12px] text-muted-foreground font-sans mt-1.5 transition-colors group-hover:text-foreground">
              Still missing
            </div>
          </div>

          {/* 3. In safe custody */}
          <div
            onClick={() => onSelectTab?.("found")}
            className="group relative p-5 text-left cursor-pointer transition-all duration-300 hover:bg-primary/[0.06] select-none"
            title="Click to view found items"
          >
            <div className="flex items-center justify-between">
              <div className="text-[28px] font-semibold tabular-nums text-foreground font-mono leading-none transition-all duration-200 group-hover:text-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
                <AnimatedNumber value={stats.found} />
              </div>
              <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary shrink-0">
                <path d="M7 1L1 8H6L5 13L11 6H6L7 1Z"/>
              </svg>
            </div>
            <div className="w-6 group-hover:w-full h-[2px] bg-primary/40 group-hover:bg-primary rounded-full mt-2 transition-all duration-300 ease-out group-hover:shadow-[0_0_6px_var(--primary)]" />
            <div className="text-[12px] text-muted-foreground font-sans mt-1.5 transition-colors group-hover:text-foreground">
              In safe custody
            </div>
          </div>

          {/* 4. Recovered */}
          <div
            onClick={() => onSelectTab?.("reunited")}
            className="group relative p-5 text-left cursor-pointer transition-all duration-300 hover:bg-primary/[0.06] select-none"
            title="Click to view recovered items"
          >
            <div className="flex items-center justify-between">
              <div className="text-[28px] font-semibold tabular-nums text-primary font-mono leading-none transition-all duration-200 group-hover:drop-shadow-[0_0_12px_hsl(var(--primary)/0.9)]">
                <AnimatedNumber value={stats.recovered} />
              </div>
              <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-primary shrink-0">
                <path d="M7 1L1 8H6L5 13L11 6H6L7 1Z"/>
              </svg>
            </div>
            <div className="w-6 group-hover:w-full h-[2px] bg-primary rounded-full mt-2 transition-all duration-300 ease-out group-hover:shadow-[0_0_8px_var(--primary)]" />
            <div className="text-[12px] text-muted-foreground font-sans mt-1.5 transition-colors group-hover:text-foreground font-medium">
              Recovered
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
