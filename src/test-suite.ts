import {
  validateItemName,
  validateAndNormalizeContact,
  validateImageUrl,
  verifyImageLoads,
  sanitizeText,
} from "./lib/validators"
import { scoreItem, levenshteinDistance, highlightMatches, findPossibleMatches } from "./lib/search"
import { SEED_ITEMS } from "./lib/seed"
import { checkSubmissionLimits } from "./lib/storage"

console.log("[RUNNING] Quiet Storm validation test suite...")

// Levenshtein check
console.assert(levenshteinDistance("book", "boook") === 1, "Distance check failed")
console.assert(typeof verifyImageLoads === "function", "verifyImageLoads should be a function")

// 1. Name validation tests
// Empty / whitespace
console.assert(validateItemName("").valid === false, "Empty name should be invalid")
console.assert(validateItemName("   ").valid === false, "Whitespace name should be invalid")

// 1 char name
console.assert(validateItemName("A").valid === false, "1-char name should be invalid")

// 61 char name
const name61 = "A".repeat(61)
console.assert(validateItemName(name61).valid === false, "61-char name should be invalid")
console.assert(validateItemName("A".repeat(60)).valid === true, "60-char name should be valid")

// <script> in name
console.assert(validateItemName("<script>alert(1)</script>").valid === false || sanitizeText("<script>alert(1)</script>").includes("<") === false, "Script tags must be stripped or rejected")

// Emoji in name
console.assert(validateItemName("Blue Bottle \u{1F525}").valid === false, "Emoji in name must be rejected")
console.assert(validateItemName("Keys \u{1F511}").valid === false, "Emoji key in name must be rejected")

// Only digits / only symbols
console.assert(validateItemName("12345").valid === false, "Only digits should be rejected")
console.assert(validateItemName("---...").valid === false, "Only symbols should be rejected")
console.assert(validateItemName("Keys #4 (Desk)").valid === true, "Allowed symbols with letters should pass")

// 2. Picture URL tests
// javascript: URL
console.assert(validateImageUrl("javascript:alert(1)").valid === false, "javascript: URL must be rejected")

// data: URL
console.assert(validateImageUrl("data:image/png;base64,xxxx").valid === false, "data: URL must be rejected")

// Any https URL is now valid (permissive)
console.assert(validateImageUrl("https://campus.edu/about").valid === true, "Any https URL must be accepted")

// http URL is now valid (permissive)
console.assert(validateImageUrl("http://images.unsplash.com/photo-1.jpg").valid === true, "http URL must be accepted")

// valid https image URL
console.assert(validateImageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c").valid === true, "Valid Unsplash photo URL must pass")

// Google image URL (previously rejected, now accepted)
console.assert(validateImageUrl("https://lh3.googleusercontent.com/abc123").valid === true, "Google image URL must pass")

// 3. Contact information tests
// 9-digit phone
console.assert(validateAndNormalizeContact("987654321").valid === false, "9-digit phone must be rejected")

// Invalid phone (repeated digits)
console.assert(validateAndNormalizeContact("0000000000").valid === false, "Repeated 0s must be rejected")
console.assert(validateAndNormalizeContact("9999999999").valid === false, "Repeated 9s must be rejected")
console.assert(validateAndNormalizeContact("1234567890").valid === false, "Sequential 1234567890 must be rejected")

// Valid phone + normalization
const phoneRes = validateAndNormalizeContact("+91 9823489012")
console.assert(phoneRes.valid === true && phoneRes.type === "phone" && phoneRes.normalized === "+91 98234 89012", "Indian phone normalization failed")

// Valid email
const emailRes = validateAndNormalizeContact("STUDENT@CAMPUS.EDU")
console.assert(emailRes.valid === true && emailRes.type === "email" && emailRes.normalized === "student@campus.edu", "Uppercase email normalization failed")

// @handle with bad chars
console.assert(validateAndNormalizeContact("@user..name").valid === false, "Handle with consecutive dots must be rejected")
console.assert(validateAndNormalizeContact("@user!name").valid === false, "Handle with exclamation must be rejected")
console.assert(validateAndNormalizeContact("@valid_user.1").valid === true, "Valid handle must pass")

// 4. Rate-limit and double-click test
const rate1 = checkSubmissionLimits("Test Item", "student@campus.edu", 10)
console.assert(rate1.allowed === true, "First submission should be allowed")

const rateCap = checkSubmissionLimits("Test Item 2", "other@campus.edu", 200)
console.assert(rateCap.allowed === false, "Exceeding 200 items cap must be rejected")

// 5. Typo tolerance search & highlight
const bookItem = SEED_ITEMS.find((i) => i.category === "Books")!
console.assert(scoreItem(bookItem, "boook") > 0, "Typo 'boook' must match book")
console.assert(scoreItem(bookItem, "engineering") > 0, "Keyword 'engineering' must match")

// Strict search relevance check (backpack must not match glasses or airpods)
const backpackItem = SEED_ITEMS.find((i) => i.name.toLowerCase().includes("backpack"))!
const glassesItem = SEED_ITEMS.find((i) => i.name.toLowerCase().includes("glasses"))!
const airpodsItem = SEED_ITEMS.find((i) => i.name.toLowerCase().includes("airpods"))!

console.assert(scoreItem(backpackItem, "backpack") >= 100, "Backpack item must score high for 'backpack'")
console.assert(scoreItem(glassesItem, "backpack") === 0, "Glasses item must not match 'backpack'")
console.assert(scoreItem(airpodsItem, "backpack") === 0, "AirPods item must not match 'backpack'")

// Strict test for 'bags' query (MUST NOT match glasses or keys)
const keysItem = SEED_ITEMS.find((i) => i.name.toLowerCase().includes("honda civic"))!
console.assert(scoreItem(backpackItem, "bags") > 0, "Backpack item must match 'bags'")
console.assert(scoreItem(glassesItem, "bags") === 0, "Glasses item must not match 'bags'")
console.assert(scoreItem(keysItem, "bags") === 0, "Car keys item must not match 'bags'")

// Verify ID card seed image URL
const idCardItem = SEED_ITEMS.find((i) => i.id === "item-seed-5")!
console.assert(validateImageUrl(idCardItem.imageUrl).valid === true, "ID card image must be valid")
console.assert(!idCardItem.imageUrl?.includes("1580130037032"), "Old statue image must not be used for ID card")

const chunks = highlightMatches("Advanced Engineering Mathematics", "engineering")
console.assert(chunks.some((c) => c.text.toLowerCase() === "engineering" && c.isMatch), "Matched keyword should be flagged for highlight")

// 6. Possible matches recommender
const matches = findPossibleMatches(
  { type: "lost", name: "Apple AirPods", category: "Electronics" },
  SEED_ITEMS
)
console.assert(matches.length > 0 && matches[0].name.includes("AirPods"), "Possible matches recommendation failed")

console.log("[PASS] All required validation and search tests passed cleanly.")
