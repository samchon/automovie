# 유리와 닫힌 지붕 재료

## 커튼월 투명 유리 {#clear-glass}

<!--
@evidence principles/core/common.md#scope-preservation 모든 curtainwall pane 중 glass 면과 day·private/night 두 상태를 이 마감에 두고, 새 광학 상태·프라이버시 보증·glare 판은 만들지 않는다고 적어 투명 유리의 약속 범위를 닫는다.
@evidenceReview principles/core/common.md#scope-preservation  투명 pane의 day와 두 사적 상태가 같은 창호 면을 공유한다. 추가 glare 판이나 차폐 성능을 약속하지 않아 유리 마감의 범위가 닫힌다.
@evidence principles/core/common.md#substantive-completion 0.018m, ior 1.5, roughness .09, day #d2e2dc·transmission .94와 private/night #526c64·.38을 정해 구현이 유리 상태값을 고르지 않는다.
@evidenceReview principles/core/common.md#substantive-completion  본문의 색·transmission 두 쌍과 공통 roughness·ior·thickness가 모두 수치다. source가 제3의 유리 상태를 고를 여지가 없다.
@evidence principles/core/common.md#declared-basis 상태의 의미는 privacy-states, 유리 두께는 glazing-interface 단면에서 받고, 색·투과 수치는 전기변색 실측이 아닌 현재 보이는 상태의 저작 근사라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis  privacy-states가 상태 의미를, glazing-interface가 실제 판 두께를 준다. 투과값은 이 재료의 렌더 근사로 분리돼 실측 전기변색 성능이 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation privacy-states는 낮의 투명 유리와 사적 상태의 tint를, glazing-interface는 실제 pane와 두께를 준다. 이 H2는 상태별 native baseColor·transmission 쌍과 공통 roughness·ior를 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  부모 pane 형상과 낮/사적 구분 위에 이 H2가 상태별 native 응답값을 더한다. 두 상태를 따로 모델링하는 형상 결정은 없다.
@evidence principles/design/materials.md#material-construction-appearance 형상 두께 0.018m와 렌더 thickness·ior를 맞추되 transmission은 가시광 투과율·열 성능이 아니라고 분리해 광학 근사를 제품 성능으로 읽지 않게 한다.
@evidenceReview principles/design/materials.md#material-construction-appearance  0.018m의 실제 유리 단면과 renderer thickness를 함께 쓴다. transmission을 열 성능이나 인증 투과율로 해석하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 기존 curtainwall owner의 pane 면에만 결합하고 texture가 없어 좌표 요구가 없으며, 반사는 기존 sky·PMREM과 주변 재료가 정한다는 호환 조건을 둔다.
@evidenceReview principles/design/materials.md#material-binding-interface  기존 `*-pane-*`의 glass 면에만 연결되고 texture UV를 요구하지 않는다. 가짜 sky 사진은 반사 owner를 새로 만들지 못한다.
@evidence principles/design/materials.md#material-verification-address 낮/사적 상태 차이와 앞뒤 면·실내 가구의 보임을 material-state-samples와 ref01·03·05에서 반증하고, 새 석재·목재가 바꾼 반사 대비를 회귀 표본에 넣는다.
@evidenceReview principles/design/materials.md#material-verification-address  동일 창의 앞뒤 면과 가구 시야를 낮/사적 쌍으로 열어 볼 수 있다. 석재·목재 변경 뒤 반사 대비도 회귀 질문으로 남는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work privacy-states의 공용부·계단 투명과 사적 tint, glazing-interface의 유리 n=-0.009..0.009 단면, 투명 opening들의 pane 분할을 대조했다. 부모가 상태와 두께를 이미 정해 재료가 수리할 결함이 없었다.
@evidenceExcludeReview upstream/design/materials.md#parent-revision-from-material-work  공용부·계단 투명 pane와 사적 tint, pane 단면은 이미 부모에 있다. 이 H2가 선택한 색·투과 숫자는 부모의 결함을 뜻하지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 공용부·계단 유리의 낮 투명과 사적 tint를 두 baseColor·transmission 쌍으로 구현 입력화한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states  같은 pane에 day의 높은 투과와 private/night의 짙은 tint가 쓰인다. 공용부·계단의 위치는 privacy-states에서 바꾸지 않는다.
@evidence settings/001-production.md#production-visual-grammar 청회색 유리라는 재료 관계를 day #d2e2dc의 옅은 청록 기색과 낮은 roughness로 둔다.
@evidenceReview settings/001-production.md#production-visual-grammar  청회색 유리 관계가 낮 상태의 옅은 청록 기준색으로 구체화된다. 구조에서 없는 glare 판을 색 관계라는 이유로 추가하지 않는다.
@evidence spaces/003-surface-ownership.md#glazing-interface 유리 단면 n=-0.009..0.009가 주는 0.018m 두께를 geometry·renderer thickness로 받는다.
@evidenceReview spaces/003-surface-ownership.md#glazing-interface  공간 pane의 n 양쪽 단면이 18mm를 이룬다. 재료는 그 면을 소비하고 유리 두께를 다시 배치하지 않는다.
@evidence spaces/003-surface-ownership.md#rear-common-glazing 후면 공용부의 전폭 투명 pane이 ref03의 정원 시야를 주는 대표 면으로 이 마감을 받는다.
@evidenceReview spaces/003-surface-ownership.md#rear-common-glazing  후면 공용부 전폭의 투명 pane는 정원 시야를 유지할 표본이다. 해당 glazing의 mullion 개수를 재료가 변경하지 않는다.
@evidence spaces/003-surface-ownership.md#front-stair-glazing 계단실 두 층의 투명 pane이 ref01 외관에서 실내 계단과 빛을 보이는 면으로 이 마감을 받는다.
@evidenceReview spaces/003-surface-ownership.md#front-stair-glazing  전면 계단의 두 층 pane를 투명 역할로 받는다. 어두운 프레임 뒤 계단이 보여야 하는 외관 질문은 이 상태의 반증 대상이다.
@evidence spaces/003-surface-ownership.md#right-common-glazing 공용부 측면창의 투명 pane이 후면과 같은 상태 쌍을 받아 두 면의 유리가 다르게 읽히지 않는다.
@evidenceReview spaces/003-surface-ownership.md#right-common-glazing  공용부 측면과 후면 pane는 같은 day/private 쌍을 사용한다. 방 방향마다 별도 임의 투과율을 만들지 않는다.
-->

