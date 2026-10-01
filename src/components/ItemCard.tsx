import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  MapPin,
  Check,
  RotateCcw,
  ImageOff,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Zap,
} from "lucide-react"
import type { LostFoundItem } from "@/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { formatRelativeTime } from "@/lib/utils"
import { highlightMatches } from "@/lib/search"

interface ItemCardProps {
  item: LostFoundItem
  searchQuery?: string
  currentUserRole?: string
  onContactClick: (item: LostFoundItem) => void
  onClaimClick: (item: LostFoundItem) => void
  onImageClick: (item: LostFoundItem) => void
  onEditClick: (item: LostFoundItem) => void
  onDeleteClick: (item: LostFoundItem) => void
  onToggleRecovered: (id: string) => void
  isNew?: boolean
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  searchQuery = "",
  currentUserRole = "student",
  onContactClick,
  onClaimClick,
  onImageClick,
  onEditClick,
  onDeleteClick,
  onToggleRecovered,
  isNew = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isLost = item.type === "lost"
  const isRecovered = item.status === "reunited"
  const isAdmin = currentUserRole === "admin"
  
  // If contact info is null, the user hasn't proven ownership.
  // Actually, the API returns contact_value as null if they can't see it.
  const needsClaim = !item.contactInfo && !item.contactValue && !isAdmin;

  const renderHighlighted = (text: string) => {
    if (!searchQuery) return text
    const chunks = highlightMatches(text, searchQuery)
    return (
      <>
        {chunks.map((chunk, idx) =>
          chunk.isMatch ? (
            <span
              key={idx}
              className="underline decoration-primary decoration-2 underline-offset-2 font-medium text-foreground"
            >
              {chunk.text}
            </span>
          ) : (
            <React.Fragment key={idx}>{chunk.text}</React.Fragment>
          )
        )}
      </>
    )
  }

  return (
    <>
      <motion.article
        layout
        initial={isNew ? { scale: 0.96, opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{
          scale: 1,
          y: 0,
          opacity: 1,
        }}
        whileHover={{
          y: -5,
          transition: { duration: 0.2, ease: "easeOut" },
        }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={() => onImageClick(item)}
        className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer ${
          isNew ? "animate-border-pulse" : "border-border shadow-sm"
        }`}
      >
        {/* Tech-precise corner target bracket: 12px amber 'L' on hover only */}
        <div
          className="pointer-events-none absolute top-2.5 left-2.5 z-20 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-0 w-3 h-[1.5px] bg-primary shadow-[0_0_4px_var(--primary)]" />
          <div className="absolute top-0 left-0 w-[1.5px] h-3 bg-primary shadow-[0_0_4px_var(--primary)]" />
        </div>

        {/* Top: Image area (aspect-[4/3], object-cover, bg-muted) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted select-none">
          {item.imageUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true)
                  setImageLoaded(true)
                }}
                onClick={() => onImageClick(item)}
                className={`h-full w-full object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.03] ${
                  isRecovered ? "opacity-60" : imageLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          ) : (
            /* Broken/absent image: bg-muted with centered image-off icon and category name */
            <div className="flex h-full w-full flex-col items-center justify-center p-4 bg-muted text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground mb-2">
                <ImageOff className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {item.category}
              </span>
            </div>
          )}

          {/* Status chip ONLY stays on photo, top-left, with bg-background/95 backing */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {isRecovered ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border border-primary/40 bg-background/95 text-primary shadow-sm backdrop-blur-sm">
                <Check className="h-3 w-3 stroke-[2.5]" />
                <span>Recovered</span>
              </span>
            ) : isLost ? (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-foreground text-background shadow-sm">
                LOST
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-border bg-background/95 text-foreground shadow-sm backdrop-blur-sm">
                FOUND
              </span>
            )}
          </div>
        </div>

        {/* Middle: Body (p-4, gap-2) */}
        <div className="flex flex-1 flex-col p-4 text-left gap-2">
          {/* Category chip and time chip go in the CARD BODY (not over photo) */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-border bg-muted/60 text-muted-foreground">
              {item.category}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>

          {/* Title 15px semibold single line with truncate */}
          <h3
            className="text-[15px] font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-tight"
            title={item.name}
          >
            {renderHighlighted(item.name)}
          </h3>

          {/* Description 2-line clamp muted */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
            {item.description ? (
              renderHighlighted(item.description)
            ) : (
              <span className="italic text-muted-foreground/60">
                No description provided
              </span>
            )}
          </p>

          {/* Divider */}
          <div className="my-1 border-t border-border" />

          {/* Two meta rows (location, date) with 14px icons and text-xs */}
          <div className="space-y-1.5 text-xs text-muted-foreground font-sans">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {item.location ? renderHighlighted(item.location) : "Campus area"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {item.incidentDate && item.incidentDate !== item.date
                  ? `${item.type === "lost" ? "Lost" : "Found"} ${item.incidentDate} • Reported ${item.date}`
                  : `Reported ${item.date}`}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="p-4 pt-0 flex items-center gap-2">
          {needsClaim ? (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onClaimClick(item)
              }}
              className="flex-1 h-9 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 group/claim relative overflow-hidden"
            >
              <span className="pointer-events-none absolute -top-[1px] -right-[1px] w-2.5 h-2.5 opacity-0 group-hover/claim:opacity-100 transition-opacity">
                <span className="absolute top-0 right-0 w-2.5 h-[1.5px] bg-primary-foreground shadow-[0_0_4px_var(--primary-foreground)] animate-pulse" />
                <span className="absolute top-0 right-0 w-[1.5px] h-2.5 bg-primary-foreground shadow-[0_0_4px_var(--primary-foreground)] animate-pulse" />
              </span>
              <Zap className="h-3.5 w-3.5 fill-current opacity-70 group-hover/claim:animate-pulse" />
              <span>{isLost ? "I Found It" : "It's Mine"}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onContactClick(item)
              }}
              className="flex-1 h-9 px-3 text-xs font-medium border-border bg-background hover:bg-muted text-foreground gap-1.5"
            >
              <span>Contact</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}

          {isAdmin && (
            isRecovered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleRecovered(item.id)
                }}
                className="h-9 px-2.5 text-xs font-medium border-border bg-background hover:bg-muted text-foreground gap-1"
                title="Return item to active listings"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Undo</span>
              </Button>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 border-border bg-background text-muted-foreground hover:text-foreground"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => onToggleRecovered(item.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <Check className="h-4 w-4 text-primary" />
                    <span>Mark as recovered</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEditClick(item)}
                    className="gap-2 cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                    <span>Edit details</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            )
          )}
        </div>
      </motion.article>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{item.name}&quot;? This action will remove the listing from the campus ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false)
                onDeleteClick(item)
              }}
            >
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
