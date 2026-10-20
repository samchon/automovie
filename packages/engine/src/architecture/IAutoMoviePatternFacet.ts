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
 * pattern does not declare or a zone another facet already names, and accepts
 * a declared zone that laid no piece; zones without a facet stay on the call's
 * main frame.
 *
 * @evidence contracts/common.md#principled-implementation Unrolls a folded or curved host into one developed plane and returns each zone's strip onto its own flat panel by translating from `anchor`, so distances measured on the surface stay true.
 * @evidence contracts/common.md#clear-and-simple-design A zone, an anchor and a frame are all a fold needs; a piece crossing a fold is two zones, so no per-piece panel assignment is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No piece is split or bent at a fold here; a crossing piece must be authored as two zones, and a duplicated or undeclared zone is refused rather than resolved by precedence.
 * @evidence contracts/common.md#meaningful-documentation States why patterns are laid on a developed plane, the anchor's role, why a module belongs to one panel, the landing formula, and each refusal and the default frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; each facet is resolved once and looked up per occurrence by zone, answered on `autoMoviePatternInstanceTransforms`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A facet's resolved basis is shared by every occurrence of its zone within one call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned; the instancer holds its resolved facets in a map only during the call.
 */
export interface IAutoMoviePatternFacet {
  /** Zone whose pieces sit on this panel. */
  zone: string;

  /** Face-local metre point this panel's frame origin sits at. */
  anchor: IAutoMoviePatternPoint;

  /** World placement of that point. */
  frame: IAutoMoviePatternFaceFrame;
}
