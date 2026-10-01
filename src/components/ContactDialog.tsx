import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, Phone, Mail, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { LostFoundItem } from "@/types"

interface ContactDialogProps {
  item: LostFoundItem | null
  isOpen: boolean
  onClose: () => void
}

export const ContactDialog: React.FC<ContactDialogProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!item) return null

  // Extract Email
  let email = item.contactEmail
  if (!email && (item.contactType === "email" || item.contactInfo.includes("@"))) {
    if (item.contactInfo.includes("•")) {
      email = item.contactInfo.split("•").find((s) => s.includes("@"))?.trim()
    } else if (item.contactInfo.includes("@") && !item.contactInfo.startsWith("@")) {
      email = item.contactInfo.trim()
    }
  }

  // Extract Phone
  let phone = item.contactPhone
  if (!phone) {
    if (item.contactInfo.includes("•")) {
      phone = item.contactInfo.split("•").find((s) => /\d{5}/.test(s))?.trim()
    } else if (item.contactType === "phone" || (/\d{7}/.test(item.contactInfo) && !item.contactInfo.includes("@"))) {
      phone = item.contactInfo.trim()
    }
  }

  // Extract Instagram handle
  const isInstagram = item.contactType === "instagram" || (item.contactInfo.startsWith("@") && !email && !phone)
  const instagramHandle = isInstagram ? item.contactInfo.trim() : null

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    toast("Copied to clipboard")
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldKey ? null : prev))
    }, 2000)
  }

  const getGmailUrl = (emailAddr: string) => {
    const subject = `Regarding your ${item.type} item: ${item.name}`
    const body = `Hi,\n\nI am contacting you regarding your ${item.type} listing on Mjolnir Lost & Found: "${item.name}".\n\nCampus Location: ${item.location || "Campus"}\n\n`
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddr)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact information</DialogTitle>
          <DialogDescription>
            Direct contact provided by the person who posted &ldquo;{item.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-left">
          {/* Phone Section (if phone exists) */}
          {phone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground block tracking-wider">
                      Phone Number
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate block select-all">
                      {phone}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(phone!, "phone")}
                  className="h-8 px-2.5 text-xs shrink-0"
                  aria-label="Copy phone number"
                >
                  {copiedField === "phone" ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-primary" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Email Section (if email exists) */}
          {email && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground block tracking-wider">
                      Email Address
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate block select-all">
                      {email}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(email!, "email")}
                  className="h-8 px-2.5 text-xs shrink-0"
                  aria-label="Copy email address"
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-primary" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Single primary button: Open in Gmail */}
              <a
                href={getGmailUrl(email)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full h-10 gap-2 font-semibold">
                  <Mail className="h-4 w-4" />
                  <span>Open in Gmail</span>
                </Button>
              </a>
            </div>
          )}

          {/* Instagram profile (if Instagram handle) */}
          {instagramHandle && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground block tracking-wider">
                      Instagram
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate block select-all">
                      {instagramHandle}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(instagramHandle, "instagram")}
                  className="h-8 px-2.5 text-xs shrink-0"
                >
                  {copiedField === "instagram" ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-primary" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              <a
                href={instagramHandle.startsWith("http") ? instagramHandle : `https://instagram.com/${instagramHandle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full h-10 gap-2 font-semibold">
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Instagram profile</span>
                </Button>
              </a>
            </div>
          )}

          {/* Fallback if somehow neither parsed */}
          {!phone && !email && !instagramHandle && item.contactInfo && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <span className="text-xs font-semibold text-foreground truncate select-all">
                {item.contactInfo}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(item.contactInfo, "general")}
                className="h-8 px-2.5 text-xs shrink-0"
              >
                {copiedField === "general" ? "Copied" : "Copy"}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Tip: For safety, arrange physical exchanges in public campus areas such as the library foyer or student center.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
