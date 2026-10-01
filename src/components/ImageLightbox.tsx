import React from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Clock, Mail, ExternalLink, Check, RotateCcw, ImageOff } from "lucide-react"
import type { LostFoundItem } from "@/types"

interface ImageLightboxProps {
  item: LostFoundItem | null
  isOpen: boolean
  onClose: () => void
  onContactClick?: (item: LostFoundItem) => void
  onToggleRecovered?: (id: string) => void
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  item,
  isOpen,
  onClose,
  onContactClick,
  onToggleRecovered,
}) => {
  if (!item) return null

  const isRecovered = item.status === "reunited"
  const isLost = item.type === "lost"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border shadow-2xl">
        {/* Header with full title and badges, pr-12 for close button clearance */}
        <div className="flex flex-col gap-2 pb-4 pr-12 border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isLost ? "lost" : "found"}>
              {item.type.toUpperCase()}
            </Badge>
            <Badge variant="category">{item.category}</Badge>
            {isRecovered && (
              <Badge variant="recovered" className="bg-primary/20 text-primary border-primary/30">
                <Check className="h-3 w-3 mr-1" />
                RECOVERED
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {item.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete details from the campus lost &amp; found ledger.
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="space-y-5 pt-2 text-left">
          {/* 1. Item Photo (if available) */}
          {item.imageUrl ? (
            <div className="relative overflow-hidden rounded-xl bg-background border border-border flex items-center justify-center max-h-[380px]">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="max-h-[360px] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/60 border border-border text-muted-foreground">
              <ImageOff className="h-5 w-5 text-muted-foreground/60 shrink-0" />
              <span className="text-xs">No photograph attached to this listing.</span>
            </div>
          )}

          {/* 2. Metadata Grid: Location & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground block text-[11px] font-mono uppercase">
                  Location
                </span>
                <span className="font-medium text-foreground">
                  {item.location || "Campus grounds"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground block text-[11px] font-mono uppercase">
                  {isLost ? "When lost" : "When found"}
                </span>
                <span className="font-medium text-foreground">
                  {item.incidentDate || item.date}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2 pt-1 border-t border-border/40">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground block text-[11px] font-mono uppercase">
                  Date reported to ledger
                </span>
                <span className="text-muted-foreground font-mono">
                  {item.date}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Full Description */}
          {item.description && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider block">
                Description &amp; Identifying Notes
              </span>
              <div className="p-3.5 rounded-xl bg-background border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {item.description}
              </div>
            </div>
          )}

          {/* 4. Contact Information Box */}
          {(() => {
            let email = item.contactEmail
            if (!email && (item.contactType === "email" || item.contactInfo.includes("@"))) {
              if (item.contactInfo.includes("•")) {
                email = item.contactInfo.split("•").find((s) => s.includes("@"))?.trim()
              } else if (item.contactInfo.includes("@") && !item.contactInfo.startsWith("@")) {
                email = item.contactInfo.trim()
              }
            }

            let phone = item.contactPhone
            if (!phone) {
              if (item.contactInfo.includes("•")) {
                phone = item.contactInfo.split("•").find((s) => /\d{5}/.test(s))?.trim()
              } else if (item.contactType === "phone" || (/\d{7}/.test(item.contactInfo) && !item.contactInfo.includes("@"))) {
                phone = item.contactInfo.trim()
              }
            }

            const getMailUrl = (addr: string) => {
              const subject = `Regarding your ${item.type} listing: ${item.name}`
              const body = `Hi,\n\nI am contacting you regarding your ${item.type} listing on Mjolnir Lost & Found: "${item.name}".\n\nCampus Location: ${item.location || "Campus"}\n\n`
              return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(addr)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            }

            return (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-primary tracking-wider font-semibold">
                    Direct Contact
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">
                    {phone && email ? "Phone & Email" : phone ? "Phone" : email ? "Email" : item.contactType}
                  </span>
                </div>

                {/* If phone found */}
                {phone && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase text-muted-foreground">Phone:</span>
                      <span className="text-sm font-semibold text-foreground font-sans truncate select-all">
                        {phone}
                      </span>
                    </div>
                  </div>
                )}

                {/* If email found */}
                {email && (
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/30">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[11px] font-mono uppercase text-muted-foreground">Email:</span>
                      <span className="text-sm font-semibold text-foreground font-sans truncate select-all">
                        {email}
                      </span>
                    </div>
                    <a
                      href={getMailUrl(email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button size="sm" className="h-8 gap-1.5 font-semibold text-xs">
                        <Mail className="h-3.5 w-3.5" />
                        <span>Open in Gmail</span>
                      </Button>
                    </a>
                  </div>
                )}

                {/* Fallback if neither */}
                {!phone && !email && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground font-sans truncate select-all">
                      {item.contactInfo}
                    </span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* 5. Modal Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {onContactClick && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onContactClick(item)}
                  className="h-9 px-4 font-semibold text-xs gap-1.5"
                >
                  <span>Contact Options</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}

              {onToggleRecovered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleRecovered(item.id)}
                  className="h-9 px-3 text-xs gap-1.5"
                >
                  {isRecovered ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Reopen listing</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>Mark as recovered</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
