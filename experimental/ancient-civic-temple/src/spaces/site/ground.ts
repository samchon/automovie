/**
 * docs/spaces/site.md#site-paving의 흙띠·경계석·포장·이웃 바닥.
 * 모든 높이는 extent의 지면 규칙에서 유도하고 경사 전환선에서 조각을 나눠
 * 각 조각을 평면으로 만든다. 흙·포장·이웃 바닥은 윗면만 있는 열린 표면,
 * 경계석은 지면 아래에서 위로 솟은 닫힌 띠다. 개별 포장석은 만들지 않는다.
 */
import type { IAutoMovieBuiltSurface } from "@automovie/interface";
import { cullCoincidentVerticalFaces } from "../../geometry/face-culling";
import { rectanglePolygon, type HeightPlane, type PlanRectangle } from "../../geometry/planar-domain";
import { prismFaces } from "../../geometry/prism";
import type { WallFace } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import {
  templeSiteCurbOuter as curb, templeSiteExtent as e, templeSiteGradeBreaks,
  templeSiteGradePlane, templeSiteLaneOuter as lane, templeSiteLines as l,
} from "./extent";

/**
 * @evidence spaces/site.md 대지 조각의 표면 종류(earth·paving·ground)다.
 * @evidenceReview spaces/site.md # TempleSiteSurface의 earth·paving·ground 세 값이 흙띠·포장·이웃 지면의 서로 다른 표면 owner다.
 * @evidence principles/core/source-units.md#source-scope-preservation 세 종류만 허용한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 문자열 합집합 밖의 경계석·나무 표면을 지면 조각 종류로 넣지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 문자열 합집합 타입으로 조각 표와 표면 ID가 같은 이름을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # SitePiece.surface와 surface.site.<종류> 생성 모두 이 세 토큰을 사용한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 세 표면 owner를 그대로 담는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 세 재료 영역의 설계상 owner 이름만 타입화했고 개별 포장재 부재를 공간층으로 끌어오지 않았다.
 */
export type TempleSiteSurface = "earth" | "paving" | "ground";

/**
 * @evidence spaces/site.md 대지 구획 조각 하나(ID·표면·사각 범위)의 타입이다.
 * @evidenceReview spaces/site.md # TempleSitePiece 한 행은 안정 ID, earth/paving/ground owner, 네 끝선 rect를 모두 갖는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 구획표의 한 행만 담는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 인터페이스에 지면 높이나 이웃 원형은 없고 구획 식별·표면·범위만 있다.
 * @evidence principles/core/source-units.md#source-substantive-completion 세 필드로 지면 면·support가 같은 조각을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # groundFaces와 siteSupports가 동일 SitePiece의 id·surface·rect를 받아 면과 지지 ID를 묶는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 구획 행 구성을 그대로 담는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 부모의 구획표가 가진 세 필드만 타입에 올리고 새 네 번째 측량값을 요구하지 않았다.
 */
