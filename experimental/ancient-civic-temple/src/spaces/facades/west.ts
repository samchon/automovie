/**
 * West exterior wall solid of docs/spaces/facades/west.md#west-envelope.
 * A full-length unpierced parapet using the south facade's coping height.
 * Inner faces divide into offering finish, west-roof contact and parapet back
 * above the roof. Both corners consume diagonal-butt plans.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeParapetTop } from "./south";

/**
 * @evidence spaces/facades/west.md Emits the full-length unpierced west exterior parapet WallSpec.
 * @evidence spaces/facades/west.md#west-envelope Uses the south coping height and splits inner faces into offering finish, roof contact and parapet-back bands.
 * @evidence principles/core/source-units.md#source-scope-preservation Adds no window or door; both corners receive diagonal-butt plans.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a WallSpec with complete plan, top and band splits.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the windowless parapet and coping height of facades/west.md unchanged, with 0 envelope overlap.
 */
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
