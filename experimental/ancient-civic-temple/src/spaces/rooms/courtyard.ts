/**
 * docs/spaces/rooms/courtyard.md#court-volume의 열린 중정과 분수 소비 입력.
 * 유한 cell 상한은 관찰 귀속용이며 천장 mesh/그림자/clipping이 아니다.
 * 수반과 물줄기는 후속 prototype/system 소유로 geometry를 여기서 복제하지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { FloorBoundaryFace } from "../../geometry/floor-faces";
import { roomFloorInput } from "../../geometry/floor-input";
import { levelCell } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

/**
 * @evidence spaces/rooms/courtyard.md 중정 평면을 west/east-court, court-back/front 네 기준선으로 둔다.
 * @evidence principles/core/source-units.md#source-scope-preservation 기준선으로만 평면을 정한다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형으로 바닥·cell·분수 중심이 같은 평면을 받는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md의 7.0×7.85m 중정 범위를 그대로 옮겼다.
 */
export const templeCourtyardPlan = {
  west: p.westCourt, east: p.eastCourt, north: p.courtBack, south: p.courtFront,
} as const;

/**
 * 열린 중정의 낮은 실체 바닥. 분수 밑에 별도 가짜 지면을 놓지 않는다.
 * @evidence spaces/rooms/courtyard.md 중정 바닥을 완성면 -0.12m의 slab으로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 분수 밑에 별도 지면을 두지 않고 중정 높이는 층 값을 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 구획 바닥 입력을 돌려주며 주랑 바닥과의 0.12m 단차는 비균일 격자 면에서 턱으로 드러난다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md와 storey.md의 중정 -0.12m를 그대로 구현했다.
 */
export const templeCourtyardFloor = () => roomFloorInput(
  "courtyard", [{ ...templeCourtyardPlan, id: "body", floor: y.courtyard }],
  [], y.slabThickness, y.floor,
);

/**
 * docs/spaces/rooms/courtyard.md#court-volume의 연속 석재 턱 표면 소유.
 * 물리적으로 주랑 slab의 끝인 수직 노출면을 중정 소유에 귀속하되 복제하지
 * 않는다. 실제 입력 좌표에 일치하는 면만 선택하고 아래쪽 매입 면은 제외한다.
 * @evidence spaces/rooms/courtyard.md 주랑 slab 끝의 중정 쪽 수직 노출면(석재 턱)을 중정 표면 소유로 판정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 실제 입력 좌표(중정 네 경계선, 높이 -0.12~0)에 일치하는 주랑 옆면만 고르고 매입 면은 제외해 면을 복제하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 면 하나를 받아 소유 여부를 boolean으로 돌려주며 바닥 조립이 그 면의 surface를 courtyard.floor로 바꾼다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md#court-volume의 연속 석재 턱 소유를 그대로 구현했다.
 */
export const templeCourtyardOwnsCurb = (face: FloorBoundaryFace): boolean => {
  if (face.space !== "colonnade" || face.direction === "top" || face.direction === "bottom") return false;
  const withinHeight = face.corners.every((v) => v.y >= y.courtyard && v.y <= y.floor);
  if (!withinHeight) return false;
  const onX = (x: number) => face.corners.every((v) =>
    v.x === x && v.z >= p.courtBack && v.z <= p.courtFront,
  );
  const onZ = (z: number) => face.corners.every((v) =>
    v.z === z && v.x >= p.westCourt && v.x <= p.eastCourt,
  );
  return onX(p.westCourt) || onX(p.eastCourt) || onZ(p.courtBack) || onZ(p.courtFront);
};

/**
 * @evidence spaces/rooms/courtyard.md 중정 공간 레코드(id courtyard)를 한 exact cell로 낸다.
 * @evidence spaces/rooms/courtyard.md#court-volume 하한은 완성면 -0.12m, 상한은 주랑 처마 지지 높이 3.20m의 유한 논리 범위이며 천장·그림자 면을 만들지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 논리 상한을 하늘을 막는 geometry로 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 cell 공간을 돌려주며 관찰의 중심·모서리가 이 cell로 내부성을 판정한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md#court-volume의 범위·두 높이를 그대로 구현했다.
 */
export const templeCourtyard = (): IAutoMovieBuiltSpace => ({
  id: "courtyard", kind: "courtyard", parent: y.storey, fidelity: "exact",
  cells: [levelCell("courtyard.body", templeCourtyardPlan, y.courtyard, templeRoofRules.courtEave)],
});

/**
 * 방 경계의 산술 중심과 m 단위 부재 입력. 분수의 구현 완료를 뜻하지 않는다.
 * @evidence spaces/rooms/courtyard.md 수반 중심(중정 경계의 산술 중점)과 외경 2.0m, 테두리 0.52m, 물면 0.08m 아래, 물줄기 0.65m의 m 단위 소비 입력을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 수반 geometry를 만들지 않고 후속 model/system이 쓸 입력만 돌려준다.
 * @evidence principles/core/source-units.md#source-substantive-completion 중심 좌표와 네 높이를 계산된 값으로 돌려줘 소비자가 치수를 다시 정하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md#court-volume의 분수 치수를 그대로 옮겼다.
 */
export const templeFountainInputs = () => ({
  center: { x: (p.westCourt + p.eastCourt) / 2, y: y.courtyard,
    z: (p.courtBack + p.courtFront) / 2 },
  outerDiameter: 2,
  rimHeight: y.courtyard + 0.52,
  waterHeight: y.courtyard + 0.52 - 0.08,
  jetTop: y.courtyard + 0.52 - 0.08 + 0.65,
});
