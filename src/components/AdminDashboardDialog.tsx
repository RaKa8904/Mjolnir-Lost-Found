import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

interface AdminClaim {
  id: string
  item_id: string
  item_name: string
  item_kind: string
  verification_hint?: string
  claimant_email: string
  claimant_name: string
  claimant_student_id: string
  answers_text?: string
  evidence_image_url?: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

interface AdminDashboardDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const AdminDashboardDialog: React.FC<AdminDashboardDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [claims, setClaims] = useState<AdminClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const fetchClaims = () => {
    setLoading(true)
    fetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isOpen) {
      fetchClaims()
    }
  }, [isOpen])

  const handleResolve = async (claimId: string, action: 'approve' | 'reject') => {
    setProcessingId(claimId)
    try {
      const res = await fetch(`/api/claims/${claimId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notes[claimId] || "" }),
      })
      if (!res.ok) throw new Error("Failed to resolve claim")
      
      toast(`Claim ${action}d successfully.`)
      fetchClaims()
    } catch (err: any) {
      toast(err.message)
    } finally {
      setProcessingId(null)
    }
  }

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
              className="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
                <h2 className="text-lg font-semibold text-foreground">Admin Dashboard - Claims Queue</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-4" />
                    <span>Loading pending claims...</span>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                    <p>No claims in the system.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim) => (
                      <div key={claim.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border bg-muted/20">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{claim.item_name}</h3>
                              <span className="text-xs text-muted-foreground">Type: {claim.item_kind}</span>
                            </div>
                            <div className="text-right text-sm">
                              <span className={`font-semibold ${claim.status === 'pending' ? 'text-amber-500' : claim.status === 'approved' ? 'text-green-500' : 'text-destructive'}`}>
                                {claim.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-background p-3 rounded text-sm border border-border">
                            <p className="font-medium mb-1">Claimant Details</p>
                            <p className="text-muted-foreground">Name: {claim.claimant_name}</p>
                            <p className="text-muted-foreground">Email: {claim.claimant_email}</p>
                            <p className="text-muted-foreground">Student ID: {claim.claimant_student_id}</p>
                          </div>

                          {claim.item_kind === "found" && (
                            <div className="bg-primary/5 border border-primary/20 p-3 rounded text-sm">
                              <p className="font-medium text-primary mb-1">Verification Q&A</p>
                              <p className="text-muted-foreground text-xs italic mb-2">Q: {claim.verification_hint}</p>
                              <p className="text-foreground">A: {claim.answers_text}</p>
                            </div>
                          )}
                          
                          {claim.item_kind === "lost" && claim.evidence_image_url && (
                            <div className="space-y-2 text-sm">
                              <p className="font-medium">Image Proof</p>
                              <div className="h-32 w-32 rounded overflow-hidden border border-border bg-muted">
                                <img src={claim.evidence_image_url} alt="Proof" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}

                          {claim.status === 'pending' && (
                            <Textarea
                              placeholder="Add a review note (optional)"
                              value={notes[claim.id] || ""}
                              onChange={(e) => setNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                              className="text-sm mt-2"
                              rows={2}
                            />
                          )}
                        </div>
                        
                        {claim.status === 'pending' && (
                          <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                            <Button 
                              variant="default" 
                              className="bg-green-600 hover:bg-green-700 w-full md:w-32"
                              disabled={processingId === claim.id}
                              onClick={() => handleResolve(claim.id, 'approve')}
                            >
                              {processingId === claim.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="w-full md:w-32"
                              disabled={processingId === claim.id}
                              onClick={() => handleResolve(claim.id, 'reject')}
                            >
                              {processingId === claim.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                              Reject
                            </Button>
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
