/**
 * 평면 볼록 벽 host를 길이 방향 구간·지붕 조각·개구부로 나눈 볼록 기둥의
 * 닫힌 프리즘 집합으로 만든다. 상단은 실제 합성 지붕의 하부 평면 또는
 * 명시한 평평한 높이, 하단은 호출자의 공통 하단이다. 개구부 구간의 기둥은
 * 문턱 아래·인방 위(창은 창대 아래·위)만 남아 실제 void와 reveal이 생긴다.
 * 기둥 경계의 내부 접면은 인접 기둥 안에 숨으며 노출 표면 소유는 면 방향과
 * 호출자가 정한 양쪽 공간 소유로 결정한다. 수치 오차 한계는 1e-9 m다.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  clipPlan, edgeInside, partitionPlan, planeHeight,
  type HeightPlane, type PlanPoint, type RoofPatch,
} from "./planar-domain";
import { levelPlane, prismFaces } from "./prism";

export type WallTop =
  | { kind: "roof" }
  | { kind: "flat"; height: number; surface: string };

/** 길이 좌표 [from,to]의 윗면 정책과 low/high 쪽 긴 면의 표면 소유. */
export interface WallSegment {
  from: number;
  to: number;
  low: string;
  high: string;
  top: WallTop;
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

/** 한 기둥의 실제 상단 평면. 경계 face 윤곽의 표본에도 쓴다. */
export interface WallColumn {
  polygon: PlanPoint[];
  top: HeightPlane;
  intervals: Array<{ bottom: HeightPlane; top: HeightPlane; uppermost: boolean }>;
}

const along = (axis: "x" | "z", p: PlanPoint): number => axis === "x" ? p.x : p.z;

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

/**
 * 벽 기둥 분해. 지붕 정책 구간이 합성 지붕으로 완전히 덮이지 않거나
 * 개구부 상단보다 지붕 하부가 낮으면 거짓 벽을 만들지 않고 오류다.
 */
export const wallColumns = (
  wall: WallSpec, roof: readonly RoofPatch[], roofThickness: number,
): Array<WallColumn & { segment: WallSegment }> => {
  const coordinates = wall.plan.map((p) => along(wall.axis, p));
  const min = Math.min(...coordinates);
  const max = Math.max(...coordinates);
  const cuts = [...new Set([
    min, max,
    ...wall.segments.flatMap((s) => [s.from, s.to]),
    ...wall.voids.flatMap((v) => [v.from, v.to]),
  ])].filter((c) => c >= min && c <= max).sort((a, b) => a - b);
  const columns: Array<WallColumn & { segment: WallSegment }> = [];
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
    if (segment.top.kind === "flat") {
      pieces.push({ polygon: strip, top: levelPlane(segment.top.height) });
    } else {
      let covered = 0;
      for (const patch of roof) {
        const { inside } = partitionPlan(strip, patch.polygon);
        if (inside.length === 0) continue;
        covered += area(inside);
        pieces.push({ polygon: inside, top: {
          ...patch.height, constant: patch.height.constant - roofThickness,
        } });
      }
      if (Math.abs(covered - area(strip)) > 1e-6) {
        throw new Error(`${wall.id}: 길이 ${c0}~${c1}의 지붕 덮임 ${covered}m²가 ${area(strip)}m²와 다릅니다.`);
      }
    }
    const voids = wall.voids.filter((v) => mid > v.from && mid < v.to)
      .sort((a, b) => a.bottom - b.bottom);
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
        intervals: bounds.map(([bottom, top], index) => ({
          bottom, top, uppermost: index === bounds.length - 1,
        })),
      });
    }
  }
  return columns;
};

