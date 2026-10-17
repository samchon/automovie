import type { Plane } from "../geometry/Plane.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { centroid2 } from "../geometry/centroid2.ts";
import { hull2 } from "../geometry/hull2.ts";
import { mul } from "../geometry/mul.ts";
import { perimeter2 } from "../geometry/perimeter2.ts";
import { signedArea } from "../geometry/signedArea.ts";
import { sub } from "../geometry/sub.ts";
import { to2 } from "../geometry/to2.ts";
import type { LoopRecord } from "./LoopRecord.ts";

/**
 * Orders a source section counterclockwise and inserts its farthest minus-v phase crossing.
 * This measurement convention removes cavity winding; a consumer needs a separate orientation witness.
 * Open arcs retain their source order. The minimal input also admits source-face clipped endpoints.
 *
 * @evidence contracts/common.md#principled-implementation Uses signed projected area and an explicit minus-v ray crossing to impose the measurement convention while retaining original source points and an interpolated phase witness.
 * @evidence contracts/common.md#clear-and-simple-design Owns one contour's measured orientation, phase and dimensions; cavity signs and skin interpolation remain separate observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source-edge addresses are fabricated for clipped endpoints; empty or non-finite contours fail explicitly.
 * @evidence contracts/common.md#meaningful-documentation States the counterclockwise convention, lost cavity sign, open-arc behavior and minimal endpoint contract.
 * @evidence contracts/performance.md#efficient-algorithms Scans and rotates n points and computes a sorted planar convex hull, giving O(n log n) hull work and O(n) additional storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains no phase or contour cache; returned measurements correspond to this supplied contour.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns only temporary arrays and returns the measured record; no external handle or module state persists.
 */
export function orientLoop(
  plane: Plane,
  polyline: { closed: boolean; pts: { p: V3 }[] },
  role: LoopRecord["role"],
  centreUV?: V2,
): LoopRecord {
  if (
    polyline.pts.length < (polyline.closed ? 3 : 2) ||
    polyline.pts.some(
      (point: { p: V3 }): boolean =>
        !Array.isArray(point.p) ||
        point.p.length !== 3 ||
        point.p.some(
          (value: number): boolean =>
            typeof value !== "number" || !Number.isFinite(value),
        ),
    )
  )
    throw new Error("Section requires finite points and a nonempty arc");
  let points: V3[] = polyline.pts.map((point: { p: V3 }): V3 => point.p);
  let uv: V2[] = points.map((point: V3): V2 => to2(plane, point));
  let area: number | null = null;
  let convexPerimeter: number | null = null;
  let phase0Inserted: boolean = false;
  if (polyline.closed && points.length >= 3) {
    if (signedArea(uv) < 0) {
      points.reverse();
      uv.reverse();
    }
    const centre: V2 = centreUV ?? centroid2(uv);
    let segment: number = -1;
    let fraction: number = 0;
    let depth: number = -Infinity;
    for (let i: number = 0; i < uv.length; i++) {
      const a: V2 = uv[i];
      const b: V2 = uv[(i + 1) % uv.length];
      const da: number = a[0] - centre[0];
      const db: number = b[0] - centre[0];
      if (da === db || da > 0 === db > 0) continue;
      const t: number = da / (da - db);
      const candidate: number = centre[1] - (a[1] + (b[1] - a[1]) * t);
      if (candidate > 0 && candidate > depth) {
        segment = i;
        fraction = t;
        depth = candidate;
      }
    }
    if (segment >= 0) {
      const start: V3 = add(
        points[segment],
        mul(
          sub(points[(segment + 1) % points.length], points[segment]),
          fraction,
        ),
      );
      points = points.slice(segment + 1).concat(points.slice(0, segment + 1));
      uv = uv.slice(segment + 1).concat(uv.slice(0, segment + 1));
      if (fraction > 1e-9 && fraction < 1 - 1e-9) {
        points.unshift(start);
        uv.unshift(to2(plane, start));
        phase0Inserted = true;
      } else if (fraction <= 1e-9) {
        points.unshift(points.pop()!);
        uv.unshift(uv.pop()!);
      }
    }
    area = signedArea(uv);
    convexPerimeter = perimeter2(
      hull2(uv).map((index: number): V2 => uv[index]),
    );
  }
  let lowU: number = Infinity;
  let highU: number = -Infinity;
  let lowV: number = Infinity;
  let highV: number = -Infinity;
  for (const point of uv) {
    lowU = Math.min(lowU, point[0]);
    highU = Math.max(highU, point[0]);
    lowV = Math.min(lowV, point[1]);
    highV = Math.max(highV, point[1]);
  }
  return {
    role,
    closed: polyline.closed,
    points,
    uv,
    perimeter: perimeter2(uv, polyline.closed),
    convexPerimeter,
    area,
    breadthU: highU - lowU,
    depthV: highV - lowV,
    phase0Inserted,
  };
}