export interface TempleSitePiece {
  /**
   * @evidence spaces/site.md TempleSitePiece.id는 earth.front-west 같은 구획 ID다.
   * @evidenceReview spaces/site.md # id는 earth.front-west처럼 조각별 이름을 담고 이 값을 support.site.<id> 번호 접두어로 다시 쓴다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSitePiece.id는 구획 ID 문자열만 담는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation # string 이름표 한 필드라 조각의 평면 범위나 지면 높이를 id에 인코딩하지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSitePiece.id는 string으로 support ID support.site.<id>.<n>이 만들어진다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion # templeSiteSupports의 template literal이 piece.id를 그대로 사용해 경사 분할 뒤에도 원 구획이 식별된다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSitePiece.id는 site.md#site-paving의 구획 이름을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 구획 이름은 site-paving의 행 ID를 소비하므로 별도 지형 분류 체계를 도입하지 않았다.
   */
  id: string;
  /**
   * @evidence spaces/site.md TempleSitePiece.surface는 조각의 표면 종류다.
   * @evidenceReview spaces/site.md # surface가 earth·paving·ground 중 한 owner로 각 조각을 분류한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSitePiece.surface는 earth·paving·ground 셋 중 하나만 담는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation # TempleSiteSurface 타입으로 curb와 ridge를 구획의 지면 재료처럼 잘못 지정할 수 없다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSitePiece.surface는 TempleSiteSurface로 지면 면의 surface.site.<종류> ID가 정해진다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion # groundFaces가 piece.surface를 surface.site.* ID로 옮겨 열여섯 조각의 마감 owner를 구분한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSitePiece.surface는 site.md#site-paving의 흙·포장·이웃 바닥 표면 구분을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # earth/paving/ground 세 구획 분류가 부모의 흙·포장·이웃 바닥과 일치해 표면 소유를 바꾸지 않았다.
   */
  surface: TempleSiteSurface;
  /**
   * @evidence spaces/site.md TempleSitePiece.rect는 조각의 평면 사각 범위다.
   * @evidenceReview spaces/site.md # rect는 west/east/north/south 범위로 각 포장·흙띠·이웃 바닥 조각의 평면을 지정한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSitePiece.rect는 평면 사각 범위만 담고 높이는 지면 규칙에서 받는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation # PlanRectangle에는 Y가 없고 gradeBands가 별도 plane을 계산하므로 구획 행이 독립 경사를 만들지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSitePiece.rect는 PlanRectangle로 gradeBands가 경사 전환선에서 조각을 나눈다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion # rect를 GradeBands에 넘겨 Z 전환선에서만 추가 밴드를 만드는 평면 입력이다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSitePiece.rect는 site.md#site-paving의 구획 범위를 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 사각 범위를 부모 구획표에서 받아 지면 경사 분할 외의 새로운 필지 조각을 만들지 않았다.
   */
  rect: PlanRectangle;
}

const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
const entry = { west: -l.entryHalfWidth, east: l.entryHalfWidth };

/**
 * 표의 구획을 서로 겹치지 않는 직사각형으로 낸다.
 * @evidence spaces/site.md 흙띠·포장·이웃 바닥을 서로 겹치지 않는 열여섯 사각 조각으로 낸다.
 * @evidenceReview spaces/site.md # SitePieces 배열을 세어 earth 6·paving 6·ground 4의 열여섯 rect이며 중정 내부 땅이나 개별 포장석은 없다.
 * @evidence spaces/site.md#site-paving 정면·서·동·북 흙띠, 정면 거리·서/동 골목·북 골목·정문 진입·서비스 앞마당 포장, 네 이웃 바닥을 구획표대로 둔다.
 * @evidenceReview spaces/site.md#site-paving # 흙띠의 앞 두 조각과 서·동·북, 포장 여섯 구간, ground 네 방향의 ID·끝선을 부모 구획표와 대조했다.
 * @evidence principles/core/source-units.md#source-scope-preservation 구획표에 없는 조각이나 개별 포장석을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 반환 배열은 열여섯 PlanRectangle뿐이고 cobble 개별 mesh 또는 추가 골목 조각을 생성하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 조각 목록을 돌려줘 지면 면과 support가 같은 구획을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # GroundFaces와 Supports가 이 동일한 조각 목록을 순회해 surface와 보행 지지가 같은 rect에서 나온다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 구획표를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 기존 열여섯 영역의 네 끝선을 사용했고 지면 포장 패턴을 spaces가 새로 정하지 않았다.
 */
