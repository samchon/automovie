/** docs/spaces/rooms/storage.md#storage-volume의 후면 보관실과 직접 문턱. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/storage.md 보관실 본체 평면을 기준선 네 값(east-room~east-inner, storage-back~storage-front)으로 둔다.
 * @evidenceReview spaces/rooms/storage.md # StoragePlan의 eastRoom·eastInner·storageBack·storageFront가 기록실 뒤 서비스 마당 앞 보관실의 네 끝선이다.
 * @evidence principles/core/source-units.md#source-scope-preservation 보관실 끝선을 east-room·east-inner·storage-back·storage-front 네 기준선 이름으로만 정하고 방 안 새 치수를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 plan은 네 datum 참조만 있어 보관실 내부에 새 수납방을 분리할 수평선을 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 보관실 바닥·body cell·널판 천장이 기록실과 서비스 마당 사이의 같은 평면을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # Floor·Storage 공간·Ceiling이 공통 plan 한 개를 사용해 보관실의 바닥과 상한이 같은 중간 구획을 덮는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/storage.md의 보관실 범위(east-room~east-inner, storage-back~storage-front)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 보관실 네 경계는 부모의 storage-volume에서 왔고 이 객체는 door-storage 위치를 다시 정하지 않아 상위 수리가 없다.
 */
export const templeStoragePlan = {
  west: p.eastRoom, east: p.eastInner, north: p.storageBack, south: p.storageFront,
} as const;

/**
 * 보관실 본체와 반입 문턱이 같은 Y=0 지지면에서 이어진다.
 * @evidence spaces/rooms/storage.md 보관실 본체와 주랑 쪽 문턱 바닥을 한 표면 소유(surface.storage.floor)의 slab과 support로 낸다.
 * @evidenceReview spaces/rooms/storage.md # storage id의 roomFloorInput 하나가 body와 door-storage passage를 받아 본체·반입 문턱을 같은 floor owner로 둔다.
 * @evidence spaces/storey.md#threshold-support 동측 spine의 door-storage 문턱 slab은 벽 두께 전체와 틀 폭까지, support는 유효 폭 1.1m까지만 보관실이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidenceReview spaces/storey.md#threshold-support # door-storage를 포함한 passage 목록을 storage floor에 넘겨 벽 두께 slab과 유효폭 support의 소유가 주랑으로 넘어가지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 room=storage인 반입 문 하나만 골라 문턱을 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 바닥 높이와 구조 두께는 storey 변수이고 roomFloorInput은 storage id를 선택해 이웃 yard 외부 문턱을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 보관실 body 구획과 door-storage 문턱 slab·support 구획을 함께 돌려줘 바닥 면 생성과 동측 spine의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # body 평면과 passage 목록을 한 호출에 전달해 보관실 floor slab 및 유일한 주랑 반입 threshold를 함께 반환한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 보관실 바닥과 door-storage 반입 문턱 소유가 rooms/storage.md와 storey.md#threshold-support 그대로 성립했고 기록실·마당 바닥과 칸막이 벽 아래에서 겹치지 않아 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 보관실 바닥 한 구획과 storage 소유 door passage만 입력해 기록실·마당 구획을 재정의할 필요가 없었다.
 */
export const templeStorageFloor = () => roomFloorInput(
  "storage", [{ ...templeStoragePlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/storage.md 보관실 공간 레코드(id storage, 부모 temple-ground)를 exact cell로 낸다.
 * @evidenceReview spaces/rooms/storage.md # 반환 공간은 storage id·kind 및 단층 parent를 갖고 기록실이나 마당의 cell을 추가하지 않는다.
 * @evidence spaces/rooms/storage.md#storage-volume 보관실 본체 4.0×3.7m와 반입 문(door-storage, 폭 1.1m, 중심 Z=-0.3) 문턱 cell을 한 공간으로 두고 마당 쪽 공유 벽에는 문을 내지 않는다.
 * @evidenceReview spaces/rooms/storage.md#storage-volume # storage.body 한 cell과 door-storage threshold만 합쳐 후면 yard와 맞댄 벽에 새 문턱 cell을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 층의 낮은 천장 3.10m를 보관실 cell 상한으로 쓰며 이웃 기록실·서비스 마당 영역을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # StoragePlan과 y.lowCeiling이 본체 범위를 고정하며 thresholdCells도 storage 방 문만 고른다.
 * @evidence principles/core/source-units.md#source-substantive-completion 보관실 body cell과 door-storage 문턱 cell을 함께 가진 공간 레코드를 돌려주며 관찰 station과 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 단층 exact 공간의 cells가 본체와 반입 문턱 모두를 포함해 주랑 connector의 storage 종점을 검사할 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/storage.md#storage-volume의 4.0×3.7m 범위·3.10m 상한이 그대로 성립했고 door-storage connector 끝점이 보관실 cell 안에 들어 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 부모 storage-volume의 평면·상한과 기존 door-storage를 그대로 합쳐 connector 끝점을 바꾸지 않았다.
 */
export const templeStorage = (): IAutoMovieBuiltSpace => ({
  id: "storage", kind: "storage", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("storage.body", templeStoragePlan, y.floor, y.lowCeiling),
    ...thresholdCells("storage", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 * @evidence spaces/rooms/storage.md 보관실의 낮은 널판 천장 실체를 아랫면 3.10m, 두께 0.10m의 판으로 낸다.
 * @evidenceReview spaces/rooms/storage.md # ceilingBoardFaces가 StoragePlan 위 lowCeiling=3.10m와 boardReserve=0.10m의 보관실 천장을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 보관실 평면에 층의 낮은 천장 높이와 널판 예약만 쓰고 궤 위 노출 보는 만들지 않는다(후속 부재).
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # Ceiling export는 storey의 예약 값으로 판만 만들고 궤·장선 기하를 보관실 공간 소스로 끌어오지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces로 보관실 4.0×3.7m 판의 아랫면을 surface.storage.ceiling, 윗면과 옆면을 ceiling-back으로 가진 닫힌 판을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # storage id와 직사각 plan의 천장 생성은 노출면과 back 면을 분리한 닫힌 판을 보관실 위에 제공한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 보관실 널판 천장은 rooms/storage.md와 storey.md의 3.10m·0.10m 예약 그대로 열린 마당 쪽 벽에서 끝나 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # ceilingBoardFaces의 남북 끝이 StoragePlan에서 정해져 열린 서비스 마당 위로 천장판을 늘리는 부모 변경이 없다.
 */
export const templeStorageCeiling = () => ceilingBoardFaces(
  "storage", rectanglePolygon(templeStoragePlan), y.lowCeiling, y.ceilingBoardReserve,
);
