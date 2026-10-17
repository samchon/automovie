import type { Plane } from "../geometry/Plane.ts";
import type { V3 } from "../geometry/V3.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { sub } from "../geometry/sub.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";
import { P } from "../headneck/P.ts";
import { locate } from "../headneck/locate.ts";
import { walkFrom } from "../headneck/walkFrom.ts";

/**
 * Traces the source-plane arc outward from an observed aperture crossing.
 * The 45 mm scope, posterior cutoff and 34 mm/60 mm stopping extents describe
 * this acquisition window. A nearest-host residual above 0.05 mm yields no arc.
 * These conventions do not define an anatomical orbital boundary.
 *
 * @evidence contracts/common.md#principled-implementation Cuts source triangles, locates the aperture on the nearest cut and compares both source traversal directions by outward radial reach.
 * @evidence contracts/common.md#clear-and-simple-design Returns one observed path with its host residual; absence remains explicit rather than filled by a chord.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not project a failed observation, splice another component or transplant source topology into a product.
 * @evidence contracts/common.md#meaningful-documentation Gives the source acquisition window, nearest-host threshold and its nonclinical meaning.
 * @evidence contracts/performance.md#efficient-algorithms One full source cut dominates O(vertices+triangles); nearest-path search and two outward walks are linear in the scoped cut points.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the context's admitted source geometry and traverses the selected cut rather than recutting for both directions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds temporary cut arrays only for this call and returns one path; no handle or global cache is retained.
 */
export function radialSkinPath(
  context: HeadContext,
  plane: Plane,
  crossing: V3,
  centre: V3,
  eyeCentre: V3,
  eyeAxis: V3,
): { points: V3[]; hostResidualMm: number } | null {
  const scoped: (triangle: number) => boolean = (triangle: number): boolean =>
    context.s.triangles[triangle].every(
      (vertex: number): boolean =>
        dist(context.s.vertices[vertex], centre) < 45 &&
        dot(sub(context.s.vertices[vertex], eyeCentre), eyeAxis) > -6,
    );
  let host: V3[] | null = null;
  let hostClosed: boolean = false;
  let position: number = 0;
  let residual: number = Infinity;
  for (const polyline of cut(context.s, plane, scoped)) {
    const points: V3[] = P(polyline);
    if (points.length < 2) continue;
    const location: ReturnType<typeof locate> = locate(
      points,
      polyline.closed,
      crossing,
    );
    if (location.d < residual) {
      host = points;
      hostClosed = polyline.closed;
      position = location.s;
      residual = location.d;
    }
  }
  if (!host || residual > 0.05) return null;
  const candidates: V3[][] = [];
  for (const direction of [1, -1] as const) {
    const path: V3[] = walkFrom(host, hostClosed, position, direction);
    const points: V3[] = [];
    let length: number = 0;
    for (let index: number = 0; index < path.length; index++) {
      if (index) length += dist(path[index - 1], path[index]);
      points.push(path[index]);
      if (dot(sub(path[index], centre), plane.u) > 34 || length > 60) break;
    }
    if (points.length >= 2) candidates.push(points);
  }
  candidates.sort(
    (a: V3[], b: V3[]): number =>
      dot(sub(b[b.length - 1], centre), plane.u) -
      dot(sub(a[a.length - 1], centre), plane.u),
  );
  return candidates.length
    ? { points: candidates[0], hostResidualMm: residual }
    : null;
}