export const templeSitePieces = (): TempleSitePiece[] => [
  { id: "earth.front-west", surface: "earth", rect: { west: l.curbWest, east: entry.west, north: p.southOuter, south: l.curbSouth } },
  { id: "earth.front-east", surface: "earth", rect: { west: entry.east, east: l.curbEast, north: p.southOuter, south: l.curbSouth } },
  { id: "earth.west", surface: "earth", rect: { west: l.curbWest, east: p.westOuter, north: l.curbNorth, south: p.southOuter } },
  { id: "earth.east-north", surface: "earth", rect: { west: p.eastOuter, east: l.curbEast, north: l.curbNorth, south: apron.north } },
  { id: "earth.east-south", surface: "earth", rect: { west: p.eastOuter, east: l.curbEast, north: apron.south, south: p.southOuter } },
  { id: "earth.north", surface: "earth", rect: { west: p.westOuter, east: p.eastOuter, north: l.curbNorth, south: p.northOuter } },
  { id: "paving.street", surface: "paving", rect: { west: e.west, east: e.east, north: curb.south, south: lane.south } },
  { id: "paving.west-lane", surface: "paving", rect: { west: lane.west, east: curb.west, north: curb.north, south: curb.south } },
  { id: "paving.east-lane", surface: "paving", rect: { west: curb.east, east: lane.east, north: curb.north, south: curb.south } },
  { id: "paving.north-alley", surface: "paving", rect: { west: lane.west, east: lane.east, north: lane.north, south: curb.north } },
  { id: "paving.entry", surface: "paving", rect: { ...entry, north: p.southOuter, south: curb.south } },
  { id: "paving.service-apron", surface: "paving", rect: apron },
  { id: "ground.south", surface: "ground", rect: { west: e.west, east: e.east, north: lane.south, south: e.south } },
  { id: "ground.west", surface: "ground", rect: { west: e.west, east: lane.west, north: e.north, south: curb.south } },
  { id: "ground.east", surface: "ground", rect: { west: lane.east, east: e.east, north: e.north, south: curb.south } },
  { id: "ground.north", surface: "ground", rect: { west: lane.west, east: lane.east, north: e.north, south: lane.north } },
];

/**
 * 경계석 띠. 정문 진입과 서비스 문 앞에서 끊기고 네 모서리에서 닫힌다.
 * @evidence spaces/site.md 경계석 띠 여섯 조각을 정문 진입과 서비스 문 앞에서 끊고 네 모서리에서 닫는다.
 * @evidenceReview spaces/site.md # Curbs의 남쪽 둘·서쪽 하나·동쪽 둘·북쪽 하나가 진입로와 서비스 apron의 두 끊김을 남긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 끊김 위치는 진입 폭과 앞마당 범위에서만 온다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 남면 중단은 entryHalfWidth, 동면 중단은 apron north/south를 읽어 별도 개구 폭을 고르지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 사각 조각 목록을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 여섯 PlanRectangle이 curb 내부·외부 선 사이의 폭을 유지한 채 닫힌 띠 조립 입력을 제공한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 경계석 고리와 두 끊김을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 부모가 지정한 정문과 서비스 문 앞 두 틈만 두어 접근 경로를 막는 새 경계석을 더하지 않았다.
 */
export const templeSiteCurbs = (): PlanRectangle[] => [
  { west: curb.west, east: entry.west, north: l.curbSouth, south: curb.south },
  { west: entry.east, east: curb.east, north: l.curbSouth, south: curb.south },
  { west: curb.west, east: l.curbWest, north: curb.north, south: l.curbSouth },
  { west: l.curbEast, east: curb.east, north: curb.north, south: apron.north },
  { west: l.curbEast, east: curb.east, north: apron.south, south: l.curbSouth },
  { west: l.curbWest, east: l.curbEast, north: curb.north, south: l.curbNorth },
];

