import type { IAutoMovieLibrarySourceOwner } from "@automovie/interface";

import { buildHouse } from "../house/build";

/** Deterministic library registration. This source owner calls buildHouse for
 * library delivery; the live viewer calls buildHouse directly from payload.ts.
 * Both paths execute the same CJS house builder and its metric plan inputs.
 * @evidence spaces/001-citizen-house.md 집·대지·관찰 입력을 하나의 library 환경으로 등록한다. 현재 buildHouse 호출에는 topology·건축 표면과 방 source의 임시 fit-out 메시가 함께 들어가지만, 물체의 영구 소유권은 이 spaceSource에 있지 않다.
 * @evidence spaces/001-citizen-house.md#citizen-house-space house를 citizen-site 아래 두 storey의 부모로 만들고 독립된 매스나 추가 계단을 생성하지 않는다. 각 완결 표면의 파일을 buildHouse가 호출한다.
 * @evidence spaces/001-citizen-house.md#site-access buildHouse의 garden 호출이 외곽 밖에서 끝나는 지면·보도·두 디딤판·y=0 landing과 조경 전체를 만들고, 지면 위 부재는 지면에서 시작하며 지면 높이의 포장은 집수 공간 바닥판 하면인 흙 바닥 -0.852까지 채운다. site-access가 소비하는 roof-face의 정비 재배치에 따라 tree-0..3과 hedge의 기존 side/i ID를 후면에 보존하고 front-grass-3..7을 cassette 예약면 밖으로 옮긴다. 같은 호출의 canopy audit가 식물 bounds와 예약대의 겹침을 검사한다.
 * @evidence spaces/001-citizen-house.md#spatial-observation 현재 환경의 cell·surface·connector·boundary.face·opening.profile을 observations가 소비한다. 필수 공간 시점, 모든 외피 면·모서리·개구와 다섯 추가 reference를 내며 null 시점과 이유도 유지한다. GPU 판정은 이 열거와 별개다.
 * @evidence principles/core/source-units.md#source-scope-preservation 이 등록은 001의 단일 집·대지 조립만 소유한다. 방 치수는 plan, 외피는 각 입면 모듈에서 받고 reference를 표면에 붙이거나 독립된 viewer geometry를 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion build는 실제 model·element·population·space·boundary·opening·connector·surface를 반환한다. viewer의 명시 상태 역시 같은 buildHouse를 사용하며 결과는 공개 engine의 lowerBuiltEnvironment를 통과해야 표시된다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 001의 site→house→storey 관계, 전면 접근 landing과 관찰의 실패 유지 조건을 구현했다. 이 등록 단계에서 site 범위나 추가 건물·동선의 설계 변경은 필요하지 않았고 물리적 사용성은 별도 unverified로 남긴다.
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology buildHouse는 native validation과 room/storey 포함·endpoint·entry 도달 검사에서 나온 정확한 오류를 throw하여 invalid 환경을 반환하지 않는다. viewer 소비 경계는 같은 lowered triangles로 문 통행과 계단의 접촉 기반 상승 경로에 대한 연속 원통 충돌을 장애물 id별 blocked 진단으로 보존한다. 계단의 모든 디딤판·챌판·참·상층 바닥을 충돌 모집단에 남기며 지원면이 없는 경로는 오류다. 방 안 연속 원통 통행과 실제 인간의 보행은 계측하지 않았으므로 unverified이며 clear로 치환하지 않는다.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities id는 설계 주소와 metric 반복 인덱스로 만들며 시계·파일·난수를 build에 넣지 않는다. 방의 parent, 문과 boundary 참조, compact set membership은 동일한 명시 상태에서 같은 순서로 생성된다.
 */
export const citizenHouseSpaceSource: IAutoMovieLibrarySourceOwner = {
  design: "docs/spaces/001-citizen-house.md#citizen-house-space",
  build: (_context) => ({ environments: [buildHouse()], models: [] }),
};
