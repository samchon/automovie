/**
 * docs/spaces/rooms/offering.md#offering-volume의 긴 한 방.
 * 낮은 천장과 벽 두께 안의 문턱을 포함하며 숨은 후실은 만들지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import { rectanglePolygon } from "../../geometry/planar-domain";
import { ceilingBoardFaces } from "../../geometry/roof-solids";
import { levelCell, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/offering.md 봉헌실 본체 평면을 기준선 네 값(west-inner~west-room, north-inner~south-inner)으로 둔다.
 * @evidenceReview spaces/rooms/offering.md # OfferingPlan이 westInner·westRoom·northInner·southInner를 네 변으로 받아 19.3m 긴 봉헌실을 한 사각형으로 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 봉헌실 끝선을 west-inner·west-room·north-inner·south-inner 네 기준선 이름으로만 정하고 긴 방을 후실로 나누는 선을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 plan에는 네 기준선 참조 이외의 격벽선이 없어 긴 방 뒤편을 추가 공간으로 분리하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 봉헌실 바닥·body cell·널판 천장이 서측 날개 전 길이의 같은 평면을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # Floor·levelCell·Ceiling이 같은 OfferingPlan을 소비해 길이 19.3m 공간의 바닥과 천장이 다른 구획을 갖지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/offering.md의 봉헌실 범위(west-inner~west-room, north-inner~south-inner)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 봉헌실 plan의 네 끝선이 부모의 서측 긴 방 범위를 그대로 가리키고 문턱 위치는 여기서 다시 고르지 않아 부모 경계를 고치지 않았다.
 */
export const templeOfferingPlan = {
  west: p.westInner, east: p.westRoom, north: p.northInner, south: p.southInner,
} as const;

/**
 * 긴 방 본체와 동쪽 문턱의 바닥을 하나의 소유로 반환한다.
 * @evidence spaces/rooms/offering.md 봉헌실 본체와 주랑 쪽 문턱 바닥을 한 표면 소유(surface.offering.floor)의 slab과 support로 낸다.
 * @evidenceReview spaces/rooms/offering.md # Floor의 roomFloorInput이 offering body와 door passage를 하나의 방 id로 받아 바닥과 동쪽 직접 문턱을 같은 owner 아래 방출한다.
 * @evidence spaces/storey.md#threshold-support 서측 spine의 door-offering 문턱 slab은 벽 두께 전체와 틀 폭까지, support는 유효 폭 1.2m까지만 봉헌실이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidenceReview spaces/storey.md#threshold-support # offering Floor가 passage 목록과 층 두께를 제공하므로 서측 spine의 door-offering 벽 두께 문턱을 주랑 쪽으로 넘기지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 room=offering인 동쪽 문 하나만 골라 문턱을 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # floor·slab 두 높이는 storey에서 오고 roomFloorInput이 offering 문만 필터하므로 다른 방 문턱이 봉헌실 바닥에 붙지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 봉헌실 body 구획과 door-offering 문턱 slab·support 구획을 함께 돌려줘 바닥 면 생성과 서측 spine의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 한 floor 입력에 body 구획과 passages가 같이 있어 문턱 slab/support를 방 바닥 생성과 분리해 누락하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 봉헌실 19.3m 긴 바닥과 door-offering 문턱 소유가 rooms/offering.md와 storey.md#threshold-support 그대로 서측 spine 문 void와 맞았고 부모에서 고칠 결정이 드러나지 않았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 봉헌실 바닥은 기존 OfferingPlan과 door-offering passage만 받아 서측 spine void나 방 길이를 새로 정하지 않았다.
 */
