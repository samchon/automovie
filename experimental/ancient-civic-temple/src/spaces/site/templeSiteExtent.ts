import type { PlanRectangle } from "../../geometry/PlanRectangle";
import { templePlan as p } from "../templePlan";

const templeSiteOutset = 25;


/**
 * Single input in meters for the site extent, grade, divisions and placement zones.
 * Building datums come from templePlan; this file defines only site lines.
 * It produces no geometry and is consumed by ground, ridge and assembly.
 */
export const templeSiteExtent: PlanRectangle = {
  west: p.westOuter - templeSiteOutset, east: p.eastOuter + templeSiteOutset,
  north: p.northOuter - templeSiteOutset, south: p.southOuter + templeSiteOutset,
};