/** 기둥 프리즘의 면을 표면 소유별로 분류한다. */
export const wallFaces = (
  wall: WallSpec, roof: readonly RoofPatch[], roofThickness: number,
): WallFace[] => {
  const coordinates = wall.plan.map((p) => along(wall.axis, p));
  const min = Math.min(...coordinates);
  const max = Math.max(...coordinates);
  const surface = (name: string) => name.startsWith("surface.") ? name : `surface.${wall.owner}.${name}`;
  const faces: WallFace[] = [];
  for (const column of wallColumns(wall, roof, roofThickness)) {
    for (const interval of column.intervals) {
      for (const face of prismFaces(column.polygon, interval.bottom, interval.top)) {
        let owner: string;
        if (face.side === "top") {
          owner = !interval.uppermost ? "reveal"
            : column.segment.top.kind === "flat" ? column.segment.top.surface : "bearing";
        } else if (face.side === "bottom") {
          owner = interval.bottom.constant === wall.bottom ? "footing" : "reveal";
        } else {
          const perpendicular = wall.axis === "x" ? face.normal.z : face.normal.x;
          const lengthwise = wall.axis === "x" ? face.normal.x : face.normal.z;
          if (Math.abs(perpendicular) > 1 - 1e-9) {
            owner = perpendicular < 0 ? column.segment.low : column.segment.high;
          } else if (Math.abs(lengthwise) > 1 - 1e-9) {
            const at = along(wall.axis, { x: face.corners[0]!.x, z: face.corners[0]!.z });
            owner = Math.abs(at - min) < 1e-9 ? wall.ends?.low ?? "end"
              : Math.abs(at - max) < 1e-9 ? wall.ends?.high ?? "end" : "reveal";
          } else {
            owner = "joint";
          }
        }
        faces.push({ surface: surface(owner), corners: face.corners });
      }
    }
  }
  return faces;
};

/**
 * 경계 face의 local XY 윤곽: 길이 [from,to], 하단에서 실제 상단까지.
 * 상단은 벽 중심선에서 각 기둥 꼭짓점의 길이 좌표로 표본한다.
 */
export const wallHostOutline = (
  wall: WallSpec, roof: readonly RoofPatch[], roofThickness: number,
  requestedFrom: number, requestedTo: number, midline: number,
): Array<{ x: number; y: number }> => {
  // 대각 맞댐 끝은 중심선에서 더 짧으므로 요청 구간을 중심선 위 실제 범위로 줄인다.
  const crossings = wall.plan.flatMap((a, i) => {
    const b = wall.plan[(i + 1) % wall.plan.length]!;
    const [pa, pb] = wall.axis === "x" ? [a.z, b.z] : [a.x, b.x];
    if ((pa - midline) * (pb - midline) > 0 || pa === pb) return [];
    const t = (midline - pa) / (pb - pa);
    return [along(wall.axis, a) + t * (along(wall.axis, b) - along(wall.axis, a))];
  });
  const from = Math.max(requestedFrom, Math.min(...crossings));
  const to = Math.min(requestedTo, Math.max(...crossings));
  const columns = wallColumns(wall, roof, roofThickness)
    .filter((c) => c.polygon.some((p) => along(wall.axis, p) > from + 1e-9) &&
      c.polygon.some((p) => along(wall.axis, p) < to - 1e-9));
  const samples = [...new Set([from, to, ...columns.flatMap((c) => c.polygon.map((p) => along(wall.axis, p)))])]
    .filter((s) => s >= from - 1e-9 && s <= to + 1e-9).sort((a, b) => b - a);
  const topAt = (s: number): number => {
    const point: PlanPoint = wall.axis === "x" ? { x: s, z: midline } : { x: midline, z: s };
    const heights = columns
      .filter((c) => c.polygon.every((p, i) =>
        planeHeight(edgeInside(p, c.polygon[(i + 1) % c.polygon.length]!), point) >= -1e-6))
      .map((c) => planeHeight(c.top, point));
    if (heights.length === 0) throw new Error(`${wall.id}: 길이 ${s}의 host 상단을 찾지 못했습니다.`);
    return Math.min(...heights);
  };
  return [
    { x: from, y: wall.bottom }, { x: to, y: wall.bottom },
    ...samples.map((s) => ({ x: s, y: topAt(Math.min(Math.max(s, from + 1e-6), to - 1e-6)) })),
  ].filter((p, i, list) => i === 0 || Math.hypot(p.x - list[i - 1]!.x, p.y - list[i - 1]!.y) > 1e-9);
};