export const templeOfferingFloor = () => roomFloorInput(
  "offering", [{ ...templeOfferingPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/offering.md 봉헌실 공간 레코드(id offering, 부모 temple-ground)를 exact cell로 낸다.
 * @evidenceReview spaces/rooms/offering.md # 반환 레코드는 id·kind offering과 단층 parent를 갖고 한 body 및 문턱 cell로 긴 봉헌실 한 방을 표현한다.
 * @evidence spaces/rooms/offering.md#offering-volume 4.0×19.3m의 긴 한 방과 서측 spine의 주랑 쪽 문(door-offering, 폭 1.2m, 중심 Z=2.175) 문턱 cell을 한 공간으로 두고 후실로 나누지 않는다.
 * @evidenceReview spaces/rooms/offering.md#offering-volume # levelCell의 긴 plan과 offering thresholdCells가 한 cells 배열에 있으며 추가 back-room 레코드가 없다.
 * @evidence principles/core/source-units.md#source-scope-preservation 층의 낮은 천장 3.10m를 봉헌실 cell 상한으로 쓰며 긴 방 밖 영역이나 숨은 후실을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # y.lowCeiling과 OfferingPlan이 본체 cell을 한정하고 passage는 offering에 속한 문턱만 더해 후실이 생기지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 봉헌실 body cell과 door-offering 문턱 cell을 함께 가진 공간 레코드를 돌려주며 관찰 station과 주랑 connector가 이 cell로 내부성을 판정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 공간 반환값의 cells는 body와 문턱을 함께 담아 주랑 쪽 문턱 관찰이 offering 내부로 귀속될 근거를 제공한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/offering.md#offering-volume의 4.0×19.3m 긴 방 범위·3.10m 상한·후실 없음이 그대로 성립했고 door-offering connector 끝점이 봉헌실 cell 안에 들어 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 방 본체는 기존 긴 평면과 lowCeiling을 쓰고 문턱도 해당 passage만 추가하므로 봉헌실을 나누는 부모 변경이 필요하지 않았다.
 */
export const templeOffering = (): IAutoMovieBuiltSpace => ({
  id: "offering", kind: "offering", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("offering.body", templeOfferingPlan, y.floor, y.lowCeiling),
    ...thresholdCells("offering", templeDoorPassages, y.floor),
  ],
});

/**
 * 낮은 널판 천장 실체. 아랫면 Y=lowCeiling과 위쪽 널판 예약은 층 소유
 * 값을 소비하며 노출 보의 단면은 후속 부재 단계가 이 예약 아래에 둔다.
 * @evidence spaces/rooms/offering.md 봉헌실의 낮은 널판 천장 실체를 아랫면 3.10m, 두께 0.10m의 판으로 낸다.
 * @evidenceReview spaces/rooms/offering.md # ceilingBoardFaces가 OfferingPlan과 y.lowCeiling·ceilingBoardReserve를 받아 긴 방 전체를 덮는 0.10m 널판을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 봉헌실 평면 전체에 층의 낮은 천장 높이와 널판 예약만 쓰고 노출 보는 만들지 않는다(후속 부재).
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 천장 export는 방 평면과 층 높이만 받고 지붕 서까래나 보 형상을 방 소스에 조립하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion ceilingBoardFaces로 봉헌실 전 길이 4.0×19.3m 판의 아랫면을 surface.offering.ceiling, 윗면과 옆면을 ceiling-back으로 가진 닫힌 판을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # offering id의 ceilingBoardFaces 호출이 아랫면과 구조 뒷면을 분리한 닫힌 판을 긴 방 plan 전부에서 생성한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 봉헌실 널판 천장은 rooms/offering.md와 storey.md의 3.10m·0.10m 예약 그대로 서측 날개 지붕 하부 아래에 들어가 부모에서 고칠 결정이 없었다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 봉헌실 천장 아랫면과 두께는 storey 예약 그대로이고 서측 지붕 하부와 별개 판이므로 부모 지붕 높이를 바꾸지 않았다.
 */
export const templeOfferingCeiling = () => ceilingBoardFaces(
  "offering", rectanglePolygon(templeOfferingPlan), y.lowCeiling, y.ceilingBoardReserve,
);
