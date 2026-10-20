/**
 * Pointwise qualification against every actual retained registered measurement.
 *
 * @evidence contracts/common.md#principled-implementation Depth, Euclidean pixels and strongest actual acute ray support are separate conditional geometry diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design One named result serves initial triangulation and final joint qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It supplies no missing observation, metric scale or material truth.
 * @evidence contracts/common.md#meaningful-documentation Null members mean unresolved geometry rather than zero error or infinite confidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This owned diagnostic performs no fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain scalar/reason data acquires no resource.
 */
export interface IAutoMovieRecoveryScenePointEvaluation {
  /** True only if every required pointwise gate passed. */
  accepted: boolean;

  /** Every observed failed gate. */
  reasons: string[];

  /** Largest pixel distance, null if a retained projection was unavailable. */
  maximumReprojectionPx: number | null;

  /** Smallest resolved positive camera depth, null if none resolved. */
  minimumDepth: number | null;

  /** Retained source pair giving the strongest acute angle, null without two rays. */
  supportingViews: [number, number] | null;

  /** Strongest actual acute angle in degrees, null if unresolved. */
  acuteParallaxDegrees: number | null;
}
