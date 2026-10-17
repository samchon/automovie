import type { Plane } from "../geometry/Plane.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { signedArea } from "../geometry/signedArea.ts";
import { to2 } from "../geometry/to2.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { FootArc } from "./FootArc.ts";

/**
 * Records a source foot arc in its physical cutting plane, retaining open ankle ends.
 * Coordinates and source order remain unchanged; signed area is meaningful only for
 * a closed planar arc and does not certify outer-versus-cavity winding.
 *
 * @evidence contracts/common.md#principled-implementation Projection into the supplied orthonormal plane and direct segment lengths measure the observed arc without introducing a missing closing edge.
 * @evidence contracts/common.md#clear-and-simple-design One record adapts the regional arc to the shared contour schema; curve fitting and anatomical naming remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case-specific dimensions, fitted coefficients or artificial closure are introduced, and unavailable convex perimeter remains null.
 * @evidence contracts/common.md#meaningful-documentation States source-order preservation, physical plane use, signed-area limits and the open-end contract.
 * @evidence contracts/performance.md#efficient-algorithms One projection pass and one edge pass take O(n) time and O(n) projected storage for n source points.
 * @evidence contracts/performance.md#reuse-equivalent-work The projected coordinates supply both area and plane extents; independent calls share no cache or geometry state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result retains its input coordinate array and new projected array; no files, handles or cross-call cache are acquired.
 */
export function footLoopRecord(arc: FootArc, plane: Plane): LoopRecord {
  if (arc.points.length < (arc.closed ? 3 : 2))
    throw new Error("Foot arc has insufficient source points");
  const uv: V2[] = arc.points.map((point: V3): V2 => to2(plane, point));
  let perimeter: number = 0;
  let minU: number = Infinity;
  let maxU: number = -Infinity;
  let minV: number = Infinity;
  let maxV: number = -Infinity;
  for (let i: number = 0; i < arc.points.length; i++) {
    minU = Math.min(minU, uv[i][0]);
    maxU = Math.max(maxU, uv[i][0]);
    minV = Math.min(minV, uv[i][1]);
    maxV = Math.max(maxV, uv[i][1]);
    if (i < arc.points.length - 1 || arc.closed)
      perimeter += dist(arc.points[i], arc.points[(i + 1) % arc.points.length]);
  }
  return {
    ...arc,
    uv,
    role: arc.closed ? "selected" : "clipped-arc",
    perimeter,
    convexPerimeter: null,
    area: arc.closed ? signedArea(uv) : null,
    breadthU: maxU - minU,
    depthV: maxV - minV,
  };
}
