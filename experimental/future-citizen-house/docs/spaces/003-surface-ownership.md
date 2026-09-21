# 외피의 공간 경계

## 완결 표면과 공유 접합 {#whole-surface-owners}

<!--
@evidence settings/001-production.md#production-visual-grammar 불투명 서비스 벽·틀·유리·차양을 서로 다른 공간 점유로 구별해 시각 문법의 실제 부재 기반을 제공한다. 색과 광학·조명 구현의 성공을 공간 문서에서 주장하지 않는다.
-->

<!--
@evidence principles/core/common.md#declared-basis 본채와 표면 분해 선언을 받아 외피를 네 입면과 지붕으로 나누고 datum에서 두께와 층선을 받는다.
@evidence principles/core/common.md#scope-preservation 외벽·개구·틀·shade·return을 각 완결 표면의 범위에 남기고 실내 floor/ceiling 책임도 연결한다.
@evidence principles/core/common.md#substantive-completion 입면·층·방의 접합 책임과 외부 boundary의 enclosing house를 지정하여 외피에 이중 소유나 무소유 면을 남기지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 단독 표면 소유를 실제 외피의 다섯 face와 내외 마감 및 corner 접합의 공간 관계로 전개한다.
@evidence principles/design/spaces.md#space-topology 외부 전체 face는 house를 둘러싸고 개별 room/storey의 창 대응은 opening과 cell 위치에서 판정한다.
@evidence principles/design/spaces.md#space-boundary-authority 외곽·층선·두께는 mass datum 하나를 쓰며 입면이 room별 창폭을 따로 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address normal·thickness·접합선·opening profile·층선 일치를 전체 공간 관찰에 연결하고 현재 형상은 unverified로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단일 본채와 완결 표면의 단독 소유를 다섯 외피면 및 층/방 접합에 대조했다. 부모의 표면을 더 쪼개거나 별도 체적을 허용할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 단일 직사각형 외피가 내부 방·층 경계를 소비하도록 하며 화면을 위해 고정 그래프를 바꾸지 않는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 각 입면이 구조 return·창호·shade·마감을 함께 맡고 층·방과의 최종 면 중복을 금지하는 소유 배정을 소비한다.
-->

