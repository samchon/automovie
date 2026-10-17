import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { mul } from "../geometry/mul.ts";
import { sub } from "../geometry/sub.ts";

/**
 * Finds a point's nearest source segment and segment-index-plus-fraction position.
 * Distance is in millimetres; equal distances keep the first observed segment.
 *
 * @evidence contracts/common.md#principled-implementation Clamped orthogonal projection minimizes distance on each observed line segment, including zero-length edges.
 * @evidence contracts/common.md#clear-and-simple-design One complete scan returns a nearest location and physical residual together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It compares source segments rather than only their vertices or a sampled curve proxy.
 * @evidence contracts/common.md#meaningful-documentation States parameter convention, residual units and tie handling.
 * @evidence contracts/performance.md#efficient-algorithms N source edges take linear time and constant temporary storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless nearest-location operation shares no request work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No handles or cross-call state are retained.
 */
export function locate(
  points: V3[],
  closed: boolean,
  point: V3,
): { s: number; d: number } {
  if (points.length < 2)
    throw new Error("At least two source points are required");
  let residual: number = Infinity,
    position: number = 0;
  for (let i: number = 0; i < points.length - (closed ? 0 : 1); i++) {
    const a: V3 = points[i],
      edge: V3 = sub(points[(i + 1) % points.length], a);
    const squared: number = dot(edge, edge);
    const fraction: number =
      squared > 0
        ? Math.max(0, Math.min(1, dot(sub(point, a), edge) / squared))
        : 0;
    const distance: number = dist(point, add(a, mul(edge, fraction)));
    if (distance < residual) {
      residual = distance;
      position = i + fraction;
    }
  }
  return { s: position, d: residual };
}
