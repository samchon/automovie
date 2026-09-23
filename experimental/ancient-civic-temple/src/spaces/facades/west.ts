/**
 * docs/spaces/facades/west.md#west-envelope의 서측 외벽 실체.
 * 개구부 없는 전 길이 파라펫이며 코핑 높이는 남측 입면 값을 소비한다.
 * 안쪽 면은 봉헌실 마감·서측 지붕 접면·지붕 위 파라펫 뒷면으로 나뉜다.
 * 두 모서리는 대각 맞댐 평면을 소비한다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeParapetTop } from "./south";

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
