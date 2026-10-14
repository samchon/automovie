import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { triangulateRegion } from "./triangulateRegion";

/**
 * Triangulate a free-form planar region: one arbitrary ring less its holes.
 *
 * This is the kernel's escape from convexity. A convex hull is the wrong answer
 * for an L-shaped section, a channel, a cornice, or a tube, because the hull
 * covers ground the region does not; {@link extrudeAutoMovieProfile} refuses a
 * concave contour rather than quietly filling it in, and this is what the
 * refusal points at. The contour is taken as authored, each hole is bridged
 * into it, and the result is ear-clipped, so the triangles cover exactly the
 * enclosed area and nothing else. Coordinates are metres in the region's own
 * `x, y` plane.
 *
 * Rings are refused rather than repaired: fewer than three points, a non-finite
 * coordinate, a point repeated beside itself, a spike that doubles back along
 * its own edge, a ring enclosing no area, and a ring crossing itself each raise
 * their own diagnostic. Two rings may not touch or cross either, and a hole
 * must lie strictly inside the outer ring and outside every other hole. A hole
 * that does not is not a void this kernel guesses at; it is a region the author
 * has not described.
 *
 * Winding is canonicalized rather than demanded: the outer ring comes back
 * counter-clockwise and every hole clockwise, whichever way each was authored,
 * because which ring bounds the region and which is a void is settled by
 * containment and not by the order the points were typed in. The emitted
 * triangles are counter-clockwise, so the region faces +Z.
 * `sourceIndices` retains every canonical point's index in the original outer
 * then hole population. Winding changes ordering, never point identity.
 *
 * @param props.outer Outer boundary in any winding.
 * @param props.holes Voids inside the outer boundary; omitted means none.
 * @returns A new triangulation whose points are copies of the input.
 * @throws Error with the first ring diagnostic named `polygon`, or when floating-point search finds no hole bridge or ear.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to `triangulateRegion`, which validates and canonically winds the rings in `canonicalRegion` and then bridges holes and ear-clips in `trianglesOf`; ear clipping a bridged simple ring covers exactly its interior with its own vertices, and the only premise left to rounding is that the bridge and ear searches succeed, which they refuse rather than assume.
 * @evidence contracts/common.md#clear-and-simple-design The public entry for authors and the portrait oral and skin builders, fixing the diagnostic label to `polygon` and defaulting holes, while `triangulateRegion` stays the labelled internal form extrusion uses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid rings are refused with their own diagnostic and never hulled, merged or reordered beyond a winding reversal.
 * @evidence contracts/common.md#meaningful-documentation States why it exists beside the convex builders, the unit and plane, every refusal, the winding rule and its reason, the face direction and what `sourceIndices` preserves.
 * @evidence contracts/performance.md#efficient-algorithms Adds constant work to `triangulateRegion`, whose O(N^2) validation and O(N^3) worst-case ear clipping over N points are answered on `autoMoviePlanarRegionFailure` and `trianglesOf`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of the rings passed in; each caller triangulates one region per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned record owns copies of every point and arrays linear in the point count.
 */
export const triangulateAutoMovieRegion: (props: {
  outer: readonly IAutoMovieProfilePoint[];
  holes?: readonly (readonly IAutoMovieProfilePoint[])[] | undefined;
}) => IAutoMovieRegionTriangulation = (props: {
  outer: readonly IAutoMovieProfilePoint[];
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}): IAutoMovieRegionTriangulation =>
  triangulateRegion(props.outer, props.holes ?? [], "polygon");
