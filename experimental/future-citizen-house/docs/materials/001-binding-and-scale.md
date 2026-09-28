# 재료 전달과 표면 좌표

## 전달 범위 {#material-delivery}

<!--
@evidence principles/core/common.md#scope-preservation 재료 층의 몫을 질감·반사로 한정하고 새 창호 단면·차양은 spaces, 물체 외형은 models, 식재 이동은 해당 배치 owner로 돌려 형상 결손을 재료 채널로 덮지 않는다.
@evidenceReview principles/core/common.md#scope-preservation  본문은 새 창호나 물체 외형을 재료의 성과로 세지 않고 finish 응답으로 범위를 닫는다. 따라서 외피의 빈 형상을 칠로 감추는 누락은 이 H2의 통과로 오인하지 않는다.
@evidence principles/core/common.md#substantive-completion 사용하는 native 값(baseColor 색과 primary UV의 baseColorTexture, scalar roughness·metallic·opacity·transmission·ior·thickness·clearcoat, emissive 색, alphaMode·alphaCutoff·doubleSided)과 쓰지 않는 채널(normal·metallicRoughness·occlusion·emissive texture, displacement, 새 shader·후처리 치환)을 이름으로 가르고, roughness는 모든 마감이 명시하며 나머지 미명시 값의 기본값을 적어 구현이 채널이나 기본값을 새로 고를 일이 없다.
@evidenceReview principles/core/common.md#substantive-completion  본문 35·37의 지원 채널과 기본값을 함께 보면 미지정 roughness나 새 normal texture를 구현자가 선택할 여지가 없다. 실제 표면 결합은 아직 다음 source 층의 일이다.
@evidence principles/core/common.md#declared-basis 채널 한계는 README의 현재 재료 전달 범위와 scene.mjs·payload.ts의 현재 경로에서, 표면 소유는 whole-surface-owners와 surface-decomposition에서, 길이 단위 m는 coordinate-datum에서 받고, sRGB 표기·기본값·수치는 이 층의 저작 선택이며 레퍼런스 픽셀 측정이나 실물 인증이 아니라고 구분한다.
@evidenceReview principles/core/common.md#declared-basis  본문은 현재 uploader 경로와 표면 분해를 근거로 들고, 색 표기와 기본값을 재료 저작 선택이라고 분리한다. 사진에서 측정한 수치라는 근거를 주장하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation whole-surface-owners는 완결 외피 면의 owner를, surface-decomposition은 건축 면과 물체 face의 분리를, envelope-and-privacy와 production-visual-grammar는 밝은 석재·어두운 frame·목재 floor의 색 관계를 준다. 이 H2는 그 입력을 실제 렌더 채널·응답 기본값·명목 두께와 렌더 thickness의 구분·미해결 주소 실패로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  whole-surface-owners가 제공하는 면과 surface-decomposition의 물체 경계를 받아 이 H2가 실패 주소와 렌더 기본값을 추가한다. 어느 부모도 이 native 채널 목록을 정하지 않았다.
@evidence principles/design/materials.md#material-construction-appearance 렌더 thickness=0이 두께 없는 물체라는 뜻이 아니라고 적고 부재 두께는 spaces geometry, 도장·베니어의 명목 두께는 각 마감 H2, 광학 값은 렌더 근사로 나눈다. 색상 입자로 섬유 요철이나 석재 돌출을 만들었다고 하지 않는 경계도 둔다.
@evidenceReview principles/design/materials.md#material-construction-appearance  37의 thickness=0은 광학 기본값이고 실제 패널 두께가 아니라는 설명이 있다. 이 구분 덕분에 색상 grain을 물리 요철이나 구조층으로 읽는 오류를 막는다.
@evidence principles/design/materials.md#material-binding-interface 재료는 완결 owner의 기존 표면에만 결합하고 새 형상을 만들지 않으며, owner·표면·재료·좌표 중 하나라도 풀리지 않으면 plaster fallback 대신 그 주소로 실패한다고 정해 host geometry 소유를 넘겨받지 않는다.
@evidenceReview principles/design/materials.md#material-binding-interface  39의 미해결 주소 Error는 재료 이름을 plaster로 바꾸는 기존 fallback을 거부한다. 면 생성은 계속 원래 space/model owner의 책임이다.
@evidence principles/design/materials.md#material-verification-address native 재료·texture 자원·현재 모델·uploader가 같은 값을 소비하는지를 binding-census가 반증하도록 연결하고, 방 안 정확한 거울상은 unverified로 남긴다.
@evidenceReview principles/design/materials.md#material-verification-address  binding-census는 등록된 native 재료와 texture 소비를 대조할 주소이며 정확한 방 안 거울상은 검증 결과로 세지 않는다. 두 주장 모두 본문 35·39에서 제한된다.
@evidence upstream/design/materials.md#parent-revision-from-material-work 이 재료 설계가 부모의 물체 owner 충돌을 드러냈다. settings/003#surface-decomposition에서 건축 표면과 model prototype·instance 배치를 분리하고 임시 방 source 퇴역을 선언했다. 기존 채널 제한과 fallback 금지는 이 층의 선택으로 남긴다.
@evidenceReview upstream/design/materials.md#parent-revision-from-material-work  본문 33의 건축 면·물체 face·배치 경계는 부모 surface-decomposition을 실제 수정한 내용에 대응한다. 별도 채널 선택은 부모 수정이 아니라 이 재료 H2에 남는다.
@evidence settings/001-production.md#delivery-fidelity 실물 사진의 미세 질감이 아닌 blocking pass라는 경계를 scalar 응답과 색상 texture만 쓰는 채널 선택으로 옮기고, 재료 이름이나 색 패치로 빠진 부재를 대신하지 않는다.
@evidenceReview settings/001-production.md#delivery-fidelity  실물 인증을 포기한 범위가 scalar 응답과 색상 이미지 사용에 나타난다. 빠진 창호 부재를 색으로 만들어냈다는 결과를 이 H2는 주장하지 않는다.
@evidence settings/001-production.md#build-or-adopt production 내부 WebGL 도구와 공개 engine API라는 채택 범위 안에서 새 shader·channel·후처리 서비스 없이 기존 uploader가 받는 값만 설계한다.
@evidenceReview settings/001-production.md#build-or-adopt  35의 native 재료 속성은 현행 viewer 전달 경로에 있는 것들이다. 별도 shader나 후처리 입력을 요구하지 않아 production 내부 채택 범위를 지킨다.
@evidence settings/001-production.md#runtime-and-restart 단계의 순방향 유지와 변경 뒤 재검증 조건을 받아, 재료 설계의 관계 검사를 닫은 다음 materialSources 구현을 시작한다. 2026-09-28 사용자의 후속 지시에 따라 그 판정은 저작자가 직접 수행한다.
@evidenceReview settings/001-production.md#runtime-and-restart  본문 39가 설계 검토 뒤 source 구현이라는 순서를 명시한다. 최신 사용자 지시로 판정 주체만 저작자로 바뀌었으며 순방향 stage와 재검증 조건은 유지된다.
@evidence settings/003-spatial-basis.md#surface-decomposition 입면·방·층은 건축 표면, models는 물체 part/face, instances는 그 배치를 소유한다는 개정 경계를 재료 결합 주소의 적용 범위로 삼는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  33의 면 주소는 입면·방·층과 물체 part를 구별하고 배치를 재료가 소유하지 않는다. surface-decomposition의 수정된 경계가 결합 범위를 제한한다.
@evidence spaces/003-surface-ownership.md#whole-surface-owners 다섯 외피 면의 단독 owner가 return·개구·틀·마감을 모두 소유한다는 결정을 받아 재료가 외피를 사후 칠하기 owner로 나누지 않는다.
@evidenceReview spaces/003-surface-ownership.md#whole-surface-owners  33은 외피를 사후 paint owner로 쪼개지 않고 완결된 공간 면을 입력으로 받는다. 한 모서리의 형상 결정은 여전히 해당 입면 owner에 있다.
@evidence settings/003-spatial-basis.md#coordinate-datum m와 Y-up·후면 +Z를 재료 두께 및 후속 표면 좌표의 단위·축으로 받되 이 H2에서 새 공간 좌표를 만들지 않는다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum  37에서 m·Y-up·+Z를 값의 단위와 축으로 쓰되 이 H2는 방의 새 위치를 만들지 않는다. 좌표 기준을 광학 값의 실제 치수와 구분해 적용한다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy 밝은 석재 불투명 면·어두운 금속 frame·연속 목재 floor라는 재료 언어를 각 마감 H2의 입력으로 받는다.
@evidenceReview settings/003-spatial-basis.md#envelope-and-privacy  33은 석재 불투명 면, 금속 틀, 목재 바닥의 역할만 상속한다. 각 finish의 색·roughness 수치는 뒤의 마감 H2가 소유한다.
@evidence settings/001-production.md#production-visual-grammar 흰 면을 색으로 데워 조명을 흉내 내지 않는 시각 문법을 채널과 기준색 선택의 한계로 받는다.
@evidenceReview settings/001-production.md#production-visual-grammar  37은 흰 마감의 기준색을 조명 효과로 조정하지 않고 응답 기본값으로 한정한다. 색으로 납품 장면의 조명을 흉내 내는 경로가 없다.
@evidenceExclude settings/001-production.md#roles-and-accessibility 관찰 결과와 생산세계의 물리적 접근성은 서로 다른 대상임을 검토했다. 이 H2의 채널·기본값·주소 오류 규칙은 관찰자 역할이나 운영자 UI를 구현하지 않는다. 한국어 서술과 안정 finish id의 일관성은 재료 공통 account의 production-language가 답한다.
@evidenceExcludeReview settings/001-production.md#roles-and-accessibility  본문의 채널 계약은 관찰 결과와 UI 접근성의 역할을 정의하지 않는다. 한국어 설명과 ID 조건은 공통 account가 맡으므로 이 H2의 제외 범위가 실제로 비어 있다.
@evidenceExclude settings/001-production.md#settings-coverage-map 개정된 설정 지도는 건축 치수·문·입면을 spaces, 물체 형상을 models, 배치를 instances로 넘긴다. 이 H2는 그 색인을 직접 소비하지 않고 시각 문법·표면 분해·외피와 개구부·좌표 기준 H2를 각각 읽는다.
@evidenceExcludeReview settings/001-production.md#settings-coverage-map  설정 지도 전체를 재료 좌표로 바꾸지 않고 33에서 직접 필요한 표면·외피·시각 문법 target을 따른다. 상속 목록을 빠뜨린 것을 색인 인용으로 숨기지 않는다.
@evidenceExclude settings/002-household.md#household-program 거주자를 인물 asset이 아닌 사용 배경으로 두는 결정을 검토했다. 이 H2는 사물과 건물 표면의 재료 채널만 정하므로 거주자나 공동생활 밀도를 표면 무늬로 생성하지 않는다. 가구·설비별 마감은 해당 재료 H2에서 인용한다.
@evidenceExcludeReview settings/002-household.md#household-program  거주자 밀도는 물체 표면의 grain seed가 아니다. 33은 인물 asset을 만들지 않고 건물과 사물의 finish만 입력으로 삼는다.
@evidenceExclude settings/002-household.md#design-subject-conditions 지름 0.60m·높이 1.80m 가상 통행 원통과 인체 사용성 범위 밖 목록을 검토했다. 재료는 형상·배치·문 상태를 바꾸지 않아 원통 검사의 입력을 소비하거나 변경하지 않으며, 미끄럼·안전 성능을 주장하지 않는다는 한계는 각 마감 H2에 따로 있다.
@evidenceExcludeReview settings/002-household.md#design-subject-conditions  통행 원통의 지름과 높이를 재료 채널로 재현하지 않는다. 미끄럼 안전 등 물성 인증도 37의 렌더 기본값에서 도출되지 않는다.
@evidenceExclude settings/003-spatial-basis.md#ground-graph 1층의 현관·계단·공용부·작업실·코어 연결 그래프를 검토했다. 재료는 연결을 더하거나 빼지 않고 문턱 마감 경계는 개별 문과 방 H2를 인용하므로 그래프 자체를 입력으로 쓰는 재료 결정이 없다.
@evidenceExcludeReview settings/003-spatial-basis.md#ground-graph  현관에서 공용부까지의 연결은 벽과 문의 topology로 남는다. 이 H2는 그 edge 수를 바꾸지 않고 실제 개별 면만 후속 결합 대상으로 둔다.
@evidenceExclude settings/003-spatial-basis.md#upper-graph 계단참에서 시작하는 일자 복도와 여섯 방의 직접 문 연결을 검토했다. 상층 마감은 각 방·문·벽 H2의 실제 면에 결합하고 복도 그래프의 분기 금지나 연결 수를 읽지 않는다.
@evidenceExcludeReview settings/003-spatial-basis.md#upper-graph  복도에서 여섯 방으로 나뉘는 상층 그래프는 finish 기본값의 입력이 아니다. 실내 면은 방 owner가 생성한 주소를 통해서만 받는다.
@evidenceExclude settings/004-observation.md#accessibility-products 텍스트 id 목록·키보드 조작·글자 상태 표시와 자막·전사 없음의 분류를 검토했다. 재료 상태 표본은 privacy·flex 선택을 소비할 뿐 텍스트 목록이나 조작 요소를 바꾸지 않고, 유리 색만으로 상태를 알리는 새 UI를 만들지 않는다.
@evidenceExcludeReview settings/004-observation.md#accessibility-products  privacy·flex는 재료 상태가 취할 입력이나 키보드 UI의 구현은 아니다. 33·35의 마감 채널로 접근성 산출물을 대체하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#ground-partition 1층 다섯 방의 clear cell 분할과 cell 사이 gap을 shared wall로만 쓰는 원칙을 검토했다. 재료는 각 방·벽·문 H2의 실제 면을 인용하고, 분할 원칙 자체는 마감의 좌표·배정·응답 어느 것에도 쓰이지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#ground-partition  1층 cell 사이 공용벽은 공간 소유이며 33의 재료 범위는 생성된 벽 면 뒤에서 시작한다. cell gap을 finish가 새로 나누지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#upper-partition 복도와 그 복도에서 직접 닿는 여섯 방으로 된 상층 분할과 L자 seam에 벽을 두지 않는 원칙을 검토했다. 재료는 개별 방·벽 H2의 면에 결합하며 분할 원칙이나 seam 무벽 규칙을 입력으로 읽지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#upper-partition  상층 L자 seam에 벽이 없다는 조건은 재료층이 변경할 수 없다. 이 H2는 방 표면의 finish를 정하지만 분할 자체를 읽지 않는다.
-->