/**
 * 경사 전환선에서 나눈 평면 조각과 그 지면 평면.
 * @evidence spaces/site.md 사각 범위를 경사 전환선에서 나눠 조각마다 지면 평면을 붙인다.
 * @evidenceReview spaces/site.md # GradeBands는 두 break 중 사각 내부에 든 선만 cuts에 넣고 각 밴드 중간 Z로 grade plane을 고른다.
 * @evidence principles/core/source-units.md#source-scope-preservation 전환선에서만 나누고 범위를 바꾸지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 시작·끝과 실제 내부 break만 사용하며 원 rect의 west/east는 그대로 두고 추가 가로줄을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 범위·평면 쌍 목록을 돌려줘 각 조각이 한 평면 위에 놓인다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 slice의 north/south와 대응 HeightPlane이 함께 반환되어 윗면 네 꼭짓점이 같은 평면식을 따른다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 세 구간 규칙을 그대로 쓴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 기존 yardFront·southOuter 두 전환에서만 나눠 부모의 세 구간 경사 외 새 등고선을 도입하지 않았다.
 */
export const gradeBands = (rect: PlanRectangle): { rect: PlanRectangle; plane: HeightPlane }[] => {
  const cuts = [rect.north, ...templeSiteGradeBreaks.filter((z) => z > rect.north && z < rect.south), rect.south];
  return cuts.slice(0, -1).map((north, i) => {
    const band = { ...rect, north, south: cuts[i + 1]! };
    return { rect: band, plane: templeSiteGradePlane((band.north + band.south) / 2) };
  });
};

const offset = (plane: HeightPlane, dy: number): HeightPlane => ({ ...plane, constant: plane.constant + dy });

/**
 * 윗면만 가진 열린 지면 표면. prism 윗면과 같은 꼭짓점 순서를 쓴다.
 * @evidence spaces/site.md 지면 조각의 윗면만 가진 열린 표면을 만든다.
 * @evidenceReview spaces/site.md # gradeTopFaces가 각 band의 네 높이 꼭짓점으로 surface ID 하나의 열린 윗면만 반환한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 윗면 하나만 내고 두께나 옆면을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # rectangle polygon을 한 면으로 되돌리고 prism 측면·아랫면은 생성하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 경사 띠마다 prism 윗면과 같은 순서의 네 꼭짓점 면을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 band의 grade plane을 네 X/Z 꼭짓점에 평가하고 뒤집힌 winding의 WallFace를 한 장씩 낸다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 열린 지면 표면 규칙을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 포장과 이웃 바닥을 닫힌 토막 체적으로 만들지 않아 부모의 열린 지면 표현을 보존했다.
 */
export const gradeTopFaces = (rect: PlanRectangle, surface: string, lift = 0): WallFace[] =>
  gradeBands(rect).map(({ rect: band, plane }) => ({
    surface,
    corners: rectanglePolygon(band).map((q) => ({
      x: q.x, y: plane.x * q.x + plane.z * q.z + plane.constant + lift, z: q.z,
    })).reverse(),
  }));

/**
 * @evidence spaces/site.md 모든 구획 조각의 윗면을 surface.site.<종류>로 낸다.
 * @evidenceReview spaces/site.md # GroundFaces는 SitePieces 전부를 순회해 각 조각의 earth·paving·ground ID로 gradeTopFaces를 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 조각 표와 지면 평면만 소비한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 각 면 입력은 piece.rect와 piece.surface뿐이고 개별 포장석 반복이나 terrain noise가 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion 열여섯 구획의 경사 띠마다 윗면 하나씩 면 목록을 돌려주며 site-ground model이 열린 표면으로 결산된다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 열여섯 원구획을 경사 밴드로 분해한 후 각 윗면이 site-ground model에 결속될 목록으로 나온다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 흙·포장·이웃 바닥 표면을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 세 종류 owner만 출력하고 새로운 fourth paving 표면을 만들지 않아 부모 site-paving 소유가 유지된다.
 */
export const templeSiteGroundFaces = (): WallFace[] =>
  templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));

