/**
 * A declared scalar range on a source outline's closed knot span, in the outline value's units.
 *
 * The engine retains the natural knot jets whenever their quintic Bezier controls meet the range. Otherwise it contracts each unauthored knot jet along its natural jet ray by the largest linear-constraint factor in [0,1], with at most 64 adjacent smaller binary64 factors to make the actual rounded controls admissible; failure remains explicit. A zero factor flattens that knot's first and second derivatives; this is an explicit range-filter convention. Shared first/second jets keep C2 continuity and the Bezier convex-hull property bounds the whole span. This is a sufficient control-hull constraint, not a claim to minimize a global fairing energy. An authored knot jet, including its natural component when the other is null, is retained or refused explicitly. Refusal of its hull does not prove that its actual curve exceeds the range. An open end's jet extension is outside this declared knot-span guarantee.
 *
 * @evidence contracts/development/design.md#principled-representation Each control is knotValue+lambda*jetDisplacement, so interval bounds give scalar linear constraints. Their largest computed factor, followed only by the documented bounded inward binary64 adjustment, retains that natural jet ray; admitted control-hull containment bounds the mathematical quintic.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two nullable bounds constrain only the actual authored scalar range; no automatic monotonicity or world-frame half-space interpretation is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Out-of-range knots and conflicting authored jets are refused, never clamped; a local scalar bound is not presented as a world half-space bound on a moving frame.
 * @evidence contracts/development/common.md#meaningful-documentation States scope, units, null bounds, exact filtering objective, C2 guarantee and extension/world-space limits.
 */
export interface IAutoMovieConstructionOutlineRange {
  /** Lower scalar bound, inclusive; null means no lower bound. */
  minimum: number | null;

  /** Upper scalar bound, inclusive; null means no upper bound. */
  maximum: number | null;
}
