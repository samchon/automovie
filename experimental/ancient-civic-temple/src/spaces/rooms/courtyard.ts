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
 * @evidenceReview spaces/rooms/courtyard.md #740476a # CourtyardPlan의 네 변이 westCourt·eastCourt·courtBack·courtFront를 그대로 사용해 요구된 단일 열린 중정만 감싼다.
 * @evidence principles/core/source-units.md#source-scope-preservation 기준선으로만 평면을 정한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 중정 plan은 templePlan의 네 datum 참조뿐이며 렌더용 확장이나 임의 치수는 없다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 사각형으로 바닥·cell·분수 중심이 같은 평면을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # Floor와 courtyard cell은 CourtyardPlan을 직접 소비하고 FountainInputs도 그 네 변의 평균을 읽으므로 수반 중심과 바닥 중심이 갈라지지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md의 7.0×7.85m 중정 범위를 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 네 경계는 판정된 7.0×7.85m 중정의 기준선이고 source에서 폭이나 길이를 재결정하지 않아 부모를 고치지 않았다.
 */
export const templeCourtyardPlan = {
  west: p.westCourt, east: p.eastCourt, north: p.courtBack, south: p.courtFront,
} as const;

/**
 * 열린 중정의 낮은 실체 바닥. 분수 밑에 별도 가짜 지면을 놓지 않는다.
 * @evidence spaces/rooms/courtyard.md 중정 바닥을 완성면 -0.12m의 slab으로 낸다.
 * @evidenceReview spaces/rooms/courtyard.md #740476a # 중정 Floor의 body가 y.courtyard를 완성면으로 받아 주랑의 y.floor보다 0.12m 낮은 slab을 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation 분수 밑에 별도 지면을 두지 않고 중정 높이는 층 값을 받는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # floor 입력은 한 body 구획뿐이고 fountain 받침판을 바닥으로 복제하지 않으며 높이도 storey 값을 쓴다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 구획 바닥 입력을 돌려주며 주랑 바닥과의 0.12m 단차는 비균일 격자 면에서 턱으로 드러난다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 한 번의 roomFloorInput에 중정 plan과 낮은 floor가 들어가 주랑 바닥과의 경계에서 단차 입력이 보존된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md와 storey.md의 중정 -0.12m를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 바닥의 courtyard 높이는 기존 storey datum이고 새 지면이나 수반 geometry를 만들지 않아 상위 층 변경이 없다.
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
 * @evidenceReview spaces/rooms/courtyard.md #740476a # OwnsCurb는 주랑 바닥의 중정 접경 수직 face만 courtyard 소유로 돌려 중정 네 변의 석재 턱을 단독 귀속한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 실제 입력 좌표(중정 네 경계선, 높이 -0.12~0)에 일치하는 주랑 옆면만 고르고 매입 면은 제외해 면을 복제하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # top·bottom face와 주랑 외 face를 먼저 거르고 네 중정 경계선·두 높이를 모두 확인해 바닥 내부 면을 잘못 청구하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 면 하나를 받아 소유 여부를 boolean으로 돌려주며 바닥 조립이 그 면의 surface를 courtyard.floor로 바꾼다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # face의 space·direction·corner를 판정한 boolean이 조립 단계의 owner 선택에 쓰일 수 있는 완결된 경계 판별을 제공한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md#court-volume의 연속 석재 턱 소유를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 중정 턱은 실제 주랑 slab의 노출 옆면을 재귀속할 뿐 중정 바닥 형상이나 주랑 높이를 변경하지 않는다.
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
 * @evidenceReview spaces/rooms/courtyard.md #740476a # 공간 레코드 하나가 id·kind courtyard, fidelity exact, 단층 부모와 단일 body cell을 갖는다.
 * @evidence spaces/rooms/courtyard.md#court-volume 하한은 완성면 -0.12m, 상한은 주랑 처마 지지 높이 3.20m의 유한 논리 범위이며 천장·그림자 면을 만들지 않는다.
 * @evidenceReview spaces/rooms/courtyard.md#court-volume #dab6846 # levelCell의 하한 y.courtyard와 상한 courtEave는 관찰용 공간 부피이고 이 export에는 천장 mesh 생성이 없다.
 * @evidence principles/core/source-units.md#source-scope-preservation 논리 상한을 하늘을 막는 geometry로 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # cell의 courtEave가 논리 분류에만 들어가고 roof나 ceiling 부재는 반환하지 않아 열린 중정의 하늘이 유지된다.
 * @evidence principles/core/source-units.md#source-substantive-completion 한 cell 공간을 돌려주며 관찰의 중심·모서리가 이 cell로 내부성을 판정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # courtyard.body 한 cell을 가진 exact 공간이 중정 관찰 pose를 공간 안으로 분류할 완결된 레코드다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md#court-volume의 범위·두 높이를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 중정 평면과 y.courtyard·courtEave를 기존 설계에서 그대로 소비했고 천장을 만들지 않아 상위 설계 수리는 필요하지 않았다.
 */
export const templeCourtyard = (): IAutoMovieBuiltSpace => ({
  id: "courtyard", kind: "courtyard", parent: y.storey, fidelity: "exact",
  cells: [levelCell("courtyard.body", templeCourtyardPlan, y.courtyard, templeRoofRules.courtEave)],
});

/**
 * 방 경계의 산술 중심과 m 단위 부재 입력. 분수의 구현 완료를 뜻하지 않는다.
 * @evidence spaces/rooms/courtyard.md 수반 중심(중정 경계의 산술 중점)과 외경 2.0m, 테두리 0.52m, 물면 0.08m 아래, 물줄기 0.65m의 m 단위 소비 입력을 낸다.
 * @evidenceReview spaces/rooms/courtyard.md #740476a # FountainInputs의 X·Z는 CourtyardPlan.west/east/north/south 평균이고 외경·rim·water·jet 높이는 설계의 2.0·0.52·−0.08·+0.65m 관계를 따른다.
 * @evidence principles/core/source-units.md#source-scope-preservation 수반 geometry를 만들지 않고 후속 model/system이 쓸 입력만 돌려준다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # CourtyardPlan에서 얻은 center와 치수만 반환하고 수반 mesh·물 애니메이션은 방 소스에 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 중심 좌표와 네 높이를 계산된 값으로 돌려줘 소비자가 치수를 다시 정하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # center는 CourtyardPlan의 네 변에서, waterHeight와 jetTop은 rimHeight에서 순서대로 계산되므로 후속 모델이 중심·물 높이를 새로 선택하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work rooms/courtyard.md#court-volume의 분수 치수를 그대로 옮겼다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # CourtyardPlan의 네 변으로 다시 계산한 중앙점과 외경·물면·물줄기 범위가 기존 중정 예약과 같아 공간 크기 수리는 필요하지 않았다.
 */
export const templeFountainInputs = () => ({
  center: { x: (templeCourtyardPlan.west + templeCourtyardPlan.east) / 2, y: y.courtyard,
    z: (templeCourtyardPlan.north + templeCourtyardPlan.south) / 2 },
  outerDiameter: 2,
  rimHeight: y.courtyard + 0.52,
  waterHeight: y.courtyard + 0.52 - 0.08,
  jetTop: y.courtyard + 0.52 - 0.08 + 0.65,
});
