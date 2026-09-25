/** docs/spaces/rooms/records.md#records-volume의 중앙 기록실과 직접 문턱. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/records.md 기록실 본체 평면을 기준선 네 값(east-room~east-inner, records-back~records-front)으로 둔다.
 * @evidenceReview spaces/rooms/records.md #04708a2 # RecordsPlan의 네 변이 eastRoom·eastInner·recordsBack·recordsFront라 관리실과 보관실 사이의 중간 방에만 걸친다.
 * @evidence principles/core/source-units.md#source-scope-preservation 기록실 끝선을 east-room·east-inner·records-back·records-front 네 기준선 이름으로만 정하고 방 안 새 치수를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 네 끝선이 templePlan 참조이고 별도의 숫자나 중간 칸막이 값이 없어 기록실 경계를 재설계하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 기록실 바닥·body cell·널판 천장이 관리실과 보관실 사이의 같은 평면을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 하나의 RecordsPlan 객체를 Floor·body cell·Ceiling이 같이 사용해 기록실 전후 경계가 구성마다 달라지지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/records.md의 기록실 범위(east-room~east-inner, records-back~records-front)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 기록실 plan은 부모의 네 기준선만 옮기고 문턱을 새 위치로 옮기지 않아 records-volume의 수정이 필요하지 않았다.
 */
export const templeRecordsPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.recordsBack, south: p.recordsFront,
} as const;

/**
 * 기록실 바닥과 주랑 쪽 wall-depth 문턱의 실체/support 입력.
 * @evidence spaces/rooms/records.md 기록실 본체와 주랑 쪽 문턱 바닥을 한 표면 소유(surface.records.floor)의 slab과 support로 낸다.
 * @evidenceReview spaces/rooms/records.md #04708a2 # records id로 body와 문 passage를 같은 roomFloorInput에 주어 중간 기록실 바닥과 직접 문턱의 owner를 묶는다.
 * @evidence spaces/storey.md#threshold-support 동측 spine의 door-records 문턱 slab은 벽 두께 전체와 틀 폭까지, support는 유효 폭 1.0m까지만 기록실이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidenceReview spaces/storey.md#threshold-support #6354225 # floor 입력이 기록실 id 및 templeDoorPassages를 받아 door-records의 wall-depth slab과 좁은 support를 기록실에 귀속할 수 있다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 door-records(중심 Z=3.725) 하나만 골라 문턱을 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 두 높이는 y.floor·y.slabThickness이고 door-records는 passage 소유에 따라 선택되어 이 함수 안의 독립 위치 리터럴이 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion 기록실 body 구획과 door-records 문턱 slab·support 구획을 함께 돌려줘 바닥 면 생성과 동측 spine의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # roomFloorInput 한 결과 안에 records body slab과 문턱 slab/support가 있어 동측 spine void와 바닥 생성이 같은 passage를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 기록실 바닥과 door-records 문턱 소유가 rooms/records.md와 storey.md#threshold-support 그대로 성립했고 관리실·보관실 바닥과 칸막이 벽 아래에서 겹치지 않아 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # records body 구획과 door-records 한 문턱만 바닥으로 보내 이웃 두 업무방의 바닥을 침범하는 새 구획이 없다.
 */
export const templeRecordsFloor = () => roomFloorInput(
  "records", [{ ...templeRecordsPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/records.md 기록실 공간 레코드(id records, 부모 temple-ground)를 exact cell로 낸다.
 * @evidenceReview spaces/rooms/records.md #04708a2 # 반환 레코드가 records id·kind와 temple-ground parent를 유지하며 별도 열람실 공간을 만들지 않는다.
 * @evidence spaces/rooms/records.md#records-volume 기록실 본체 4.0×3.75m와 주랑 쪽 문(door-records, 중심 Z=3.725) 문턱 cell을 한 공간으로 두고 남북 공유 벽은 닫혀 있다.
 * @evidenceReview spaces/rooms/records.md#records-volume #1d1d419 # records.body 한 levelCell과 기록실 passage 문턱만 같은 cells에 있어 북쪽·남쪽 공유벽에 추가 출입 cell이 없다.
 * @evidence principles/core/source-units.md#source-scope-preservation 층의 낮은 천장 3.10m를 기록실 cell 상한으로 쓰며 이웃 관리실·보관실 영역을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # RecordsPlan과 y.lowCeiling이 cell 평면·상한을 고정해 administration 또는 storage 부피로 넓히지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 기록실 body cell과 door-records 문턱 cell을 함께 가진 공간 레코드를 돌려주며 관찰 station과 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # levelCell 및 thresholdCells가 한 records 공간에 들어가 주랑 쪽 출입 관찰의 내부성 판정에 두 부피가 제공된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/records.md#records-volume의 4.0×3.75m 범위·3.10m 상한이 그대로 성립했고 door-records connector 끝점이 기록실 cell 안에 들어 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 본체 plan과 lowCeiling, 기존 door-records 문턱만 사용해 기록실 공간 범위나 connector 종점을 수정하지 않았다.
 */
export const templeRecords = (): IAutoMovieBuiltSpace => ({
  id: "records", kind: "records", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("records.body", templeRecordsPlan, y.floor, y.lowCeiling),
    ...thresholdCells("records", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 * @evidence spaces/rooms/records.md 기록실의 낮은 널판 천장 실체를 아랫면 3.10m, 두께 0.10m의 판으로 낸다.
 * @evidenceReview spaces/rooms/records.md #04708a2 # Ceiling이 records plan을 3.10m y.lowCeiling과 0.10m y.ceilingBoardReserve로 닫아 판정된 기록실 천장 판을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 기록실 평면에 층의 낮은 천장 높이와 널판 예약만 쓰고 칸 선반을 받칠 노출 보는 만들지 않는다(후속 부재).
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 천장 호출은 records plan과 층 값만 쓰며 칸 선반·노출 장선 부재를 이 공간 소스가 직접 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces로 기록실 4.0×3.75m 판의 아랫면을 surface.records.ceiling, 윗면과 옆면을 ceiling-back으로 가진 닫힌 판을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # records id의 ceilingBoardFaces가 본체 평면 전체에 노출 아랫면과 구조 뒷면을 가진 닫힌 판을 반환한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 기록실 널판 천장은 rooms/records.md와 storey.md의 3.10m·0.10m 예약 그대로 관리실·보관실 천장과 칸막이 벽 위에서 겹치지 않았고 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 기록실 천장은 기존 기준선과 낮은 천장 예약만 사용하며 이웃 두 방의 천장 plan과 공유 칸막이 치수를 바꾸지 않았다.
 */
export const templeRecordsCeiling = () => ceilingBoardFaces(
  "records", rectanglePolygon(templeRecordsPlan), y.lowCeiling, y.ceilingBoardReserve,
);
