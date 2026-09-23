/**
 * docs/spaces/facades/north.md#north-envelope의 후면 외벽 실체.
 * 봉헌실·제실 구간은 합성 지붕 하부(서측 날개와 제실 박공)까지 닫고,
 * 마당 구간은 Y=2.55m의 낮은 석벽이다. 제실 박공의 두 높은 채광구가
 * 실제 void로 뚫린다. 모서리는 대각 맞댐 평면을 소비한다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans } from "../junctions";
import { templeClerestoryVoidsOn } from "../openings";

const outer = "surface.facade-north.outer";
const roof = { kind: "roof" } as const;

/** 마당 벽 상단(m). 입면 설계의 단일 값이며 보관실 박공에 복사하지 않는다. */
export const templeYardWallTop = 2.55;

export const templeNorthWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-north", owner: "facade-north", axis: "x", bottom,
  plan: templeOuterWallPlans().north,
  voids: templeClerestoryVoidsOn("boundary-north.sanctuary"),
  segments: [
    { from: p.westOuter, to: p.westInner, low: outer, high: "joint", top: roof },
    { from: p.westInner, to: p.westRoom, low: outer, high: "surface.offering.wall", top: roof },
    { from: p.westRoom, to: p.westRing, low: outer, high: "joint", top: roof },
    { from: p.westRing, to: p.eastRing, low: outer, high: "surface.sanctuary.wall", top: roof },
    { from: p.eastRing, to: p.eastRoom, low: outer, high: "joint", top: roof },
    { from: p.eastRoom, to: p.eastOuter, low: outer, high: "surface.service-yard.wall",
      top: { kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top" } },
  ],
}];
