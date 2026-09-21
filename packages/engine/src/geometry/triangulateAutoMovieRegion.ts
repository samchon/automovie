import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { triangulateRegion } from "./triangulateRegion";

/**
 * Triangulate a free-form planar region: one arbitrary ring less its holes.
 *
 * This is the kernel's escape from convexity. A convex hull is the wrong answer
 * for an L-shaped section, a channel, a cornice, or a tube, because the hull
 * covers ground the region does not; [extrudeAutoMovieProfile](./proceduralConvexProfile.ts) refuses a
 * concave contour rather than quietly filling it in, and this is what the
 * refusal points at. The contour is taken as authored, each hole is bridged
 * into it, and the result is ear-clipped, so the triangles cover exactly the
 * enclosed area and nothing else.
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
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Refuses malformed planar topology before producing triangles.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Implements the shared numeric and topology validation contract for free-form regions.
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Preserves each authored boundary identity through winding normalization.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Returns the original-input permutation beside unchanged canonical coordinates and triangles.
 */
export const triangulateAutoMovieRegion = (props: {
  outer: readonly IAutoMovieProfilePoint[];
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}): IAutoMovieRegionTriangulation =>
  triangulateRegion(props.outer, props.holes ?? [], "polygon");
