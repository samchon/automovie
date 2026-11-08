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
