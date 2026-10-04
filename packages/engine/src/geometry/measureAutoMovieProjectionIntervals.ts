import type { IAutoMovieVector3 } from "@automovie/interface";

import { adjacentAutoMovieFloat64 as outward } from "../math/adjacentAutoMovieFloat64";

/**
 * Outward-enclosed projections of represented points along a stored direction.
 * Points, origin and direction share one frame; lengths are metres and the
 * direction is normalized only by its largest component. Stored direction
 * rounding never asserts a true face normal: extrema enclose the whole supplied
 * feature even when the proposal is approximate. Each result owns its intervals.
 * A zero direction has zero intervals/norm and proves no directional separation.
 * Nonempty finite coordinates and representable differences/arithmetic are
 * required. The norm proposal is checked through a lower square enclosure.
 * Support separation and bounded attachment contact share this formula owner.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Shares qualified support projections between complete-feature clearance and attachment-contact geometry without a point-sample substitute.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Encloses the supplied representation and approximate direction while preserving caller coordinates and refusing unsupported arithmetic.
 * @author Samchon
 */
export function measureAutoMovieProjectionIntervals(
  points: readonly IAutoMovieVector3[],
  raw: IAutoMovieVector3,
  origin: IAutoMovieVector3 = points[0],
): { intervals: [number, number][]; normUpper: number } {
  if (
    points.length === 0 ||
    ![...points, raw, origin].every(
      (p) =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Projection intervals require nonempty finite points and direction.",
    );
  const scale = Math.max(Math.abs(raw.x), Math.abs(raw.y), Math.abs(raw.z));
  if (scale === 0) return { intervals: points.map(() => [0, 0]), normUpper: 0 };
  const direction = { x: raw.x / scale, y: raw.y / scale, z: raw.z / scale };
  let norm2 = 0;
  for (const value of [direction.x, direction.y, direction.z])
    norm2 = outward(norm2 + outward(value * value, true), true);
  let normUpper = Math.sqrt(norm2);
  while (outward(normUpper * normUpper, false) < norm2)
    normUpper = outward(normUpper, true);
  const intervals = points.map((point): [number, number] => {
    let low = 0,
      high = 0;
    for (const axis of ["x", "y", "z"] as const) {
      if (direction[axis] === 0) continue;
      const difference = point[axis] - origin[axis];
      const ends = [
        outward(difference, false) * direction[axis],
        outward(difference, true) * direction[axis],
      ];
      low = outward(low + outward(Math.min(...ends), false), false);
      high = outward(high + outward(Math.max(...ends), true), true);
    }
    return [low, high];
  });
  return { intervals, normUpper };
}
