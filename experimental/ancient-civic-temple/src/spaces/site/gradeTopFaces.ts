import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { rectanglePolygon } from "../../geometry/rectanglePolygon";
import type { WallFace } from "../../geometry/WallFace";
import { gradeBands } from "./gradeBands";

/**
 * Open ground top surface, using the same vertex order as a prism top.
 */

export const gradeTopFaces = (rect: PlanRectangle, surface: string, lift = 0): WallFace[] => gradeBands(rect).map(({ rect: band, plane }) => ({
  surface,
  corners: rectanglePolygon(band).map((q) => ({
    x: q.x, y: plane.x * q.x + plane.z * q.z + plane.constant + lift, z: q.z,
  })).reverse(),
}));