[house](001-citizen-house.md#citizen-house-space)의 외피는 [전면](#front-face), [후면](#rear-face), [좌측](#left-face), [우측](#right-face), [지붕](#roof-face)의 다섯 완결 표면이다. 각 면은 하나의 owner가 모든 구조 return·개구·틀·shade·마감을 소유한다. 작성자와 source 파일은 [분해 선언](../settings/003-spatial-basis.md#surface-decomposition)을 따른다. 개구부 H2는 같은 입면 내부의 주소이며 작성자를 분할하지 않는다.

[매스와 층 datum](002-spatial-graph.md#mass-and-storeys)이 외주·층선·두께를 소유한다. 입면은 그 외벽 두께 안에서 실내 clear face와 외부 face를 잇는다. 외부 모서리는 [모서리 접합](#envelope-corners)의 대각 분할에서 만나고, 층간 spandrel은 해당 floor line을 따른다. 층 owner가 수평 실내 floor/ceiling 최종 면과 내부 구조 wall 몸체를 만들며 입면 owner가 외부 wall과 glazing assembly를 닫는다. 각 방 owner는 외벽의 실내 마감만 맡고 유리와 같은 최종 면을 중복 생성하지 않는다.

네 전체 입면 boundary의 enclosing space는 house다. 각 opening이 면하는 room/storey는 해당 opening H2와 실제 cell 위치를 대조한다. 내부 shared boundary처럼 서로 다른 두 방을 외부 한 면의 spaces 목록에 나열하지 않는다. 입면의 수직 범위는 ground floor부터 upper ceiling까지이며 그 사이 floor band도 같은 입면이 닫는다.

[시각 문법](../settings/001-production.md#production-visual-grammar)이 구별하는 불투명 서비스 벽·금속 틀·유리·차양은 같은 외주 안에서 서로 다른 실제 점유를 가진다. 여기서는 그 공간 경계만 정하고 색·광학·빛의 구현은 후속 source에서 이 canon을 소비한다.

각 face의 실제 boundary normal·thickness·접합선·opening profile과 바닥선 일치를 [전체 공간 관찰](001-citizen-house.md#spatial-observation)에서 검사한다. 현재 형상·재료 관찰은 unverified다.

## 전면 전체 {#front-face}

<!--
@evidence principles/core/common.md#declared-basis 외피 canon의 전면 계단실·작업실·상층 일부 유리와 코어를 -Z face에 배정하며 실제 plane은 mass에서 도출한다.
@evidence principles/core/common.md#scope-preservation 목재 현관문·계단 유리·작업실 유리·코어와 층간 spandrel을 같은 전면의 실제 부재 범위로 남긴다.
@evidence principles/core/common.md#substantive-completion outward -Z, plane 도출, 전체 폭과 네 opening owner 및 나머지 벽 폐쇄를 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 코어 -X와 출입문의 상대 배치는 외피 canon에서 받고, 전면 plane 도출과 층별 네 opening의 cut·spandrel 조립을 이 입면에서 추가한다.
@evidence principles/design/spaces.md#space-topology 전면 외주는 house의 -Z 경계이고 실제 cut만 외부/실내를 잇거나 고정 유리로 구분한다.
@evidence principles/design/spaces.md#space-boundary-authority front plane은 외측/내측 z 평균이며 각 cut은 지정 opening이 소유하여 별도 façade 문 좌표를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 같은 층 cut 겹침·jamb의 room 경계 침범을 실패로 두고 정면·corner·실내 역방향을 대조한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면의 계단 유리와 단일 현관 및 우측 코어를 현재 room 외주에 대조했다. 외관 때문에 추가 체적이나 부모 동선 변경을 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 계단실과2층 일부의 유리를 방·층선에 맞추고 현관을 실제 cut과 목재문으로 남긴다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy 전면 계단실·작업실·상층 일부 유리와 우측 opaque core를 네 개구 owner 및 닫힌 벽에 대응시킨다.
-->

전면은 [매스](002-spatial-graph.md#mass-and-storeys)의 -Z 외벽이며 outward normal은 -Z다. plane center는 외측 z와 실내 front clear z의 평균, span은 본채 전체 x 폭이고 각 층의 floor–ceiling을 구분한다. 불투명 코어·계단 유리·목재 현관문·작업실 유리가 같은 외주에 놓인다.

[현관문](002-spatial-graph.md#front-entry), [계단실 유리](#front-stair-glazing), [작업실 유리](#front-flex-glazing), [상층 침실 유리](#front-bedroom-glazing)가 실제 cut을 소유한다. 나머지 외벽은 닫힌 벽과 층간 spandrel이다. 같은 층의 cut이 겹치거나 jamb가 방 경계를 가르면 실패다. 코어는 전면 화면 오른쪽인 -X에 놓이고 출입문은 계단실보다 화면 왼쪽에 놓인다. [외피 canon](../settings/003-spatial-basis.md#envelope-and-privacy)을 소비하며 외부 정면·모서리·각 opening과 실내 역방향 관찰에서 양쪽이 같은 경계인지 검사한다.

## 후면 전체 {#rear-face}

<!--
@evidence principles/core/common.md#declared-basis 후면 대부분의 curtainwall을 +Z 외주에 배정하고 common·primary·bath의 실제 room 경계에서 개구를 받는다.
@evidence principles/core/common.md#scope-preservation 공용부와 주침실의 넓은 유리 및 욕실 privacy 개구와 층선 폐쇄를 모두 남긴다.
@evidence principles/core/common.md#substantive-completion +Z normal과 plane 입력, 세 opening 및 room end의 closure를 정하여 두 층 후면을 완결한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 유리 요구를 공용부·주침실·욕실의 서로 다른 span과 그 사이 벽 끝의 대응으로 세분화한다.
@evidence principles/design/spaces.md#space-topology 하나의 house 후면 경계에 두 층의 room별 opening을 붙이고 욕실과 침실을 한 opening으로 합치지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 창 끝은 room clear face를 소비하고 plane은 mass의 rear z에서 도출해 외피 자체의 다른 방 폭을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 후면 corner·floor line·각 창과 방 안 시야에서 욕실/주침실 shared wall 끝과 closure의 불일치를 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 후면 유리와 위생 프라이버시를 상층 욕실·주침실 경계에 대조했다. 욕실 벽을 지우거나 부모 방 구성을 바꿔야 할 모순은 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 후면 대부분에 curtainwall을 두면서 바닥선과 욕실·침실 경계를 glass panel이 가로지르지 않게 한다.
-->

후면은 [매스](002-spatial-graph.md#mass-and-storeys)의 +Z 외벽이며 outward normal은 +Z다. plane center는 외측 z와 실내 rear clear z의 평균이다. [공용부 유리](#rear-common-glazing)와 [주침실 유리](#rear-bedroom-glazing)가 주된 개구이고 [욕실 유리](#rear-bath-glazing)는 privacy opening이다. 나머지는 층선·room end에 일치하는 닫힌 벽이다.

창호의 끝은 각 방의 clear face를 소비하며 상층 욕실과 주침실 사이 내벽 끝에 mullion/opaque closure가 닿는다. [관찰](001-citizen-house.md#spatial-observation)은 두 층 floor line·rear corner·각 opening과 해당 방 안 시야를 동시에 묻는다.

## 좌측 전체 {#left-face}

<!--
@evidence principles/core/common.md#declared-basis 전면 관찰 기준 좌측을 +X로 정한 좌표 관례에 따라 작업실과 두 작은 침실의 측면 창을 배정한다.
@evidence principles/core/common.md#scope-preservation 각 방의 창과 나머지 불투명 벽 및 앞뒤 return을 남겨 전 측면을 무차별 유리로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion +X normal·plane 입력과 세 opening owner, room별 z span 소비 및 모서리 책임을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 측면 외피를 전면 작업실/상층 두 침실에 대응하는 세 개구와 불투명 잔여 면으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 동측 house 외주에서 각 창은 자기 room에 면하며 한 opening이 서로 다른 침실을 잇지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 외측/clear maxX 평균을 plane으로 쓰고 각 room의 z 범위를 소비하여 창을 위해 방 경계를 늘리지 않는다.
@evidence principles/design/spaces.md#space-verification-address 양 corner와 각 opening의 실내 역방향에서 두께·room 끝·return이 같은 경계인지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단순한 본채 외피와 독립 room 조건을 세 측면 창에 대조했다. 추가 유리 체적이나 방 통합으로 부모를 수정할 이유가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 측면 창도 방 경계와 층선에 맞추어 고정 room 그래프 안의 외피로 남긴다.
-->

좌측은 전면 관찰 화면 기준 +X 면이다. [매스](002-spatial-graph.md#mass-and-storeys)의 동측 외벽을 사용하고 outward normal은 +X다. plane center는 외측 x와 실내 maxX의 평균이다. [작업실 측면 유리](#left-flex-glazing), [작은 침실 1 측면 유리](#left-bedroom-glazing), [작은 침실 2 창](#left-child-two-glazing)을 제외한 경계는 불투명이다.

창이 서로 다른 방을 한 opening으로 잇지 않도록 각 room의 z 범위를 사용한다. 외벽의 내측은 해당 room, 외측과 모서리 return은 이 입면 owner다. [관찰](001-citizen-house.md#spatial-observation)은 앞뒤 모서리·각 opening·실내 역방향에서 두께와 방 경계를 확인한다.

## 우측 전체 {#right-face}

<!--
@evidence principles/core/common.md#declared-basis 전면 화면 우측 -X 코어를 서측 외주로 해석하고 후방 공용부·욕실 창만 배정한다.
@evidence principles/core/common.md#scope-preservation 앞쪽 위생·수납·설비의 불투명 벽을 유지하고 후단의 두 층 창과 corner return도 생략하지 않는다.
@evidence principles/core/common.md#substantive-completion -X normal·plane 입력과 두 창 owner, 공유 z span 및 floor 대응을 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 우측 opaque core 요구에 후면 두 층의 제한된 창과 전면 폐쇄라는 실제 면 배치를 더한다.
@evidence principles/design/spaces.md#space-topology 서측 house boundary는 코어를 닫고 후단의 각 room에만 지정된 opening이 면한다.
@evidence principles/design/spaces.md#space-boundary-authority minX의 외측/내측 평균에서 plane을 구하고 창의 z span은 opening owner를 소비한다.
@evidence principles/design/spaces.md#space-verification-address side 전체·이음·뒤 corner·각 창의 내부 privacy를 관찰하여 코어 노출과 빠진 return을 검출한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 불투명 코어와 후방 채광을 현재 room 배치에 대조해 설비를 다른 입면으로 옮기는 부모 수정이 필요하지 않다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 위생·수납·설비는 우측 불투명 벽 안에 두고 필요한 후단 창도 내부 바닥선과 일치시킨다.
-->

우측은 전면 관찰 화면 기준 -X 서비스 코어 면이다. [매스](002-spatial-graph.md#mass-and-storeys)의 서측 외벽을 사용하고 outward normal은 -X다. plane center는 외측 x와 실내 minX의 평균이다. 전면의 위생·수납·설비 영역을 닫고 후면에 [공용부 측면 유리](#right-common-glazing)와 [욕실 측면 유리](#right-bath-glazing)를 둔다.

큰 불투명 벽체는 위생·설비를 가리며 후면 두 층의 개구는 같은 z span에서 floor line에 맞춘다. [관찰](001-citizen-house.md#spatial-observation)은 side 전체, 벽 이음·각 opening·뒤 모서리와 실내 privacy를 묻는다.

## 지붕과 캐노피 {#roof-face}

<!--
@evidence principles/core/common.md#declared-basis 평지붕과 PV 캐노피 요구에0.12m edge·0.10m drip 및 명시 canopy span과 높이를 저작값으로 정했다.
@evidence principles/core/common.md#scope-preservation roof 전체와 PV·지지·상면·노출 하부를 남기며 박공·굴뚝·옥상 출입을 새로 발명하지 않는다.
@evidence principles/core/common.md#substantive-completion roof datum과 canopy의 평면·underside·깊이·짧은 지지 및 반복 인터페이스를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 평지붕/PV의 개괄 형식을 본채 밖의 얇은 canopy 범위와 roof edge·drip 결합으로 전개한다.
@evidence principles/design/spaces.md#space-topology 지붕은 본채 전체를 덮고 캐노피는 짧은 지지 위의 부재이며 별도 room이나 접근 connector가 아니다.
@evidence principles/design/spaces.md#space-boundary-authority roof top은 mass datum, 실내 upper ceiling은 층 owner, PV 반복 count는 canopy span에서 도출한다.
@evidence principles/design/spaces.md#space-verification-address 상면·하부·corner·지지와 shadow를 각각 관찰하며 구조 하중이나 발전량은 unverified로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 평지붕과 얇은 PV 캐노피 조건을 본채 크기와 짧은 지지에 대조했다. 큰 캔틸레버나 옥상 연결을 부모에게 요청할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 단순한 두 층 상자 위의 PV 캐노피를 유지하고 별도 체적·복층 보이드·추가 계단을 만들지 않는다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy 평지붕과 얇은 PV canopy를 실제 span·edge·drip·지지로 배정하여 유리 외피와 같은 본채를 덮게 한다.
-->

지붕은 [매스 datum](002-spatial-graph.md#mass-and-storeys)의 roof top에서 본채 전체를 덮는 평지붕이다. 지붕은 실내 upper ceiling을 대신하지 않고 구조 몸체 아래 실내 최종 면은 [2층 owner](002-spatial-graph.md#upper-level)가 소유한다. 외곽에 높이 0.12m의 얇은 edge와 밖으로 0.10m 나오는 물끊기를 둔다. 박공·굴뚝·옥상 테라스나 사람이 오르는 새 연결은 만들지 않는다.

PV 캐노피의 평면은 x=-5.80..5.80, z=-6.70..6.30m이고 underside y=6.70m, 구조 깊이 0.12m다. 지붕 위에 분산된 짧은 지지가 캐노피를 받치며 큰 본채 캔틸레버를 만들지 않는다. 이 범위의 PV·frame 반복 count는 유효 span과 최대 module 폭으로 파생하는 [입면 모듈 인터페이스](002-spatial-graph.md#envelope-interface)를 따른다. [관찰](001-citizen-house.md#spatial-observation)은 노출 상면·하부·모서리·지지와 shadow를 각각 묻는다. 캐노피 치수는 저작 입력이며 구조·발전 성능은 unverified다.

## 창호의 공간 인터페이스 {#glazing-interface}

<!--
@evidence principles/core/common.md#declared-basis 외부 고정창의0.04m frame face·0.14m 깊이와 최대1.25m bay는 실물 점유를 정하는 저작값으로 구분한다.
@evidence principles/core/common.md#scope-preservation 유리·jamb·head·sill·mullion과 reveal을 모두 남겨 사각 구멍이나 표면 색만으로 창호를 대신하지 않는다.
@evidence principles/core/common.md#substantive-completion effective span과 panel clear의 차이, frame 확장 cut, 우선 분할선 및 count/pitch 도출을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation curtainwall 요구를 실제 frame 점유와 room/floor 우선 분할을 갖는 반복 공간 규칙으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 창의 cut은 host 두께를 관통하지만 고정 유리로 채워지며 방 사이 경계를 가로지르는 panel을 허용하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority opening은 유효 span을 소유하고 panel과 mullion은 같은 분할선에서 도출하여 glass 폭을 별도 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 모든 opening의 반복 경계·room/floor 대응과 frame/reveal 연속성을 대조해 겹친 유리나 떠 있는 틀을 검출한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work curtainwall과 내부 경계 일치 요구를 우선 분할 및 ceil 반복 규칙에 대조했다. bay를 위해 부모 room이나 floor line을 이동할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 반복 부재를 측정 span과 규칙에서 만들고 모든 유리 panel이 방·바닥선 경계를 지키게 한다.
-->

각 opening의 유효 span은 양쪽 jamb의 안쪽 면 사이 거리다. 이 범위에는 내부 mullion의 점유도 포함되고, 개별 유리 panel의 clear 폭과 같지 않다. 모든 외부 고정창의 유효 span 바깥에 면 폭 0.04m, 깊이 0.14m의 head·sill·jamb를 두고 내부 분할선에는 같은 단면의 mullion을 중심 정렬한다. 이 값은 창호 공간 점유를 정하는 저작 입력이고 finish·광학 성능의 인증이 아니다. 실제 host wall의 structural cut은 유효 span에서 frame 면 폭만큼 확장한 윤곽이다. wall 두께를 관통해 cut하고 깊이가 다른 wall과 frame 사이에는 reveal이 연속해서 닿는다.

각 opening의 유효 길이를 1.25m 이하인 bay로 나눈다. room/floor/채택된 하층 jamb의 중심선을 우선 분할선으로 사용하고 각 독립 span마다 count=ceil(span/1.25), pitch=span/count로 정한다. 각 panel은 인접 frame의 안쪽 면 사이를 채우며 mullion의 점유 폭을 유리에서 제외한다. module record를 수작업 복제하지 않는다. 바닥선이나 방 경계를 가로지르는 유리 panel은 만들지 않는다. 모든 opening에서 이 실제 반복 경계와 room/floor를 [관찰](001-citizen-house.md#spatial-observation)로 대조한다.

## 전면 계단실 유리 {#front-stair-glazing}

<!--
@evidence principles/core/common.md#declared-basis 계단실 curtainwall 요구를 stair-opening의 x 범위와 두 층 datum에 연결하고 frame inset·sill/head offset을 채택했다.
@evidence principles/core/common.md#scope-preservation 두 층 계단 유리와 그 사이 spandrel을 모두 남겨 계단실을 가짜 복층 거실로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion host·두 층의 면하는 공간·유효 span 도출과 floor+0.12/ceiling-0.10 및 frame/reveal을 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전면 계단 유리의 개괄 요구에 실제 stair hole 폭을 사용하는 두 개 층별 cut을 부여했다.
@evidence principles/design/spaces.md#space-topology 하층은 entry, 상층은 계단 구멍에 면한 upper-storey이며 유리가 새로운 통행 connector를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority x span은 stair-opening에서, plane과 두께는 front-face에서, 높이는 floor datum에서 받아 사본 치수를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 두 층 binding·sill/head·frame 깊이 및 계단/공용 privacy 상태를 opening과 내부 시야에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면 계단 유리·층선 일치·공용 privacy를 hole 범위와 floor band에 대조했다. 층 구멍 확대나 부모 그래프 변경 없이 두 층 cut을 둘 수 있다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 단일 계단실의 curtainwall을 실제 층 높이와 계단 폭에 맞추고 바닥선 band를 지운 연속 유리판을 만들지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 계단/공용 유리의 day·private·night 상태와 shade를 이 두 층 opening에 배정하며 상태별 화면 성공은 아직 검증하지 않았다.
-->

host는 [front-face](#front-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 entry와 2층 upper-storey의 계단 개구에 면한다. 유효 유리 span은 [계단 개구](002-spatial-graph.md#stair-opening)의 x 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. sill과 head는 각 층 floor+0.12m에서 ceiling-0.10m까지이며 두 층 사이 spandrel은 [층 datum](002-spatial-graph.md#mass-and-storeys)을 따른다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 계단/공용 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 전면 작업실 유리 {#front-flex-glazing}

<!--
@evidence principles/core/common.md#declared-basis 전면 가변실의 유리를 실제 flex x clear 범위에서 frame 폭만큼 inset한 고정창으로 선택했다.
@evidence principles/core/common.md#scope-preservation 작업실 전면의 유리·틀·reveal·privacy shade를 남기고 방 폭을 늘려 reference 비례를 맞추지 않는다.
@evidence principles/core/common.md#substantive-completion front host와 flex room binding, ground sill/head 및 span 산식을 정해 유리 구멍을 실물 창호로 채울 입력을 제공한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전면 작업실의 채광·프라이버시를 room 폭에 대응하는 한 고정창과 사적 상태 배정으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 창은 flex-workroom과 외부의 경계이며 현관 직결 문을 대신하는 출입이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority flex cell이 span의 원본이고 frame interface가 cut 확장량을 소유해 façade가 작업실 크기를 다시 정하지 않는다.
@evidence principles/design/spaces.md#space-verification-address front opening과 작업실 내부에서 room binding·frame 깊이·ground floor 대응과 사적 상태를 대조한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면 작업실·사적 유리 조건을 flex cell과 전면 경계에 대조했다. 유리 폭 때문에 부모의 작업실 위치나 현관 연결을 바꾸지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 가변 작업실의 유리가 자기 방 경계와1층 바닥선에 맞으며 별도 유리 체적을 만들지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 작업실의 하부 반투명·상부 밝음 및 private/night shade 상태를 전면 창에 배정하여 채광과 시선 차단을 함께 검사한다.
-->

host는 [front-face](#front-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [flex-workroom](002-spatial-graph.md#flex-workroom)과 외부 사이의 고정창이다. 유효 유리 span은 방의 x clear 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 전면 상층 침실 유리 {#front-bedroom-glazing}

<!--
@evidence principles/core/common.md#declared-basis 상층 전면 일부 유리를 child1 전면 cell에서 얻고 하층 flex 서측 jamb 중심을 추가 분할선으로 채택한다.
@evidence principles/core/common.md#scope-preservation 상층 침실과 계단 사이의 경계를 보존하고 하층 방 폭에 맞추려고 침실 cell을 잘라내지 않는다.
@evidence principles/core/common.md#substantive-completion 유효 span·upper sill/head·host와 하층 jamb 대응 분할선을 정해 층간 틀 정렬을 구현 입력으로 제공한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전면 상층 유리 요구에 L자 침실의 전면 본체와 하층 jamb를 동시에 소비하는 bay 구성을 더한다.
@evidence principles/design/spaces.md#space-topology child-bedroom-1의 전면 cell만 외부에 면하며 L자 연장부나 계단 hole을 같은 창의 room으로 합치지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority opening 끝은 child1 cell, 내부 추가 분할은 하층 jamb 중심, 높이는 upper datum에서 각각 받는다.
@evidence principles/design/spaces.md#space-verification-address upper room binding·하층 jamb 연속·frame 깊이와 사적 privacy를 전면 및 침실 안 관찰에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 일부 전면 유리와 방/층 대응 요구를 child1의 더 넓은 전면 span에 대조했다. 하층 jamb를 추가 분할로 받으면 부모 방 경계를 이동할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 2층 전면 일부 curtainwall을 자기 침실 경계 안에 두고 층선과 하층 방의 창틀 대응을 지킨다.
@evidence settings/003-spatial-basis.md#privacy-states 침실의 사적 유리 상태와 shade를 전면 opening에 적용할 입력으로 받아 외부에서의 수면 프라이버시를 관찰 질문으로 남긴다.
-->

host는 [front-face](#front-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [child-bedroom-1](002-spatial-graph.md#child-bedroom-1)의 전면 cell에 붙는 고정창이다. 유효 유리 span은 전면 cell의 x 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡고, 하층 작업실의 서측 jamb 중심선을 추가 module 분할선으로 소비한다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 후면 공용부 유리 {#rear-common-glazing}

<!--
@evidence principles/core/common.md#declared-basis 후면 공용부의 넓은 유리를 common cell의 전체 x clear span에서 도출한 고정창으로 정한다.
@evidence principles/core/common.md#scope-preservation 거실·식당·주방에 면한 후면 유리와 창틀을 모두 남기되 그래프에 없는 rear 출입을 추가하지 않는다.
@evidence principles/core/common.md#substantive-completion rear host·common binding·frame inset·ground sill/head 및 고정창이라는 기능을 지정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 대부분의 curtainwall 요구를 한 연속 공용 room의 폭과 공용 privacy 상태에 대응시킨다.
@evidence principles/design/spaces.md#space-topology 공용부와 정원을 나누는 고정창이며 외부 정원으로의 새 통행 route는 없다.
@evidence principles/design/spaces.md#space-boundary-authority common x 범위와 층 datum에서 span·높이를 얻고 rear-face가 plane/normal/thickness를 소유한다.
@evidence principles/design/spaces.md#space-verification-address 후면 전체 opening과 공용부 안에서 floor line·frame 깊이·room binding·공용 상태가 일치하는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 연속 공용부와 후면 유리 및 고정 연결 그래프를 대조해 고정창으로 배정했다. 정원 출입을 부모에게 새로 요청할 이유는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 후면 공용부의 curtainwall을 실제 방 폭과 바닥선에 맞추며 문을 추가해 그래프를 바꾸지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 공용 유리의 day clear·private shade60%·night shade100%를 후면 큰 창의 상태로 소비하며 광학 성능 인증은 주장하지 않는다.
-->

host는 [rear-face](#rear-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [common-room](002-spatial-graph.md#common-room)과 정원의 경계다. 이번 공간 그래프에 없는 별도 rear 출입 route는 추가하지 않는 고정창이다. 유효 유리 span은 방 x clear 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 계단/공용 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 후면 주침실 유리 {#rear-bedroom-glazing}

<!--
@evidence principles/core/common.md#declared-basis 후면 주침실 고정창의 폭은 primary clear face에서 받고 upper floor/ceiling offset으로 높이를 정했다.
@evidence principles/core/common.md#scope-preservation 주침실의 후면 유리를 남기면서 욕실과의 shared wall을 관통하는 유리판은 만들지 않는다.
@evidence principles/core/common.md#substantive-completion rear host·primary binding·유효 span 산식과 upper sill/head 및 사적 상태를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 유리 요구를 주침실 경계에서 끝나는 상층 창으로 나눠 위생실과의 방 구획을 외피에 반영한다.
@evidence principles/design/spaces.md#space-topology opening은 primary-bedroom에만 면하고 욕실과 침실을 하나의 room binding으로 합치지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority primary x 범위가 창 끝의 원본이며 frame/interface와 rear plane을 소비해 별도 후면 폭을 저작하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 욕실 쪽 jamb와 shared wall 끝, upper 층선·frame 깊이 및 침실 privacy를 후면과 방 안에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 후면 유리와 코어 프라이버시를 primary/bath 경계에 대조했다. 침실을 넓히거나 욕실 wall을 지우는 부모 수정이 필요하지 않다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 주침실 curtainwall 베이가 방·층 경계에서 끝나게 하여 후면의 많은 유리와 실제 사적 구획을 함께 유지한다.
@evidence settings/003-spatial-basis.md#privacy-states 주침실의 day 사적 유리와 private/night 전체 shade 상태를 이 후면 창에 배정한다.
-->

host는 [rear-face](#rear-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [primary-bedroom](002-spatial-graph.md#primary-bedroom)의 후면 고정창이다. 유효 유리 span은 방 x clear 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. 욕실과의 shared wall을 관통하지 않는다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 후면 욕실 유리 {#rear-bath-glazing}

<!--
@evidence principles/core/common.md#declared-basis 욕실 후면의 x=-4.86..-3.42 span과 upper floor+1.00/ceiling-0.45는 이 창의 저작 선택이다.
@evidence principles/core/common.md#scope-preservation 욕실 privacy 창을 남기되 frame까지 실제 bath bounds 안에 들어가야 하며 주침실로 span을 늘리지 않는다.
@evidence principles/core/common.md#substantive-completion host·room·유효 폭·높이 offset과 반투명 상태를 정해 후면 코어의 제한된 개구를 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 불투명 코어의 위생 프라이버시를 높인 sill과 좁은 고정 반투명 창으로 구체화했다.
@evidence principles/design/spaces.md#space-topology 후면 house boundary 안의 opening은 upper-bathroom만 향하며 외부 출입을 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority span 선택은 이 opening이 소유하고 frame 폭과 plane·층 높이는 각 공통 owner를 소비한다.
@evidence principles/design/spaces.md#space-verification-address frame의 bath bounds 포함·sill/head·고정 반투명 상태를 후면 창과 욕실 내부 관찰에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 욕실의 고정 반투명 조건을 코어 폭과 후면 창 치수에 대조해 부모의 room 경계나 프라이버시 약속 변경이 필요하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 욕실은 불투명 코어 안에 남기고 제한된 유리에도 반투명 제어와 실제 방 경계 대응을 둔다.
@evidence settings/003-spatial-basis.md#privacy-states 욕실 유리는 모든 허용 상태에서 반투명을 유지하고 shade 변화가 이를 clear로 바꾸지 않는 입력을 소비한다.
-->

host는 [rear-face](#rear-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [upper-bathroom](002-spatial-graph.md#upper-bathroom)의 후면 고정창이다. 유효 유리 span은 x=-4.86..-3.42m다. 이는 이 opening의 저작 선택이며 방 bounds 안에 frame까지 포함되어야 한다. sill과 head는 upper floor+1.00m에서 upper ceiling-0.45m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 욕실 고정 반투명 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 작업실 측면 유리 {#left-flex-glazing}

<!--
@evidence principles/core/common.md#declared-basis 작업실 동측 창은 z=-5.40..-2.30을 저작 span으로 삼고 ground 높이와 left host를 소비한다.
@evidence principles/core/common.md#scope-preservation 전면 창과 직교하는 측면 유리를 남기면서 corner의 불투명 return을 지우거나 틀을 겹치지 않는다.
@evidence principles/core/common.md#substantive-completion host·room·z span·ground sill/head와 corner 비연속 조건을 정해 측면 창의 끝을 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가변실의 유리 요구에 전면과 분리된 측면 opening 및 opaque corner return이라는 실제 접합 결정을 더했다.
@evidence principles/design/spaces.md#space-topology 창은 flex-workroom과 동측 외부 사이의 고정 경계이며 corner를 넘어 다른 face의 opening으로 합쳐지지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 이 opening이 z span을 소유하고 host plane·wall 두께·frame·층 높이는 기존 owner에서 받는다.
@evidence principles/design/spaces.md#space-verification-address front cut과 side cut 사이 return·중복 frame·room binding과 사적 유리 상태를 내외 관찰에서 대조한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 작업실 프라이버시와 단순 외피를 전면/측면 창 접합에 대조했다. 코너를 비우거나 room을 확장하는 부모 변경 없이 return을 남길 수 있다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 작업실의 많은 유리를 실물 corner·방 경계 안에 두며 무리한 유리 모서리 구조를 만들지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 전면과 같은 작업실 사적 상태를 측면 창에도 배정하여 어느 한 면으로 프라이버시가 빠지지 않는지 검사한다.
-->

host는 [left-face](#left-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [flex-workroom](002-spatial-graph.md#flex-workroom)의 동측 고정창이다. 유효 유리 span은 z=-5.40..-2.30m다. 전면 창과는 직교하는 다른 면에 있으며 모서리까지 유리가 이어지는 창은 아니다. 전면 내측선과 이 측면 cut 사이의 불투명 return을 보존하고 프레임을 중복 겹치지 않는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 작은 침실 1 측면 유리 {#left-bedroom-glazing}

<!--
@evidence principles/core/common.md#declared-basis 첫 침실 동측 창의 span과 module은 하층 작업실 측면 창을 소비하고 높이는 upper datum으로 바꾼다.
@evidence principles/core/common.md#scope-preservation 상하 jamb 대응과 첫 침실의 독립 범위를 함께 보존하며 L자 연장부까지 창을 임의 확장하지 않는다.
@evidence principles/core/common.md#substantive-completion left host·child1 binding·하층 span/module 소비와 upper sill/head를 지정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 침실 유리를 하층 창 분할에 맞춰 올리되 실제 침실 cell에 속하는 별도 opening으로 구체화한다.
@evidence principles/design/spaces.md#space-topology child-bedroom-1의 동측 전면부가 면하는 고정창이며 하층 flex와는 층 band로 분리된다.
@evidence principles/design/spaces.md#space-boundary-authority z span·module은 left-flex-glazing을 재사용하고 upper 높이만 datum에서 얻어 독립된 두 번째 bay 원본을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 상하 jamb 연속·floor band·child1 binding·frame 깊이와 사적 상태를 side 및 방 안에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 방/층 일치와 침실 프라이버시를 하층 창의 span에 대조했다. child1 외주 안에 맞으므로 부모 침실이나 창의 기본 상태를 변경할 이유가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 상층 창의 bay를 하층과 정렬하면서 실제 층선·침실 경계를 가로지르지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 첫 침실의 사적 상태와 shade는 동측 창에서도 유지되며 전면 상태만 바꿔 전체 방을 보호했다고 판정하지 않는다.
-->

host는 [left-face](#left-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [child-bedroom-1](002-spatial-graph.md#child-bedroom-1)의 동측 고정창이다. 유효 유리 span은 [하층 측면 유리](#left-flex-glazing)의 z span과 module 분할을 소비하여 층선 위에서 jamb가 이어지게 한다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 작은 침실 2 측면 창 {#left-child-two-glazing}

<!--
@evidence principles/core/common.md#declared-basis 둘째 침실 동측 창의 z=0.35..1.90과 upper floor+0.70/ceiling-0.30을 저작값으로 채택한다.
@evidence principles/core/common.md#scope-preservation 작은 침실2에도 실제 창과 privacy 제어를 남기며 room 밖으로 frame을 늘려 창을 크게 보이게 하지 않는다.
@evidence principles/core/common.md#substantive-completion left host·child2 binding·span·sill/head와 양끝 frame의 room 포함 조건을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 번째 작은 수면실의 채광을 높인 sill의 제한된 측면 창과 사적 상태로 구체화한다.
@evidence principles/design/spaces.md#space-topology opening은 child-bedroom-2만 향하고 첫 침실이나 주침실 외주와 합쳐진 통합창이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority z span과 offset은 여기에서 소유하고 actual plane·두께·upper datum·frame은 공통 owner를 소비한다.
@evidence principles/design/spaces.md#space-verification-address 짧은 room의 양끝 frame 포함·sill/head·room binding과 privacy 상태를 창 및 실내 역방향에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 별도 작은 침실과 사적 유리 조건을 room z 범위에 대조했다. 창 때문에 다른 침실 경계를 이동하거나 부모 프로그램을 줄이지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 작은 침실의 창호도 자기 방 경계·상층 바닥선에 맞추며 고정 공간 그래프를 바꾸지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 둘째 침실의 day 사적 유리와 private/night shade를 이 창에도 배정해 같은 방의 상태 누락을 검사한다.
-->

host는 [left-face](#left-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [child-bedroom-2](002-spatial-graph.md#child-bedroom-2)의 동측 고정창이다. 유효 유리 span은 z=0.35..1.90m다. 두 끝의 frame은 해당 room 안에 있어야 한다. sill과 head는 upper floor+0.70m에서 upper ceiling-0.30m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 공용부 측면 유리 {#right-common-glazing}

<!--
@evidence principles/core/common.md#declared-basis 공용부 서측 후단 창을 z=3.60..5.40으로 선택하고 ground 높이와 right host의 두께를 소비한다.
@evidence principles/core/common.md#scope-preservation 앞쪽 코어는 닫힌 벽으로 남기고 후방 공용부에만 고정창과 실제 frame을 둔다.
@evidence principles/core/common.md#substantive-completion room·host·z span·ground sill/head를 정해 불투명 서비스 면의 제한된 개구를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 우측 코어 외피의 대부분을 닫으면서 후방 공용부에 면하는 채광 창이라는 세부 배정을 추가했다.
@evidence principles/design/spaces.md#space-topology 창은 common-room 서측 후단과 외부의 경계이고 앞쪽 위생·수납 room을 노출하는 opening이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority side 창의 z span은 이 owner가 소유하고 right plane과 ground datum·frame은 정해진 입력에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 후단 room binding·코어 전면 폐쇄·frame 깊이·공용 privacy 상태를 side opening과 공용부 안에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 우측 opaque core와 공용부의 유리 상태를 후방 z span에 대조했다. 설비 room을 옮기거나 앞쪽 벽을 뚫도록 부모를 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 코어를 우측 불투명 벽에 유지하고 뒤쪽 공용부 유리만 실제 방·층 경계 안에 둔다.
@evidence settings/003-spatial-basis.md#privacy-states 공용부의 허용 유리·shade 상태를 후면 큰 창뿐 아니라 서측 작은 창에도 적용할 입력으로 받는다.
-->

host는 [right-face](#right-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [common-room](002-spatial-graph.md#common-room)의 서측 후단 고정창이다. 유효 유리 span은 z=3.60..5.40m다. 서비스 코어의 앞쪽 불투명 벽을 새 opening으로 뚫지 않는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 계단/공용 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 욕실 측면 유리 {#right-bath-glazing}

<!--
@evidence principles/core/common.md#declared-basis 욕실 서측 창의 z span과 module은 하층 공용부 side 창에서 받고 upper datum에서 sill/head를 구한다.
@evidence principles/core/common.md#scope-preservation 상하 창틀 정렬과 욕실의 고정 반투명을 함께 남겨 공용 유리와 같은 clear 창으로 만들지 않는다.
@evidence principles/core/common.md#substantive-completion right host·bath binding·하층 span/module과 upper offset 및 욕실 전용 privacy 입력을 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 코어 욕실의 측면 창에 하층 jamb 정렬을 받되 다른 광학 상태를 갖는 별도 upper opening을 추가한다.
@evidence principles/design/spaces.md#space-topology 상층 욕실에 면한 고정창이고 하층 common과는 floor band로 분리되며 두 room을 한 binding으로 묶지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 하층 창이 z span/module의 원본이며 욕실 창은 upper 높이와 상태만 자기 입력으로 소비한다.
@evidence principles/design/spaces.md#space-verification-address 상하 jamb·upper floor line·bath binding과 고정 반투명 및 shade를 서측과 욕실 안에서 대조한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 욕실의 프라이버시와 floor/bay 일치를 하층 후단 창 범위에 대조했다. bath cell 안에 맞으므로 코어 위치나 고정 반투명 조건을 부모에서 바꾸지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 코어 욕실의 큰 측면 유리도 방·층에 맞추고 반투명 제어로 주거 프라이버시 질문에 답하게 한다.
@evidence settings/003-spatial-basis.md#privacy-states 욕실은 day·private·night 모두 반투명이라는 조건을 하층 공용 창의 다른 상태와 구별하여 적용한다.
-->

host는 [right-face](#right-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [upper-bathroom](002-spatial-graph.md#upper-bathroom)의 서측 후단 고정창이다. 유효 유리 span은 [하층 공용부 측면 유리](#right-common-glazing)의 z span과 module 분할을 소비한다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 욕실 고정 반투명 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 외부 모서리 접합 {#envelope-corners}

<!--
@evidence principles/core/common.md#declared-basis mass의 내외 corner가 정하는 두께 square를 대각선으로 나누는 miter 접합을 저작 결정으로 채택한다.
@evidence principles/core/common.md#scope-preservation 네 외부 corner를 실제 volume으로 닫고 window frame을 감추려 corner 두께를 없애지 않는다.
@evidence principles/core/common.md#substantive-completion 삼각 prism의 입면별 귀속·맞댐·rectangular body 범위와 opening의 corner 배제 조건을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 완결 입면 단독 소유에 직교하는 두 면이 겹침 없이 만나는 대각 접합 방식을 더한다.
@evidence principles/design/spaces.md#space-topology 두 인접 외벽은 닫힌90° corner에서 만나며 그 부피 안에 출입이나 room 간 통행을 두지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 각 corner square는 datum 내외 모서리에서 얻고 각 façade가 자기 삼각 prism만 소유해 중복 solid를 막는다.
@evidence principles/design/spaces.md#space-verification-address 네 corner와 실내 역방향에서 틈·volume 겹침·빠진 return을 검사하며 corner에 걸친 cut은 현재 결정의 실패다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단일 직사각형 외주와 완결 표면 소유를 miter 분할에 대조했다. 인접 면의 주인을 나누거나 코너창을 추가하도록 부모를 수정할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 직사각형 본채의 네 외부 모서리를 닫고 개구를 내부 방 경계 안에 유지한다.
-->

[매스](002-spatial-graph.md#mass-and-storeys)의 네 외측 모서리와 내측 모서리가 외벽 두께의 corner square를 정한다. 각 square는 내측 모서리에서 외측 모서리로 잇는 대각선으로 두 삼각 prism에 나눈다. 앞/뒤 면에 붙은 삼각형은 해당 front/rear owner, 좌/우 면에 붙은 삼각형은 해당 side owner가 같은 전체 높이로 소유한다. 두 body는 대각 면에서 맞닿고 서로 관통하지 않는다.

각 façade의 rectangular wall body는 두 내측 모서리 사이를 차지하고, 양 끝의 이 miter prism이 외측 모서리까지 닫는다. logical face는 외측 전체 span을 유지하고 opening cut은 inner rectangular body 안에 있어야 한다. corner에 걸치는 opening을 허용하려면 이 현재 결정부터 재검토한다. window frame을 숨기기 위해 코너 두께를 없애지 않는다.

이 규칙은 입면의 완결 시각 면을 다른 owner에게 나누지 않으면서 닫힌 90° 접합을 정한다. [관찰](001-citizen-house.md#spatial-observation)은 네 외부 모서리와 실내 역방향에서 틈·중복 volume·빠진 side return을 확인한다.
