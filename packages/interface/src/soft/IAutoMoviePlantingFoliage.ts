import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The leaf rule.
 *
 * Leaves are emitted as full-TRS instance occurrences — translation, unit
 * quaternion and per-axis scale — because that is exactly what GPU instancing
 * consumes without loss. A leaf is never a degraded yaw or a uniform scale.
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
   * Seeded roll about the bearing branch, in `[0, 1]`. `0` leaves every blade
   * in the branch's own frame; `1` spins each one anywhere around it.
   */
  rollJitter: number;
}
