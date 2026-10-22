/**
 * Canonicalize a `curves` URL value: comma-separated curve id patterns with `*` globs.
 *
 * A curve id is a construction part id without its `human.construction.`
 * prefix: `<chain>/<layer index>` for a principal section (`trunk/7`) or
 * `<chain>/axis` for a chain axis (`arm.left.1.0/axis`). Chain names contain
 * dots, so only the last `/` separates the layer. A pattern uses the same
 * characters plus `*`, which matches any run of characters including `.` and
 * `/`. Patterns are trimmed, deduplicated and sorted, so every spelling of the
 * same selection yields one value; the PNG cache, the archive lookup and the
 * page all compare this canonical value. Matching against a model's actual
 * curves happens in the page, where an unmatched pattern fails explicitly.
 *
 * @param value Raw `curves` value; null or empty means no selection.
 * @returns The canonical comma list, empty for no selection; malformed patterns throw.
 *
 * @evidence contracts/common.md#principled-implementation Splits on commas, trims, deduplicates with a Set and sorts in code-unit order, then validates each pattern against the curve id grammar plus `*`, so equal selections compare equal as strings.
 * @evidence contracts/common.md#clear-and-simple-design One pure function shared by the HTTP plugin, archive lookup, session identity and page; matching against a model stays with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed patterns throw rather than being dropped, and no chain name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the id grammar, glob meaning, canonical form and where unmatched patterns fail.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) in the at most 64 patterns of at most 96 characters each.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical value is what lets the frame cache and archive reuse a capture across spellings of one selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the 64-pattern and 96-character caps bound the work per call.
 */
export function normalizeHumanCurves(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const patterns: string[] = [
    ...new Set(
      value
        .split(",")
        .map((pattern: string): string => pattern.trim())
        .filter((pattern: string): boolean => pattern.length !== 0),
    ),
  ].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  if (patterns.length > 64)
    throw new Error("Human curves selection exceeds 64 patterns");
  for (const pattern of patterns)
    if (!/^[A-Za-z0-9._*-]+(?:\/[A-Za-z0-9_*-]+)?$/.test(pattern) || pattern.length > 96)
      throw new Error("Malformed Human curve pattern: " + pattern);
  return patterns.join(",");
}
