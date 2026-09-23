/**
 * 합성 지붕 조각을 법선 두께를 가진 닫힌 slab 프리즘으로 만든다.
 * 상면은 조각의 원래 owner 상부 표면, 옆면은 노출 끝 두께, 하부는 아래
 * 평면 영역(방·벽·외부)에 따라 실내 천장/지지 접면/외부 처마 하부로 나눈다.
 * 조각끼리 맞닿는 내부 옆면은 이웃 slab 안에 숨는다. 하부 분할은 같은 평면
 * 위의 면 분할이며 slab 형상을 바꾸지 않는다.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { partitionPlan, planeHeight, type PlanPoint, type RoofPatch } from "./planar-domain";
import { levelPlane, prismFaces } from "./prism";
import type { WallFace } from "./wall-solids";

/** 하부 분류 영역. 순서대로 소비하며 남은 영역은 soffit이다. 표면은 지붕 owner별이다. */
export interface UndersideRegion {
  polygon: PlanPoint[];
  surface: (owner: string) => string;
}

export const roofSlabFaces = (
  patches: readonly RoofPatch[],
  verticalThickness: number,
  regions: readonly UndersideRegion[],
): WallFace[] => patches.flatMap((patch) => {
  const under = { ...patch.height, constant: patch.height.constant - verticalThickness };
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
      if (inside.length > 0) faces.push({ surface: region.surface(patch.owner), corners: lift(inside, under) });
      next.push(...outside);
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
