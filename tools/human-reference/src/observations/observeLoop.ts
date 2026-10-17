import { CutPoint } from "../geometry/CutPoint.ts";
import { Plane } from "../geometry/Plane.ts";
import { Polyline } from "../geometry/Polyline.ts";
import { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { lerp } from "../geometry/lerp.ts";
import { selfCrossings } from "../geometry/selfCrossings.ts";
import { LoopRecord } from "../schema/LoopRecord.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import { ObservedLoop } from "./ObservedLoop.ts";

/**
 * Preserves a measured contour's physical points while separating CCW measurement order from material winding.
 *
 * @evidence contracts/common.md#principled-implementation Measured source points are oriented for sampling while material winding is supplied by a separate face witness.
 * @evidence contracts/common.md#clear-and-simple-design Inserted phase points interpolate inside an original source-face segment; display normals stay distinct from geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(points) orientation and field sampling plus the documented projected-crossing broad phase.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps are local; the returned record owns sampled arrays and shares immutable source-point triples.
 */
export function observeLoop(
  plane: Plane,
  polyline: Polyline,
  winding: number,
  normals: V3[],
): ObservedLoop {
  const record: LoopRecord = orientLoop(plane, polyline, "selected");
  const field: Map<V3, V3> = new Map(
    polyline.pts.map((p: CutPoint): [V3, V3] => [
      p.p,
      lerp(normals[p.a], normals[p.b], p.t),
    ]),
  );
  const sampled: V3[] = record.points.map((p: V3, i: number): V3 => {
    if (field.has(p)) return field.get(p)!;
    const a: V3 =
        record.points[(i + record.points.length - 1) % record.points.length],
      b: V3 = record.points[(i + 1) % record.points.length];
    // The inserted phase point lies inside an original planar source-face segment.
    return lerp(field.get(a)!, field.get(b)!, dist(a, p) / dist(a, b));
  });
  return {
    ...record,
    winding,
    normals: sampled,
    sourceSelfCrossings: selfCrossings(record.uv, true),
  };
}
