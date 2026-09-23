# 재료 전달과 표면 좌표

## 전달 범위 {#material-delivery}

<!--
@evidence principles/core/common.md#scope-preservation 재료 층의 몫을 v-076 뒤의 질감·반사로 한정하고 새 창호 단면·차양·가구 외형·식재 이동을 spaces와 후속 설계로 돌려, 이 H2의 채널·기본값·fallback 금지가 형상 결손을 대신 떠안지 않게 한다.
@evidence principles/core/common.md#substantive-completion 사용하는 native 채널(primary UV의 baseColorTexture, scalar roughness·metallic·transmission·ior·thickness·clearcoat·emissive)과 쓰지 않는 채널(normal·metallicRoughness·occlusion·emissive texture, displacement, 후처리 치환)을 이름으로 가르고 미명시 값의 기본값을 모두 적어, 구현이 채널이나 기본값을 새로 고를 일이 없다.
@evidence principles/core/common.md#declared-basis 채널 한계는 README의 현재 재료 전달 범위와 scene.mjs·payload.ts의 현재 경로에서, 표면 소유는 surface-decomposition에서 받고, sRGB 표기·m 단위·기본값은 이 층의 저작 선택이며 레퍼런스 픽셀 측정이나 실물 인증이 아니라고 구분한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 완결 표면의 owner와 밝은 석재·어두운 frame·목재 바닥이라는 재료 언어까지만 정한다. 이 H2는 그것을 실제 렌더 채널 집합, 무차원 응답 기본값, 명목 두께와 렌더 thickness의 분리, 미해결 배정의 주소 실패 규칙으로 바꾼다.
@evidence principles/design/materials.md#material-construction-appearance 렌더 thickness=0이 두께 없는 물체라는 뜻이 아니라고 적고 부재 두께는 spaces geometry, 도장·베니어의 명목 두께는 각 마감 H2, 광학 값은 렌더 근사로 나눈다. 색상 입자로 섬유 요철이나 석재 돌출을 만들었다고 하지 않는 경계도 둔다.
@evidence principles/design/materials.md#material-binding-interface 재료는 완결 owner의 기존 표면에만 결합하고 새 형상을 만들지 않으며, owner·표면·재료·좌표 중 하나라도 풀리지 않으면 plaster fallback 대신 그 주소로 실패한다고 정해 host geometry 소유를 넘겨받지 않는다.
@evidence principles/design/materials.md#material-verification-address native 재료·texture 자원·현재 모델·uploader가 같은 값을 소비하는지를 binding-census가 반증하도록 연결하고, 방 안 정확한 거울상은 unverified로 남긴다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work README의 전달 한계, surface-decomposition의 입면·방·층·site owner, delivery-fidelity의 blocking pass 경계, build-or-adopt의 사진·외부 renderer 비채택을 대조했다. 채널 제한과 fallback 금지는 이 층 안의 선택이며 부모의 소유나 표현 수준을 고쳐야 할 결함은 드러나지 않았다.
@evidence settings/001-production.md#delivery-fidelity 실물 사진의 미세 질감이 아닌 blocking pass라는 경계를 scalar 응답과 색상 texture만 쓰는 채널 선택으로 옮기고, 재료 이름이나 색 패치로 빠진 부재를 대신하지 않는다.
@evidence settings/001-production.md#build-or-adopt production 내부 WebGL 도구와 공개 engine API라는 채택 범위 안에서 새 shader·channel·후처리 서비스 없이 기존 uploader가 받는 값만 설계한다.
@evidence settings/001-production.md#runtime-and-restart 단계는 독립 판정으로만 전진한다는 권한을 "materials가 review에 들어간 뒤 materialSources에서 구현한다"는 이 층의 구현 시점으로 적용한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 입면·방·층 owner가 자기 완결 표면의 형상과 마감 배정을 함께 유지한다는 전제를 재료 층의 적용 범위로 삼는다.
@evidence spaces/003-surface-ownership.md#whole-surface-owners 다섯 외피 면의 단독 owner가 return·개구·틀·마감을 모두 소유한다는 결정을 받아 재료가 외피를 사후 칠하기 owner로 나누지 않는다.
@evidenceExclude settings/001-production.md#roles-and-accessibility 저작자·관찰자·리뷰어의 분담과 한국어 문서·안정 id 요구를 재료 29 H2 전체와 대조했다. 어떤 재료 결정도 계측이나 판정 역할을 바꾸거나 입력으로 읽지 않으며, 한국어 서술과 안정 finish id의 일관성은 재료 공통 account의 production-language가 답한다.
@evidenceExclude settings/001-production.md#settings-coverage-map 설정 canon의 소유 배분 지도는 방 치수·문·입면 모듈·가구 배치를 spaces로, 관찰 조건을 004로 넘기는 색인이다. 재료 H2들은 이 배분표를 좌표·배정·응답의 입력으로 읽지 않고 시각 문법·표면 분해·privacy·관찰 장치의 실제 H2를 직접 인용한다.
@evidenceExclude settings/002-household.md#household-program 거주자를 인물 asset이 아닌 사용 배경으로 두는 결정과 공동생활의 밀도를 검토했다. 재료는 인물이나 생활 밀도를 표현하지 않고, 방을 식별하는 가구·설비의 마감은 ground-program·upper-program·flex-states의 구체 항목을 인용한다.
@evidenceExclude settings/002-household.md#design-subject-conditions 지름 0.60m·높이 1.80m 가상 통행 원통과 인체 사용성 범위 밖 목록을 검토했다. 재료는 형상·배치·문 상태를 바꾸지 않아 원통 검사의 입력을 소비하거나 변경하지 않으며, 미끄럼·안전 성능을 주장하지 않는다는 한계는 각 마감 H2에 따로 있다.
@evidenceExclude settings/003-spatial-basis.md#ground-graph 1층의 현관·계단·공용부·작업실·코어 연결 그래프를 검토했다. 재료는 연결을 더하거나 빼지 않고 문턱 마감 경계는 개별 문과 방 H2를 인용하므로 그래프 자체를 입력으로 쓰는 재료 결정이 없다.
@evidenceExclude settings/003-spatial-basis.md#upper-graph 계단참에서 시작하는 일자 복도와 여섯 방의 직접 문 연결을 검토했다. 상층 마감은 각 방·문·벽 H2의 실제 면에 결합하고 복도 그래프의 분기 금지나 연결 수를 읽지 않는다.
@evidenceExclude settings/004-observation.md#accessibility-products 텍스트 id 목록·키보드 조작·글자 상태 표시와 자막·전사 없음의 분류를 검토했다. 재료 상태 표본은 privacy·flex 선택을 소비할 뿐 텍스트 목록이나 조작 요소를 바꾸지 않고, 유리 색만으로 상태를 알리는 새 UI를 만들지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#ground-partition 1층 다섯 방의 clear cell 분할과 cell 사이 gap을 shared wall로만 쓰는 원칙을 검토했다. 재료는 각 방·벽·문 H2의 실제 면을 인용하고, 분할 원칙 자체는 마감의 좌표·배정·응답 어느 것에도 쓰이지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#upper-partition 상층 일곱 방이 한 복도에서 직접 닿는 분할과 L자 seam에 벽을 두지 않는 원칙을 검토했다. 재료는 개별 방·벽 H2의 면에 결합하며 분할 원칙이나 seam 무벽 규칙을 입력으로 읽지 않는다.
-->

