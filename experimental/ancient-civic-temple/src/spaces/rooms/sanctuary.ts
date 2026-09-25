/**
 * docs/spaces/rooms/sanctuary.md#sanctuary-volume의 제실 본체와 문턱.
 * 평평한 천장으로 자르지 않고 합성된 실제 지붕 하부를 cell 상한으로 쓴다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/sanctuary.md 제실 본체 평면을 기준선 네 값(west-ring~east-ring, north-inner~sanctuary-front)으로 둔다.
 * @evidenceReview spaces/rooms/sanctuary.md #91d05c8 # SanctuaryPlan의 네 경계가 westRing·eastRing·northInner·sanctuaryFront를 사용해 후면 축 제실 한 칸을 정의한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 제실 끝선을 west-ring·east-ring·north-inner·sanctuary-front 네 기준선 이름으로만 정하고 제단 단이나 벽감 치수를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 평면 객체에는 네 templePlan 선만 있으며 제단 국소 석단이나 감실 recess 치수는 제실 geometry로 끌어오지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형 하나로 제실 바닥과 지붕 하부 cell이 같은 평면을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # Floor와 sanctuary roofedCells가 동일한 plan을 참조해 제실 바닥 외곽과 지붕 아래 부피가 다른 방으로 갈라지지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/sanctuary.md의 제실 범위(west-ring~east-ring, north-inner~sanctuary-front)를 그대로 옮겼고 벽·문턱과의 접면이 겹침 0으로 맞았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 부모의 제실 네 경계가 그대로 plan에 들어가고 제단 위치·채광구는 이 객체가 고르지 않아 평면 개정이 없다.
 */
export const templeSanctuaryPlan = {
  west: p.westRing, east: p.eastRing, north: p.northInner, south: p.sanctuaryFront,
} as const;

/**
 * 제단의 국소 단을 발명하지 않고 제실 본체와 기존 문턱만 만든다.
 * @evidence spaces/rooms/sanctuary.md 제실 본체와 주랑 쪽 양개 문턱 바닥을 한 표면 소유(surface.sanctuary.floor)의 slab과 support로 낸다.
 * @evidenceReview spaces/rooms/sanctuary.md #91d05c8 # sanctuary Floor는 body와 남쪽 양개 문 passage를 한 방 id로 roomFloorInput에 넘겨 문턱 바닥을 제실 소유로 둔다.
 * @evidence spaces/storey.md#threshold-support 남측 door-sanctuary 문턱 slab은 벽 두께 전체와 틀 폭까지, support는 유효 폭 1.4m까지만 제실이 소유하게 roomFloorInput에 문 표를 넘긴다.
 * @evidenceReview spaces/storey.md#threshold-support #6354225 # door-sanctuary passage와 slabThickness를 제공해 제실 남벽 안의 넓은 slab 및 통과 폭 support를 제실 floor가 방출한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 완성면 Y=0과 구조체 0.18m는 층 값을 받고 문 표에서 room=sanctuary인 남쪽 문 하나만 골라 문턱을 만들며 제단의 국소 단을 발명하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 바닥 높이와 구조 두께는 storey에서 오며 roomFloorInput이 sanctuary 문만 골라 제단의 국소 단을 바닥에 복제하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 제실 body 구획과 door-sanctuary 문턱 slab·support 구획을 함께 돌려줘 바닥 면 생성과 남측 경계의 문턱 예약이 같은 입력을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 한 floor 결과가 sanctuary body와 door-sanctuary 문턱을 함께 소유해 남측 경계 void와 실제 통과 바닥이 같은 passage에서 나온다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 제실 바닥과 door-sanctuary 문턱 소유가 rooms/sanctuary.md와 storey.md#threshold-support 그대로 남측 경계 문 void와 맞았고 제단 단 없는 평바닥 결정에서 고칠 것이 드러나지 않았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 제실 Floor가 판정된 본체 평바닥과 남벽 문턱만 낼 뿐 제단 단을 새 slab으로 만들지 않아 상위 바닥 설계가 유지된다.
 */
export const templeSanctuaryFloor = () => roomFloorInput(
  "sanctuary", [{ ...templeSanctuaryPlan, id: "body", floor: y.floor }],
  templeDoorPassages, y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/sanctuary.md 제실 공간 레코드(id sanctuary, 부모 temple-ground)를 exact cell로 낸다.
 * @evidenceReview spaces/rooms/sanctuary.md #91d05c8 # sanctuary id·kind와 단층 parent를 가진 레코드 하나가 제실 본체 및 문턱 cell을 담는다.
 * @evidence spaces/rooms/sanctuary.md#sanctuary-volume 11.2×5.5m 제실 본체를 제실 지붕 두 조각으로 나눈 cell과 제실 남벽 양개문(door-sanctuary, 폭 1.4m) 문턱 cell을 한 공간으로 둔다.
 * @evidenceReview spaces/rooms/sanctuary.md#sanctuary-volume #9967bd3 # tier sanctuary 두 roof patch 아래 body cell과 door-sanctuary threshold가 하나의 제실 공간에 합쳐져 내부 순환은 주랑 문 하나로 열린다.
 * @evidence principles/core/source-units.md#source-scope-preservation 합성된 제실 지붕 하부(평평한 천장이 아님)를 cell 상한으로 쓰며 방 밖 영역이나 숨은 부속실을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # roof.filter가 sanctuary tier만 골라 상한을 실제 경사 지붕 하부에 두며 평판 천장이나 방 밖 cell을 추가하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 제실 지붕 조각마다 roofedCells로 나눈 body cell과 door-sanctuary 문턱 cell을 함께 돌려주며 cell 상한이 평평한 천장이 아니라 합성된 지붕 하부를 따른다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # roofedCells가 제실 plan을 지붕 두 면으로 분해하고 thresholdCells가 남벽 양개문을 더해 경사 상한의 단일 제실 레코드를 완성한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/sanctuary.md#sanctuary-volume의 11.2×5.5m 범위와 지붕 하부 상한이 그대로 성립했고 door-sanctuary connector 끝점이 제실 cell 안에 들었다. 채광구 결속 결함은 이 방이 아니라 openings.md에서 고쳤다(c7af729c).
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 제실 plan과 sanctuary roof patch·기존 door passage가 맞고 채광구 결속은 openings owner에서 수리됐으므로 방 부피 부모를 다시 열지 않았다.
 */
export const templeSanctuary = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "sanctuary", kind: "sanctuary", parent: y.storey, fidelity: "exact",
  cells: [
    ...roofedCells("sanctuary.body", templeSanctuaryPlan, y.floor, roof.filter((patch) => patch.tier === "sanctuary")),
    ...thresholdCells("sanctuary", templeDoorPassages, y.floor),
  ],
});
