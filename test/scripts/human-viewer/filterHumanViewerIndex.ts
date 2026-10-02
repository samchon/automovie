import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";

/**
 * The index entries that match a search text and a domain filter. The text
 * matches the label and the id, ignoring case and surrounding blanks, and
 * every whitespace-separated word must appear, so `body arms` finds the arm
 * states. The domain `all` keeps both. The order of the entries is kept.
 */
export function filterHumanViewerIndex(
  entries: readonly IHumanViewerIndexEntry[],
  filter: { text: string; domain: "all" | "face" | "body" | "person" },
): IHumanViewerIndexEntry[] {
  const words = filter.text.toLowerCase().split(/\s+/).filter((word) => word !== "");
  return entries.filter((entry) => {
    if (filter.domain !== "all" && entry.domain !== filter.domain) return false;
    const haystack = `${entry.label} ${entry.id} ${entry.section}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
