/**
 * Outcome of one render-cost metric against its explicitly declared budget, or its analysis gap.
 *
 * @evidence contracts/common.md#principled-implementation Budget evaluation classifies measured totals at or below a declared limit as within, above as over, no declared limit as unbudgeted, and preserves unsupported or not-run inventory gaps.
 * @evidence contracts/common.md#clear-and-simple-design A five-state vocabulary exposes measurement, budget ownership and capability completeness separately rather than reducing every result to pass/fail.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unbudgeted is no agreed threshold, not passing clearance; absent analysis remains a gap and cannot become a successful zero-cost finding.
 * @evidence contracts/common.md#meaningful-documentation Defines inclusive budget outcomes, measured-without-limit and the two explicit analysis-gap states.
 */
export type AutoMovieRenderFindingStatus =
  | "within"
  | "over"
  | "unbudgeted"
  | "unsupported"
  | "not-run";
