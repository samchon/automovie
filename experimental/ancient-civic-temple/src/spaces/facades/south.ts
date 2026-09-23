/**
 * docs/spaces/facades/south.md#south-envelope의 정면 외벽 실체.
 * 서·동 외벽 구간과 두 반환벽은 석재 코핑을 얹는 수평 파라펫이며 그 안쪽
 * 면은 주랑/방 마감·지붕 접면·지붕 위 파라펫 뒷면으로 나뉜다. 현관 후퇴벽은
 * 포치 지붕 하부까지 닫고 포치 박공 아래 삼각 막음(tympanum)도 이 입면
 * 소유다. 하단은 호출자가 층 접지 규칙으로 유도한 공통 외벽 하단이다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeInteriorWallEnds, templeOuterWallPlans, templeWallRect, templeWallTrim } from "../junctions";
import { templeDoorVoidsOn } from "../openings";

/** 외곽 파라펫 코핑 상단(m). 서·북 입면이 같은 값을 소비한다. */
export const templeParapetTop = 4.85;

/** 외곽 바깥면 석재 기단 상단의 접지면 위 높이(m). 네 입면이 같은 값을 소비한다. */
export const templePlinthRise = 0.65;

/** 포치 삼각 막음의 아랫면(m): 기둥 위 수평 보가 받는 높이. */
export const templePedimentBase = 3.5;

const outer = "surface.facade-south.outer";
const back = "surface.facade-south.parapet-back";
const colonnade = "surface.colonnade.wall";
const entrance = "surface.entrance.return";
const coping = {
  kind: "flat", height: templeParapetTop, surface: "surface.facade-south.coping", coping: templeWallTrim.copingThickness,
} as const;
const wing = { tier: "wing", above: back } as const;

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
