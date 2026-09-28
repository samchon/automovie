/**
 * docs/spaces/rooms/service-yard.md#yard-volume의 열린 서비스 마당.
 * 서/동 두 문턱 모두 같은 마당 소유이며 지면/천장을 새로 만들지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/service-yard.md 서비스 마당 본체 평면을 기준선 네 값(east-room~east-inner, north-inner~yard-front)으로 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 서비스 마당 끝선을 east-room·east-inner·north-inner·yard-front 네 기준선 이름으로만 정하고 마당 안 새 치수를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 마당 바닥과 열린 cell이 같은 평면을 받고 천장은 받지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/service-yard.md의 서비스 마당 범위(east-room~east-inner, north-inner~yard-front)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 */
export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;

/**
 * 동쪽 문턱은 외벽 바깥면까지만, 서쪽은 주랑 면까지 같은 마당이 소유한다.
 * @evidence spaces/rooms/service-yard.md 서비스 마당 본체와 서쪽 마당 문과 동쪽 외부 서비스 문턱 바닥을 한 표면 소유(surface.service-yard.floor)의 slab과 support로 낸다.
 * @evidence spaces/storey.md#threshold-support 서쪽 door-yard는 주랑 면까지, 동쪽 door-service-exterior는 외벽 바깥면까지 문턱 slab·support를 마당이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 room=service-yard인 두 문만 골라 문턱을 만든다.
 * @evidence principles/core/source-units.md#source-substantive-completion 마당 body 구획과 두 문턱의 slab·support 구획을 함께 돌려줘 바닥 면 생성과 동측 spine·동측 외벽의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 마당 바닥과 door-yard·door-service-exterior 두 문턱 소유가 rooms/service-yard.md와 storey.md#threshold-support 그대로 성립했고 동쪽 문턱 끝이 외벽 바깥면에서 대지 서비스 앞마당 포장과 만나 부모에서 고칠 결정이 없었다.
 */
export const templeServiceYardFloor = () => roomFloorInput(
  "service-yard", [{ ...templeServiceYardPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/service-yard.md 서비스 마당 공간 레코드(id service-yard, 부모 temple-ground)를 exact cell로 낸다.
 * @evidence spaces/rooms/service-yard.md#yard-volume 4.0×7.2m 열린 마당과 서쪽 주랑 문(door-yard)·동쪽 외부 서비스 문(door-service-exterior) 두 문턱 cell을 한 공간으로 두며 상한은 하늘을 막는 면이 아니다.
 * @evidence principles/core/source-units.md#source-scope-preservation 열린 마당의 논리 상한 3.20m(주랑 처마 지지 높이)를 cell 상한으로 쓰며 방 밖 영역이나 숨은 부속실을 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 마당 body cell(상한 court-eave)과 서·동 두 문턱 cell을 함께 돌려주며 대지 connector와 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/service-yard.md#yard-volume의 4.0×7.2m 열린 범위와 court-eave 상한이 그대로 성립했고 두 connector 끝점이 마당 cell 안에 들어 부모에서 고칠 결정이 없었다.
 */
export const templeServiceYard = (): IAutoMovieBuiltSpace => ({
  id: "service-yard", kind: "service-yard", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("service-yard.body", templeServiceYardPlan, y.floor, templeRoofRules.courtEave),
    ...thresholdCells("service-yard", templeDoorPassages, y.floor),
  ],
});
