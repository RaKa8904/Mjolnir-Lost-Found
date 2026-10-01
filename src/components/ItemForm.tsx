import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  CATEGORIES,
  validateItemName,
  validateEmailAddress,
  validatePhoneNumber,
  sanitizeText,
} from "@/lib/validators"
import type { LostFoundItem, ItemFormData, ItemType, ItemCategory } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { findPossibleMatches } from "@/lib/search"
import { Check, Loader2, AlertCircle, Camera, Upload } from "lucide-react"

interface ItemFormProps {
  initialValues?: Partial<ItemFormData>
  onSubmit: (data: ItemFormData) => void
  onCancel?: () => void
  allItems: LostFoundItem[]
  checkDuplicate?: (name: string, category: ItemCategory, type: ItemType) => boolean
  isEditing?: boolean
}

export const ItemForm: React.FC<ItemFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  allItems,
  checkDuplicate,
  isEditing = false,
}) => {
  const [type, setType] = useState<ItemType>(initialValues?.type || "lost")
  const [name, setName] = useState(initialValues?.name || "")
  const [category, setCategory] = useState<ItemCategory>(
    (initialValues?.category as ItemCategory) || "Electronics"
  )
  const [description, setDescription] = useState(initialValues?.description || "")
  const [location, setLocation] = useState(initialValues?.location || "")
  const [date, setDate] = useState(
    initialValues?.date || new Date().toISOString().slice(0, 10)
  )
  const [incidentDate, setIncidentDate] = useState(
    initialValues?.incidentDate || initialValues?.date || new Date().toISOString().slice(0, 10)
  )
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl || "")
  const [verificationHint, setVerificationHint] = useState(initialValues?.verificationHint || "")

  // Initialize separate email and phone
  const getInitialEmail = () => {
    if (initialValues?.contactEmail) return initialValues.contactEmail
    if (initialValues?.contactInfo) {
      if (initialValues.contactInfo.includes("•")) {
        return initialValues.contactInfo.split("•").find((s) => s.includes("@"))?.trim() || ""
      }
      if (initialValues.contactInfo.includes("@") && !initialValues.contactInfo.startsWith("@")) {
        return initialValues.contactInfo.trim()
      }
    }
    return ""
  }

  const getInitialPhone = () => {
    if (initialValues?.contactPhone) return initialValues.contactPhone
    if (initialValues?.contactInfo) {
      if (initialValues.contactInfo.includes("•")) {
        return initialValues.contactInfo.split("•").find((s) => /\d{5}/.test(s))?.trim() || ""
      }
      if (/\d{7}/.test(initialValues.contactInfo) && !initialValues.contactInfo.includes("@")) {
        return initialValues.contactInfo.trim()
      }
    }
    return ""
  }

  const [contactEmail, setContactEmail] = useState(getInitialEmail)
  const [contactPhone, setContactPhone] = useState(getInitialPhone)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Image verification state
  const [imageVerified, setImageVerified] = useState(false)

  // Duplicate notice and possible matches
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [possibleMatches, setPossibleMatches] = useState<LostFoundItem[]>([])

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Possible match & duplicate detection
  useEffect(() => {
    const cleanName = sanitizeText(name)
    if (cleanName.length >= 3) {
      if (!isEditing && checkDuplicate) {
        setIsDuplicate(checkDuplicate(cleanName, category, type))
      }
      const matches = findPossibleMatches(
        { type, name: cleanName, category },
        allItems
      )
      setPossibleMatches(matches)
    } else {
      setIsDuplicate(false)
      setPossibleMatches([])
    }
  }, [name, category, type, isEditing, checkDuplicate, allItems])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, imageUrl: "Image must be under 5MB" }))
        return
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setImageVerified(true);
        setErrors(prev => {
          const next = { ...prev }
          delete next.imageUrl
          return next
        })
      };
      reader.readAsDataURL(file);
    }
  }

  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text")
    if (text.length > 60) {
      e.preventDefault()
      const truncated = text.slice(0, 60)
      setName(truncated)
      setErrors((prev) => ({
        ...prev,
        name: "Pasted text was truncated to 60 characters",
      }))
    }
  }

  const handleDescPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text")
    if (text.length > 300) {
      e.preventDefault()
      const truncated = text.slice(0, 300)
      setDescription(truncated)
      setErrors((prev) => ({
        ...prev,
        description: "Pasted text was truncated to 300 characters",
      }))
    }
  }

  const validateAll = () => {
    const newErrors: Record<string, string> = {}

    // Name
    const nameRes = validateItemName(name)
    if (!nameRes.valid) {
      newErrors.name = nameRes.error || "Invalid item name"
    }

    // Contact: At least one of email or phone must be provided
    const hasEmail = !!contactEmail.trim()
    const hasPhone = !!contactPhone.trim()

    if (!hasEmail && !hasPhone) {
      newErrors.contactGeneral = "Please provide an email address or phone number (or both)"
    } else {
      if (hasEmail) {
        const emailRes = validateEmailAddress(contactEmail)
        if (!emailRes.valid) {
          newErrors.contactEmail = emailRes.error || "Invalid email address"
        }
      }
      if (hasPhone) {
        const phoneRes = validatePhoneNumber(contactPhone)
        if (!phoneRes.valid) {
          newErrors.contactPhone = phoneRes.error || "Invalid phone number"
        }
      }
    }

    // Image format check
    if (imageUrl && !imageUrl.startsWith("data:image/")) {
      newErrors.imageUrl = "Invalid image data"
    }

    // Date
    if (!date) {
      newErrors.date = "Please specify a date reported"
    } else {
      const today = new Date().toISOString().slice(0, 10)
      if (date > today) {
        newErrors.date = "Date cannot be in the future"
      }
    }

    // Incident Date (When lost / found)
    if (!incidentDate) {
      newErrors.incidentDate = type === "lost" ? "Please specify when it was lost" : "Please specify when it was found"
    } else {
      const today = new Date().toISOString().slice(0, 10)
      if (incidentDate > today) {
        newErrors.incidentDate = "Date cannot be in the future"
      }
    }

    // Description
    if (description.length > 300) {
      newErrors.description = "Description must be 300 characters or fewer"
    }

    // Location
    if (location.trim() && location.trim().length > 80) {
      newErrors.location = "Location must be 80 characters or fewer"
    }

    // Verification Hint (Only for found items)
    if (type === "found" && !verificationHint.trim()) {
      newErrors.verificationHint = "Please provide verification questions"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name && nameInputRef.current) {
        nameInputRef.current.focus()
      } else if (newErrors.contactEmail && emailInputRef.current) {
        emailInputRef.current.focus()
      } else if (newErrors.contactPhone && phoneInputRef.current) {
        phoneInputRef.current.focus()
      } else if (newErrors.imageUrl && imageInputRef.current) {
        imageInputRef.current.focus()
      }
      return false
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAll()) return

    setIsSubmitting(true)
    const normalizedEmail = contactEmail.trim() ? (validateEmailAddress(contactEmail).normalized || contactEmail.trim()) : ""
    const normalizedPhone = contactPhone.trim() ? (validatePhoneNumber(contactPhone).normalized || contactPhone.trim()) : ""
    const combinedContact = [normalizedEmail, normalizedPhone].filter(Boolean).join(" • ")

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)
      setTimeout(() => {
        onSubmit({
          type,
          name: sanitizeText(name),
          category,
          description: sanitizeText(description),
          location: sanitizeText(location),
          date,
          incidentDate,
          imageUrl: imageUrl,
          contactInfo: combinedContact,
          contactEmail: normalizedEmail || undefined,
          contactPhone: normalizedPhone || undefined,
          verificationHint: type === "found" ? verificationHint.trim() : undefined,
        })
      }, 350)
    }, 250)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
      {/* 1. Type Switch: Lost vs Found */}
      <div>
        <Label className="text-xs font-mono uppercase tracking-wider block mb-1.5 text-muted-foreground">
          Listing type
        </Label>
        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => setType("lost")}
            className={`py-2 text-xs font-semibold rounded-md transition-all h-9 select-none ${
              type === "lost"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm hover:brightness-105"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            I lost something
          </button>
          <button
            type="button"
            onClick={() => setType("found")}
            className={`py-2 text-xs font-semibold rounded-md transition-all h-9 select-none ${
              type === "found"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm hover:brightness-105"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            I found something
          </button>
        </div>
      </div>

      {/* Duplicate warning notice */}
      {isDuplicate && (
        <div className="rounded-lg border-l-2 border-l-primary border-y border-r border-border bg-card p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Notice:</span> A listing with this exact name and category already exists. You can still post if it is a separate item.
        </div>
      )}

      {/* Possible match suggestions: quiet inline notice with amber left border */}
      {possibleMatches.length > 0 && (
        <div
          role="region"
          aria-label="Possible matches"
          className="rounded-lg border-l-2 border-l-primary border-y border-r border-border bg-card p-3 space-y-2"
        >
          <div className="text-xs font-medium text-foreground">
            Possible match found in {type === "lost" ? "Found" : "Lost"} records
          </div>
          <div className="space-y-1">
            {possibleMatches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span className="truncate pr-2 text-foreground font-sans">
                  {m.name}
                  {m.location ? ` (${m.location})` : ""}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 tabular-nums">
                  {m.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item Name */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-name" className="text-xs font-medium text-foreground">
            Item name <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {name.length}/60
          </span>
        </div>
        <Input
          id="item-name"
          ref={nameInputRef}
          value={name}
          maxLength={60}
          onPaste={handleNamePaste}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors((prev) => {
                const next = { ...prev }
                delete next.name
                return next
              })
            }
          }}
          placeholder="e.g. Blue Hydro Flask bottle, Honda car key"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
        />
        {errors.name && (
          <p id="name-error" className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{errors.name}</span>
          </p>
        )}
      </div>

      {/* Category, Incident Date (When lost/found), and Reported Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="item-category" className="text-xs font-medium text-foreground">
            Category <span className="text-destructive">*</span>
          </Label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="item-incident-date" className="text-xs font-medium text-foreground">
            {type === "lost" ? "When lost" : "When found"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item-incident-date"
            type="date"
            value={incidentDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setIncidentDate(e.target.value)}
            className={errors.incidentDate ? "border-destructive" : ""}
          />
          {errors.incidentDate && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errors.incidentDate}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="item-date" className="text-xs font-medium text-foreground">
            Date reported <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className={errors.date ? "border-destructive" : ""}
          />
          {errors.date && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errors.date}</span>
            </p>
          )}
        </div>
      </div>

      {/* Campus Location */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-location" className="text-xs font-medium text-foreground">
            Campus location <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {location.length}/80
          </span>
        </div>
        <Input
          id="item-location"
          value={location}
          maxLength={80}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Library 3rd floor, Dining common booth 6"
        />
      </div>

      {/* Contact Information (Separate forms for Email & Phone Number) */}
      <div className="space-y-3 rounded-lg border border-border bg-card/40 p-3.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase font-mono tracking-wider">
            Contact Information <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">
            Provide email, phone, or both
          </span>
        </div>

        {errors.contactGeneral && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{errors.contactGeneral}</span>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Email Address Form Field */}
          <div className="space-y-1.5">
            <Label htmlFor="item-contact-email" className="text-xs font-medium text-foreground">
              Email address
            </Label>
            <Input
              id="item-contact-email"
              ref={emailInputRef}
              type="email"
              value={contactEmail}
              maxLength={120}
              onChange={(e) => {
                setContactEmail(e.target.value)
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.contactEmail
                  delete next.contactGeneral
                  return next
                })
              }}
              placeholder="e.g. name@campus.edu"
              aria-invalid={!!errors.contactEmail}
              className={errors.contactEmail ? "border-destructive focus-visible:ring-destructive/20" : ""}
            />
            {errors.contactEmail && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errors.contactEmail}</span>
              </p>
            )}
          </div>

          {/* Phone Number Form Field */}
          <div className="space-y-1.5">
            <Label htmlFor="item-contact-phone" className="text-xs font-medium text-foreground">
              Phone number
            </Label>
            <Input
              id="item-contact-phone"
              ref={phoneInputRef}
              type="tel"
              value={contactPhone}
              maxLength={20}
              onChange={(e) => {
                setContactPhone(e.target.value)
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.contactPhone
                  delete next.contactGeneral
                  return next
                })
              }}
              placeholder="e.g. 9823489012 or +91 98234 89012"
              aria-invalid={!!errors.contactPhone}
              className={errors.contactPhone ? "border-destructive focus-visible:ring-destructive/20" : ""}
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errors.contactPhone}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-image" className="text-xs font-medium text-foreground">
            Photo <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1.5">
            <Button
              type="button"
              variant="outline"
              className="w-full relative overflow-hidden bg-background border-border hover:bg-muted text-muted-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Choose Photo</span>
              <input
                id="item-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>

            {errors.imageUrl && (
              <p id="image-error" className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errors.imageUrl}</span>
              </p>
            )}

            {imageUrl && (
              <div className="flex items-center justify-between rounded-lg bg-card p-2 border border-border text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1.5 text-primary">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Image attached
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("")
                    setImageVerified(false)
                    if (imageInputRef.current) imageInputRef.current.value = ""
                  }}
                  className="text-destructive underline text-xs font-medium hover:text-destructive/80 ml-2 shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 96px Preview Tile Beside Input */}
          <div className="h-24 w-24 shrink-0 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center relative">
            {imageUrl && imageVerified ? (
              <img
                src={imageUrl}
                alt="Item preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-2 text-center">
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-mono leading-none">96×96</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-desc" className="text-xs font-medium text-foreground">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {description.length}/300
          </span>
        </div>
        <Textarea
          id="item-desc"
          value={description}
          maxLength={300}
          onPaste={handleDescPaste}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Distinctive marks, colors, brand, or context of loss..."
          rows={3}
        />
      </div>

      {/* Verification Questions (Only for Found items) */}
      {type === "found" && (
        <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="item-verification" className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">
              Verification Questions <span className="text-destructive">*</span>
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Ask specific questions that only the true owner can answer to prove it's theirs (e.g. "What is the lock screen wallpaper?", "What is the serial number?").
          </p>
          <Textarea
            id="item-verification"
            value={verificationHint}
            onChange={(e) => {
              setVerificationHint(e.target.value)
              if (errors.verificationHint) {
                setErrors(prev => { const n = {...prev}; delete n.verificationHint; return n; })
              }
            }}
            placeholder="Questions for the claimant..."
            rows={2}
            className={errors.verificationHint ? "border-destructive focus-visible:ring-destructive/20" : ""}
          />
          {errors.verificationHint && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errors.verificationHint}</span>
            </p>
          )}
        </div>
      )}

      {/* Form Action Buttons: Cancel (outline) and Post (amber) */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-border bg-background"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="relative min-w-[140px] overflow-hidden select-none font-semibold"
        >
          {/* Submit charging shimmer bar filling left to right */}
          {isSubmitting && (
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary-foreground/20 z-0"
            />
          )}

          <span className="relative z-10 flex items-center justify-center gap-1.5">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Gathering...</span>
              </>
            ) : submitSuccess ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Saved ✓</span>
              </>
            ) : (
              <span>{isEditing ? "Save changes" : "Post listing"}</span>
            )}
          </span>
        </Button>
      </div>
    </form>
  )
}
