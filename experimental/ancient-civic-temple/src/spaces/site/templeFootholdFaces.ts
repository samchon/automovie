import type { PlanRectangle } from "../../geometry/PlanRectangle";
import type { WallFace } from "../../geometry/WallFace";
import { templeSiteExtent as e } from "./templeSiteExtent";
import { gradeTopFaces } from "./gradeTopFaces";
import { templeRidge } from "./templeRidge";

/**
 * Four foothold bands surrounding the local site.
 */
const templeFootholdRects = (): PlanRectangle[] => {
  const h = templeRidge.farHalf;
  return [
    { west: -h, east: h, north: e.south, south: h },
    { west: -h, east: h, north: -h, south: e.north },
    { west: -h, east: e.west, north: e.north, south: e.south },
    { west: e.east, east: h, north: e.north, south: e.south },
  ];
};
/**
 * Top faces of the four distant ground bands surrounding the local site, out to the ridge's far
 * extent.
 */
export const templeFootholdFaces = (): WallFace[] => templeFootholdRects().flatMap((rect) => gradeTopFaces(rect, "surface.site-distant.ground"));
