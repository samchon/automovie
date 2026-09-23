/**
 * docs/spaces/site.md#distant-ridge의 먼 능선과 기슭.
 * 능선은 원점 중심 고리의 열린 표면(안쪽·바깥 경사 삼각형)이고 기슭은
 * 국소 대지 밖에서 한 변 220m 사각형까지 지면 규칙을 이어받는다.
 * 보행 support·공간 cell·배치 구역에 넣지 않는 배경 표면이다.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { PlanRectangle } from "../../geometry/planar-domain";
import type { WallFace } from "../../geometry/wall-solids";
import { templeSiteExtent as e } from "./extent";
import { gradeTopFaces } from "./ground";

export const templeRidge = {
  innerFoot: 56, crest: 88, outerFoot: 108, footHeight: -0.3, segments: 72, farHalf: 110,
} as const;

/** 방위각 φ(정면 +Z에서 0, 동쪽 +X로 증가)의 마루 높이(m). */
export const templeRidgeCrest = (phi: number): number =>
  7.0 - 2.5 * Math.cos(phi) + 1.2 * Math.sin(3 * phi + 0.7) + 0.6 * Math.sin(7 * phi + 1.9);

const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});

/** 조각마다 안쪽 경사 두 삼각형과 바깥 경사 두 삼각형. 윗면이 바깥을 본다. */
export const templeRidgeFaces = (): WallFace[] => {
  const r = templeRidge;
  const surface = "surface.site-distant.ridge";
  return Array.from({ length: r.segments }, (_, i) => {
    const a = (2 * Math.PI * i) / r.segments;
    const b = (2 * Math.PI * (i + 1)) / r.segments;
    const ia = at(r.innerFoot, a, r.footHeight);
    const ib = at(r.innerFoot, b, r.footHeight);
    const ca = at(r.crest, a, templeRidgeCrest(a));
    const cb = at(r.crest, b, templeRidgeCrest(b));
    const oa = at(r.outerFoot, a, r.footHeight);
    const ob = at(r.outerFoot, b, r.footHeight);
    return [
      { surface, corners: [ia, ca, cb] }, { surface, corners: [ia, cb, ib] },
      { surface, corners: [ca, oa, ob] }, { surface, corners: [ca, ob, cb] },
    ];
  }).flat();
};

/** 국소 대지 범위를 둘러싼 네 기슭 띠. */
export const templeFootholdRects = (): PlanRectangle[] => {
  const h = templeRidge.farHalf;
  return [
    { west: -h, east: h, north: e.south, south: h },
    { west: -h, east: h, north: -h, south: e.north },
    { west: -h, east: e.west, north: e.north, south: e.south },
    { west: e.east, east: h, north: e.north, south: e.south },
  ];
};

export const templeFootholdFaces = (): WallFace[] =>
  templeFootholdRects().flatMap((rect) => gradeTopFaces(rect, "surface.site-distant.ground"));
