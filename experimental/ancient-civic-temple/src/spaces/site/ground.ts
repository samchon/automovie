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
 * @evidence principles/core/source-units.md#source-scope-preservation 세 종류만 허용한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 문자열 합집합 타입으로 조각 표와 표면 ID가 같은 이름을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 세 표면 owner를 그대로 담는다.
 */
export type TempleSiteSurface = "earth" | "paving" | "ground";

/**
 * @evidence spaces/site.md 대지 구획 조각 하나(ID·표면·사각 범위)의 타입이다.
 * @evidence principles/core/source-units.md#source-scope-preservation 구획표의 한 행만 담는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 세 필드로 지면 면·support가 같은 조각을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 구획 행 구성을 그대로 담는다.
 */
export interface TempleSitePiece {
  /**
   * @evidence spaces/site.md TempleSitePiece.id는 earth.front-west 같은 구획 ID다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSitePiece.id는 구획 ID 문자열만 담는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSitePiece.id는 string으로 support ID support.site.<id>.<n>이 만들어진다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSitePiece.id는 site.md#site-paving의 구획 이름을 그대로 담는다.
   */
  id: string;
  /**
   * @evidence spaces/site.md TempleSitePiece.surface는 조각의 표면 종류다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSitePiece.surface는 earth·paving·ground 셋 중 하나만 담는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSitePiece.surface는 TempleSiteSurface로 지면 면의 surface.site.<종류> ID가 정해진다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSitePiece.surface는 site.md#site-paving의 흙·포장·이웃 바닥 표면 구분을 그대로 담는다.
   */
  surface: TempleSiteSurface;
  /**
   * @evidence spaces/site.md TempleSitePiece.rect는 조각의 평면 사각 범위다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSitePiece.rect는 평면 사각 범위만 담고 높이는 지면 규칙에서 받는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSitePiece.rect는 PlanRectangle로 gradeBands가 경사 전환선에서 조각을 나눈다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSitePiece.rect는 site.md#site-paving의 구획 범위를 그대로 담는다.
   */
  rect: PlanRectangle;
}

const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
const entry = { west: -l.entryHalfWidth, east: l.entryHalfWidth };

/**
 * 표의 구획을 서로 겹치지 않는 직사각형으로 낸다.
 * @evidence spaces/site.md 흙띠·포장·이웃 바닥을 서로 겹치지 않는 열여섯 사각 조각으로 낸다.
 * @evidence spaces/site.md#site-paving 정면·서·동·북 흙띠, 정면 거리·서/동 골목·북 골목·정문 진입·서비스 앞마당 포장, 네 이웃 바닥을 구획표대로 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 구획표에 없는 조각이나 개별 포장석을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 조각 목록을 돌려줘 지면 면과 support가 같은 구획을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 구획표를 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 끊김 위치는 진입 폭과 앞마당 범위에서만 온다.
 * @evidence principles/core/source-units.md#source-substantive-completion 사각 조각 목록을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 경계석 고리와 두 끊김을 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 전환선에서만 나누고 범위를 바꾸지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 범위·평면 쌍 목록을 돌려줘 각 조각이 한 평면 위에 놓인다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade의 세 구간 규칙을 그대로 쓴다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 윗면 하나만 내고 두께나 옆면을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 경사 띠마다 prism 윗면과 같은 순서의 네 꼭짓점 면을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 열린 지면 표면 규칙을 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 조각 표와 지면 평면만 소비한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 열여섯 구획의 경사 띠마다 윗면 하나씩 면 목록을 돌려주며 site-ground model이 열린 표면으로 결산된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 흙·포장·이웃 바닥 표면을 그대로 구현했다.
 */
export const templeSiteGroundFaces = (): WallFace[] =>
  templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));

/**
 * 경계석 조각끼리 맞닿는 끝면은 제거해 한 띠로 잇는다.
 * @evidence spaces/site.md 경계석을 지면 아래 0.1m에서 위 0.12m까지의 닫힌 띠로 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 경계석 조각과 지면 평면만 쓰고 맞닿은 끝면은 culling해 한 띠로 잇는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 여섯 경계석 조각을 경사 띠마다 prism으로 만든 뒤 맞닿은 끝면을 지운 면 목록을 돌려주며 site-curbs model이 닫힌 실체로 결산된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 경계석 단면을 그대로 구현했다.
 */
export const templeSiteCurbFaces = (): WallFace[] => cullCoincidentVerticalFaces(
  templeSiteCurbs().flatMap((rect) => gradeBands(rect)).flatMap(({ rect, plane }) =>
    prismFaces(rectanglePolygon(rect), offset(plane, -l.curbEmbed), offset(plane, l.curbRise))
      .map((face) => ({ surface: "surface.site.curb", corners: face.corners }))),
);

/**
 * 흙띠와 포장 조각의 보행 support. 이웃 바닥과 경계석은 보행 목록 밖이다.
 * @evidence spaces/site.md 흙띠·포장·이웃 바닥 조각의 보행 support를 지면 평면 높이 규칙으로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 조각마다 경사 띠 하나씩 plane 높이 support를 만들고 경계석은 넣지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieBuiltSurface 목록을 돌려주며 대지 관찰 눈높이가 이 support를 읽는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-grade와 #site-paving의 지면·구획을 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation ID 접두어로 이웃 바닥만 뺀다.
 * @evidence principles/core/source-units.md#source-substantive-completion 문자열 목록을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-paving의 보행 범위(흙띠·포장)를 그대로 쓴다.
 */
export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] =>
  supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
