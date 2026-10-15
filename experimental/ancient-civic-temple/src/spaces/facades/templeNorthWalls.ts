import type { WallSpec } from "../../geometry/WallSpec";
import { templePlan as p } from "../templePlan";
import { templeOuterWallPlans } from "../templeOuterWallPlans";
import { templeWallTrim } from "../templeWallTrim";
import { templeClerestoryVoidsOn } from "../templeClerestoryVoidsOn";
import { templeParapetTop } from "./templeParapetTop";
import { templeYardWallTop } from "./templeYardWallTop";

const outer = "surface.facade-north.outer";
const sanctuary = { kind: "roof", tier: "sanctuary" } as const;
const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-north.coping", coping: templeWallTrim.copingThickness,
} as const;
const wing = { tier: "wing", above: "surface.facade-north.parapet-back" } as const;

/**
 * Rear exterior wall solid
 * The offering section is a parapet at the south facade's coping height, the
 * sanctuary section a gable end closing to its roof underside, and the yard
 * section a low stone wall at Y=2.55m. Two high sanctuary clerestories cut actual
 * voids. Corners consume diagonal-butt plans.
 */
export const templeNorthWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-north", owner: "facade-north", axis: "x", bottom,
  plan: templeOuterWallPlans().north,
  voids: templeClerestoryVoidsOn("boundary-north.sanctuary"),
  segments: [
    { from: p.westOuter, to: p.westInner, low: outer, high: "joint", top: coping },
    { from: p.westInner, to: p.westRoom, low: outer, high: "surface.offering.wall", top: coping, highSplit: wing },
    { from: p.westRoom, to: p.westRing, low: outer, high: "joint", top: sanctuary },
    { from: p.westRing, to: p.eastRing, low: outer, high: "surface.sanctuary.wall", top: sanctuary },
    { from: p.eastRing, to: p.eastRoom, low: outer, high: "joint", top: sanctuary },
    { from: p.eastRoom, to: p.eastOuter, low: outer, high: "surface.service-yard.wall",
      top: { kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top", coping: templeWallTrim.copingThickness } },
  ],
}];
