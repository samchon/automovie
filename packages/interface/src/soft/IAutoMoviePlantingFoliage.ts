import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The leaf rule.
 *
 * Leaves retain translation, quaternion rotation and independent axis scale as full TRS occurrences. The recipe does not replace that representation with yaw-only or uniform scale; downstream Float32 and GPU conversion still has its own precision limits.
 *
 * @evidence contracts/common.md#principled-implementation Bearing branch length and positive density determine leaf count above minLevel, with seeded scale and roll perturbations yielding unit-quaternion full-TRS occurrences.
 * @evidence contracts/common.md#clear-and-simple-design The foliage law stays separate from branch recursion and material binding so one recipe can become bare without another growth implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive size and jitter below one target positive scales in representable arithmetic; very small products can underflow without a generated-scale gate. Output retains every local axis instead of substituting uniform scale or yaw-only orientation, while the viewer's planar XY leaf card has no thickness from local Z scale.
 * @evidence contracts/common.md#meaningful-documentation Defines leaves-per-meter density, minimum bearing level, local-meter prototype size and bounded seeded jitter.
 */
export interface IAutoMoviePlantingFoliage {
  /** Leaves per metre of bearing branch; strictly positive. */
  density: number;

  /** Lowest branch level that bears leaves; an integer `>= 0`. */
  minLevel: number;

  /**
   * Prototype leaf size in metres on each local axis; each strictly positive.
   */
  size: IAutoMovieVector3;

  /** Seeded relative size perturbation in `[0, 1)`; one factor multiplies all three prototype axes, preserving their proportions in representable arithmetic. */
  scaleJitter: number;

  /**
   * Seeded roll about the bearing branch, in `[0, 1]`. `0` leaves every blade in the branch's own frame; `1` allows a complete turn. Rational-circle samples are blended toward identity by normalized quaternion interpolation; the angular distribution is not uniform.
   */
  rollJitter: number;
}
