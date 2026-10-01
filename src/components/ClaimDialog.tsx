import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { LostFoundItem } from "@/types"

interface ClaimDialogProps {
  item: LostFoundItem | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (itemId: string, data: any) => Promise<void>
}

export const ClaimDialog: React.FC<ClaimDialogProps> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [answers, setAnswers] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [studentId, setStudentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setError("")
    setIsSubmitting(true)
    
    try {
      await onSubmit(item.id, {
        answers,
        evidence_image_url: imageUrl,
        student_id: studentId
      })
      
      setAnswers("")
      setImageUrl("")
      setStudentId("")
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to submit claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && item && (
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
              className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {item.type === "lost" ? "Claim You Found This" : "Claim This Is Yours"}
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-5">
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>

                  {item.type === "found" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Verification Questions
                      </label>
                      <p className="text-sm text-muted-foreground border-l-2 border-primary pl-2 italic">
                        {item.verificationHint || "Describe specific identifying marks, scratches, or passwords to prove this is yours."}
                      </p>
                      <Textarea
                        required
                        value={answers}
                        onChange={(e) => setAnswers(e.target.value)}
                        placeholder="Your answers / proof..."
                        className="mt-2 bg-background"
                      />
                    </div>
                  )}

                  {item.type === "lost" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Upload Image Proof
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Upload a photo showing you physically have this item.
                      </p>
                      <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" className="relative cursor-pointer overflow-hidden">
                          <Upload className="h-4 w-4 mr-2" />
                          <span>Choose Image</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" required />
                        </Button>
                        {imageUrl && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      {imageUrl && (
                        <div className="mt-2 rounded overflow-hidden h-32 w-32 border border-border">
                          <img src={imageUrl} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Your Student ID</label>
                    <Input
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="bg-background"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Claim
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
