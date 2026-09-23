# 유리와 닫힌 지붕 재료

## 커튼월 투명 유리 {#clear-glass}

<!--
@evidence principles/core/common.md#scope-preservation 모든 curtainwall pane 중 glass 면과 day·private/night 두 상태를 이 마감에 두고, 새 광학 상태·프라이버시 보증·glare 판은 만들지 않는다고 적어 투명 유리의 약속 범위를 닫는다.
@evidence principles/core/common.md#substantive-completion 0.018m, ior 1.5, roughness .09, day #d2e2dc·transmission .94와 private/night #526c64·.38을 정해 구현이 유리 상태값을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 상태의 의미는 privacy-states, 유리 두께는 glazing-interface 단면에서 받고, 색·투과 수치는 전기변색 실측이 아닌 현재 보이는 상태의 저작 근사라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation privacy canon은 밝은 투명과 어두운 tint를 말로만 정한다. 이 H2는 그 두 상태를 native baseColor·transmission 쌍과 공통 roughness·ior로 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 형상 두께 0.018m와 렌더 thickness·ior를 맞추되 transmission은 가시광 투과율·열 성능이 아니라고 분리해 광학 근사를 제품 성능으로 읽지 않게 한다.
@evidence principles/design/materials.md#material-binding-interface 기존 curtainwall owner의 pane 면에만 결합하고 texture가 없어 좌표 요구가 없으며, 반사는 기존 sky·PMREM과 주변 재료가 정한다는 호환 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address 낮/사적 상태 차이와 앞뒤 면·실내 가구의 보임을 material-state-samples와 ref01·03·05에서 반증하고, 새 석재·목재가 바꾼 반사 대비를 회귀 표본에 넣는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work privacy-states의 공용부·계단 투명과 사적 tint, glazing-interface의 유리 n=-0.009..0.009 단면, 투명 opening들의 pane 분할을 대조했다. 부모가 상태와 두께를 이미 정해 재료가 수리할 결함이 없었다.
@evidence settings/003-spatial-basis.md#privacy-states 공용부·계단 유리의 낮 투명과 사적 tint를 두 baseColor·transmission 쌍으로 구현 입력화한다.
@evidence settings/001-production.md#production-visual-grammar 청회색 유리라는 재료 관계를 day #d2e2dc의 옅은 청록 기색과 낮은 roughness로 둔다.
@evidence spaces/003-surface-ownership.md#glazing-interface 유리 단면 n=-0.009..0.009가 주는 0.018m 두께를 geometry·renderer thickness로 받는다.
@evidence spaces/003-surface-ownership.md#rear-common-glazing 후면 공용부의 전폭 투명 pane이 ref03의 정원 시야를 주는 대표 면으로 이 마감을 받는다.
@evidence spaces/003-surface-ownership.md#front-stair-glazing 계단실 두 층의 투명 pane이 ref01 외관에서 실내 계단과 빛을 보이는 면으로 이 마감을 받는다.
@evidence spaces/003-surface-ownership.md#right-common-glazing 공용부 측면창의 투명 pane이 후면과 같은 상태 쌍을 받아 두 면의 유리가 다르게 읽히지 않는다.
-->

현재 `*-pane-*` 중 glass 면은 기존 curtainwall owner가 유지한다. geometry의 0.018m 두께, ior=1.5, roughness=.09, metallic=0, opacity=1, alphaMode=opaque, clearcoat=0을 보존한다. day는 #d2e2dc·transmission=.94, private/night는 #526c64·transmission=.38이다. 이 숫자는 전기변색 유리의 광학 실측값이 아니라 현재 보이는 상태의 근사다. 새 상태나 프라이버시 보증을 추가하지 않는다.

