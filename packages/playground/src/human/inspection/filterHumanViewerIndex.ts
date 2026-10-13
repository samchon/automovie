import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";

/**
 * The index entries that match a search text and a domain filter. The text
 * matches the label and the id, ignoring case and surrounding blanks, and
 * every whitespace-separated word must appear, so `body arms` finds the arm
 * states. The domain `all` keeps both. The order of the entries is kept.
 *
 * @evidence contracts/common.md#principled-implementation Applies the supplied domain filter and case-insensitive all-word matching across label, id and section without changing index order.
 * @evidence contracts/common.md#clear-and-simple-design One predicate combines domain admission and textual search over the existing index records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty words impose no extra restriction and every document uses the same search law; no named catalogue entry receives a synthetic match.
 * @evidence contracts/common.md#meaningful-documentation States normalization, required word conjunction, all-domain meaning and retained ordering.
 */
export function filterHumanViewerIndex(
  entries: readonly IHumanViewerIndexEntry[],
  filter: { text: string; domain: "all" | "face" | "body" | "person" },
): IHumanViewerIndexEntry[] {
  const words = filter.text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== "");
  return entries.filter((entry) => {
    if (filter.domain !== "all" && entry.domain !== filter.domain) return false;
    const haystack =
      `${entry.label} ${entry.id} ${entry.section}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
