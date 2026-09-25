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
 * @evidenceReview spaces/site.md # templeRidge의 세 반지름 56/88/108m와 −0.3m 기슭, 72분할·110m 외곽이 먼 배경 한 고리의 설계값에 대응한다.
 * @evidence spaces/site.md#distant-ridge 원점 중심 고리 능선과 국소 대지 밖 기슭의 치수를 설계 값 그대로 옮긴다.
 * @evidenceReview spaces/site.md#distant-ridge # ridge 객체가 56·88·108m 동심 고리와 220m 기슭 사각형의 반폭을 정해 국소 대지 표면과 분리된다.
 * @evidence principles/core/source-units.md#source-scope-preservation 능선 치수만 가진다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 상수에는 배경 거리·높이·분할만 있고 walkable support나 방 cell 정의가 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 능선 면과 기슭 면이 같은 치수를 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # Faces는 segments·세 반지름을, FootholdRects는 farHalf를 같은 객체에서 읽어 배경 외곽 입력을 공유한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 거리와 분할을 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 먼 능선의 치수와 분할은 부모 대지 설계와 같고 이 객체는 보행 영역을 넓히지 않아 상위 수정이 없다.
 */
export const templeRidge = {
  innerFoot: 56, crest: 88, outerFoot: 108, footHeight: -0.3, segments: 72, farHalf: 110,
} as const;

/**
 * 방위각 φ(정면 +Z에서 0, 동쪽 +X로 증가)의 마루 높이(m).
 * @evidence spaces/site.md 방위각의 마루 높이 H(φ)=7.0−2.5·cos φ+1.2·sin(3φ+0.7)+0.6·sin(7φ+1.9)를 계산한다.
 * @evidenceReview spaces/site.md # Crest가 7−2.5cosφ+1.2sin(3φ+0.7)+0.6sin(7φ+1.9)를 항별로 구현해 능선 높이의 방위 변화를 보존한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 설계 식만 계산한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # phi 입력과 부모 식의 네 항만 사용하며 임의 잡음값이나 측정 이미지 높이를 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 숫자를 돌려주며
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 한 phi에서 crest 높이 하나를 반환해 ridge Faces가 각 방위 꼭짓점의 Y로 쓸 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 마루 식을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 방위각 함수가 판정된 주기와 위상 상수 네 항을 그대로 쓰므로 산능선 설계 식을 다시 열지 않았다.
 */
export const templeRidgeCrest = (phi: number): number =>
  7.0 - 2.5 * Math.cos(phi) + 1.2 * Math.sin(3 * phi + 0.7) + 0.6 * Math.sin(7 * phi + 1.9);

const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});

/**
 * 조각마다 안쪽 경사 두 삼각형과 바깥 경사 두 삼각형. 윗면이 바깥을 본다.
 * @evidence spaces/site.md 고리 능선의 안쪽·바깥 경사 삼각형 면을 72조각으로 만든다.
 * @evidenceReview spaces/site.md # 72개 방위각 간격마다 안쪽 두 면과 바깥 두 면을 반환해 마루를 사이에 둔 열린 고리 표면을 이룬다.
 * @evidence principles/core/source-units.md#source-scope-preservation 배경 표면만 내고 보행 support·cell에 넣지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # Face 배열은 surface.site-distant.ridge만 가지고 support나 temple-site cell을 추가하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 윗면이 바깥을 보는 삼각형 면 목록을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 쐐기의 ia·ib·ca·cb·oa·ob가 네 삼각형으로 묶여 안팎 경사면의 바깥 법선을 갖는 면 목록을 만든다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 열린 능선 표면을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 마루 고리를 닫힌 산 체적으로 만들지 않고 안팎 경사 윗면만 내 부모의 배경 표현 한계를 지켰다.
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
 * @evidenceReview spaces/site.md # FootholdRects가 farHalf=110m 사각형에서 local extent를 뺀 남·북·서·동 네 띠를 반환한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 범위 밖만 채운다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 각 띠의 안쪽 끝이 templeSiteExtent의 바깥선에 닿고 중앙 local site를 다시 덮지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 사각 목록을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 반환값은 네 PlanRectangle이라 먼 배경 지면을 gradeTopFaces가 범위별로 받을 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 기슭 범위를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 기슭 바깥은 ±110m, 안쪽은 local extent의 네 선으로 부모 표의 범위를 변경하지 않았다.
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
 * @evidenceReview spaces/site.md # 각 기슭 사각형을 gradeTopFaces로 변환해 먼 배경 지면의 윗면을 site-distant.ground owner로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 지면 규칙을 이어받은 윗면만 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 함수는 gradeTopFaces만 호출하므로 먼 기슭의 옆면·아랫면·보행 support를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 네 기슭 띠의 경사 띠 윗면을 돌려주며 능선 삼각형과 함께 site-distant model이 열린 표면으로 결산된다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 네 rect의 경사 윗면 배열을 반환해 RidgeFaces의 열린 삼각형과 같은 distant model에 결합할 입력을 제공한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#distant-ridge의 기슭 표면을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 먼 기슭도 기존 grade 규칙을 이어 쓰며 새 산 지형 측량값을 발명하지 않아 부모 경사 설계를 유지한다.
 */
export const templeFootholdFaces = (): WallFace[] =>
  templeFootholdRects().flatMap((rect) => gradeTopFaces(rect, "surface.site-distant.ground"));
