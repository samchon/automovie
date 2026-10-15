import { planeHeight } from "./planeHeight";
import type { PlanPoint } from "./PlanPoint";
import type { RoofPatch } from "./RoofPatch";
import { containsPoint } from "./containsPoint";
import { across } from "./across";
import { along } from "./along";
import { wallColumns } from "./wallColumns";
import { WallSpec } from "./WallSpec";

/**
 * Local XY outline of a boundary face: length [from,to], from the bottom to the real top.
 * The top is sampled at each column vertex's length coordinate along the wall centre line.
 */

export const wallHostOutline = (
  wall: WallSpec, roof: readonly RoofPatch[],
  requestedFrom: number, requestedTo: number, midline: number
): Array<{ x: number; y: number; }> => {
  // A mitred end is shorter on the centre line, so the requested interval shrinks to the real range on the centre line.
  const crossings = wall.plan.flatMap((a, i) => {
    const b = wall.plan[(i + 1) % wall.plan.length]!;
    const [pa, pb] = [across(wall.axis, a), across(wall.axis, b)];
    if ((pa - midline) * (pb - midline) > 0 || pa === pb) return [];
    const t = (midline - pa) / (pb - pa);
    return [along(wall.axis, a) + t * (along(wall.axis, b) - along(wall.axis, a))];
  });
  const from = Math.max(requestedFrom, Math.min(...crossings));
  const to = Math.min(requestedTo, Math.max(...crossings));
  const columns = wallColumns(wall, roof)
    .filter((c) => c.polygon.some((p) => along(wall.axis, p) > from + 1e-9) &&
      c.polygon.some((p) => along(wall.axis, p) < to - 1e-9));
  const samples = [...new Set([from, to, ...columns.flatMap((c) => c.polygon.map((p) => along(wall.axis, p)))])]
    .filter((s) => s >= from - 1e-9 && s <= to + 1e-9).sort((a, b) => b - a);
  const topAt = (s: number): number => {
    const point: PlanPoint = wall.axis === "x" ? { x: s, z: midline } : { x: midline, z: s };
    const heights = columns.filter((c) => containsPoint(c.polygon, point, 1e-6)).map((c) => planeHeight(c.top, point));
    if (heights.length === 0) throw new Error(`${wall.id}: no host top found at length ${s}.`);
    return Math.min(...heights);
  };
  return [
    { x: from, y: wall.bottom }, { x: to, y: wall.bottom },
    ...samples.map((s) => ({ x: s, y: topAt(Math.min(Math.max(s, from + 1e-6), to - 1e-6)) })),
  ].filter((p, i, list) => i === 0 || Math.hypot(p.x - list[i - 1]!.x, p.y - list[i - 1]!.y) > 1e-9);
};
