/**
 * Pointwise qualification against every actual retained registered measurement.
 *
 * @evidence contracts/development/design.md#principled-representation Depth, Euclidean pixels and strongest actual acute ray support are separate conditional geometry diagnostics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named result serves initial triangulation and final joint qualification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It supplies no missing observation, metric scale or material truth.
 * @evidence contracts/development/common.md#meaningful-documentation Null members mean unresolved geometry rather than zero error or infinite confidence.
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
