import type { IHumanFaceContactHit } from "./IHumanFaceContactHit";

/**
 * The signed distance's gradient at a queried point, the direction along which
 * clearance grows at unit rate. On a face it is the face normal. At the
 * nearest point of an edge or vertex the gradient is the unit vector from that
 * point to the query, signed by the side, and the feature's pseudonormal only
 * orients the side: it departs from the gradient by the angle between them, so
 * moving along it gains clearance more slowly than its length. On the surface
 * itself no radial direction exists and the pseudonormal is the one-sided
 * limit.
 *
 * @evidence contracts/common.md#principled-implementation A native signed-query witness gives its face normal or signed nearest-feature radial direction; the pseudonormal orients the side but is not generally the distance gradient off an edge/vertex. Current contact callers supply the same query point and admitted finite witness.
 * @evidence contracts/common.md#clear-and-simple-design This small geometry adapter isolates the gradient used to form contact rows; query classification and actual post-move verification remain with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-distance/face cases intentionally return the native normal; no epsilon or fixture-specific direction changes the original distance floor. Unit/finite witness premises and convex-local limitations remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes gradient from pseudonormal, side orientation and surface limit; the face/zero case borrows hit.normal while radial output is fresh.
 * @evidence contracts/performance.md#efficient-algorithms Three coordinate operations produce the radial vector in fixed work; no mesh scan or additional query is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work The already-computed signed witness supplies nearest point/distance/side; this helper does not repeat a spatial query or retain a stale gradient cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The radial result transfers or the witness normal is borrowed; no retained data, handle or running task exists.
 */
export function readHumanFaceContactGradient(
  hit: IHumanFaceContactHit,
  query: readonly number[],
): number[] {
  if (hit.feature === "face" || !(hit.distance > 0)) return hit.normal;
  const side: number = hit.signedDistance < 0 ? -1 : 1;
  return query.map(
    (value: number, axis: number): number =>
      (side * (value - hit.point[axis])) / hit.distance,
  );
}
