import { pointInPolygon } from "../architecture/pointInPolygon";
import { closestPointOnSegmentXZ } from "../math/closestPointOnSegmentXZ";
import { AutoMovieRingPlacement } from "./AutoMovieRingPlacement";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
import { FOOTPRINT_EPSILON } from "./constants/FOOTPRINT_EPSILON";
import { IAutoMovieVector3 } from "@automovie/interface";
/**
 * Classify an XZ query against an authored ring with an explicit rim result.
 *
 * @evidence contracts/common.md#principled-implementation A nearest-segment distance of at most 1e-9 metres answers boundary before the shared parity predicate; that predicate also has scale-relative edge tolerance, so inside is not an exact-real classification for every finite coordinate.
 * @evidence contracts/common.md#clear-and-simple-design Ring classification owns the three outcomes while polygon parity and segment projection retain their canonical numerical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fewer than three points answer outside; other malformed or numerically unrepresentable inputs are not repaired and can fail in the segment owner.
 * @evidence contracts/common.md#meaningful-documentation Documents horizontal coordinates, rim precedence, short-ring behavior and the distinct fixed-rim and parity tolerances.
 * @evidence contracts/performance.md#efficient-algorithms E edges take O(E) worst-case distance and parity work with constant live query storage; rim discovery short-circuits.
 * @evidence contracts/performance.md#reuse-equivalent-work The ring's prepared plan is reused, while the query's projections are calculated afresh; no mutable geometry result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned literal escapes; the borrowed ring and call-local probe acquire no retained host resources.
 * @author Samchon
 */
export const footprintRingPlacement: (ring: IAutoMovieFootprintRing, x: number, z: number) => AutoMovieRingPlacement = (
  ring: IAutoMovieFootprintRing,
  x: number,
  z: number,
): AutoMovieRingPlacement => {
  if (ring.points.length < 3) return "outside";
  const probe: { x: number; y: number; z: number; } = { x, y: 0, z };
  for (let index: number = 0; index < ring.points.length; ++index) {
    const near: IAutoMovieVector3 = closestPointOnSegmentXZ(
      probe,
      ring.points[index]!,
      ring.points[(index + 1) % ring.points.length]!,
    );
    if (Math.hypot(x - near.x, z - near.z) <= FOOTPRINT_EPSILON)
      return "boundary";
  }
  return pointInPolygon({ x, y: z }, ring.plan) ? "inside" : "outside";
};
