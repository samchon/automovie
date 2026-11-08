import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstructionAxisKnot } from "./IAutoMovieConstructionAxisKnot";

/**
 * A curved axis: the natural cubic spline of its knots' points in station, each section plane square to the course's tangent, its chart axes carried from the first knot by minimal rotation.
 *
 * Engine admission: at least two knots by strictly increasing station; `u` not along the course's tangent at the first knot; `step` positive.
 *
 * @evidence contracts/development/design.md#principled-representation Minimal rotation by double reflection (Wang, Juttler, Zheng and Liu, ACM TOG 27(1), 2008), fourth order in its step, gives the section axes without twist about the course.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The course's knots, the first axis and the step are all the frame needs; the second axis follows from the first and the tangent.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `u`'s part along the tangent is removed, `u` otherwise kept as given; beyond its end knots the course continues as its straight end tangent.
 * @evidence contracts/development/common.md#meaningful-documentation States the course's interpolant, the planes, the carried axes, the extension past the knots and the admission rules.
 */
export interface IAutoMovieConstructionCurvedAxis {
  /** Discriminator. */
  type: "curved";

  /** The course's knots, at least two, by strictly increasing station. */
  knots: IAutoMovieConstructionAxisKnot[];

  /** The chart's first axis at the first knot; its part along the course's tangent is removed. */
  u: IAutoMovieVector3;

  /** Largest station step of the double reflection, metres, positive. */
  step: number;
}
