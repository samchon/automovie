# 재료 전달과 표면 좌표

## 전달 범위 {#material-delivery}

<!--
@evidence principles/core/common.md#scope-preservation 재료 층의 몫을 질감·반사로 한정하고 새 창호 단면·차양은 spaces, 물체 외형은 models, 식재 이동은 해당 배치 owner로 돌려 형상 결손을 재료 채널로 덮지 않는다.
@evidence principles/core/common.md#substantive-completion 사용하는 native 값(baseColor 색과 primary UV의 baseColorTexture, scalar roughness·metallic·opacity·transmission·ior·thickness·clearcoat, emissive 색, alphaMode·alphaCutoff·doubleSided)과 쓰지 않는 채널(normal·metallicRoughness·occlusion·emissive texture, displacement, 새 shader·후처리 치환)을 이름으로 가르고, roughness는 모든 마감이 명시하며 나머지 미명시 값의 기본값을 적어 구현이 채널이나 기본값을 새로 고를 일이 없다.
@evidence principles/core/common.md#declared-basis 채널 한계는 README의 현재 재료 전달 범위와 scene.mjs·payload.ts의 현재 경로에서, 표면 소유는 whole-surface-owners와 surface-decomposition에서, 길이 단위 m는 coordinate-datum에서 받고, sRGB 표기·기본값·수치는 이 층의 저작 선택이며 레퍼런스 픽셀 측정이나 실물 인증이 아니라고 구분한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 완결 표면의 owner, envelope-and-privacy의 밝은 석재·어두운 금속 frame·연속 목재 floor라는 재료 언어, 시각 문법의 색 관계를 준다. 이 H2는 그것을 실제 렌더 채널 집합, 무차원 응답 기본값, 명목 두께와 렌더 thickness의 분리, 미해결 배정의 주소 실패 규칙으로 바꾼다.
@evidence principles/design/materials.md#material-construction-appearance 렌더 thickness=0이 두께 없는 물체라는 뜻이 아니라고 적고 부재 두께는 spaces geometry, 도장·베니어의 명목 두께는 각 마감 H2, 광학 값은 렌더 근사로 나눈다. 색상 입자로 섬유 요철이나 석재 돌출을 만들었다고 하지 않는 경계도 둔다.
@evidence principles/design/materials.md#material-binding-interface 재료는 완결 owner의 기존 표면에만 결합하고 새 형상을 만들지 않으며, owner·표면·재료·좌표 중 하나라도 풀리지 않으면 plaster fallback 대신 그 주소로 실패한다고 정해 host geometry 소유를 넘겨받지 않는다.
@evidence principles/design/materials.md#material-verification-address native 재료·texture 자원·현재 모델·uploader가 같은 값을 소비하는지를 binding-census가 반증하도록 연결하고, 방 안 정확한 거울상은 unverified로 남긴다.
@evidence upstream/design/materials.md#parent-revision-from-material-work 이 재료 설계가 부모의 물체 owner 충돌을 드러냈다. settings/003#surface-decomposition에서 건축 표면과 model prototype·instance 배치를 분리하고 임시 방 source 퇴역을 선언했다. 기존 채널 제한과 fallback 금지는 이 층의 선택으로 남긴다.
@evidence settings/001-production.md#delivery-fidelity 실물 사진의 미세 질감이 아닌 blocking pass라는 경계를 scalar 응답과 색상 texture만 쓰는 채널 선택으로 옮기고, 재료 이름이나 색 패치로 빠진 부재를 대신하지 않는다.
@evidence settings/001-production.md#build-or-adopt production 내부 WebGL 도구와 공개 engine API라는 채택 범위 안에서 새 shader·channel·후처리 서비스 없이 기존 uploader가 받는 값만 설계한다.
@evidence settings/001-production.md#runtime-and-restart 단계는 독립 판정으로만 전진한다는 권한을 "materials가 review에 들어간 뒤 materialSources에서 구현한다"는 이 층의 구현 시점으로 적용한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 입면·방·층은 건축 표면, models는 물체 part/face, instances는 그 배치를 소유한다는 개정 경계를 재료 결합 주소의 적용 범위로 삼는다.
@evidence spaces/003-surface-ownership.md#whole-surface-owners 다섯 외피 면의 단독 owner가 return·개구·틀·마감을 모두 소유한다는 결정을 받아 재료가 외피를 사후 칠하기 owner로 나누지 않는다.
@evidenceExclude settings/001-production.md#roles-and-accessibility 저작자·관찰자·리뷰어의 분담과 한국어 문서·안정 id 요구를 검토했다. 이 H2의 채널·기본값·fallback 규칙은 본문대로 계측·판정 역할 분담을 입력으로 읽거나 바꾸지 않으며, 한국어 서술과 안정 finish id의 일관성은 재료 공통 account의 production-language가 답한다.
@evidenceExclude settings/001-production.md#settings-coverage-map 개정된 설정 지도는 건축 치수·문·입면을 spaces, 물체 형상을 models, 배치를 instances로 넘긴다. 이 H2는 그 색인을 직접 소비하지 않고 시각 문법·표면 분해·외피와 개구부·좌표 기준 H2를 각각 읽는다.
@evidenceExclude settings/002-household.md#household-program 거주자를 인물 asset이 아닌 사용 배경으로 두는 결정과 공동생활의 밀도를 검토했다. 재료는 인물이나 생활 밀도를 표현하지 않고, 방을 식별하는 가구·설비의 마감은 ground-program·upper-program·flex-states의 구체 항목을 인용한다.
@evidenceExclude settings/002-household.md#design-subject-conditions 지름 0.60m·높이 1.80m 가상 통행 원통과 인체 사용성 범위 밖 목록을 검토했다. 재료는 형상·배치·문 상태를 바꾸지 않아 원통 검사의 입력을 소비하거나 변경하지 않으며, 미끄럼·안전 성능을 주장하지 않는다는 한계는 각 마감 H2에 따로 있다.
@evidenceExclude settings/003-spatial-basis.md#ground-graph 1층의 현관·계단·공용부·작업실·코어 연결 그래프를 검토했다. 재료는 연결을 더하거나 빼지 않고 문턱 마감 경계는 개별 문과 방 H2를 인용하므로 그래프 자체를 입력으로 쓰는 재료 결정이 없다.
@evidenceExclude settings/003-spatial-basis.md#upper-graph 계단참에서 시작하는 일자 복도와 여섯 방의 직접 문 연결을 검토했다. 상층 마감은 각 방·문·벽 H2의 실제 면에 결합하고 복도 그래프의 분기 금지나 연결 수를 읽지 않는다.
@evidenceExclude settings/004-observation.md#accessibility-products 텍스트 id 목록·키보드 조작·글자 상태 표시와 자막·전사 없음의 분류를 검토했다. 재료 상태 표본은 privacy·flex 선택을 소비할 뿐 텍스트 목록이나 조작 요소를 바꾸지 않고, 유리 색만으로 상태를 알리는 새 UI를 만들지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#ground-partition 1층 다섯 방의 clear cell 분할과 cell 사이 gap을 shared wall로만 쓰는 원칙을 검토했다. 재료는 각 방·벽·문 H2의 실제 면을 인용하고, 분할 원칙 자체는 마감의 좌표·배정·응답 어느 것에도 쓰이지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#upper-partition 복도와 그 복도에서 직접 닿는 여섯 방으로 된 상층 분할과 L자 seam에 벽을 두지 않는 원칙을 검토했다. 재료는 개별 방·벽 H2의 면에 결합하며 분할 원칙이나 seam 무벽 규칙을 입력으로 읽지 않는다.
-->

