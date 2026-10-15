import type { WallSpec } from "../../geometry/WallSpec";
import { templePlan as p } from "../templePlan";
import { templeOuterWallPlans } from "../templeOuterWallPlans";
import { templeInteriorWallEnds } from "../templeInteriorWallEnds";
import { templeWallRect } from "../templeWallRect";
import { templeDoorVoidsOn } from "../templeDoorVoidsOn";
import { outer } from "./outer";
import { back } from "./back";
import { colonnade } from "./colonnade";
import { entrance } from "./entrance";
import { coping } from "./coping";
import { wing } from "./wing";

/**
 * Porch tympanum underside (m), at the support height of the horizontal beam above columns.
 */
const templePedimentBase = 3.5;
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
        {
          from: ret.north, to: p.southInner, low: colonnade, high: entrance, top: coping,
          lowSplit: wing, highSplit: { tier: "porch", above: back }
        },
        {
          from: p.southInner, to: ret.south, low: "joint", high: entrance, top: coping,
          highSplit: { tier: "porch", above: back }
        },
      ],
    },
    {
      id: "wall.facade-south.return-east", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.eastPorchInner, p.eastPorchOuter, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        {
          from: ret.north, to: p.southInner, low: entrance, high: colonnade, top: coping,
          lowSplit: { tier: "porch", above: back }, highSplit: wing
        },
        {
          from: p.southInner, to: ret.south, low: entrance, high: "joint", top: coping,
          lowSplit: { tier: "porch", above: back }
        },
      ],
    },
    {
      id: "wall.facade-south.entry-back", owner: "facade-south", axis: "x", bottom,
      plan: templeWallRect(entry.west, entry.east, p.entranceBack, p.entranceFront),
      voids: templeDoorVoidsOn("boundary-entry"),
      ends: { low: colonnade, high: colonnade },
      segments: [
        { from: entry.west, to: p.westPorchInner, low: colonnade, high: "joint", top: coping, lowSplit: wing },
        {
          from: p.westPorchInner, to: p.eastPorchInner, low: colonnade, high: outer,
          top: { kind: "roof", tier: "porch" }, lowSplit: wing
        },
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
