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
 * @evidence principles/core/source-units.md#source-scope-preservation 계단 치수만 가지며 경로는 circulation이 소비한다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 바닥 구획과 계단 connector가 같은 치수를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md#entrance-volume의 1.8·0.35·0.12m를 그대로 옮겼다.
 */
export const templeEntranceSteps = { width: 1.8, tread: 0.35, rise: 0.12 } as const;

/**
 * 둘째 디딤과 참은 같은 높이의 한 면이며 추가 챌면을 만들지 않는다.
 * @evidence spaces/rooms/entrance.md 첫 디딤, 둘째 디딤과 참을 합친 상부참, 양측 받침의 네 구획 완성면을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 둘째 디딤과 참 사이에 추가 챌면을 만들지 않고 중앙 폭은 계단 폭의 절반을 축 양쪽에 적용한다.
 * @evidence principles/core/source-units.md#source-substantive-completion id·범위·완성면을 가진 구획 목록으로 바닥 slab과 cell 하한이 같은 값을 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md의 구간 표(첫 디딤 -0.12, 참·받침 0)를 그대로 구현했다.
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
 * @evidence principles/core/source-units.md#source-scope-preservation 외벽 하단은 호출자가 넘긴 값만 쓰고 지면을 여기서 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion null이면 기본 두께, 값이 있으면 앞쪽 구획 하단을 낮춘 입력을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md#entrance-volume과 storey.md#wall-ground-contact의 앞쪽 석단 접지를 그대로 구현했다.
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
 * @evidence spaces/rooms/entrance.md#entrance-volume 각 구획의 실제 완성면을 cell 하한으로, 합성 포치 지붕 하부를 상한으로 써서 석재 내부를 공간에 넣지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 계단 최저 높이를 현관 전체에 복사하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion roofedCells가 포치 지붕 덮임을 검사하고 문턱 cell을 더한 공간을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/entrance.md#entrance-volume의 구획·상한·문턱을 그대로 구현했다.
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
