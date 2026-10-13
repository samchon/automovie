/**
 * Which way a declared target is satisfied.
 *
 * `at-least` is met by a value at or above the target and `at-most` by a value
 * at or below it. Both bounds are inclusive, so a value equal to the target
 * meets either direction.
 *
 * @evidence contracts/common.md#principled-implementation A two-literal union names the direction of an inclusive threshold; the engine's metric builder and run validator both evaluate it as `value >= target` or `value <= target`, so equality satisfies either direction.
 * @evidence contracts/common.md#clear-and-simple-design Only the two directions one numeric threshold can take are named, with no band or tolerance option; the inclusive comparison itself is written twice, as a private `satisfied` helper in `autoMovieAnalysisMetric` and another in `validateAutoMovieAnalysisRun`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No metric key or unit selects a direction specially; the two `satisfied` copies are duplication rather than compensation and must be edited together, which is a defect outside this declaration.
 * @evidence contracts/common.md#meaningful-documentation States what each direction accepts and that a value equal to the target meets both, which a reader would otherwise have to find in the engine arithmetic.
 */
export type AutoMovieAnalysisComparison = "at-least" | "at-most";
