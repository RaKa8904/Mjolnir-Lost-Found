import { z } from "zod"
import type { ContactType } from "@/types"

export const CATEGORIES = [
  "Books",
  "Keys",
  "Bags",
  "Electronics",
  "ID/Cards",
  "Clothing",
  "Other",
] as const

export type Category = (typeof CATEGORIES)[number]

/**
 * Strip control characters, zero-width characters, and HTML tags
 */
export function sanitizeText(input: string): string {
  if (!input) return ""
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
    .replace(/[<>{}§`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Check if string contains any emoji
 */
export function containsEmoji(input: string): boolean {
  return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(input)
}

/**
 * Validate item name:
 * - 2 to 60 chars
 * - letters, digits, spaces, and . , ' - & ( ) / #
 * - reject if only digits or only symbols
 * - reject script/HTML characters (< > { } `)
 * - block emoji
 */
export function validateItemName(raw: string): { valid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeText(raw)
  if (!sanitized || sanitized.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters", sanitized }
  }
  if (sanitized.length > 60) {
    return { valid: false, error: "Name must be 60 characters or fewer", sanitized }
  }
  if (containsEmoji(raw)) {
    return { valid: false, error: "Emoji are not permitted in item names", sanitized }
  }
  // Check for allowed characters: letters, digits, spaces, and . , ' - & ( ) / #
  const allowedPattern = /^[\p{L}\p{N}\s.,'\-&()/#]+$/u
  if (!allowedPattern.test(sanitized)) {
    return { valid: false, error: "Only letters, numbers, spaces, and . , ' - & ( ) / # are allowed", sanitized }
  }
  // Reject if only digits or only symbols (must contain at least one letter)
  if (!/\p{L}/u.test(sanitized)) {
    return { valid: false, error: "Name must include at least one letter", sanitized }
  }
  return { valid: true, sanitized }
}

/**
 * Contact Validation:
 * Must be valid email, valid Indian phone, or valid Instagram handle
 */
export interface ContactValidationResult {
  valid: boolean
  type?: ContactType
  normalized?: string
  error?: string
}

export function validateEmailAddress(raw: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { valid: false, error: "Email address is required" }
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (trimmed.length > 254) {
    return { valid: false, error: "Email address is too long (max 254 characters)" }
  }
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Enter a valid email address (e.g. name@campus.edu)" }
  }
  return { valid: true, normalized: trimmed.toLowerCase() }
}

export function validatePhoneNumber(raw: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { valid: false, error: "Phone number is required" }
  }
  const cleanPhone = trimmed.replace(/[\s\-().]/g, "")
  let digits = cleanPhone
  if (digits.startsWith("+91")) {
    digits = digits.slice(3)
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2)
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1)
  }

  if (/^\d+$/.test(digits)) {
    if (digits.length !== 10) {
      return { valid: false, error: "Enter a 10-digit mobile number starting with 6, 7, 8, or 9" }
    }
    if (!/^[6-9]/.test(digits)) {
      return { valid: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9" }
    }
    if (/^(\d)\1{9}$/.test(digits)) {
      return { valid: false, error: "Enter a valid phone number, not repeated digits" }
    }
    if (digits === "1234567890" || digits === "9876543210" || digits === "0123456789") {
      return { valid: false, error: "Enter a genuine contact number" }
    }
    const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    return { valid: true, normalized: formatted }
  }
  return { valid: false, error: "Enter a valid 10-digit mobile number" }
}

