import type { IAutoMovieLibrarySourceOwner } from "@automovie/interface";
import { buildHouse } from "../house/build";
/** Deterministic library registration. The surface owners consume shared metric
 * plan inputs; preview and delivery invoke this same CJS producer.
 * @evidence spaces/001-citizen-house.md 집·대지·관찰 입력을 하나의 library 환경으로 등록한다. 실제 조립은 buildHouse이고 topology, surface owner, 방 fit-out이 모두 그 호출에 들어간다.
 * @evidenceReview spaces/001-citizen-house.md #98bb17e citizenHouseSpaceSource가 buildHouse 하나로 topology·storey·envelope·garden·rooms를 조립하고 그 environment를 반환하는 것을 읽었다. 001의 집·대지·관찰 세 H2가 요구하는 산출물이 이 한 호출에서 나온다.
 * @evidence spaces/001-citizen-house.md#citizen-house-space house를 citizen-site 아래 두 storey의 부모로 만들고 독립된 매스나 추가 계단을 생성하지 않는다. 각 완결 표면의 파일을 buildHouse가 호출한다.
 * @evidenceReview spaces/001-citizen-house.md#citizen-house-space #e3da773 compiled environment에서 citizen-site 아래 house, 그 아래 ground-storey·upper-storey와 각 room이 있고 building unit citizen-house의 element가 house-root인 것을 읽었다. 별동이나 추가 계단 connector는 없다.
 * @evidence spaces/001-citizen-house.md#site-access buildHouse의 garden 호출이 외곽 밖에서 끝나는 지면·보도·두 디딤판·y=0 landing과 조경 전체를 만들고, 지면 위 부재는 지면에서 시작하며 지면 높이의 포장은 흙 바닥 -0.71까지 채운다. site-access가 소비하는 roof-face의 정비 재배치에 따라 tree-0..3과 hedge의 기존 side/i ID를 후면에 보존하고 front-grass-3..7을 cassette 예약면 밖으로 옮긴다. 같은 호출의 canopy audit가 식물 bounds와 예약대의 겹침을 검사한다.
 * @evidenceReview spaces/001-citizen-house.md#site-access #6be2e79 garden.ts가 site-ground에서 본채 외곽을 빼고, approach tread 두 개(상단 -0.30·-0.15)와 landing(0)을 지면 -0.45부터 채우며 entryApproach x=1.30..2.90을 쓰는 것을 읽었다. compiled scene에서 두 tread와 landing, rear-paving이 모두 y=-0.45에서 시작하고, service-band 네 조각·cassette-staging-pad·site-sidewalk 두 조각이 흙 site-ground와 같은 y=-0.71..-0.45를 채운다. 본문에 없던 site-curb는 더 이상 생성되지 않아 보도·예약면과 겹치는 site 부재가 없다.
 * @evidence spaces/001-citizen-house.md#spatial-observation 현재 환경의 cell·surface·connector·boundary.face·opening.profile을 observations가 소비한다. 필수 공간 시점, 모든 외피 면·모서리·개구와 다섯 추가 reference를 내며 null 시점과 이유도 유지한다. GPU 판정은 이 열거와 별개다.
 * @evidenceReview spaces/001-citizen-house.md#spatial-observation #a02bde4 observations.ts가 environment의 cell·surface·connector·boundary.face·opening.profile에서 station을 만들고 위치가 없는 station도 이유와 함께 남기는 것을 읽었다. 외피 face가 O로 옮겨져 외부 관찰이 각 면의 바깥에서 선다.
 * @evidence principles/core/source-units.md#source-scope-preservation 이 등록은 001의 단일 집·대지 조립만 소유한다. 방 치수는 plan, 외피는 각 입면 모듈에서 받고 reference를 표면에 붙이거나 독립된 viewer geometry를 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 이 export는 001의 library 등록만 담당하고 방 경계나 외피 치수를 viewer 전용 형상으로 다시 정의하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion build는 실제 model·element·population·space·boundary·opening·connector·surface를 반환한다. viewer의 명시 상태 역시 같은 buildHouse를 사용하며 결과는 공개 engine의 lowerBuiltEnvironment를 통과해야 표시된다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f 빈 등록 객체가 아니라 buildHouse의 실제 environment를 반환하고 lowering까지 소비되므로 타입 선언만으로 완료를 대신하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 001의 site→house→storey 관계, 전면 접근 landing과 관찰의 실패 유지 조건을 구현했다. 이 등록 단계에서 site 범위나 추가 건물·동선의 설계 변경은 필요하지 않았고 물리적 사용성은 별도 unverified로 남긴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 001의 site→house→storey와 landing을 그대로 구현할 수 있어 이 등록에서 부모 대지나 건물 수를 수정할 필요는 발견되지 않았다.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology buildHouse는 native validation과 room/storey 포함·endpoint·entry 도달 검사에서 나온 정확한 오류를 throw하여 invalid 환경을 반환하지 않는다. viewer 소비 경계는 같은 lowered triangles로 문 통행 원통과의 충돌을 장애물 id별 blocked 진단으로 보존한다. 계단 상승 및 방 안 연속 원통 통행은 해당 계측이 없으므로 unverified이며 clear로 치환하지 않는다.
 * @evidenceReview obligations/design/space-sources.md#space-source-invalid-topology #030592d 잘못된 parent나 도달성은 buildHouse가 오류로 거부하며, 원통 통행의 blocked와 미계측 계단 상승을 성공으로 바꾸지 않는다.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities id는 설계 주소와 metric 반복 인덱스로 만들며 시계·파일·난수를 build에 넣지 않는다. 방의 parent, 문과 boundary 참조, compact set membership은 동일한 명시 상태에서 같은 순서로 생성된다.
 * @evidenceReview obligations/design/space-sources.md#space-source-stable-identities #8f4bb4a room·boundary 참조와 반복 인덱스로 ID를 구성해 같은 입력에서 시간이나 난수 때문에 공간 주소가 변하지 않는다.
 */
export const citizenHouseSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/001-citizen-house.md#citizen-house-space",
  build: (_context) => ({ environments: [buildHouse()], models: [] }),
};