이 설계는 사용자가 요청한 재료 질감·반사를 소유한다. [표면 분해](../settings/003-spatial-basis.md#surface-decomposition)에 따라 입면·방·층은 건축 면, models는 물체 part/face, instances는 배치를 맡는다. 재료 언어는 [외피와 개구부](../settings/003-spatial-basis.md#envelope-and-privacy)의 밝은 석재 계열 불투명 면·어두운 금속 frame·연속 목재 floor와 cabinetry, 색 관계는 [시각 문법](../settings/001-production.md#production-visual-grammar)에서 받는다. materials는 재사용 가능한 재료 응답과 좌표 조건을 제공한다. 새 창호 단면과 차양은 spaces, 가구 외형은 models, 식재 위치는 해당 배치 owner에 남긴다. 현재 방 source의 물체 메시와 마감 문자열은 이관 중 임시 소비이고 영구 결합 주소로 승인하지 않는다. 재료는 계측·판정 역할 분담, 방·층 그래프와 분할, 거주자 설정의 인물·생활 밀도, 접근성 산출물, 통행 원통 검사를 바꾸지 않고 개별 방·벽·문·창·입면 H2의 실제 면과 생활 프로그램을 소비한다. 검증 대상은 같은 집의 실제 표면이며 별도 샘플이 집을 대신하지 않는다.

[현재 전달 한계](../../README.md#현재-재료-전달-범위)와 `src/house/assembly.ts`, `src/viewer/payload.ts`, `src/viewer/scene.mjs`를 전제로 한다. native baseColor 색과 primary UV의 baseColorTexture, scalar roughness·metallic·opacity·transmission·ior·thickness·clearcoat, emissive 색, alphaMode·alphaCutoff·doubleSided만 사용한다. normalTexture, metallicRoughnessTexture, occlusionTexture, emissiveTexture, displacement, 새 shader와 후처리 재질 치환은 이번 설계에 없다. 색상 입자로 섬유 요철의 실제 그림자나 석재 돌출을 만들었다고 하지 않는다. 거울은 환경 반사의 근사이며 방 내부의 정확한 거울상은 unverified다.

이하 색은 sRGB `#RRGGBB`, 길이는 [좌표 기준](../settings/003-spatial-basis.md#coordinate-datum)의 m, roughness와 metallic은 무차원 렌더 값이다. roughness는 모든 마감 H2가 명시한다. 별도 명시가 없으면 metallic=0, opacity=1, alphaMode=opaque, doubleSided=false, transmission=0, emissive=null, thickness=0, clearcoat=0, ior=1.5다. alphaCutoff는 alphaMode=mask에서만 쓰며 미명시 0.5이고, baseColorTexture가 없는 마감은 texture 없이 색만 쓴다. 렌더 thickness=0은 물체의 두께가 없다는 뜻이 아니다. 부재 두께는 spaces의 기존 geometry, 표면 도장·베니어의 명목 두께는 각 마감 H2가 소유한다. 값은 저작 선택이며 레퍼런스 픽셀에서 잰 값이나 실물 인증값이 아니다.

미지정 재료 이름을 plaster로 대신하는 현재 fallback은 새 바인딩 경로에서 허용하지 않는다. owner·표면·재료·좌표가 해결되지 않으면 그 주소로 실패한다. [전달 검사](007-observation.md#binding-census)는 native 재료, texture 자원, 현재 모델과 uploader가 같은 값을 소비하는지 검사한다. 이 경로와 source는 materials가 review에 들어간 뒤 materialSources에서 구현한다.

## 표면 배정 인터페이스 {#surface-bindings}

<!--
@evidence principles/core/common.md#scope-preservation 재료 역할 주소는 건축 면과 model part/face에 결합하되 plan·벽 cut·opening·connector는 spaces, 물체 부재는 models, membership·transform은 instances에 남겨 재료 교체가 topology를 복제하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation  본문 89는 동일한 `oak` 또는 `white` 문자열이라도 나무 줄기·가구·베개·도기를 구별한다. 따라서 finish 교체가 opening이나 prototype 생성까지 가져가지 않는다.
@evidence principles/core/common.md#substantive-completion 재료 variant는 물체 형상·world bounds를 보존하고 instances가 공개 prototype 레코드의 세 필드와 explicit member 선택을 작성한다. 이 H2는 두 owner의 결합 순서와 검증 주소를 정해 variant 선택을 materialSources가 중복 소유하지 않게 한다.
@evidenceReview principles/core/common.md#substantive-completion  91·95는 material variant의 형상과 bounds를 유지하면서 instance가 명시적으로 선택하게 한다. `default` 충돌과 미등록 recipe의 실패 지점까지 적혀 있어 단계 사이 소유가 비지 않는다.
@evidence principles/core/common.md#declared-basis IAutoMovieInstancePrototypeDesign·IAutoMovieExplicitInstanceTransform과 materializeCompiledInstanceSet·instanceSlot의 계약과 id의 비공백·set 내 유일 조건은 interface·engine 원본 링크에서, `default`는 engine이 기본 modelRecipe에 부여하는 id에서, palette의 절대 sRGB 해석은 engine과 viewer의 기존 선형색 보정식에서 받고, weight=1 고정과 작성 경계의 Error 거부는 이 층의 선택으로 구분한다.
@evidenceReview principles/core/common.md#declared-basis  93·97의 공개 레코드와 compile 함수는 구현 입력이고, weight=1과 오류 거부는 저작 규칙으로 구분된다. type 자체에 없는 런타임 검사를 type의 기능으로 돌리지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-decomposition은 건축 면·model part/face·instance 배치를, whole-surface-owners는 외피 면의 단독 owner를 정한다. 이 H2는 그 주소에 역할별 마감 ID·결 축·동일 형상 metric UV variant를 결합하고 instance의 명시적 선택과 기준색 palette 전달을 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  부모가 주는 건축·물체 주소 위에 103 이후 표가 상태별 finish를 붙이고 91이 variant 선택을 정의한다. 그 마감과 metric UV 결정은 부모의 공간 형상을 반복하지 않는다.
@evidence principles/design/materials.md#material-construction-appearance variant는 형상·transform·member ID·world bounds를 보존하고 UV와 마감만 다르다고 정해 외관 교체가 부재 크기나 배치라는 구조 사실을 바꾸지 않으며, palette 절대색을 viewer 보정식으로 이중 tint하지 않는다.
@evidenceReview principles/design/materials.md#material-construction-appearance  91의 variant는 같은 형상과 world bounds를 전제로 한다. 99의 절대 palette에 viewer tint를 다시 곱하지 않아 재료 차이가 위치 변경으로 번지지 않는다.
@evidence principles/design/materials.md#material-binding-interface 건축 면은 공간 owner와 element/face, 물체는 model prototype part/face와 instance id로 주소를 나눠 흰 pillow 직물·흰 basin rim 도기와 나무 줄기·가구 목재의 반례를 구별한다. variant의 prototypeBounds와 world bounds 일치를 호환 조건으로 둔다.
@evidenceReview principles/design/materials.md#material-binding-interface  침구의 white와 세면대 rim의 white를 다른 면 역할로 가른 89가 주소의 의미를 밝힌다. 95의 잘못된 variant ID는 다른 부품으로 대체되지 않는다.
@evidence principles/design/materials.md#material-verification-address explicit prototype으로 고른 variant가 모델별 부재 선택·동일 world bounds·member 정체성·기존 topology 참조를 유지했는지와, 없는 prototype의 native Error를 기본 모델이나 빈 population으로 바꾸지 않았는지를 binding-census가 반증하도록 연결한다.
@evidenceReview principles/design/materials.md#material-verification-address  101이 모델 부품, member 정체, bounds, topology 참조를 검사 대상으로 모은다. 실패한 explicit prototype은 97의 native Error 그대로라 조용한 기본값 성공을 막는다.
@evidence upstream/design/materials.md#parent-revision-from-material-work surface-decomposition의 portal binding과 Assembly.repeat의 set/member 구조를 대조하며 재료 variant 선택의 형상·배치 owner 충돌을 찾았다. settings/003#surface-decomposition에서 model part와 instance 선택을 분리했고 이 H2도 materialSources가 member transform을 쓰지 않게 수리했다.
@evidenceReview upstream/design/materials.md#parent-revision-from-material-work  89·91은 초기 임시 방 메시의 색 문자열을 영구 결합 주소로 인정하지 않는다. 부모 surface-decomposition에 물체 part와 instance 선택이 분리된 뒤 이 H2가 소비 경계를 적었다.
@evidence settings/001-production.md#module-boundary CommonJS engine의 lowerBuiltEnvironment·materializeCompiledInstanceSet·instanceSlot을 서버 쪽 payload.ts에서만 호출하고 브라우저 client는 engine을 import하지 않은 채 server가 보낸 JSON payload를 소비하는 현재 경계를 variant 소비 경로로 그대로 쓰며, variant는 그 호출에 explicit prototype만 더한다.
@evidenceReview settings/001-production.md#module-boundary  97은 compiler 호출을 서버 payload 경로에 놓고 브라우저가 JSON만 받는다고 적는다. variant 선택 때문에 CommonJS engine을 browser client로 옮길 이유가 생기지 않는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 건축·물체 생성 owner는 안정된 양면 주소와 seam을 제공하고 materials가 주소별 finish 결합을 결정한다. 상대 owner는 자기 면의 요구만 넘긴다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  89의 양면 주소는 건축과 물체의 생성 owner가 먼저 제공한다. 재료는 그 주소에 결 축과 응답을 결합할 뿐 part나 transform을 쓰지 않는다.
@evidence spaces/003-surface-ownership.md#whole-surface-owners 입면 owner는 창호·shade와 노출 마감 면의 안정 주소를 제공하고 materials가 그 주소의 finish 결합을 결정한다. 입면이 자체 저작하는 건축 모듈 반복과 독립 물체의 instanceSources population은 구분한다.
@evidenceReview spaces/003-surface-ownership.md#whole-surface-owners  95는 외피가 완결 면 주소를 유지하고 재료가 finish를 공급하는 순서를 둔다. 입면 자체의 반복과 독립 물체 population을 한 owner로 합치지 않는다.
@evidence models/000-representation.md#model-address-and-scale 물체의 prototype/part/face 주소와 숨은 접촉면까지 닫는 규칙을 받아 finish 결합은 생성 owner의 면을 참조하고 새 부품을 만들지 않는다.
@evidenceReview models/000-representation.md#model-address-and-scale  89와 103의 결합 표는 model prototype의 노출 face에만 재료 ID를 붙인다. `body/*`의 닫힌 접촉면은 렌더하지 않는다는 점도 모델 표면을 새로 만들지 않게 한다.
@evidence models/000-representation.md#model-bounds-and-states material variant는 원형의 상태별 부품 집합과 AABB를 보존하고 instances의 prototype 선택만 달리하는 결합으로 한정한다.
@evidenceReview models/000-representation.md#model-bounds-and-states  91·101의 동일 bounds 요구가 material variant에 의해 모델 상태별 AABB가 바뀌는 것을 막는다. 부품의 유무나 크기를 finish 선택으로 정하지 않는다.
@evidence models/001-seating-and-work.md#accent-chair 표의 frame·leg에는 oak-furniture, seat·back·back-cushion·arm에는 textile-linen/green을 각각 배정한다.
@evidenceReview models/001-seating-and-work.md#accent-chair  146·147의 안락의자 행은 frame/leg의 oak와 seat/back/arm의 textile을 갈라 한 상태 안에서 서로 다른 face 역할을 보존한다.
@evidence models/003-service-fixtures.md#rear-counter-sink 표의 bowl·rim은 prop-steel, tap-base·tap-riser·tap-arm·tap-outlet은 coated-metal을 받는다.
@evidenceReview models/003-service-fixtures.md#rear-counter-sink  148·149의 뒤 싱크 행은 basin bowl/rim과 수전 네 부품을 따로 칠한다. 금속이라는 큰 이름으로 수전 주소를 지우지 않는다.
@evidence models/005-everyday-objects.md#household-textiles 표의 직물 상태는 textile 계열을, outdoor-mat은 prop-rubber를 body 면에 배정한다.
@evidenceReview models/005-everyday-objects.md#household-textiles  107·108은 실내 직물과 outdoor-mat를 같은 prototype의 다른 상태로 두되 후자에는 고무 단색을 쓴다. 직물 texture가 현관 매트에 누출되지 않는다.
@evidence models/005-everyday-objects.md#personal-articles shoe·coat·garment·umbrella의 body와 sole, hanger·umbrella-stand의 body를 직물·고무·도장 금속 역할로 가른다.
@evidenceReview models/005-everyday-objects.md#personal-articles  109~111은 신발 밑창, 걸린 옷, 옷걸이의 면을 다른 재료로 읽는다. hanger의 금속은 코트의 직물 grain을 공유하지 않는다.
@evidence models/005-everyday-objects.md#dining-wares plate·vase·bottle·cutlery의 body를 도기·용기 유리·금속으로 상태별 배정한다.
@evidenceReview models/005-everyday-objects.md#dining-wares  112~114는 병의 투과, 접시의 유약 근사, 식기의 금속 응답을 별도 상태로 배정한다. body 하나라는 주소가 세 물성을 동질화하지 않는다.
@evidence models/005-everyday-objects.md#kitchen-smallwares pot·pan·kettle 등의 금속, board·block의 목재, crock·jar·소형 기기의 별도 body 마감은 표의 상태별 결합이다.
@evidenceReview models/005-everyday-objects.md#kitchen-smallwares  115~119의 주방 표는 도마의 결 축, 병의 투과, 소형 가전의 단색을 구별한다. pot의 metal을 crock의 도기로 확장하지 않는다.
@evidence models/005-everyday-objects.md#bath-accessories body의 플라스틱·금속·종이와 cap-side·pump-top의 덧면을 상태별 역할에 결합한다.
@evidenceReview models/005-everyday-objects.md#bath-accessories  120~124는 병 몸체와 cap-side 및 soap pump-top을 분리한다. tissue-roll의 종이 면을 동일한 욕실 플라스틱으로 덮지 않는다.
@evidence models/005-everyday-objects.md#household-boxes 상자 body의 종이와 parcel-locker body의 도장 금속을 다른 역할로 배정한다.
@evidenceReview models/005-everyday-objects.md#household-boxes  125·126에서 네 종이 상자와 parcel-locker는 body를 공유해도 서로 다른 finish를 쓴다. locker에 종이 grain을 적용하지 않는다.
@evidence models/005-everyday-objects.md#household-tools 도구 body의 기기 외피와 spare-light diffuser의 투과면을 구별한다.
@evidenceReview models/005-everyday-objects.md#household-tools  127·128은 도구 외피와 spare-light diffuser의 투과 응답을 나눈다. 확산면의 존재는 도구 원형이 정하고 마감 표가 추가하지 않는다.
@evidence models/005-everyday-objects.md#exterior-furnishings 외부 비품 body·garden-light diffuser·bicycle wheel을 도장 금속·확산면·고무로 구분한다.
@evidenceReview models/005-everyday-objects.md#exterior-furnishings  129~132의 외부 표는 bicycle wheel의 고무와 garden-light diffuser를 도장 금속 body에서 뺀다. outdoor-waste-bin은 또 별도 플라스틱이다.
@evidence models/005-everyday-objects.md#wall-accessories entry-mirror front와 wall-sconce diffuser를 각 body의 도장 금속에서 따로 결합한다.
@evidenceReview models/005-everyday-objects.md#wall-accessories  133~137은 거울 앞면의 환경 반사와 벽등 확산면을 각각 금속 외함과 구별한다. `body/front`를 추가 pane 형상으로 오해하지 않는다.
@evidence models/005-everyday-objects.md#desk-controls pointing-device body를 prop-appliance 응답으로 결합한다.
@evidenceReview models/005-everyday-objects.md#desk-controls  138의 pointing-device는 body 하나에 기기 외피 응답을 준다. 버튼이나 화면 같은 미정 부품을 재료층이 만들지 않는다.
@evidence models/005-everyday-objects.md#under-cabinet-light body의 도장 금속과 diffuser의 prop-diffuser를 나눈다.
@evidenceReview models/005-everyday-objects.md#under-cabinet-light  139·140의 하부장 광띠는 body와 diffuser의 다른 광학 응답을 정한다. 발광 과정 자체는 이 표가 소유하지 않는다.
@evidence models/005-everyday-objects.md#kitchen-extractor body와 filter-left/right의 외면은 도장 금속, 두 필터 underside는 prop-steel로 결합한다.
@evidenceReview models/005-everyday-objects.md#kitchen-extractor  141~145는 배기 후드 두 필터의 underside만 steel로 두고 외면은 도장 금속이다. 필터를 하나의 균일 금속 면으로 합치지 않는다.
@evidence models/001-seating-and-work.md#island-stool seat·leg와 새 footrest의 금속 외피는 기존 metal 역할을 유지하고 실제 접촉·형상은 모델에 남긴다.
@evidenceReview models/001-seating-and-work.md#island-stool  155의 섬 스툴은 새 footrest까지 기존 metal 역할을 따른다. 발받침의 치수와 접촉은 모델 owner의 결정으로 남아 있다.
@evidence models/001-seating-and-work.md#work-equipment 화면·stand의 metal과 keyboard의 white를 보존하며 새 housing·keys 면도 해당 기기 역할로 결합한다.
@evidenceReview models/001-seating-and-work.md#work-equipment  156의 작업 장치는 화면 외함과 keyboard-body/keys를 분리해 기존 metal·white 역할에 붙인다. 입력장치의 추가 형상을 이 표가 결정하지 않는다.
@evidence models/003-service-fixtures.md#cooking-appliances wall-worktop top은 worktop-stone, hob·oven 외피와 금속 조작면은 기존 metal·steel 역할로 나누고 새 window만 유리로 결합한다.
@evidenceReview models/003-service-fixtures.md#cooking-appliances  157의 뒤 조리대 top, cooktop/oven 외피, window는 서로 다른 마감 역할이다. oven window에 조작부의 metal을 씌우지 않는다.
@evidence models/003-service-fixtures.md#refrigerator body·door·toe와 handle을 기기 외피·도장 금속으로 배정하고 내부 선반을 마감 대상처럼 되살리지 않는다.
@evidenceReview models/003-service-fixtures.md#refrigerator  158의 냉장고 본체·문·toe와 손잡이를 다른 역할로 지정한다. 내부 선반을 보이는 새 모델 part라고 주장하지 않는다.
@evidence models/003-service-fixtures.md#laundry-appliances washer·dryer의 body는 기존 white, drum·controls는 metal, window는 glass 역할로 분리한다.
@evidenceReview models/003-service-fixtures.md#laundry-appliances  159는 washer와 dryer 몸체, drum/controls, window를 세 응답으로 분리한다. 투명 창을 흰 기기 외함으로 덮지 않는다.
@evidence models/004-decor-and-fixtures.md#potted-plant pot의 기존 metal과 soil·stem·branch·leaf의 식재색 역할을 구분해 가구 목재 결이 잎에 번지지 않게 한다.
@evidenceReview models/004-decor-and-fixtures.md#potted-plant  160은 화분의 soil·stem·branch·leaf 색을 보존 역할로 돌린다. `oak`라는 문자열이 stem을 가구 베니어로 바꾸는 근거가 되지 않는다.
@evidence models/004-decor-and-fixtures.md#books cover-left/right·spine과 pages를 책 표지·종이 역할로 결합한다.
@evidenceReview models/004-decor-and-fixtures.md#books  161의 표지·spine·pages는 종이 역할이고 texture가 접힌 페이지 형상을 만들어내지 않는다. 해당 면 주소는 책 모델의 것이다.
@evidence models/004-decor-and-fixtures.md#folded-towels layer-0..2·fold-0..1의 노출면에 기존 linen 역할을 유지하고 모델의 접힌 틈을 texture로 채우지 않는다.
@evidenceReview models/004-decor-and-fixtures.md#folded-towels  162의 towel layer와 fold가 모두 linen을 쓰되 접힌 틈은 기하로 유지된다. woven 색상 입자를 새 음영 홈으로 취급하지 않는다.
@evidence models/004-decor-and-fixtures.md#storage-basket bottom·wall·rim·handle에 기존 felt 역할을 유지한다.
@evidenceReview models/004-decor-and-fixtures.md#storage-basket  163의 bottom·wall·rim·handle은 felt 역할로 함께 배정된다. 손잡이를 별도 구조 소유자로 옮기지 않는다.
@evidence models/004-decor-and-fixtures.md#entry-charger body와 interface는 기존 metal 역할에 두고 전자 기능을 마감이 주장하지 않는다.
@evidenceReview models/004-decor-and-fixtures.md#entry-charger  164에서 충전기 interface와 body는 금속색이지만 충전 동작이나 발광을 주장하지 않는다. 표면 응답만 이 층의 범위다.
@evidence models/004-decor-and-fixtures.md#wall-art back·frame·mat·artwork·cover를 목재 틀·종이 그림·투명 전면 역할로 가른다.
@evidenceReview models/004-decor-and-fixtures.md#wall-art  165는 액자의 back/frame, mat/artwork, cover를 목재·종이·투명 전면으로 나눈다. cover와 artwork가 같은 평면색이 되지 않는다.
@evidence models/004-decor-and-fixtures.md#tabletop-props bowl·tray·cup의 shell·base·rim·body·handle에 도기·목재 역할을 상태별 결합한다.
@evidenceReview models/004-decor-and-fixtures.md#tabletop-props  166의 bowl·tray·cup은 shell, base, rim, handle의 기존 부품에 도기 또는 목재를 붙인다. 그릇 손잡이를 texture로 그린다는 설명이 없다.
@evidence models/004-decor-and-fixtures.md#living-display mount·housing·bezel·screen은 기존 metal 역할에 두고 화면 표시 기능을 마감이 주장하지 않는다.
@evidenceReview models/004-decor-and-fixtures.md#living-display  167의 화면 housing과 screen에는 보존 metal 역할만 적었다. 실제 영상 표시 내용은 이 material binding으로 보증하지 않는다.
@evidence models/004-decor-and-fixtures.md#ceiling-surface-light housing·trim의 metal과 diffuser의 glow를 기존 역할로 유지하며 발광은 systems에 둔다.
@evidenceReview models/004-decor-and-fixtures.md#ceiling-surface-light  168의 천장등은 housing/trim과 diffuser를 갈라 기존 glow 역할을 유지한다. 발광원 제어는 다른 층에 남긴다.
@evidence models/004-decor-and-fixtures.md#dining-pendant canopy·cord·shade의 metal과 diffuser의 glow를 분리해 보존한다.
@evidenceReview models/004-decor-and-fixtures.md#dining-pendant  169의 pendant canopy·cord·shade와 diffuser가 금속/확산 역할로 갈린다. cord가 텍스처 속 선으로 대체되지 않는다.
@evidence models/004-decor-and-fixtures.md#portable-lamps 기존 협탁등 globe의 glow와 금속 base를 보존하고 신규 독서등·작업등은 금속 외피·확산면으로 결합한다.
@evidenceReview models/004-decor-and-fixtures.md#portable-lamps  170의 협탁등과 독서·작업등을 상태별 외함과 diffuser로 배정한다. 독서등을 기존 globe 상태와 혼동해 재질 주소를 합치지 않는다.
-->

건축과 물체의 안정 면 주소는 각각 [표면 분해](../settings/003-spatial-basis.md#surface-decomposition)의 공간 owner와 model owner가 제공한다. materials가 양면 주소에 대한 finish ID·결 축·재료 응답을 결정하고 생성 owner는 그 결합을 운반한다. `oak`나 `white` 문자열 전체를 일괄 교체하지 않는다. 침대 pillow의 흰색은 직물이고 세면대 rim의 흰색은 도기다. 나무 줄기의 oak는 가구 목재가 아니다. 이 역할은 생성 시점의 typed 입력이며 viewer가 이름을 추측해서 칠하지 않는다. 기존 plan·벽 cut·opening·connector는 spaces, 물체 부재는 models, 배치와 상태별 위치는 instances가 계속 생성한다. 이전 방 source의 `*-bed-pillow-*`와 `*-rim` 문자열은 이관 전 임시 주소이며 model part id의 확정은 models 재판정 뒤 반영한다.

독립 element의 모델은 재료·실제 scale·결 축별로 공유할 수 있다. materialSources는 동일 형상·다른 metric UV 또는 재료 응답의 variant와 안정 model part/face 결합을 제공하고 물체의 치수·부재를 바꾸지 않는다. instances는 기존 `set.id`, explicit member `id`, count, seed, 순서, translation/rotation/scale을 유지하며 공개 type `IAutoMovieInstancePrototypeDesign`과 explicit `prototype`으로 variant를 선택한다. `@automovie/engine`의 `instanceSlot`이 반환하는 주소 `instance:<set.id>:<explicit.id>`를 유지하고 수작업 member 복제나 set 분할을 하지 않는다. 각 variant의 weight는 1이고 모든 member가 prototype을 명시한다. 원래 prototypeBounds와 실제 세계 bounds가 같아야 한다.

`IAutoMovieInstancePrototypeDesign`은 호출 함수나 새 production helper가 아니라 `{ id: string; modelRecipe: string; weight: number }`인 입력 레코드다. [정의](../../../../packages/interface/src/production/IAutoMovieInstancePrototypeDesign.ts)는 [production index](../../../../packages/interface/src/production/index.ts)와 [package root index](../../../../packages/interface/src/index.ts)에서 재export된다. 실제 import 경로는 `@automovie/interface`이며 저장소 내부 경로는 근거를 읽는 링크다. `id`는 set 안에서 중복 없는 비어 있지 않은 문자열, `modelRecipe`는 등록된 variant 모델의 ID, `weight`는 양수이며 이번 설계는 1로 고정한다. `default`는 engine이 기본 modelRecipe에 부여하는 ID이므로 저작 variant ID로 사용하지 않는다. 반환값·런타임 검사는 이 type 자체에 없다.

구현 시 modelSources가 형상과 part/face를 제공하고 materialSources가 그 주소의 finish·UV variant를 제공한 뒤, 중립 조립 경계인 [src/house/build.ts](../../src/house/build.ts)의 `buildHouse()`가 이를 `environment.models`에 등록한다. 현재 그 함수는 임시 방 fit-out을 직접 호출하며 후속 분기 소비로 교체하는 전이는 아직 미완료다. instanceSources의 population 작성 경계가 `import type { IAutoMovieInstancePrototypeDesign, IAutoMovieExplicitInstanceTransform } from "@automovie/interface"`를 소비하고 `IAutoMovieInstancePrototypeDesign[]`를 `set.prototypes`에 넣는다. [IAutoMovieExplicitInstanceTransform](../../../../packages/interface/src/production/IAutoMovieExplicitInstanceTransform.ts)의 id·translation(m)·rotation(quaternion)·scale과 선택적 palette를 유지하고 `prototype`에는 선택한 variant id를 넣어 `set.layout = { kind: "explicit", transforms }`로 전달한다. 현재 [Assembly.repeat](../../src/house/assembly.ts)의 임시 population은 이관 뒤 퇴역하며 최종 반복 작성은 instances owner가 맡는다. variant ID 중복·빈 ID·`default` 충돌·미등록 modelRecipe는 instanceSources의 작성 경계에서 set/member 주소가 있는 `Error`로 거부하고 다른 모델로 대체하지 않는다.

실제 소비자는 [src/viewer/payload.ts](../../src/viewer/payload.ts)의 기존 `@automovie/engine` root import다. `lowerBuiltEnvironment(environment)` 뒤 `materializeCompiledInstanceSet({ instanceSet: design, world: { routes: [] } })`가 `IAutoMovieCompiledInstanceSet`을 반환하고, `instanceSlot(compiled, index)`가 선택된 `prototype`, `modelRecipe`, `node`, position·rotation·scale3·palette를 가진 `IAutoMovieInstanceSlot`을 반환한다. 근거는 [compiler](../../../../packages/engine/src/populationRuntime/materializeCompiledInstanceSet.ts)와 [slot reader](../../../../packages/engine/src/populationRuntime/instanceSlot.ts)다. 없는 explicit prototype은 compiler가 쓰는 [prototype 선택](../../../../packages/engine/src/populationRuntime/selectInstancePrototype.ts)이 던지는 native `Error`(`Instance set "<id>" slot <n> references missing prototype "<prototype>".`), 범위 밖 slot은 `RangeError`다. 이 예외를 잡아 기본 모델이나 빈 population으로 바꾸지 않는다. 이 import와 호출은 현재 payload.ts에 이미 있고 모든 population set을 기본 prototype(`default`)의 modelRecipe로 물질화한다. materialSources는 반복 멤버를 편집하지 않고 결합 가능한 variant를 공급하며, instanceSources가 그 variant의 `set.prototypes`와 `transforms[].prototype`을 작성한다. 브라우저 [client](../../src/viewer/client.mjs)는 engine을 import하지 않고 [server](../../src/viewer/server.ts)가 보낸 JSON payload를 소비한다.

palette는 engine에서 절대 sRGB 색으로 쓰인다. materialSources는 새 마감 기준색과 해당 H2가 허용한 판별 변화를 정의하고 instanceSources는 그 값만 explicit palette로 전달한다. viewer의 기존 선형색 보정식을 바꿔 이중 tint를 감추지 않는다. 나머지 population의 palette는 그대로 둔다. 새 material source는 문서 파일마다 하나의 공개 owner로 대응하며 `src/house/build.ts`의 `buildHouse()`가 건축·물체 표면에 결합한다. 최종 library export와 viewer는 같은 중립 조립 결과의 native 재료/모델을 받아야 한다. 현재 `src/spaces/citizen-house.ts`의 임시 전체 environment 등록은 이관 뒤 건축 spaces 산출물로 분리한다.

검사는 [전체 바인딩 census](007-observation.md#binding-census)다. 기존 모델 ID의 증가 자체는 geometry 증가가 아니지만 모델별 부재 선택, 동일 world bounds, member 정체성, 모든 기존 topology 참조를 대조해야 한다. 하나의 완결 표면을 여러 사후 칠하기 owner가 나누어 갖는 구현은 이 설계와 맞지 않는다.

새 [생활 사물 모델](../models/005-everyday-objects.md)의 `body`는 아래 상태별 역할에 결합한다. `states` 열의 쉼표는 같은 prototype 안의 각 명시 상태를 뜻한다. `body/*`는 해당 상태가 선언한 모든 가시 face이며, 닫힌 접촉면은 같은 재료 ID를 갖지만 렌더하지 않는다. 모델이 face를 더 만들면 같은 상태의 역할을 따라야 하고, 물체 형상·부품·배치는 이 표가 추가하지 않는다. 기존 모델의 결합은 각 마감 H2가 소유하며, 이번에 추가한 작업실 안락의자와 뒤 조리대 싱크·수전은 아래 행에서 면 역할을 명시한다. 아래의 `solid`는 baseColor만, `oak-grain`과 `woven-grain`은 이미 정한 절차형 색상 texture를 뜻한다. texture 비트맵 파일은 이 설계에 넣지 않는다.

| prototype | states | surface | finish/response | tile U×V (m) | primary UV | texture 실패 시 fallback | model host |
| --- | --- | --- | --- | --- | --- | --- | --- |
| household-textiles | sofa-cushion,pillow,blanket,bedding-set,folded-sheet,placemat,dishcloth,bath-mat,entry-mat | body/* | textile-linen/green/blue/white: 해당 방의 [직물 색](005-soft-finishes.md#textiles) | [직물 반복](005-soft-finishes.md#textiles) | 모델 face의 surface-metres; 곡면 뒤쪽 −Z 이음 | texture 자원 누락은 주소 Error | [host](../models/005-everyday-objects.md#household-textiles) |
| household-textiles | outdoor-mat | body/* | prop-rubber: #343735, roughness .90, metallic 0 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#household-textiles) |
| personal-articles | shoe,coat,garment,umbrella | body/* | prop-fabric: #6b735c, roughness .88, metallic 0 | [직물 반복](005-soft-finishes.md#textiles) woven-grain | surface-metres, 물체 local +Y를 V | texture 자원 누락은 주소 Error | [host](../models/005-everyday-objects.md#personal-articles) |
| personal-articles | shoe | body/sole | prop-rubber | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#personal-articles) |
| personal-articles | hanger,umbrella-stand | body/* | coated-metal: [도장 금속](002-exterior-solids.md#coated-metal) | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#personal-articles) |
| dining-wares | plate,flower-vase | body/* | prop-ceramic: #e7e6df, roughness .26, metallic 0, clearcoat .10 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#dining-wares) |
| dining-wares | water-bottle | body/* | prop-container-glass: #cbd7d2, roughness .12, metallic 0, transmission .68, thickness .003m, ior 1.5 | 없음 | face normal만 사용 | solid baseColor·transmission | [host](../models/005-everyday-objects.md#dining-wares) |
| dining-wares | fork,spoon,table-knife | body/* | prop-steel: #a9b0ad, roughness .32, metallic .78 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#dining-wares) |
| kitchen-smallwares | pot,pan,kettle,utensil,drying-rack | body/* | prop-steel | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#kitchen-smallwares) |
| kitchen-smallwares | cutting-board,knife-block | body/* | oak-furniture: [가구 목재](004-wood.md#furniture-wood) | [목재 반복](004-wood.md#furniture-wood) oak-grain | surface-metres, 긴 local 축을 V | texture 자원 누락은 주소 Error | [host](../models/005-everyday-objects.md#kitchen-smallwares) |
| kitchen-smallwares | utensil-crock | body/* | prop-ceramic | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#kitchen-smallwares) |
| kitchen-smallwares | glass-jar | body/* | prop-container-glass | 없음 | face normal만 사용 | solid baseColor·transmission | [host](../models/005-everyday-objects.md#kitchen-smallwares) |
| kitchen-smallwares | toaster,coffee-brewer | body/* | prop-appliance: #c8cbc7, roughness .38, metallic .18 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#kitchen-smallwares) |
| bath-accessories | soap-dispenser,toothbrush-cup,toothbrush,shampoo-bottle,detergent-bottle,waste-bin,laundry-basket | body/* | prop-plastic: #d6d5ce, roughness .48, metallic 0 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#bath-accessories) |
| bath-accessories | soap-dispenser,shampoo-bottle,detergent-bottle | body/cap-side | prop-cap: #59655d, roughness .55, metallic 0 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#bath-accessories) |
| bath-accessories | soap-dispenser | body/pump-top | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#bath-accessories) |
| bath-accessories | tissue-holder | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#bath-accessories) |
| bath-accessories | tissue-roll,tissue-pack | body/* | prop-paper: #e4e2db, roughness .92, metallic 0 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#bath-accessories) |
| household-boxes | file-box,toy-box,storage-box,recycling-box | body/* | prop-paper | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#household-boxes) |
| household-boxes | parcel-locker | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#household-boxes) |
| household-tools | tool-box,vacuum,folded-ladder,cleaning-tool,spare-light,garden-tool,hose-reel | body/* | prop-appliance | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#household-tools) |
| household-tools | spare-light | body/diffuser | prop-diffuser: #e7e6df, roughness .65, metallic 0, transmission .25 | 없음 | face normal만 사용 | solid baseColor·transmission | [host](../models/005-everyday-objects.md#household-tools) |
| exterior-furnishings | mailbox,outdoor-bench,outdoor-chair,outdoor-table,garden-light,rain-barrel,bike-rack,bicycle | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#exterior-furnishings) |
| exterior-furnishings | garden-light | body/diffuser | prop-diffuser | 없음 | face normal만 사용 | solid baseColor·transmission | [host](../models/005-everyday-objects.md#exterior-furnishings) |
| exterior-furnishings | bicycle | body/wheel | prop-rubber | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#exterior-furnishings) |
| exterior-furnishings | outdoor-waste-bin | body/* | prop-exterior-plastic: #51564e, roughness .70, metallic 0 | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#exterior-furnishings) |
| wall-accessories | entry-mirror | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#wall-accessories) |
| wall-accessories | entry-mirror | body/front | prop-mirror: #cbd7d2, roughness .06, metallic .85 | 없음 | face normal만 사용 | solid baseColor·환경 반사 근사 | [host](../models/005-everyday-objects.md#wall-accessories) |
| wall-accessories | wall-sconce | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#wall-accessories) |
| wall-accessories | wall-sconce | body/diffuser | prop-diffuser | 없음 | face normal만 사용 | solid baseColor·transmission | [host](../models/005-everyday-objects.md#wall-accessories) |
| wall-accessories | coat-hook | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#wall-accessories) |
| desk-controls | pointing-device | body/* | prop-appliance | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#desk-controls) |
| under-cabinet-light | default | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#under-cabinet-light) |
| under-cabinet-light | default | body/diffuser | prop-diffuser | 없음 | face normal만 사용 | solid baseColor·transmission | [host](../models/005-everyday-objects.md#under-cabinet-light) |
| kitchen-extractor | default | body/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#kitchen-extractor) |
| kitchen-extractor | default | filter-left/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#kitchen-extractor) |
| kitchen-extractor | default | filter-right/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/005-everyday-objects.md#kitchen-extractor) |
| kitchen-extractor | default | filter-left/underside | prop-steel | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#kitchen-extractor) |
| kitchen-extractor | default | filter-right/underside | prop-steel | 없음 | face normal만 사용 | solid baseColor | [host](../models/005-everyday-objects.md#kitchen-extractor) |
| accent-chair | default | frame/*,leg-0..3/* | oak-furniture | [목재 반복](004-wood.md#furniture-wood) oak-grain | surface-metres, 긴 local 축을 V | texture 자원 누락은 주소 Error | [host](../models/001-seating-and-work.md#accent-chair) |
| accent-chair | default | seat/*,back/*,back-cushion/*,arm-left/right/* | textile-linen/green | [직물 반복](005-soft-finishes.md#textiles) | 모델 face의 surface-metres | texture 자원 누락은 주소 Error | [host](../models/001-seating-and-work.md#accent-chair) |
| rear-counter-sink | default | bowl/*,rim/* | prop-steel | 없음 | face normal만 사용 | solid baseColor | [host](../models/003-service-fixtures.md#rear-counter-sink) |
| rear-counter-sink | default | tap-base/*,tap-riser/*,tap-arm/*,tap-outlet/* | coated-metal | 없음 | face normal만 사용 | solid 기준색 | [host](../models/003-service-fixtures.md#rear-counter-sink) |

다음은 기존 마감 H2가 담당하던 원형과 새 소품의 면 역할을 같은 주소 규칙으로 묶은 색인이다. `prop-*` 응답은 위 표의 같은 ID를 재사용한다. `retained/<현재 material id>`는 [보존 목록](006-wet-and-joinery.md#retained-surfaces)의 기존 source 재료 역할을 가리키며, 이 색인이 새 geometry나 발광을 추가하지 않는다. 목재·직물의 UV는 [미터 좌표](#metric-texture-coordinates)를 따르고 단색 면은 texture UV를 요구하지 않는다.

| model host | model part roles | finish role |
| --- | --- | --- |
| [섬 스툴](../models/001-seating-and-work.md#island-stool) | seat, leg-0..3, footrest-0..3 | retained/metal |
| [작업 장치](../models/001-seating-and-work.md#work-equipment) | stand-base/shaft, housing, display-bezel, screen; keyboard-body, keys-0..47 | retained/metal; retained/white |
| [벽 조리 기기](../models/003-service-fixtures.md#cooking-appliances) | wall-worktop top; cooktop body/rim, oven body/front-frame; zone-0..3, controls, knob, handle; window | worktop-stone; retained/metal; retained/steel; prop-container-glass |
| [냉장고](../models/003-service-fixtures.md#refrigerator) | body, door-lower/upper, toe; handle-lower/upper | prop-appliance; coated-metal |
| [세탁 기기](../models/003-service-fixtures.md#laundry-appliances) | washer/dryer body; drum-inner/rim·controls; window | retained/white; retained/metal; retained/glass |
| [실내 화분](../models/004-decor-and-fixtures.md#potted-plant) | pot; soil; stem; branch; leaf | retained/metal; retained/soil; retained/oak; retained/bark; retained/leaf |
| [책](../models/004-decor-and-fixtures.md#books) | cover-left/right, spine, pages | prop-paper |
| [접힌 수건](../models/004-decor-and-fixtures.md#folded-towels) | layer-0..2, fold-0..1 | retained/linen |
| [바구니](../models/004-decor-and-fixtures.md#storage-basket) | bottom, wall, rim, handle-left/right | retained/felt |
| [충전기](../models/004-decor-and-fixtures.md#entry-charger) | body, interface | retained/metal |
| [액자](../models/004-decor-and-fixtures.md#wall-art) | back, frame; mat, artwork; cover | oak-furniture; prop-paper; prop-container-glass |
| [식탁 소품](../models/004-decor-and-fixtures.md#tabletop-props) | bowl shell; tray base/rim; cup body/handle | prop-ceramic; oak-furniture; prop-ceramic |
| [거실 화면](../models/004-decor-and-fixtures.md#living-display) | mount, housing, bezel, screen | retained/metal |
| [천장등](../models/004-decor-and-fixtures.md#ceiling-surface-light) | housing-body/flange/core, trim; diffuser | retained/metal; retained/glow |
| [펜던트](../models/004-decor-and-fixtures.md#dining-pendant) | canopy, cord, shade-wall/cap; diffuser | retained/metal; retained/glow |
| [이동 조명](../models/004-decor-and-fixtures.md#portable-lamps) | bedside-globe base/stem-short; globe; reading·desk-task 외피와 diffuser | retained/metal; retained/glow; coated-metal·prop-diffuser |

첫 표의 신규 소품 마감 선택은 그 표가 소유한다. 아래 보존 역할의 material id와 응답은 [보존 H2](006-wet-and-joinery.md#retained-surfaces)가 소유한다. 두 표의 model host와 face 이름을 역방향 대조할 때 다음 색인을 사용한다.

[생활 직물](../models/005-everyday-objects.md#household-textiles)의 `body`는 직물·고무면 결합 대상이다.
[개인 소품](../models/005-everyday-objects.md#personal-articles)의 `body`·`sole`은 옷감·밑창 결합 대상이다.
[식기](../models/005-everyday-objects.md#dining-wares)의 `body`는 도기·유리·금속 결합 대상이다.
[주방 소품](../models/005-everyday-objects.md#kitchen-smallwares)의 `body`는 상태별 금속·목재·도기·유리 결합 대상이다.
[욕실 소품](../models/005-everyday-objects.md#bath-accessories)의 `body`·`cap-side`·`pump-top`은 플라스틱·금속·종이 결합 대상이다.
[가정용 상자](../models/005-everyday-objects.md#household-boxes)의 `body`는 종이·금속 결합 대상이다.
[가정용 도구](../models/005-everyday-objects.md#household-tools)의 `body`·`diffuser`는 기기 외피·확산면 결합 대상이다.
[외부 비품](../models/005-everyday-objects.md#exterior-furnishings)의 `body`·`diffuser`·`wheel`은 외부 도장·고무·확산면 결합 대상이다.
[벽 부속](../models/005-everyday-objects.md#wall-accessories)의 `body`·`front`·`diffuser`는 프레임·거울·확산면 결합 대상이다.
[책상 조작기](../models/005-everyday-objects.md#desk-controls)의 `body`는 기기 외피 결합 대상이다.
[하부장 광띠](../models/005-everyday-objects.md#under-cabinet-light)의 `body`·`diffuser`는 주택 조명 외피·확산면 결합 대상이다.
[배기 후드](../models/005-everyday-objects.md#kitchen-extractor)의 `body`·`filter-left`·`filter-right`·`underside`는 후드 외피·필터 결합 대상이다.
[작업실 안락의자](../models/001-seating-and-work.md#accent-chair)의 `frame`·`leg-0`·`seat`·`back`·`back-cushion`·`arm-left`는 목재와 직물 결합 대상이다.
[뒤 조리대 싱크·수전](../models/003-service-fixtures.md#rear-counter-sink)의 `bowl`·`rim`·`tap-base`·`tap-riser`·`tap-arm`·`tap-outlet`은 금속 결합 대상이다.

이 표의 새 `prop-*`는 색·roughness·metallic과 적힌 clearcoat·transmission·thickness·ior 외에는 [재료 기본값](#material-delivery)을 따른다. `prop-container-glass`의 thickness는 광학 응답값이며 용기의 실제 벽 두께는 models의 형상이 소유한다. `prop-container-glass`는 투명 용기 근사이고 `prop-mirror`는 환경 반사만 반영해 정확한 실내 거울상은 `unverified`다. 위의 결합은 제작 목표이며 현재 materialSources의 실제 바인딩이나 렌더 관찰을 뜻하지 않는다. 누락된 owner/state/part/face 또는 texture 자원은 같은 주소를 출력하고 실패한다. 단색 행의 fallback은 없는 texture를 찾는 경로가 아니라 명시된 baseColor 자체다. 비균일 크기 변종은 [metric 규칙](#metric-texture-coordinates)에 따라 실제 표면 m로 UV를 작성한다.

## 미터 좌표와 반복 {#metric-texture-coordinates}

<!--
@evidence principles/core/common.md#scope-preservation 새 texture의 생성(seed·texel), 전달(surface-metres·transform·sampler), 비균일 scale 반영, 판별 위상, GPU 자원 공유를 한 규칙으로 묶고 PV와 층간 띠의 예외 owner를 명시해 좌표 규칙이 없는 texture 면이 남지 않게 한다.
@evidenceReview principles/core/common.md#scope-preservation  207~211은 seed 생성부터 sampler, scale, 판별 위상까지 모든 texture 면의 공통 좌표를 적는다. PV 바인딩은 고유 owner의 예외로 남겨 무단 재투영을 막는다.
@evidence principles/core/common.md#substantive-completion seed=2080, sRGB colorSpace와 ±.005 평균 오차, transform.scale=(1/tileU,1/tileV), wrapS/T·minFilter·magFilter·anisotropy, XY·XZ·ZY 접선축과 법선 부호, FNV-1a 위상의 비트 배정과 8종 상한까지 수치로 정해 구현이 표면 좌표계를 발명하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion  `surface-metres`와 역 타일 길이, 법선별 접선축, FNV-1a 비트 사용이 수치로 닫혀 있다. source가 임의 정규화 UV나 무작위 위상을 고를 여지가 없다.
@evidence principles/core/common.md#declared-basis m와 +Y 위·+Z 후면 축은 본문이 링크한 coordinate-datum, reference 이미지 비사용은 delivery-scope, validateTextureScale의 반환은 engine 원본에서 받고, 위상 hash·texture 해상도·specialization key는 이 층의 저작 선택이라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis  207의 좌표 단위와 사진 배제는 부모 설정에 닿고, 211의 hash·해상도·key는 재료의 저작 결정이라고 명시한다. engine의 선택이라고 잘못 귀속하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 coordinate-datum은 단위와 축만 정한다. 이 H2는 그 단위를 texture 반복 길이, 실제 scale을 반영한 UV specialization key, 판별 위상 hash라는 표면 좌표 결정으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  좌표 기준은 m와 방향만 제공한다. 이 H2가 실제 표면 길이의 UV와 variant specialization으로 그 기준을 마감 반복에 맞게 바꾼다.
@evidence principles/design/materials.md#material-construction-appearance 색상 texture는 구운 조명·접합 그림자 없는 명도 grain이라고 하고, tessellateToMesh나 기존 mesh의 위치·법선·삼각형은 보존한 채 face seam에서 UV가 달라지는 정점 속성만 복제한다고 정해 부재 형상과 외관 파라미터를 떼어 놓는다.
@evidenceReview principles/design/materials.md#material-construction-appearance  209는 seam에서 속성 정점만 복제하고 위치·법선·삼각형을 보존한다. 207의 grain은 조명이나 구조 홈을 굽지 않아 물리 층과 구분된다.
@evidence principles/design/materials.md#material-binding-interface box 면마다 XY·XZ·ZY 중 두 접선축과 법선 부호를 고르고, 넓은 면의 V를 grain 축에, 문짝 결은 문 회전과 함께 움직이게 두어 host 형상을 바꾸지 않고 따를 좌표 계약을 정한다.
@evidenceReview principles/design/materials.md#material-binding-interface  box 면의 접선축 선택과 법선 반전이 209에 있다. 문짝 결이 회전 뒤에도 문을 따라간다는 조건은 host geometry를 재배치하지 않는다.
@evidence principles/design/materials.md#material-verification-address validateTextureScale 호출과 실제 scale이 반영된 UV의 길이 대조, 반복 주기 경계, native 모델 variant 수와 texture 자원 수·bytes를 scale-and-junction-samples와 binding-census에 연결하고 frame rate는 보증하지 않는다.
@evidenceReview principles/design/materials.md#material-verification-address  census는 variant와 texture 수를, 접합 표본은 실제 m 반복을 본다. 두 표본을 모두 통과해도 FPS 성능이 증명된다고 하지 않는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work coordinate-datum의 m·+Y 위·+Z 후면, 기존 unit box primitive와 part transform·부모 scale 구조, tessellateToMesh의 정점 배열을 대조했다. 부모가 metric UV를 막는 좌표 결함은 없었고 unit UV 확대 방식의 폐기는 이 층 안의 결정이다.
@evidenceExcludeReview upstream/design/materials.md#parent-revision-from-material-work  부모의 Y-up·+Z와 기존 mesh 정점 구조는 metric 좌표의 입력으로 충분하다. unit UV 확대를 버린 것은 이 H2의 선택이어서 부모 도면을 고칠 근거가 아니다.
@evidence settings/003-spatial-basis.md#coordinate-datum m 단위를 surface-metres UV와 transform.scale=(1/tileU,1/tileV)의 단위로 써 모든 texture의 물리 반복 길이를 같은 미터로 잰다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum  207의 길이 m가 tileU·tileV의 단위를 정한다. 회전하거나 이동해도 UV가 세계에 붙어 미끄러지지 않도록 209가 local 적용을 제한한다.
@evidence settings/001-production.md#delivery-scope 다섯 reference 이미지를 texture로 삽입하지 않는다는 결정에 따라 모든 grain을 seed=2080의 typed source RGBA로 생성하고 사진·billboard·구운 조명을 쓰지 않는다.
@evidenceReview settings/001-production.md#delivery-scope  207은 reference 사진을 texture 픽셀로 저장하지 않고 seed와 정수 texel에서 색을 만든다. 다섯 이미지의 시각 기준을 사진 asset 사용 허가로 바꾸지 않는다.
@evidence models/000-representation.md#model-uv-and-topology texture를 받는 모델 face의 UV와 닫힌 곡면 seam을 받아 실제 표면 m를 반복 길이로 환산하고 비균일 scale을 variant 주소에 포함한다.
@evidenceReview models/000-representation.md#model-uv-and-topology  209는 model의 닫힌 곡면 seam과 실제 scale을 texture 좌표에서 소비한다. UV 수리는 부품 위치나 topology 수리를 뜻하지 않는다.
-->

길이 단위 m와 +Y 위·+Z 후면의 축은 [좌표 기준](../settings/003-spatial-basis.md#coordinate-datum)을, 다섯 reference 이미지를 texture로 쓰지 않는 결정은 [납품 범위](../settings/001-production.md#delivery-scope)를 따른다. 색상 texture는 typed source가 고정 seed=2080과 정수 texel 좌표로 만드는 tileable RGBA다. 사진·레퍼런스·billboard·구운 조명·구운 접합 그림자는 사용하지 않는다. 무채색 grain asset은 sRGB colorSpace로 결합되어 uploader가 선형 조명 공간으로 decode하며 alpha=255이고 평균 허용 오차는 선형값 ±.005다. texture마다 문서의 ID·해상도·물리 반복 길이를 그대로 자원에 담고, primary UV는 `coordinateSource: surface-metres`, transform.scale=(1/tileU,1/tileV), offset=(0,0), rotationDeg=0으로 전달한다. sampler는 wrapS/T=repeat, minFilter=linearMipmapLinear, magFilter=linear이다. binding 레코드에는 anisotropy 필드가 없으며 [uploader](../../src/viewer/scene.mjs)가 모든 texture에 anisotropy 8을 적용한다. PV의 기존 바인딩은 해당 owner가 명시한 예외다. [층간 금속 cassette와 seal](002-exterior-solids.md#opaque-floor-band)은 이 metric 반복 규칙을 따른다.

비균일 scale 뒤의 표면 길이로 UV를 작성한다. 기존 공개 tessellateToMesh 또는 기존 mesh의 위치·법선·삼각형은 보존하고 face seam에서 UV가 달라질 때 정점 속성만 복제한다. box의 각 면은 local 축에 따라 XY·XZ·ZY 중 두 접선축을 사용하며 법선 부호에 맞춰 반전한다. 결 방향이 있는 넓은 표면은 V를 문서의 grain 축으로 둔다. grain 축이 법선과 평행한 끝면은 [목재 끝면](004-wood.md#wood-end-faces)을 따른다. part transform과 부모를 포함한 실제 scale을 반영하되 회전·이동으로 texture가 세계에 고정되어 미끄러지지 않는다. UV specialization key는 원래 모델/part, scale의 원래 유한 수치, finish, grain 축, 위상이며 눈대중 반올림으로 다른 크기를 합치지 않는다.

판마다 위상이 필요할 때 기존 stable member ID의 Unicode code point를 순서대로 32-bit FNV-1a로 누적하고 seed2080을 초기 hash와 XOR한다. 하위 2bit/다음 1bit를 각각 4/2로 나눈 U/V 위상으로 써 크기·결 축당 최대 8종으로 제한한다. 판별 sRGB 계수는 그 다음 16bit를 65535로 나눈 값으로 각 H2의 구간 안에서 선형 보간한다. 시간·실행 순서·Math.random은 사용하지 않는다. 등방성 석재도 표면의 local 좌표를 쓰되 패널 이음에서 위상을 끊을 수 있다. 문짝 세로결은 문이 회전해도 문과 같이 움직이고 floor grain은 각 판의 +Z를 따른다. seed=2080, 위상 hash와 그 비트 배정, 각 마감 H2의 texture 해상도, UV specialization key는 engine이나 settings에서 받은 값이 아니라 이 층의 저작 선택이다.

같은 texture asset·sampling binding은 viewer에서 GPU texture 하나를 공유한다. [scene uploader](../../src/viewer/scene.mjs)의 textureCache는 asset마다 source 하나를 만들고, binding마다 그 source를 공유하는 clone에 그 binding의 sampler·colorSpace·UV transform을 설정해 돌려준다. package.json이 선언한 three 0.186의 texture cache는 source마다 wrap·filter·anisotropy·colorSpace와 pixel 형식 값을 key로 GPU texture를 두고 UV transform은 key에 넣지 않으므로 같은 asset·sampler·colorSpace는 한 번 올라간다. native material 레코드가 같은 part placement는 정적 batch 하나로 그려진다. 재료 variant가 늘어도 이 공유와 batch를 유지하고 variant마다 RGBA를 다시 올리는 경로를 되살리지 않는다. scene disposal은 batch의 texture를 모두 해제하며 공유 GPU texture는 마지막 사용자가 해제될 때 한 번 놓인다. 이는 새 렌더 channel이나 shader가 아니라 기존 지원 전달의 자원 수명 관리다. 실제 native 모델 variant 수와 texture 자원 수·bytes를 [census](007-observation.md#binding-census)에 함께 기록하고 성능 실측이 없으면 frame rate를 보증하지 않는다.

기존 unit primitive에 0..1 UV 하나를 붙인 채 scale만 키우는 방식은 채택하지 않는다. [scale 검사와 호출 계약](007-observation.md#scale-and-junction-samples)은 `@automovie/engine`의 `validateTextureScale({ models })`에 현재 native 모델을 전달한다. [원본](../../../../packages/engine/src/validation/validateTextureScale.ts)의 이 API는 `IAutoMovieValidation`만 반환하고 transform을 적용하거나 census를 작성하지 않는다. 실제 scale이 반영된 UV인지의 길이 대조와 검사 가능 범위 집계는 연결된 production 검사 owner가 별도로 기록한다. primitive·무UV 등 미계측 표면과 violation이 없는 native 결과를 전체 통과로 읽지 않는다. 정상적인 타일 반복은 이음이 보이지 않아야 하고 UV 방향이 다른 두 면의 경계는 실제 부재 모서리에서만 바뀐다.
