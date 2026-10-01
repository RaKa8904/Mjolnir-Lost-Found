# Campus Lost & Found ("Quiet Storm")

A calm, confident dark tool for campus recovery built in the spirit of Linear and Vercel. Students can report lost or found items, search records with typo-tolerant fuzzy matching, and contact finders directly.

---

## Quickstart

Run locally with Node.js (v18+):

```bash
# 1. Navigate to the project folder
cd finals

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# Opens http://localhost:5173

# 4. Run automated test suite
npm test

# 5. Build for production
npm run build
```

---

## Problem Statement Coverage

| Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Post form with Lost / Found toggle** | Covered | Toggle switch between "I lost something" and "I found something". Fields: Item name (required), Category (7 options), Location (optional), Date (required), Contact info (required), Description (optional), Picture URL (optional). |
| **Picture URL with live preview and fallback** | Covered | Live image preview with pre-load verification; blocks dangerous schemes (javascript:, data:, blob:, file:, user:pass@); falls back to a neutral surface with an image-off icon and category text if blank or broken. |
| **Contact info and strict validation** | Covered | Enforces exactly one of: Indian mobile number (+91 10-digits), campus email, or Instagram @handle. Auto-detects type and formats cleanly. |
| **List of all items as cards (newest first)** | Covered | Responsive card grid with relative timestamps ("2h ago"), category chips, and clear status indicators (Lost: solid chip; Found: outlined chip; Recovered: accent chip with checkmark). |
| **Filter tabs (All / Lost / Found)** | Covered | Segmented tabs with live counts and an animated sliding indicator pill. Lost items are prominently visible. |
| **Search box with fuzzy matching (~150ms)** | Covered | Instant debounced search across item name, category, description, and location. Handles typos (e.g. "boook" matches Books) and underlines matched keywords with the Storm Amber accent. |
| **Quick-search chips** | Covered | 1-click filter chips for Books, Keys, Bags, Phone, ID Card, Wallet with clear button and live result counter. |
| **Combined search, filters, and sort** | Covered | Search query, tab filter, category select, and sort order (Newest / Oldest) work together without conflict. |

---

## Validation Matrix

All input constraints are strictly enforced in both the client form and the storage layer:

| Field | Rules & Constraints | Handled Edge Cases |
| :--- | :--- | :--- |
| **Item Name** | 2 to 60 characters, trimmed, collapsed spaces. Allowed: letters, digits, spaces, and `. , ' - & ( ) / #`. | Rejects names with only numbers, only symbols, script tags (`<script>`), HTML, control characters, or emojis. Live character counter (X/60). |
| **Contact Info** | Required. Exactly one of: Indian mobile (10 digits starting 6-9), email (RFC-compliant, lowercased), or Instagram @handle (1-30 chars, no consecutive dots). | Rejects dummy numbers like 0000000000 and 1234567890; normalizes mobile numbers to `+91 XXXXX XXXXX`. |
| **Picture URL** | Optional. Must parse via `new URL()`; protocol must be `https:` (or `http:` for localhost); maximum 2048 characters. | Blocks `javascript:`, `data:`, `blob:`, `file:`, `user:pass@`, bare hostnames, and IP literals. Validates image extensions or recognized image hosts, verified via an Image pre-load check with a 6s timeout. |
| **Description** | Optional. Maximum 300 characters, plain text only. | Strips control characters, zero-width spaces, and script tags. |
| **Location** | Optional. 2 to 80 characters. | Strips tags and collapses spaces. |
| **Category** | Allowed: `Books`, `Keys`, `Bags`, `Electronics`, `ID/Cards`, `Clothing`, `Other`. | Enforced via Zod enum; tampered values are rejected on submission. |
| **Rate Limit & Storage** | Maximum 200 items in store; duplicate submissions (same name and contact within 60s) are blocked with a clear message. | On load, every record is re-validated through the Zod schema; corrupt records are dropped silently; falls back to seed data if store is compromised. |

---

## 2-Minute Judge Demo Script

Follow this sequence to present the core functionality and design:

| Time | Action | What is Demonstrated |
| :---: | :--- | :--- |
| **0:00 - 0:20** | **Overview & Hero** | Point out the calm, confident "Quiet Storm" aesthetic: OKLCH color tokens, Fraunces serif headline, hand-drawn lightning crack SVG line with its opening draw animation, and the slim inline stats row (Total, Lost, Found, Recovered). |
| **0:20 - 0:40** | **Typo-Tolerant Search & Highlights** | Press `/` on your keyboard to focus the search input. Type `boook` (with three o's). Notice that the *Advanced Engineering Mathematics* textbook appears instantly, with "Books" and matching text cleanly underlined in Storm Amber. Click the `X` button to clear. |
| **0:40 - 0:55** | **Image Fallback Verification** | Point to Item #11 (*Blue Down Puffer Jacket*) or Item #12 (*Brass Dorm Keys*). Show how the deliberately broken Unsplash link gracefully renders the fallback neutral surface with an image-off icon and category label. Click any valid card image to show the Lightbox. |
| **0:55 - 1:15** | **Posting an Item & Match Radar** | Click **"Post an item"** (or press `Cmd+K` then select post). Select "I lost something". Type `AirPods` in the name field. Point out the quiet inline notice with an amber left border indicating a potential match with an active Found item. Enter an Indian phone number (e.g. `9823489012`) and observe the automatic "Phone (+91)" detection chip. Click **"Post listing"**. |
| **1:15 - 1:35** | **Recovered Flow & Undo Toast** | Notice the 350ms subtle flash overlay and card pulse. On any card, click **"Mark as recovered"**. The card shows a short lightning stroke, shifts to the recovered badge, and triggers a plain text toast with an immediate **Undo** action button. Click **"Undo"** to verify that the status reverts cleanly. |
| **1:35 - 1:50** | **Contact Reveal Modal** | Click **"Contact"** on any card. Demonstrate the formatted phone, email, or Instagram link, 1-click clipboard copy with visual feedback, and the campus safety advice. |
| **1:50 - 2:00** | **Command Palette (Cmd+K)** | Press `Cmd+K` to show the minimal command menu. Filter by category, view status views, or trigger **"Reset sample data"** to restore the 12 default items. |

---

## Architecture & Technology Stack

- **Framework:** Vite 8 + React 19 + TypeScript (Strict mode)
- **Styling:** Tailwind CSS 3.4 + OKLCH Design Tokens (`DESIGN.md`)
- **Typography:** Fraunces (Display), Geist Sans (UI), Geist Mono (Metadata)
- **Icons:** Lucide React (stroke width 1.5, monochrome)
- **State & Storage:** LocalStorage adapter with automated in-memory session fallback and Zod runtime schema re-validation
- **Validation:** Zod + Custom sanitization for paste, script injection, and emojis
- **Notifications:** Sonner (plain text, surface styled)
- **Command Palette:** cmdk
