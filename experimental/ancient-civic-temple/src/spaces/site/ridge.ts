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

/**
 * @evidence spaces/site.md 먼 능선 고리의 안쪽 기슭 56m·마루 88m·바깥 기슭 108m, 기슭 높이 -0.3m, 72분할, 기슭 반폭 110m를 둔다.
 * @evidence spaces/site.md#distant-ridge 원점 중심 고리 능선과 국소 대지 밖 기슭의 치수를 설계 값 그대로 옮긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 능선 치수만 가진다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 능선 면과 기슭 면이 같은 치수를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 거리와 분할을 그대로 옮겼다.
 */
export const templeRidge = {
  innerFoot: 56, crest: 88, outerFoot: 108, footHeight: -0.3, segments: 72, farHalf: 110,
} as const;

/**
 * 방위각 φ(정면 +Z에서 0, 동쪽 +X로 증가)의 마루 높이(m).
 * @evidence spaces/site.md 방위각의 마루 높이 H(φ)=7.0−2.5·cos φ+1.2·sin(3φ+0.7)+0.6·sin(7φ+1.9)를 계산한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 설계 식만 계산한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 숫자를 돌려주며
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 마루 식을 그대로 구현했다.
 */
export const templeRidgeCrest = (phi: number): number =>
  7.0 - 2.5 * Math.cos(phi) + 1.2 * Math.sin(3 * phi + 0.7) + 0.6 * Math.sin(7 * phi + 1.9);

const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});

/**
 * 조각마다 안쪽 경사 두 삼각형과 바깥 경사 두 삼각형. 윗면이 바깥을 본다.
 * @evidence spaces/site.md 고리 능선의 안쪽·바깥 경사 삼각형 면을 72조각으로 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 배경 표면만 내고 보행 support·cell에 넣지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 윗면이 바깥을 보는 삼각형 면 목록을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 열린 능선 표면을 그대로 구현했다.
 */
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

/**
 * 국소 대지 범위를 둘러싼 네 기슭 띠.
 * @evidence spaces/site.md 국소 대지 범위를 둘러싼 네 기슭 띠를 한 변 220m 사각형 안에 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 범위 밖만 채운다.
 * @evidence principles/core/source-units.md#source-substantive-completion 사각 목록을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 기슭 범위를 그대로 구현했다.
 */
export const templeFootholdRects = (): PlanRectangle[] => {
  const h = templeRidge.farHalf;
  return [
    { west: -h, east: h, north: e.south, south: h },
    { west: -h, east: h, north: -h, south: e.north },
    { west: -h, east: e.west, north: e.north, south: e.south },
    { west: e.east, east: h, north: e.north, south: e.south },
  ];
};

/**
 * @evidence spaces/site.md 기슭 띠의 지면 윗면을 surface.site-distant.ground로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 지면 규칙을 이어받은 윗면만 만든다.
 * @evidence principles/core/source-units.md#source-substantive-completion 네 기슭 띠의 경사 띠 윗면을 돌려주며 능선 삼각형과 함께 site-distant model이 열린 표면으로 결산된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 기슭 표면을 그대로 구현했다.
 */
export const templeFootholdFaces = (): WallFace[] =>
  templeFootholdRects().flatMap((rect) => gradeTopFaces(rect, "surface.site-distant.ground"));
