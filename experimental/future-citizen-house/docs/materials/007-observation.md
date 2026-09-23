# 재료의 유한 관찰 집합

## 바인딩 전수 검사 {#binding-census}

<!--
@evidence principles/core/common.md#scope-preservation 모든 역할의 owner·element 또는 set/member·part/면·material·texture·tile·UV 근거를 열거하고 junction 16면·slab 면 분할·층간 띠 면과 이름 있는 retained 역할을 면·역할별로 남겨, 재료 배정의 누락·중복·미지원 channel이 보고 없이 사라질 수 없게 한다.
@evidence principles/core/common.md#substantive-completion 검사 입력(현재 state의 buildHouse 반환과 공개 lowering·instanceSlot), 열거 항목, 실패 조건, 기존과 비교할 주소·ID·count·transform·bounds, sourceBasis에 새 문서와 source를 포함할 조건까지 정해 검사자가 census 형식을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 비교할 house·storey·room·connector·opening 주소는 본문이 링크한 citizen-house-space와 stage-one-verification, 입력 경로는 공개 engine API에서 받고 열거 항목과 실패 분류는 이 층의 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 전수 검증은 층 귀속·도달·분할을 묻는다. 이 H2는 재료 교체 뒤 같은 산출물에서 역할별 마감 배정과 모델 variant 증가를 설명하는 재료 전용 census를 더한다.
@evidence principles/design/materials.md#material-construction-appearance 물리 층은 부재 소유 문서·geometry와 명목 표면층 선택으로 나누고 광학 값은 native material에서 읽게 해, census가 두께와 렌더 응답을 한 값으로 섞지 않는다.
@evidence principles/design/materials.md#material-binding-interface census가 역할 주소마다 재료·texture·UV 근거를 읽어 host geometry와 재료 결합의 호환을 확인하고 미정 배정을 plaster나 retained로 대신하지 않는다.
@evidence principles/design/materials.md#material-verification-address 텍스트 census는 시각 합격이 아니며 실제 프레임과 함께 읽는다고 정하고, member별 prototype·modelRecipe로 없는 prototype의 Error 대체를 드러내며 topology·캐노피 audit 오류와 잘못된 binding을 숨기지 않는 반증 조건을 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work citizen-house-space의 unit root·site→house→storey 계층, stage-one-verification의 질문 표, 현재 auditHouse·auditCanopy의 실패 경로를 대조했다. 재료 census가 요구하는 비교 주소가 모두 부모 산출물에 있었다.
@evidence spaces/001-citizen-house.md#citizen-house-space citizen-site→house→storey→room 계층과 house-root 가시 루트를 재료 교체 전후에 같은 주소로 비교한다.
@evidence spaces/002-spatial-graph.md#stage-one-verification 층 귀속·도달·완결 분할·유리와 실내 일치 질문이 재료 variant 교체 뒤에도 같은 컴파일 산출물에서 답하는지를 census 비교 대상으로 둔다.
-->

