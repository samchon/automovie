/**
 * 평면 볼록 벽 host를 길이 방향 구간·지붕 조각·개구부로 나눈 볼록 기둥의
 * 닫힌 프리즘 집합으로 만든다. 상단은 지정한 합성 단위(tier)의 실제 지붕
 * 하부 평면 또는 명시한 평평한 높이(파라펫/마당 벽 코핑), 하단은 호출자의
 * 공통 하단이다. 개구부 구간의 기둥은 문턱 아래·인방 위(창은 창대 아래·위)만
 * 남아 실제 void와 reveal이 생긴다. 긴 면은 옆 지붕 선으로 실내/접면/외면 띠로
 * 나눌 수 있다. 기둥 경계의 내부 접면은 인접 기둥 안에 숨는다(수치 한계 1e-9 m).
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
    /** 석재 코핑 두께(m). 있으면 벽 실체는 height-coping에서 가려진 받침면으로 끝나고 코핑은 wall-trim이 만든다. */
    coping?: number;
  };

/** 긴 면을 옆 지붕으로 나누는 규칙. within 기본값은 joint(가려진 접면)다. */
export interface WallFaceSplit {
  tier: RoofPatch["tier"];
  above: string;
  within?: string;
}

/** 길이 좌표 [from,to]의 윗면 정책과 low/high 쪽 긴 면의 표면 소유. */
export interface WallSegment {
  from: number;
  to: number;
  low: string;
  high: string;
  top: WallTop;
  lowSplit?: WallFaceSplit;
  highSplit?: WallFaceSplit;
}

/** 길이 구간과 수직 구간으로 정의한 실제 void(틀 포함 개구부 윤곽). */
export interface WallVoid {
  id: string;
  from: number;
  to: number;
  bottom: number;
  top: number;
}

export interface WallSpec {
  /** element/model 식별자에 쓰는 벽 ID. */
  id: string;
  /** reveal·joint·bearing·footing 표면 소유자 이름. */
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

/** 한 기둥의 실제 상단 평면과 수직 구간. */
export interface WallColumn {
  polygon: PlanPoint[];
  top: HeightPlane;
  intervals: Array<{ bottom: HeightPlane; top: HeightPlane; uppermost: boolean }>;
  segment: WallSegment;
}

const along = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.x : p.z;
const across = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.z : p.x;

/** 길이 방향 반평면 clip. value 이상(sign=1) 또는 이하(sign=-1). */
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

/** 옆 지붕 조각 경계가 긴 면 선을 지나는 길이 좌표. 띠 분할의 기둥 절단선이다. */
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
 * 벽 기둥 분해. 지붕 정책 구간이 지정 단위의 합성 지붕으로 완전히 덮이지
 * 않거나 개구부 상단보다 지붕 하부가 낮으면 거짓 벽을 만들지 않고 오류다.
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
    if (segment === undefined) throw new Error(`${wall.id}: 길이 ${mid}에 윗면/소유 구간이 없습니다.`);
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
        throw new Error(`${wall.id}: 길이 ${c0}~${c1}의 ${top.tier} 지붕 덮임 ${covered}m²가 ${area(strip)}m²와 다릅니다.`);
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
          throw new Error(`${wall.id}: 상단 ${planeHeight(piece.top, p)}가 void/하단 ${lower.constant}보다 낮습니다.`);
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

/** 기둥 프리즘의 면을 표면 소유별로 분류하고, 지정한 긴 면은 옆 지붕으로 띠를 나눈다. */
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

/** 면 중점에서 바깥 법선 쪽 1mm의 지붕 조각(해당 단위). */
const adjacentPatch = (
  roof: readonly RoofPatch[], tier: RoofPatch["tier"], corners: readonly IAutoMovieVector3[], normal: PlanPoint,
): RoofPatch | undefined => {
  const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
  const cz = corners.reduce((s, c) => s + c.z, 0) / corners.length;
  const probe = { x: cx + normal.x * 1e-3, z: cz + normal.z * 1e-3 };
  return roof.find((r) => r.tier === tier && containsPoint(r.polygon, probe));
};

/**
 * host 윤곽(x 단조 다각형: 수평 하단, 위쪽 꺾은선)을 수평선으로 잘라 그 아래
 * 또는 위 부분만 남긴다. 한 host를 높이에서 두 경계로 나눌 때 쓴다.
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
  if (kept.length < 3) throw new Error(`clipOutlineAtHeight: 높이 ${height}에서 ${keep} 쪽 윤곽이 남지 않습니다.`);
  return kept;
};

/** Split a wall host against a roof line y = slope × local x + constant. */
export const clipOutlineAtLine = (
  outline: ReadonlyArray<{ x: number; y: number }>, slope: number, constant: number,
  keep: "below" | "above",
): Array<{ x: number; y: number }> => {
  if (outline.length < 3 || !Number.isFinite(slope) || !Number.isFinite(constant) ||
    outline.some((q) => !Number.isFinite(q.x) || !Number.isFinite(q.y))) {
    throw new Error("clipOutlineAtLine: 닫힌 유한 단일 윤곽과 유한한 절단선이 필요합니다.");
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
  if (kept.length < 3) throw new Error(`clipOutlineAtLine: ${keep} 쪽 윤곽이 남지 않습니다.`);
  return kept;
};

/**
 * 경계 face의 local XY 윤곽: 길이 [from,to], 하단에서 실제 상단까지.
 * 상단은 벽 중심선에서 각 기둥 꼭짓점의 길이 좌표로 표본한다.
 */
export const wallHostOutline = (
  wall: WallSpec, roof: readonly RoofPatch[],
  requestedFrom: number, requestedTo: number, midline: number,
): Array<{ x: number; y: number }> => {
  // 대각 맞댐 끝은 중심선에서 더 짧으므로 요청 구간을 중심선 위 실제 범위로 줄인다.
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
    if (heights.length === 0) throw new Error(`${wall.id}: 길이 ${s}의 host 상단을 찾지 못했습니다.`);
    return Math.min(...heights);
  };
  return [
    { x: from, y: wall.bottom }, { x: to, y: wall.bottom },
    ...samples.map((s) => ({ x: s, y: topAt(Math.min(Math.max(s, from + 1e-6), to - 1e-6)) })),
  ].filter((p, i, list) => i === 0 || Math.hypot(p.x - list[i - 1]!.x, p.y - list[i - 1]!.y) > 1e-9);
};
