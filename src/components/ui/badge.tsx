import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-muted text-muted-foreground",
        lost:
          "bg-foreground text-background font-semibold border border-foreground/20",
        found:
          "border border-border bg-background text-foreground font-medium",
        recovered:
          "border border-primary/40 bg-primary/10 text-primary font-medium",
        category:
          "border border-border bg-muted/60 text-muted-foreground text-[11px] font-sans",
        outline:
          "border border-border bg-background text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