export function validateAndNormalizeContact(raw: string): ContactValidationResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { valid: false, error: "Contact information is required" }
  }

  // 1. Email Check
  const emailRes = validateEmailAddress(trimmed)
  if (trimmed.includes("@") && !trimmed.startsWith("@")) {
    if (emailRes.valid) {
      return { valid: true, type: "email", normalized: emailRes.normalized }
    }
    return { valid: false, error: emailRes.error }
  }

  // 2. Instagram Handle (@name)
  if (trimmed.startsWith("@")) {
    if (trimmed.length < 2 || trimmed.length > 31) {
      return { valid: false, error: "Instagram handle must be between 1 and 30 characters" }
    }
    if (trimmed.includes("..")) {
      return { valid: false, error: "Instagram handle cannot have consecutive dots" }
    }
    if (trimmed.startsWith("@.") || trimmed.endsWith(".")) {
      return { valid: false, error: "Instagram handle cannot start or end with a dot" }
    }
    const igRegex = /^@[a-zA-Z0-9._]{1,30}$/
    if (igRegex.test(trimmed)) {
      return { valid: true, type: "instagram", normalized: trimmed }
    }
    return { valid: false, error: "Instagram handle can only contain letters, numbers, dots, and underscores" }
  }

  // 3. Indian Phone Number
  const phoneRes = validatePhoneNumber(trimmed)
  if (phoneRes.valid) {
    return { valid: true, type: "phone", normalized: phoneRes.normalized }
  }

  // If contains combined separator (e.g. email • phone)
  if (trimmed.includes("•")) {
    return { valid: true, type: "both", normalized: trimmed }
  }

  return { valid: false, error: "Enter a 10-digit mobile number, an email, or an @handle" }
}

/**
 * Quick detect for contact type chip in form UI
 */
export function detectContactType(input: string): ContactType | null {
  const res = validateAndNormalizeContact(input)
  return res.valid && res.type ? res.type : null
}

/**
 * Picture URL validation:
 * - Accept any valid http/https URL (permissive — no extension or host restrictions)
 * - Block dangerous protocols: javascript:, data:, blob:, file:, vbscript:
 * - Block credentials in URL
 * - Max 2048 chars
 */
export function validateImageUrl(url?: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: true } // optional field
  }
  const trimmed = url.trim()
  if (trimmed.length > 2048) {
    return { valid: false, error: "URL is too long (maximum 2048 characters)" }
  }

  // Allow relative paths (e.g. /images/foo.jpg)
  if (trimmed.startsWith("/")) {
    return { valid: true }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { valid: false, error: "Enter a valid URL (e.g. https://example.com/photo.jpg)" }
  }

  // Block dangerous protocols
  const blocked = ["javascript:", "data:", "blob:", "file:", "vbscript:"]
  if (blocked.includes(parsed.protocol)) {
    return { valid: false, error: "This URL protocol is not allowed" }
  }

  // Block credentials
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs with credentials are not permitted" }
  }

  // Allow http and https
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, error: "Image URL must use http:// or https://" }
  }

  return { valid: true }
}

/**
 * Pre-load verification using HTML Image element with 6-second timeout
 */
export function verifyImageLoads(url: string, timeoutMs: number = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || !url.trim()) {
      resolve(true)
      return
    }
    const valResult = validateImageUrl(url)
    if (!valResult.valid) {
      resolve(false)
      return
    }

    const img = new Image()
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      img.src = ""
      resolve(false)
    }, timeoutMs)

    img.onload = () => {
      if (!timedOut) {
        clearTimeout(timer)
        resolve(true)
      }
    }

    img.onerror = () => {
      if (!timedOut) {
        clearTimeout(timer)
        resolve(false)
      }
    }

    img.referrerPolicy = "no-referrer"
    img.src = url
  })
}

/**
 * Zod schema for runtime validation and storage layer enforcement
 */
export const itemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["lost", "found"]),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer")
    .refine((val) => validateItemName(val).valid, {
      message: "Only letters, numbers, spaces, and . , ' - & ( ) / # are allowed",
    }),
  category: z.enum(CATEGORIES, {
    message: "Select a valid category",
  }),
  description: z
    .string()
    .max(300, "Description must be 300 characters or fewer")
    .default(""),
  location: z
    .string()
    .max(80, "Location must be 80 characters or fewer")
    .default(""),
  date: z.string().min(1, "Date is required"),
  incidentDate: z.string().optional(),
  imageUrl: z
    .string()
    .optional()
    .default("")
    .refine((val) => validateImageUrl(val).valid, {
      message: "Enter a valid image URL",
    }),
  contactInfo: z
    .string()
    .min(1, "Contact information is required"),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactType: z.enum(["phone", "email", "both", "instagram", "other"]).default("other"),
  status: z.enum(["active", "reunited"]).default("active"),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export type ValidatedItem = z.infer<typeof itemSchema>
