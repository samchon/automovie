import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { l } from "./l";

/**
 * Curb outer lines.
 */

export const templeSiteCurbOuter: PlanRectangle = {
  west: l.curbWest - l.curbWidth, east: l.curbEast + l.curbWidth,
  north: l.curbNorth - l.curbWidth, south: l.curbSouth + l.curbWidth,
};
