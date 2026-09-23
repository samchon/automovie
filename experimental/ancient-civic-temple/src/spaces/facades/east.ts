/**
 * docs/spaces/facades/east.md#east-envelope의 동측 외벽 실체.
 * 마당 구간은 낮은 석벽(북측 입면과 같은 상단)이고 외부 서비스 문 void가
 * 뚫린다. 보관실 북쪽 공유 벽부터 남쪽은 동측 날개 지붕 하부까지 닫고,
 * 남측 파라펫과 맞대는 남동 모서리 칸만 같은 코핑 높이로 올린다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans, templeWallTrim } from "../junctions";
import { templeDoorVoidsOn } from "../openings";
import { templeYardWallTop } from "./north";
import { templeParapetTop } from "./south";

const outer = "surface.facade-east.outer";
const roof = { kind: "roof", tier: "wing" } as const;
const yardTop = {
  kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top", coping: templeWallTrim.copingThickness,
} as const;

export const templeEastWalls = (bottom: number): WallSpec[] => [{
  id: "wall.facade-east", owner: "facade-east", axis: "z", bottom,
  plan: templeOuterWallPlans().east,
  voids: templeDoorVoidsOn("boundary-east.service-yard"),
  segments: [
    { from: p.northOuter, to: p.northInner, low: "joint", high: outer, top: yardTop },
    { from: p.northInner, to: p.yardFront, low: "surface.service-yard.wall", high: outer, top: yardTop },
    { from: p.yardFront, to: p.storageBack, low: "joint", high: outer, top: roof },
    { from: p.storageBack, to: p.storageFront, low: "surface.storage.wall", high: outer, top: roof },
    { from: p.storageFront, to: p.recordsBack, low: "joint", high: outer, top: roof },
    { from: p.recordsBack, to: p.recordsFront, low: "surface.records.wall", high: outer, top: roof },
    { from: p.recordsFront, to: p.officeBack, low: "joint", high: outer, top: roof },
    { from: p.officeBack, to: p.southInner, low: "surface.administration.wall", high: outer, top: roof },
    // 남측 파라펫과 만나는 모서리 칸은 같은 코핑 높이의 기둥으로 올린다.
    { from: p.southInner, to: p.southOuter, low: "joint", high: outer,
      top: { kind: "flat", height: templeParapetTop, surface: "surface.facade-east.coping", coping: templeWallTrim.copingThickness } },
  ],
}];
