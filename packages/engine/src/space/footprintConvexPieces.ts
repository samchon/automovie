import { IAutoMovieVector3 } from "@automovie/interface";
import { autoMoviePlanarRegionFailure } from "../geometry/planarRegion";
import { convexHull2D } from "../math/convexHull2D";
import { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * The footprint as convex pieces whose union is exactly the region.
 *
 * Everything that has to sweep, clip or draw a footprint wants convex input:
 * lattice clipping is Sutherland–Hodgman, a fan is only a triangulation of a
 * convex ring, and a containment probe against a convex piece is four
 * comparisons. Handing those a hull was the original defect; handing them a
 * decomposition of the true region is the same code with the notch and the hole
 * still missing from it.
 *
 * A solid convex footprint is already one convex piece and comes back as its
 * own hull, which is both the minimal decomposition and byte-for-byte what this
 * region used to produce. Anything else is decomposed by a vertical slab sweep:
 * cut the plan at every vertex `x`, and inside each slab pair the ring
 * crossings by even-odd parity, so a hole is a pair of crossings that closes
 * the band rather than a case anybody has to name. A degenerate region yields
 * nothing.
 *
 * **A ring that crosses itself has no region, and this does not invent one.**
 * Both readings of such a footprint stay finite and deterministic — nothing
 * throws, nothing is `NaN` — but the pieces here and what
 * {@link footprintContains} answers need not describe the same shape, because
 * there is no shape for them to agree on. That is why `validateSpace` refuses a
 * self-crossing ring outright rather than leaving either reading to stand for
 * it.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `footprintConvexPieces` produces the footprint as convex pieces whose union is exactly the region. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `footprintConvexPieces` performs convex pieces footprint evaluation when the engine checks finite planar topology before consuming geometry.
 */
export const footprintConvexPieces = (
  footprint: IAutoMovieFootprint,
): IAutoMovieVector3[][] => {
  const failure = autoMoviePlanarRegionFailure({
    outer: footprint.outer.plan,
    holes: footprint.holes.map((hole) => hole.plan),
    label: "footprint",
  });
  if (failure !== null) return [];
  if (footprint.outer.doubleArea === 0) return [];
  if (footprint.holes.length === 0) {
    const hull = convexHull2D(footprint.outer.points);
    if (isConvexRing(footprint.outer, hull)) return [hull];
  }
  return slabPieces(footprint);
};
