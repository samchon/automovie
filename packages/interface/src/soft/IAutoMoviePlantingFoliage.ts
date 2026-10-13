import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The leaf rule.
 *
 * Leaves are emitted as full-TRS instance occurrences; translation, unit quaternion and per-axis scale; because that is exactly what GPU instancing consumes without loss. A leaf is never a degraded yaw or a uniform scale.
 *
 * @evidence contracts/common.md#principled-implementation Bearing branch length and positive density determine leaf count above minLevel, with seeded scale and roll perturbations yielding unit-quaternion full-TRS occurrences.
 * @evidence contracts/common.md#clear-and-simple-design The foliage law stays separate from branch recursion and material binding so one recipe can become bare without another growth implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive size and jitter below one preserve non-collapsed leaves; output retains every local axis instead of substituting uniform scale or yaw-only orientation.
 * @evidence contracts/common.md#meaningful-documentation Defines leaves-per-meter density, minimum bearing level, local-meter prototype size and bounded seeded jitter.
 * @author Samchon
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

  /** Seeded relative perturbation of leaf size, in `[0, 1)`. */
  scaleJitter: number;

  /**
   * Seeded roll about the bearing branch, in `[0, 1]`. `0` leaves every blade in the branch's own frame; `1` spins each one anywhere around it.
   */
  rollJitter: number;
}
