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
 * @evidenceReview spaces/rooms/service-yard.md #8e61aec # ServiceYardPlan은 eastRoom·eastInner·northInner·yardFront 네 선으로 후면 우측의 마당 한 칸만 정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 서비스 마당 끝선을 east-room·east-inner·north-inner·yard-front 네 기준선 이름으로만 정하고 마당 안 새 치수를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # plan이 templePlan 네 선을 그대로 참조해 마당 내부에 별도 구조물이나 둘째 마당을 만들 기준선이 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 마당 바닥과 열린 cell이 같은 평면을 받고 천장은 받지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 바닥과 body cell이 ServiceYardPlan을 공통으로 쓰고 Ceiling export는 없어 열린 마당 평면을 완결한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/service-yard.md의 서비스 마당 범위(east-room~east-inner, north-inner~yard-front)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 서비스 마당 네 변이 부모 야드 범위를 그대로 가리키고 두 출입구 위치는 이 객체가 고르지 않아 상위 수정이 필요하지 않았다.
 */
export const templeServiceYardPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.northInner, south: p.yardFront,
} as const;

/**
 * 동쪽 문턱은 외벽 바깥면까지만, 서쪽은 주랑 면까지 같은 마당이 소유한다.
 * @evidence spaces/rooms/service-yard.md 서비스 마당 본체와 서쪽 마당 문과 동쪽 외부 서비스 문턱 바닥을 한 표면 소유(surface.service-yard.floor)의 slab과 support로 낸다.
 * @evidenceReview spaces/rooms/service-yard.md #8e61aec # yard Floor는 body와 templeDoorPassages를 service-yard id로 묶어 서쪽 주랑 문과 동쪽 외부 문의 바닥 owner를 하나로 유지한다.
 * @evidence spaces/storey.md#threshold-support 서쪽 door-yard는 주랑 면까지, 동쪽 door-service-exterior는 외벽 바깥면까지 문턱 slab·support를 마당이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidenceReview spaces/storey.md#threshold-support #6354225 # 동일한 roomFloorInput에 두 passage를 공급해 서쪽 문턱의 주랑 면 끝과 동쪽 문턱의 외벽 바깥 끝을 마당이 받도록 한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 room=service-yard인 두 문만 골라 문턱을 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # y.floor·slabThickness를 그대로 소비하고 service-yard id가 문 표를 거르므로 보관실 문턱을 이 마당 바닥에 복제하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 마당 body 구획과 두 문턱의 slab·support 구획을 함께 돌려줘 바닥 면 생성과 동측 spine·동측 외벽의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 야드 본체와 양방향 출입 passage가 한 Floor 반환에 있어 서·동 문턱의 slab 및 지지부가 빠지지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 마당 바닥과 door-yard·door-service-exterior 두 문턱 소유가 rooms/service-yard.md와 storey.md#threshold-support 그대로 성립했고 동쪽 문턱 끝이 외벽 바깥면에서 대지 서비스 앞마당 포장과 만나 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 두 문 passage를 기존 마당 floor 입력으로 처리하고 외부 서비스 문 끝을 새 지면으로 연장하지 않아 부모의 문턱 경계와 일치한다.
 */
export const templeServiceYardFloor = () => roomFloorInput(
  "service-yard", [{ ...templeServiceYardPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/service-yard.md 서비스 마당 공간 레코드(id service-yard, 부모 temple-ground)를 exact cell로 낸다.
 * @evidenceReview spaces/rooms/service-yard.md #8e61aec # service-yard id·kind 및 단층 parent의 공간 하나에 body와 두 threshold cell만 들어간다.
 * @evidence spaces/rooms/service-yard.md#yard-volume 4.0×7.2m 열린 마당과 서쪽 주랑 문(door-yard)·동쪽 외부 서비스 문(door-service-exterior) 두 문턱 cell을 한 공간으로 두며 상한은 하늘을 막는 면이 아니다.
 * @evidenceReview spaces/rooms/service-yard.md#yard-volume #81ac083 # body levelCell과 두 thresholdCells가 같은 야드 공간에 들어가고 courtEave는 논리 상한일 뿐 이 export는 지붕 mesh를 반환하지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 열린 마당의 논리 상한 3.20m(주랑 처마 지지 높이)를 cell 상한으로 쓰며 방 밖 영역이나 숨은 부속실을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 상한은 templeRoofRules.courtEave이고 plan은 ServiceYardPlan 하나라 보관실 영역이나 마당 위 실체 천장을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 마당 body cell(상한 court-eave)과 서·동 두 문턱 cell을 함께 돌려주며 대지 connector와 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 하나의 exact yard 공간이 body·west door·east exterior door cell을 담아 두 connector 종점의 내부성을 함께 판정하게 한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/service-yard.md#yard-volume의 4.0×7.2m 열린 범위와 court-eave 상한이 그대로 성립했고 두 connector 끝점이 마당 cell 안에 들어 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 마당의 기존 네 기준선과 courtEave를 논리 cell에만 쓰고 두 문턱도 기존 passage여서 야드 상한을 고칠 이유가 없었다.
 */
export const templeServiceYard = (): IAutoMovieBuiltSpace => ({
  id: "service-yard", kind: "service-yard", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("service-yard.body", templeServiceYardPlan, y.floor, templeRoofRules.courtEave),
    ...thresholdCells("service-yard", templeDoorPassages, y.floor),
  ],
});
