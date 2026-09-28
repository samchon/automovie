/**
 * docs/spaces/rooms/colonnade.md#ring-volume의 한 고리.
 * 여섯 평면 영역과 합성 지붕 하부의 교집합은 cell만 나누고 방/벽은 늘리지
 * 않는다. 주랑 표면의 단독 소유는 이 파일에 남으며 부재 충돌은 별도다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/colonnade.md 한 고리 주랑을 북·서·동·남과 현관 양옆 두 영역의 여섯 평면 영역으로 둔다.
 * @evidenceReview spaces/rooms/colonnade.md #8de8813 # regions 배열의 north·west·east·south·southwest·southeast 여섯 조각이 중정의 네 면과 현관 양옆에서 하나의 주랑 고리를 이룬다.
 * @evidence principles/core/source-units.md#source-scope-preservation 영역 끝선을 기준선으로만 정하며 영역 경계는 cell 분해선일 뿐 방·벽을 늘리지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 여섯 사각형은 templePlan 기준선만 참조하고 wall export를 만들지 않으므로 셀 분해가 새 벽이나 방으로 변하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion id가 붙은 여섯 사각형 목록으로 바닥·cell·관찰의 영역 중심이 같은 분해를 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 각 조각의 id와 네 끝선이 Floor·공간 cell·관찰의 공통 region 입력이 되는지 확인했다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/colonnade.md#ring-volume의 여섯 영역을 그대로 옮겼고 영역 합집합이 중정 구멍과 현관 몸체를 비운다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 여섯 region의 안쪽 선이 courtFront·courtBack·westCourt·eastCourt를 따르고 남쪽 둘이 현관 몸체를 피하므로 부모의 고리 경계를 바꿀 이유가 없었다.
 */
export const templeColonnadeRegions = [
  { id: "north", west: p.westRing, east: p.eastRing, north: p.northRing, south: p.courtBack },
  { id: "west", west: p.westRing, east: p.westCourt, north: p.courtBack, south: p.courtFront },
  { id: "east", west: p.eastCourt, east: p.eastRing, north: p.courtBack, south: p.courtFront },
  { id: "south", west: p.westRing, east: p.eastRing, north: p.courtFront, south: p.entranceBack },
  { id: "southwest", west: p.westRing, east: p.westPorchOuter, north: p.entranceBack, south: p.southInner },
  { id: "southeast", west: p.eastPorchOuter, east: p.eastRing, north: p.entranceBack, south: p.southInner },
] as const;

/**
 * cell 분해선을 물리 이음선으로 만들지 않는 한 고리 바닥 입력.
 * @evidence spaces/rooms/colonnade.md 여섯 영역을 한 고리 바닥 소유(surface.colonnade.floor)의 Y=0 slab으로 낸다.
 * @evidenceReview spaces/rooms/colonnade.md #8de8813 # Floor는 여섯 region 모두에 y.floor를 붙여 colonnade 한 owner의 바닥 입력으로 보내며 중정과 현관 바닥을 포함하지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 영역 경계를 물리 이음선으로 만들지 않고 문턱은 각 방이 소유하므로 주랑은 문턱을 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # roomFloorInput의 passage 인수가 빈 배열이고 여섯 region의 공유선은 geometry 입력으로만 쓰여 주랑 소유 문턱이 늘지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 여섯 구획을 가진 바닥 입력을 돌려주며 비균일 격자 면 생성이 내부 접면 없이 한 판으로 만든다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # Floor가 여섯 구획 전체를 한 번의 roomFloorInput 호출로 넘겨 내부 cell 선 대신 연속 바닥 표면을 구성한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/colonnade.md의 한 고리 바닥과 storey.md#threshold-support의 방 소유 문턱을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 주랑 Floor가 door passage를 넣지 않아 방 쪽 threshold-support와 충돌하지 않고 고리 바닥의 기존 소유만 소비한다.
 */
export const templeColonnadeFloor = () => roomFloorInput(
  "colonnade", templeColonnadeRegions.map((region) => ({ ...region, floor: y.floor })),
  [], y.slabThickness, y.floor,
);

/**
 * @evidence spaces/rooms/colonnade.md 주랑 공간 레코드(id colonnade)를 여섯 영역 × 날개 지붕 조각의 exact cell로 낸다.
 * @evidenceReview spaces/rooms/colonnade.md #8de8813 # 반환 레코드는 id와 kind가 colonnade인 하나의 공간이며 여섯 region의 roofedCells를 그 공간의 cells로 합친다.
 * @evidence spaces/rooms/colonnade.md#ring-volume 구멍 있는 하나의 고리를 영역과 합성 날개 지붕 하부의 교집합 cell로 표현하고 덮임이 부족하면 거부한다.
 * @evidenceReview spaces/rooms/colonnade.md#ring-volume #8c8a4cf # 각 영역을 tier wing 지붕 조각으로 roofedCells에 넣어 중정 구멍을 남기고 덮이지 않는 주랑 조각은 성공 값으로 돌리지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 상한은 실제 날개 지붕 하부이며 중정 위나 방 안으로 cell을 넓히지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # roof.filter의 wing 선택과 여섯 경계 region이 주랑 cell의 평면·상한을 제한해 sanctuary 지붕이나 중정 상공을 채우지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion roofedCells가 영역마다 지붕 덮임을 검사해 부족하면 오류로 멈추고, 성공하면 모든 cell을 가진 공간을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # flatMap 안의 roofedCells가 여섯 영역 각각의 wing patch 덮임을 요구하며 성공 때만 정확한 주랑 cell 배열을 반환한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/colonnade.md#ring-volume의 한 공간·여섯 영역·지붕 하부 상한을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # colonnade 공간은 기존 여섯 영역과 실제 날개 지붕 하부만 교차시키므로 새 순환 루프나 상한 재설계를 요구하지 않았다.
 */
export const templeColonnade = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "colonnade", kind: "colonnade", parent: y.storey, fidelity: "exact",
  cells: templeColonnadeRegions.flatMap((region) => roofedCells(
    `colonnade.${region.id}`, region, y.floor, roof.filter((patch) => patch.tier === "wing"),
  )),
});
