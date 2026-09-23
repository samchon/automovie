/**
 * docs/spaces/facades/west.md#west-envelope의 서측 외벽 실체.
 * 개구부 없는 전 길이 벽이며 상단은 서측 날개 지붕의 처마 쪽 하부 경사를
 * 벽 두께 안에서 따른다. 두 모서리는 대각 맞댐 평면을 소비한다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans } from "../junctions";

export const templeWestWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-west", owner: "facade-west", axis: "z", bottom, voids: [],
  plan: templeOuterWallPlans().west,
  segments: [{
    from: p.northOuter, to: p.southOuter,
    low: "surface.facade-west.outer", high: "surface.offering.wall", top: { kind: "roof" },
  }],
}];