이 설계는 사용자가 요청한 재료 질감·반사를 소유한다. [표면 분해](../settings/003-spatial-basis.md#surface-decomposition)에 따라 입면·방·층은 건축 면, models는 물체 part/face, instances는 배치를 맡는다. 재료 언어는 [외피와 개구부](../settings/003-spatial-basis.md#envelope-and-privacy)의 밝은 석재 계열 불투명 면·어두운 금속 frame·연속 목재 floor와 cabinetry, 색 관계는 [시각 문법](../settings/001-production.md#production-visual-grammar)에서 받는다. materials는 재사용 가능한 재료 응답과 좌표 조건을 제공한다. 새 창호 단면과 차양은 spaces, 가구 외형은 models, 식재 위치는 해당 배치 owner에 남긴다. 현재 방 source의 물체 메시와 마감 문자열은 이관 중 임시 소비이고 영구 결합 주소로 승인하지 않는다. 재료는 계측·판정 역할 분담, 방·층 그래프와 분할, 거주자 설정의 인물·생활 밀도, 접근성 산출물, 통행 원통 검사를 바꾸지 않고 개별 방·벽·문·창·입면 H2의 실제 면과 생활 프로그램을 소비한다. 검증 대상은 같은 집의 실제 표면이며 별도 샘플이 집을 대신하지 않는다.

[현재 전달 한계](../../README.md#현재-재료-전달-범위)와 `src/house/assembly.ts`, `src/viewer/payload.ts`, `src/viewer/scene.mjs`를 전제로 한다. native baseColor 색과 primary UV의 baseColorTexture, scalar roughness·metallic·opacity·transmission·ior·thickness·clearcoat, emissive 색, alphaMode·alphaCutoff·doubleSided만 사용한다. normalTexture, metallicRoughnessTexture, occlusionTexture, emissiveTexture, displacement, 새 shader와 후처리 재질 치환은 이번 설계에 없다. 색상 입자로 섬유 요철의 실제 그림자나 석재 돌출을 만들었다고 하지 않는다. 거울은 환경 반사의 근사이며 방 내부의 정확한 거울상은 unverified다.

이하 색은 sRGB `#RRGGBB`, 길이는 [좌표 기준](../settings/003-spatial-basis.md#coordinate-datum)의 m, roughness와 metallic은 무차원 렌더 값이다. roughness는 모든 마감 H2가 명시한다. 별도 명시가 없으면 metallic=0, opacity=1, alphaMode=opaque, doubleSided=false, transmission=0, emissive=null, thickness=0, clearcoat=0, ior=1.5다. alphaCutoff는 alphaMode=mask에서만 쓰며 미명시 0.5이고, baseColorTexture가 없는 마감은 texture 없이 색만 쓴다. 렌더 thickness=0은 물체의 두께가 없다는 뜻이 아니다. 부재 두께는 spaces의 기존 geometry, 표면 도장·베니어의 명목 두께는 각 마감 H2가 소유한다. 값은 저작 선택이며 레퍼런스 픽셀에서 잰 값이나 실물 인증값이 아니다.

미지정 재료 이름을 plaster로 대신하는 현재 fallback은 새 바인딩 경로에서 허용하지 않는다. owner·표면·재료·좌표가 해결되지 않으면 그 주소로 실패한다. [전달 검사](007-observation.md#binding-census)는 native 재료, texture 자원, 현재 모델과 uploader가 같은 값을 소비하는지 검사한다. 이 경로와 source는 materials가 review에 들어간 뒤 materialSources에서 구현한다.

## 표면 배정 인터페이스 {#surface-bindings}

<!--
@evidence principles/core/common.md#scope-preservation 재료 역할 주소는 건축 면과 model part/face에 결합하되 plan·벽 cut·opening·connector는 spaces, 물체 부재는 models, membership·transform은 instances에 남겨 재료 교체가 topology를 복제하지 않는다.
@evidence principles/core/common.md#substantive-completion 재료 variant는 물체 형상·world bounds를 보존하고 instances가 공개 prototype 레코드의 세 필드와 explicit member 선택을 작성한다. 이 H2는 두 owner의 결합 순서와 검증 주소를 정해 variant 선택을 materialSources가 중복 소유하지 않게 한다.
@evidence principles/core/common.md#declared-basis IAutoMovieInstancePrototypeDesign·IAutoMovieExplicitInstanceTransform과 materializeCompiledInstanceSet·instanceSlot의 계약과 id의 비공백·set 내 유일 조건은 interface·engine 원본 링크에서, `default`는 engine이 기본 modelRecipe에 부여하는 id에서, palette의 절대 sRGB 해석은 engine과 viewer의 기존 선형색 보정식에서 받고, weight=1 고정과 작성 경계의 Error 거부는 이 층의 선택으로 구분한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 건축 면·model part/face·instance 배치의 owner와 portal 양면 binding을 정한다. 이 H2는 문자열 일괄 교체 대신 역할별 마감 ID·결 축, 동일 형상 metric UV variant의 공급, instances의 명시적 선택과 기준색 palette 전달을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance variant는 형상·transform·member ID·world bounds를 보존하고 UV와 마감만 다르다고 정해 외관 교체가 부재 크기나 배치라는 구조 사실을 바꾸지 않으며, palette 절대색을 viewer 보정식으로 이중 tint하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 건축 면은 공간 owner와 element/face, 물체는 model prototype part/face와 instance id로 주소를 나눠 흰 pillow 직물·흰 basin rim 도기와 나무 줄기·가구 목재의 반례를 구별한다. variant의 prototypeBounds와 world bounds 일치를 호환 조건으로 둔다.
@evidence principles/design/materials.md#material-verification-address explicit prototype으로 고른 variant가 모델별 부재 선택·동일 world bounds·member 정체성·기존 topology 참조를 유지했는지와, 없는 prototype의 native Error를 기본 모델이나 빈 population으로 바꾸지 않았는지를 binding-census가 반증하도록 연결한다.
@evidence upstream/design/materials.md#parent-revision-from-material-work surface-decomposition의 portal binding과 Assembly.repeat의 set/member 구조를 대조하며 재료 variant 선택의 형상·배치 owner 충돌을 찾았다. settings/003#surface-decomposition에서 model part와 instance 선택을 분리했고 이 H2도 materialSources가 member transform을 쓰지 않게 수리했다.
@evidence settings/001-production.md#module-boundary CommonJS engine의 lowerBuiltEnvironment·materializeCompiledInstanceSet·instanceSlot을 서버 쪽 payload.ts에서만 호출하고 브라우저 client는 engine을 import하지 않은 채 server가 보낸 JSON payload를 소비하는 현재 경계를 variant 소비 경로로 그대로 쓰며, variant는 그 호출에 explicit prototype만 더한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 건축·물체 생성 owner는 안정된 양면 주소와 seam을 제공하고 materials가 주소별 finish 결합을 결정한다. 상대 owner는 자기 면의 요구만 넘긴다.
@evidence spaces/003-surface-ownership.md#whole-surface-owners 입면 owner는 창호·shade와 노출 마감 면의 안정 주소를 제공하고 materials가 그 주소의 finish 결합을 결정한다. 입면이 자체 저작하는 건축 모듈 반복과 독립 물체의 instanceSources population은 구분한다.
-->

건축과 물체의 안정 면 주소는 각각 [표면 분해](../settings/003-spatial-basis.md#surface-decomposition)의 공간 owner와 model owner가 제공한다. materials가 양면 주소에 대한 finish ID·결 축·재료 응답을 결정하고 생성 owner는 그 결합을 운반한다. `oak`나 `white` 문자열 전체를 일괄 교체하지 않는다. 침대 pillow의 흰색은 직물이고 세면대 rim의 흰색은 도기다. 나무 줄기의 oak는 가구 목재가 아니다. 이 역할은 생성 시점의 typed 입력이며 viewer가 이름을 추측해서 칠하지 않는다. 기존 plan·벽 cut·opening·connector는 spaces, 물체 부재는 models, 배치와 상태별 위치는 instances가 계속 생성한다. 이전 방 source의 `*-bed-pillow-*`와 `*-rim` 문자열은 이관 전 임시 주소이며 model part id의 확정은 models 재판정 뒤 반영한다.

독립 element의 모델은 재료·실제 scale·결 축별로 공유할 수 있다. materialSources는 동일 형상·다른 metric UV 또는 재료 응답의 variant와 안정 model part/face 결합을 제공하고 물체의 치수·부재를 바꾸지 않는다. instances는 기존 `set.id`, explicit member `id`, count, seed, 순서, translation/rotation/scale을 유지하며 공개 type `IAutoMovieInstancePrototypeDesign`과 explicit `prototype`으로 variant를 선택한다. `@automovie/engine`의 `instanceSlot`이 반환하는 주소 `instance:<set.id>:<explicit.id>`를 유지하고 수작업 member 복제나 set 분할을 하지 않는다. 각 variant의 weight는 1이고 모든 member가 prototype을 명시한다. 원래 prototypeBounds와 실제 세계 bounds가 같아야 한다.

`IAutoMovieInstancePrototypeDesign`은 호출 함수나 새 production helper가 아니라 `{ id: string; modelRecipe: string; weight: number }`인 입력 레코드다. [정의](../../../../packages/interface/src/production/IAutoMovieInstancePrototypeDesign.ts)는 [production index](../../../../packages/interface/src/production/index.ts)와 [package root index](../../../../packages/interface/src/index.ts)에서 재export된다. 실제 import 경로는 `@automovie/interface`이며 저장소 내부 경로는 근거를 읽는 링크다. `id`는 set 안에서 중복 없는 비어 있지 않은 문자열, `modelRecipe`는 등록된 variant 모델의 ID, `weight`는 양수이며 이번 설계는 1로 고정한다. `default`는 engine이 기본 modelRecipe에 부여하는 ID이므로 저작 variant ID로 사용하지 않는다. 반환값·런타임 검사는 이 type 자체에 없다.

구현 시 modelSources가 형상과 part/face를 제공하고 materialSources가 그 주소의 finish·UV variant를 제공한 뒤, 중립 조립 경계인 [src/house/build.ts](../../src/house/build.ts)의 `buildHouse()`가 이를 `environment.models`에 등록한다. 현재 그 함수는 임시 방 fit-out을 직접 호출하며 후속 분기 소비로 교체하는 전이는 아직 미완료다. instanceSources의 population 작성 경계가 `import type { IAutoMovieInstancePrototypeDesign, IAutoMovieExplicitInstanceTransform } from "@automovie/interface"`를 소비하고 `IAutoMovieInstancePrototypeDesign[]`를 `set.prototypes`에 넣는다. [IAutoMovieExplicitInstanceTransform](../../../../packages/interface/src/production/IAutoMovieExplicitInstanceTransform.ts)의 id·translation(m)·rotation(quaternion)·scale과 선택적 palette를 유지하고 `prototype`에는 선택한 variant id를 넣어 `set.layout = { kind: "explicit", transforms }`로 전달한다. 현재 [Assembly.repeat](../../src/house/assembly.ts)의 임시 population은 이관 뒤 퇴역하며 최종 반복 작성은 instances owner가 맡는다. variant ID 중복·빈 ID·`default` 충돌·미등록 modelRecipe는 instanceSources의 작성 경계에서 set/member 주소가 있는 `Error`로 거부하고 다른 모델로 대체하지 않는다.

실제 소비자는 [src/viewer/payload.ts](../../src/viewer/payload.ts)의 기존 `@automovie/engine` root import다. `lowerBuiltEnvironment(environment)` 뒤 `materializeCompiledInstanceSet({ instanceSet: design, world: { routes: [] } })`가 `IAutoMovieCompiledInstanceSet`을 반환하고, `instanceSlot(compiled, index)`가 선택된 `prototype`, `modelRecipe`, `node`, position·rotation·scale3·palette를 가진 `IAutoMovieInstanceSlot`을 반환한다. 근거는 [compiler](../../../../packages/engine/src/populationRuntime/materializeCompiledInstanceSet.ts)와 [slot reader](../../../../packages/engine/src/populationRuntime/instanceSlot.ts)다. 없는 explicit prototype은 compiler가 쓰는 [prototype 선택](../../../../packages/engine/src/populationRuntime/selectInstancePrototype.ts)이 던지는 native `Error`(`Instance set "<id>" slot <n> references missing prototype "<prototype>".`), 범위 밖 slot은 `RangeError`다. 이 예외를 잡아 기본 모델이나 빈 population으로 바꾸지 않는다. 이 import와 호출은 현재 payload.ts에 이미 있고 모든 population set을 기본 prototype(`default`)의 modelRecipe로 물질화한다. materialSources는 반복 멤버를 편집하지 않고 결합 가능한 variant를 공급하며, instanceSources가 그 variant의 `set.prototypes`와 `transforms[].prototype`을 작성한다. 브라우저 [client](../../src/viewer/client.mjs)는 engine을 import하지 않고 [server](../../src/viewer/server.ts)가 보낸 JSON payload를 소비한다.

palette는 engine에서 절대 sRGB 색으로 쓰인다. materialSources는 새 마감 기준색과 해당 H2가 허용한 판별 변화를 정의하고 instanceSources는 그 값만 explicit palette로 전달한다. viewer의 기존 선형색 보정식을 바꿔 이중 tint를 감추지 않는다. 나머지 population의 palette는 그대로 둔다. 새 material source는 문서 파일마다 하나의 공개 owner로 대응하며 `src/house/build.ts`의 `buildHouse()`가 건축·물체 표면에 결합한다. 최종 library export와 viewer는 같은 중립 조립 결과의 native 재료/모델을 받아야 한다. 현재 `src/spaces/citizen-house.ts`의 임시 전체 environment 등록은 이관 뒤 건축 spaces 산출물로 분리한다.

검사는 [전체 바인딩 census](007-observation.md#binding-census)다. 기존 모델 ID의 증가 자체는 geometry 증가가 아니지만 모델별 부재 선택, 동일 world bounds, member 정체성, 모든 기존 topology 참조를 대조해야 한다. 하나의 완결 표면을 여러 사후 칠하기 owner가 나누어 갖는 구현은 이 설계와 맞지 않는다.

새 [생활 사물 모델](../models/005-everyday-objects.md)의 `body`는 아래 상태별 역할에 결합한다. `states` 열의 쉼표는 같은 prototype 안의 각 명시 상태를 뜻한다. `body/*`는 해당 상태가 선언한 모든 가시 face이며, 닫힌 접촉면은 같은 재료 ID를 갖지만 렌더하지 않는다. 모델이 face를 더 만들면 같은 상태의 역할을 따라야 하고, 물체 형상·부품·배치는 이 표가 추가하지 않는다. 기존 33개 모델의 결합은 각 마감 H2가 소유한다. 아래의 `solid`는 baseColor만, `oak-grain`과 `woven-grain`은 이미 정한 절차형 색상 texture를 뜻한다. texture 비트맵 파일은 이 설계에 넣지 않는다.

| prototype | states | surface | finish/response | tile U×V (m) | primary UV | texture 실패 시 fallback |
| --- | --- | --- | --- | --- | --- | --- |
| household-textiles | bench-cushion,sofa-cushion,pillow,blanket,bedding-set,folded-sheet,placemat,dishcloth,bath-mat,entry-mat | body/* | textile-linen/green/blue/white: 해당 방의 [직물 색](005-soft-finishes.md#textiles) | [직물 반복](005-soft-finishes.md#textiles) | 모델 face의 surface-metres; 곡면 뒤쪽 −Z 이음 | texture 자원 누락은 주소 Error |
| household-textiles | outdoor-mat | body/* | prop-rubber: #343735, roughness .90, metallic 0 | 없음 | face normal만 사용 | solid baseColor |
| personal-articles | shoe,coat,garment,umbrella | body/* | prop-fabric: #6b735c, roughness .88, metallic 0 | [직물 반복](005-soft-finishes.md#textiles) woven-grain | surface-metres, 물체 local +Y를 V | texture 자원 누락은 주소 Error |
| personal-articles | shoe | body/sole | prop-rubber | 없음 | face normal만 사용 | solid baseColor |
| personal-articles | hanger,umbrella-stand | body/* | coated-metal: [도장 금속](002-exterior-solids.md#coated-metal) | 없음 | face normal만 사용 | solid 기준색 |
| dining-wares | plate,flower-vase | body/* | prop-ceramic: #e7e6df, roughness .26, metallic 0, clearcoat .10 | 없음 | face normal만 사용 | solid baseColor |
| dining-wares | water-bottle | body/* | prop-container-glass: #cbd7d2, roughness .12, metallic 0, transmission .68, thickness .003m, ior 1.5 | 없음 | face normal만 사용 | solid baseColor·transmission |
| dining-wares | fork,spoon,table-knife | body/* | prop-steel: #a9b0ad, roughness .32, metallic .78 | 없음 | face normal만 사용 | solid baseColor |
| kitchen-smallwares | pot,pan,kettle,utensil,drying-rack | body/* | prop-steel | 없음 | face normal만 사용 | solid baseColor |
| kitchen-smallwares | cutting-board,knife-block | body/* | oak-furniture: [가구 목재](004-wood.md#furniture-wood) | [목재 반복](004-wood.md#furniture-wood) oak-grain | surface-metres, 긴 local 축을 V | texture 자원 누락은 주소 Error |
| kitchen-smallwares | utensil-crock | body/* | prop-ceramic | 없음 | face normal만 사용 | solid baseColor |
| kitchen-smallwares | glass-jar | body/* | prop-container-glass | 없음 | face normal만 사용 | solid baseColor·transmission |
| kitchen-smallwares | toaster,coffee-brewer | body/* | prop-appliance: #c8cbc7, roughness .38, metallic .18 | 없음 | face normal만 사용 | solid baseColor |
| bath-accessories | soap-dispenser,toothbrush-cup,toothbrush,shampoo-bottle,detergent-bottle,waste-bin,laundry-basket | body/* | prop-plastic: #d6d5ce, roughness .48, metallic 0 | 없음 | face normal만 사용 | solid baseColor |
| bath-accessories | tissue-holder | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 |
| bath-accessories | tissue-roll,tissue-pack | body/* | prop-paper: #e4e2db, roughness .92, metallic 0 | 없음 | face normal만 사용 | solid baseColor |
| household-boxes | file-box,toy-box,storage-box,recycling-box | body/* | prop-paper | 없음 | face normal만 사용 | solid baseColor |
| household-boxes | parcel-locker | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 |
| household-tools | tool-box,vacuum,folded-ladder,cleaning-tool,spare-light,machine-case,garden-tool,hose-reel | body/* | prop-appliance | 없음 | face normal만 사용 | solid baseColor |
| household-tools | spare-light | body/diffuser | prop-diffuser: #e7e6df, roughness .65, metallic 0, transmission .25 | 없음 | face normal만 사용 | solid baseColor·transmission |
| exterior-furnishings | mailbox,outdoor-bench,outdoor-chair,outdoor-table,garden-light,rain-barrel,bike-rack,bicycle | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 |
| exterior-furnishings | garden-light | body/diffuser | prop-diffuser | 없음 | face normal만 사용 | solid baseColor·transmission |
| exterior-furnishings | bicycle | body/wheel | prop-rubber | 없음 | face normal만 사용 | solid baseColor |
| exterior-furnishings | outdoor-waste-bin | body/* | prop-exterior-plastic: #51564e, roughness .70, metallic 0 | 없음 | face normal만 사용 | solid baseColor |
| wall-accessories | entry-mirror | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 |
| wall-accessories | entry-mirror | body/front | prop-mirror: #cbd7d2, roughness .06, metallic .85 | 없음 | face normal만 사용 | solid baseColor·환경 반사 근사 |
| wall-accessories | wall-sconce | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 |
| wall-accessories | wall-sconce | body/diffuser | prop-diffuser | 없음 | face normal만 사용 | solid baseColor·transmission |
| wall-accessories | coat-hook | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 |
| desk-controls | pointing-device,personal-device | body/* | prop-appliance | 없음 | face normal만 사용 | solid baseColor |
| desk-controls | personal-device | body/screen | prop-screen: #253139, roughness .18, metallic 0, emissive #182329 | 없음 | face normal만 사용 | solid baseColor·emissive |

이 표의 새 `prop-*`는 색·roughness·metallic과 적힌 clearcoat·transmission·thickness·ior 외에는 [재료 기본값](#material-delivery)을 따른다. `prop-container-glass`는 투명 용기 근사이고 `prop-mirror`는 환경 반사만 반영해 정확한 실내 거울상은 `unverified`다. 위의 결합은 제작 목표이며 현재 materialSources의 실제 바인딩이나 렌더 관찰을 뜻하지 않는다. 누락된 owner/state/part/face 또는 texture 자원은 같은 주소를 출력하고 실패한다. 단색 행의 fallback은 없는 texture를 찾는 경로가 아니라 명시된 baseColor 자체다. 비균일 크기 변종은 [metric 규칙](#metric-texture-coordinates)에 따라 실제 표면 m로 UV를 작성한다.

## 미터 좌표와 반복 {#metric-texture-coordinates}

<!--
@evidence principles/core/common.md#scope-preservation 새 texture의 생성(seed·texel), 전달(surface-metres·transform·sampler), 비균일 scale 반영, 판별 위상, GPU 자원 공유를 한 규칙으로 묶고 PV와 층간 띠의 예외 owner를 명시해 좌표 규칙이 없는 texture 면이 남지 않게 한다.
@evidence principles/core/common.md#substantive-completion seed=2080, linear colorSpace와 ±.005 평균 오차, transform.scale=(1/tileU,1/tileV), wrapS/T·minFilter·magFilter·anisotropy, XY·XZ·ZY 접선축과 법선 부호, FNV-1a 위상의 비트 배정과 8종 상한까지 수치로 정해 구현이 표면 좌표계를 발명하지 않는다.
@evidence principles/core/common.md#declared-basis m와 +Y 위·+Z 후면 축은 본문이 링크한 coordinate-datum, reference 이미지 비사용은 delivery-scope, validateTextureScale의 반환은 engine 원본에서 받고, 위상 hash·texture 해상도·specialization key는 이 층의 저작 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 coordinate-datum은 단위와 축만 정한다. 이 H2는 그 단위를 texture 반복 길이, 실제 scale을 반영한 UV specialization key, 판별 위상 hash라는 표면 좌표 결정으로 바꾼다.
@evidence principles/design/materials.md#material-construction-appearance 색상 texture는 구운 조명·접합 그림자 없는 명도 grain이라고 하고, tessellateToMesh나 기존 mesh의 위치·법선·삼각형은 보존한 채 face seam에서 UV가 달라지는 정점 속성만 복제한다고 정해 부재 형상과 외관 파라미터를 떼어 놓는다.
@evidence principles/design/materials.md#material-binding-interface box 면마다 XY·XZ·ZY 중 두 접선축과 법선 부호를 고르고, 넓은 면의 V를 grain 축에, 문짝 결은 문 회전과 함께 움직이게 두어 host 형상을 바꾸지 않고 따를 좌표 계약을 정한다.
@evidence principles/design/materials.md#material-verification-address validateTextureScale 호출과 실제 scale이 반영된 UV의 길이 대조, 반복 주기 경계, native 모델 variant 수와 texture 자원 수·bytes를 scale-and-junction-samples와 binding-census에 연결하고 frame rate는 보증하지 않는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work coordinate-datum의 m·+Y 위·+Z 후면, 기존 unit box primitive와 part transform·부모 scale 구조, tessellateToMesh의 정점 배열을 대조했다. 부모가 metric UV를 막는 좌표 결함은 없었고 unit UV 확대 방식의 폐기는 이 층 안의 결정이다.
@evidence settings/003-spatial-basis.md#coordinate-datum m 단위를 surface-metres UV와 transform.scale=(1/tileU,1/tileV)의 단위로 써 모든 texture의 물리 반복 길이를 같은 미터로 잰다.
@evidence settings/001-production.md#delivery-scope 다섯 reference 이미지를 texture로 삽입하지 않는다는 결정에 따라 모든 grain을 seed=2080의 typed source RGBA로 생성하고 사진·billboard·구운 조명을 쓰지 않는다.
-->

길이 단위 m와 +Y 위·+Z 후면의 축은 [좌표 기준](../settings/003-spatial-basis.md#coordinate-datum)을, 다섯 reference 이미지를 texture로 쓰지 않는 결정은 [납품 범위](../settings/001-production.md#delivery-scope)를 따른다. 색상 texture는 typed source가 고정 seed=2080과 정수 texel 좌표로 만드는 tileable RGBA다. 사진·레퍼런스·billboard·구운 조명·구운 접합 그림자는 사용하지 않는다. 무채색 grain은 linear colorSpace, alpha=255이며 평균 허용 오차는 선형값 ±.005다. texture마다 문서의 ID·해상도·물리 반복 길이를 그대로 자원에 담고, primary UV는 `coordinateSource: surface-metres`, transform.scale=(1/tileU,1/tileV), offset=(0,0), rotationDeg=0으로 전달한다. sampler는 wrapS/T=repeat, minFilter=linearMipmapLinear, magFilter=linear이다. binding 레코드에는 anisotropy 필드가 없으며 [uploader](../../src/viewer/scene.mjs)가 모든 texture에 anisotropy 8을 적용한다. PV의 기존 바인딩과 [층간 띠의 유한 도장면](002-exterior-solids.md#opaque-floor-band)은 각 owner가 명시한 예외다.

비균일 scale 뒤의 표면 길이로 UV를 작성한다. 기존 공개 tessellateToMesh 또는 기존 mesh의 위치·법선·삼각형은 보존하고 face seam에서 UV가 달라질 때 정점 속성만 복제한다. box의 각 면은 local 축에 따라 XY·XZ·ZY 중 두 접선축을 사용하며 법선 부호에 맞춰 반전한다. 결 방향이 있는 넓은 표면은 V를 문서의 grain 축으로 둔다. grain 축이 법선과 평행한 끝면은 [목재 끝면](004-wood.md#wood-end-faces)을 따른다. part transform과 부모를 포함한 실제 scale을 반영하되 회전·이동으로 texture가 세계에 고정되어 미끄러지지 않는다. UV specialization key는 원래 모델/part, scale의 원래 유한 수치, finish, grain 축, 위상이며 눈대중 반올림으로 다른 크기를 합치지 않는다.

판마다 위상이 필요할 때 기존 stable member ID의 Unicode code point를 순서대로 32-bit FNV-1a로 누적하고 seed2080을 초기 hash와 XOR한다. 하위 2bit/다음 1bit를 각각 4/2로 나눈 U/V 위상으로 써 크기·결 축당 최대 8종으로 제한한다. 판별 sRGB 계수는 그 다음 16bit를 65535로 나눈 값으로 각 H2의 구간 안에서 선형 보간한다. 시간·실행 순서·Math.random은 사용하지 않는다. 등방성 석재도 표면의 local 좌표를 쓰되 패널 이음에서 위상을 끊을 수 있다. 문짝 세로결은 문이 회전해도 문과 같이 움직이고 floor grain은 각 판의 +Z를 따른다. seed=2080, 위상 hash와 그 비트 배정, 각 마감 H2의 texture 해상도, UV specialization key는 engine이나 settings에서 받은 값이 아니라 이 층의 저작 선택이다.

같은 texture asset·sampling binding은 viewer에서 GPU texture 하나를 공유한다. [scene uploader](../../src/viewer/scene.mjs)의 textureCache는 asset마다 source 하나를 만들고, binding마다 그 source를 공유하는 clone에 그 binding의 sampler·colorSpace·UV transform을 설정해 돌려준다. package.json이 선언한 three 0.186의 texture cache는 source마다 wrap·filter·anisotropy·colorSpace와 pixel 형식 값을 key로 GPU texture를 두고 UV transform은 key에 넣지 않으므로 같은 asset·sampler·colorSpace는 한 번 올라간다. native material 레코드가 같은 part placement는 정적 batch 하나로 그려진다. 재료 variant가 늘어도 이 공유와 batch를 유지하고 variant마다 RGBA를 다시 올리는 경로를 되살리지 않는다. scene disposal은 batch의 texture를 모두 해제하며 공유 GPU texture는 마지막 사용자가 해제될 때 한 번 놓인다. 이는 새 렌더 channel이나 shader가 아니라 기존 지원 전달의 자원 수명 관리다. 실제 native 모델 variant 수와 texture 자원 수·bytes를 [census](007-observation.md#binding-census)에 함께 기록하고 성능 실측이 없으면 frame rate를 보증하지 않는다.

기존 unit primitive에 0..1 UV 하나를 붙인 채 scale만 키우는 방식은 채택하지 않는다. [scale 검사와 호출 계약](007-observation.md#scale-and-junction-samples)은 `@automovie/engine`의 `validateTextureScale({ models })`에 현재 native 모델을 전달한다. [원본](../../../../packages/engine/src/validation/validateTextureScale.ts)의 이 API는 `IAutoMovieValidation`만 반환하고 transform을 적용하거나 census를 작성하지 않는다. 실제 scale이 반영된 UV인지의 길이 대조와 검사 가능 범위 집계는 연결된 production 검사 owner가 별도로 기록한다. primitive·무UV 등 미계측 표면과 violation이 없는 native 결과를 전체 통과로 읽지 않는다. 정상적인 타일 반복은 이음이 보이지 않아야 하고 UV 방향이 다른 두 면의 경계는 실제 부재 모서리에서만 바뀐다.
