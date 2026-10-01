import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Claim {
  id: string
  item_id: string
  item_name: string
  item_kind: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  review_note?: string
}

interface MyActivityDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const MyActivityDialog: React.FC<MyActivityDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/claims')
        .then(res => res.json())
        .then(data => {
          setClaims(data.claims || [])
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl pointer-events-auto flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
                <h2 className="text-lg font-semibold text-foreground">My Claims Activity</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-4" />
                    <span>Loading your activity...</span>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                    <p>You haven't submitted any claims yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <div key={claim.id} className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">{claim.item_name}</h3>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">{claim.item_kind}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {claim.status === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" /> Pending</span>}
                            {claim.status === 'approved' && <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" /> Approved</span>}
                            {claim.status === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" /> Rejected</span>}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted on {new Date(claim.created_at).toLocaleDateString()}
                        </div>
                        {claim.review_note && (
                          <div className="mt-2 text-sm bg-background p-2 rounded border border-border">
                            <span className="font-semibold text-xs text-muted-foreground block mb-1">Admin Note:</span>
                            {claim.review_note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
