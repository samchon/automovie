/**
 * Rear exterior wall solid of docs/spaces/facades/north.md#north-envelope.
 * The offering section is a parapet at the south facade's coping height, the
 * sanctuary section a gable end closing to its roof underside, and the yard
 * section a low stone wall at Y=2.55m. Two high sanctuary clerestories cut actual
 * voids. Corners consume diagonal-butt plans.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeClerestoryVoidsOn } from "../openings";
import { templeParapetTop } from "./south";

const outer = "surface.facade-north.outer";
const sanctuary = { kind: "roof", tier: "sanctuary" } as const;
const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-north.coping", coping: templeWallTrim.copingThickness,
} as const;
const wing = { tier: "wing", above: "surface.facade-north.parapet-back" } as const;

/**
 * Yard-wall top (m), the facade design's sole value, without copying it to the storage gable.
 * @evidence spaces/facades/north.md Holds the yard-section low stone wall's top height 2.55m as one value.
 * @evidence spaces/facades/north.md#north-envelope Gives the rear yard section and east yard wall the same 2.55m.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds only the yard-wall top, without copying it to the storage north gable height.
 * @evidence principles/core/source-units.md#source-substantive-completion One numeric constant gives north/east yard walls and service-yard space judgments the same height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers 2.55m from facades/north.md unchanged; service-yard window classification as exterior above the yard was established from this value.
 */
export const templeYardWallTop = 2.55;

/**
 * @evidence spaces/facades/north.md Emits a north exterior WallSpec divided into offering parapet, sanctuary gable end and low yard wall.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes coping height from the south facade, yard height from templeYardWallTop and sanctuary-section top from its roof underside.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a WallSpec including both north clerestory voids and parapet-back band splits.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the three sections and two gable windows of facades/north.md#north-envelope unchanged, with 0 envelope overlap.
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
