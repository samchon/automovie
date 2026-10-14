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

/**
 * @evidence spaces/site.md Types the earth, paving and ground surface kinds.
 * @evidence principles/core/source-units.md#source-scope-preservation Allows only three kinds.
 * @evidence principles/core/source-units.md#source-substantive-completion The string union gives the piece table and surface IDs shared names.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents site-paving's three surface owners.
 */
export type TempleSiteSurface = "earth" | "paving" | "ground";

/**
 * @evidence spaces/site.md Types one site division piece: ID, surface and rectangular extent.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains one division-table row.
 * @evidence principles/core/source-units.md#source-substantive-completion Three fields let ground faces and supports share the same piece.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents a site-paving division row.
 */
export interface TempleSitePiece {
  /**
   * @evidence spaces/site.md Division ID such as earth.front-west.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only a division ID string.
   * @evidence principles/core/source-units.md#source-substantive-completion Forms support IDs as support.site.<id>.<n>.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents site-paving division names.
   */
  id: string;
  /**
   * @evidence spaces/site.md Gives the piece's surface kind.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only earth, paving or ground.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSiteSurface determines ground face IDs as surface.site.<kind>.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents soil, paving and neighboring ground distinctions in site-paving.
   */
  surface: TempleSiteSurface;
  /**
   * @evidence spaces/site.md Gives the piece's plan rectangle.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only plan extent; height comes from the grade rule.
   * @evidence principles/core/source-units.md#source-substantive-completion gradeBands splits the PlanRectangle at grade breaks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents site-paving division extents.
   */
  rect: PlanRectangle;
}

const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
const entry = { west: -l.entryHalfWidth, east: l.entryHalfWidth };

/**
 * Emit table divisions as nonoverlapping rectangles.
 * @evidence spaces/site.md Emits sixteen nonoverlapping soil, paving and neighboring ground rectangles.
 * @evidence spaces/site.md#site-paving Uses front/west/east/north soil strips; front street, west/east/north lanes, entry and service apron paving; and four neighboring grounds.
 * @evidence principles/core/source-units.md#source-scope-preservation Adds no pieces outside the division table or individual paving stones.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns pieces shared by ground faces and supports.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the site-paving division table.
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
 * @evidence spaces/site.md Six curb pieces break at the entry and service doors and close at four corners.
 * @evidence principles/core/source-units.md#source-scope-preservation Gap positions come only from entry width and apron extent.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns rectangular pieces.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-paving's curb ring and two gaps.
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
 * @evidence spaces/site.md Splits rectangles at grade breaks and attaches each piece's ground plane.
 * @evidence principles/core/source-units.md#source-scope-preservation Splits only at breaks without changing the extent.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns extent/plane pairs so each piece lies on one plane.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly uses site-grade's three-span rule.
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
 * @evidence spaces/site.md Creates an open surface containing only the ground piece's top.
 * @evidence principles/core/source-units.md#source-scope-preservation Emits one top without thickness or sides.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a four-vertex face in prism-top order for each grade band.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-paving's open ground rule.
 */
export const gradeTopFaces = (rect: PlanRectangle, surface: string, lift = 0): WallFace[] =>
  gradeBands(rect).map(({ rect: band, plane }) => ({
    surface,
    corners: rectanglePolygon(band).map((q) => ({
      x: q.x, y: plane.x * q.x + plane.z * q.z + plane.constant + lift, z: q.z,
    })).reverse(),
  }));

/**
 * @evidence spaces/site.md Emits all piece tops as surface.site.<kind>.
 * @evidence principles/core/source-units.md#source-scope-preservation Consumes only the piece table and ground planes.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns one top per grade band across sixteen divisions, making site-ground an open surface model.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-paving soil, paving and neighboring ground surfaces.
 */
export const templeSiteGroundFaces = (): WallFace[] =>
  templeSitePieces().flatMap((piece) => gradeTopFaces(piece.rect, `surface.site.${piece.surface}`));

/**
 * Cull touching curb end faces to join pieces into one band.
 * @evidence spaces/site.md Makes closed curbs extending 0.1 m below and 0.12 m above ground.
 * @evidence principles/core/source-units.md#source-scope-preservation Uses curb pieces and ground planes, culling touching ends to join the band.
 * @evidence principles/core/source-units.md#source-substantive-completion Builds six curb pieces as grade-band prisms and removes touching end faces, making site-curbs a closed solid model.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the site-paving curb section.
 */
export const templeSiteCurbFaces = (): WallFace[] => cullCoincidentVerticalFaces(
  templeSiteCurbs().flatMap((rect) => gradeBands(rect)).flatMap(({ rect, plane }) =>
    prismFaces(rectanglePolygon(rect), offset(plane, -l.curbEmbed), offset(plane, l.curbRise))
      .map((face) => ({ surface: "surface.site.curb", corners: face.corners }))),
);

/**
 * Walking supports for soil and paving; neighboring ground and curbs are outside the walkable list.
 * @evidence spaces/site.md Emits soil, paving and neighboring ground supports using the ground plane height rule.
 * @evidence principles/core/source-units.md#source-scope-preservation Creates one plane-height support per grade band, excluding curbs.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns IAutoMovieBuiltSurface entries read by site observation eye placement.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements site-grade and site-paving ground divisions.
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
 * @evidence spaces/site.md Lists walkable support IDs excluding neighboring ground.
 * @evidence principles/core/source-units.md#source-scope-preservation Excludes only neighboring ground by its ID prefix.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a string list.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly uses site-paving's soil and paving walking extent.
 */
export const templeSiteWalkable = (supports: readonly IAutoMovieBuiltSurface[]): string[] =>
  supports.map((s) => s.surface.id).filter((id) => !id.startsWith("support.site.ground."));
