import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstructionChartPoint } from "./IAutoMovieConstructionChartPoint";
import type { IAutoMovieConstructionNode } from "./IAutoMovieConstructionNode";

/**
 * A through-cut in one face of a solid: an opening (an eye fissure, the oral
 * fissure, a nostril, a vent) as a closed trim loop in the face's own chart,
 * the face kept outside it.
 *
 * Nothing lies behind such a cut for a blend to reach, so it is not a diff. The
 * margin's points are the landmarks' feet on the face, and the loop is the
 * periodic cubic B-spline through the feet at uniform loop parameters, C2 in
 * the chart and on the surface. A landmark without a foot, or a loop that
 * crosses itself, is one diagnostic and the face stays closed.
 *
 * Engine admission: at least four landmarks in their order round the opening,
 * one guess per landmark, all on one sheet of the face's periodic phase.
 */
export interface IAutoMovieConstructionTrim {
  /** Discriminator. */
  type: "trim";

  /** The opening's name, unique in its tree, named in diagnostics. */
  name: string;

  /** The solid the opening is cut in. */
  host: IAutoMovieConstructionNode;

  /**
   * The face the margin lies on: a view part's or a join's name in the host's
   * subtree.
   */
  face: string;

  /**
   * The margin's landmarks in their order round the opening, metres in the
   * construction's frame, at least four.
   */
  landmarks: IAutoMovieVector3[];

  /**
   * Each landmark's guessed chart point on the face, with station in metres
   * and phase in radians, one per landmark.
   */
  guesses: IAutoMovieConstructionChartPoint[];
}