현재 `*-pane-*` 중 glass 면은 기존 curtainwall owner가 유지한다. [창호 인터페이스](../spaces/003-surface-ownership.md#glazing-interface) 단면의 0.018m 유리 두께, ior=1.5, roughness=.09, metallic=0, opacity=1, alphaMode=opaque, clearcoat=0을 보존한다. day는 #d2e2dc·transmission=.94, private/night는 #526c64·transmission=.38이다. 상태의 의미는 [프라이버시 상태](../settings/003-spatial-basis.md#privacy-states)를 따른다. 그 canon이 낮 상태에서 작업실·침실 하부 시선대 위에 두는 '더 밝은 tint 유리'는 이 낮 투명 유리이며, 공용부 유리와 같은 값으로 하부 frosted보다 밝게 보인다. 이 숫자는 전기변색 유리의 광학 실측값이 아니라 현재 보이는 상태의 근사다. 새 상태나 프라이버시 보증을 추가하지 않는다.

texture는 없다. 유리의 반사는 동일한 기존 sky/PMREM과 주변 재료가 결정하며 가짜 하늘 사진·정면 glare 판을 붙이지 않는다. 앞뒤 면과 실내 가구의 보임, 낮과 사적 상태의 차이는 [상태 검사](007-observation.md#material-state-samples)와 ref01·03·05에서 관찰한다. 새 석재·목재 때문에 반사 대비가 바뀌는 것은 이번 재료 회귀 검사에 포함한다. 실제 가시광 투과율·열 성능·시선 차단 성능은 unverified다.

## 반투명 유리 {#frosted-glass}

<!--
@evidence principles/core/common.md#scope-preservation 작업실·침실 하부 privacy band와 욕실 전체 frosted 면을 facade가 만든 그대로 받고, 프라이버시 강화나 외부 차양의 새 설계는 이 보존 결정에서 승인하지 않는다고 경계를 적는다.
@evidenceReview principles/core/common.md#scope-preservation  작업실·침실 하부와 욕실 전체가 이미 frosted 면이다. 새 차양이나 프라이버시 강화 기능을 이 보존 항목에서 승인하지 않는다.
@evidence principles/core/common.md#substantive-completion #b7ccc0, roughness .70, transmission .28, thickness .018, ior 1.5를 정해 반투명 표현값을 구현이 고르지 않는다.
@evidenceReview principles/core/common.md#substantive-completion  반투명 면의 색·roughness·transmission·thickness가 명시돼 있다. source가 흰 불투명 플라스틱으로 대체할 근거가 없다.
@evidence principles/core/common.md#declared-basis 고정 반투명 층의 존재와 위치는 privacy-states와 각 opening H2에서 받고, 거친 투과의 수치는 이 층의 근사 선택이라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis  하부 band의 위치는 privacy와 opening 설계에서 온다. 거친 투과 숫자는 이 층 선택이며 실제 차폐 시험값이 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation privacy-states는 고정 반투명 영역의 상태 의미를, glazing-interface와 rear-bath-glazing 등 창 H2는 그 pane 위치를 준다. 이 H2는 roughness .70과 transmission .28의 scalar 응답으로 거친 투과를 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  부모들은 pane의 범위와 상태를 준다. 이 H2가 roughness .70과 transmission .28을 붙여 선명 투명 유리와 다른 외관을 만든다.
@evidence principles/design/materials.md#material-construction-appearance 유리 두께 형상은 유지하고 거친 투과는 렌더 근사일 뿐 시선 차단 성능이 아니라고 나눠, 반투명 외관을 프라이버시 보증으로 읽지 않게 한다.
@evidenceReview principles/design/materials.md#material-construction-appearance  실제 유리 두께는 그대로인데 renderer의 거친 투과는 보이는 근사다. 반투명함으로 시선 차단 성능을 인증하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 투명/반투명 경계의 높이·개수와 각 면은 spaces owner가 소유하고 재료는 texture 좌표 없이 그 면에만 결합한다는 호환 조건을 둔다.
@evidenceReview principles/design/materials.md#material-binding-interface  band의 상단과 pane 수는 공간 owner가 정한다. texture 없는 scalar 재료가 그 면에만 결합하므로 UV 좌표 충돌이 없다.
@evidence principles/design/materials.md#material-verification-address 같은 opening의 상하 band를 material-state-samples에서 함께 보고, 세라믹처럼 완전히 불투명하거나 낮·밤 상태에서 열린 문과 혼동되면 실패로 둔다.
@evidenceReview principles/design/materials.md#material-verification-address  같은 opening의 위아래를 함께 보면 완전 불투명 오류를 검출할 수 있다. 열린 문 상태와 섞이는 오해도 별도 상태 표본이 묻는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work privacy-states의 하부 시선대와 욕실 고정층, glazing-interface의 하부 띠 상단 F=min(head, S+1.25)와 욕실 창 전체 frosted를 대조했다. 부모가 위치와 상태를 정했고 재료는 응답만 더했다.
@evidenceExcludeReview upstream/design/materials.md#parent-revision-from-material-work  privacy-states의 하부 시선대와 glazing-interface의 상단 규칙이 충분하다. 이 H2는 그 면의 광학 응답만 더하고 부모 band 높이를 고치지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 작업실·침실 하부 시선대와 욕실 전체의 고정 반투명 층을 이 응답으로 받는다.
@evidenceReview settings/003-spatial-basis.md#privacy-states  작업실·침실 하부 및 욕실 전체를 같은 고정 응답으로 받는다. day 상태에서 frosted 위치를 없애지 않는다.
@evidence spaces/003-surface-ownership.md#glazing-interface bay의 sill부터 min(head, sill+1.25)까지와 욕실 창 전체의 frosted pane 면을 공간 owner에게서 받아 roughness·transmission을 결합한다.
@evidenceReview spaces/003-surface-ownership.md#glazing-interface  각 bay의 sill에서 1.25m까지인 면만 반투명이다. 그 위 투명 pane를 재료가 가로막지 않는다.
@evidence spaces/003-surface-ownership.md#rear-bath-glazing 후면 욕실 창 전체가 모든 상태에서 이 frosted 응답을 유지한다.
@evidenceReview spaces/003-surface-ownership.md#rear-bath-glazing  후면 욕실 창 전체는 상태가 바뀌어도 고정 frosted다. 하부 band만 받는 침실 창과 혼동되지 않는다.
@evidence spaces/003-surface-ownership.md#right-bath-glazing 욕실 측면창 전체가 같은 frosted 응답을 받아 두 욕실 창의 프라이버시 읽힘이 같다.
@evidenceReview spaces/003-surface-ownership.md#right-bath-glazing  측면 욕실 pane에도 후면 욕실과 같은 고정 응답을 붙인다. 방 안쪽 방향 때문에 투명 유리로 바꾸지 않는다.
@evidence spaces/003-surface-ownership.md#front-flex-glazing 작업실 전면창의 sill부터 1.25m 하부 band가 frosted를 받고 위쪽은 투명 유리로 남는다.
@evidenceReview spaces/003-surface-ownership.md#front-flex-glazing  전면 작업실의 아래 띠만 frosted를 받는다. 위쪽 시야와 문 opening은 별도 공간 면으로 남는다.
@evidence spaces/003-surface-ownership.md#front-bedroom-glazing 상층 침실 전면창에서 하층 작업실 jamb 분할선으로 나뉜 bay마다 sill부터 1.25m band가 frosted를 받는다.
@evidenceReview spaces/003-surface-ownership.md#front-bedroom-glazing  상층 전면 침실의 분할 bay마다 하단 frosted가 따라간다. 하층 창 jamb를 재료가 새 pane 분할선으로 발명하지 않는다.
@evidence spaces/003-surface-ownership.md#rear-bedroom-glazing 주침실 후면창의 bay마다 하부 band가 frosted를 받는다.
@evidenceReview spaces/003-surface-ownership.md#rear-bedroom-glazing  주침실 후면의 각 bay 아래 시선대가 반투명이다. 정원 방향 전체를 불투명 wall처럼 처리하지 않는다.
@evidence spaces/003-surface-ownership.md#left-flex-glazing 작업실 측면창의 하부 band가 frosted를 받는다.
@evidenceReview spaces/003-surface-ownership.md#left-flex-glazing  작업실 측면창의 lower band에만 거친 투과를 붙인다. 측면 frame과 shade 금속은 이 유리가 아니다.
@evidence spaces/003-surface-ownership.md#left-bedroom-glazing 작은 침실 1 측면창의 하부 band가 frosted를 받는다.
@evidenceReview spaces/003-surface-ownership.md#left-bedroom-glazing  작은 침실 1의 측면 시선대는 고정 frosted다. 상단 pane는 clear-glass 역할을 유지한다.
@evidence spaces/003-surface-ownership.md#left-child-two-glazing 높은 sill 3.90에서 시작하는 작은 침실 2 창의 하부 1.25m가 frosted, 나머지 위쪽이 투명으로 나뉜다.
@evidenceReview spaces/003-surface-ownership.md#left-child-two-glazing  높은 sill에서 시작하는 작은 침실 2 창도 그 sill 기준 1.25m만 frosted다. 지면에서 같은 높이로 band를 재설정하지 않는다.
-->

[프라이버시 상태](../settings/003-spatial-basis.md#privacy-states)의 하부 시선대와 욕실 고정 반투명 층, 곧 lower privacy band 및 욕실의 frosted 면은 `facade.ts`가 생성한 그대로다. 작업실·침실 창의 하부 band는 [창호 인터페이스](../spaces/003-surface-ownership.md#glazing-interface)의 F=min(head, S+1.25)대로 bay마다 sill부터 min(head, sill+1.25)까지, 곧 현재 창에서 sill부터 1.25m이고 그 위는 투명 유리다. 후면·측면 욕실 창은 전체가 frosted다. 색 #b7ccc0, roughness=.70, transmission=.28, geometry/renderer thickness=.018m, ior=1.5를 보존하고 나머지는 [전달 기본값](001-binding-and-scale.md#material-delivery)을 따른다. texture 없이 거친 투과의 근사로 쓴다. 창문 위에 입자 이미지를 붙여 시선 차단을 흉내 내지 않는다.

투명/반투명 경계의 높이와 개수, curtainwall의 각 실제 면은 spaces owner가 소유한다. [상태 검사](007-observation.md#material-state-samples)는 동일 opening에서 상하 band를 함께 관찰하고 ref04·05의 사생활 제어를 질문으로 유지한다. 반투명 유리가 세라믹처럼 완전히 불투명하거나 낮/밤 상태에서 열린 문과 혼동되면 실패다. 프라이버시 강화와 외부 차양의 새 설계는 이 보존 결정에서 승인된 것이 아니다.

## PV와 캐노피 구조 보존 {#pv-and-canopy}

<!--
@evidence principles/core/common.md#scope-preservation cassette70·girder3·rail44·post9, 거터·overflow·outlet과 PV texture·canopy-metal 전체를 보존 대상으로 받아, 재료 층 전체 변경이 v-076이 닫은 캐노피 부재를 건드리지 않게 한다.
@evidenceReview principles/core/common.md#scope-preservation  캐노피 cassette·girder·rail·post와 배수 부재를 그대로 남기는 보존 범위가 명시됐다. 새 마감이 PV frame을 자기 것으로 가져가지 않는다.
@evidence principles/core/common.md#substantive-completion PV #b9cedb·.19·thickness .012·clearcoat .25와 canopy-metal #626e70·metallic .65·roughness .36을 바꾸지 않을 수치로 고정하고, alpha shadow 근사 유지와 검은 연속판 재발의 회귀 정의를 둔다.
@evidenceReview principles/core/common.md#substantive-completion  PV와 canopy-metal의 기존 색·응답값이 숫자로 고정돼 있다. 검은 연속판 재발을 회귀 실패로 정의하므로 보존은 단순 이름 목록이 아니다.
@evidence principles/core/common.md#declared-basis 부재 수는 v-076이 닫은 roof-face, PV cell texture와 UV binding은 canopy-finish.ts, PV·canopy-metal 응답 수치는 Assembly.material에서 받고, 이를 재료 변경의 보존 경계로 삼는 것은 이 층의 선택이다.
@evidenceReview principles/core/common.md#declared-basis  부재 수는 roof 설계에서, 셀 texture는 기존 source에서, 재료 응답은 Assembly에서 왔다. 이 H2는 그 사실을 신규 마감의 불변 경계로 채택한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation roof-face는 캐노피 형상과 셀 간격을 소유한다. 이 H2는 새 주변 재료가 들어와도 캐노피 응답을 그대로 두는 보존 경계와 그 회귀를 주변 재료·전달의 결함으로 판정하는 규칙을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  roof-face가 모듈 형상을 소유한다. 주변 finish를 바꾸더라도 PV 셀 리듬을 유지해야 한다는 회귀 판단은 이 재료 H2의 추가 결정이다.
@evidence principles/design/materials.md#material-construction-appearance 셀·투명 여백의 치수는 roof-face geometry와 texture 반복, 반사와 alpha는 렌더 근사로 나누고 발전·각도별 투과·배수 능력을 주장하지 않는다.
@evidenceReview principles/design/materials.md#material-construction-appearance  셀과 투명 여백은 지붕 형상과 mask의 문제다. 반사·alpha 그림자는 시각 근사이고 발전 또는 배수 성능으로 승격되지 않는다.
@evidence principles/design/materials.md#material-binding-interface 기존 미터 UV와 cell mask를 그대로 소비하고 새 재료 좌표나 finish를 PV·canopy 면에 겹쳐 쓰지 않는다는 호환 조건을 둔다.
@evidenceReview principles/design/materials.md#material-binding-interface  현재 PV의 미터 UV와 cell mask를 그대로 쓰는 경계가 있다. 새 목재·석재 UV를 캐노피에 덧붙이지 않는다.
@evidence principles/design/materials.md#material-verification-address 외관·top·soffit의 셀 간격·frame·rail 리듬을 reference-material-samples의 지붕 회귀 표본에서 대조한다.
@evidenceReview principles/design/materials.md#material-verification-address  외관뿐 아니라 top과 soffit에서 module 틈, frame, rail 리듬을 볼 표본을 적었다. 정면 한 장으로 지붕 하부를 통과시키지 않는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work roof-face의 cassette·rail·girder·배수 부재, roof owner의 canopy-finish.ts 셀 치수, envelope-interface의 module 등분, operative-subjects의 PV 비발전 경계를 대조했다. 보존에 필요한 값이 모두 부모에 있어 수리가 필요 없었다.
@evidenceExcludeReview upstream/design/materials.md#parent-revision-from-material-work  roof-face의 구조와 module 등분, PV가 비발전 주체라는 설정이 보존에 충분하다. 새 주변 재료가 잘못 보이더라도 부모의 셀 치수를 재설계할 사유는 아니다.
@evidence spaces/003-surface-ownership.md#roof-face v-076이 닫은 캐노피 부재·배수·셀 간격을 재료 변경의 보존 경계로 받는다.
@evidenceReview spaces/003-surface-ownership.md#roof-face  roof owner가 닫은 캐노피와 배수 주소를 그대로 소비한다. material 변경이 support나 gutter의 부품 수를 늘리지 않는다.
@evidence spaces/002-spatial-graph.md#envelope-interface PV module의 최대 1.20×1.90m 등분과 0.04m gap을 보존할 반복으로 받아 새 texture 반복으로 대체하지 않는다.
@evidenceReview spaces/002-spatial-graph.md#envelope-interface  1.20×1.90m 이하 module과 0.04m gap은 geometry의 반복이다. 텍스처의 셀 무늬로 그 간격을 대체하지 않는다.
@evidence settings/002-household.md#operative-subjects 태양광 모듈을 발전 주체가 아닌 보이는 부재로 두는 경계를 셀 표현이 발전 성능을 뜻하지 않는다는 한계로 옮긴다.
@evidenceReview settings/002-household.md#operative-subjects  PV는 보이는 roof 부재이며 발전 과정의 상태 주체는 아니다. 반사나 alpha 조정으로 전력 생산을 보증하지 않는다.
-->

v-076이 닫은 `roof.ts`의 cassette70·girder3·rail44·post9와 endplate·support base/cap/flashing, 거터·overflow·outlet, 지붕 fascia·drip, `right.ts`의 canopy-metal 배수관·collar·clip·inspection body와 `canopy-finish.ts`의 PV cell baseColor/alpha texture·미터 UV binding·cell mask, [Assembly.material](../../src/house/assembly.ts)이 정하는 PV·canopy-metal 응답을 그대로 소비한다. 거터의 steel 거름망, cassette 체결 bolt·head, support anchor는 [보존 역할](006-wet-and-joinery.md#retained-surfaces)이 이름으로 받는다. PV의 현재 색 #b9cedb, roughness=.19, thickness=.012, clearcoat=.25 및 canopy-metal #626e70·metallic=.65·roughness=.36을 바꾸지 않는다. 태양광 셀·투명 여백의 수치와 반복은 [roof-face](../spaces/003-surface-ownership.md#roof-face)의 owner에 남긴다.

기존 하늘 반사와 alpha shadow 근사는 유지한다. 재료 작업이 canopy의 검은 연속판 증상을 재발시키면 새 주변 재료/전달의 회귀 결함이다. [지붕 회귀](007-observation.md#reference-material-samples)에서 외관·top·soffit의 셀 간격·프레임·rail 리듬을 대조한다. 실제 셀 발전 성능·각도별 투과율·구조와 배수 능력은 이 보존 판정의 범위가 아니다.
