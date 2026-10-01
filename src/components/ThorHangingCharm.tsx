import React, { useState } from "react"
import { motion } from "framer-motion"

interface ThorHangingCharmProps {
  className?: string
}

export const ThorHangingCharm: React.FC<ThorHangingCharmProps> = ({ className = "" }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setClickCount((c) => c + 1)
  }

  return (
    <div
      className={`select-none pointer-events-auto cursor-pointer group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title="Mjolnir Guardian: Thor watching over the campus ledger (Click to summon thunder)"
      role="button"
      tabIndex={0}
      aria-label="Thor with Mjolnir hanging charm"
    >
      <motion.div
        className="flex flex-col items-center"
        style={{ transformOrigin: "top center" }}
        animate={
          clickCount > 0
            ? {
                rotate: [0, -18, 16, -12, 8, -4, 0],
                y: [0, -6, 2, -2, 0],
                transition: { duration: 0.9, ease: "easeOut" },
              }
            : isHovered
            ? {
                rotate: [0, -12, 10, -7, 4, 0],
                y: [0, -4, 0],
                transition: { duration: 0.8, ease: "easeInOut" },
              }
            : {
                rotate: [-4, 4, -4],
                transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        {/* Hanging Tether: braided cord from button base */}
        <div className="w-[2px] h-3.5 bg-border shadow-sm group-hover:bg-primary/70 transition-colors" />

        {/* Metallic anchor ring */}
        <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-border bg-card -my-1 z-10 shadow-xs group-hover:border-primary transition-colors" />

        {/* Enlarged, Prominent Thor Figure SVG (54x68) */}
        <svg
          width="54"
          height="68"
          viewBox="0 0 54 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md overflow-visible"
        >
          {/* 1. Flowing Asgardian Cape (rich backdrop) */}
          <path
            d="M14 24 C10 38 8 50 12 58 C18 55 36 55 42 58 C46 50 44 38 40 24 Z"
            className="fill-muted/90 stroke-border"
            strokeWidth="1.2"
          />
          <path
            d="M17 28 C15 42 16 52 20 56"
            className="stroke-border/60"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M37 28 C39 42 38 52 34 56"
            className="stroke-border/60"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* 2. Torso Armor / Cuirass */}
          <rect
            x="17"
            y="25"
            width="20"
            height="21"
            rx="5"
            className="fill-card stroke-border"
            strokeWidth="1.5"
          />

          {/* 4 Iconic Asgardian Circular Chest Plates */}
          <circle cx="21.5" cy="30" r="2.2" className="fill-primary stroke-primary/80" strokeWidth="0.8" />
          <circle cx="32.5" cy="30" r="2.2" className="fill-primary stroke-primary/80" strokeWidth="0.8" />
          <circle cx="21.5" cy="38" r="2.2" className="fill-border stroke-muted-foreground/30" strokeWidth="0.8" />
          <circle cx="32.5" cy="38" r="2.2" className="fill-border stroke-muted-foreground/30" strokeWidth="0.8" />

          {/* Golden War Belt */}
          <rect x="17" y="42" width="20" height="3" rx="1" className="fill-primary" />
          <rect x="25" y="41.5" width="4" height="4" rx="1" className="fill-card stroke-primary" strokeWidth="0.8" />

          {/* 3. Thor's Head & Face */}
          <circle cx="27" cy="16" r="7" className="fill-background stroke-border" strokeWidth="1.2" />

          {/* Blonde Hair locks peeking out */}
          <path d="M19 18 C18 22 20 25 21 27" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M35 18 C36 22 34 25 33 27" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />

          {/* Winged Norse Helmet */}
          <path
            d="M20 16 C20 10.5 23 7 27 7 C31 7 34 10.5 34 16 Z"
            className="fill-card stroke-border"
            strokeWidth="1.4"
          />
          {/* Helmet Crest Ridge */}
          <path d="M27 6 L27 15" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />

          {/* Left Wing (Swept Upward Boldly) */}
          <path
            d="M20 15 C16 12 11 8 11 3 C14 7 18 10 20 12 Z"
            className="fill-primary stroke-primary/90"
            strokeWidth="1"
          />
          {/* Right Wing (Swept Upward Boldly) */}
          <path
            d="M34 15 C38 12 43 8 43 3 C40 7 36 10 34 12 Z"
            className="fill-primary stroke-primary/90"
            strokeWidth="1"
          />

          {/* Thor's Determined Eyes */}
          <circle cx="24" cy="16" r="1" className={isHovered ? "fill-primary" : "fill-foreground"} />
          <circle cx="30" cy="16" r="1" className={isHovered ? "fill-primary" : "fill-foreground"} />

          {/* 4. Left Arm (Braced) */}
          <path
            d="M18 28 C13 32 13 38 15 42"
            className="stroke-border"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 5. Right Arm Holding Mjolnir (Lowered & Ready) */}
          <path
            d="M36 28 C41 31 43 36 43 41"
            className="stroke-border"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 6. Mjolnir (The War Hammer) - Prominent & Detailed */}
          <g
            className="origin-[43px_41px]"
            style={{ transformOrigin: "43px 41px" }}
          >
            {/* Hammer Handle with Grip Wraps */}
            <line x1="43" y1="39" x2="43" y2="54" className="stroke-primary" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="41.5" y1="43" x2="44.5" y2="43" className="stroke-card" strokeWidth="1" />
            <line x1="41.5" y1="46" x2="44.5" y2="46" className="stroke-card" strokeWidth="1" />
            <line x1="41.5" y1="49" x2="44.5" y2="49" className="stroke-card" strokeWidth="1" />

            {/* Pommel Strap Loop */}
            <path
              d="M43 54 C44.5 57 47 58 46 61 C45 63 43 62 43 60"
              className="stroke-border"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Hammer Head (Large Norse Block) */}
            <rect
              x="35"
              y="49"
              width="16"
              height="11"
              rx="2.2"
              className="fill-card stroke-primary"
              strokeWidth="1.6"
            />
            {/* Beveled Hammer Inset & Nordic Rune Cross */}
            <rect
              x="37.5"
              y="51.5"
              width="11"
              height="6"
              rx="1"
              className="fill-muted/70 stroke-primary/50"
              strokeWidth="0.8"
            />
            <path
              d="M43 52.5 L43 56.5 M40 54.5 L46 54.5"
              className="stroke-primary"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Dynamic Lightning Sparks around Mjolnir */}
            <motion.path
              d="M34 47 L32 50 L35 51"
              className="stroke-primary"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={isHovered ? { opacity: [0.3, 1, 0.4], scale: [0.9, 1.2, 1] } : { opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            />
            <motion.path
              d="M52 47 L54 50 L51 51"
              className="stroke-primary"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={isHovered ? { opacity: [0.4, 1, 0.2], scale: [0.9, 1.2, 1] } : { opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.35, delay: 0.1 }}
            />
            <motion.path
              d="M43 62 L42 65 L44 66"
              className="stroke-primary"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={isHovered ? { opacity: [0.2, 1, 0.3] } : { opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.3, delay: 0.15 }}
            />
          </g>
        </svg>
      </motion.div>
    </div>
  )
}
