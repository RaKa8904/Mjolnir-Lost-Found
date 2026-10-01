import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ItemForm } from "@/components/ItemForm"
import type { LostFoundItem, ItemFormData } from "@/types"

interface EditItemDialogProps {
  item: LostFoundItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, data: Partial<LostFoundItem>) => void
  allItems: LostFoundItem[]
}

export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate,
  allItems,
}) => {
  if (!item) return null

  const handleUpdate = (formData: ItemFormData) => {
    onUpdate(item.id, formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>
            Update details for &ldquo;{item.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <ItemForm
            initialValues={{
              type: item.type,
              name: item.name,
              category: item.category,
              description: item.description,
              location: item.location,
              date: item.date,
              incidentDate: item.incidentDate || item.date,
              imageUrl: item.imageUrl || "",
              contactInfo: item.contactInfo,
              contactEmail: item.contactEmail,
              contactPhone: item.contactPhone,
            }}
            onSubmit={handleUpdate}
            onCancel={onClose}
            allItems={allItems}
            isEditing={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
