import { cullCoincidentVerticalFaces } from "../../geometry/cullCoincidentVerticalFaces";
import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { prismFaces } from "../../geometry/prismFaces";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import type { WallFace } from "../../geometry/WallFace";
import { gradeBands } from "./gradeBands";
import { entry } from "./entry";
import { apron } from "./apron";
import { templeSiteCurbOuter as curb } from "./templeSiteCurbOuter";
import { templeSiteLines as l } from "./templeSiteLines";
import { offset } from "./offset";

/**
 * Curb bands break at entry and service doors and close at four corners.
 */
const templeSiteCurbs = (): PlanRectangle[] => [
  { west: curb.west, east: entry.west, north: l.curbSouth, south: curb.south },
  { west: entry.east, east: curb.east, north: l.curbSouth, south: curb.south },
  { west: curb.west, east: l.curbWest, north: curb.north, south: l.curbSouth },
  { west: l.curbEast, east: curb.east, north: curb.north, south: apron.north },
  { west: l.curbEast, east: curb.east, north: apron.south, south: l.curbSouth },
  { west: l.curbWest, east: l.curbEast, north: curb.north, south: l.curbNorth },
];
/**
 * Cull touching curb end faces to join pieces into one band.
 */

export const templeSiteCurbFaces = (): WallFace[] => cullCoincidentVerticalFaces(
  templeSiteCurbs().flatMap((rect) => gradeBands(rect)).flatMap(({ rect, plane }) => prismFaces(rectanglePolygon(rect), offset(plane, -l.curbEmbed), offset(plane, l.curbRise))
    .map((face) => ({ surface: "surface.site.curb", corners: face.corners })))
);
