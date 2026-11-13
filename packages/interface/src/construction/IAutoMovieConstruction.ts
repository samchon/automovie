import type { AutoMovieConstructionNode } from "./AutoMovieConstructionNode";
import type { IAutoMovieConstructionFill } from "./IAutoMovieConstructionFill";

/**
 * A solid built by construction: parts drawn from their orthographic views, joined into groups by merges and cut by diffs and trims, recursively, down to the smallest part a form needs (a figure's trunk, limbs, digits, nose and lids; a vase's body, handle and spout).
 *
 * The tree is the recipe; the engine realizes it into lofted section chains, blends and one tessellated skin that shares every boundary between its faces. Every view part's, join's, continuation's and trim's name is unique in the tree, since seeds and trims name faces by them. Every length is in metres in the construction's own frame, every angle in radians.
 *
 * @evidence contracts/development/design.md#principled-representation Three operators applied recursively build every solid the tree can name: a part lofted from its own view outlines in its own frame, the merge of two solids along their intersection curve with a G2 blend, and the diff that cuts one from another; a trim opens a through-cut in a surface. No mesh, ray or distance field enters the recipe.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One root over one closed node union carries every case, nesting to any depth, so a part, its features and their groups share one representation instead of per-form construction kits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record declares geometry only; it names no person, specimen or fitted coefficient, and every value it holds is an input the author states.
 * @evidence contracts/development/common.md#meaningful-documentation States the three operators and the trim, the recursion, what the engine realizes from it, and the metre and radian units.
 */
export interface IAutoMovieConstruction {
  /** Name in diagnostics, such as `figure` or `vase`. */
  name: string;

  /** The whole solid: one node whose children are its parts and groups. */
  root: AutoMovieConstructionNode;

  /** Discs of the realized skin faired into G1 patches once it is drawn (`IAutoMovieConstructionFill`); absent, none. */
  fills?: IAutoMovieConstructionFill[];
}
