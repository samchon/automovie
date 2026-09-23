/**
 * docs/spaces/facades/south.md#south-envelope의 정면 외벽 실체.
 * 서·동 외벽 구간, 두 반환벽, 문이 뚫린 현관 후퇴벽을 한 남측 소유로 낸다.
 * 벽 상단은 합성 지붕 하부(서·동 날개 박공, 주랑 덮개, 포치)를 따르고
 * 하단은 호출자가 층 접지 규칙으로 유도한 공통 외벽 하단이다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeInteriorWallEnds, templeOuterWallPlans, templeWallRect } from "../junctions";
import { templeDoorVoidsOn } from "../openings";

const outer = "surface.facade-south.outer";
const colonnade = "surface.colonnade.wall";
const entrance = "surface.entrance.return";
const roof = { kind: "roof" } as const;

export const templeSouthWalls = (bottom: number): WallSpec[] => {
  const plans = templeOuterWallPlans();
  const back = templeInteriorWallEnds().entryBack;
  const ret = templeInteriorWallEnds().porchReturn;
  return [
    {
      id: "wall.facade-south.west", owner: "facade-south", plan: plans.southWest,
      axis: "x", bottom, voids: [], ends: { high: "joint" },
      segments: [
        { from: p.westOuter, to: p.westInner, low: "joint", high: outer, top: roof },
        { from: p.westInner, to: p.westRoom, low: "surface.offering.wall", high: outer, top: roof },
        { from: p.westRoom, to: p.westRing, low: "joint", high: outer, top: roof },
        { from: p.westRing, to: p.westPorchOuter, low: colonnade, high: outer, top: roof },
      ],
    },
    {
      id: "wall.facade-south.east", owner: "facade-south", plan: plans.southEast,
      axis: "x", bottom, voids: [], ends: { low: "joint" },
      segments: [
        { from: p.eastPorchOuter, to: p.eastRing, low: colonnade, high: outer, top: roof },
        { from: p.eastRing, to: p.eastRoom, low: "joint", high: outer, top: roof },
        { from: p.eastRoom, to: p.eastInner, low: "surface.administration.wall", high: outer, top: roof },
        { from: p.eastInner, to: p.eastOuter, low: "joint", high: outer, top: roof },
      ],
    },
    {
      id: "wall.facade-south.return-west", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.westPorchOuter, p.westPorchInner, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        { from: ret.north, to: p.southInner, low: colonnade, high: entrance, top: roof },
        { from: p.southInner, to: ret.south, low: "joint", high: entrance, top: roof },
      ],
    },
    {
      id: "wall.facade-south.return-east", owner: "facade-south", axis: "z", bottom, voids: [],
      plan: templeWallRect(p.eastPorchInner, p.eastPorchOuter, ret.north, ret.south),
      ends: { low: "joint", high: outer },
      segments: [
        { from: ret.north, to: p.southInner, low: entrance, high: colonnade, top: roof },
        { from: p.southInner, to: ret.south, low: entrance, high: "joint", top: roof },
      ],
    },
    {
      id: "wall.facade-south.entry-back", owner: "facade-south", axis: "x", bottom,
      plan: templeWallRect(back.west, back.east, p.entranceBack, p.entranceFront),
      voids: templeDoorVoidsOn("boundary-entry"),
      ends: { low: colonnade, high: colonnade },
      segments: [
        { from: back.west, to: p.westPorchInner, low: colonnade, high: "joint", top: roof },
        { from: p.westPorchInner, to: p.eastPorchInner, low: colonnade, high: outer, top: roof },
        { from: p.eastPorchInner, to: back.east, low: colonnade, high: "joint", top: roof },
      ],
    },
  ];
};
