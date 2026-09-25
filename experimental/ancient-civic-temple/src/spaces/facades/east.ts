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

/**
 * @evidence spaces/facades/east.md 동측 외벽 WallSpec을 마당 낮은 벽, 처마 벽, 남동 모서리 칸 구간으로 낸다.
 * @evidence spaces/facades/east.md#east-envelope 마당 구간 2.55m 벽과 외부 서비스 문 void, 보관실 북쪽 공유 벽부터 남쪽의 동측 처마 하부까지 닫는 벽, 코핑 높이로 오르는 남동 모서리 칸을 구현한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 벽 높이는 북측 마당 벽 값과 남측 코핑 값, 지붕 하부를 받고 새 높이를 정하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 평면·구간·상단 정책·void·띠 분할을 채운 WallSpec을 돌려주며 하단은 호출자가 넘긴 공통 외벽 하단이다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work facades/east.md의 세 구간과 서비스 문 위치를 그대로 구현했고 외피 겹침 0, 벽 model 닫힘으로 부모 결함이 없었다.
 * @evidenceReview spaces/facades/east.md # 동측 외벽을 한 WallSpec으로 내고 service-yard, storage, records, administration과 남동 칸에 서로 다른 segment 상단을 매긴다.
 * @evidenceReview spaces/facades/east.md#east-envelope # 북측 마당 구간은 templeYardWallTop, 세 업무방은 wing roof 하부, south-inner~outer 칸은 templeParapetTop을 써 높이 변화를 원본 구간대로 낸다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 외부 문 void는 templeDoorVoidsOn에서 받고 마당·코핑 상단은 north/south 소유 상수라 이 export가 새 높이나 두 번째 문을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # wall.facade-east의 plan, bottom, nine segments, 서비스 void와 세 top 정책을 모두 채워 wallFaces 입력으로 바로 쓸 수 있다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 낮은 마당 벽에서 동측 박공 하부로 바뀌는 yard-front와 서비스 문 경계를 원본에 대조했고 self-check 겹침 0에서 부모 높이 수정을 요구하는 충돌이 없었다.
 */
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
