/**
 * A declared scalar range on a source outline's closed knot span, in the
 * outline value's units.
 *
 * The engine retains the natural knot jets whenever their quintic Bezier
 * controls meet the range. Otherwise it contracts each unauthored knot jet
 * along its natural jet ray by the largest linear-constraint factor in [0,1],
 * with at most 64 adjacent smaller binary64 factors to make the actual rounded
 * controls admissible; failure remains explicit. A zero factor flattens that
 * knot's first and second derivatives; this is an explicit range-filter
 * convention. Shared first/second jets keep C2 continuity and the Bezier
 * convex-hull property bounds the whole span. This is a sufficient control-hull
 * constraint, not a claim to minimize a global fairing energy. An authored knot
 * jet, including its natural component when the other is null, is retained or
 * refused explicitly. Refusal of its hull does not prove that its actual curve
 * exceeds the range. An open end's jet extension is outside this declared
 * knot-span guarantee.
 */
export interface IAutoMovieConstructionOutlineRange {
  /** Lower scalar bound, inclusive; null means no lower bound. */
  minimum: number | null;

  /** Upper scalar bound, inclusive; null means no upper bound. */
  maximum: number | null;
}
