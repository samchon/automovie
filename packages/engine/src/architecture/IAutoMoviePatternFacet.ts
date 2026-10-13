import { IAutoMoviePatternFaceFrame } from "./IAutoMoviePatternFaceFrame";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One flat panel of a host that folds or curves, and the strip of the face it
 * carries.
 *
 * A pattern is laid on one plane because a joint, a cut piece, and a take-off
 * are all measured on the surface rather than in the air above it. A wall that
 * turns a corner and a facade that curves are still one surface, and unrolling
 * them is what keeps them one: the face-local plane is the developed surface,
 * distance along U is distance along the building past the corner, and each
 * zone then says which flat panel of the real host its own strip went back
 * onto.
 *
 * {@link anchor} is the developed point {@link frame}'s origin sits at, so a zone
 * starting three metres along the developed face returns to the return wall's
 * own origin rather than three metres past it. Without it a fold would turn the
 * panel and still leave the pieces where the flat face had put them.
 *
 * A module is a rigid piece, so it belongs to exactly one panel. A piece
 * crossing a fold is authored as two zones meeting at that fold, which is what
 * the two pieces really are: the border cut already butts them on the surface,
 * and the neighbour scan already measures across it.
 *
 * An occurrence centre `c` of the facet's zone lands at
 * `frame.origin + U·(c.u - anchor.u) + V·(c.v - anchor.v)`.
 * `autoMoviePatternInstanceTransforms` throws when a facet names a zone the
 * pattern did not lay or a zone another facet already names; zones without a
 * facet stay on the call's main frame.
 *
 * @evidence contracts/common.md#principled-implementation Re-bases one zone's developed coordinates onto a flat panel by subtracting the anchor and applying the panel frame, which is the unrolling of a folded or curved host read backwards.
 * @evidence contracts/common.md#clear-and-simple-design Keyed by zone, so a fold is authored as a zone border and no per-piece panel assignment exists; unnamed zones fall back to the one main frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine never splits a piece across a fold or guesses its panel; an unknown or repeated zone throws instead of being ignored.
 * @evidence contracts/common.md#meaningful-documentation States the developed-surface model, the anchor's role, the placement formula, the one-panel-per-piece rule, and the refusals.
 * @evidenceExclude contracts/performance.md#cost-and-resources A small record resolved into a zone-keyed map once per instancing call and looked up per occurrence; that map is discarded when the call returns.
 * @author Samchon
 */
export interface IAutoMoviePatternFacet {
  /** Zone whose pieces sit on this panel. */
  zone: string;

  /** Face-local metre point this panel's frame origin sits at. */
  anchor: IAutoMoviePatternPoint;

  /** World placement of that point. */
  frame: IAutoMoviePatternFaceFrame;
}
