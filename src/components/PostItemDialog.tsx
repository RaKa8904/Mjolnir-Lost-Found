import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ItemForm } from "@/components/ItemForm"
import { ThorHangingCharm } from "@/components/ThorHangingCharm"
import type { LostFoundItem, ItemFormData, ItemType, ItemCategory } from "@/types"

interface PostItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ItemFormData) => void
  defaultType?: ItemType
  allItems: LostFoundItem[]
  checkDuplicate: (name: string, category: ItemCategory, type: ItemType) => boolean
}

export const PostItemDialog: React.FC<PostItemDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = "lost",
  allItems,
  checkDuplicate,
}) => {
  const handleSubmit = (data: ItemFormData) => {
    onSubmit(data)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6">
        <div className="flex items-start justify-between">
          <DialogHeader className="pr-2">
            <DialogTitle>Post an item</DialogTitle>
            <DialogDescription>
              Report a lost item or catalog something you found on campus.
            </DialogDescription>
          </DialogHeader>
          <div className="hidden sm:block shrink-0 -mt-2 mr-6">
            <ThorHangingCharm />
          </div>
        </div>

        <div className="mt-2">
          <ItemForm
            initialValues={{ type: defaultType }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            allItems={allItems}
            checkDuplicate={checkDuplicate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
