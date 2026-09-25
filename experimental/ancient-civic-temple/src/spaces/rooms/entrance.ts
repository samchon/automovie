/**
 * docs/spaces/rooms/entrance.md#entrance-volume의 후퇴 포치와 두 단.
 * 석재 내부를 공간에 넣지 않도록 각 실제 완성면을 cell 하한으로 쓴다.
 * 아래 디딤/참 입력은 이후 바닥 geometry가 그대로 소비할 단독 소유다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { roomFloorInput } from "../../geometry/floor-input";
import type { RoofPatch } from "../../geometry/planar-domain";
import { roofedCells, thresholdCells } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeDoorPassages } from "../openings";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/entrance.md 두 단 석단의 폭 1.8m, 디딤 0.35m, 단높이 0.12m를 둔다.
 * @evidenceReview spaces/rooms/entrance.md # EntranceSteps의 세 값 1.8·0.35·0.12m가 현관 두 단의 폭·디딤·상승을 그대로 지정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 계단 치수만 가지며 경로는 circulation이 소비한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 이 export는 width·tread·rise 세 치수만 가지고 입구 route나 connector를 직접 생성하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 바닥 구획과 계단 connector가 같은 치수를 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 상수 객체가 entrance floors의 half·firstBack과 circulation의 step connector 입력을 함께 지탱한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md#entrance-volume의 1.8·0.35·0.12m를 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 석단 치수 세 값을 판정된 현관 설계에서 그대로 받았고 source에서 계단 수나 위치를 바꾸지 않았다.
 */
export const templeEntranceSteps = { width: 1.8, tread: 0.35, rise: 0.12 } as const;

/**
 * 둘째 디딤과 참은 같은 높이의 한 면이며 추가 챌면을 만들지 않는다.
 * @evidence spaces/rooms/entrance.md 첫 디딤, 둘째 디딤과 참을 합친 상부참, 양측 받침의 네 구획 완성면을 낸다.
 * @evidenceReview spaces/rooms/entrance.md # Floors의 first-tread·upper-landing·west-support·east-support 네 구획에서 둘째 디딤과 참은 별도 경계 없이 같은 상부참이다.
 * @evidence principles/core/source-units.md#source-scope-preservation 둘째 디딤과 참 사이에 추가 챌면을 만들지 않고 중앙 폭은 계단 폭의 절반을 축 양쪽에 적용한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # half=steps.width/2를 양쪽 경계로 쓰고 상부참 한 구획만 반환해 중간 높이의 가짜 챌면이 생기지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion id·범위·완성면을 가진 구획 목록으로 바닥 slab과 cell 하한이 같은 값을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 네 반환 구획에 각각 id·네 평면 끝선·floor가 있어 바닥 생성과 roofedCells가 동일한 단높이를 소비한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md의 구간 표(첫 디딤 -0.12, 참·받침 0)를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 첫 디딤은 road+rise, 나머지 참과 받침은 y.floor라 설계의 −0.12/0m 두 완성면만 구현한다.
 */
export const templeEntranceFloors = () => {
  const half = templeEntranceSteps.width / 2;
  const firstBack = p.southOuter - templeEntranceSteps.tread;
  return [
    { id: "first-tread", west: -half, east: half, north: firstBack, south: p.southOuter,
      floor: y.publicRoad + templeEntranceSteps.rise },
    { id: "upper-landing", west: -half, east: half, north: p.entranceFront, south: firstBack,
      floor: y.floor },
    { id: "west-support", west: p.westPorchInner, east: -half,
      north: p.entranceFront, south: p.southOuter, floor: y.floor },
    { id: "east-support", west: half, east: p.eastPorchInner,
      north: p.entranceFront, south: p.southOuter, floor: y.floor },
  ];
};

/**
 * 실제 단높이와 양측 기둥 받침, 후퇴벽 안 문턱을 함께 반환한다.
 * south-outer에서 대지 지면에 닿는 구획은 공통 외벽 하단까지 구조체를 내린다.
 * @evidence spaces/rooms/entrance.md 현관 네 구획과 후퇴벽 문턱의 바닥 입력을 내고 south-outer에서 지면에 닿는 구획은 공통 외벽 하단까지 구조체를 내린다.
 * @evidenceReview spaces/rooms/entrance.md # Floor가 네 현관 구획과 문 passage를 묶고 southOuter에 닿은 slab만 exteriorBottom으로 늘려 접지부를 연결한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 외벽 하단은 호출자가 넘긴 값만 쓰고 지면을 여기서 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # exteriorBottom 인수를 null일 때는 그대로 두고 제공됐을 때도 slab.bottom만 낮추며 site ground를 방 소스에 추가하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion null이면 기본 두께, 값이 있으면 앞쪽 구획 하단을 낮춘 입력을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # null과 숫자 분기가 각각 기본 roomFloorInput 또는 southOuter 구획의 낮아진 bottom을 반환해 지면 접촉 입력이 누락되지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md#entrance-volume과 storey.md#wall-ground-contact의 앞쪽 석단 접지를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 남면 접지 하단은 기존 storey 계열 호출자가 주고 계단 plan은 entrance 예약을 유지하므로 상위 접지선을 바꾸지 않았다.
 */
export const templeEntranceFloor = (exteriorBottom: number | null) => {
  const input = roomFloorInput("entrance", templeEntranceFloors(), templeDoorPassages, y.slabThickness, y.floor);
  if (exteriorBottom === null) return input;
  return {
    ...input,
    slabs: input.slabs.map((slab) => slab.south === p.southOuter
      ? { ...slab, bottom: Math.min(slab.bottom, exteriorBottom) } : slab),
  };
};

/**
 * @evidence spaces/rooms/entrance.md 현관 공간 레코드(id entrance)를 구획별 포치 지붕 하부 cell과 문턱 cell로 낸다.
 * @evidenceReview spaces/rooms/entrance.md # 반환되는 entrance 공간 하나가 네 구획의 roofedCells와 후퇴벽 door passage의 thresholdCells를 함께 가진다.
 * @evidence spaces/rooms/entrance.md#entrance-volume 각 구획의 실제 완성면을 cell 하한으로, 합성 포치 지붕 하부를 상한으로 써서 석재 내부를 공간에 넣지 않는다.
 * @evidenceReview spaces/rooms/entrance.md#entrance-volume # roofedCells마다 region.floor가 하한이고 porch tier patch가 상한이라 낮은 첫 디딤 높이를 옆 받침에 복사하지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 계단 최저 높이를 현관 전체에 복사하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 각 region 자체 floor를 roofedCells에 넘기므로 first-tread의 낮은 하한이 upper-landing·양쪽 support cell에 번지지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion roofedCells가 포치 지붕 덮임을 검사하고 문턱 cell을 더한 공간을 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 네 roofedCells 호출과 entrance thresholdCells 결과가 단층 exact 레코드에 합쳐져 현관 전 영역의 덮임과 문턱이 함께 제공된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md#entrance-volume의 구획·상한·문턱을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 현관 네 완성면과 기존 porch patch·door passage를 교차했을 뿐 새 공간 구획이나 층 높이 결정이 드러나지 않았다.
 */
export const templeEntrance = (roof: readonly RoofPatch[]): IAutoMovieBuiltSpace => ({
  id: "entrance", kind: "entrance", parent: y.storey, fidelity: "exact",
  cells: [
    ...templeEntranceFloors().flatMap((region) => roofedCells(
      `entrance.${region.id}`, region, region.floor, roof.filter((patch) => patch.tier === "porch"),
    )),
    ...thresholdCells("entrance", templeDoorPassages, y.floor),
  ],
});
