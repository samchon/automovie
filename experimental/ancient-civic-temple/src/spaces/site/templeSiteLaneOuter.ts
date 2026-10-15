import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { templeSiteLines as l } from "./templeSiteLines";
import { templeSiteCurbOuter } from "./templeSiteCurbOuter";

/**
 * Outer lane lines and front street south line.
 */

export const templeSiteLaneOuter: PlanRectangle = {
  west: templeSiteCurbOuter.west - l.laneWidth, east: templeSiteCurbOuter.east + l.laneWidth,
  north: templeSiteCurbOuter.north - l.laneWidth, south: templeSiteCurbOuter.south + l.streetDepth,
};
