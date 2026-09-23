/**
 * 합성 지붕 조각을 법선 두께를 가진 닫힌 slab 프리즘으로 만든다.
 * 상면은 조각의 원래 owner 상부 표면, 옆면은 노출 끝 두께, 하부는 아래
 * 평면 영역(방·벽·외부)에 따라 실내 천장/지지 접면/외부 처마 하부로 나눈다.
 * 조각끼리 맞닿는 내부 옆면은 이웃 slab 안에 숨는다. 하부 분할은 같은 평면
 * 위의 면 분할이며 slab 형상을 바꾸지 않는다.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { partitionPlan, planeHeight, simplifyPlan, type PlanPoint, type RoofPatch } from "./planar-domain";
import { levelPlane, prismFaces } from "./prism";
import type { WallFace } from "./wall-solids";

/** 하부 분류 영역. 순서대로 소비하며 남은 영역은 soffit이다. 표면은 지붕 owner별이다. */
export interface UndersideRegion {
  polygon: PlanPoint[];
  surface: (owner: string) => string;
}

export const roofSlabFaces = (
  patches: readonly RoofPatch[],
  regions: readonly UndersideRegion[],
): WallFace[] => patches.flatMap((patch) => {
  const under = { ...patch.height, constant: patch.height.constant - patch.thickness };
  const faces: WallFace[] = [];
  for (const face of prismFaces(patch.polygon, under, patch.height)) {
    if (face.side === "top") faces.push({ surface: patch.surface, corners: face.corners });
    else if (face.side === "edge") faces.push({ surface: `surface.${patch.owner}.edge`, corners: face.corners });
  }
  let remaining: PlanPoint[][] = [patch.polygon];
  for (const region of regions) {
    const next: PlanPoint[][] = [];
    for (const piece of remaining) {
      const { inside, outside } = partitionPlan(piece, region.polygon);
      const kept = simplifyPlan(inside);
      if (kept.length > 0) faces.push({ surface: region.surface(patch.owner), corners: lift(kept, under) });
      next.push(...outside.map(simplifyPlan).filter((piece) => piece.length > 0));
    }
    remaining = next;
  }
  for (const piece of remaining) {
    faces.push({ surface: `surface.${patch.owner}.soffit`, corners: lift(piece, under) });
  }
  return faces;
});

/** 방 소유 널판 천장. 아랫면만 방의 노출 천장이고 나머지는 구조 틈의 면이다. */
export const ceilingBoardFaces = (
  space: string, polygon: readonly PlanPoint[], underside: number, thickness: number,
): WallFace[] => prismFaces(polygon, levelPlane(underside), levelPlane(underside + thickness))
  .map((face) => ({
    surface: face.side === "bottom" ? `surface.${space}.ceiling` : `surface.${space}.ceiling-back`,
    corners: face.corners,
  }));

/** 하부 면: 아래를 향하도록 다각형 순서 그대로 평면 위로 올린다. */
const lift = (polygon: readonly PlanPoint[], plane: Parameters<typeof planeHeight>[0]): IAutoMovieVector3[] =>
  polygon.map((p) => ({ x: p.x, y: planeHeight(plane, p), z: p.z }));

/**
 * 같은 합성 단위에서 맞닿은 두 조각의 높이 차이를 닫는 끝면.
 * 높은 조각의 하부가 낮은 조각의 상면보다 위에 있는 공통 변 구간에서,
 * 높은 조각 소유의 수직 면으로 그 사이를 막는다(junctions의 높이 차이 규칙).
 */
export const roofStepClosures = (patches: readonly RoofPatch[]): WallFace[] => {
  const faces: WallFace[] = [];
  for (const a of patches) {
    for (const b of patches) {
      if (a === b || a.tier !== b.tier) continue;
      a.polygon.forEach((a0, i) => {
        const a1 = a.polygon[(i + 1) % a.polygon.length]!;
        const length = Math.hypot(a1.x - a0.x, a1.z - a0.z);
        const ux = (a1.x - a0.x) / length;
        const uz = (a1.z - a0.z) / length;
        b.polygon.forEach((b0, j) => {
          const b1 = b.polygon[(j + 1) % b.polygon.length]!;
          const offLine = (p: PlanPoint) => Math.abs((p.x - a0.x) * uz - (p.z - a0.z) * ux);
          if (offLine(b0) > 1e-6 || offLine(b1) > 1e-6) return;
          const t0 = (b0.x - a0.x) * ux + (b0.z - a0.z) * uz;
          const t1 = (b1.x - a0.x) * ux + (b1.z - a0.z) * uz;
          if (t0 < t1) return; // 공통 변은 서로 반대 방향이어야 한다.
          const from = Math.max(0, t1);
          const to = Math.min(length, t0);
          if (to - from < 1e-4) return;
          const at = (t: number) => ({ x: a0.x + ux * t, z: a0.z + uz * t });
          const gap = (t: number) => planeHeight(a.height, at(t)) - a.thickness - planeHeight(b.height, at(t));
          const cuts = [from, to];
          const g0 = gap(from);
          const g1 = gap(to);
          if (g0 * g1 < 0) cuts.splice(1, 0, from + (to - from) * g0 / (g0 - g1));
          for (let k = 0; k + 1 < cuts.length; ++k) {
            const p = cuts[k]!;
            const q = cuts[k + 1]!;
            if (gap((p + q) / 2) <= 1e-4) continue;
            const corner = (t: number, upper: boolean) => {
              const point = at(t);
              const y = upper ? planeHeight(a.height, point) - a.thickness : planeHeight(b.height, point);
              return { x: point.x, y, z: point.z };
            };
            const raw = [corner(p, false), corner(p, true), corner(q, true), corner(q, false)];
            const kept = raw.filter((c, n) => {
              const next = raw[(n + 1) % raw.length]!;
              return Math.hypot(c.x - next.x, c.y - next.y, c.z - next.z) > 1e-6;
            });
            if (kept.length >= 3) faces.push({ surface: `surface.${a.owner}.edge`, corners: kept });
          }
        });
      });
    }
  }
  return faces;
};
