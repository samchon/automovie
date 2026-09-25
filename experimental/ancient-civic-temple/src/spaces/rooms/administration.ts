/** docs/spaces/rooms/administration.md#office-volume의 전면 업무방과 직접 문턱. */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/administration.md 관리실 본체 평면을 기준선 네 값(east-room~east-inner, office-back~south-inner)으로 둔다.
 * @evidenceReview spaces/rooms/administration.md #1dfdf37 # templeAdministrationPlan의 서·동·북·남 값이 관리실 본체에 선언된 네 기준선을 각각 가리키며 이웃 기록실 구간을 포함하지 않는지 확인했다.
 * @evidence principles/core/source-units.md#source-scope-preservation 관리실 끝선을 east-room·east-inner·office-back·south-inner 네 기준선 이름으로만 정하고 방 안 새 치수를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 export에는 네 plan datum의 참조만 있고 치수 리터럴이나 기록실 경계를 바꾸는 분기가 없어 공간 설계를 보존한다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 관리실 바닥·body cell·널판 천장이 같은 4.0×3.75m 평면을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # plan 객체 한 개를 Floor·Body·Ceiling 세 호출이 모두 사용하므로 관리실 바닥과 상부가 다른 평면으로 벌어질 수 없는지 대조했다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/administration.md의 관리실 범위(east-room~east-inner, office-back~south-inner)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # administration 평면 네 끝선이 부모의 업무방 범위와 같고 문턱 생성은 별도 Floor에서 처리하므로 이 평면 선언이 부모 치수를 고치게 하지 않았다.
 */
export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;

/**
 * 본체와 직접 문턱을 같은 완결 바닥 표면에 결속한다.
 * @evidence spaces/rooms/administration.md 관리실 본체와 주랑 쪽 문턱 바닥을 한 표면 소유(surface.administration.floor)의 slab과 support로 낸다.
 * @evidenceReview spaces/rooms/administration.md #1dfdf37 # Floor의 roomFloorInput에 administration 한 본체 구획과 문 표를 같이 넘겨 floor owner가 방 본체와 문턱을 함께 방출하는지 확인했다.
 * @evidence spaces/storey.md#threshold-support 동측 spine의 door-administration 문턱 slab은 벽 두께 전체와 틀 폭까지, support는 유효 폭 1.0m까지만 관리실이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidenceReview spaces/storey.md#threshold-support #6354225 # 관리실 바닥 입력이 templeDoorPassages와 slabThickness를 받아 door-administration의 벽 두께 문턱을 같은 방 owner 아래 두며 주랑 바닥에 넘기지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 door-administration(중심 Z=7.65) 하나만 골라 문턱을 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # floor와 slabThickness는 storey 값이며 문턱 목록은 passage 입력에서 administration과 결합되어 이 함수가 독립적인 높이나 문 위치를 발명하지 않는지 확인했다.
 * @evidence principles/core/source-units.md#source-substantive-completion 관리실 body 구획과 door-administration 문턱 slab·support 구획을 함께 돌려줘 바닥 면 생성과 동측 spine의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # roomFloorInput의 반환에 body와 door-administration threshold가 함께 들어가므로 하나의 관리실 바닥 export가 직접 문턱까지 완결한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 관리실 바닥 한 구획과 door-administration 문턱 소유가 rooms/administration.md와 storey.md#threshold-support 그대로 동측 spine 문 void와 맞았고 부모에서 고칠 결정이 드러나지 않았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 관리실 문턱은 door-administration의 기존 passage로 생성되고 추가 문이나 slab 높이 변경이 이 바닥 export에 없어 부모의 문턱 소유를 유지한다.
 */
export const templeAdministrationFloor = () => roomFloorInput(
  "administration", [{ ...templeAdministrationPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/administration.md 관리실 공간 레코드(id administration, 부모 temple-ground)를 exact cell로 낸다.
 * @evidenceReview spaces/rooms/administration.md #1dfdf37 # 반환 공간의 id·kind가 administration이고 parent가 단층 storey라 별도 층이나 숨은 방 레코드를 만들지 않는다.
 * @evidence spaces/rooms/administration.md#office-volume 관리실 본체 4.0×3.75m와 동측 spine의 주랑 쪽 문(door-administration, 중심 Z=7.65) 문턱 cell을 한 공간으로 두고 상한은 널판 천장 아랫면이다.
 * @evidenceReview spaces/rooms/administration.md#office-volume #59ae103 # levelCell의 plan과 lowCeiling이 본체 범위·3.10m 상한을 정하고 thresholdCells가 같은 administration 아래 직접 문턱 cell을 더하는지 확인했다.
 * @evidence principles/core/source-units.md#source-scope-preservation 층의 낮은 천장 3.10m를 관리실 cell 상한으로 쓰며 기록실 쪽 칸막이 너머나 숨은 부속실을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 공간 cell은 administration plan 및 해당 문턱만으로 구성되고 y.lowCeiling을 사용하므로 기록실 쪽으로 확장하는 새 경계가 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion 관리실 body cell과 door-administration 문턱 cell을 함께 가진 공간 레코드를 돌려주며 관찰 station과 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # body levelCell과 administration thresholdCells를 한 cells 배열로 결합해 관찰의 inside 판정에 필요한 두 구획을 같은 공간에 제공한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/administration.md#office-volume의 4.0×3.75m 범위·3.10m 상한·문 위치가 그대로 성립했고 door-administration connector 끝점이 관리실 cell 안에 들어 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # office-volume의 단일 본체와 기존 door-administration 문턱만 방 cell로 받았으며 천장 상한도 storey 예약을 사용해 부모 room volume 변경이 필요하지 않았다.
 */
export const templeAdministration = (): IAutoMovieBuiltSpace => ({
  id: "administration", kind: "administration", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("administration.body", templeAdministrationPlan, y.floor, y.lowCeiling),
    ...thresholdCells("administration", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 * @evidence spaces/rooms/administration.md 관리실의 낮은 널판 천장 실체를 아랫면 3.10m, 두께 0.10m의 판으로 낸다.
 * @evidenceReview spaces/rooms/administration.md #1dfdf37 # ceilingBoardFaces가 관리실 평면과 lowCeiling·ceilingBoardReserve를 받아 3.10m 아랫면의 닫힌 천장 판을 형성한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 관리실 평면에 층의 낮은 천장 높이와 널판 예약만 쓰고 노출 보는 만들지 않는다(후속 부재).
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 export는 관리실 평면과 층의 두 높이 매개변수만 전달하고 노출 목재 보는 모델 소유로 남긴다.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces로 관리실 4.0×3.75m 판의 아랫면을 surface.administration.ceiling, 윗면과 옆면을 ceiling-back으로 가진 닫힌 판을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # ceilingBoardFaces의 administration 소유와 직사각 평면 입력으로 천장 정면과 뒷면이 같은 방 범위에서 방출되는지 확인했다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 관리실 널판 천장은 rooms/administration.md와 storey.md의 3.10m·0.10m 예약 그대로 이웃 기록실 천장과 칸막이 벽 위에서 겹치지 않았고 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 관리실 천장은 기존 lowCeiling과 boardReserve를 사용하며 독립 ceilingBoardFaces 구획이라 기록실 천장 치수나 층 예약을 재정의하지 않았다.
 */
export const templeAdministrationCeiling = () => ceilingBoardFaces(
  "administration", rectanglePolygon(templeAdministrationPlan), y.lowCeiling, y.ceilingBoardReserve,
);
