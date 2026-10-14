/**
 * East exterior wall solid of docs/spaces/facades/east.md#east-envelope.
 * The yard section is a low stone wall sharing the north facade's top, cut by
 * the exterior service-door void. South of the storage room's north shared
 * wall, it closes to the east-wing roof underside; only the southeast corner
 * cell butting the south parapet rises to the same coping height.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeDoorVoidsOn } from "../openings";
import { templeYardWallTop } from "./north";
import { templeParapetTop } from "./south";

const outer = "surface.facade-east.outer";
const roof = { kind: "roof", tier: "wing" } as const;
const yardTop = {
  kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top", coping: templeWallTrim.copingThickness,
} as const;

/**
 * @evidence spaces/facades/east.md Emits an east exterior WallSpec partitioned into low yard wall, eave wall and southeast corner cell.
 * @evidence spaces/facades/east.md#east-envelope Implements the 2.55m yard wall and exterior service-door void, the wall closing to east eave undersides south of the storage north partition, and the southeast corner rising to coping height.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes heights from the north yard wall, south coping and roof underside, without choosing new heights.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a WallSpec with plan, intervals, top policies, voids and band splits; its bottom is the caller's common exterior-wall bottom.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the three sections and service-door position of facades/east.md unchanged; 0 envelope overlap and a closed wall model exposed no parent defect.
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
