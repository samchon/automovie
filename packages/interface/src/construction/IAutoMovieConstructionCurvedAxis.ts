import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstructionAxisKnot } from "./IAutoMovieConstructionAxisKnot";

/**
 * A curved axis: the natural cubic spline of its knots' points in station, each
 * section plane square to the course's tangent, its chart axes carried from the
 * first knot by minimal rotation.
 *
 * Engine admission: at least two knots by strictly increasing station; `u` not
 * along the course's tangent at the first knot; `step` positive.
 */
export interface IAutoMovieConstructionCurvedAxis {
  /** Discriminator. */
  type: "curved";

  /** The course's knots, at least two, by strictly increasing station. */
  knots: IAutoMovieConstructionAxisKnot[];

  /**
   * The chart's first axis at the first knot; its part along the course's
   * tangent is removed.
   */
  u: IAutoMovieVector3;

  /** Largest station step of the double reflection, metres, positive. */
  step: number;
}
