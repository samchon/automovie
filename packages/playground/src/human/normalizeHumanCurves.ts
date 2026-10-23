/**
 * Canonicalize a `curves` URL value: a comma list of curve id patterns.
 *
 * A curve id is a construction part id without its `human.construction.`
 * prefix: `<chain>/<layer index>` for a principal section (`trunk/7`) or
 * `<chain>/axis` for a chain axis (`finger.left.index/axis`). Chain names
 * contain dots, so only the last `/` separates the layer. A pattern uses the
 * same characters plus `*`, which matches any run of characters including `.`
 * and `/`. The 2D diagrams also accept `<chain>@<station mm>` and the series
 * `<chain>@<from>:<to>:<step>`; the 3D page has no part for those and fails
 * them as unmatched.
 *
 * Patterns are trimmed and deduplicated but keep their given order, because
 * the order assigns each selected curve its colour; the PNG cache, archive
 * lookup, receipts and page all use this canonical value. Matching against
 * actual curves happens where the model or calibration is, and an unmatched
 * pattern fails there.
 *
 * @param value Raw `curves` values: every repeated `curves=` key (`URLSearchParams.getAll`) in order, each possibly a comma list, or one string; null or empty means no selection.
 * @returns The canonical comma list, empty for no selection; malformed patterns throw. URLs write it back as repeated keys, see {@link normalizeHumanCurves.query}.
 *
 * @evidence contracts/common.md#principled-implementation Splits on commas, trims, deduplicates in first-occurrence order, then validates each pattern against the id grammar with globs, stations and station series.
 * @evidence contracts/common.md#clear-and-simple-design One pure function shared by the HTTP plugin, archive lookup, session identity, worker and page; matching stays with the model or calibration owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed patterns throw rather than being dropped, and no chain name is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the id grammar, glob meaning, why order is kept and where unmatched patterns fail.
 * @evidence contracts/performance.md#efficient-algorithms O(n) in the at most 64 patterns of at most 96 characters each.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical value lets the frame cache and archive reuse a capture across spellings of one selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the 64-pattern and 96-character caps bound the work per call.
 */
export function normalizeHumanCurves(
  value: string | readonly string[] | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const patterns: string[] = [
    ...new Set(
      (typeof value === "string" ? [value] : value)
        .flatMap((entry: string): string[] => entry.split(","))
        .map((pattern: string): string => pattern.trim())
        .filter((pattern: string): boolean => pattern.length !== 0),
    ),
  ];
  if (patterns.length > 64)
    throw new Error("Human curves selection exceeds 64 patterns");

  // `<chain>/<k|axis>` with globs, or `<chain>@<s>` and `<chain>@<a>:<b>:<step>`.
  const number: string = "-?\\d+(?:\\.\\d+)?";
  const grammar: RegExp = new RegExp(
    `^[A-Za-z0-9._*-]+(?:\\/[A-Za-z0-9_*-]+|@${number}(?::${number}:\\d+(?:\\.\\d+)?)?)?$`,
  );
  for (const pattern of patterns)
    if (!grammar.test(pattern) || pattern.length > 96)
      throw new Error("Malformed Human curve pattern: " + pattern);
  return patterns.join(",");
}

/**
 * Query form of a canonical selection.
 *
 * @evidence contracts/common.md#principled-implementation Repeated keys are the WHATWG form encoding and the OpenAPI `style=form, explode=true` default for arrays.
 * @evidence contracts/common.md#clear-and-simple-design Pairs the canonical value with its single URL spelling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Writes only the canonical list, never the raw input.
 * @evidence contracts/common.md#meaningful-documentation States the encoding standard.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the list.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared by page links, receipts and headers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace normalizeHumanCurves {
  /**
   * Write a canonical selection as repeated `curves=` keys, the form page addresses, copied PNG URLs, receipts and headers use.
   *
   * @param canonical Value returned by {@link normalizeHumanCurves}.
   * @returns `curves=a&curves=b`, URL-encoded, or empty.
   */
  export function query(canonical: string): string {
    if (canonical === "") return "";

    // `/`, `@`, `:` and `*` are legal query characters (RFC 3986), so ids stay readable.
    return canonical
      .split(",")
      .map(
        (pattern: string): string =>
          "curves=" +
          encodeURIComponent(pattern).replace(
            /%2F|%40|%3A|%2A/gi,
            (escaped: string): string => decodeURIComponent(escaped),
          ),
      )
      .join("&");
  }
}
