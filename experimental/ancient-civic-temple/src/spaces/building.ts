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
 * @evidenceReview spaces/building.md #2e32d08 # 기준 평면 파일의 plan-datums와 footprint 수치를 이 객체가 맡고, containment 조립은 아래 templeSpaceHierarchy가 맡는 파일 내 분업을 읽었다.
 * @evidenceReview spaces/building.md#plan-datums #a9e2a0d # west/east-outer ±10.5, yard-front −2.45, south-outer 10.25와 tolerance 0.001이 기준선 표의 이름·부호·값과 같다.
 * @evidenceReview spaces/building.md#footprint #d21e152 # outer X 차 21m와 Z 차 20.5m를 계산해 430.5㎡가 되고 room·court 선은 이 외곽 안에 남는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # templePlan의 속성은 기준선과 비교 허용값뿐이며 벽이나 mesh를 만드는 호출이 없다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # as const 객체가 하위 벽·방·지붕 모듈에 동일한 수치형 literal을 공급하며 임시 null이나 계산 대기가 없다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # plan-datums의 X 16개·Z 16개 선과 외곽 네 끝을 객체 값에 대조했고 self-check의 겹침 0이 이 입력으로 나와 부모 선을 바꿀 필요가 드러나지 않았다.
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
 * @evidenceReview spaces/building.md #2e32d08 # 기준 평면 파일의 containment가 정한 temple→temple-ground→아홉 공간을 이 함수가 조립하고 datum 수치는 templePlan이 별도로 공급한다.
 * @evidenceReview spaces/building.md#containment #43621e3 # expected 집합의 아홉 ID를 한 번씩 소진하며 parent가 temple-ground가 아니거나 cell이 비거나 shell을 쓰면 오류를 던진다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # caller의 rooms 레코드를 펼쳐 보존하고 두 부모 레코드만 추가해 물리벽이나 방 경계를 이 함수가 복제하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 중복·외래·누락 ID와 부모·cell·shell 실패가 각각 return 이전에 거부되어 빈 위계 반환으로 통과하지 않는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # containment의 한 건물·한 층·아홉 공간 ID를 expected 집합과 반환 배열에 맞대어 새 방이나 보조 복도를 만들 결정이 필요하지 않았다.
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
