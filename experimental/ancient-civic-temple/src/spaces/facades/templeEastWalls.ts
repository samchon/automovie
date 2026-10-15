import type { WallSpec } from "../../geometry/WallSpec";
import { templePlan as p } from "../templePlan";
import { templeOuterWallPlans } from "../templeOuterWallPlans";
import { templeWallTrim } from "../templeWallTrim";
import { templeDoorVoidsOn } from "../templeDoorVoidsOn";
import { templeYardWallTop } from "./templeYardWallTop";
import { templeParapetTop } from "./templeParapetTop";

const outer = "surface.facade-east.outer";
const roof = { kind: "roof", tier: "wing" } as const;
const yardTop = {
  kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top", coping: templeWallTrim.copingThickness,
} as const;
/**
 * East exterior wall solid
 * The yard section is a low stone wall sharing the north facade's top, cut by
 * the exterior service-door void. South of the storage room's north shared
 * wall, it closes to the east-wing roof underside; only the southeast corner
 * cell butting the south parapet rises to the same coping height.
 */
export const templeEastWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-east", owner: "facade-east", axis: "z", bottom,
  plan: templeOuterWallPlans().east,
  voids: templeDoorVoidsOn("boundary-east.service-yard"),
  segments: [
    { from: p.northOuter, to: p.northInner, low: "joint", high: outer, top: yardTop },
    { from: p.northInner, to: p.yardFront, low: "surface.service-yard.wall", high: outer, top: yardTop },
    { from: p.yardFront, to: p.storageBack, low: "joint", high: outer, top: roof },
    { from: p.storageBack, to: p.storageFront, low: "surface.storage.wall", high: outer, top: roof },
    { from: p.storageFront, to: p.recordsBack, low: "joint", high: outer, top: roof },
    { from: p.recordsBack, to: p.recordsFront, low: "surface.records.wall", high: outer, top: roof },
    { from: p.recordsFront, to: p.officeBack, low: "joint", high: outer, top: roof },
    { from: p.officeBack, to: p.southInner, low: "surface.administration.wall", high: outer, top: roof },
    // Raise the corner cell meeting the south parapet to the same coping height.
    { from: p.southInner, to: p.southOuter, low: "joint", high: outer,
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-east.coping", coping: templeWallTrim.copingThickness } },
  ],
}];
