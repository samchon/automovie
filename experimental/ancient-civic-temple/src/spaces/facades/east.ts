/**
 * docs/spaces/facades/east.md#east-envelope의 동측 외벽 실체.
 * 마당 구간은 낮은 석벽(북측 입면과 같은 상단)이고 외부 서비스 문 void가
 * 뚫린다. 보관실 북쪽 공유 벽부터 남쪽은 동측 날개 지붕 하부까지 닫는다.
 */
import type { WallSpec } from "../../geometry/wall-solids";
import { templePlan as p } from "../building";
import { templeOuterWallPlans } from "../junctions";
import { templeDoorVoidsOn } from "../openings";
import { templeYardWallTop } from "./north";

const outer = "surface.facade-east.outer";
const roof = { kind: "roof" } as const;
const yardTop = {
  kind: "flat", height: templeYardWallTop, surface: "surface.service-yard.wall-top",
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
    { from: p.officeBack, to: p.southOuter, low: "surface.administration.wall", high: outer, top: roof },
  ],
}];
