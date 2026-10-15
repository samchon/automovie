/**
 * Wall junction calculations
 * The four exterior corners butt along vertical diagonal planes joining outer
 * and inner vertices; each facade wall owns only the triangle closer to its
 * exterior plane. At interior T-junctions, branch walls end on the through-wall
 * face. This file emits plan outlines without owning surfaces.
 */
import type { PlanPoint } from "../geometry/PlanPoint";
import { templePlan as p } from "./templePlan";

/**
 * Diagonally butted plans of four exterior walls with two south sections, in planar-domain order.
 */
export const templeOuterWallPlans = () => ({
  north: [
    { x: p.westOuter, z: p.northOuter }, { x: p.eastOuter, z: p.northOuter },
    { x: p.eastInner, z: p.northInner }, { x: p.westInner, z: p.northInner },
  ],
  west: [
    { x: p.westOuter, z: p.northOuter }, { x: p.westInner, z: p.northInner },
    { x: p.westInner, z: p.southInner }, { x: p.westOuter, z: p.southOuter },
  ],
  east: [
    { x: p.eastInner, z: p.northInner }, { x: p.eastOuter, z: p.northOuter },
    { x: p.eastOuter, z: p.southOuter }, { x: p.eastInner, z: p.southInner },
  ],
  southWest: [
    { x: p.westInner, z: p.southInner }, { x: p.westPorchOuter, z: p.southInner },
    { x: p.westPorchOuter, z: p.southOuter }, { x: p.westOuter, z: p.southOuter },
  ],
  southEast: [
    { x: p.eastPorchOuter, z: p.southInner }, { x: p.eastInner, z: p.southInner },
    { x: p.eastOuter, z: p.southOuter }, { x: p.eastPorchOuter, z: p.southOuter },
  ],
}) satisfies Record<string, PlanPoint[]>;

