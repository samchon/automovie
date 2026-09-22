# 유리와 닫힌 지붕 재료

## 커튼월 투명 유리 {#clear-glass}

현재 `*-pane-*` 중 glass 면은 기존 curtainwall owner가 유지한다. geometry의 0.018m 두께, ior=1.5, roughness=.09, metallic=0, opacity=1, alphaMode=opaque, clearcoat=0을 보존한다. day는 #d2e2dc·transmission=.94, private/night는 #526c64·transmission=.38이다. 이 숫자는 전기변색 유리의 광학 실측값이 아니라 현재 보이는 상태의 근사다. 새 상태나 프라이버시 보증을 추가하지 않는다.

texture는 없다. 유리의 반사는 동일한 기존 sky/PMREM과 주변 재료가 결정하며 가짜 하늘 사진·정면 glare 판을 붙이지 않는다. 앞뒤 면과 실내 가구의 보임, 낮과 사적 상태의 차이는 [상태 검사](007-observation.md#material-state-samples)와 ref01·03·05에서 관찰한다. 새 석재·목재 때문에 반사 대비가 바뀌는 것은 이번 재료 회귀 검사에 포함한다. 실제 가시광 투과율·열 성능·시선 차단 성능은 unverified다.

## 반투명 유리 {#frosted-glass}

lower privacy band 및 욕실의 frosted 면은 `facade.ts`가 생성한 그대로다. 색 #b7ccc0, roughness=.70, transmission=.28, geometry/renderer thickness=.018m, ior=1.5를 보존하고 나머지는 [전달 기본값](001-binding-and-scale.md#material-delivery)을 따른다. texture 없이 거친 투과의 근사로 쓴다. 창문 위에 입자 이미지를 붙여 시선 차단을 흉내 내지 않는다.

투명/반투명 경계의 높이와 개수, curtainwall의 각 실제 면은 spaces owner가 소유한다. [상태 검사](007-observation.md#material-state-samples)는 동일 opening에서 상하 band를 함께 관찰하고 ref04·05의 사생활 제어를 질문으로 유지한다. 반투명 유리가 세라믹처럼 완전히 불투명하거나 낮/밤 상태에서 열린 문과 혼동되면 실패다. 프라이버시 강화와 외부 차양의 새 설계는 이 보존 결정에서 승인된 것이 아니다.

## PV와 캐노피 구조 보존 {#pv-and-canopy}

v-076이 닫은 `roof.ts`의 cassette70·girder3·rail44·post9, 거터·overflow·outlet과 `canopy-finish.ts`의 PV baseColor/alpha texture, 미터 UV, cell mask, canopy-metal을 그대로 소비한다. PV의 현재 색 #b9cedb, roughness=.19, thickness=.012, clearcoat=.25 및 canopy-metal #626e70·metallic=.65·roughness=.36을 바꾸지 않는다. 태양광 셀·투명 여백의 수치와 반복은 [roof-face](../spaces/003-surface-ownership.md#roof-face)의 owner에 남긴다.

기존 하늘 반사와 alpha shadow 근사는 유지한다. 재료 작업이 canopy의 검은 연속판 증상을 재발시키면 새 주변 재료/전달의 회귀 결함이다. [지붕 회귀](007-observation.md#reference-material-samples)에서 외관·top·soffit의 셀 간격·프레임·rail 리듬을 대조한다. 실제 셀 발전 성능·각도별 투과율·구조와 배수 능력은 이 보존 판정의 범위가 아니다.
