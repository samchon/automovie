/**
 * docs/spaces/facades/north.md#north-envelope의 후면 외벽 실체.
 * 봉헌실 구간은 남측과 같은 코핑 높이의 파라펫, 제실 구간은 제실 박공
 * 하부까지 닫는 박공 끝벽, 마당 구간은 Y=2.55m의 낮은 석벽이다. 제실 박공의
 * 두 높은 채광구가 실제 void로 뚫린다. 모서리는 대각 맞댐 평면을 소비한다.
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

/** 마당 벽 상단(m). 입면 설계의 단일 값이며 보관실 박공에 복사하지 않는다. */
export const templeYardWallTop = 2.55;

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
