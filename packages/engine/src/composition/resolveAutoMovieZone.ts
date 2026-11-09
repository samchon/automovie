import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieZone } from "./IAutoMovieZone";

/**
 * The point of a zone a move goes to: a named landmark, or the zone's centre
 * moved toward a bearing by a share of its radius, so a scene names where to
 * go and the set decides the coordinates.
 *
 * @param zones The set's zones.
 * @param id The zone id.
 * @param where A landmark name, or a bearing (radians from +Z toward +X) and a share in [0, 1] of the radius; the centre when absent.
 * @returns The world point.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The point of a zone a move goes to: a named landmark, or the zone's centre moved toward a bearing by a share of its radius, so a scene names where to go and the set decides the coordinates) and documents parameters `zones`, `id`, `where`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The point of a zone a move goes to: a named landmark, or the zone's centre moved toward a bearing by a share of its radius, so a scene names where to go and the set decides the coordinates) directly over its typed inputs (`zones`, `id`, `where`) as a single pass (find over zones), delegating to `zones.find`, `Math.sin`, `Math.cos`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 19 lines and 6 top-level statements that reuses `zones.find`, `Math.sin`, `Math.cos` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `zones`, `id`, `where`; the dominant cost is a single pass (find over zones), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieZone(
  zones: readonly IAutoMovieZone[],
  id: string,
  where?: string | { bearing: number; share: number },
): IAutoMovieVector3 {
  const zone: IAutoMovieZone | undefined = zones.find(
    (z: IAutoMovieZone): boolean => z.id === id,
  );
  if (!zone) throw new Error(`Unknown AutoMovie zone ${id}`);
  if (where === undefined) return { ...zone.center };
  if (typeof where === "string") {
    const landmark: IAutoMovieVector3 | undefined = zone.landmarks?.[where];
    if (!landmark) throw new Error(`Unknown landmark ${id}.${where}`);
    return { ...landmark };
  }
  if (!(where.share >= 0 && where.share <= 1))
    throw new Error(`Zone share outside [0, 1]: ${where.share}`);
  return {
    x: zone.center.x + zone.radius * where.share * Math.sin(where.bearing),
    y: zone.center.y,
    z: zone.center.z + zone.radius * where.share * Math.cos(where.bearing),
  };
}
