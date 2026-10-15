/**
 * West exterior wall solid
 * A full-length unpierced parapet using the south facade's coping height.
 * Inner faces divide into offering finish, west-roof contact and parapet back
 * above the roof. Both corners consume diagonal-butt plans.
 */
import type { WallSpec } from "../../geometry/WallSpec";
import { templePlan as p } from "../templePlan";
import { templeOuterWallPlans } from "../templeOuterWallPlans";
import { templeWallTrim } from "../templeWallTrim";
import { templeParapetTop } from "./templeParapetTop";
export const templeWestWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-west", owner: "facade-west", axis: "z", bottom, voids: [],
  plan: templeOuterWallPlans().west,
  segments: [
    { from: p.northOuter, to: p.northInner, low: "surface.facade-west.outer", high: "joint",
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-west.coping", coping: templeWallTrim.copingThickness } },
    { from: p.northInner, to: p.southInner, low: "surface.facade-west.outer", high: "surface.offering.wall",
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-west.coping", coping: templeWallTrim.copingThickness },
      highSplit: { tier: "wing", above: "surface.facade-west.parapet-back" } },
    { from: p.southInner, to: p.southOuter, low: "surface.facade-west.outer", high: "joint",
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-west.coping", coping: templeWallTrim.copingThickness } },
  ],
}];
