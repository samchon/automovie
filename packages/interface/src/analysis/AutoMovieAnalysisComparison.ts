/**
 * Which way a declared target is satisfied.
 *
 * `at-least` is met by a value at or above the target and `at-most` by a value
 * at or below it. Both bounds are inclusive, so a value equal to the target
 * meets either direction.
 */
export type AutoMovieAnalysisComparison = "at-least" | "at-most";
