import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
import { footprintRingPlacement } from "./footprintRingPlacement";

/**
 * Is `(x, z)` on the surface the footprint describes?
 *
 * The region is closed: the outer rim and every hole rim belong to it, because
 * the slab physically reaches its own edge and a foot on the lip of an atrium
 * is standing on concrete. Only the open interior of a hole is off the
 * surface.
 *
 * A zero cached outer area covers nothing. Ring queries separately reject
 * fewer than three points; this function does not validate arbitrary topology
 * or catch the shared segment query's finite-arithmetic admission failures.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A point must be on/in the outer ring and outside every open hole interior; rim inclusion follows footprintRingPlacement's 1e-9 distance check and its fallback planar boundary/parity predicates, subject to their scale and binary64 limitations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Region composition stays separate from single-ring classification, so prepared ground and prop support queries share the same authored holes and concavity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hull fills a notch or void; zero outer area reads false and malformed topology is not silently repaired. Valid finite prepared rings and compatible finite query coordinates remain caller premises.
 * @evidence contracts/development/common.md#meaningful-documentation States outer/hole rim inclusion, open-hole exclusion, zero-area policy and propagated numeric admission failures; this query decides plan membership, not height or walkability.
 * @evidence contracts/development/implementation.md#efficient-algorithms E total vertices need O(E) worst-case edge work with constant extra live storage; outside outer or first containing hole short-circuits remaining ring queries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Ring projections and signed areas are prepared once and reused for repeated queries while authored points remain unchanged; no point-result cache is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The scalar result retains no geometry; probe/witness records belong only to the nested ring/segment calls and prepared input lifetime remains with its caller.
 */
export const footprintContains: (
  footprint: IAutoMovieFootprint,
  x: number,
  z: number,
) => boolean = (
  footprint: IAutoMovieFootprint,
  x: number,
  z: number,
): boolean => {
  if (footprint.outer.doubleArea === 0) return false;
  if (footprintRingPlacement(footprint.outer, x, z) === "outside") return false;
  return footprint.holes.every(
    (hole: IAutoMovieFootprintRing): boolean =>
      footprintRingPlacement(hole, x, z) !== "inside",
  );
};
