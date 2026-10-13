/**
 * Stable generated free-shaft identity of one side and lid row. Emission and final-output readers share this owner; the person assembly supplies its face prefix independently from source-card names.
 *
 * @evidence contracts/common.md#principled-implementation Closed side and row choices form a stable generated free-shaft identity.
 * @evidence contracts/common.md#clear-and-simple-design Emission and final-output reading share the same suffix while person assembly owns its independent face prefix.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper neither infers source-card identity nor accepts a biological population claim.
 * @evidence contracts/common.md#meaningful-documentation The exact identity is lashes:side:row for generated geometry ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two constant-domain strings concatenate in fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work One identity owner prevents duplicated emission/inspection spellings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string escapes and no source or renderer handle is retained.
 */
export function humanFaceLashPartId(
  side: "left" | "right",
  row: "upper" | "lower",
): string {
  return "lashes:" + side + ":" + row;
}
