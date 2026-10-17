import type { Plane } from "../geometry/Plane.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { lerp } from "../geometry/lerp.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { HandPin } from "./HandPin.ts";

/**
 * Intersects four rig-frame cardinal rays with a selected closed source contour.
 * The first positive crossing is local to the ray origin; it need not be the
 * extreme of a concave merged mass. Missing crossings remain absent.
 *
 * @evidence contracts/common.md#principled-implementation Solves planar ray-segment intersections and integrates actual closed-contour arclength; coordinates interpolate the crossed source edge.
 * @evidence contracts/common.md#clear-and-simple-design One contour operation supplies the semantic pins reused by guides and curve fitting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not invent nail borders, replace missing crossings or assume radial is always positive u.
 * @evidence contracts/common.md#meaningful-documentation Defines first-crossing meaning, the rig-frame inference and concave-mass limitation.
 * @evidence contracts/performance.md#efficient-algorithms Four ray scans and four length scans cost O(n) time for n contour points and constant auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the existing measured contour without recutting the source mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns at most four pin records; no handles or persistent cache are retained.
 */
export function handPins(
  loop: LoopRecord,
  radial: V3,
  plane: Plane,
): HandPin[] {
  const phases: number[] = [0, 90, 180, 270];
  const names: HandPin["semantic"][] = [
    "dorsal",
    dot(plane.u, radial) > 0 ? "radial" : "ulnar",
    "palmar",
    dot(plane.u, radial) > 0 ? "ulnar" : "radial",
  ];
  const out: HandPin[] = [];
  for (let k: number = 0; k < phases.length; k++) {
    const angle: number = (phases[k] * Math.PI) / 180;
    const direction: V2 = [Math.sin(angle), -Math.cos(angle)];
    let best: { distance: number; edge: number; fraction: number } | null =
      null;
    for (let i: number = 0; i < loop.points.length; i++) {
      const p: V2 = loop.uv[i];
      const q: V2 = loop.uv[(i + 1) % loop.uv.length];
      const edge: V2 = [q[0] - p[0], q[1] - p[1]];
      const denominator: number =
        direction[0] * edge[1] - direction[1] * edge[0];
      if (Math.abs(denominator) < 1e-12) continue;
      const distance: number = (p[0] * edge[1] - p[1] * edge[0]) / denominator;
      const fraction: number =
        (p[0] * direction[1] - p[1] * direction[0]) / denominator;
      if (
        distance > 0 &&
        fraction >= 0 &&
        fraction <= 1 &&
        (!best || distance < best.distance)
      )
        best = { distance, edge: i, fraction };
    }
    if (!best) continue;
    let before: number = 0;
    let total: number = 0;
    for (let i: number = 0; i < loop.points.length; i++) {
      const length: number = dist(
        loop.points[i],
        loop.points[(i + 1) % loop.points.length],
      );
      if (i < best.edge) before += length;
      if (i === best.edge) before += length * best.fraction;
      total += length;
    }
    if (total <= 0) continue;
    out.push({
      semantic: names[k],
      fraction: before / total,
      p: lerp(
        loop.points[best.edge],
        loop.points[(best.edge + 1) % loop.points.length],
        best.fraction,
      ),
      phaseDeg: phases[k],
    });
  }
  return out;
}
