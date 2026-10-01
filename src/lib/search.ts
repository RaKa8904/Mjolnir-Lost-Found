import type { LostFoundItem, ItemType, ItemCategory } from "@/types"

/**
 * Simple Levenshtein distance for typo tolerance
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

export function stemWord(w: string): string {
  const clean = w.toLowerCase()
  if (clean.endsWith("ies") && clean.length > 4) return clean.slice(0, -3) + "y"
  if (clean.endsWith("es") && clean.length > 4) return clean.slice(0, -2)
  if (clean.endsWith("s") && clean.length > 3) return clean.slice(0, -1)
  return clean
}

const CAMPUS_SYNONYMS: Record<string, string[]> = {
  bag: ["backpack", "bag", "bags", "backpacks", "purse", "tote", "duffel", "satchel", "knapsack", "handbag", "pack"],
  bags: ["backpack", "bag", "bags", "backpacks", "purse", "tote", "duffel", "satchel", "knapsack", "handbag", "pack"],
  backpack: ["bag", "bags", "backpack", "backpacks", "pack", "knapsack", "daypack"],
  backpacks: ["bag", "bags", "backpack", "backpacks", "pack", "knapsack", "daypack"],
  key: ["key", "keys", "fob", "keychain", "ring"],
  keys: ["key", "keys", "fob", "keychain", "ring"],
  book: ["book", "books", "textbook", "hardcover", "paperback", "novel", "manual"],
  books: ["book", "books", "textbook", "hardcover", "paperback", "novel", "manual"],
  phone: ["phone", "smartphone", "mobile", "iphone", "android", "cell"],
  phones: ["phone", "smartphone", "mobile", "iphone", "android", "cell"],
  card: ["card", "cards", "badge", "id", "lanyard", "license", "pass"],
  cards: ["card", "cards", "badge", "id", "lanyard", "license", "pass"],
  id: ["id", "card", "cards", "badge", "lanyard", "identification"],
  wallet: ["wallet", "purse", "billfold", "bifold", "clutch"],
  glasses: ["glasses", "spectacles", "eyewear", "sunglasses", "shades", "frames"],
  earphones: ["earbuds", "airpods", "earphones", "headphones"],
  airpods: ["airpods", "earbuds", "earphones", "headphones"],
}

export function getSynonyms(word: string): string[] {
  const w = word.toLowerCase().trim()
  const list = CAMPUS_SYNONYMS[w] || []
  const stemmed = stemWord(w)
  const stemmedList = CAMPUS_SYNONYMS[stemmed] || []
  return Array.from(new Set([...list, ...stemmedList]))
}

/**
 * Checks if targetWord matches queryWord with typo tolerance, prefix, or stemming
 * NEVER applies Levenshtein typo distance to short words (< 5 characters)
 * to prevent 3-letter words like "bag" matching unrelated words like "tag", "bar", "car", "bat"
 */
export function fuzzyMatchWord(targetWord: string, queryWord: string): boolean {
  const t = targetWord.toLowerCase().trim()
  const q = queryWord.toLowerCase().trim()

  if (!t || !q) return false

  // 1. Exact match
  if (t === q) return true

  // 2. Stem match (e.g. "books" <-> "book", "keys" <-> "key", "bags" <-> "bag")
  const stemmedT = stemWord(t)
  const stemmedQ = stemWord(q)
  if (stemmedT === stemmedQ) return true

  // 3. Target starts with query (e.g. "backpack" starts with "back", "calculator" starts with "calc")
  if (q.length >= 3 && t.startsWith(q)) return true
  if (stemmedQ.length >= 3 && stemmedT.startsWith(stemmedQ)) return true

  // 4. Target contains query ONLY if query is at least 4 characters
  if (q.length >= 4 && t.includes(q)) return true
  if (stemmedQ.length >= 4 && stemmedT.includes(stemmedQ)) return true

  // 5. Typo tolerance via Levenshtein distance
  // Strict rule: at least one word must have 5+ chars, and the other 4+ chars
  if (Math.min(t.length, q.length) >= 4 && Math.max(t.length, q.length) >= 5) {
    const maxDistance = Math.max(t.length, q.length) >= 8 ? 2 : 1
    if (Math.abs(t.length - q.length) <= maxDistance) {
      if (levenshteinDistance(t, q) <= maxDistance) return true
    }
  }

  if (Math.min(stemmedT.length, stemmedQ.length) >= 4 && Math.max(stemmedT.length, stemmedQ.length) >= 5) {
    const maxDistance = Math.max(stemmedT.length, stemmedQ.length) >= 8 ? 2 : 1
    if (Math.abs(stemmedT.length - stemmedQ.length) <= maxDistance) {
      if (levenshteinDistance(stemmedT, stemmedQ) <= maxDistance) return true
    }
  }

  return false
}

/**
 * Evaluates relevance score for an item against search query
 * Higher score = higher relevance in search results
 * Returns 0 if item does not match query
 */
