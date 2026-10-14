/**
 * Soil strips, curbs, paving and neighboring ground from site-paving.
 * Heights derive from extent's grade rule; pieces split at grade breaks into
 * planar spans. Soil, paving and neighboring ground are open top surfaces.
 * Curbs are closed bands extending below and above ground; paving has no individual stones.
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
export interface TempleSitePiece {
  id: string;
  surface: TempleSiteSurface;
  rect: PlanRectangle;
}

const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
const entry = { west: -l.entryHalfWidth, east: l.entryHalfWidth };

/**
 * Emit table divisions as nonoverlapping rectangles.
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
 * Curb bands break at entry and service doors and close at four corners.
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
 * Plan pieces split at grade breaks with their ground planes.
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
 * Open ground top surface, using the same vertex order as a prism top.
 */
export const gradeTopFaces = (rect: PlanRectangle, surface: string, lift = 0): WallFace[] =>
  gradeBands(rect).map(({ rect: band, plane }) => ({
    surface,
    corners: rectanglePolygon(band).map((q) => ({
      x: q.x, y: plane.x * q.x + plane.z * q.z + plane.constant + lift, z: q.z,
    })).reverse(),
  }));
export const templeSiteGroundFaces = (): WallFace[] =>
  templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));

/**
 * Cull touching curb end faces to join pieces into one band.
 */
export const templeSiteCurbFaces = (): WallFace[] => cullCoincidentVerticalFaces(
  templeSiteCurbs().flatMap((rect) => gradeBands(rect)).flatMap(({ rect, plane }) =>
    prismFaces(rectanglePolygon(rect), offset(plane, -l.curbEmbed), offset(plane, l.curbRise))
      .map((face) => ({ surface: "surface.site.curb", corners: face.corners }))),
);

/**
 * Walking supports for soil and paving; neighboring ground and curbs are outside the walkable list.
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
export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] =>
  supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
