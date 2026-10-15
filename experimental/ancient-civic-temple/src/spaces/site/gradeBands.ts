import type { HeightPlane } from "../../geometry/HeightPlane";
import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { templeSiteGradeBreaks } from "./templeSiteGradeBreaks";
import { templeSiteGradePlane } from "./templeSiteGradePlane";

/**
 * Plan pieces split at grade breaks with their ground planes.
 */

export const gradeBands = (rect: PlanRectangle): { rect: PlanRectangle; plane: HeightPlane; }[] => {
  const cuts = [rect.north, ...templeSiteGradeBreaks.filter((z) => z > rect.north && z < rect.south), rect.south];
  return cuts.slice(0, -1).map((north, i) => {
    const band = { ...rect, north, south: cuts[i + 1]! };
    return { rect: band, plane: templeSiteGradePlane((band.north + band.south) / 2) };
  });
};
