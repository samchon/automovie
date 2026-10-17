import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { lerp } from "../geometry/lerp.ts";

/**
 * Crops an observed surface polyline by linearly interpolated nonnegative channels.
 * Every adjacent input pair must already lie in one source face; cropped pieces
 * preserve that containment and remain disconnected when the crop removes skin.
 * Channels carry values at each input point, such as height above a lower plane.
 * Returned points have no source-edge identifiers because a crop can end inside a face.
 * Closure is retained only for an intact input cycle; coincident crop endpoints
 * or an open source path never establish a closed contour.
 *
 * @evidence contracts/common.md#principled-implementation Solves each linear inequality on each original segment, intersects the admitted parameter intervals and preserves separate pieces. This is exact for linear per-face channels; curved boundaries need another producer.
 * @evidence contracts/common.md#clear-and-simple-design Owns segment cropping only and returns raw geometry without inventing source-edge provenance or polygon-closing caps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity-specific geometry, coordinate patch or inferred anatomical attachment is used; the 1e-6 mm join tolerance handles arithmetic roundoff only.
 * @evidence contracts/common.md#meaningful-documentation States the source-face containment premise, channel inequality, units of the join tolerance and caller ownership of the returned pieces.
 * @evidence contracts/performance.md#efficient-algorithms Visits n segments and c clipping channels in O(n*c) time and retains O(n) output points; no source triangle search is needed.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the original endpoint values and interpolates each admitted segment only once. It has no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All arrays belong to the call or its returned result; no handles, temporary files or retained global state are created.
 */
export function clipSurfaceSegments(
  points: V3[],
  closed: boolean,
  channels: number[][],
): { closed: boolean; points: V3[] }[] {
  for (const channel of channels)
    if (
      channel.length !== points.length ||
      channel.some((value: number): boolean => !Number.isFinite(value))
    )
      throw new Error(
        "A clipping channel must provide one finite value per point",
      );
  const pieces: V3[][] = [];
  let current: V3[] = [];
  let intact: boolean = true;
  const count: number = Math.max(0, closed ? points.length : points.length - 1);
  for (let i: number = 0; i < count; i++) {
    const next: number = (i + 1) % points.length;
    let low: number = 0;
    let high: number = 1;
    for (const channel of channels) {
      const a: number = channel[i];
      const b: number = channel[next];
      if (a < 0 && b < 0) {
        high = -1;
        break;
      }
      if (a >= 0 && b >= 0) continue;
      const crossing: number = a / (a - b);
      if (a < 0) low = Math.max(low, crossing);
      else high = Math.min(high, crossing);
    }
    if (low > 0 || high < 1) intact = false;
    if (low >= high) {
      if (current.length > 1) pieces.push(current);
      current = [];
      continue;
    }
    const first: V3 = lerp(points[i], points[next], low);
    const last: V3 = lerp(points[i], points[next], high);
    if (current.length && dist(current[current.length - 1], first) > 1e-6) {
      if (current.length > 1) pieces.push(current);
      current = [];
    }
    if (!current.length) current.push(first);
    if (dist(current[current.length - 1], last) > 1e-8) current.push(last);
    if (high < 1 - 1e-10) {
      if (current.length > 1) pieces.push(current);
      current = [];
    }
  }
  if (current.length > 1) pieces.push(current);
  if (
    closed &&
    pieces.length > 1 &&
    dist(pieces[pieces.length - 1].at(-1)!, pieces[0][0]) < 1e-6
  )
    pieces[0] = pieces.pop()!.slice(0, -1).concat(pieces[0]);
  return pieces.map((piece: V3[]): { closed: boolean; points: V3[] } => {
    const complete: boolean =
      closed &&
      intact &&
      pieces.length === 1 &&
      piece.length > 2 &&
      dist(piece[0], piece.at(-1)!) < 1e-6;
    return { closed: complete, points: complete ? piece.slice(0, -1) : piece };
  });
}
