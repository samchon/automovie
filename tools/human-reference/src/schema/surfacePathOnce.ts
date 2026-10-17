import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cross } from "../geometry/cross.ts";
import { cut } from "../geometry/cut.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { len } from "../geometry/len.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";

/**
 * Finds one short source-cut arc for a proposed endpoint plane.
 * The local search window and length allowance are geometric selection conventions, not a geodesic guarantee.
 * Endpoint matching allows 0.05 mm for saved observation rounding; no interior source approximation is added.
 *
 * @evidence contracts/common.md#principled-implementation Intersects an explicitly constructed plane with source triangles, locates both rounded endpoints on one cut and chooses a bounded-length arc while preserving source cut points.
 * @evidence contracts/common.md#clear-and-simple-design Owns one plane attempt, including a conservative triangle-box overlap filter and endpoint tracing; higher-level hint selection is separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed endpoint correspondence or excessive arc length returns null instead of fabricating source-edge witnesses or connecting disconnected curves.
 * @evidence contracts/common.md#meaningful-documentation States the finite local search convention, 0.05 mm endpoint allowance and absence of a geodesic guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Scans source triangles through cut, then scans returned contour segments for endpoint positions and candidate lengths; time and temporary storage depend on those populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each computed cut for both endpoint searches and arc directions; no previous plane or endpoint result is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cut contours and candidates are local arrays released to garbage collection after the selected path returns; no external handle is acquired.
 */
export function surfacePathOnce(
  skin: Skin,
  a: V3,
  b: V3,
  normal: V3,
  maxRatio: number,
): { path: V3[]; len: number } | null {
  const chord: V3 = sub(b, a);
  const length: number = len(chord);
  const rawNormal: V3 = cross(chord, normal);
  if (len(rawNormal) < 1e-6 * length) return null;
  const planeNormal: V3 = norm(rawNormal);
  const margin: number = Math.max(15, 0.6 * length);
  const low: V3 = [0, 1, 2].map(
    (axis: number): number => Math.min(a[axis], b[axis]) - margin,
  ) as V3;
  const high: V3 = [0, 1, 2].map(
    (axis: number): number => Math.max(a[axis], b[axis]) + margin,
  ) as V3;
  const filter = (index: number): boolean => {
    // Bounding-box overlap retains crossing triangles even when all three vertices lie outside the window.
    const triangle: [number, number, number] = skin.triangles[index];
    return [0, 1, 2].every(
      (axis: number): boolean =>
        Math.max(
          ...triangle.map(
            (vertex: number): number => skin.vertices[vertex][axis],
          ),
        ) >= low[axis] &&
        Math.min(
          ...triangle.map(
            (vertex: number): number => skin.vertices[vertex][axis],
          ),
        ) <= high[axis],
    );
  };
  const u: V3 = norm(chord);
  const plane: Plane = {
    origin: a,
    n: planeNormal,
    u,
    v: cross(planeNormal, u),
  };
  const polylines: Polyline[] = cut(skin, plane, filter);
  const locate = (
    point: V3,
    polyline: Polyline,
  ): { distance: number; phase: number } => {
    let distance: number = Infinity;
    let phase: number = -1;
    const count: number = polyline.pts.length;
    for (let i: number = 0; i < (polyline.closed ? count : count - 1); i++) {
      const start: V3 = polyline.pts[i].p;
      const edge: V3 = sub(polyline.pts[(i + 1) % count].p, start);
      const squared: number = dot(edge, edge);
      const fraction: number =
        squared > 0
          ? Math.max(0, Math.min(1, dot(sub(point, start), edge) / squared))
          : 0;
      const candidate: number = dist(point, add(start, mul(edge, fraction)));
      if (candidate < distance) {
        distance = candidate;
        phase = i + fraction;
      }
    }
    return { distance, phase };
  };
  let best: V3[] | null = null;
  let bestLength: number = Infinity;
  for (const polyline of polylines) {
    const start: ReturnType<typeof locate> = locate(a, polyline);
    const end: ReturnType<typeof locate> = locate(b, polyline);
    if (start.distance > 0.05 || end.distance > 0.05) continue;
    const points: V3[] = polyline.pts.map(
      (point: Polyline["pts"][number]): V3 => point.p,
    );
    const forward = (
      from: number,
      to: number,
      first: V3,
      last: V3,
    ): V3[] | null => {
      if (from > to && !polyline.closed) return null;
      const output: V3[] = [first];
      const finish: number = Math.floor(to) + (from > to ? points.length : 0);
      for (let i: number = Math.floor(from) + 1; i <= finish; i++)
        output.push(points[i % points.length]);
      output.push(last);
      return output;
    };
    const candidates: (V3[] | null)[] = [
      forward(start.phase, end.phase, a, b),
      forward(end.phase, start.phase, b, a)?.reverse() ?? null,
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      let candidateLength: number = 0;
      for (let i: number = 1; i < candidate.length; i++)
        candidateLength += dist(candidate[i - 1], candidate[i]);
      if (candidateLength < bestLength) {
        bestLength = candidateLength;
        best = candidate;
      }
    }
  }
  if (!best || bestLength > maxRatio * length + 5) return null;
  const output: V3[] = [];
  for (const point of best)
    if (!output.length || dist(output[output.length - 1], point) > 1e-6)
      output.push(point);
  return { path: output, len: bestLength };
}
