/**
 * Builds a planar convex wall host as a set of closed prisms of convex columns split by length interval,
 * roof piece and opening. The top is the real roof underside plane of the given composition unit (tier) or a
 * stated flat height (parapet or yard wall coping), and the bottom is the caller's common bottom. Columns in an
 * opening interval keep only the parts below the threshold and above the lintel (below and above the sill for
 * windows), giving a real void and reveal. A long face can be split by the adjacent roof line into interior,
 * contact and exterior bands. Interior contact faces at column boundaries hide inside the adjacent column (numeric limit 1e-9 m).
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { splitVerticalFace } from "./face-bands";
import {
  clipPlan, edgeInside, partitionPlan, planeHeight, simplifyPlan,
  type HeightPlane, type PlanPoint, type RoofPatch,
} from "./planar-domain";
import { levelPlane, prismFaces } from "./prism";

export type WallTop =
  | { kind: "roof"; tier: RoofPatch["tier"] }
  | {
    kind: "flat"; height: number; surface: string;
    /** Stone coping thickness (m). When present, the wall solid ends in a hidden bearing face at height-coping and wall-trim builds the coping. */
    coping?: number;
  };

/** The rule that splits a long face by the adjacent roof. within defaults to joint (a hidden contact face). */
export interface WallFaceSplit {
  tier: RoofPatch["tier"];
  above: string;
  within?: string;
}

/** The top policy of the length interval [from,to] and the surface owners of the low and high long faces. */
export interface WallSegment {
  from: number;
  to: number;
  low: string;
  high: string;
  top: WallTop;
  lowSplit?: WallFaceSplit;
  highSplit?: WallFaceSplit;
}

/** A real void (opening outline including the frame) defined by a length interval and a vertical interval. */
export interface WallVoid {
  id: string;
  from: number;
  to: number;
  bottom: number;
  top: number;
}

export interface WallSpec {
  /** Wall ID used in element and model identifiers. */
  id: string;
  /** Surface owner names for reveal, joint, bearing and footing. */
  owner: string;
  plan: PlanPoint[];
  axis: "x" | "z";
  bottom: number;
  segments: WallSegment[];
  voids: WallVoid[];
  ends?: { low?: string; high?: string };
}

export interface WallFace {
  surface: string;
  corners: IAutoMovieVector3[];
}

/** One column's real top plane and vertical interval. */
export interface WallColumn {
  polygon: PlanPoint[];
  top: HeightPlane;
  intervals: Array<{ bottom: HeightPlane; top: HeightPlane; uppermost: boolean }>;
  segment: WallSegment;
}

const along = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.x : p.z;
const across = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.z : p.x;

/** Length-direction half-plane clip: at or above value (sign=1) or at or below it (sign=-1). */
const clipAlong = (polygon: PlanPoint[], axis: "x" | "z", value: number, sign: 1 | -1): PlanPoint[] =>
  clipPlan(polygon, {
    x: axis === "x" ? sign : 0,
    z: axis === "z" ? sign : 0,
    constant: -sign * value,
  });

const area = (polygon: readonly PlanPoint[]): number => polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;

const containsPoint = (polygon: readonly PlanPoint[], point: PlanPoint, margin = 1e-9): boolean =>
  polygon.every((p, i) => planeHeight(edgeInside(p, polygon[(i + 1) % polygon.length]!), point) >= -margin);

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
    const pieces: Array<{ polygon: PlanPoint[]; top: HeightPlane }> = [];
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

/** Classifies a column prism's faces by surface owner, and splits stated long faces into bands by the adjacent roof. */
export const wallFaces = (wall: WallSpec, roof: readonly RoofPatch[]): WallFace[] => {
  const coordinates = wall.plan.map((p) => along(wall.axis, p));
  const min = Math.min(...coordinates);
  const max = Math.max(...coordinates);
  const surface = (name: string) => name.startsWith("surface.") ? name : `surface.${wall.owner}.${name}`;
  const faces: WallFace[] = [];
  for (const column of wallColumns(wall, roof)) {
    for (const interval of column.intervals) {
      for (const face of prismFaces(column.polygon, interval.bottom, interval.top)) {
        if (face.side === "top") {
          const owner = !interval.uppermost ? "reveal"
            : column.segment.top.kind === "flat"
              ? column.segment.top.coping === undefined ? column.segment.top.surface : "joint"
              : "bearing";
          faces.push({ surface: surface(owner), corners: face.corners });
          continue;
        }
        if (face.side === "bottom") {
          faces.push({ surface: surface(interval.bottom.constant === wall.bottom ? "footing" : "reveal"), corners: face.corners });
          continue;
        }
        const perpendicular = wall.axis === "x" ? face.normal.z : face.normal.x;
        const lengthwise = wall.axis === "x" ? face.normal.x : face.normal.z;
        if (Math.abs(perpendicular) > 1 - 1e-9) {
          const lowSide = perpendicular < 0;
          const owner = lowSide ? column.segment.low : column.segment.high;
          const split = lowSide ? column.segment.lowSplit : column.segment.highSplit;
          const neighbor = split === undefined ? undefined : adjacentPatch(roof, split.tier, face.corners, face.normal);
          if (split === undefined || neighbor === undefined) {
            faces.push({ surface: surface(owner), corners: face.corners });
          } else {
            faces.push(...splitVerticalFace(face.corners, neighbor.height, neighbor.thickness, {
              below: surface(owner), within: surface(split.within ?? "joint"), above: surface(split.above),
            }));
          }
        } else if (Math.abs(lengthwise) > 1 - 1e-9) {
          const at = along(wall.axis, { x: face.corners[0]!.x, z: face.corners[0]!.z });
          const owner = Math.abs(at - min) < 1e-9 ? wall.ends?.low ?? "end"
            : Math.abs(at - max) < 1e-9 ? wall.ends?.high ?? "end" : "reveal";
          faces.push({ surface: surface(owner), corners: face.corners });
        } else {
          faces.push({ surface: surface("joint"), corners: face.corners });
        }
      }
    }
  }
  return faces;
};

