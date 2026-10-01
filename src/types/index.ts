export type ItemType = "lost" | "found"
export type ItemStatus = "active" | "reunited"

export type ItemCategory =
  | "Books"
  | "Keys"
  | "Bags"
  | "Electronics"
  | "ID/Cards"
  | "Clothing"
  | "Other"

export type ContactType = "phone" | "email" | "both" | "instagram" | "other"

export interface LostFoundItem {
  id: string
  type: ItemType
  name: string
  category: ItemCategory
  description: string
  location: string
  date: string
  incidentDate?: string
  imageUrl?: string
  contactInfo: string
  contactValue?: string
  contactType: ContactType
  contactEmail?: string
  contactPhone?: string
  status: ItemStatus | 'pending_claim' | 'open'
  createdAt: string
  updatedAt?: string
  verificationHint?: string
  posted_by?: string
}

export interface ItemFormData {
  type: ItemType
  name: string
  category: ItemCategory
  description?: string
  location?: string
  date: string
  incidentDate?: string
  imageUrl?: string
  contactInfo: string
  contactEmail?: string
  contactPhone?: string
  verificationHint?: string
}

export type SortOption = "newest" | "oldest"
export type FilterType = "all" | "lost" | "found" | "reunited"
