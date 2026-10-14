/**
 * Recognize exact nonempty observation text without resolving its descriptive address or checking credential contents.
 *
 * @evidence contracts/common.md#principled-implementation Runtime string admission followed by nonempty and exact trim equality preserves the authored metadata spelling.
 * @evidence contracts/common.md#clear-and-simple-design Baseline, member and observation owners share one scalar text boundary while document/artifact readers own locator safety.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coercion, normalization or credential/path certificate is inferred from a nonblank string.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes exact text from resolved or safe descriptive addresses.
 * @evidence contracts/performance.md#efficient-algorithms Two trims scan L characters with possible temporary strings and no metadata array traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This value predicate owns no repeated observation work coordinator or text cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trim values expire and input text is not retained; no document or playback handle is acquired.
 */
export const productionRepaintObservationIsExactText: (value: string) => boolean = (value: string): boolean =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value === value.trim();
