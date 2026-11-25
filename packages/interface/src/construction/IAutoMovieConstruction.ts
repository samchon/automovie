import type { IAutoMovieConstructionFill } from "./IAutoMovieConstructionFill";
import type { IAutoMovieConstructionNode } from "./IAutoMovieConstructionNode";

/**
 * A solid built by construction: parts drawn from their orthographic views,
 * joined into groups by merges and cut by diffs and trims, recursively, down to
 * the smallest part a form needs (a figure's trunk, limbs, digits, nose and
 * lids; a vase's body, handle and spout).
 *
 * The tree is the recipe; the engine realizes it into lofted section chains,
 * blends and one tessellated skin that shares every boundary between its faces.
 * Every view part's, join's, continuation's and trim's name is unique in the
 * tree, since seeds and trims name faces by them. Every length is in metres in
 * the construction's own frame, every angle in radians.
 */
export interface IAutoMovieConstruction {
  /** Name in diagnostics, such as `figure` or `vase`. */
  name: string;

  /** The whole solid: one node whose children are its parts and groups. */
  root: IAutoMovieConstructionNode;

  /**
   * Discs of the realized skin faired into G1 patches once it is drawn
   * (`IAutoMovieConstructionFill`); absent, none.
   */
  fills?: IAutoMovieConstructionFill[];
}
