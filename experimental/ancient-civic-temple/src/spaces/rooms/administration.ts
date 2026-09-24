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
 * @evidence principles/core/source-units.md#source-scope-preservation 관리실 끝선을 east-room·east-inner·office-back·south-inner 네 기준선 이름으로만 정하고 방 안 새 치수를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 관리실 바닥·body cell·널판 천장이 같은 4.0×3.75m 평면을 받는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/administration.md의 관리실 범위(east-room~east-inner, office-back~south-inner)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 */
export const templeAdministrationPlan = {
  west: p.eastRoom, east: p.eastInner, north: p.officeBack, south: p.southInner,
} as const;

/**
 * 본체와 직접 문턱을 같은 완결 바닥 표면에 결속한다.
 * @evidence spaces/rooms/administration.md 관리실 본체와 주랑 쪽 문턱 바닥을 한 표면 소유(surface.administration.floor)의 slab과 support로 낸다.
 * @evidence spaces/storey.md#threshold-support 동측 spine의 door-administration 문턱 slab은 벽 두께 전체와 틀 폭까지, support는 유효 폭 1.0m까지만 관리실이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 door-administration(중심 Z=7.65) 하나만 골라 문턱을 만든다.
 * @evidence principles/core/source-units.md#source-substantive-completion 관리실 body 구획과 door-administration 문턱 slab·support 구획을 함께 돌려줘 바닥 면 생성과 동측 spine의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 관리실 바닥 한 구획과 door-administration 문턱 소유가 rooms/administration.md와 storey.md#threshold-support 그대로 동측 spine 문 void와 맞았고 부모에서 고칠 결정이 드러나지 않았다.
 */
export const templeAdministrationFloor = () => roomFloorInput(
  "administration", [{ ...templeAdministrationPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/administration.md 관리실 공간 레코드(id administration, 부모 temple-ground)를 exact cell로 낸다.
 * @evidence spaces/rooms/administration.md#office-volume 관리실 본체 4.0×3.75m와 동측 spine의 주랑 쪽 문(door-administration, 중심 Z=7.65) 문턱 cell을 한 공간으로 두고 상한은 널판 천장 아랫면이다.
 * @evidence principles/core/source-units.md#source-scope-preservation 층의 낮은 천장 3.10m를 관리실 cell 상한으로 쓰며 기록실 쪽 칸막이 너머나 숨은 부속실을 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 관리실 body cell과 door-administration 문턱 cell을 함께 가진 공간 레코드를 돌려주며 관찰 station과 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/administration.md#office-volume의 4.0×3.75m 범위·3.10m 상한·문 위치가 그대로 성립했고 door-administration connector 끝점이 관리실 cell 안에 들어 부모에서 고칠 결정이 없었다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 관리실 평면에 층의 낮은 천장 높이와 널판 예약만 쓰고 노출 보는 만들지 않는다(후속 부재).
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces로 관리실 4.0×3.75m 판의 아랫면을 surface.administration.ceiling, 윗면과 옆면을 ceiling-back으로 가진 닫힌 판을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 관리실 널판 천장은 rooms/administration.md와 storey.md의 3.10m·0.10m 예약 그대로 이웃 기록실 천장과 칸막이 벽 위에서 겹치지 않았고 부모에서 고칠 결정이 없었다.
 */
export const templeAdministrationCeiling = () => ceilingBoardFaces(
  "administration", rectanglePolygon(templeAdministrationPlan), y.lowCeiling, y.ceilingBoardReserve,
);
