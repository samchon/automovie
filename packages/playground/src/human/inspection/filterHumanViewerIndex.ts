import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";

/**
 * The index entries that match a search text and a domain filter. The text matches the label, id and section, ignoring case and surrounding blanks, and every whitespace-separated word must appear, so `body arms` finds the arm states. The domain all keeps Face, Body and Person. The order of the entries is kept, and blank search imposes no word restriction.
 *
 * @evidence contracts/common.md#principled-implementation Domain equality filters one numerical category and every normalized whitespace-separated search word must occur in combined navigation text, preserving original entry order.
 * @evidence contracts/common.md#clear-and-simple-design The helper performs one pure navigation query without importing numerical documents, admission or DOM state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matches depend on current entry text rather than a name-specific search exception, and all-domain/blank queries impose no invented category or word requirement.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies searchable fields, case/whitespace normalization, all three domains, conjunction semantics and blank/order behavior.
 * @evidence contracts/performance.md#efficient-algorithms Normalizing w words and scanning n entry texts of aggregate l characters costs O(lw) substring work in the worst case plus query parsing, with temporary normalized text and O(a) returned matching references.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Search reads the supplied current index and keeps no stale cross-catalogue text or result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned references borrow index data and temporary word/text strings acquire no listener, worker or renderer handle.
 */
export function filterHumanViewerIndex(
  entries: readonly IHumanViewerIndexEntry[],
  filter: {
    /** Whitespace-separated navigation words, matched case-insensitively against label, id and section. */
    text: string;

    /** Exact domain restriction, or all to keep every supported numerical domain. */
    domain: "all" | "face" | "body" | "person";
  },
): IHumanViewerIndexEntry[] {
  const words: string[] = filter.text
    .toLowerCase()
    .split(/\s+/)
    .filter((word: string): boolean => word !== "");
  return entries.filter((entry: IHumanViewerIndexEntry): boolean => {
    if (filter.domain !== "all" && entry.domain !== filter.domain) return false;
    const haystack: string =
      `${entry.label} ${entry.id} ${entry.section}`.toLowerCase();
    return words.every((word: string): boolean => haystack.includes(word));
  });
}
