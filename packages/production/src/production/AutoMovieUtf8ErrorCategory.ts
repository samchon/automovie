/**
 * Stable categories emitted by strict scalar-byte validation and leading-BOM refusal.
 *
 * @evidence contracts/common.md#principled-implementation A closed union retains existing leader, continuation, truncation, overlong, surrogate, range and BOM categories; the validator supplies the exact observed category.
 * @evidence contracts/common.md#clear-and-simple-design The Error and scalar validator share one category contract while byte offsets remain a separate diagnostic field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Category equality supplies no repaired text or fallback decoding; consumers must handle the original refusal.
 * @evidence contracts/common.md#meaningful-documentation Names scalar encoding categories and the distinct policy refusal for an initial BOM.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union erases; validation scans and Error construction remain their owners' costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A repeated category is not a cached validation answer over later bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no resource; the retaining Error/caller owns diagnostic strings.
 *
 * @author Samchon
 */
export type AutoMovieUtf8ErrorCategory =
  | "isolated-continuation"
  | "invalid-leader"
  | "invalid-continuation"
  | "truncated-sequence"
  | "overlong-sequence"
  | "surrogate-scalar"
  | "out-of-range-scalar"
  | "unexpected-bom";