export function scoreItem(item: LostFoundItem, query: string): number {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return 1

  const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 0)
  if (queryWords.length === 0) return 1

  const name = item.name.toLowerCase()
  const category = item.category.toLowerCase()
  const location = (item.location || "").toLowerCase()
  const description = (item.description || "").toLowerCase()

  // Tokenize target fields
  const nameWords = name.split(/[\s,.-]+/).filter((w) => w.length > 0)
  const categoryWords = category.split(/[\s,.-]+/).filter((w) => w.length > 0)
  const locationWords = location.split(/[\s,.-]+/).filter((w) => w.length > 0)
  const descWords = description.split(/[\s,.-]+/).filter((w) => w.length > 1)

  let totalScore = 0
  let matchedQueryWordsCount = 0

  // Whole phrase match in Title gets highest bonus (+250)
  if (name.includes(cleanQuery)) {
    totalScore += 250
  }

  for (const qWord of queryWords) {
    let wordBestScore = 0
    const synonyms = getSynonyms(qWord)

    // 1. Exact match in item name (+120)
    if (nameWords.some((w) => w === qWord)) {
      wordBestScore = Math.max(wordBestScore, 120)
    }
    // 2. Name contains query word or prefix (+80)
    else if (
      name.includes(qWord) ||
      nameWords.some((w) => (qWord.length >= 3 && w.startsWith(qWord)) || (qWord.length >= 4 && w.includes(qWord)))
    ) {
      wordBestScore = Math.max(wordBestScore, 80)
    }
    // 3. Synonym match in name (+75)
    else if (synonyms.length > 0 && nameWords.some((w) => synonyms.includes(w) || synonyms.includes(stemWord(w)))) {
      wordBestScore = Math.max(wordBestScore, 75)
    }
    // 4. Exact or stem or synonym match in Category (+70)
    else if (
      categoryWords.some(
        (w) =>
          w === qWord ||
          stemWord(w) === stemWord(qWord) ||
          synonyms.includes(w) ||
          synonyms.includes(stemWord(w))
      )
    ) {
      wordBestScore = Math.max(wordBestScore, 70)
    }
    // 5. Typo/fuzzy match in name (+60)
    else if (nameWords.some((w) => fuzzyMatchWord(w, qWord))) {
      wordBestScore = Math.max(wordBestScore, 60)
    }
    // 6. Typo in Category (+50)
    else if (categoryWords.some((w) => fuzzyMatchWord(w, qWord))) {
      wordBestScore = Math.max(wordBestScore, 50)
    }
    // 7. Match in Campus Location (+40)
    else if (locationWords.some((w) => w === qWord || (qWord.length >= 4 && w.includes(qWord)))) {
      wordBestScore = Math.max(wordBestScore, 40)
    }
    // 8. Match in Description (+20)
    else if (descWords.some((w) => w === qWord || (qWord.length >= 4 && w.includes(qWord)))) {
      wordBestScore = Math.max(wordBestScore, 20)
    }
    // 9. Strict typo in description ONLY if query word is >= 5 characters (+15)
    else if (qWord.length >= 5 && descWords.some((w) => fuzzyMatchWord(w, qWord))) {
      wordBestScore = Math.max(wordBestScore, 15)
    }

    if (wordBestScore > 0) {
      matchedQueryWordsCount++
      totalScore += wordBestScore
    }
  }

  // All query words must match (or at least 75% for long phrases)
  const isSatisfied =
    queryWords.length <= 2
      ? matchedQueryWordsCount === queryWords.length
      : matchedQueryWordsCount >= Math.ceil(queryWords.length * 0.75)

  if (isSatisfied && totalScore > 0) {
    return totalScore
  }

  return 0
}

/**
 * Pure XSS-safe highlighted text segmentation
 */
export interface HighlightChunk {
  text: string
  isMatch: boolean
}

export function highlightMatches(text: string, query: string): HighlightChunk[] {
  if (!query || !query.trim() || !text) {
    return [{ text, isMatch: false }]
  }

  const queryTokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .sort((a, b) => b.length - a.length)

  if (queryTokens.length === 0) {
    return [{ text, isMatch: false }]
  }

  // Escape special regex characters
  const escapedTokens = queryTokens.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
  const regex = new RegExp(`(${escapedTokens.join("|")})`, "gi")

  const parts = text.split(regex)
  return parts.map((part) => ({
    text: part,
    isMatch: queryTokens.some((token) => token === part.toLowerCase()),
  }))
}

/**
 * Find potential matches between lost and found items
 */
export function findPossibleMatches(
  item: { type: ItemType; name: string; category: ItemCategory },
  allItems: LostFoundItem[]
): LostFoundItem[] {
  const targetType: ItemType = item.type === "lost" ? "found" : "lost"
  const candidateItems = allItems.filter(
    (i) => i.type === targetType && i.status === "active"
  )

  const nameWords = item.name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)

  const scoredCandidates = candidateItems
    .map((candidate) => {
      let score = 0
      if (candidate.category === item.category) {
        score += 2
      }

      const candidateWords = candidate.name
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)

      for (const w of nameWords) {
        if (candidateWords.includes(w)) {
          score += 4
        } else if (candidateWords.some((cw) => fuzzyMatchWord(cw, w))) {
          score += 2.5
        }
      }

      return { candidate, score }
    })
    .filter((entry) => entry.score >= 3)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.candidate)

  return scoredCandidates.slice(0, 3)
}
