# 재료 전달과 표면 좌표

## 전달 범위 {#material-delivery}

이 초안은 v-076 뒤 사용자가 요청한 재료 질감·반사를 소유한다. [표면 소유](../spaces/003-surface-ownership.md#whole-surface-owners)의 입면·방·층 owner가 자기 완결 표면의 형상과 마감 배정을 함께 유지한다. materials는 재사용 가능한 재료 응답과 좌표 조건을 제공한다. 새 창호 단면, 차양, 가구 외형, 식재 이동은 만들지 않는다. 검증 대상은 같은 집의 실제 표면이며 별도 예쁜 샘플이 집을 대신하지 않는다.

[현재 전달 한계](../../README.md#현재-재료-전달-범위)와 `src/house/assembly.ts`, `src/viewer/payload.ts`, `src/viewer/scene.mjs`를 전제로 한다. native baseColorTexture의 primary UV와 scalar roughness·metallic·transmission·ior·thickness·clearcoat·emissive만 사용한다. normalTexture, metallicRoughnessTexture, occlusionTexture, emissiveTexture, displacement, 후처리 재질 치환은 이번 설계에 없다. 색상 입자로 섬유 요철의 실제 그림자나 석재 돌출을 만들었다고 하지 않는다. 거울은 환경 반사의 근사이며 방 내부의 정확한 거울상은 unverified다.

이하 색은 sRGB `#RRGGBB`, 길이는 m, roughness와 metallic은 무차원 렌더 값이다. 별도 명시가 없으면 metallic=0, opacity=1, alphaMode=opaque, doubleSided=false, transmission=0, emissive=null, thickness=0, clearcoat=0, ior=1.5다. 렌더 thickness=0은 물체의 두께가 없다는 뜻이 아니다. 부재 두께는 spaces의 기존 geometry, 표면 도장·베니어의 명목 두께는 각 마감 H2가 소유한다. 값은 저작 선택이며 레퍼런스 픽셀에서 잰 값이나 실물 인증값이 아니다.

미지정 재료 이름을 plaster로 대신하는 현재 fallback은 새 바인딩 경로에서 허용하지 않는다. owner·표면·재료·좌표가 해결되지 않으면 그 주소로 실패한다. [전달 검사](007-observation.md#binding-census)는 native 재료, texture 자원, 현재 모델과 uploader가 같은 값을 소비하는지 검사한다. 설계 PASS 전에는 이 경로나 source를 구현하지 않는다.

## 표면 배정 인터페이스 {#surface-bindings}

완결 owner는 `owner 파일 + 현재 element 또는 population/member ID + part/face 역할`에 마감 ID와 결 축을 붙인다. `oak`나 `white` 문자열 전체를 일괄 교체하지 않는다. 예를 들어 `common-sofa-pillow-*`의 흰색은 직물이고 세면대의 흰색은 도기다. 나무 줄기의 oak는 가구 목재가 아니다. 이 역할은 생성 시점의 typed 입력이며 viewer가 이름을 추측해서 칠하지 않는다. 기존 plan, 벽 cut, opening, connector, 부재 ID, 부모, 배치와 상태 동작은 그 owner가 계속 생성한다.

독립 element의 모델은 재료·실제 scale·결 축별로 공유할 수 있다. compact population은 기존 `set.id`, explicit member `id`, count, seed, 순서, translation/rotation/scale을 유지한다. `@automovie/interface`의 공개 type `IAutoMovieInstancePrototypeDesign`과 explicit `prototype`으로 동일 형상·다른 metric UV의 모델을 선택한다. `@automovie/engine`의 공개 `instanceSlot`이 반환하는 주소 `instance:<set.id>:<explicit.id>`를 유지하며 수작업 member 복제나 set 분할로 바꾸지 않는다. 각 variant의 weight는 1이고 모든 member가 prototype을 명시하므로 무작위 선택에 의존하지 않는다. 원래 prototypeBounds와 실제 세계 bounds가 같아야 한다.

`IAutoMovieInstancePrototypeDesign`은 호출 함수나 새 production helper가 아니라 `{ id: string; modelRecipe: string; weight: number }`인 입력 레코드다. [정의](../../../../packages/interface/src/production/IAutoMovieInstancePrototypeDesign.ts)는 [production index](../../../../packages/interface/src/production/index.ts)와 [package root index](../../../../packages/interface/src/index.ts)에서 재export된다. 실제 import 경로는 `@automovie/interface`이며 저장소 내부 경로는 근거를 읽는 링크다. `id`는 set 안에서 중복 없는 비어 있지 않은 문자열, `modelRecipe`는 등록된 variant 모델의 ID, `weight`는 양수이며 이번 설계는 1로 고정한다. `default`는 engine이 기본 modelRecipe에 부여하는 ID이므로 저작 variant ID로 사용하지 않는다. 반환값·런타임 검사는 이 type 자체에 없다.

구현 시 [src/house/assembly.ts](../../src/house/assembly.ts)가 `import type { IAutoMovieInstancePrototypeDesign, IAutoMovieExplicitInstanceTransform } from "@automovie/interface"`로 입력 타입을 소비한다. 완결 표면 owner가 지정한 마감·scale·결·위상에 대응하는 모델을 먼저 `environment.models`에 등록한 뒤, population 작성 경계가 `IAutoMovieInstancePrototypeDesign[]`를 `set.prototypes`에 넣는다. [IAutoMovieExplicitInstanceTransform](../../../../packages/interface/src/production/IAutoMovieExplicitInstanceTransform.ts)의 기존 id·translation(m)·rotation(quaternion)·scale과 선택적 palette를 유지하고 `prototype`에는 선택한 variant의 id를 넣어 `set.layout = { kind: "explicit", transforms }`로 전달한다. 기존 `Assembly.repeat`의 반환은 `void`이며 작성 결과는 `environment.populations`다. variant ID 중복·빈 ID·`default` 충돌·미등록 modelRecipe는 이 작성 경계에서 set/member 주소가 있는 `Error`로 거부하고 다른 모델로 대체하지 않는다.

실제 소비자는 [src/viewer/payload.ts](../../src/viewer/payload.ts)의 기존 `@automovie/engine` root import다. `lowerBuiltEnvironment(environment)` 뒤 `materializeCompiledInstanceSet({ instanceSet: design, world: { routes: [] } })`가 `IAutoMovieCompiledInstanceSet`을 반환하고, `instanceSlot(compiled, index)`가 선택된 `prototype`, `modelRecipe`, `node`, position·rotation·scale3·palette를 가진 `IAutoMovieInstanceSlot`을 반환한다. 근거는 [compiler](../../../../packages/engine/src/populationRuntime/materializeCompiledInstanceSet.ts)와 [slot reader](../../../../packages/engine/src/populationRuntime/instanceSlot.ts)다. 없는 explicit prototype은 native `Error`(`Instance set "<id>" slot <n> references missing prototype "<prototype>".`), 범위 밖 slot은 `RangeError`다. 이 예외를 잡아 기본 모델이나 빈 population으로 바꾸지 않는다. 이 문단은 PASS 후 연결할 경로이며 이번 draft에서 import나 호출을 추가한 것은 아니다.

palette는 engine에서 절대 sRGB 색으로 쓰인다. 반복 표면 owner는 새 마감 기준색과 해당 H2가 허용한 판별 변화를 explicit palette로 전달한다. viewer의 기존 선형색 보정식을 바꿔 이중 tint를 감추지 않는다. 나머지 population의 palette는 그대로 둔다. 새 material source는 문서 파일마다 하나의 공개 owner로 대응하며, 각 입면·방·층에서 직접 소비한다. `buildHouse()`와 library export, viewer가 같은 native 재료/모델을 받아야 한다.

검사는 [전체 바인딩 census](007-observation.md#binding-census)다. 기존 모델 ID의 증가 자체는 geometry 증가가 아니지만 모델별 부재 선택, 동일 world bounds, member 정체성, 모든 기존 topology 참조를 대조해야 한다. 하나의 완결 표면을 여러 사후 칠하기 owner가 나누어 갖는 구현은 이 설계와 맞지 않는다.

## 미터 좌표와 반복 {#metric-texture-coordinates}

색상 texture는 typed source가 고정 seed=2080과 정수 texel 좌표로 만드는 tileable RGBA다. 사진·레퍼런스·billboard·구운 조명·구운 접합 그림자는 사용하지 않는다. 무채색 grain은 linear colorSpace, alpha=255이며 평균 허용 오차는 선형값 ±.005다. texture마다 문서의 ID·해상도·물리 반복 길이를 그대로 자원에 담고, primary UV는 `coordinateSource: surface-metres`, transform.scale=(1/tileU,1/tileV), offset=(0,0), rotationDeg=0으로 전달한다. wrapS/T=repeat, minFilter=linearMipmapLinear, magFilter=linear, anisotropy=8이다. PV의 기존 바인딩과 [층간 띠의 유한 도장면](002-exterior-solids.md#opaque-floor-band)은 각 owner가 명시한 예외다.

비균일 scale 뒤의 표면 길이로 UV를 작성한다. 기존 공개 tessellateToMesh 또는 기존 mesh의 위치·법선·삼각형은 보존하고 face seam에서 UV가 달라질 때 정점 속성만 복제한다. box의 각 면은 local 축에 따라 XY·XZ·ZY 중 두 접선축을 사용하며 법선 부호에 맞춰 반전한다. 결 방향이 있는 넓은 표면은 V를 문서의 grain 축으로 둔다. grain 축이 법선과 평행한 끝면은 [목재 끝면](004-wood.md#wood-end-faces)을 따른다. part transform과 부모를 포함한 실제 scale을 반영하되 회전·이동으로 texture가 세계에 고정되어 미끄러지지 않는다. UV specialization key는 원래 모델/part, scale의 원래 유한 수치, finish, grain 축, 위상이며 눈대중 반올림으로 다른 크기를 합치지 않는다.

판마다 위상이 필요할 때 기존 stable member ID의 Unicode code point를 순서대로 32-bit FNV-1a로 누적하고 seed2080을 초기 hash와 XOR한다. 하위 2bit/다음 1bit를 각각 4/2로 나눈 U/V 위상으로 써 크기·결 축당 최대 8종으로 제한한다. 판별 sRGB 계수는 그 다음 16bit를 65535로 나눈 값으로 각 H2의 구간 안에서 선형 보간한다. 시간·실행 순서·Math.random은 사용하지 않는다. 등방성 석재도 표면의 local 좌표를 쓰되 패널 이음에서 위상을 끊을 수 있다. 문짝 세로결은 문이 회전해도 문과 같이 움직이고 floor grain은 각 판의 +Z를 따른다.

같은 texture asset·sampling binding은 viewer에서 GPU texture 하나를 공유해야 한다. 모델 variant마다 같은 RGBA 배열을 다시 업로드하는 현재 경로를 그대로 증식시키지 않는다. scene disposal은 공유 자원을 한 번만 해제한다. 이는 새 렌더 channel이나 shader가 아니라 기존 지원 전달의 자원 수명 관리다. 실제 native 모델 variant 수와 texture 자원 수·bytes를 [census](007-observation.md#binding-census)에 함께 기록하고 성능 실측이 없으면 frame rate를 보증하지 않는다.

기존 unit primitive에 0..1 UV 하나를 붙인 채 scale만 키우는 방식은 채택하지 않는다. [scale 검사와 호출 계약](007-observation.md#scale-and-junction-samples)은 `@automovie/engine`의 `validateTextureScale({ models })`에 현재 native 모델을 전달한다. 이 API는 `IAutoMovieValidation`만 반환하고 transform을 적용하거나 census를 작성하지 않는다. 실제 scale이 반영된 UV인지의 길이 대조와 검사 가능 범위 집계는 연결된 production 검사 owner가 별도로 기록한다. primitive·무UV 등 미계측 표면과 빈 findings를 전체 통과로 읽지 않는다. 정상적인 타일 반복은 이음이 보이지 않아야 하고 UV 방향이 다른 두 면의 경계는 실제 부재 모서리에서만 바뀐다.
