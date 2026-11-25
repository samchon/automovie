import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The leaf rule.
 *
 * Leaves retain translation, quaternion rotation and independent axis scale as
 * full TRS occurrences. The recipe does not replace that representation with
 * yaw-only or uniform scale; downstream Float32 and GPU conversion still has
 * its own precision limits.
 */
export interface IAutoMoviePlantingFoliage {
  /** Leaves per metre of bearing branch; strictly positive. */
  density: number;

  /** Lowest branch level that bears leaves; an integer `>= 0`. */
  minLevel: number;

  /** Prototype leaf size in metres on each local axis; each strictly positive. */
  size: IAutoMovieVector3;

  /**
   * Seeded relative size perturbation in `[0, 1)`; one factor multiplies all
   * three prototype axes, preserving their proportions in representable
   * arithmetic.
   */
  scaleJitter: number;

  /**
   * Seeded roll about the bearing branch, in `[0, 1]`. `0` leaves every blade
   * in the branch's own frame; `1` allows a complete turn. Rational-circle
   * samples are blended toward identity by normalized quaternion interpolation;
   * the angular distribution is not uniform.
   */
  rollJitter: number;
}