/**
 * 경계석 조각끼리 맞닿는 끝면은 제거해 한 띠로 잇는다.
 * @evidence spaces/site.md 경계석을 지면 아래 0.1m에서 위 0.12m까지의 닫힌 띠로 만든다.
 * @evidenceReview spaces/site.md # CurbFaces가 각 grade band의 plane을 −embed와 +rise로 평행 이동해 지면 안팎을 잇는 prism 띠를 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 경계석 조각과 지면 평면만 쓰고 맞닿은 끝면은 culling해 한 띠로 잇는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 여섯 curb rect를 prismFaces로 만들고 cullCoincidentVerticalFaces가 내부 맞댐 끝면을 제거한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 여섯 경계석 조각을 경사 띠마다 prism으로 만든 뒤 맞닿은 끝면을 지운 면 목록을 돌려주며 site-curbs model이 닫힌 실체로 결산된다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 사각의 경사 밴드를 높이 양끝 prism으로 닫고 겹친 수직 접면을 지워 curb model의 외부 면만 반환한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 경계석 단면을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 경계석의 지면 아래 0.10m·위 0.12m 단면은 부모 높이에서 왔고 새로운 차도 턱 높이를 고르지 않았다.
 */
export const templeSiteCurbFaces = (): WallFace[] => cullCoincidentVerticalFaces(
  templeSiteCurbs().flatMap((rect) => gradeBands(rect)).flatMap(({ rect, plane }) =>
    prismFaces(rectanglePolygon(rect), offset(plane, -l.curbEmbed), offset(plane, l.curbRise))
      .map((face) => ({ surface: "surface.site.curb", corners: face.corners }))),
);

/**
 * 흙띠와 포장 조각의 보행 support. 이웃 바닥과 경계석은 보행 목록 밖이다.
 * @evidence spaces/site.md 흙띠·포장·이웃 바닥 조각의 보행 support를 지면 평면 높이 규칙으로 낸다.
 * @evidenceReview spaces/site.md # SiteSupports는 열여섯 조각의 경사 band마다 floor surface를 생성해 대지 관찰에 실제 지면 높이를 제공한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 조각마다 경사 띠 하나씩 plane 높이 support를 만들고 경계석은 넣지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 지원 목록은 templeSitePieces만 순회하고 curb rect는 입력하지 않아 경계석 상단을 걷는 support로 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieBuiltSurface 목록을 돌려주며 대지 관찰 눈높이가 이 support를 읽는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 각 built surface에 support.site ID, band polygon, slopeX/Z와 originHeight가 있어 supportHeight가 관찰 눈높이를 재구성한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade와 #site-paving의 지면·구획을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 부모의 구획 rect와 세 구간 grade plane만 support로 내어 별도 보행 지형을 발명하지 않았다.
 */
export const templeSiteSupports = (space: string): IAutoMovieBuiltSurface[] =>
  templeSitePieces().flatMap((piece) => gradeBands(piece.rect).map(({ rect, plane }, i) => ({
    space,
    surface: {
      id: `support.site.${piece.id}.${i}`, kind: "floor" as const,
      polygon: rectanglePolygon(rect).map((q) => ({ x: q.x, y: 0, z: q.z })),
      height: { kind: "plane" as const, originHeight: plane.constant, slopeX: plane.x, slopeZ: plane.z },
    },
  })));

/**
 * @evidence spaces/site.md support 중 이웃 바닥을 뺀 보행 가능 ID 목록을 만든다.
 * @evidenceReview spaces/site.md # Walkable은 supports에서 ground.* 이웃 구획 ID를 제외하고 earth·paving support ID만 반환한다.
 * @evidence principles/core/source-units.md#source-scope-preservation ID 접두어로 이웃 바닥만 뺀다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 필터가 support.site.ground. 접두어만 지워 흙띠와 포장 구획은 보행에서 유지한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 문자열 목록을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 반환값이 surface.id 문자열 배열이라 environment.walkable에 실제 support ID를 그대로 결속한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 보행 범위(흙띠·포장)를 그대로 쓴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 이웃 ground.*만 보행 목록에서 빼 부모가 정한 흙띠·포장 접근 범위를 유지했다.
 */
export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] =>
  supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
