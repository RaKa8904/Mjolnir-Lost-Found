import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LightningFlashProps {
  trigger: number
}

export const LightningFlash: React.FC<LightningFlashProps> = ({ trigger }) => {
  const [active, setActive] = useState(false)
  const [initialThunder, setInitialThunder] = useState(true)

  // Initial thunder strike on website load/reload
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialThunder(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [])

  // Interactive flash on post or mark recovered
  useEffect(() => {
    if (trigger > 0) {
      setActive(true)
      const timer = setTimeout(() => {
        setActive(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  return (
    <>
      {/* 1. Initial reload thunder animation: double flash + branching lightning strike */}
      <AnimatePresence>
        {initialThunder && (
          <motion.div
            key="reload-thunder-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.22, 0.04, 0.28, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, times: [0, 0.15, 0.3, 0.55, 1], ease: "easeOut" }}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 bg-primary/20 backdrop-brightness-110 flex items-start justify-center overflow-hidden"
          >
            {/* Visual branching lightning bolt across the top on reload */}
            <motion.svg
              viewBox="0 0 1000 600"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute top-0 right-10 w-full max-w-4xl h-auto text-primary drop-shadow-[0_0_24px_hsl(var(--primary))]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Main Thunder Trunk */}
              <path
                d="M750 0 L710 110 L760 125 L680 230 L730 245 L620 370 L650 380 L540 520"
                strokeWidth="3"
                className="text-primary"
              />
              {/* Left Branch */}
              <path
                d="M710 110 L640 180 L660 190 L590 260"
                strokeWidth="1.8"
                className="text-primary/80"
              />
              {/* Right Branch */}
              <path
                d="M680 230 L740 290 L720 300 L760 360"
                strokeWidth="1.5"
                className="text-primary/70"
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Interactive subtle flash (on post / recover) */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="interactive-lightning-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0.05, 0.12, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 bg-primary/15 backdrop-brightness-105"
          />
        )}
      </AnimatePresence>
    </>
  )
}