검사 입력은 현재 상태의 `buildHouse()` 반환과 공개 lowering/instanceSlot이 만든 실제 모델·부재·material·UV다. [바인딩 인터페이스](001-binding-and-scale.md#surface-bindings)의 역할별로 source owner, element 또는 set/member, part/면, material ID, texture ID, physical tile, UV 근거를 열거한다. 면 단위로 나뉜 부재는 면별로 적는다: junction solid 12개의 노출면 16개와 각 면이 향한 공간·마감, 숨은 면 수, upper slab 네 piece의 계단 구멍 쪽 절단면과 나머지 면, 층간 띠를 받는 panel·wall body 외향 면. 목재는 texture를 받은 면 수와 [끝면](004-wood.md#wood-end-faces)의 무texture 면 수를 따로 센다. retained 역할도 [보존 H2](006-wet-and-joinery.md#retained-surfaces)가 이름으로 든 역할별로 적고 catch-all 한 줄로 묶지 않는다. 적용 없는 역할도 0을 남기고, missing/중복 role·지원하지 않는 channel·잘못된 색 공간은 실패로 보고한다. 미정 배정을 plaster나 retained로 대신하지 않는다.

기존과 비교할 것은 house/storey/room/connector/opening 주소, 모든 실제 member ID·count·transform·world bounds·소유 관계다. 이 주소는 [시민 주택 공간](../spaces/001-citizen-house.md#citizen-house-space)의 citizen-site→house→storey→room 계층과 [1단계 검증](../spaces/002-spatial-graph.md#stage-one-verification)의 질문에서, 검사 입력은 공개 `@automovie/engine` API에서 받는다. 열거 항목과 실패 분류는 이 층의 선택이다. 새 model variant 수는 원래 prototype/finish/scale로 설명되어야 한다. member마다 instanceSlot이 반환한 prototype·modelRecipe를 적어, 없는 explicit prototype의 native Error를 기본 모델이나 빈 population으로 바꾼 경로가 드러나게 한다. native 모델 variant 수와 texture 자원 수·RGBA bytes를 함께 기록하고, viewer payload의 models·textures가 `buildHouse()`와 같은 native material·texture 레코드를 uploader에 넘기는지 대조한다. topology·캐노피 audit 오류와 유효하지 않은 texture binding을 숨기지 않는다. `sourceBasis`는 구현 단계에서 docs/materials와 새 material source도 현재 입력으로 포함해야 하며 구 버전 payload를 새 문서의 검증으로 인용하지 않는다.

물리 층은 부재 소유 문서/geometry와 명목 표면층 선택을 구분하고 optical 값은 native material에서 읽는다. 재료 source가 아직 없어 결과는 unverified다. 구현 뒤에도 텍스트 census는 시각 합격이 아니며 아래 실제 프레임과 함께 읽는다.

## 크기와 접합 표본 {#scale-and-junction-samples}

<!--
@evidence principles/core/common.md#scope-preservation 모든 새 texture family의 최소·최대 면과 UV 방향, 1m·3m·12m 거리와 정면·30° 사선, 네 입면 층간 띠 끝과 띠 끝을 가로지르는 두 panel member·slab 외곽·junction 면·계단 구멍 절단면을 포함한 필수 접합 목록과 native validateTextureScale 호출을 한 표본 집합에 두고, 좁은 방에서 불가능한 거리도 이유와 함께 남긴다.
@evidence principles/core/common.md#substantive-completion 중성 배경 #808080, hemisphere 1·directional 2와 45° 위치, exposure 1·1600×1000·DPR1·FOV50, 1m 기준 막대, validateTextureScale의 입력·반환·경고 조건, MaterialTextureScaleAudit schema와 build·payload의 호출 경로까지 정해 검사자가 조건을 고르지 않는다.
@evidence principles/core/common.md#declared-basis raster·FOV는 review-apparatus, 검증 명령은 verification-boundary, 함수 계약은 engine과 interface 원본에서 받고 중성 조명값과 표본 선택 규칙은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 관찰 장치는 방과 외관의 원근 프레임만 정한다. 이 H2는 texture 반복·접합·scale을 격리해 반증하는 중성 장면과 native span 검사의 production wrapper를 더한다.
@evidence principles/design/materials.md#material-construction-appearance 중성 장면과 광도 값은 실측 조명 인증이 아니고 native span 검사는 등거리성·seam·pole·시각 합격을 인증하지 않는다고 나눠 렌더 파라미터 검사를 물리 검증으로 부풀리지 않는다.
@evidence principles/design/materials.md#material-binding-interface 각 접합의 부재 ID와 표면 정상 방향을 기록하고 실제 scale이 반영된 primary UV를 가진 variant만 native 입력으로 보내는 호환 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address grain 늘어남·뒤집힌 face·이중 tint·타일 경계·moiré·가짜 geometry 읽힘을 실패로 정하고, 측정하지 못한 축과 world-space 길이 대조는 unverified로 남긴다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work review-apparatus의 1600×1000·DPR1·FOV50, verification-boundary의 npm run lint와 GPU 경로, envelope-corners·door-interface·single-stair의 접합 부재를 대조했다. 표본에 필요한 부재와 장치 조건이 모두 있었다.
@evidence settings/004-observation.md#review-apparatus 1600×1000 CSS pixel·DPR1·FOV50의 관찰 raster를 중성 표본에도 같은 조건으로 쓴다.
@evidence settings/001-production.md#verification-boundary README의 npm run lint를 source·evidence 검사로만 두고, 별도 CLI나 우회 설정 없이 측정하지 못한 geometry 결과를 unverified로 보고한다.
@evidence spaces/003-surface-ownership.md#envelope-corners front/right 외부 모서리의 대각 miter prism을 석재 접합 표본의 부재로 쓴다.
-->

모든 새 texture family에서 현재 적용 면의 최소/최대 크기 및 각 UV 방향을 하나씩 선택한다. 기준은 실제 native 면적·extent이며 동률은 ID 사전순이다. 같은 source geometry를 1m, 3m, 12m 거리에서 정면, 접선과 30°를 이루는 사선으로 본다. 좁은 실제 방에서는 카메라가 자기 공간을 벗어나지 않는 최대 거리까지만 찍고 불가능한 거리와 이유를 남긴다. 나머지 거리 표본은 검사 전용 격리 장면에서 같은 모델/마감/배치를 사용하며 실제 방 검사를 대체하지 않는다.

중성 검사에는 sRGB #808080 배경, D65에 가까운 흰 hemisphere intensity=1, 흰 directional intensity=2를 local 표면 법선에서 45° 위치에 둔다. tone mapping은 기존 viewer와 같고 exposure=1, 1600×1000/DPR1, 동일 camera FOV50으로 고정한다. 1m의 단색 기준 막대를 검사 모드에만 두고 texture 주기와 함께 촬영한다. production beauty의 기존 illumination/PMREM은 바꾸지 않는다. 광도 단위와 이 장면은 실측 조명 인증이 아니다.

필수 접합은 front/right 모서리, 네 입면 floor-band의 위아래와 frame 바깥선의 띠 끝, 띠 끝을 가로지르는 `front-face-stone-panels:1-4-0`·`rear-face-stone-panels:2-3-0`의 panel 안 도장 경계, slab 외곽이 외장 평면에 나오지 않는지, 공용부 전면벽 두 junction 도장 면과 욕실 동측 tile 벽 junction 면(`upper-bathroom/corner-1`에서 보이는 x=-3.02, z=2.40..2.58의 -X면), 계단 구멍 slab 절단면과 ceiling의 이음, door leaf/jamb/head, 첫 계단/꺾임참/마지막 단, oak/tile 문턱, worktop/edge/sink, sofa의 평면/곡면 seam, 각 texture의 두 반복 주기 경계다. 각 접합의 부재 ID와 표면 정상 방향을 기록한다. grain 늘어남, 뒤집힌 face, 이중 tint, 눈에 띄는 타일 경계, moiré와 가짜 geometry 읽힘이 실패다.

native 함수는 `import { validateTextureScale } from "@automovie/engine"`으로 사용한다. [구현 모듈](../../../../packages/engine/src/validation/validateTextureScale.ts)은 [validation index](../../../../packages/engine/src/validation/index.ts)와 [engine root index](../../../../packages/engine/src/index.ts)에서 공개된다. `@automovie/engine/validation`이나 저장소 내부 파일을 import하는 계약이 아니다. 입력은 `{ models: readonly IAutoMovieModel[] }`, 반환은 `IAutoMovieValidation`이며 두 타입 모두 `@automovie/interface`의 root export다. 입력에는 `buildHouse()`가 만든 현재 `environment.models`를 원래 순서대로 준다. texture를 받는 variant에는 이미 실제 scale을 반영한 primary UV가 있어야 한다. 이 함수는 모델이나 UV를 수정하지 않고 placement/part transform·tessellation·이미지 파일을 읽거나 수행하지 않는다.

[IAutoMovieValidation](../../../../packages/interface/src/validation/IAutoMovieValidation.ts)의 반환은 `{ success: true; warnings?: IAutoMovieConstraintViolation[] }` 또는 `{ success: false; violations: IAutoMovieConstraintViolation[] }`다. 성공의 warnings는 발생했을 때만 존재한다. 실패의 violations에는 error와 warning이 함께 남는다. 각 [IAutoMovieConstraintViolation](../../../../packages/interface/src/validation/IAutoMovieConstraintViolation.ts)은 `kind`, `severity: "error" | "warning"`, `path`, `expected`, `value` 및 선택적 `overshoot`, `node`를 가진다. 이 함수의 path는 `$input.models[i].parts[j].material.<slot>.<u|v>`이며 입력 순서와 model/part ID를 함께 기록해 위치를 해석한다. 별도의 `errors`, `findings`, `checkableCount` 필드나 출력 파일을 반환한다고 가정하지 않는다.

함수는 mesh의 유한하고 양수인 U/V span을 측정한다. structured texture binding의 `coordinateSource: "normalized"`가 span > 1 + 1e-9이면 `kind: "type"`, severity error를 반환한다. `surface-metres`에서는 유한한 0 아닌 transform scale을 가진 축의 tile=1/abs(scale)이 span×(1+1e-9)보다 크면 `kind: "range"`, severity warning이다. 해당 축의 sampler가 clamp이면 이 tile 경고는 내지 않는다. primitive, UV 부재·비유한/퇴화 span, material 부재/미해결, string binding, 생략된 coordinateSource, `source-uv`는 이 측정으로 검증되지 않는다. surface-metres 축에 scale이 없거나 0/비유한이어도 검사하지 않으므로 별도 binding 검사의 오류를 성공으로 바꾸지 않는다. 이 native 오류·경고의 severity와 원문은 보존하고 warning만 있다는 이유로 실패나 시각 합격을 만들지 않는다.

materialSources에서 구현할 production 호출 owner는 `src/materials/observation.ts`의 `auditMaterialTextureScale`이며, 위 engine 함수와 interface 타입을 package root에서 import한다. 입력은 `{ models: readonly IAutoMovieModel[] }`이고 반환 형식은 아래 `MaterialTextureScaleAudit`다. 이 wrapper는 동일 models를 native 함수에 한 번 전달하고 결과를 그대로 `validation`에 담는다. native가 반환하지 않는 검사 범위만 별도로 집계하며 측정값을 대체하지 않는다.

```typescript
type MaterialTextureScaleAudit = {
  validation: IAutoMovieValidation;
  models: number;
  parts: number;
  partsWithoutTexture: number;
  axes: {
    path: string;
    model: string;
    part: string;
    slot: "baseColorTexture" | "metallicRoughnessTexture" |
      "normalTexture" | "occlusionTexture" | "emissiveTexture";
    axis: "u" | "v";
    status: "checked" | "clamped" | "unverified";
    reason: string;
  }[];
};
```

axes는 입력 model/part 순서, schema에 적은 slot 순서, u/v 순서로 모든 존재하는 texture binding을 열거한다. null/undefined slot은 binding 수에서 빼되, texture가 없는 part는 `partsWithoutTexture`에 센다. material이 null/미해결이면 해당 part도 그 수에 포함하고 material 문제는 [바인딩 검사](#binding-census)에 남긴다. `checked`는 위 native 비교가 실행 가능한 축, `clamped`는 surface-metres에서 유효한 scale과 span이 있지만 clamp로 tile 비교를 생략한 축, 나머지는 `unverified`다. reason은 `normalized-span`, `surface-metres-tile`, `clamp-fit`, `primitive`, `missing-uv`, `invalid-or-degenerate-uv`, `string-binding`, `missing-coordinate-source`, `source-uv`, `invalid-or-missing-scale` 중 실제 첫 조건 하나다. 미검사 사유의 우선순위는 geometry → UV → binding 형식 → coordinateSource → scale → clamp다. 조건별 수는 axes에서 집계하고 checkable 수는 `checked` 수다. 입력 model/part가 0이거나 checkable 수가 0인 결과를 전체 검사 통과로 읽지 않는다. clamped 면의 fit과 무texture 면은 각각 접합/광택 관찰 대상에 남는다.

[src/house/build.ts](../../src/house/build.ts)는 모든 표면 owner의 모델 생성과 기존 house/canopy audit 뒤 이 wrapper를 호출한다. 반환 environment의 모델 배열과 검사 입력은 같아야 한다. 기존 canopy report 인자는 유지하고 세 번째 선택적 `materialReport: (audit: MaterialTextureScaleAudit) => void` callback으로 이 결과를 전달하도록 구현한다. callback 유무와 관계없이 검사는 실행하며, callback에 원본 결과를 전달한 뒤 native success=false이면 모든 violation의 path/expected를 message에 담은 `Error`를 던지고 원본 audit를 cause에 보존한다. 예기치 않은 API 예외도 성공으로 치환하지 않는다. [src/viewer/payload.ts](../../src/viewer/payload.ts)는 wrapper를 별도로 재실행하지 않고 같은 build 호출의 callback 결과를 `materialTextureScaleAudit` 필드로 전달한다. 따라서 library의 `citizenHouseSpaceSource`도 같은 검사를 실행한다. 이 schema·callback·파일은 아직 source에 없다.

원본 unit mesh와 실제 scale의 차이는 별도 world-space U/V 길이 대조로 확인한다. native span 검사는 실제 길이의 등거리성·UV seam·곡면 pole·재료 시각 합격을 인증하지 않으며 그 결과는 위 거리/접합 표본과 함께 읽는다. README의 `npm run lint`는 canonical source/evidence 검사이며 이 정적 명령이 geometry 측정까지 실행했다고 주장하지 않는다. 별도 대체 CLI나 우회 설정을 만들지 않고 실제 producer의 해당 측정을 실행·읽지 못하면 unverified로 보고한다.

## 집 전체와 레퍼런스 {#reference-material-samples}

<!--
@evidence principles/core/common.md#scope-preservation 현재 topology에서 파생된 전체 관찰 집합과 실패 위치를 그대로 두고 재료가 바뀌지 않은 방도 분모에서 빼지 않으며, 다섯 reference별 재료 질문과 캐노피 회귀 표본을 더한다.
@evidence principles/core/common.md#substantive-completion 다섯 reference 각각이 묻는 재료(석재·frame·floor-band·유리·PV, 바닥·침구·습식, oak·직물·cabinet·worktop·금속, felt·desk·접이식 전면, 문 결·floor·유리 반사)와 GPU 기록 항목을 정해 관찰자가 무엇을 볼지 고르지 않는다.
@evidence principles/core/common.md#declared-basis 관찰 분모는 delivery-review-condition과 spatial-observation, GPU 경로와 RENDERER 기록은 review-apparatus에서 받고, reference별 재료 질문은 이 층의 선택이며 사진 픽셀로 roughness나 치수를 역산하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 공간 관찰 분모와 다섯 reference의 공간 질문만 준다. 이 H2는 같은 분모에 재료 읽힘의 질문을 얹고 기존 GPU 캡처와 나란히 비교하는 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance reference 사진에서 광학 파라미터를 역산하지 않고 단순한 가구·장비 형상, 얕은 frame, louver와 조경 밀도를 재료로 지운 결함으로 세지 않아 외관 판단과 형상 사실을 섞지 않는다.
@evidence principles/design/materials.md#material-binding-interface reference02의 절개는 검사 수단일 뿐 전달 프레임이 아니며, 각 표본이 실제 compiled 표면의 재료를 보도록 관찰 위치를 공간 분모에서 받는다.
@evidence principles/design/materials.md#material-verification-address Playwright channel=chromium/WebGL2와 RENDERER·sourceBasis·에러 배너 기록을 요구하고, 소프트웨어 rasterizer나 이전 판정의 renderer를 새 실행 값으로 쓰지 않으며 자료가 없으면 unverified로 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work delivery-review-condition의 관찰 분모와 종료 조건, spatial-observation의 외부·실내 관찰 도출과 L자 실패 위치, review-apparatus의 GPU 기록 조건을 대조했다. 재료 질문을 얹을 분모와 장치가 부모에 모두 있었다.
@evidence settings/001-production.md#delivery-review-condition 컴파일된 topology가 관찰 분모이고 다섯 reference는 추가 질문이라는 종료 조건을 재료 관찰에도 그대로 쓴다.
@evidence settings/004-observation.md#review-apparatus Playwright channel chromium의 WebGL canvas와 실제 RENDERER·URL·관찰 id·source 기준 기록을 재료 표본의 GPU 조건으로 받는다.
@evidence spaces/001-citizen-house.md#spatial-observation boundary.face·opening.profile·cell에서 도출한 외부·실내 관찰 id와 실패 id를 재료 관찰의 분모로 그대로 쓴다.
-->

현재 compiled topology에서 파생된 관찰 집합 전부를 유지한다. exterior setting 하나, 모든 노출 입면/모서리/지붕/하부와 개구·출입구, 모든 공간의 threshold·네 안쪽 모서리·중심에서 네 방위를 자기 공간 안에서 본다. failure/null 위치는 삭제하지 않는다. material이 바뀌지 않은 방도 반사·주변색의 영향을 받으므로 관찰 분모에서 빼지 않는다. 현재 canopy top/soffit·배수 접합 표본도 유지한다.

추가 다섯 장면은 reference01 외관의 석재/짙은 frame/floor-band/유리/PV, 02 절개의 바닥/침구/습식면 구분, 03 공용부의 oak floor/식탁/직물/초록 cabinet/밝은 worktop/금속, 04 flex의 felt/desk/직물/접이식 전면, 05 상층의 door/jamb 세로결/floor/유리 반사다. reference02의 절개는 검사 수단이며 전달 프레임이 아니다. ref01·03·05는 기존 GPU 캡처와 나란히 비교해 같은 재료로 읽히는지 명시한다. 사진의 픽셀로 roughness나 치수를 역산하지 않는다.

현재 한계인 단순한 furniture/장비 형상, 얕은 frame, 향후 louver와 landscape 밀도를 별도 미완료로 남긴다. 이 항목은 재료만으로 그 결함을 지우는 판정이 아니다. 실제 GPU는 viewer-verification이 정한 Playwright channel=chromium/WebGL2 경로로 확인하고 RENDERER·현재 sourceBasis·에러 배너/페이지 오류를 기록한다. 소프트웨어 rasterizer 결과나 이전 판정의 renderer를 새 실행의 값으로 쓰지 않는다. 자료가 없으면 unverified다.

## 상태별 재료 {#material-state-samples}

<!--
@evidence principles/core/common.md#scope-preservation privacy 세 상태와 flex 두 상태의 여섯 조합, 문 closed/open을 같은 producer에 주고 상태가 바꾼 부재·재료의 영향 면을 모두 추가 관찰하며 두 상태가 같다는 사실도 기록해 상태별 재료의 약속을 빠짐없이 묻는다.
@evidence principles/core/common.md#substantive-completion 조합 수, 기본 day/work에서 완주할 전체 관찰, 상태가 바꾼 면만 추가하는 규칙, 반례 표본(frame 유지·유리 band·screen 범위·guest bed 직물·painted panel)을 정해 관찰자가 상태 표본을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 상태 선택은 operator-access, 유리 상태 의미는 privacy-states, 침대 상태는 flex-states, 문 상태는 기존 opening operation에서 받고 추가 관찰 규칙은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 선택할 수 있는 상태와 그 공간 의미만 준다. 이 H2는 상태 변화가 재료 census와 관찰 면에 미치는 차이를 같은 producer로 비교하는 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 낮아진 transmission은 렌더 근사이며 실물 시선 차단·에너지·광학 성능 측정이 아니라고 나눠 상태 외관을 성능으로 읽지 않는다.
@evidence principles/design/materials.md#material-binding-interface 새 프라이버시 상태·동작 경로·차양 geometry를 이 검사에서 발명하지 않고 기존 상태가 만든 실제 부재에만 결합한 재료를 비교한다.
@evidence principles/design/materials.md#material-verification-address 같은 문턱에서 문 grain과 hardware의 움직임, 같은 opening의 유리 band와 screen 범위, guest bed의 linen·white·green 직물과 painted panel의 배정을 상태 쌍으로 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work operator-access의 privacy·flex 선택, privacy-states의 60%·100% drop과 tint, flex-states의 두 정지 형상, 기존 문 closed/open operation을 대조했다. 상태 입력이 모두 부모에 있어 수리가 필요 없었다.
@evidence settings/004-observation.md#operator-access 뷰어가 허용하는 privacy 세 상태와 flex 두 상태를 같은 producer의 명시 입력으로 조합한다.
@evidence settings/003-spatial-basis.md#privacy-states 낮·사적·야간의 tint·고정 반투명 층·shade drop이 서로 다른 속성이라는 결정을 상태별 유리·screen 표본으로 나눠 본다.
@evidence settings/002-household.md#flex-states 작업 상태의 닫힌 painted panel과 손님 상태의 내려온 침대 직물을 같은 작업실 관찰에서 대조한다.
-->

현재 명시 상태 privacy=day/private/night와 flex=work/guest의 6개 조합을 동일 source producer에 준다. 이 상태들이 만드는 실제 부재 및 바인딩 census를 비교하고 유리·screen·folding bed가 영향을 받는 모든 opening/room 관찰을 반복한다. 나머지 집 전체 관찰은 기본 day/work에서 완주하고, 다른 상태가 바꾼 부재·재료의 영향 면은 빠짐없이 추가한다. 동일한 두 상태도 동일하다는 사실을 기록한다.

door closed/open은 실제 기존 operation에 적용하여 문 grain과 hardware의 움직임을 같은 문턱에서 대조한다. 프레임 유지, 유리의 transparent/frosted band, screen의 내려온 범위, guest bed의 linen mattress·흰 pillow·green duvet 직물과 painted panel 배정이 반례 표본이다. 새 프라이버시 상태·동작 경로·차양 geometry를 이 검사에서 발명하지 않는다. 낮아진 transmission은 렌더 근사이며 실물 시선 차단·에너지·광학 성능의 측정은 unverified다.
