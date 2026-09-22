/**
 * 신전의 공유 평면 입력. 모든 값은 m, +X는 동쪽, +Z는 정면이다.
 * docs/spaces/building.md#plan-datums의 단일 치수 원본을 구현한다.
 * 방·벽·지붕은 이 값을 소비하며 여기서 표면이나 부재를 생성하지 않는다.
 * 기준선 변경은 모든 하위 공간과 접합의 재검사를 요구한다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { templeLevels } from "./storey";

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