이 설계는 v-076 뒤 사용자가 요청한 재료 질감·반사를 소유한다. [표면 소유](../spaces/003-surface-ownership.md#whole-surface-owners)의 입면·방·층 owner가 자기 완결 표면의 형상과 마감 배정을 함께 유지한다. materials는 재사용 가능한 재료 응답과 좌표 조건을 제공한다. 새 창호 단면, 차양, 가구 외형, 식재 이동은 만들지 않는다. 검증 대상은 같은 집의 실제 표면이며 별도 예쁜 샘플이 집을 대신하지 않는다.

[현재 전달 한계](../../README.md#현재-재료-전달-범위)와 `src/house/assembly.ts`, `src/viewer/payload.ts`, `src/viewer/scene.mjs`를 전제로 한다. native baseColorTexture의 primary UV와 scalar roughness·metallic·transmission·ior·thickness·clearcoat·emissive만 사용한다. normalTexture, metallicRoughnessTexture, occlusionTexture, emissiveTexture, displacement, 후처리 재질 치환은 이번 설계에 없다. 색상 입자로 섬유 요철의 실제 그림자나 석재 돌출을 만들었다고 하지 않는다. 거울은 환경 반사의 근사이며 방 내부의 정확한 거울상은 unverified다.

이하 색은 sRGB `#RRGGBB`, 길이는 m, roughness와 metallic은 무차원 렌더 값이다. 별도 명시가 없으면 metallic=0, opacity=1, alphaMode=opaque, doubleSided=false, transmission=0, emissive=null, thickness=0, clearcoat=0, ior=1.5다. 렌더 thickness=0은 물체의 두께가 없다는 뜻이 아니다. 부재 두께는 spaces의 기존 geometry, 표면 도장·베니어의 명목 두께는 각 마감 H2가 소유한다. 값은 저작 선택이며 레퍼런스 픽셀에서 잰 값이나 실물 인증값이 아니다.

미지정 재료 이름을 plaster로 대신하는 현재 fallback은 새 바인딩 경로에서 허용하지 않는다. owner·표면·재료·좌표가 해결되지 않으면 그 주소로 실패한다. [전달 검사](007-observation.md#binding-census)는 native 재료, texture 자원, 현재 모델과 uploader가 같은 값을 소비하는지 검사한다. 이 경로와 source는 materials가 review에 들어간 뒤 materialSources에서 구현한다.

## 표면 배정 인터페이스 {#surface-bindings}

<!--
@evidence principles/core/common.md#scope-preservation 역할 주소로 모든 기존 표면이 마감을 받게 하면서 plan·벽 cut·opening·connector·부재 ID·부모·배치·상태 동작은 원래 owner가 계속 생성한다고 정해, 재료 교체가 topology 항목을 빠뜨리거나 복제할 여지를 남기지 않는다.
@evidence principles/core/common.md#substantive-completion prototype 레코드의 세 필드와 import 경로, explicit prototype 연결 순서, instanceSlot 주소 형식, weight=1·default 금지, set/member 주소가 있는 Error로 거부할 조건까지 정해 구현자가 variant 선택 방식을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis IAutoMovieInstancePrototypeDesign·IAutoMovieExplicitInstanceTransform과 materializeCompiledInstanceSet·instanceSlot의 계약은 interface·engine 원본 링크에서, palette의 절대 색 해석은 engine과 현재 uploader에서 받고, weight와 ID 규칙은 이 층의 선택으로 구분한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 완결 표면의 owner와 portal 양면 binding의 소유만 정한다. 이 H2는 문자열 일괄 교체 대신 역할별 마감 ID·결 축 배정, 동일 형상 metric UV variant를 explicit prototype으로 고르는 population 규칙, 기준색 palette 전달을 새로 결정한다.
@evidence principles/design/materials.md#material-construction-appearance variant는 형상·transform·member ID·world bounds를 보존하고 UV와 마감만 다르다고 정해 외관 교체가 부재 크기나 배치라는 구조 사실을 바꾸지 않으며, palette 절대색을 viewer 보정식으로 이중 tint하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 결합 주소를 owner 파일+element 또는 set/member ID+part/face 역할로 정의하고 흰 소파 직물·흰 세면대 도기, 나무 줄기 oak·가구 목재의 반례로 이름 추측을 금지하며, prototypeBounds와 world bounds의 일치를 호환 조건으로 둔다.
@evidence principles/design/materials.md#material-verification-address member ID·count·transform·world bounds 보존과 모델 variant 증가가 prototype·finish·scale로 설명되는지를 binding-census가 반증하도록 연결한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work surface-decomposition의 portal 양면 binding 규칙, whole-surface-owners의 입면 소유, 기존 Assembly.repeat의 set/member·transform 구조를 대조했다. 같은 world bounds의 variant를 고르는 데 부모의 형상·ID·배치를 바꿀 필요가 없었다.
@evidence settings/001-production.md#module-boundary CommonJS engine의 lowerBuiltEnvironment·materializeCompiledInstanceSet·instanceSlot을 서버 쪽 payload.ts에서만 호출하고 브라우저에는 해석된 모델만 보내는 경계를 variant 소비 경로로 그대로 쓴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 주체 생성 owner가 양면 material binding을 소유하고 상대 owner는 자기 면의 요구만 넘긴다는 규칙을 역할별 마감 배정의 주소 소유로 적용한다.
@evidence spaces/003-surface-ownership.md#whole-surface-owners 입면 owner가 창호·shade·마감까지 소유하므로 입면 panel member의 variant 선택도 그 owner의 population 작성 경계에서 이루어지게 한다.
-->

완결 owner는 `owner 파일 + 현재 element 또는 population/member ID + part/face 역할`에 마감 ID와 결 축을 붙인다. `oak`나 `white` 문자열 전체를 일괄 교체하지 않는다. 예를 들어 `common-sofa-pillow-*`의 흰색은 직물이고 세면대의 흰색은 도기다. 나무 줄기의 oak는 가구 목재가 아니다. 이 역할은 생성 시점의 typed 입력이며 viewer가 이름을 추측해서 칠하지 않는다. 기존 plan, 벽 cut, opening, connector, 부재 ID, 부모, 배치와 상태 동작은 그 owner가 계속 생성한다.

독립 element의 모델은 재료·실제 scale·결 축별로 공유할 수 있다. compact population은 기존 `set.id`, explicit member `id`, count, seed, 순서, translation/rotation/scale을 유지한다. `@automovie/interface`의 공개 type `IAutoMovieInstancePrototypeDesign`과 explicit `prototype`으로 동일 형상·다른 metric UV의 모델을 선택한다. `@automovie/engine`의 공개 `instanceSlot`이 반환하는 주소 `instance:<set.id>:<explicit.id>`를 유지하며 수작업 member 복제나 set 분할로 바꾸지 않는다. 각 variant의 weight는 1이고 모든 member가 prototype을 명시하므로 무작위 선택에 의존하지 않는다. 원래 prototypeBounds와 실제 세계 bounds가 같아야 한다.

`IAutoMovieInstancePrototypeDesign`은 호출 함수나 새 production helper가 아니라 `{ id: string; modelRecipe: string; weight: number }`인 입력 레코드다. [정의](../../../../packages/interface/src/production/IAutoMovieInstancePrototypeDesign.ts)는 [production index](../../../../packages/interface/src/production/index.ts)와 [package root index](../../../../packages/interface/src/index.ts)에서 재export된다. 실제 import 경로는 `@automovie/interface`이며 저장소 내부 경로는 근거를 읽는 링크다. `id`는 set 안에서 중복 없는 비어 있지 않은 문자열, `modelRecipe`는 등록된 variant 모델의 ID, `weight`는 양수이며 이번 설계는 1로 고정한다. `default`는 engine이 기본 modelRecipe에 부여하는 ID이므로 저작 variant ID로 사용하지 않는다. 반환값·런타임 검사는 이 type 자체에 없다.

구현 시 [src/house/assembly.ts](../../src/house/assembly.ts)가 `import type { IAutoMovieInstancePrototypeDesign, IAutoMovieExplicitInstanceTransform } from "@automovie/interface"`로 입력 타입을 소비한다. 완결 표면 owner가 지정한 마감·scale·결·위상에 대응하는 모델을 먼저 `environment.models`에 등록한 뒤, population 작성 경계가 `IAutoMovieInstancePrototypeDesign[]`를 `set.prototypes`에 넣는다. [IAutoMovieExplicitInstanceTransform](../../../../packages/interface/src/production/IAutoMovieExplicitInstanceTransform.ts)의 기존 id·translation(m)·rotation(quaternion)·scale과 선택적 palette를 유지하고 `prototype`에는 선택한 variant의 id를 넣어 `set.layout = { kind: "explicit", transforms }`로 전달한다. 기존 `Assembly.repeat`의 반환은 `void`이며 작성 결과는 `environment.populations`다. variant ID 중복·빈 ID·`default` 충돌·미등록 modelRecipe는 이 작성 경계에서 set/member 주소가 있는 `Error`로 거부하고 다른 모델로 대체하지 않는다.

실제 소비자는 [src/viewer/payload.ts](../../src/viewer/payload.ts)의 기존 `@automovie/engine` root import다. `lowerBuiltEnvironment(environment)` 뒤 `materializeCompiledInstanceSet({ instanceSet: design, world: { routes: [] } })`가 `IAutoMovieCompiledInstanceSet`을 반환하고, `instanceSlot(compiled, index)`가 선택된 `prototype`, `modelRecipe`, `node`, position·rotation·scale3·palette를 가진 `IAutoMovieInstanceSlot`을 반환한다. 근거는 [compiler](../../../../packages/engine/src/populationRuntime/materializeCompiledInstanceSet.ts)와 [slot reader](../../../../packages/engine/src/populationRuntime/instanceSlot.ts)다. 없는 explicit prototype은 native `Error`(`Instance set "<id>" slot <n> references missing prototype "<prototype>".`), 범위 밖 slot은 `RangeError`다. 이 예외를 잡아 기본 모델이나 빈 population으로 바꾸지 않는다. 이 문단은 materialSources에서 연결할 경로이며 현재 source에는 이 import와 호출이 없다.

palette는 engine에서 절대 sRGB 색으로 쓰인다. 반복 표면 owner는 새 마감 기준색과 해당 H2가 허용한 판별 변화를 explicit palette로 전달한다. viewer의 기존 선형색 보정식을 바꿔 이중 tint를 감추지 않는다. 나머지 population의 palette는 그대로 둔다. 새 material source는 문서 파일마다 하나의 공개 owner로 대응하며, 각 입면·방·층에서 직접 소비한다. `buildHouse()`와 library export, viewer가 같은 native 재료/모델을 받아야 한다.

검사는 [전체 바인딩 census](007-observation.md#binding-census)다. 기존 모델 ID의 증가 자체는 geometry 증가가 아니지만 모델별 부재 선택, 동일 world bounds, member 정체성, 모든 기존 topology 참조를 대조해야 한다. 하나의 완결 표면을 여러 사후 칠하기 owner가 나누어 갖는 구현은 이 설계와 맞지 않는다.

## 미터 좌표와 반복 {#metric-texture-coordinates}

<!--
@evidence principles/core/common.md#scope-preservation 새 texture의 생성(seed·texel), 전달(surface-metres·transform·sampler), 비균일 scale 반영, 판별 위상, GPU 자원 공유를 한 규칙으로 묶고 PV와 층간 띠의 예외 owner를 명시해 좌표 규칙이 없는 texture 면이 남지 않게 한다.
@evidence principles/core/common.md#substantive-completion seed=2080, linear colorSpace와 ±.005 평균 오차, transform.scale=(1/tileU,1/tileV), wrap·filter·anisotropy, XY·XZ·ZY 접선축과 법선 부호, FNV-1a 위상의 비트 배정과 8종 상한까지 수치로 정해 구현이 표면 좌표계를 발명하지 않는다.
@evidence principles/core/common.md#declared-basis m·Y-up은 coordinate-datum, 사진 비사용은 delivery-scope, validateTextureScale의 반환은 engine 원본에서 받고, 위상 hash·texture 해상도·specialization key는 이 층의 저작 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 datum은 단위와 축만 정한다. 이 H2는 그 단위를 texture 반복 길이, 실제 scale을 반영한 UV specialization key, 판별 위상 hash라는 표면 좌표 결정으로 바꾼다.
@evidence principles/design/materials.md#material-construction-appearance 색상 texture는 명도 변화일 뿐 요철·그림자를 만들지 않고, mesh의 위치·법선·삼각형은 보존한 채 UV 정점 속성만 복제한다고 정해 부재 형상과 외관 파라미터를 떼어 놓는다.
@evidence principles/design/materials.md#material-binding-interface box 면의 local 접선축과 법선 부호, grain 축 V, 문 회전과 함께 움직이는 좌표, 판마다 +Z를 따르는 floor grain처럼 host 형상을 바꾸지 않고 따를 좌표 계약을 정한다.
@evidence principles/design/materials.md#material-verification-address validateTextureScale 호출과 world-space U/V 길이 대조, 반복 주기 경계, GPU texture 자원 수·bytes를 scale-and-junction-samples와 binding-census에 연결하고 frame rate는 보증하지 않는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work coordinate-datum의 m·Y-up·+Z 후면, 기존 unit box primitive와 part transform·부모 scale 구조, tessellateToMesh의 정점 배열을 대조했다. 부모가 metric UV를 막는 좌표 결함은 없었고 unit UV 확대 방식의 폐기는 이 층 안의 결정이다.
@evidence settings/003-spatial-basis.md#coordinate-datum m 단위 오른손 Y-up 좌표를 texture 반복 길이의 단위와 판마다 world +Z를 따르는 바닥 결의 기준으로 쓴다.
@evidence settings/001-production.md#delivery-scope 다섯 reference PNG를 texture로 삽입하지 않는다는 결정에 따라 모든 grain을 typed source의 결정론적 RGBA로 생성하고 사진·billboard를 쓰지 않는다.
-->

색상 texture는 typed source가 고정 seed=2080과 정수 texel 좌표로 만드는 tileable RGBA다. 사진·레퍼런스·billboard·구운 조명·구운 접합 그림자는 사용하지 않는다. 무채색 grain은 linear colorSpace, alpha=255이며 평균 허용 오차는 선형값 ±.005다. texture마다 문서의 ID·해상도·물리 반복 길이를 그대로 자원에 담고, primary UV는 `coordinateSource: surface-metres`, transform.scale=(1/tileU,1/tileV), offset=(0,0), rotationDeg=0으로 전달한다. wrapS/T=repeat, minFilter=linearMipmapLinear, magFilter=linear, anisotropy=8이다. PV의 기존 바인딩과 [층간 띠의 유한 도장면](002-exterior-solids.md#opaque-floor-band)은 각 owner가 명시한 예외다.

비균일 scale 뒤의 표면 길이로 UV를 작성한다. 기존 공개 tessellateToMesh 또는 기존 mesh의 위치·법선·삼각형은 보존하고 face seam에서 UV가 달라질 때 정점 속성만 복제한다. box의 각 면은 local 축에 따라 XY·XZ·ZY 중 두 접선축을 사용하며 법선 부호에 맞춰 반전한다. 결 방향이 있는 넓은 표면은 V를 문서의 grain 축으로 둔다. grain 축이 법선과 평행한 끝면은 [목재 끝면](004-wood.md#wood-end-faces)을 따른다. part transform과 부모를 포함한 실제 scale을 반영하되 회전·이동으로 texture가 세계에 고정되어 미끄러지지 않는다. UV specialization key는 원래 모델/part, scale의 원래 유한 수치, finish, grain 축, 위상이며 눈대중 반올림으로 다른 크기를 합치지 않는다.

판마다 위상이 필요할 때 기존 stable member ID의 Unicode code point를 순서대로 32-bit FNV-1a로 누적하고 seed2080을 초기 hash와 XOR한다. 하위 2bit/다음 1bit를 각각 4/2로 나눈 U/V 위상으로 써 크기·결 축당 최대 8종으로 제한한다. 판별 sRGB 계수는 그 다음 16bit를 65535로 나눈 값으로 각 H2의 구간 안에서 선형 보간한다. 시간·실행 순서·Math.random은 사용하지 않는다. 등방성 석재도 표면의 local 좌표를 쓰되 패널 이음에서 위상을 끊을 수 있다. 문짝 세로결은 문이 회전해도 문과 같이 움직이고 floor grain은 각 판의 +Z를 따른다.

같은 texture asset·sampling binding은 viewer에서 GPU texture 하나를 공유해야 한다. 모델 variant마다 같은 RGBA 배열을 다시 업로드하는 현재 경로를 그대로 증식시키지 않는다. scene disposal은 공유 자원을 한 번만 해제한다. 이는 새 렌더 channel이나 shader가 아니라 기존 지원 전달의 자원 수명 관리다. 실제 native 모델 variant 수와 texture 자원 수·bytes를 [census](007-observation.md#binding-census)에 함께 기록하고 성능 실측이 없으면 frame rate를 보증하지 않는다.

기존 unit primitive에 0..1 UV 하나를 붙인 채 scale만 키우는 방식은 채택하지 않는다. [scale 검사와 호출 계약](007-observation.md#scale-and-junction-samples)은 `@automovie/engine`의 `validateTextureScale({ models })`에 현재 native 모델을 전달한다. 이 API는 `IAutoMovieValidation`만 반환하고 transform을 적용하거나 census를 작성하지 않는다. 실제 scale이 반영된 UV인지의 길이 대조와 검사 가능 범위 집계는 연결된 production 검사 owner가 별도로 기록한다. primitive·무UV 등 미계측 표면과 빈 findings를 전체 통과로 읽지 않는다. 정상적인 타일 반복은 이음이 보이지 않아야 하고 UV 방향이 다른 두 면의 경계는 실제 부재 모서리에서만 바뀐다.
