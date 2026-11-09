/**
 * Which way a declared target is satisfied.
 *
 * `at-least` is met by a value at or above the target and `at-most` by a value
 * at or below it. Both bounds are inclusive, so a value equal to the target
 * meets either direction.
 *
 * @evidence contracts/development/design.md#principled-representation A two-member closed union for an inclusive bound direction; the engine's `autoMovieAnalysisTargetMet` judges `value >= target` for `at-least` and `value <= target` otherwise, for both the metric builder and the run validator, so equality meets both.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two one-sided directions; a target list holds one target per metric key, so a two-sided band on one metric is not expressible, and no range member exists without a consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tolerance or epsilon is folded into the comparison, and `assertAutoMovieAnalysisTargets` refuses any other string before a solver runs.
 * @evidence contracts/development/common.md#meaningful-documentation Gives what each direction accepts and that both bounds are inclusive, which decides the verdict at exact equality.
 */
export type AutoMovieAnalysisComparison = "at-least" | "at-most";