/** The roof piece (of that unit) 1mm outward along the normal from a face's midpoint. */
const adjacentPatch = (
  roof: readonly RoofPatch[], tier: RoofPatch["tier"], corners: readonly IAutoMovieVector3[], normal: PlanPoint,
): RoofPatch | undefined => {
  const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
  const cz = corners.reduce((s, c) => s + c.z, 0) / corners.length;
  const probe = { x: cx + normal.x * 1e-3, z: cz + normal.z * 1e-3 };
  return roof.find((r) => r.tier === tier && containsPoint(r.polygon, probe));
};

/**
 * Cuts a host outline (an x-monotone polygon: horizontal bottom, upper polyline) with a horizontal line and
 * keeps only the part below or above it. Used to split one host into two boundaries by height.
 */
export const clipOutlineAtHeight = (
  outline: ReadonlyArray<{ x: number; y: number }>, height: number, keep: "below" | "above",
): Array<{ x: number; y: number }> => {
  const inside = (q: { y: number }) => keep === "below" ? q.y <= height + 1e-9 : q.y >= height - 1e-9;
  const out: Array<{ x: number; y: number }> = [];
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b) && Math.abs(b.y - a.y) > 1e-12) {
      out.push({ x: a.x + (b.x - a.x) * (height - a.y) / (b.y - a.y), y: height });
    }
  });
  const kept = out.filter((q, i) => {
    const n = out[(i + 1) % out.length]!;
    return Math.hypot(q.x - n.x, q.y - n.y) > 1e-9;
  });
  if (kept.length < 3) throw new Error(`clipOutlineAtHeight: no outline remains on the ${keep} side at height ${height}.`);
  return kept;
};

/** Split a wall host against a roof line y = slope × local x + constant. */
export const clipOutlineAtLine = (
  outline: ReadonlyArray<{ x: number; y: number }>, slope: number, constant: number,
  keep: "below" | "above",
): Array<{ x: number; y: number }> => {
  if (outline.length < 3 || !Number.isFinite(slope) || !Number.isFinite(constant) ||
    outline.some((q) => !Number.isFinite(q.x) || !Number.isFinite(q.y))) {
    throw new Error("clipOutlineAtLine: a closed finite single outline and a finite cut line are required.");
  }
  const signed = (q: { x: number; y: number }): number => q.y - slope * q.x - constant;
  const inside = (q: { x: number; y: number }): boolean =>
    keep === "below" ? signed(q) <= 1e-9 : signed(q) >= -1e-9;
  const out: Array<{ x: number; y: number }> = [];
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    if (inside(a)) out.push({ ...a });
    if (inside(a) === inside(b)) return;
    const da = signed(a);
    const db = signed(b);
    if (Math.abs(db - da) <= 1e-12) return;
    const t = -da / (db - da);
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  });
  const kept = out.filter((q, i) => {
    const next = out[(i + 1) % out.length]!;
    return Math.hypot(q.x - next.x, q.y - next.y) > 1e-9;
  });
  if (kept.length < 3) throw new Error(`clipOutlineAtLine: no outline remains on the ${keep} side.`);
  return kept;
};

/**
 * Local XY outline of a boundary face: length [from,to], from the bottom to the real top.
 * The top is sampled at each column vertex's length coordinate along the wall centre line.
 */
export const wallHostOutline = (
  wall: WallSpec, roof: readonly RoofPatch[],
  requestedFrom: number, requestedTo: number, midline: number,
): Array<{ x: number; y: number }> => {
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
