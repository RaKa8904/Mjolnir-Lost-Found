import type { LostFoundItem } from "@/types"
import { itemSchema } from "./validators"
import { SEED_ITEMS } from "./seed"

const STORAGE_KEY = "campus_lost_and_found_v2"
const SUBMISSION_TIMESTAMPS_KEY = "campus_lost_and_found_timestamps_v2"
const MAX_ITEMS = 200

let memoryStore: LostFoundItem[] | null = null
let usingMemoryFallback = false

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__storage_check__"
    window.localStorage.setItem(testKey, "1")
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function isUsingMemoryFallback(): boolean {
  return usingMemoryFallback
}

/**
 * Validates and cleans records against schema
 */
function sanitizeStoredRecords(rawArray: unknown[]): LostFoundItem[] {
  const validItems: LostFoundItem[] = []
  for (const entry of rawArray) {
    const result = itemSchema.safeParse(entry)
    if (result.success) {
      validItems.push(result.data as LostFoundItem)
    }
  }
  return validItems
}

/**
 * Load items from storage, validating every record and falling back to seed if empty/corrupted
 */
export function loadItemsFromStorage(): LostFoundItem[] {
  if (memoryStore !== null && usingMemoryFallback) {
    return memoryStore
  }

  if (!isLocalStorageAvailable()) {
    usingMemoryFallback = true
    memoryStore = memoryStore || [...SEED_ITEMS]
    return memoryStore
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Empty: auto seed
      saveItemsToStorage(SEED_ITEMS)
      return [...SEED_ITEMS]
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      // Corrupted: reset to seed
      saveItemsToStorage(SEED_ITEMS)
      return [...SEED_ITEMS]
    }

    const sanitized = sanitizeStoredRecords(parsed)
    if (sanitized.length === 0 && parsed.length > 0) {
      // All records invalid: reset to seed
      saveItemsToStorage(SEED_ITEMS)
      return [...SEED_ITEMS]
    }

    let needsMigrationSave = false
    const migrated = sanitized.map((it) => {
      if (
        it.id === "item-seed-5" ||
        it.imageUrl?.includes("1580130037032") ||
        it.imageUrl?.includes("1589829545856")
      ) {
        if (it.imageUrl !== "/images/student-id-card.jpg") {
          needsMigrationSave = true
        }
        return {
          ...it,
          imageUrl: "/images/student-id-card.jpg",
        }
      }
      return it
    })

    if (migrated.length !== parsed.length || needsMigrationSave) {
      saveItemsToStorage(migrated)
    }

    return migrated
  } catch {
    saveItemsToStorage(SEED_ITEMS)
    return [...SEED_ITEMS]
  }
}

/**
 * Save items to storage with QuotaExceeded and cap handling
 */
export function saveItemsToStorage(items: LostFoundItem[]): boolean {
  const capped = items.slice(0, MAX_ITEMS)

  if (usingMemoryFallback) {
    memoryStore = [...capped]
    return true
  }

  try {
    const serialized = JSON.stringify(capped)
    window.localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch {
    usingMemoryFallback = true
    memoryStore = [...capped]
    return false
  }
}

/**
 * Rate limit check: prevent duplicate submissions (same name + contact within 60s)
 * and check 200 items cap
 */
export function checkSubmissionLimits(
  name: string,
  contact: string,
  currentCount: number
): { allowed: boolean; reason?: string } {
  if (currentCount >= MAX_ITEMS) {
    return {
      allowed: false,
      reason: "Campus ledger limit reached (200 items). Please recover or remove older records before adding new items.",
    }
  }

  const normName = name.trim().toLowerCase()
  const normContact = contact.trim().toLowerCase()
  const signature = `${normName}:::${normContact}`
  const now = Date.now()

  try {
    const raw = sessionStorage.getItem(SUBMISSION_TIMESTAMPS_KEY)
    const history: Record<string, number> = raw ? JSON.parse(raw) : {}

    const lastTime = history[signature]
    if (lastTime && now - lastTime < 60000) {
      const waitSec = Math.ceil((60000 - (now - lastTime)) / 1000)
      return {
        allowed: false,
        reason: `Please wait ${waitSec}s before posting this item again.`,
      }
    }

    // Record submission timestamp
    history[signature] = now
    sessionStorage.setItem(SUBMISSION_TIMESTAMPS_KEY, JSON.stringify(history))
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}