texture는 없다. 유리의 반사는 동일한 기존 sky/PMREM과 주변 재료가 결정하며 가짜 하늘 사진·정면 glare 판을 붙이지 않는다. 앞뒤 면과 실내 가구의 보임, 낮과 사적 상태의 차이는 [상태 검사](007-observation.md#material-state-samples)와 ref01·03·05에서 관찰한다. 새 석재·목재 때문에 반사 대비가 바뀌는 것은 이번 재료 회귀 검사에 포함한다. 실제 가시광 투과율·열 성능·시선 차단 성능은 unverified다.

## 반투명 유리 {#frosted-glass}

<!--
@evidence principles/core/common.md#scope-preservation 작업실·침실 하부 privacy band와 욕실 전체 frosted 면을 facade가 만든 그대로 받고, 프라이버시 강화나 외부 차양의 새 설계는 이 보존 결정에서 승인하지 않는다고 경계를 적는다.
@evidence principles/core/common.md#substantive-completion #b7ccc0, roughness .70, transmission .28, thickness .018, ior 1.5를 정해 반투명 표현값을 구현이 고르지 않는다.
@evidence principles/core/common.md#declared-basis 고정 반투명 층의 존재와 위치는 privacy-states와 각 opening H2에서 받고, 거친 투과의 수치는 이 층의 근사 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 반투명이라는 상태와 위치만 정한다. 이 H2는 입자 이미지 대신 roughness .70과 transmission .28의 scalar 응답으로 거친 투과를 표현한다는 결정을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 유리 두께 형상은 유지하고 거친 투과는 렌더 근사일 뿐 시선 차단 성능이 아니라고 나눠, 반투명 외관을 프라이버시 보증으로 읽지 않게 한다.
@evidence principles/design/materials.md#material-binding-interface 투명/반투명 경계의 높이·개수와 각 면은 spaces owner가 소유하고 재료는 texture 좌표 없이 그 면에만 결합한다는 호환 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address 같은 opening의 상하 band를 material-state-samples에서 함께 보고, 세라믹처럼 완전히 불투명하거나 낮·밤 상태에서 열린 문과 혼동되면 실패로 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work privacy-states의 하부 시선대와 욕실 고정층, 각 privacy opening의 sill+1.25m 경계와 욕실 창 전체 frosted를 대조했다. 부모가 위치와 상태를 정했고 재료는 응답만 더했다.
@evidence settings/003-spatial-basis.md#privacy-states 작업실·침실 하부 시선대와 욕실 전체의 고정 반투명 층을 이 응답으로 받는다.
@evidence spaces/003-surface-ownership.md#rear-bath-glazing 후면 욕실 창 전체가 모든 상태에서 이 frosted 응답을 유지한다.
@evidence spaces/003-surface-ownership.md#right-bath-glazing 욕실 측면창 전체가 같은 frosted 응답을 받아 두 욕실 창의 프라이버시 읽힘이 같다.
@evidence spaces/003-surface-ownership.md#front-flex-glazing 작업실 전면창의 sill부터 1.25m 하부 band가 frosted를 받고 위쪽은 투명 유리로 남는다.
@evidence spaces/003-surface-ownership.md#front-bedroom-glazing 상층 침실 전면창에서 하층 작업실 jamb 분할선으로 나뉜 bay마다 sill부터 1.25m band가 frosted를 받는다.
@evidence spaces/003-surface-ownership.md#rear-bedroom-glazing 주침실 후면창의 bay마다 하부 band가 frosted를 받는다.
@evidence spaces/003-surface-ownership.md#left-flex-glazing 작업실 측면창의 하부 band가 frosted를 받아 reference04 측면 하부의 반투명 유리가 된다.
@evidence spaces/003-surface-ownership.md#left-bedroom-glazing 작은 침실 1 측면창의 하부 band가 frosted를 받는다.
@evidence spaces/003-surface-ownership.md#left-child-two-glazing 높은 sill 3.90에서 시작하는 작은 침실 2 창의 하부 1.25m가 frosted, 나머지 위쪽이 투명으로 나뉜다.
-->

lower privacy band 및 욕실의 frosted 면은 `facade.ts`가 생성한 그대로다. 작업실·침실 창의 하부 band는 bay마다 sill부터 min(head, sill+1.25)까지, 곧 현재 창에서 sill부터 1.25m이고 그 위는 투명 유리다. 후면·측면 욕실 창은 전체가 frosted다. 색 #b7ccc0, roughness=.70, transmission=.28, geometry/renderer thickness=.018m, ior=1.5를 보존하고 나머지는 [전달 기본값](001-binding-and-scale.md#material-delivery)을 따른다. texture 없이 거친 투과의 근사로 쓴다. 창문 위에 입자 이미지를 붙여 시선 차단을 흉내 내지 않는다.

투명/반투명 경계의 높이와 개수, curtainwall의 각 실제 면은 spaces owner가 소유한다. [상태 검사](007-observation.md#material-state-samples)는 동일 opening에서 상하 band를 함께 관찰하고 ref04·05의 사생활 제어를 질문으로 유지한다. 반투명 유리가 세라믹처럼 완전히 불투명하거나 낮/밤 상태에서 열린 문과 혼동되면 실패다. 프라이버시 강화와 외부 차양의 새 설계는 이 보존 결정에서 승인된 것이 아니다.

## PV와 캐노피 구조 보존 {#pv-and-canopy}

<!--
@evidence principles/core/common.md#scope-preservation cassette70·girder3·rail44·post9, 거터·overflow·outlet과 PV texture·canopy-metal 전체를 보존 대상으로 받아, 재료 층 전체 변경이 v-076이 닫은 캐노피 부재를 건드리지 않게 한다.
@evidence principles/core/common.md#substantive-completion PV #b9cedb·.19·thickness .012·clearcoat .25와 canopy-metal #626e70·metallic .65·roughness .36을 바꾸지 않을 수치로 고정하고, alpha shadow 근사 유지와 검은 연속판 재발의 회귀 정의를 둔다.
@evidence principles/core/common.md#declared-basis 부재 수는 v-076이 닫은 roof-face, PV cell texture와 UV binding은 canopy-finish.ts, PV·canopy-metal 응답 수치는 Assembly.material에서 받고, 이를 재료 변경의 보존 경계로 삼는 것은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation roof-face는 캐노피 형상과 셀 간격을 소유한다. 이 H2는 새 주변 재료가 들어와도 캐노피 응답을 그대로 두는 보존 경계와 그 회귀를 주변 재료·전달의 결함으로 판정하는 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 셀·투명 여백의 치수는 roof-face geometry와 texture 반복, 반사와 alpha는 렌더 근사로 나누고 발전·각도별 투과·배수 능력을 주장하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 기존 미터 UV와 cell mask를 그대로 소비하고 새 재료 좌표나 finish를 PV·canopy 면에 겹쳐 쓰지 않는다는 호환 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address 외관·top·soffit의 셀 간격·frame·rail 리듬을 reference-material-samples의 지붕 회귀 표본에서 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work roof-face의 cassette·rail·girder·배수 부재와 셀 치수, envelope-interface의 module 등분, operative-subjects의 PV 비발전 경계를 대조했다. 보존에 필요한 값이 모두 부모에 있어 수리가 필요 없었다.
@evidence spaces/003-surface-ownership.md#roof-face v-076이 닫은 캐노피 부재·배수·셀 간격을 재료 변경의 보존 경계로 받는다.
@evidence spaces/002-spatial-graph.md#envelope-interface PV module의 최대 1.20×1.90m 등분과 0.04m gap을 보존할 반복으로 받아 새 texture 반복으로 대체하지 않는다.
@evidence settings/002-household.md#operative-subjects 태양광 모듈을 발전 주체가 아닌 보이는 부재로 두는 경계를 셀 표현이 발전 성능을 뜻하지 않는다는 한계로 옮긴다.
-->

v-076이 닫은 `roof.ts`의 cassette70·girder3·rail44·post9, 거터·overflow·outlet과 `canopy-finish.ts`의 PV cell baseColor/alpha texture·미터 UV binding·cell mask, [Assembly.material](../../src/house/assembly.ts)이 정하는 PV·canopy-metal 응답을 그대로 소비한다. 거터의 steel 거름망은 [보존 역할](006-wet-and-joinery.md#retained-surfaces)이 이름으로 받는다. PV의 현재 색 #b9cedb, roughness=.19, thickness=.012, clearcoat=.25 및 canopy-metal #626e70·metallic=.65·roughness=.36을 바꾸지 않는다. 태양광 셀·투명 여백의 수치와 반복은 [roof-face](../spaces/003-surface-ownership.md#roof-face)의 owner에 남긴다.

기존 하늘 반사와 alpha shadow 근사는 유지한다. 재료 작업이 canopy의 검은 연속판 증상을 재발시키면 새 주변 재료/전달의 회귀 결함이다. [지붕 회귀](007-observation.md#reference-material-samples)에서 외관·top·soffit의 셀 간격·프레임·rail 리듬을 대조한다. 실제 셀 발전 성능·각도별 투과율·구조와 배수 능력은 이 보존 판정의 범위가 아니다.
