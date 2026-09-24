/**
 * 신전의 공유 평면 입력. 모든 값은 m, +X는 동쪽, +Z는 정면이다.
 * docs/spaces/building.md#plan-datums의 단일 치수 원본을 구현한다.
 * 방·벽·지붕은 이 값을 소비하며 여기서 표면이나 부재를 생성하지 않는다.
 * 기준선 변경은 모든 하위 공간과 접합의 재검사를 요구한다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { templeLevels } from "./storey";

/**
 * @evidence spaces/building.md 외곽·기준선의 X/Z 좌표를 m 단위 단일 값 객체로 두어 방·벽·지붕·관찰이 같은 치수 원본을 소비한다.
 * @evidence spaces/building.md#plan-datums 표의 west/east-outer ±10.5부터 south-outer 10.25까지 모든 기준선을 같은 이름과 값으로 옮긴다.
 * @evidence spaces/building.md#footprint 21×20.5m 외곽을 outer 네 값으로 정하고 내부 치수는 inner·room·ring·court 기준선의 차로만 나온다.
 * @evidence principles/core/source-units.md#source-scope-preservation 기준선 값만 가지며 표면·부재·공간을 만들지 않고 설계에 없는 기준선을 더하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값 객체로 모든 소비자가 같은 숫자를 컴파일 시점에 받으며 허용 오차 0.001m도 함께 둔다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work building.md의 기준선 표와 21×20.5m 외곽을 그대로 옮겼고 실제 벽·지붕·충돌 스캔이 이 값으로 겹침 0을 냈다.
 */
export const templePlan = {
  westOuter: -10.5, eastOuter: 10.5,
  westInner: -9.9, eastInner: 9.9,
  westRoom: -5.9, eastRoom: 5.9,
  westRing: -5.6, eastRing: 5.6,
  westCourt: -3.5, eastCourt: 3.5,
  westPorch: -1.8, eastPorch: 1.8,
  westPorchInner: -1.65, eastPorchInner: 1.65,
  westPorchOuter: -1.95, eastPorchOuter: 1.95,
  northOuter: -10.25, northInner: -9.65,
  sanctuaryFront: -4.15, northRing: -3.85,
  yardFront: -2.45, storageBack: -2.15,
  courtBack: -1.75, storageFront: 1.55,
  recordsBack: 1.85, recordsFront: 5.6,
  officeBack: 5.9, courtFront: 6.1,
  entranceBack: 8.05, entranceFront: 8.35,
  southInner: 9.65, southOuter: 10.25,
  tolerance: 0.001,
} as const;

/**
 * docs/spaces/building.md#containment의 건물→한 층→아홉 공간을 조립한다.
 * caller가 만든 실제 cell 레코드를 유지하고 빠진/중복/외래 공간은 거부한다.
 * 반환값은 topology의 공간 population이며 물리 element나 접근 검증이 아니다.
 * @evidence spaces/building.md 건물→지상층→아홉 공간의 공간 population을 조립한다.
 * @evidence spaces/building.md#containment 아홉 공간 ID가 정확히 한 번씩, 지상층 부모로, cell 표현으로만 들어오게 하고 누락·중복·외래 공간은 거부한다.
 * @evidence principles/core/source-units.md#source-scope-preservation caller가 만든 cell 레코드를 바꾸지 않고 building·storey 두 레코드만 앞에 더한다.
 * @evidence principles/core/source-units.md#source-substantive-completion 검사를 통과한 공간 배열을 반환하며 층 귀속·shell 혼용·빈 cell·누락을 각각 공간 ID를 적은 오류로 던진다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work building.md#containment의 건물 하나·층 하나·아홉 방 목록을 그대로 구현했고 부모의 공간 수나 층 구성을 바꿀 필요가 없었다.
 */
export const templeSpaceHierarchy = (
  rooms: readonly IAutoMovieBuiltSpace[],
): IAutoMovieBuiltSpace[] => {
  const expected = new Set([
    "entrance", "courtyard", "colonnade", "sanctuary", "offering",
    "administration", "records", "storage", "service-yard",
  ]);
  for (const room of rooms) {
    if (!expected.delete(room.id) || room.parent !== templeLevels.storey ||
        room.cells.length === 0 || room.shell !== undefined) {
      throw new Error(`temple/containment: ${room.id}의 ID·층 귀속·cell 표현이 설계와 다릅니다.`);
    }
  }
  if (expected.size > 0) {
    throw new Error(`temple/containment: 공간 누락 ${[...expected].join(", ")}`);
  }
  return [
    { id: templeLevels.building, kind: "building", parent: null, cells: [] },
    { id: templeLevels.storey, kind: "storey", parent: templeLevels.building, cells: [] },
    ...rooms,
  ];
};
