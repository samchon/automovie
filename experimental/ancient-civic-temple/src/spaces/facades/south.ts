/**
 * Front exterior wall solids of docs/spaces/facades/south.md#south-envelope.
 * West/east exterior sections and two return walls are level parapets with
 * stone coping; inner faces divide into colonnade/room finishes, roof contacts
 * and parapet backs above roofs. The recessed entrance wall closes to the porch
 * underside, and this facade also owns its triangular tympanum. Bottoms use the
 * common exterior-wall bottom derived by the caller from storey ground-contact rules.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeInteriorWallEnds, templeOuterWallPlans, templeWallRect, templeWallTrim } from "../junctions";
import { templeDoorVoidsOn } from "../openings";

/**
 * Exterior parapet coping top (m), shared by west/north facades.
 * @evidence spaces/facades/south.md Holds the exterior parapet coping top 4.85m as one value.
 * @evidence spaces/facades/south.md#south-envelope Defines the coping height consumed by west/north/east facades and return walls in one place.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds coping height only; junctions owns thickness and projection.
 * @evidence principles/core/source-units.md#source-substantive-completion One numeric constant gives parapets on all four facades and wall-trim coping cells the same height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers 4.85m from facades/south.md unchanged; overlap scans confirmed that three roofs and sanctuary eaves do not intersect coping.
 */
export const templeParapetTop = 4.85;

/**
 * Exterior stone-plinth top height above ground (m), shared by all four facades.
 * @evidence spaces/facades/south.md Holds the exterior stone-plinth top height 0.65m above ground.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds plinth-top height only; junctions owns projection.
 * @evidence principles/core/source-units.md#source-substantive-completion One numeric constant raises wall-trim plinth cells to the same height above their ground planes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers 0.65m from facades/south.md#south-envelope unchanged; the plinth model accounts as a closed solid.
 */
export const templePlinthRise = 0.65;

/**
 * Porch tympanum underside (m), at the support height of the horizontal beam above columns.
 * @evidence spaces/facades/south.md Holds the porch tympanum underside at 3.5m.
 * @evidence principles/core/source-units.md#source-scope-preservation Holds only the tympanum bottom height; its upper edge comes from the porch roof underside.
 * @evidence principles/core/source-units.md#source-substantive-completion One numeric constant starts the south-facade pediment wall interval at the same height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Transfers 3.5m from facades/south.md#south-envelope unchanged; the pediment model is a closed solid.
 */
export const templePedimentBase = 3.5;

const outer = "surface.facade-south.outer";
const back = "surface.facade-south.parapet-back";
const colonnade = "surface.colonnade.wall";
const entrance = "surface.entrance.return";
const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-south.coping", coping: templeWallTrim.copingThickness,
} as const;
const wing = { tier: "wing", above: back } as const;

/**
 * @evidence spaces/facades/south.md Emits WallSpecs for two front exterior sections, two returns, the recessed entrance wall and porch tympanum.
 * @evidence principles/core/source-units.md#source-scope-preservation Takes coping/plinth/tympanum heights from the constants above, recessed-wall tops from porch undersides and end positions from junctions.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns complete WallSpecs including the main-door void, parapet-back band splits and coping cells at both recessed-wall ends.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Implements the parapet, return, recessed-wall and tympanum arrangement of facades/south.md#south-envelope unchanged, with 0 envelope overlap.
 */
export const templeSouthWalls = (bottom: number): WallSpec[] => {
  const plans = templeOuterWallPlans();
  const entry = templeInteriorWallEnds().entryBack;
  const ret = templeInteriorWallEnds().porchReturn;
  return [
    {
      id: "wall.facade-south.west", owner: "facade-south", plan: plans.southWest,
      axis: "x", bottom, voids: [], ends: { high: "joint" },
      segments: [
        { from: p.westOuter, to: p.westInner, low: "joint", high: outer, top: coping },
        { from: p.westInner, to: p.westRoom, low: "surface.offering.wall", high: outer, top: coping, lowSplit: wing },
        { from: p.westRoom, to: p.westRing, low: "joint", high: outer, top: coping, lowSplit: wing },
        { from: p.westRing, to: p.westPorchOuter, low: colonnade, high: outer, top: coping, lowSplit: wing },
      ],
    },
    {
      id: "wall.facade-south.east", owner: "facade-south", plan: plans.southEast,
      axis: "x", bottom, voids: [], ends: { low: "joint" },
      segments: [
        { from: p.eastPorchOuter, to: p.eastRing, low: colonnade, high: outer, top: coping, lowSplit: wing },
        { from: p.eastRing, to: p.eastRoom, low: "joint", high: outer, top: coping, lowSplit: wing },
        { from: p.eastRoom, to: p.eastInner, low: "surface.administration.wall", high: outer, top: coping, lowSplit: wing },
        { from: p.eastInner, to: p.eastOuter, low: "joint", high: outer, top: coping },
      ],
    },
    {
      id: "wall.facade-south.return-west", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.westPorchOuter, p.westPorchInner, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        { from: ret.north, to: p.southInner, low: colonnade, high: entrance, top: coping,
          lowSplit: wing, highSplit: { tier: "porch", above: back } },
        { from: p.southInner, to: ret.south, low: "joint", high: entrance, top: coping,
          highSplit: { tier: "porch", above: back } },
      ],
    },
    {
      id: "wall.facade-south.return-east", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.eastPorchInner, p.eastPorchOuter, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        { from: ret.north, to: p.southInner, low: entrance, high: colonnade, top: coping,
          lowSplit: { tier: "porch", above: back }, highSplit: wing },
        { from: p.southInner, to: ret.south, low: entrance, high: "joint", top: coping,
          lowSplit: { tier: "porch", above: back } },
      ],
    },
    {
      id: "wall.facade-south.entry-back", owner: "facade-south", axis: "x", bottom,
      plan: templeWallRect(entry.west, entry.east, p.entranceBack, p.entranceFront),
      voids: templeDoorVoidsOn("boundary-entry"),
      ends: { low: colonnade, high: colonnade },
      segments: [
        { from: entry.west, to: p.westPorchInner, low: colonnade, high: "joint", top: coping, lowSplit: wing },
        { from: p.westPorchInner, to: p.eastPorchInner, low: colonnade, high: outer,
          top: { kind: "roof", tier: "porch" }, lowSplit: wing },
        { from: p.eastPorchInner, to: entry.east, low: colonnade, high: "joint", top: coping, lowSplit: wing },
      ],
    },
    {
      id: "wall.facade-south.pediment", owner: "facade-south", axis: "x", bottom: templePedimentBase, voids: [],
      plan: templeWallRect(p.westPorchInner, p.eastPorchInner, p.southOuter - 0.2, p.southOuter),
      ends: { low: "joint", high: "joint" },
      segments: [{
        from: p.westPorchInner, to: p.eastPorchInner, low: "surface.entrance.pediment-back", high: outer,
        top: { kind: "roof", tier: "porch" },
      }],
    },
  ];
};
