import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieConstructionNode } from "./AutoMovieConstructionNode";

/**
 * A through-cut in one face of a solid: an opening (an eye fissure, the oral fissure, a nostril, a vent) as a closed trim loop in the face's own chart, the face kept outside it.
 *
 * Nothing lies behind such a cut for a blend to reach, so it is not a diff. The margin's points are the landmarks' feet on the face, and the loop is the periodic cubic B-spline through the feet at uniform loop parameters, C2 in the chart and on the surface. A landmark without a foot, or a loop that crosses itself, is one diagnostic and the face stays closed.
 *
 * Engine admission: at least four landmarks in their order round the opening, one guess per landmark, all on one sheet of the face's periodic phase.
 *
 * @evidence contracts/development/design.md#principled-representation A trim as a curve in the surface's parameter domain keeps the opening watertight with its neighbours through shared parameter curves (Sederberg et al., Watertight trimmed NURBS, 2008), with no clip of a mesh by position.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A host subtree, a face name and the margin's landmarks are the whole record; lining and rim are further nodes joined to the face.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed margin leaves the face closed and reported, never an opening cut by position.
 * @evidence contracts/development/common.md#meaningful-documentation States the cut's nature, the loop's construction, its failure effect and the admission rules.
 */
export interface IAutoMovieConstructionTrim {
  /** Discriminator. */
  type: "trim";

  /** The opening's name, unique in its tree, named in diagnostics. */
  name: string;

  /** The solid the opening is cut in. */
  host: AutoMovieConstructionNode;

  /** The face the margin lies on: a view part's or a join's name in the host's subtree. */
  face: string;

  /** The margin's landmarks in their order round the opening, metres in the construction's frame, at least four. */
  landmarks: IAutoMovieVector3[];

  /** Each landmark's guessed chart point `[station, phase]` on the face, metres and radians, one per landmark. */
  guesses: [number, number][];
}
