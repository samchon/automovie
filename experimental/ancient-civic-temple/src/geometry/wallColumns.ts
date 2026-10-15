import type { HeightPlane } from "./HeightPlane";
import { levelPlane } from "./levelPlane";
import { partitionPlan } from "./partitionPlan";
import { clipPlan } from "./clipPlan";
import { planeHeight } from "./planeHeight";
import type { PlanPoint } from "./PlanPoint";
import type { RoofPatch } from "./RoofPatch";
import { simplifyPlan } from "./simplifyPlan";
import { WallColumn } from "./WallColumn";
import { across } from "./across";
import { along } from "./along";
import { WallSpec } from "./WallSpec";
import { area } from "./area";

/** Length-direction half-plane clip: at or above value (sign=1) or at or below it (sign=-1). */
const clipAlong = (polygon: PlanPoint[], axis: "x" | "z", value: number, sign: 1 | -1): PlanPoint[] => clipPlan(polygon, {
  x: axis === "x" ? sign : 0,
  z: axis === "z" ? sign : 0,
  constant: -sign * value,
});
/** Length coordinates where adjacent roof piece boundaries cross the long face line; the column cut lines of the band split. */
const splitCrossings = (wall: WallSpec, roof: readonly RoofPatch[]): number[] => {
  const perpendicular = wall.plan.map((p) => across(wall.axis, p));
  const result: number[] = [];
  for (const segment of wall.segments) {
    for (const [split, line] of [
      [segment.lowSplit, Math.min(...perpendicular)], [segment.highSplit, Math.max(...perpendicular)],
    ] as const) {
      if (split === undefined) continue;
      for (const patch of roof.filter((r) => r.tier === split.tier)) {
        patch.polygon.forEach((a, i) => {
          const b = patch.polygon[(i + 1) % patch.polygon.length]!;
          const [pa, pb] = [across(wall.axis, a), across(wall.axis, b)];
          if ((pa - line) * (pb - line) > 0 || Math.abs(pa - pb) < 1e-12) return;
          const t = (line - pa) / (pb - pa);
          const s = along(wall.axis, a) + t * (along(wall.axis, b) - along(wall.axis, a));
          if (s > segment.from + 1e-6 && s < segment.to - 1e-6) result.push(s);
        });
      }
    }
  }
  return result;
};
/**
 * Builds a planar convex wall host as a set of closed prisms of convex columns split by length interval,
 * roof piece and opening. The top is the real roof underside plane of the given composition unit (tier) or a
 * stated flat height (parapet or yard wall coping), and the bottom is the caller's common bottom. Columns in an
 * opening interval keep only the parts below the threshold and above the lintel (below and above the sill for
 * windows), giving a real void and reveal. A long face can be split by the adjacent roof line into interior,
 * contact and exterior bands. Interior contact faces at column boundaries hide inside the adjacent column (numeric limit 1e-9 m).
 *
 * Wall column decomposition. When a roof policy interval is not fully covered by the composed roof of the
 * given unit, or the roof underside is lower than an opening top, no false wall is built; it is an error.
 */
export const wallColumns = (wall: WallSpec, roof: readonly RoofPatch[]): WallColumn[] => {
  const coordinates = wall.plan.map((p) => along(wall.axis, p));
  const min = Math.min(...coordinates);
  const max = Math.max(...coordinates);
  const cuts = [...new Set([
    min, max,
    ...wall.segments.flatMap((s) => [s.from, s.to]),
    ...wall.voids.flatMap((v) => [v.from, v.to]),
    ...splitCrossings(wall, roof),
  ])].filter((c) => c >= min && c <= max).sort((a, b) => a - b);
  const columns: WallColumn[] = [];
  for (let i = 0; i + 1 < cuts.length; ++i) {
    const c0 = cuts[i]!;
    const c1 = cuts[i + 1]!;
    if (c1 - c0 < 1e-9) continue;
    const mid = (c0 + c1) / 2;
    const segment = wall.segments.find((s) => mid > s.from && mid < s.to);
    if (segment === undefined) throw new Error(`${wall.id}: no top or owner interval at length ${mid}.`);
    const strip = clipAlong(clipAlong(wall.plan, wall.axis, c0, 1), wall.axis, c1, -1);
    if (strip.length === 0) continue;
    const pieces: Array<{ polygon: PlanPoint[]; top: HeightPlane; }> = [];
    const top = segment.top;
    if (top.kind === "flat") {
      pieces.push({ polygon: strip, top: levelPlane(top.height - (top.coping ?? 0)) });
    } else {
      let covered = 0;
      for (const patch of roof.filter((r) => r.tier === top.tier)) {
        const inside = simplifyPlan(partitionPlan(strip, patch.polygon).inside);
        if (inside.length === 0) continue;
        covered += area(inside);
        pieces.push({ polygon: inside, top: { ...patch.height, constant: patch.height.constant - patch.thickness } });
      }
      if (Math.abs(covered - area(strip)) > 1e-5) {
        throw new Error(`${wall.id}: ${top.tier} roof coverage ${covered}m² over length ${c0}~${c1} differs from ${area(strip)}m².`);
      }
    }
    const voids = wall.voids.filter((v) => mid > v.from && mid < v.to).sort((a, b) => a.bottom - b.bottom);
    for (const piece of pieces) {
      const bounds: Array<[HeightPlane, HeightPlane]> = [];
      let lower = levelPlane(wall.bottom);
      for (const v of voids) {
        if (v.bottom - lower.constant > 1e-9) bounds.push([lower, levelPlane(v.bottom)]);
        lower = levelPlane(v.top);
      }
      for (const p of piece.polygon) {
        if (!(planeHeight(piece.top, p) - lower.constant > 1e-9)) {
          throw new Error(`${wall.id}: top ${planeHeight(piece.top, p)} is lower than the void or bottom ${lower.constant}.`);
        }
      }
      bounds.push([lower, piece.top]);
      columns.push({
        segment, polygon: piece.polygon, top: piece.top,
        intervals: bounds.map(([b, t], index) => ({ bottom: b, top: t, uppermost: index === bounds.length - 1 })),
      });
    }
  }
  return columns;
};
