import { useEffect } from "react"

interface HotkeyOptions {
  onSearchFocus?: () => void
  onCommandPalette?: () => void
  onEscape?: () => void
}

export function useHotkeys({
  onSearchFocus,
  onCommandPalette,
  onEscape,
}: HotkeyOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true"

      // Ctrl+K or Cmd+K: Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onCommandPalette?.()
        return
      }

      // "/" key: Focus search box when not already typing in an input
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault()
        onSearchFocus?.()
        return
      }

      // Escape key
      if (e.key === "Escape") {
        onEscape?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSearchFocus, onCommandPalette, onEscape])
}
