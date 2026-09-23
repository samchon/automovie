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

export type TempleSiteSurface = "earth" | "paving" | "ground";

export interface TempleSitePiece { id: string; surface: TempleSiteSurface; rect: PlanRectangle }

const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
const entry = { west: -l.entryHalfWidth, east: l.entryHalfWidth };

/** 표의 구획을 서로 겹치지 않는 직사각형으로 낸다. */
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

/** 경계석 띠. 정문 진입과 서비스 문 앞에서 끊기고 네 모서리에서 닫힌다. */
export const templeSiteCurbs = (): PlanRectangle[] => [
  { west: curb.west, east: entry.west, north: l.curbSouth, south: curb.south },
  { west: entry.east, east: curb.east, north: l.curbSouth, south: curb.south },
  { west: curb.west, east: l.curbWest, north: curb.north, south: l.curbSouth },
  { west: l.curbEast, east: curb.east, north: curb.north, south: apron.north },
  { west: l.curbEast, east: curb.east, north: apron.south, south: l.curbSouth },
  { west: l.curbWest, east: l.curbEast, north: curb.north, south: l.curbNorth },
];

/** 경사 전환선에서 나눈 평면 조각과 그 지면 평면. */
export const gradeBands = (rect: PlanRectangle): { rect: PlanRectangle; plane: HeightPlane }[] => {
  const cuts = [rect.north, ...templeSiteGradeBreaks.filter((z) => z > rect.north && z < rect.south), rect.south];
  return cuts.slice(0, -1).map((north, i) => {
    const band = { ...rect, north, south: cuts[i + 1]! };
    return { rect: band, plane: templeSiteGradePlane((band.north + band.south) / 2) };
  });
};

const offset = (plane: HeightPlane, dy: number): HeightPlane => ({ ...plane, constant: plane.constant + dy });

/** 윗면만 가진 열린 지면 표면. prism 윗면과 같은 꼭짓점 순서를 쓴다. */
export const gradeTopFaces = (rect: PlanRectangle, surface: string, lift = 0): WallFace[] =>
  gradeBands(rect).map(({ rect: band, plane }) => ({
    surface,
    corners: rectanglePolygon(band).map((q) => ({
      x: q.x, y: plane.x * q.x + plane.z * q.z + plane.constant + lift, z: q.z,
    })).reverse(),
  }));

export const templeSiteGroundFaces = (): WallFace[] =>
  templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));

/** 경계석 조각끼리 맞닿는 끝면은 제거해 한 띠로 잇는다. */
export const templeSiteCurbFaces = (): WallFace[] => cullCoincidentVerticalFaces(
  templeSiteCurbs().flatMap((rect) => gradeBands(rect)).flatMap(({ rect, plane }) =>
    prismFaces(rectanglePolygon(rect), offset(plane, -l.curbEmbed), offset(plane, l.curbRise))
      .map((face) => ({ surface: "surface.site.curb", corners: face.corners }))),
);

/** 흙띠와 포장 조각의 보행 support. 이웃 바닥과 경계석은 보행 목록 밖이다. */
export const templeSiteSupports = (space: string): IAutoMovieBuiltSurface[] =>
  templeSitePieces().flatMap((piece) => gradeBands(piece.rect).map(({ rect, plane }, i) => ({
    space,
    surface: {
      id: `support.site.${piece.id}.${i}`, kind: "floor" as const,
      polygon: rectanglePolygon(rect).map((q) => ({ x: q.x, y: 0, z: q.z })),
      height: { kind: "plane" as const, originHeight: plane.constant, slopeX: plane.x, slopeZ: plane.z },
    },
  })));

export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] =>
  supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
