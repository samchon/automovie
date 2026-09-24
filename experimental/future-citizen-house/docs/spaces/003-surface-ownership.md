# 외피의 공간 경계

## 완결 표면과 공유 접합 {#whole-surface-owners}

<!--
@evidence settings/001-production.md#production-visual-grammar 불투명 서비스 벽·틀·유리·차양을 서로 다른 공간 점유로 구별해 시각 문법의 실제 부재 기반을 제공한다. 색과 광학·조명 구현의 성공을 공간 문서에서 주장하지 않는다.
@evidenceReview settings/001-production.md#production-visual-grammar #a673c40 서비스 벽·금속 틀·유리·차양은 외주 안에서 별도 건축 점유와 안정 주소를 가진다. v-096의 외피 설계 PASS는 이 분해의 설계 판정이며 색·광학·조명의 현재 화면 성공은 materials와 GPU 관찰에 남는다.
-->

<!--
@evidence principles/core/common.md#declared-basis 본채와 표면 분해 선언을 받아 외피를 네 입면과 지붕으로 나누고 datum에서 두께와 층선을 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 입면 geometry 책임은 surface-decomposition, 두께와 층선은 mass-and-storeys에서 받는다. 외측 O=C+(d/2)N은 이 datum에서 도출하며 레퍼런스 픽셀의 측량값이 아니다. v-096 설계 판정은 이 근거를 승인했으나 현재 GPU 외관 측정은 별개다.
@evidence principles/core/common.md#scope-preservation 외벽·개구·틀·shade·return을 각 완결 표면의 범위에 남기고, 입면 아래 plinth와 위의 지붕 구조, 계단 void 앞 외벽 실내 면의 owner까지 정해 실내 floor/ceiling 책임과 연결한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 다섯 외피 owner에 개구·틀·shade·return과 외부 노출 면을 남기고 내부 구조 wall·수평면은 층, 외벽 내측은 방에 둔다. plinth·문턱판·roof 상부·계단 void 앞 외벽 내측의 건축 owner도 지정한다. finish 결합은 materials 몫이며 이 분할의 v-096 PASS를 물체나 재료의 판정으로 확장하지 않는다.
@evidence principles/core/common.md#substantive-completion 입면·층·방의 접합 책임, 입면 아래 plinth와 지면의 접합, 외부 boundary의 enclosing house를 지정하여 외피에 이중 소유나 무소유 면을 남기지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 외부 face는 house에 귀속하고 각 opening이 면한 room/storey는 개별 주소에 둔다. plinth·문턱판·roof 구조의 접합 owner와 O/C의 다른 용도를 정해 관찰면 변경이 cut·힌지·connector를 옮기지 않는다. 이는 v-096이 통과시킨 설계 내용이며 현재 finish와 GPU 판정은 남아 있다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 단독 표면 소유를 실제 외피의 다섯 face와 내외 마감 및 corner 접합의 공간 관계로 전개한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 건축 작성자·외곽 datum에 외부 face의 house 귀속, 개구의 room 대응, 절삭 C와 관찰 O의 차이 및 상하 접합을 더했다. v-096에서 승인된 것은 이 공간 설계의 전개이며 materials의 재료 선택을 여기서 재결정하지 않는다.
@evidence principles/design/spaces.md#space-topology 외부 전체 face는 house를 둘러싸고 개별 room/storey의 창 대응은 opening과 cell 위치에서 판정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 외주 전체는 house에, 창이 면한 room/storey는 opening과 cell에 바인딩한다. 벽 절삭 중심 C와 외측 face O를 분리해 유리 색이나 양면 표시로 공간 포함을 대신하지 않는다. 이 경계 판단과 GPU의 현재 읽힘은 별도다.
@evidence principles/design/spaces.md#space-boundary-authority 외곽·층선·두께는 mass datum 하나를 쓰며 입면이 room별 창폭을 따로 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 C/O는 mass datum과 wall d에서 도출하고 opening의 접선·Y 범위는 개별 owner가 준다. 돌출 덮개 0.020m를 구조 wall 두께로 혼동하지 않는다. geometry 주소는 spaces, finish 결합은 materials이므로 viewer가 색으로 경계를 다시 소유하지 않는다.
@evidence principles/design/spaces.md#space-verification-address normal·thickness·접합선·opening profile·층선 일치와 입면 아래 plinth 띠의 연속을 전체 공간 관찰에 연결한다. 기존 건축 형상은 구현돼 이전 독립 판정의 관찰을 받았고 새 트리의 전체 GPU 외관은 unverified로 남긴다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 외향 법선은 실제 centroid의 O±0.001N과 dot(N,actual)>1-1e-7로, cut 이동은 opening profile·문짝 bounds·connector endpoint로 반증한다. -0.45..0 띠는 plinth·문턱판·지면 bounds를 본다. 건축 형상과 이전 v-096 설계 판정의 존재를 인정하되 이 주소 검사가 새 트리의 재료 결합과 GPU 외관을 통과시키지는 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단일 본채와 완결 표면의 단독 소유를 다섯 외피면 및 층/방 접합에 대조했다. 부모의 표면을 더 쪼개거나 별도 체적을 허용할 필요가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 단일 본채와 표면 owner 경계를 C/O 분리 및 모서리·floor band 접합에 대조했다. O를 외측 관찰면으로 도출해도 d·실내 clear face·부모 동선은 유지된다. v-096의 외피 설계 승인 범위에서 부모 체적 수정 사유는 없었고 후속 재료 결합은 이 제외에 포함되지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 단일 직사각형 외피가 내부 방·층 경계를 소비하도록 하며 화면을 위해 고정 그래프를 바꾸지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d ground floor에서 upper ceiling까지 단일 house 외주를 두고 창의 room·storey 귀속은 기존 cell에서 받는다. C/O의 관찰면 구분과 추후 materials 결합은 room·connector·본채 체적을 바꾸지 않는다. v-096의 설계 판정은 실물 통행·성능이나 최신 GPU 외관의 인증이 아니다.
@evidence settings/003-spatial-basis.md#surface-decomposition 각 입면이 구조 return·창호·shade·노출 마감 면의 안정 주소를 맡고 층·방과 최종 면을 중복 생성하지 않는 배정을 소비한다. finish 결합은 materials가 정한다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #4264ae2 front/rear/left/right/roof는 전체 입면이고 floor/ceiling 노출 면은 층, 외벽 내측 면은 방에 남는다. 물체 형상·배치와 재료 결합은 후속 분기로 이관할 대상이며 현재 문자열은 임시 값이다. 모든 현행 발광 element도 후속 part·instance·system emitter의 대응 없이는 퇴역하지 않는다.
-->

[house](001-citizen-house.md#citizen-house-space)의 외피는 [전면](#front-face), [후면](#rear-face), [좌측](#left-face), [우측](#right-face), [지붕](#roof-face)의 다섯 완결 표면이다. 각 면은 하나의 owner가 모든 구조 return·개구·틀·shade·노출 마감 geometry의 안정 주소를 소유한다. 그 주소의 finish 결합은 materials가 결정하고 입면 owner는 결정된 id를 운반한다. 작성자와 source 파일은 [분해 선언](../settings/003-spatial-basis.md#surface-decomposition)을 따른다. 개구부 H2는 같은 입면 내부의 주소이며 작성자를 분할하지 않는다.

[매스와 층 datum](002-spatial-graph.md#mass-and-storeys)이 외주·층선·두께를 소유한다. 입면은 그 외벽 두께 안에서 실내 clear face와 외부 face를 잇는다. 외부 모서리는 [모서리 접합](#envelope-corners)의 대각 분할에서 만나고, 층간 spandrel은 해당 floor line을 따른다. 층 owner가 수평 실내 floor/ceiling 최종 면과 내부 구조 wall 몸체를 만들며 입면 owner가 외부 wall과 glazing assembly를 닫는다. 각 방 owner는 외벽의 실내 마감만 맡고 유리와 같은 최종 면을 중복 생성하지 않는다. 방이 없는 [계단 void](002-spatial-graph.md#stair-enclosure) 앞의 전면 외벽은 room lining이 없으므로 전면 입면 owner가 그 실내 면까지 맡는다.

네 전체 입면 boundary의 enclosing space는 house다. 각 opening이 면하는 room/storey는 해당 opening H2와 실제 cell 위치를 대조한다. 내부 shared boundary처럼 서로 다른 두 방을 외부 한 면의 spaces 목록에 나열하지 않는다. 입면의 수직 범위는 ground floor부터 upper ceiling까지이며 그 사이 floor band도 같은 입면이 닫는다. 그 아래 대지 지면 y=-0.45부터 ground floor까지의 외곽 면은 [1층 owner](002-spatial-graph.md#ground-level)의 기초 plinth가 입면과 같은 외곽 평면에서 닫고, 대지 owner의 지면이 그 plinth에 y=-0.45로 맞닿는다. [현관 출입구](002-spatial-graph.md#front-entry)의 clear width 아래에서는 ground floor 바로 아래 -0.016..0을 [문턱판](002-spatial-graph.md#door-interface)이 채우며, 그 문턱판은 문 개구를 절삭하는 전면 입면 owner가 함께 만든다. 입면 위 upper ceiling부터는 [roof owner](#roof-face)의 구조가 외벽 구간까지 닫는다. 따라서 본채 외곽의 어느 높이에도 무소유 면이나 지면과의 틈이 남지 않는다.

[시각 문법](../settings/001-production.md#production-visual-grammar)이 구별하는 불투명 서비스 벽·금속 틀·유리·차양은 같은 외주 안에서 서로 다른 실제 점유를 가진다. 여기서는 그 공간 경계만 정하고 색·광학·빛의 구현은 후속 source에서 이 canon을 소비한다.

각 face의 실제 boundary normal·thickness·접합선·opening profile과 바닥선 일치를 [전체 공간 관찰](001-citizen-house.md#spatial-observation)에서 검사한다. 입면 아래 -0.45..0 띠는 네 외곽 평면 전 길이에서 기초·bearing ring·문턱판의 실제 bounds가 빈 구간 없이 이어지는지와 대지 지면·보행면이 외곽에서 끝나는지를 같은 산출물에서 읽는다. v-096의 외피 설계 판정은 PASS이며 현 트리의 재료 결합과 새 GPU 외관 관찰은 unverified다.

**입면 관찰 경계 수정 설계.** 아래 결정은 v-071의 커튼월 부재 단서와 기존 벽 중심면의 관찰 방향 오류를 수리하는 설계다. source는 2026-09-24 6562f9b0에서 이 설계를 구현했고 네 면의 native 법선이 N과 일치하는 것을 compiled 산출물에서 읽었다. 외피 설계는 독립 판정 v-096에서 PASS했으며 이 판정은 현재 트리의 새 GPU 시각 승인으로 확장되지 않는다. 본문의 각 입면이 쓰는 plane center는 절삭·부재 배치용 중심 C를 뜻한다. 외부 boundary의 face는 외측 기준면 O에 둔다. 벽 중심에서 내외 공간을 구분하려는 기존 해석을 폐기한다. 외벽 두께 d와 내외측 위치는 [매스](002-spatial-graph.md#mass-and-storeys)에서 받고 O=C+(d/2)N으로 도출한다. N은 해당 입면의 외측 단위 방향이다.

| 전체 입면 owner | 절삭 중심 C의 법선 좌표 | 외측 면 O | N | 외측 전체 span |
| --- | --- | --- | --- | --- |
| front | Z=-5.88 | Z=-6.00 | (0,0,-1) | X=-5.50..5.50 |
| rear | Z=5.88 | Z=6.00 | (0,0,1) | X=-5.50..5.50 |
| left | X=5.38 | X=5.50 | (1,0,0) | Z=-6.00..6.00 |
| right | X=-5.38 | X=-5.50 | (-1,0,0) | Z=-6.00..6.00 |

표의 숫자는 기존 datum의 파생 설계값이다. 네 face의 접선 중심과 Y 중심은 기존 outline 중심을 유지하며 높이는 ground floor..upper ceiling이다. 외부 모서리 prism까지 포함한 전체 span도 유지한다. 두께는 d 그대로이고 회전은 local +Z가 N을 향한다. local U의 부호와 모든 opening profile의 접선·Y 좌표는 기존 절삭 좌표에서 유지하여 좌우 반전이나 문 폭 변화를 만들지 않는다. opening profile은 O에 투영한 유효 개구 윤곽이며 실제 wall cut과 reveal은 그 안쪽으로 d를 관통한다. 유리와 문짝의 world transform, 문 힌지와 open/closed 상태, connector endpoint, room lining의 절삭 입력은 C를 계속 소비한다. 외측 face로 고친다는 이유로 이 실물을 0.12m 밀어내지 않는다. 내부 두-room shared boundary는 이 변경의 대상이 아니다.

경계의 소유자는 각 전체 입면이며 facade helper는 C와 O를 구분해 생성한다. viewer가 normal을 ID별로 뒤집거나 engine의 containment probe를 바꾸는 경로를 두지 않는다. 네 면 모두 native exposed normal이 N과 일치하고 O+0.001N은 house 밖, O-0.001N은 house 안에 있어야 한다. 검사 중심은 각 face의 실제 centroid다. tolerance는 좌표 1e-7m, 방향 dot(N,actual)>1-1e-7로 정한다. 같은 산출물에서 opening profile의 세계 접선·Y 범위와 actual cut, 문짝 bounds와 connector endpoint의 변경 전후 차이도 읽는다. 이 검사는 camera를 보기 좋게 옮기는 것으로 대체하지 않는다. [관찰 집합](001-citizen-house.md#spatial-observation)의 전체 입면·모서리·개구 질문을 유지하며 실물 돌출 부재는 자신의 actual bounds에서 추가 관찰한다. 외측 기본 면보다 돌출되는 [층간 덮개](#glazing-interface)의 0.020m는 부재 점유에 포함하되 body volume이나 벽 두께를 늘린 값으로 보고하지 않는다.

## 전면 전체 {#front-face}

<!--
@evidence principles/core/common.md#declared-basis 외피 canon의 전면 계단실·작업실·상층 일부 유리와 코어를 -Z face에 배정하며 실제 plane은 mass에서 도출한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb front=-Z와 화면 우측=-X 관례를 써 reference 좌우를 뒤집지 않는다.
@evidence principles/core/common.md#scope-preservation 목재 현관문·계단 유리·작업실 유리·코어와 층간 spandrel을 같은 전면의 실제 부재 범위로 남긴다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 전면 전체를 한 owner가 맡으며 현관이나 stair 유리만 따로 분할하지 않는다.
@evidence principles/core/common.md#substantive-completion outward -Z, plane 도출, 전체 폭과 네 opening owner 및 나머지 벽 폐쇄를 정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 문·네 유리 구간·floor band와 corner 접합까지 면 전체를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 코어 -X와 출입문의 상대 배치는 외피 canon에서 받고, 전면 plane 도출과 층별 네 opening의 cut·spandrel 조립을 이 입면에서 추가한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 전면 커튼월 요구에 room별 절단과 불투명 구간을 배정한다.
@evidence principles/design/spaces.md#space-topology 전면 외주는 house의 -Z 경계이고 실제 cut만 외부/실내를 잇거나 고정 유리로 구분한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 계단·flex·child-one 내부 범위와 전면 개구가 대응한다.
@evidence principles/design/spaces.md#space-boundary-authority front plane은 외측/내측 z 평균이며 각 cut은 지정 opening이 소유하여 별도 façade 문 좌표를 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 front face는 외벽 실체를 소유하고 opening 폭은 개별 profile에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 같은 층 cut 겹침·jamb의 room 경계 침범을 실패로 두고 정면·corner·실내 역방향을 대조한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 전면 sill·jamb·층 band를 opening과 floor 원본에 대조하도록 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면의 계단 유리와 단일 현관 및 우측 코어를 현재 room 외주에 대조했다. 외관 때문에 추가 체적이나 부모 동선 변경을 요구하지 않는다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 기존 전면 room 범위로 문과 유리를 배정할 수 있어 부모 공간 그래프를 수정하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 계단실과2층 일부의 유리를 방·층선에 맞추고 현관을 실제 cut과 목재문으로 남긴다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 전면은 계단 유리와 작업실·상층 일부 유리를 두고 -X 코어는 불투명하게 남긴다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy 전면 계단실·작업실·상층 일부 유리와 우측 opaque core를 네 개구 owner 및 닫힌 벽에 대응시킨다.
@evidenceReview settings/003-spatial-basis.md#envelope-and-privacy #467ca4b 현관문과 계단 유리의 화면 관계를 실제 전면 배치로 유지한다.
-->

전면은 [매스](002-spatial-graph.md#mass-and-storeys)의 -Z 외벽이며 outward normal은 -Z다. plane center는 외측 z와 실내 front clear z의 평균, span은 본채 전체 x 폭이고 각 층의 floor–ceiling을 구분한다. 불투명 코어·계단 유리·목재 현관문·작업실 유리가 같은 외주에 놓인다.

[현관문](002-spatial-graph.md#front-entry), [계단실 유리](#front-stair-glazing), [작업실 유리](#front-flex-glazing), [상층 침실 유리](#front-bedroom-glazing)가 실제 cut을 소유한다. 나머지 외벽은 닫힌 벽과 층간 spandrel이다. 같은 층의 cut이 겹치거나 jamb가 방 경계를 가르면 실패다. 코어는 전면 화면 오른쪽인 -X에 놓이고 출입문은 계단실보다 화면 왼쪽에 놓인다. [외피 canon](../settings/003-spatial-basis.md#envelope-and-privacy)을 소비하며 외부 정면·모서리·각 opening과 실내 역방향 관찰에서 양쪽이 같은 경계인지 검사한다.

## 후면 전체 {#rear-face}

<!--
@evidence principles/core/common.md#declared-basis 후면 대부분의 curtainwall을 +Z 외주에 배정하고 common·primary·bath의 실제 room 경계에서 개구를 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb rear=+Z와 두 floor datum을 소비해 후면 위치를 정한다.
@evidence principles/core/common.md#scope-preservation 공용부와 주침실의 넓은 유리 및 욕실 privacy 개구와 층선 폐쇄를 모두 남긴다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 후면 유리를 뒤 출입구로 바꿔 추가 connector를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion +Z normal과 plane 입력, 세 opening 및 room end의 closure를 정하여 두 층 후면을 완결한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 하층 common·상층 primary·bath와 층 band가 함께 지정됐다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 유리 요구를 공용부·주침실·욕실의 서로 다른 span과 그 사이 벽 끝의 대응으로 세분화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 후면 대면적 유리 요구에 bath 접촉 jamb와 두 층 분할을 더한다.
@evidence principles/design/spaces.md#space-topology 하나의 house 후면 경계에 두 층의 room별 opening을 붙이고 욕실과 침실을 한 opening으로 합치지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 주침실과 bath의 경계가 상층 후면 유리 끝으로 이어진다.
@evidence principles/design/spaces.md#space-boundary-authority 창 끝은 room clear face를 소비하고 plane은 mass의 rear z에서 도출해 외피 자체의 다른 방 폭을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 rear owner가 외측 면을 맡고 실내 room 끝을 창 분할에 사용한다.
@evidence principles/design/spaces.md#space-verification-address 후면 corner·floor line·각 창과 방 안 시야에서 욕실/주침실 shared wall 끝과 closure의 불일치를 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 공용부 유리와 상층 두 room의 구분을 후면 전체·개구 관찰에서 묻는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 후면 유리와 위생 프라이버시를 상층 욕실·주침실 경계에 대조했다. 욕실 벽을 지우거나 부모 방 구성을 바꿔야 할 모순은 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 room 경계와 floor line만으로 후면 분할이 가능해 부모에 다른 매스를 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 후면 대부분에 curtainwall을 두면서 바닥선과 욕실·침실 경계를 glass panel이 가로지르지 않게 한다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 후면 대부분을 common·primary 유리로 쓰고 bath는 privacy 개구로 구분한다.
-->

후면은 [매스](002-spatial-graph.md#mass-and-storeys)의 +Z 외벽이며 outward normal은 +Z다. plane center는 외측 z와 실내 rear clear z의 평균이다. [공용부 유리](#rear-common-glazing)와 [주침실 유리](#rear-bedroom-glazing)가 주된 개구이고 [욕실 유리](#rear-bath-glazing)는 privacy opening이다. 나머지는 층선·room end에 일치하는 닫힌 벽이다.

창호의 끝은 각 방의 clear face를 소비하며 상층 욕실과 주침실 사이 내벽 끝에 mullion/opaque closure가 닿는다. [관찰](001-citizen-house.md#spatial-observation)은 두 층 floor line·rear corner·각 opening과 해당 방 안 시야를 동시에 묻는다.

## 좌측 전체 {#left-face}

<!--
@evidence principles/core/common.md#declared-basis 전면 관찰 기준 좌측을 +X로 정한 좌표 관례에 따라 작업실과 두 작은 침실의 측면 창을 배정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 전면 관찰의 좌측인 +X 면을 사용한다.
@evidence principles/core/common.md#scope-preservation 각 방의 창과 나머지 불투명 벽 및 앞뒤 return을 남겨 전 측면을 무차별 유리로 바꾸지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 측면 창을 코너 전체 유리로 확장하지 않는다.
@evidence principles/core/common.md#substantive-completion +X normal·plane 입력과 세 opening owner, room별 z span 소비 및 모서리 책임을 정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 세 opening과 나머지 실체·roof 접합이 지정됐다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 측면 외피를 전면 작업실/상층 두 침실에 대응하는 세 개구와 불투명 잔여 면으로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 단순 상자에 방별 측면 채광 범위를 구체화한다.
@evidence principles/design/spaces.md#space-topology 동측 house 외주에서 각 창은 자기 room에 면하며 한 opening이 서로 다른 침실을 잇지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 flex·child-one의 상하 창과 child-two의 중간 짧은 창이 각 cell에 대응한다.
@evidence principles/design/spaces.md#space-boundary-authority 외측/clear maxX 평균을 plane으로 쓰고 각 room의 z 범위를 소비하여 창을 위해 방 경계를 늘리지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 left face는 전체 외측 면을 맡고 room 내부 lining을 중복 생성하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 양 corner와 각 opening의 실내 역방향에서 두께·room 끝·return이 같은 경계인지 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 측면 코너 return과 창 끝이 실내 범위를 넘는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단순한 본채 외피와 독립 room 조건을 세 측면 창에 대조했다. 추가 유리 체적이나 방 통합으로 부모를 수정할 이유가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 외주 내 각 방에 측면 창을 배정할 수 있어 부모 직사각형을 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 측면 창도 방 경계와 층선에 맞추어 고정 room 그래프 안의 외피로 남긴다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 좌측은 작업실·두 자녀실의 설계 창만 열고 불투명 return을 남긴다.
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
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb -X 서비스 면은 mass와 전면 좌표 관례에서, 관 상단 접합은 roof-face에서 받는다. 관 중심과 clip 높이는 이 면이 소유하는 배치로 구별된다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 불투명 코어와 후단 두 층 창을 유지한 채 관·clip·점검 덮개 형상과 안정 면 주소를 우측 전체 owner에 더했다. 실제 finish 결합은 materials가 맡으며 배수관 형상이 다른 입면에 중복되지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 관의 내외경·상하단, 네 clip 높이와 점검 덮개 범위를 정했다. roof 단면에서 대지 집수구까지 연결할 위치를 source가 임의로 정할 필요가 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 opaque core에 후단 유리 span과 창을 피하는 중앙 배수선이라는 외주 배치를 더했다. 코어를 가린다는 말만 반복하지 않고 외부 부속의 점유를 결정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 관은 두 층의 불투명 벽 바깥에 있고 아래로 열린 끝은 대지 집수구 위에 놓인다. 서비스실 내부를 새로운 배수 통로나 출입 공간으로 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 외벽 plane은 mass의 minX를, 두 창 span은 개별 opening을 따른다. y=6.10에서 roof 관을 받되 아래만 생성하도록 끝을 나누어 외피 접합이 이중으로 저작되지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 관의 외측 Z=0.055와 가까운 창 cut 시작 3.56의 간격이 명시되어 창 가림을 수치로 반증할 수 있다. side·뒤 모서리·실내 privacy 관찰은 나머지 코어와 return의 누락도 질문한다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 서비스 코어의 불투명 앞부분과 후방 채광 배치에 관 중심 Z=0을 대조했다. 배수 부속을 위해 설비실을 옮기거나 부모의 창·방 구성을 바꿔야 할 충돌은 없다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 두 층의 후단 창을 유지하고 배수관은 그 앞의 opaque 면에 붙인다. 우측 위생·수납·설비를 드러내는 개구 확대나 floor line 변경을 요구하지 않는다.
-->

우측은 전면 관찰 화면 기준 -X 서비스 코어 면이다. [매스](002-spatial-graph.md#mass-and-storeys)의 서측 외벽을 사용하고 outward normal은 -X다. plane center는 외측 x와 실내 minX의 평균이다. 전면의 위생·수납·설비 영역을 닫고 후면에 [공용부 측면 유리](#right-common-glazing)와 [욕실 측면 유리](#right-bath-glazing)를 둔다.

큰 불투명 벽체는 위생·설비를 가리며 후면 두 층의 개구는 같은 z span에서 floor line에 맞춘다. [관찰](001-citizen-house.md#spatial-observation)은 side 전체, 벽 이음·각 opening·뒤 모서리와 실내 privacy를 묻는다.


캐노피 r2의 [roof 배수 접합](#roof-face)을 y=6.10에서 받는다. 우측 전체 owner는 x=-5.68,z=0의 외경 0.11m·내경 0.10m 수직 배수관을 y=6.10..-0.30까지 만들며, roof owner와 이 단면에서 면을 맞대고 관을 이중으로 생성하지 않는다. clip 중심 높이는 5.80,4.00,2.20,0.40m이고 벽 x=-5.50에서 관의 벽쪽 면까지 연결한다. z=0은 두 층 모두 불투명 서비스 벽이다. 가장 가까운 우측 창 cut Z=3.56에 비해 관 외측 Z=0.055가 3.505m 앞에 있어 개구부를 가리지 않는다. 관의 지면 쪽 끝은 대지 집수구 위에서 아래로 열리며 y=0.10..0.30에 폭 0.08m의 탈착 점검 덮개를 둔다. 관·clip·점검 덮개의 형상과 안정 면 주소는 우측 입면 owner가 소유하고 finish 결합은 materials가 결정한다. 관·clip·덮개는 `src/house/envelope/right.ts`에 구현됐고 실물 배수·수밀 작동은 `unverified`다.

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
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 구조 datum은 mass에서 받고 B/J/T/P와 R은 r2 저작식으로 명명했다. 사진 비례나 기존 box 높이를 새 경사의 근거로 쓰지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 지붕 상면·노출 하부부터 배수 끝점과 탈거 여유까지 roof에 남기고 관 하단과 집수구는 right/site owner로 연결했다. 캐노피 하부를 연속 판으로 다시 막아 열린 모듈을 생략할 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 v-073은 서로 다른 두 fall, 맞댐 plate 구간, gutter 저점·overflow와 망 인출 순서를 확인했다. 구현자가 우수 방향이나 지지 중첩 해소 방식을 다시 결정해야 했던 v-072의 빈칸이 없어졌다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 얇은 지지식 PV 요구에 경사면 식, rail 절단과 frame 안착, 외부 장비에서의 탈거 동선을 추가했다. 이는 평지붕 문구의 재서술이 아니라 부재가 차지하고 비워야 할 공간 결정이다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 pedestal은 본채 지붕 위에 있고 cassette는 주보·rail 위에 앉는다. 낮은 하부를 사람 통로나 새 옥상 connector로 해석하지 않아 유지관리 접근이 거주 공간 그래프를 바꾸지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 구조 slab·실내 천장·각 창 cut의 원본을 연결하고 B/J/T/P는 roof, module 최대 pitch는 envelope-interface에서 받는다. 관의 y=6.10 접합을 정해 두 입면 owner가 같은 관을 중복 생성하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 창 cut의 확장 영역, post 길이와 망 swept volume은 컴파일 측정으로 반증하고 열린 틈·지지·그림자는 새 GPU 프레임에 남겼다. 기존 cassette 캡처만 통과해도 이들 새 부재가 승인되는 구조가 아니다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 부모의 11×12m 본채·평지붕·짧은 지지 조건 안에서 9개 pedestal과 외부 장비 접근이 배정된다. r2는 roof와 site의 자식 설계를 고쳤으며 부모의 방 구성·상시 옥상 동선을 늘려야 할 모순은 드러나지 않았다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 캐노피 기둥을 지면까지 연장하지 않고 모든 문·창의 확장 회피 영역을 지정했다. 태양광 지지체 때문에 방 경계·단일 계단이나 층 band를 이동하는 해석을 배제한다.
@evidenceReview settings/003-spatial-basis.md#envelope-and-privacy #467ca4b 0.15m 구조 단면과 그 위 PV, 짧은 지지는 부모의 얇은 평지붕 캐노피를 공간으로 구체화한다. 독립 rail grid를 가짜 facade mullion으로 내려 보내지 않아 유리의 방·층 대응을 유지한다.
-->

**캐노피 수정 설계 r2와 v-075 근거 보완.** 이 단면은 reference의 얇은 지지식 PV 캐노피와 v-072의 배수·입면 대응·기울기 질문에 답하는 저작 결정이다. 사진의 픽셀을 치수로 역산하지 않았다. v-073 설계 제출 당시 source는 모듈 면적 전체를 채운 검은 cassette box였다. 승인 뒤 구현된 아래 frame·rail·배수 부재와 PV 표현은 v-075에서 충실도·시각 PASS를 받았다. 그 판정에서 지적된 조경 이동의 설계 근거는 아래 보완하며 재판정 대상이다. 지붕 전체의 owner는 [분해 선언](../settings/003-spatial-basis.md#surface-decomposition)의 main author / src/house/envelope/roof.ts다. roof/canopy의 형상과 마감은 이 owner가 함께 맡는다.

[매스 datum](002-spatial-graph.md#mass-and-storeys)의 구조 지붕 상단 y=6.40m, 본채 x=-5.50..5.50m·z=-6.00..6.00m, 실내 upper ceiling y=6.10m를 유지한다. 실내 천장은 [2층 owner](002-spatial-graph.md#upper-level)가 맡는다. room·문·층·단일 계단 그래프는 바꾸지 않는다. 박공·굴뚝·옥상 테라스·상시 옥상 출입 connector를 추가하지 않는다. r1의 모든 부재가 같은 y에 놓인다는 결정은 철회한다. 배수가 가능한 방향과 높이를 정하기 위해 캐노피는 +Z로, 방수 지붕은 -X로 각각 1% 기울인다. 건물의 층과 구조 slab를 기울이는 결정이 아니다.

**기울기와 높이.** 모든 수치는 m이며 평면 치수는 world XZ 투영값이다. 캐노피 bounds는 x=-5.80..5.80, z=-6.70..6.30을 유지한다. 하부 기준면 B(z)=6.70+0.01×(6.30-z), 주보·rail 상면 J(z)=B(z)+0.12, frame 상면 T(z)=J(z)+0.03, PV 상면 P(z)=B(z)+0.161로 정한다. +Z 방향으로 낮아지고 X 방향 fall은 0이다. 명시 tilt는 atan(0.01), 약 0.573°이며 전체 13.00m 길이에서 0.130m 내려간다. 주보·rail의 0.12m와 그 위 frame의 0.03m는 world Y 단면 깊이다. 합계 깊이는 0.15m이고 각 부재의 상하 face는 B에 평행하다. 단순 회전으로 두께·끝 좌표를 바꾸지 않고 선언 face에서 정점을 도출한다. 아래 표는 이 식의 설계값이며 컴파일 측정값이 아니다.

| 캐노피 위치 | B 하부 | J 주보·rail 상부 | T frame 상부 | P PV 상부 |
| --- | --- | --- | --- | --- |
| 전면 z=-6.70 | 6.830 | 6.950 | 6.980 | 6.991 |
| 중앙 z=-0.20 | 6.765 | 6.885 | 6.915 | 6.926 |
| 후면 z=6.30 | 6.700 | 6.820 | 6.850 | 6.861 |
| 좌·우측 x=±5.80 | 각 z의 B(z) | 각 z의 J(z) | 각 z의 T(z) | 각 z의 P(z) |

같은 깊이의 주보·rail·frame을 겹쳐 지지한다고 썼던 r2의 최초 단면은 이 보완에서 폐기한다. 주보·rail의 0.12m 깊이를 유지하고 rail을 주보 면에서 끝내며 frame만 그 위에 0.03m 얹는다. 전체 frame 상단은 이전보다 0.03m 높아진다. 변화의 원인은 부재의 체적 중첩이며 외관을 크게 보이게 하려는 매스 변경이 아니다. cap·post·pedestal과 B/R 경사·본채 그래프는 그대로 소비한다. 새 상단은 위 표와 처마 투영·교체 여유에 함께 전파한다.

방수 지붕의 최종 물길 면은 R(x)=6.43+0.01×(x+5.50)이다. 구조 slab 위의 경사층 두께는 우측 x=-5.50에서 0.030m, 좌측 x=5.50에서 0.140m다. 최종 면은 우측 y=6.430, 중앙 y=6.485, 좌측 y=6.540이며 +Z fall은 0, -X fall은 1%다. 경사층과 방수 최종 면의 전체 owner도 roof다. roof top이라는 구조 datum과 방수 최종 면을 같은 높이로 기록하지 않는다. 전면·후면·좌측 edge는 최종 면 R보다 0.040m 높은 상단, 그 아래 0.12m 높이의 fascia를 갖는다. 외벽 밖 0.10m 물끊기는 이 fascia에 연결한다. 우측은 거터로 열려 있고 물길을 가로막는 같은 높이의 upstand를 두지 않는다. 이 변화는 기존 edge를 어느 높이에 붙일지 미정으로 남겼던 단면을 대체한다.

**지지와 열린 모듈.** X 방향 주보 중심은 z=-5.40,0,5.40이며 길이 11.60m, Z 폭 0.08m다. 상하 face는 J(z)/B(z)를 따른다. 각 주보 아래 지지는 x=-4.80,0,4.80과 해당 Z의 교점이다. 지지의 0.24×0.24m pedestal은 아래 face가 R(x), 수평 상단이 R(x중심)+0.030이다. 경사층을 뚫어 구조 slab에 고정하는 접합을 표현하고 pedestal 둘레에 폭 0.030m의 방수 return을 둔다. 고정 강도나 방수 성능 인증을 뜻하지 않는다. pedestal 위 base plate는 평면 0.16×0.16, 두께 0.012m다. 수직 post는 평면 0.08×0.08m, 하단 R(x중심)+0.042, 상단 B(z중심)-0.014다. cap은 평면 0.12×0.12m, 수평 하단 B(z중심)-0.014, 기울어진 상단 B(z)다. cap 두께는 양 Z 끝에서 0.0134..0.0146m가 되어 수평 post와 기울어진 주보 사이가 뜨지 않는다. 이 식에서 가장 짧은 post는 x=4.80,z=5.40의 0.120m, 가장 긴 것은 x=-4.80,z=-5.40의 0.324m다. base→post→cap→주보의 접합과 pedestal 주변으로 우회하는 물길을 함께 구현한다.

반복은 [입면 모듈 인터페이스](002-spatial-graph.md#envelope-interface)의 최대 1.20×1.90m에서 nx=ceil(11.60/1.20), nz=ceil(13.00/1.90), pitchX=11.60/nx, pitchZ=13.00/nz로 도출한다. Z 방향 rail의 축은 각 X module 경계에 두며 폭 0.08m, 상하 face J(z)/B(z), 전체 지지 축은 z=-6.70..6.30이다. 내부 축은 module 경계이고 외곽 축만 bounds에서 0.04m 안쪽이다. 주보와 rail을 동일한 교차 체적으로 중첩시키지 않는다. 각 주보 중심 zg에서 주보가 차지하는 Z=[zg-0.04,zg+0.04]를 rail 축에서 빼고, 주보 양쪽에 두께 0.006m의 end plate를 둔다. plate 평면은 해당 rail과 같은 X 폭 0.08m, Z=[zg-0.046,zg-0.04]와 [zg+0.04,zg+0.046], 상하 face J/B다. 실제 rail 몸체는 전체 Z 구간에서 이 주보·plate 구간을 뺀 나머지다. 이 반복은 주보 중심 배열에서 interval을 도출하며 구간별 record를 손으로 복제하지 않는다. 각 rail 끝은 plate의 바깥 면에 닿고 plate의 안쪽 면은 주보에 닿는 고정 맞댐 접합으로 정한다. 접합부를 하나의 Boolean solid로 합쳤다고 하지 않으며 plate 또는 rail이 주보 안으로 관통하지 않는다. 접합 강도·용접 시공 성능은 unverified다. 모든 교차점에서 주보→plate→rail 상부 J는 같은 경사면을 이루고, 그 위의 frame 아래 face가 J에 닿는다. 내부 rail의 frame 받침 폭은 각쪽 0.02m이고 외곽 rail은 폭 0.03m인 frame bar 전체를 받친다. plan bounds를 넘어 rail 폭을 더하지 않는다.

cassette는 module 중심에 놓이며 외측 투영 폭 pitchX-0.04, 길이 pitchZ-0.04, 높이 0.03m다. 평면 폭 0.03m의 네 frame bar만 만들고 가운데 금속 바닥판을 없앤다. X측 bar는 외측 길이 전체, Z측 bar는 두 X측 bar 사이를 채운다. 모든 bar의 상하 face는 T/J를 따른다. PV의 투영 폭·길이는 외측 cassette에서 각각 0.04m를 뺀 값이며 두께는 world Y로 0.012m, 상면 P, 하부 B+0.149다. 따라서 각 z에서 frame 안쪽에 0.01m 걸치고 0.001m의 안착 겹침을 유지한다. 이 겹침은 접합 표현이며 재료 압축이나 Boolean 합집합이 아니다. frame보다 0.011m 높은 PV 상면에서 +Z 하단 bar로 물이 넘어가며 물을 가두는 돌출 립을 추가하지 않는다. frame 상면도 1% fall을 유지한다. 패널별 전선은 저측 물길과 0.04m module 틈을 가로막지 않고 각 X측 bar의 안쪽 수직 면에 붙는 폭 0.015m service clip 영역에 둔다. 이 영역은 module 경계에서 안쪽 0.050..0.065m, 높이 J+0.005..J+0.015이며 rail 상부보다 위이고 PV 하부보다 아래다. clip의 Z 길이는 0.020m, 위치는 cassette 길이의 1/4과 3/4 지점이다. service clip과 그 clip에 묶인 패널 내 전선은 cassette에 귀속하고 고정 rail에 묶지 않아 cassette와 함께 탈거한다. frame 아래와 rail 상부 사이에 전선 체적을 끼워 안착을 띄우지 않는다. 실제 전력·배선 동작은 납품하지 않는다.

**우수 경로와 끝점.** 캐노피는 방수 포치가 아닌 drip-only PV 지지체다. PV 물은 각 cassette의 +Z 끝에서 열린 module 틈으로 떨어진다. 지지재를 만나는 물은 같은 +Z 경사를 가진 rail의 +Z 끝 또는 주보의 +Z 가장자리로 흐르고, 아래에 본채가 있는 부분은 방수 면 R이 받는다. 전체 cassette 아래에 연속 배수 판을 넣어 열린 하부를 다시 가리지 않는다. 본채 밖 투영 부분의 비와 모듈 낙수는 전면 z=-6.70..-6.00, 후면 z=6.00..6.30, 측면 |x|=5.50..5.80의 대지로 직접 떨어진다. 전면 landing의 해당 부분도 젖는 외부 공간이며 이 캐노피로 비가 차단된다고 하지 않는다. 바람에 따른 낙수 이동과 splash는 unverified다. 캐노피에는 별도 저장 수위나 숨은 drain/overflow가 없고 열린 저측 끝과 module 틈이 연속 방출 경계다.

방수 면 R에 모인 물은 -X로 흘러 x=-5.60까지의 물끊기 끝에서 우측 거터에 들어간다. 거터의 외측 평면 범위는 x=-5.78..-5.58, z=-6.10..6.10m, 판 두께는 0.002m이며 내부 폭은 0.196m다. 거터 바닥 내측 높이 G(z)=6.290+0.005×|z|, 외측 및 양 끝 상단 y=6.450, roof와 만나는 내측 상단 y=6.420으로 정한다. 앞·뒤 양 끝에서 중앙 z=0으로 0.5% 내려가고 끝 바닥은 6.3205, 중앙 바닥은 6.290이다. 우측 roof의 y=6.430 물길은 거터 안으로 열려 있다. outlet 중심은 x=-5.68,z=0, 내경 0.10m다. roof owner가 거터·거름망·outlet부터 y=6.10까지의 관 상단을 만들고, 그 아래는 [우측 전체](#right-face)의 외부 배수관으로 면 접합한다. 거름망은 outlet과 같은 XZ 중심의 평면 0.16×0.20m, 아래 y=6.410·위 y=6.430의 탈착 insert다. 거터 안쪽 두 받침 ledge는 X=-5.778..-5.750 및 -5.610..-5.582, Z=-0.14..0.14, Y=6.408..6.410을 차지해 망의 양쪽 끝을 각각 0.010m 받친다. 외측 ledge는 overflow notch의 Z 양끝 밖으로 0.040m씩 이어져 남아 있는 거터 벽에 붙고, notch 한가운데의 사라진 벽만을 지지점으로 삼지 않는다. 망은 ledge 상면에 닿고 outlet으로 내려오는 물길을 막는 영구 cap은 없다.

outlet 막힘 때의 우회로는 거터 외측 -X face의 z=-0.10..0.10, y=6.380..6.430m 열린 overflow notch다. invert는 중앙 바닥보다 0.090m 높고 방수 지붕의 낮은 면보다 0.050m 낮다. roof owner가 x=-5.90까지 길이 0.12m의 바깥쪽 spout를 이어 준다. overflow는 관에 재합류하지 않고 우측 대지로 보이게 떨어진다. 이 부분만 캐노피 평면 x=-5.80보다 0.10m 나오는 배수 부속이다. 캐노피 bounds에 포함된 지지재로 잘못 측정하지 않는다. 유량·설계 강우·집수 용량과 실제 월류 시험은 unverified다. 그 한계가 경로·낮은 점·출구 치수를 생략할 이유는 아니다.

**입면 기준선 소비.** 다음 표는 opening owner의 유효 span과 glazing-interface의 최대 1.25m 반복을 소비하는 대조표다. 각 span 끝의 jamb 중심은 a-0.02,b+0.02이며 내부 mullion은 a+k×(b-a)/ceil((b-a)/1.25)다. 필수 분할이 있으면 그 선에서 먼저 나눈다. 표의 소수는 읽기 위한 반올림이고 source는 원본 opening 값과 식을 사용한다. 캐노피 격자를 창호에 강제로 맞춰 방이나 개구를 움직이지 않는다.

| 면·opening owner | 유효 span 및 우선 분할 | 소비되는 jamb/mullion 중심 기준선 |
| --- | --- | --- |
| 전면 [계단실](#front-stair-glazing), 두 층 | X=-1.20..1.54 | -1.22, -0.286667, 0.626667, 1.56 |
| 전면 [작업실](#front-flex-glazing), 1층 | X=3.06..5.22 | 3.04, 4.14, 5.24 |
| 전면 [침실](#front-bedroom-glazing), 2층 | X=1.80..5.22; 하층 jamb X=3.04 우선 | 1.78, 3.04, 4.13, 5.24 |
| 후면 [공용부](#rear-common-glazing), 1층 | X=-5.22..5.22 | 양끝 ±5.24; 내부 -4.06부터 1.16 간격으로 4.06까지 |
| 후면 [주침실](#rear-bedroom-glazing), 2층 | X=-2.80..5.22 | -2.82, -1.654286, -0.508571, 0.637143, 1.782857, 2.928571, 4.074286, 5.24 |
| 후면 [욕실](#rear-bath-glazing), 2층 | X=-4.86..-3.42 | -4.88, -4.14, -3.40 |
| 좌측 [작업실](#left-flex-glazing)·[침실](#left-bedroom-glazing), 두 층 | Z=-5.40..-2.30 | -5.42, -4.366667, -3.333333, -2.28 |
| 좌측 [작은 침실 2](#left-child-two-glazing), 2층 | Z=0.35..1.90 | 0.33, 1.125, 1.92 |
| 우측 [공용부](#right-common-glazing)·[욕실](#right-bath-glazing), 두 층 | Z=3.60..5.40 | 3.58, 4.50, 5.42 |

캐노피 X rail 중심은 내부 -5.80+i×pitchX(i=1..nx-1), 양끝 ±5.76이며 현재 저작 span에서 내부는 -4.64부터 1.16 간격으로 4.64까지다. Z module 경계는 -6.70+j×pitchZ(j=0..nz)다. 이 grid는 roof 위의 독립 지지 grid이고 mullion의 수직 연장선이 아니다. 예를 들어 후면 공용부의 내부 mullion은 인접 rail에서 각각 0.58m, 전면 작업실의 X=4.14 mullion은 rail X=4.64에서 -0.50m 떨어진다. 외곽 rail X=±5.76은 양 끝 창 jamb X=±5.24보다 0.52m 바깥이다. 모든 대응 offset은 위 두 grid의 차로 계산하며 내부 rail마다 가짜 facade mullion을 추가하지 않는다.

지지 중심 x=-4.80,0,4.80은 가장 가까운 해당 rail -4.64,0,4.64와 각각 -0.16,0,+0.16m 차이다. cap은 rail에 직접 닿는 것으로 선언하지 않고 X 주보를 통해 연결한다. 주보의 z=-5.40,0,5.40은 전·후면 외벽에서 0.60m 안쪽이며 측면 mullion으로 내려오는 기둥선이 아니다. 좌측 전면 창 jamb Z=-5.42와 앞 주보의 투영차는 +0.02m, 우측 후면 jamb Z=5.42와 뒤 주보는 -0.02m다. 여기에서도 창틀에 하중을 맡기는 정렬로 해석하지 않는다. 가장 바깥 pedestal 외곽은 |x|=4.92,|z|=5.52이므로 본채 외면까지 X 방향 0.58m, Z 방향 0.48m 이격된다. 방수 return은 그 바깥 0.03m 안에서 끝난다.

개구부 회피 영역은 각 opening의 structural cut을 입면 접선·Y 방향으로 0.10m, 외벽의 법선 방향으로 0.15m 더한 3D 범위다. [현관문](002-spatial-graph.md#front-entry)도 포함한다. 지붕 pedestal·post·cap·주보·rail과 배수관은 이 범위에 들어가지 않는다. 최고 고정창 head 바깥면은 y=6.04이므로 회피 영역 상단은 6.14이며 slab 상단 6.40과도 0.26m 떨어진다. post를 지면까지 연장해 1층·2층 opening을 가리는 해석을 금지한다. frame 바깥의 1층 head y=2.84와 2층 sill y=3.28 사이 층 band, floor y=3.20은 그대로다. gutter 최저 바닥 외측 y=6.288은 상층 head 회피 영역 위에 있고, z=0의 우측 배수관은 가장 가까운 창 structural cut 시작 Z=3.56보다 3.50m 이상 앞에 있다. 문·창·층 band를 roof 부재의 위치에 맞춰 재편하지 않는다.

처마의 본채 외면 대비 수평 돌출은 전면 0.70m, 후면과 좌·우측 각각 0.30m다. 그림자는 특정 태양 시각의 성능값으로 선언하지 않는다. 현재 viewer의 고정 directional key 위치 (-12,18,-8), target (0,0,0)을 대조 조건으로 사용하면 광선 방향 비는 (12,-18,8)이다. 투영 point Q=(x,y,z)에서 전면 z=-6까지 이동하는 값은 t=(-6-z)/8, 투영은 (x+12t,y-18t,-6)이다. 전면 외곽의 하부 B(-6.70)=6.830과 상부 P(-6.70)=6.991에서 +X로 1.05m, 아래로 1.575m 이동하여 각각 y=5.255와 5.416에 도달한다. 외곽 투영의 X 범위는 -4.75..6.85이고 본채에서 -4.75..5.50로 잘린다. 따라서 이 광원 조건의 캐노피 그림자는 전면 2층 창 상부에 걸릴 수 있지만 1층 head까지 차양을 보장하지 않는다. 우측 x=-5.50까지의 투영은 외곽에서 +Z로 0.20m, 아래로 0.45m 이동하며 하부는 y=6.315-0.01z, 상부는 y=6.476-0.01z다. 면의 Z=-6..6에서 하부는 y=6.375..6.255, 상부는 y=6.536..6.416이다. 최고 창 head보다 높아 우측 창을 이 캐노피가 가린다고 주장하지 않는다. 후면·좌측은 이 key의 직사면이 아니므로 캐노피 단독 그림자 면적으로 세지 않는다. 이는 높이·돌출과 광선비의 설계상 envelope 계산이다. 열린 module 틈과 rail이 실제로 만드는 얼룩·가림, 하늘광과 실내등의 합성은 새 GPU 프레임에서 확인해야 하며 현재 unverified다.

**점검·교체 여유.** 캐노피 아래의 roof와 주보 사이를 사람 통로로 쓰지 않는다. 각 cassette는 위에서 푸는 체결점 네 곳으로 고정한다. 체결점은 양 X측 frame bar 위의 선(각 module 경계에서 안쪽 0.030m), 각 cassette Z 끝에서 안쪽 0.070m다. 지름 0.006m fastener의 몸체는 T부터 J-0.010까지, 지름 0.012m·높이 0.008m인 head는 T..T+0.008에 둔다. frame을 지나 rail 상부에 물리는 체결이며 fastener 축의 지름 0.0065m 수용 구멍을 frame·rail에서 같은 위치로 도출한다. head의 X 가장자리는 PV 시작선보다 0.004m 바깥이고, T+0.020부터 시작하는 공구 공간은 PV 상면 T+0.011보다 0.009m 위다. 이 치수는 보이는 접합과 접근을 정하며 체결 토크·인발 강도를 인증하지 않는다. 각 체결점에서 frame 상면보다 0.020m 높은 곳부터 0.060×0.060×0.120m 공구 접근 공간을 예약한다. PV 가장자리 위를 손으로 누르거나 glass를 통과해 체결구를 조작하는 경로를 만들지 않는다. 체결점 네 곳을 해제한 뒤 cassette 전체를 world +Y로 0.20m 들어 인접 frame·rail을 벗기고, 그 높이 이상에서 옮긴다. cassette 투영 bounds의 각 면에 0.10m를 더한 평면과 P의 최댓값 위 1.20m까지의 공간은 들어 올리고 옮기는 여유다. 최고 위치에서 예약 상단은 6.991+1.20=8.191m이므로 아래 장비의 작업 높이 8.20m 요구 안에 든다. 해당 소모품을 교체할 때 이 공간에 고정 배선·난간·수관이 들어올 수 없다. 패널 사이 0.04m는 배수·조립 틈이고 보행 폭이 아니다.

외부 점검은 양 측면의 임시 고소작업대가 위에서 수행한다. [대지 owner](001-citizen-house.md#site-access)는 x=5.80..7.80 및 x=-7.80..-5.80, z=-7.30..7.30m에 폭 2.00m의 장비 접근 예약대를 유지한다. 이 범위는 기존 대지 안이고 현관 접근 x=1.30..2.90과 겹치지 않는다. 임시 장비의 요구 envelope는 폭 1.80m 이하, 길이 3.00m 이하, 아웃트리거가 예약대를 넘어가지 않는 형태다. 바스켓은 외측에서 들어와 PV 최고면 위에서 최소 0.60m의 작업 여유를 갖고, 같은 쪽 절반의 가장 먼 cassette까지 수평 7.30m·작업 높이 8.20m에 닿아야 한다. 이 값은 장비 선정에 전달할 요구이며 설치된 장비가 그 조건을 만족한다는 증명은 아니다. 외부 장비의 형상·동작을 새 납품 asset으로 발명하지 않는다. 판정 전 실제 장비·작업 하중·지반과 작업 안전은 unverified다.

**정비 접근을 위한 조경 이동·보존 결정.** 위 장비 예약대와 [전면 cassette 임시 예약면·집수구](001-citizen-house.md#site-access)를 비우기 위해 기존 나무 4개와 측면 관목 48그룹을 후면으로 옮긴다. 원래의 나무·관목을 삭제하거나 수관을 축소하는 결정이 아니다. 이 H2가 정비에 따른 목적지·보존 조건을 소유하고, 대지의 완결 표면 owner인 main author / [src/house/site/garden.ts](../../src/house/site/garden.ts)가 식재·지면·집수구를 함께 실현한다. roof.ts가 식물을 생성하거나 garden이 캐노피 여유를 별도로 정하지 않는다. 같은 [site-access](001-citizen-house.md#site-access)가 이 결정을 소비하고 `citizenHouseSpaceSource`의 `buildHouse()`가 `garden(a)`를 호출하므로 별도 viewer 조경은 없다.

나무의 기존 배치 기준점 XZ는 tree-0=(-6.7,-6.4), tree-1=(6.7,-5.6), tree-2=(-6.7,6.8), tree-3=(6.7,7.1)이었다. 각 나무 i=0..3의 기준점을 X=-4.2+2.8i, Z=7.4로 옮기고 그 기준점 주위 world +Y 회전을 121° 적용한다. 즉 새로운 X 기준점은 -4.2,-1.4,1.4,4.2이며 이 기준점은 기울어진 줄기 mesh의 중심 좌표가 아니다. 줄기 하단 Y=-0.45와 기존 높이 입력 top=3.3+0.35i, 줄기·가지·잎의 치수·상대 형상·재료·element ID는 보존한다. `tree-i-trunk`, `tree-i-branch-j`의 j=0..10 및 `tree-i-leaves-j-k`의 k=0..4를 하나의 나무로 함께 강체 변환한다. 회전은 수관을 후면 띠에 맞추기 위한 저작 선택이며 가지나 잎을 일부 감추는 축소가 아니다.

관목의 기존 두 측면 배치는 side=-1,+1 및 i=0..23에서 X=side×(6.5+0.14sin(2.4i)), Z=-6.7+0.61i였다. 이동 후에도 `hedge-side-i-k`의 side/i를 유지하고 n=(side<0?0:24)+i로 통합 순번을 도출한다. 새 그룹 기준점은 X=-5.1+(n mod 16)×10.2/15, Z=7.44+floor(n/16)×0.26이다. 따라서 후면의 Z=7.44,7.70,7.96 세 줄과 X=-5.1..5.1의 등간격 열을 쓰며 손으로 48개 위치를 복제하지 않는다. 각 그룹의 기존 다섯 ellipsoid(k=0..4), X/Z 오프셋 0.20sin(2.4k)/0.20cos(2.4k), 중심 Y=-0.11+0.10(k mod 2), 크기 0.62×0.70×0.60 및 leaf 재료를 보존한다. 그룹 기준점과 개별 ellipsoid 중심·실제 bounds는 구분한다.

전면의 낮은 풀은 현관 통로를 제외하는 기존 규칙과 ID를 유지한다. X=-5.5+0.39i(i=0..28) 중 1.05<X<3.1은 원래부터 배치하지 않는다. 남은 그룹 중 cassette 예약면에 가까운 -4.49<X<-2.61의 다섯 그룹(i=3..7)만 Z=-6.6에서 Z=7.6으로 옮긴다. 각 그룹의 일곱 rod와 형상·재료·높이는 보존하고 나머지 전면 풀은 원위치에 둔다. 나무·관목·풀 모두 `citizen-site`에 귀속하며 지붕·실내 room으로 소속을 바꾸지 않는다. 전면의 나무와 높은 관목이 없어 더 비어 보이는 결과는 이 정비 접근 결정의 시각적 대가다. 사진과 같은 조경 밀도가 완성됐다고 선언하지 않는다.

이전·이후의 보존 기준은 식물군별 ID와 model/part 형상·scale·material 및 나무 내부 상대 transform이고 변경 허용 범위는 위 강체 배치다. 현재 컴파일된 `/scene`에는 줄기 ID 4개와 전체 tree element 268개, 관목 그룹 48개와 그 element 240개, 풀 그룹 23개가 있다. 수치의 근거는 컴파일된 element 목록이며 앞의 반복식은 그 목록을 생성하는 저작 결정이다. [canopy audit](../../src/house/canopy-audit.ts)는 이 식물들의 native bounds를 양 측면 장비 예약대와 전면 cassette 예약면의 Y=-0.46..8.20 영역에 대조한다. `plant id: maintenance reservation index`가 있으면 실패이며 줄기 기준점만 구역 밖이라는 이유로 통과시키지 않는다. 집수 격자와 인출 공간도 기존 site 관찰에 남긴다. 이 문서 보완은 현재 형상·배치를 바꾸지 않으며 식재 생육·뿌리·지반·장비 운용 성능은 unverified다.

roof owner는 거터 상부를 덮는 우측 끝 cassette를 먼저 분리한다. 거름망은 +Y로 0.10m 들어 거터 rim을 벗기고, +X로 0.10m 옮겨 외곽 rail을 피한 뒤, +Z로 0.20m 옮겨 중앙 주보를 피한다. 이 두 수평 이동은 망 상단 y=6.530에서 주보 하부 B보다 낮게 수행한다. 이후에만 망 아래가 P(0.10)+0.10=7.023m에 도달할 때까지 +Y로 인출한다. 최종 망 상단은 7.043m다. 이동 후 X=-5.66..-5.50은 외곽 rail의 안쪽 끝 X=-5.72에서 0.06m 떨어지고, Z=0.10..0.30은 중앙 주보·plate의 끝 Z=0.046에서 0.054m 떨어진다. 최종 수직 인출은 제거한 cassette의 aperture 안이다. 인출 경로 예약 범위는 X=-5.80..-5.40, Z=-0.20..0.40, 거터 상단 위 0.70m까지다. 실제 망의 단계별 swept volume을 이 범위와 고정 주보·plate·rail에 대조하며, rail만 피하면 통과한다고 세지 않는다. 내측 지지의 점검은 그 지지 위에 걸리는 cassette를 먼저 들어낸 뒤 지름 0.020m 이내의 카메라·공구를 위에서 내려 pedestal·cap의 양측 0.050m 여유를 통해 관찰한다. 낮은 roof 틈으로 사람이 기어들어간다는 가정은 없다. 클램프·PV/rail 접합·물길·망·outlet·overflow와 관의 점검구를 개별 관찰 대상으로 추가한다. 청소 주기나 원격 장비의 실제 운용 성공은 시뮬레이션하지 않는다.

수리 후 관찰은 현재 topology에서 파생된 roof-face, canopy-top, canopy-soffit, 노출 모서리 전체를 유지하고 배수 끝점·부재 접합·탈거 공간을 더한다. 새 경사면은 단일 y 상수로 관찰 bound를 축약하지 않는다. 원래의 단일 판, 이 개정의 열린 frame, PV cell·광학 마감은 같은 카메라·광원에서 대조한다. count·부재 bounds·opening 회피·물길 단면·lift 여유는 컴파일된 산출물에서 읽고, 실제 리뷰 거리의 frame·틈·지지·그림자는 GPU에서 본다. 이전 검은 cassette 캡처를 r2 구현 증거로 쓰지 않는다. v-075는 실제 WebGL2의 외관·상부·하부에서 셀 간격·프레임·레일 리듬과 구현 충실도를 통과시켰다. 조경 이동의 설계 추적 보완은 r3 재판정에 남기고 그 PASS를 미리 선언하지 않는다. 구조·처짐·내풍·수밀·배수 용량·발전량·실물 사용성의 인증은 unverified다.

## 창호의 공간 인터페이스 {#glazing-interface}

<!--
@evidence principles/core/common.md#declared-basis 외부 고정창의 0.04m frame face·0.14m 깊이와 최대 1.25m bay는 실물 점유를 정하는 저작값으로 구분한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 0.04m 면 폭·0.14m 깊이·1.25m 최대 bay는 이 단위의 저작 입력이고 각 창의 span·sill·head는 opening owner에서 받는다. 루버의 F·k·p·H(j)는 그 sill과 기존 반투명 띠에서 도출한 저작 선택이며, 본문은 다섯 레퍼런스의 창에 외부 루버가 없고 reference04의 가로 슬랫이 식재대 너머의 정원 펜스라고 밝혀 형식 근거를 레퍼런스에 두지 않는다. 21.801°는 atan(0.40)이며 사진에서 잰 각도나 시험 성능이 아니다.
@evidence principles/core/common.md#scope-preservation 유리·jamb·head·sill·mullion·reveal과 하부 고정 루버를 별도 점유로 남기고 기존 roller가 움직일 공간을 보존한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 pane·frame·reveal뿐 아니라 setting block, gasket 모서리, spandrel의 slot·clip·seal, 루버의 끝판·arm·체결·인출 공간까지 이 창호 인터페이스에 포함한다. 고정 루버를 더해도 기존 roller와 욕실의 반투명 층을 지우지 않으며 전체 입면 owner와 실내 lining owner의 경계를 유지한다. 차양의 지지나 교체 공간을 이름뿐인 후속 과제로 빼지 않았다.
@evidence principles/core/common.md#substantive-completion effective span과 panel clear, frame 확장 cut, 반복 분할에 더해 루버의 경사·브래킷·체결·배수·인출 여유와 현관 접근 구역 위 bay의 제외를 같은 창호 단면에서 정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 단면 표와 뒤따르는 안착 설명은 web과 유리 사이 0.004m 여유와 setting block의 지지를 정하고, band는 drip의 3.25..3.28을 빼며 drip 안쪽 끝을 몸체 안 n=-0.110에 둔다. 루버는 날개 경사, 두 종류 공구 축, 긴 고정 몸체를 먼저 뽑는 교체 순서를 주고, 낙수가 현관 접근 구역 x=1.30..2.90과 겹치는 bay와 수관이 외벽 가까이 오는 후면 창을 빼는 규칙과 그 사생활 대안을 정한다. 따라서 구현자가 빈 접합·배수·해체 순서를 다시 설계할 필요가 없고, 실제 충돌은 source의 compiled bounds에서 따로 읽는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation curtainwall 요구를 실제 frame 점유와 room/floor 우선 분할을 갖는 반복 공간 규칙으로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 privacy-states는 고정 차양과 가변 roller의 역할을 정하지만 날개 단면이나 지지는 주지 않고, opening owner는 유효 span·sill·head만 정한다. 이 단위는 우선 경계 사이 ceil 반복, 유리 안착·return의 끝, 고정 루버와 roller 사이 간격을 추가해 그 부모 입력을 조립 가능한 공간 점유로 만든다. 부모의 낮·사적·야간 목록을 늘여 쓰는 것으로 끝나지 않는다.
@evidence principles/design/spaces.md#space-topology 창의 cut은 host 두께를 관통하지만 고정 유리로 채워지며 방 사이 경계를 가로지르는 panel을 허용하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 structural cut은 벽을 관통하되 pane와 frame으로 채워지는 고정창이고, room/floor 우선 분할이 그 유리의 경계를 제한한다. 루버는 지정된 작업실·침실 창의 외측에, roller는 그 뒤에 놓이며 청소·교체는 외부 +n 인출로 접근한다. 이 관계에서 창을 새 통행 connector로 만들거나 광학 띠 경계에 실제 통과 틈을 추가하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority opening은 유효 span을 소유하고 panel과 mullion은 같은 분할선에서 도출하여 glass 폭을 별도 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 opening의 유효 span과 이 인터페이스의 frame 점유가 서로 다른 양으로 정의되고 pane clear는 인접 부재 면에서 도출된다. band 분할도 상층 mullion을 소비하면서 front의 아래 4.14·위 4.13 차이를 보존하므로 grid를 맞추려 상층 방이나 승인된 캐노피 기준선을 다시 쓰지 않는다. 루버 역시 같은 bay와 C 기준 n을 써 별도 창 폭·원점을 소유하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 모든 opening의 반복 경계·room/floor 대응, frame/reveal 연속성, 루버와 roller의 상태별 이격 및 탈거 경로를 실제 부재 bounds에서 대조한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 유리/web 관통·head/mullion 중첩은 전 window의 실제 seat와 부재 bounds, 1e-7m 치수 대조로 검출하도록 했다. 루버는 모든 적용 opening의 극단 bay·날개와 세 상태의 roller 교차, 인출 swept volume을 읽고 p-0.034·p-0.038·0.041·0.135의 최소 간격을 검사한다. 접합 확대와 기존 방·입면 관찰도 유지하므로 대표 외관이 좋아 보여도 끝판이나 교체 경로의 실패를 놓치지 않는 계획이다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work curtainwall과 내부 경계 일치 요구를 우선 분할 및 ceil 반복 규칙에 대조했다. bay를 위해 부모 room이나 floor line을 이동할 필요가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 실제 privacy-states의 고정 차양·60%/100% roller 조건과 기존 창의 sill/head·room 우선 경계를 이 단면에 대조했다. bay 내부 반복으로 방 경계를 보존하고 고정 끝 X=5.665가 정비 예약대 X=5.80 안쪽에 남도록 결정되어, 부모 상태를 줄이거나 대지를 확장해야만 성립하는 배치는 아니다. 이 단위의 설계 비교에서 부모 수정 사유는 없으며 실제 탈거·장비 운용 성공은 아직 검증하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 반복 부재를 측정 span과 규칙에서 만들고 모든 유리 panel이 방·바닥선 경계를 지키게 한다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d room/floor를 먼저 나누고 각 남은 span에만 ceil 반복을 적용하여 단일 panel이 내부 방 경계를 가로지르는 반례를 배제한다. 하부 반투명 띠와 별도 고정 날개·roller를 유지하며 선 texture나 연속 불투명 판으로 차양을 대신하지 않는다. band와 루버를 추가하는 범위도 기존 창과 외부 점유에 한정되어 방·계단 그래프의 변경을 요구하지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 하부 반투명 영역 앞의 고정 루버는 낮·사적·야간에 같은 위치이며 기존 roller의 60%·100% 이동과 욕실의 고정 반투명 층을 대신하지 않는다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 루버 대상은 작업실·침실의 하부 띠 가운데 표의 다섯 opening이고, 수관이 앞을 차지하는 후면 주침실 창과 공용부·계단·욕실에는 같은 날개를 일괄 복제하지 않는다. 세 상태에서 날개·지지·체결의 transform은 동일하게 두고 roller의 면적과 유리의 광학 띠는 부모 입력을 계속 소비한다. 따라서 부모의 60%/100% 내림이나 욕실 고정 반투명을 고정 날개의 가림 효과 하나로 대체하지 않으며 실제 사생활 차단 성능은 미검증이다.
-->

각 opening의 유효 span은 양쪽 jamb의 안쪽 면 사이 거리다. 이 범위에는 내부 mullion의 점유도 포함되고, 개별 유리 panel의 clear 폭과 같지 않다. 모든 외부 고정창의 유효 span 바깥에 면 폭 0.04m, 깊이 0.14m의 head·sill·jamb를 두고 내부 분할선에는 같은 단면의 mullion을 중심 정렬한다. 이 값은 창호 공간 점유를 정하는 저작 입력이고 finish·광학 성능의 인증이 아니다. 실제 host wall의 structural cut은 유효 span에서 frame 면 폭만큼 확장한 윤곽이다. wall 두께를 관통해 cut하고 깊이가 다른 wall과 frame 사이에는 reveal이 연속해서 닿는다.

각 opening의 유효 길이를 1.25m 이하인 bay로 나눈다. room/floor/채택된 하층 jamb의 중심선을 우선 분할선으로 사용하고 각 독립 span마다 count=ceil(span/1.25), pitch=span/count로 정한다. 각 panel은 인접 frame의 안쪽 면 사이를 채우며 mullion의 점유 폭을 유리에서 제외한다. module record를 수작업 복제하지 않는다. 바닥선이나 방 경계를 가로지르는 유리 panel은 만들지 않는다. 모든 opening에서 이 실제 반복 경계와 room/floor를 [관찰](001-citizen-house.md#spatial-observation)로 대조한다.

**창틀·층간 접합 수정 설계.** v-071이 지적한 단순한 frame과 spandrel 표현을 이 인터페이스의 실제 단면으로 보완한다. 기존 0.04m 면 폭·0.14m 깊이, opening의 유효 span·sill·head, bay 우선 분할은 유지한다. 사진의 치수를 추측하지 않는다. 아래는 저작 입력이며 제작 제품의 시험값이 아니다. window·부재는 각 전체 입면 owner가 소유하고 새로 쪼갠 파일에 표면 책임을 넘기지 않는다. 방과 계단 그래프, 캐노피의 승인된 기준선·배수·지지는 그대로다.

단면은 벽 중심 C에서 외측으로 증가하는 n을 사용한다. 외벽은 n=-0.120..0.120, 창틀은 n=-0.070..0.070, 유리는 n=-0.009..0.009다. 창틀의 길이 방향에 직각인 단면 좌표를 s라 하고 부재 중심을 s=0으로 둔다. 아래 단면을 jamb·mullion·head·sill에 공통 적용한다. 깊이를 바꾸기 위해 pane나 벽을 이동하지 않는다.

| 부재 | s 범위 | n 범위 및 접합 |
| --- | --- | --- |
| 실내측 본체 | -0.020..0.020 | -0.070..-0.015 |
| 중앙 연결 web | -0.010..0.010 | -0.015..0.015; 본체와 압착판에 면 접합 |
| 외측 압착판 | -0.020..0.020 | 0.015..0.035 |
| 외측 덮개 | -0.018..0.018 | 0.035..0.070; 양측 본체보다 0.002씩 들어감 |
| 유리 받침·가스켓 | glass가 접하는 쪽의 abs(s)=0.014..0.020 | 실내 -0.015..-0.009, 외측 0.009..0.015 |

덮개는 s=±0.018, n=0.035..0.070의 모따기 없는 직사각 판이며 본체·압착판보다 양쪽 0.002씩 들어간다. solid box 한 개를 그대로 두고 선만 그려 이 분해를 대신하지 않는다. 본체·web·압착판·덮개는 접하는 별도 실체다. 유효 pane clear가 L..R이면 실제 유리 끝은 L-0.006..R+0.006, 높이는 sill-0.006..head+0.006으로 받침 안에 들어간다. 유효 채광 윤곽은 바뀌지 않는다. 이 6mm는 glass와 metal을 관통 중첩시키는 값이 아니다. glass 끝은 abs(s)=0.014까지, web은 abs(s)<=0.010까지만 있어 0.004m의 빈 가장자리 여유가 남는다. 가스켓은 유리 두 face에 접하며 유리 부피 안으로 들어가지 않는다. 외곽 jamb의 벽 쪽에는 유리 받침을 복제하지 않는다. 각 pane 하단의 접선 1/4·3/4에는 폭 min(0.05,pane clear폭/8), Y=sill-0.010..sill-0.006, n=-0.009..0.009의 setting block을 둔다. block은 sill web 상면과 유리 하단을 실제로 이어 0.004m의 가장자리 여유를 떠 있는 유리로 남기지 않는다.

수직 jamb·mullion은 sill-0.04..head+0.04로 연속한다. 수평 head·sill의 네 부재는 각 bay에서 인접 수직 부재의 같은 부재 face까지 이어 맞댄다. 본체·압착판은 m±0.020, web은 m±0.010, 덮개는 m±0.018에서 끝나 모서리에 틈이 남지 않는다. 유리 받침은 각 pane 둘레에 적용하되 수직 strip을 유리 높이 전체로 두고 수평 strip을 그 사이에서 끝낸다. 네 모서리에서 가스켓을 두 번 겹치지 않는다. 하부 반투명 띠와 상부 유리의 상태 경계는 기존 Y를 유지하고 광학 띠 사이에는 새로운 금속 transom이나 공기 틈을 넣지 않는다. 실제 유리의 늘어난 상하 0.006m 부분만 인접 끝 띠의 상태를 이어 받는다. 광학 값과 shade drop 비율은 기존 privacy owner의 입력을 그대로 쓴다. 아래 고정 외부 루버는 이 창호에 붙는 실제 점유를 정하며 별도 광학 설계의 승인을 대신하지 않는다.

perimeter reveal은 structural cut의 네 변에서 cut 안쪽으로만 폭을 내는 금속 return으로 닫는다. 실내측은 폭 0.004m, n=-0.120..-0.070이며 외측은 폭 0.006m, n=0.070..0.120이다. 외측 return은 덮개 끝 face와 cut 가장자리 쪽 0.004m 폭으로 실제 맞닿는다. 실내측은 본체 끝 face에 0.004m 폭으로 닿는다. 수직 return이 cut 높이 전체를 맡고 수평 return은 그 사이에서 끝낸다. 어느 return도 유효 clear에 도달하지 않는다. 실내 return 끝은 room lining의 n=-0.120 경계에, 외측은 외장 면 n=0.120에 닿는다. room lining이 없는 계단 void의 front-stair-glazing-upper에서는 실내 return이 외벽 몸체 실내 면 n=-0.114에서 끝나 맨 벽보다 돌출하지 않는다. 기존 벽의 cut side를 지우거나 얇은 return 뒤에 다른 opening을 만들지 않는다. room은 기존 cut을 소비하는 lining만 소유하고 이 금속 return을 중복 생성하지 않는다.

**층간 스팬드럴 덮개.** 아래층 head+0.04와 위층 sill-0.04 사이가 floor y=3.20을 포함하며 아래 head=2.80·위 sill=3.32인 위아래 window 쌍에만 적용한다. 유효 span의 frame 포함 범위를 교집합해 band의 접선 범위를 얻는다. 이에 해당하는 것은 front의 stair 쌍과 flex/child-one 쌍, rear의 common/primary 쌍, left의 flex/child-one 쌍, right의 common/bath 쌍이다. 높은 sill의 rear bath와 left child-two를 임의로 floor까지 유리로 늘리지 않는다. 기존 층간 벽의 Y 범위는 2.84..3.28이다. 모든 외부 고정창의 sill drip은 중심 sill-0.055, 높이 0.030, 법선 n=-0.110..0.165, 접선 폭 유효 span+0.120이되 입면의 inner wall body 끝(모서리 prism 경계, front·rear x=±5.26, left·right z=±5.76)에서 자른다. 안쪽 끝은 외벽 몸체 실내 면 n=-0.114보다 0.004 안에서 끝나 몸체에 묻히므로 room lining이나 lining 없는 계단 void의 실내 면을 뚫지 않는다. 이전 n=-0.115 끝은 그 면을 0.001 뚫었다(2026-09-24 외피 설계 판정 L2). 위층 창에서는 drip 하단 3.25..상단 3.28을 덮개에서 빼고, 실제 metal band는 Y=2.84..3.25만 차지한다. 창의 물끊기를 panel 속에 중첩시키거나 지우지 않는다. 이는 기존 층간 벽을 덮는 고정 부재이며 새 opening이나 거주 공간이 아니다.

| 전체 입면 | 해당 band의 접선 범위 |
| --- | --- |
| front 계단 | X=-1.24..1.58 |
| front 작업실 위 | X=3.02..5.26 |
| rear 주침실 아래 | X=-2.84..5.26 |
| left 전면 쌍 | Z=-5.44..-2.26 |
| right 후면 쌍 | Z=3.56..5.44 |

각 band는 위층 window의 내부 mullion 중심으로 나누되 band 끝에서 0.08m 미만인 선은 제외한다. 끝의 20mm짜리 가짜 panel을 만들지 않기 위한 결정이다. 양 끝 jamb 중심은 분할선에 다시 넣지 않는다. 아래층과 위층의 기존 mullion이 다르면 floor band에서 각각 끝나며 아래 grid를 맞추려고 상층 room이나 승인된 bay를 바꾸지 않는다. 예를 들어 front의 아래 4.14와 위 4.13 차이는 유지하고 덮개 이음은 위층 4.13에 둔다. 이 값은 캐노피 설계의 opening 기준선과 충돌하지 않는다. panel 수는 이 파생 interval에서 도출하며 손으로 복제하지 않는다.

기존 층간 벽·slab·그 외장 substrate는 유지하고 외측 면에 두께 0.002m의 접힌 금속 cassette를 부착한다. 각 interval 양 끝에서 0.002m, 실제 metal band 위아래에서 0.004m를 물려 panel 외곽을 정한다. panel Y는 2.844..3.246이며 위쪽 0.004m seal이 drip 하단 3.25에 닿는다. front plate는 n=0.138..0.140, 위아래·좌우 return은 n=0.120..0.138로 본체 외장에 닿는다. return 폭은 해당 panel 외곽에서 안쪽 0.002m이며 수직 return이 전체 높이, 수평 return이 그 사이를 맡는다. 인접 cassette 사이 0.004m 이음과 band 양 끝 0.002m 이음은 n=0.120..0.138의 어두운 seal로 닫는다. 구조 slab나 기존 벽을 밀거나 삭제하지 않고 0.020m 돌출 덮개라는 부재 치수로 읽는다. 기존 외장에 coplanar 색 패치를 그리는 방식은 아니다.

panel마다 접선 1/4·3/4, Y=3.06에 고정 clip을 둔다. clip 폭은 min(0.05,panel폭/6), 높이 0.02, 깊이는 n=0.120..0.138이며 벽과 plate 뒷면에 면 접합한다. 매입 고정부는 별도 직경 0.006m shaft로 외벽 몸체 외면 n=0.104보다 0.004 안인 n=0.100부터 0.138까지 표현하고 clip·벽과의 매입 겹침을 기계적 접합 표현으로만 기록한다. 아래 return에는 같은 접선 1/4·3/4 위치에 폭 0.010m, n=0.122..0.137의 아래로 열린 배수 slot을 뚫는다. 각 panel의 내부 물은 하부 slot으로 방출되며 실내나 floor void에 합류하는 관은 없다. 상단 0.004m 틈은 n=0.120..0.140의 seal로 닫고 하단 틈은 n=0.120..0.122에서만 닫아 slot의 출구를 덮지 않는다. seal과 두 side seal이 겹치는 모서리는 side가 전체 높이를 소유하고 horizontal이 그 사이에서 끝낸다. 방수·구조 강도·배수량은 unverified다.

**고정 외부 루버의 창호 접합 설계.** 이 추가 설계는 v-071의 외부 차양 단서와 [프라이버시 상태](../settings/003-spatial-basis.md#privacy-states)가 허용한 외부 차양을 창호의 지지·가림·접근 관계로 구체화한다. 형식과 치수는 레퍼런스에서 읽은 것이 아니라 하부 반투명 띠 앞의 시선을 가리는 이 production의 저작 선택이다. 다섯 레퍼런스의 창에는 이런 외부 루버가 없으며 reference04의 가로 슬랫은 창에 붙은 부재가 아니라 식재대 너머의 독립 정원 펜스다. source는 2026-09-24 6562f9b0에서 이 설계를 먼저 구현했고 설계 판정 결과에 따라 고친다. 각 전체 입면 owner가 창과 그 루버를 함께 소유하며 입면을 별도 작성자나 표면 파일로 분할하지 않는다. 실내 room owner는 이 차양을 중복 생성하지 않는다.

루버는 [프라이버시 상태](../settings/003-spatial-basis.md#privacy-states)가 정한 작업실·침실의 하부 반투명 영역 앞에만 부착한다. 아래 표의 opening은 각각 기존 유효 span·sill·head·우선 bay를 그대로 제공한다. 공용부·계단 창과 욕실에는 이 하부 루버를 추가하지 않는다. 낙수의 접선 범위가 [현관 접근 구역](001-citizen-house.md#site-access)(x=1.30..2.90)과 겹치는 bay에도 루버를 두지 않는다. 현재 입력에서 front-bedroom-glazing의 첫 bay(유효 x=1.80..3.04, 날개 x=1.792..3.028)가 해당하며, 그 bay의 사생활은 하부 반투명 띠와 roller가 맡는다. 창을 옮기거나 받이·배수관을 새로 두지 않는다. 그 bay에만 쓰이는 jamb 쪽 지지대와 arm도 두지 않는다. 후면 주침실 창도 받지 않는다. [roof-face](#roof-face)가 후면 띠로 옮긴 나무의 수관이 외벽 z=6.00에서 0.09m 떨어진 z=6.09부터 창 앞을 차지하여, 가장 동쪽 나무의 잎이 날개 자리(n=0.190..0.285) 자체에, 그 나무를 포함한 동쪽 세 그루의 잎이 0.20m 인출 공간에 들어오기 때문이다. 그 창의 사생활은 하부 반투명 띠와 roller가 맡는다. 루버를 받지 않는 창들의 기존 roller·고정 반투명 층 및 [지붕 캐노피](#roof-face)는 유지한다. 루버를 새 실내 경계나 출입 개구로 해석하지 않으며 방·층·문·계단 연결은 변하지 않는다.

| 전체 입면 owner | 루버를 받는 기존 opening |
| --- | --- |
| front | [front-flex-glazing](#front-flex-glazing), [front-bedroom-glazing](#front-bedroom-glazing) |
| left | [left-flex-glazing](#left-flex-glazing), [left-bedroom-glazing](#left-bedroom-glazing), [left-child-two-glazing](#left-child-two-glazing) |

opening의 sill을 S, 기존 하부 반투명 띠 상단을 F=min(head,S+1.25)로 두고 같은 bay 분할선을 소비한다. 루버의 수직 범위는 그 띠 안에서만 정한다. Y 양 끝 여유 0.04를 제외한 L=F-S-0.08에 대해 k=ceil(L/0.08), p=L/k, j=0..k-1의 날개 안쪽 상면 높이 H(j)=S+0.04+(j+0.5)p다. 이 식은 현재 선택된 창들의 F-S=1.25에 적용하며 새로 추가된 짧은 창을 자동 축약하지 않는다. L<=0 또는 날개·체결구의 간격이 아래 최소값보다 작으면 해당 입력의 설계 재검토가 필요하다. 최대 0.08 pitch는 제작 입력이며 실제 개수와 간격은 컴파일 결과에서 읽는다. 한 날개가 room 우선 분할선·jamb·층선을 가로지르지 않는다.

법선 n은 위 창틀 단면과 같은 C 기준이다. 각 jamb의 부재 중심과 내부 mullion 중심마다 하나의 세로 지지대를 둔다. 지지대의 접선 중심을 m이라 하면 외곽은 접선 m±0.009, n=0.190..0.215, Y=S+0.020..F-0.020이다. 지지대는 이 외곽을 채운 금속 부재로 실현하며 관 내부와 끝 cap을 따로 만들지 않는다. 속이 막힌 부재라 내부에 물이 고이지 않는다. 인접 bay가 공유하는 지지대는 한 번만 생성한다. 이 지지대는 기존 mullion의 0.04 면 폭 안에 투영되고 유리 clear 가운데에 새로운 수직선을 만들지 않는다.

날개는 인접 지지대 안쪽 face 사이에 끝판을 0.003씩 두고 그 사이에서 끝나는 두께 0.006의 판이다. 법선 범위는 n=0.215..0.285이고 상면은 Y=H(j)-0.40(n-0.215), 하면은 상면-0.006이다. 외측으로 0.028m 낮아지는 40% 경사이며 tilt=atan(0.40), 약 21.801°다. 사진에서 얻은 각도가 아니다. 끝판은 날개 양 끝에 접하고 n=0.190..0.285, Y=H(j)-0.036..H(j)+0.002를 차지한다. 끝판과 날개는 서로 관통하지 않고 접선 방향 face에서 만난다. 현재 입력의 날개 수직 투영 높이는 0.034m이며 인접 날개 사이 p-0.034의 틈이 열린다. 끝판 사이에는 p-0.038의 틈이 남는다. 유리 앞에 연속 불투명 판이나 가로선 texture를 두어 이 빈 공간을 대신하지 않는다.

각 끝판은 n=0.202, Y=H(j)-0.017에서 접선 방향 M4 체결구로 세로 지지대의 측면에 고정한다. 체결구는 지름 0.004 몸체와 지름 0.007·높이 0.003 head를 같은 축에서 만든다. head는 끝판의 bay 쪽에 놓이고 몸체는 끝판을 지나 지지대 안 0.008까지 들어간다. 수용 구멍과 나사 받침은 형상으로 뚫거나 만들지 않고, 몸체가 끝판·지지대와 겹치는 구간을 기계적 접합 표현으로만 기록한다. 체결구 이외의 부재 관통 중첩을 지지 방식으로 쓰지 않는다. 공구 접근은 각 head에서 bay 안쪽 접선 방향으로 길이 0.060, 지름 0.006의 축 공간이며 이 공간의 n=0.199..0.205는 날개 안쪽 n=0.215보다 뒤에 있다. 실제 공구 취급 성공이나 체결 강도의 인증은 아니다.

각 세로 지지대를 창틀에 연결하는 고정 arm은 접선 m±0.009, 높이 0.018, n=0.070..0.190이다. 중심 Y는 S+0.04+p-0.017 및 S+0.04+(k-1)p-0.017로 도출하여 각각 첫 두 날개와 마지막 두 날개 사이에 놓는다. arm은 창틀 덮개와 세로 지지대 뒷면에 면 접합한다. 각 arm 중심에는 법선 방향 지름 0.006 몸체를 n=-0.050..0.215, head 지름 0.012·높이 0.006을 n=0.215..0.221로 둔다. 몸체가 덮개·압착판·web·본체·arm·지지대를 지나는 구간은 수용 구멍 없이 기계적 접합 표현으로 겹치고, member 중심선 위라 유리와 가스켓(abs(s)>=0.014)에는 닿지 않는다. 몸체 끝 n=-0.050은 창틀 본체 안에서 끝난다. arm은 두 면 접합과 이 몸체로 고정되며 떠 있는 부재로 두지 않는다. 지지대 앞면에서 외측으로 길이 0.080·지름 0.018의 공구 공간을 예약한다. 인발·풍압·처짐 검토는 unverified다.

날개 상면의 물은 외측 낮은 끝 n=0.285로 흘러 drip-only로 떨어진다. 날개를 뒤쪽 유리나 창틀의 배수구에 연결하지 않는다. 0.006 두께의 외측 끝 아래에서 낙수하므로 뒤쪽으로 돌아가는 수평 받침이나 끝을 막는 상향 턱을 두지 않는다. 위층 창 루버의 외측 낙수선 n=0.285는 아래층 루버 날개·끝판의 외측 끝과 같은 법선 위치다. 아래에 루버가 있는 구간(front-bedroom 둘째·셋째 bay 아래의 front-flex, left-bedroom 아래의 left-flex)에서는 위 낙수가 아래 루버의 그 외측 끝 선을 따라 떨어지고, 아래 루버가 없는 left-child-two 아래에서는 지면으로 바로 떨어진다. 두 선이 같은 법선 위치이므로 물이 아래 날개 끝에 맺혀 다시 떨어지는지 스쳐 지나가는지는 형상으로 정하지 않으며 unverified다. 최종 낙수는 해당 입면 아래 기존 외부 포장·식재 지면으로 이어진다. 낙수의 접선 범위가 현관 문짝·현관 접근 구역과 교차하는 bay는 위 규칙대로 루버에서 빼므로, 남은 날개의 낙수는 그 구역에 떨어지지 않는다. source에서 회피를 위해 창을 이동하지 않는다. 빗물 비산·배수량·수밀 성능은 unverified다.

기존 roller의 실제 n 점유는 box 0.100..0.180, sheet 0.137..0.143, hem 0.131..0.149다. 루버는 하부 띠 안에 있고 box는 head 부근이므로 두 체적을 함께 대조한다. sheet/hem과 가장 가까운 고정 지지대 n=0.190 사이에는 적어도 0.041의 법선 간격이 남는다. arm은 mullion 면 폭 안에 있어 bay clear의 sheet/hem과 접선 방향으로 떨어진다. 낮·사적·야간 상태에서 루버·지지·체결 좌표는 동일하고 기존 roller의 내려온 면적만 부모의 상태 입력을 따른다. 100% roller가 내려와도 날개가 유리나 hem을 관통하지 않아야 한다. 고정 루버의 음영만으로 프라이버시나 일사 차단 성능이 입증됐다고 하지 않는다.

청소와 교체는 외부에서 수행한다. 날개 양 끝의 접선 체결구를 해제한 뒤 끝판을 포함한 한 날개를 외측 +n으로 0.20m 평행 인출한다. 지지대 전체를 먼저 떼거나 이웃 bay를 해체하지 않는다. 처음 0.030m는 접합을 벗기는 구간으로 실제 part의 swept volume을 검사하며 시작 face 접촉과 체적 관통을 구분한다. n 이동량 0.030m 이후에는 실제 bounds의 접선·Y 양 끝에 각각 0.010을 더한 여유도 유지해야 한다. 아직 맞닿아 있는 최초 자세에 그 여유를 적용하여 정상 접합을 충돌로 세지 않는다. 하부 roller를 올려 유리와 지지대 사이를 청소하며 외부 루버를 움직이는 별도 거주 상태는 추가하지 않는다.

유리를 교체할 때는 해당 bay의 모든 날개를 먼저 뺀다. 공유 지지대를 분리하는 경우 그 양쪽 bay의 날개를 먼저 제거한다. 지지대의 앞쪽 체결구 두 곳을 풀고 각 몸체를 +n으로 0.285m 뽑아 창틀과 지지대를 완전히 벗긴 뒤 지지대와 arm을 +n으로 0.20m 인출한다. 긴 고정 몸체의 인출과 짧은 공구 회전 공간을 같은 값으로 취급하지 않는다. 그 뒤 위 단면의 외측 덮개, 압착판·외측 가스켓, 유리 순으로 분리한다. 교체 중 유리 지지와 실제 정비 성공은 unverified다.

고정 부재의 최대 n=0.285는 외벽면 n=0.120에서 0.165m 돌출한 값이다. 좌측 고정 끝 X=5.665는 [캐노피 정비 예약대](#roof-face)의 시작 X=5.80보다 0.135m 안쪽이다. front 끝은 Z=-6.165이며(후면 창에는 루버가 없다) 본채 corner를 넘어 옆 입면까지 감싸지 않는다. 날개와 공구의 임시 인출은 정비 작업일 때만 기존 외부 작업 공간을 사용한다. 상층 접근은 같은 캐노피용 외부 고소작업대의 예약대와 요구 envelope를 소비한다. 장비 형상을 새 source 자산으로 만들거나 현관 접근·조경·지붕 지지 배치를 바꾸지 않는다. 실제 장비 도달·작업 안전은 unverified다.

**검증 주소.** source 구현 뒤 같은 environment에서 네 exposed face의 방향과 profile, 전 window의 유효/structural/유리 seat 범위, frame 네 부재의 단면 깊이와 head·sill 맞댐, gasket 면 접합, reveal 끝, spandrel interval·slot·clip·실제 돌출량을 읽는다. 명시 치수의 tolerance는 1e-7m다. pane가 web을 관통하거나 head가 mullion과 중첩되는지, lining이 유리를 가리는지, 새 부재가 기존 개구·창 차양의 체적을 가리는지도 검사한다. 비교는 기존 pane·room·door 좌표와 승인된 설계값을 함께 사용하며 수동 count를 결과로 쓰지 않는다.

루버는 선택된 모든 opening의 첫·마지막·room 경계 bay, 최하단·최상단 날개에서 실제 k/p·tilt·끝판·공구 축·지지대와 창틀의 체결을 확인한다. 세 privacy 상태의 같은 부재 transform을 대조하고 roller의 실제 bounds와 전수 교차 검사한다. 현재 입력에서 날개 틈 p-0.034>=0.040, 끝판 틈 p-0.038>=0.036, sheet/hem과 지지대의 법선 간격>=0.041, 고정 부재와 좌측 장비 예약대의 간격>=0.135가 기준이다. 인출 swept volume과 기존 window·이웃 루버·corner·현관 접근·정비 예약대도 함께 읽는다. 실패한 입력을 개수 축소·지지대 삭제·roller 숨김으로 통과시키지 않는다. 새 geometry의 생성·충돌·낙수 경로는 아직 unverified다.

GPU 관찰은 네 전체 입면과 모든 corner·opening, 각 room의 기존 threshold·네 corner·중심 네 방향을 유지한다. 추가로 각 window의 head/jamb와 sill/jamb 접합, 각 band 양 끝·이음·하부 slot을 실제 부재 bounds에서 관찰한다. 첫·마지막 bay와 가장 짧은 유리의 접합은 확대해서도 읽는다. 다섯 reference 장면은 같은 FOV50·기본 조명·낮 상태로 기존 source와 대조한다. 정면에서는 일정한 frame 폭과 층간 dark band, 비스듬한 외부와 방 안에서는 덮개·압착판의 깊이와 return을 구분할 수 있어야 한다. 루버가 있는 작업실·침실 창의 외부·실내 관찰에서 고정 날개와 밝은 틈, 그 뒤의 반투명 유리가 분리되어야 하며 사적·야간에는 실제 roller가 그 뒤에서 내려와야 한다. 레퍼런스에는 외부 루버가 없으므로 reference01 대조는 하부 차양을 더해도 창·층·얇은 PV 처마의 기존 비례가 유지되는지만 묻는다. 새 루버의 끝판·arm과 최상·최하 날개도 actual bounds에서 추가 관찰하며 대표 reference로 그 주소들을 대체하지 않는다. 6562f9b0 전의 캡처는 단순 box frame의 비교 기준일 뿐 이 새 단면의 구현 증거가 아니다. 형상 판정 후에도 재료 질감·반사, 전기변색·roller의 광학 표현, 가구·설비·조경은 각 후속 설계 및 관찰 대상으로 남는다.

## 전면 계단실 유리 {#front-stair-glazing}

<!--
@evidence principles/core/common.md#declared-basis 계단실 curtainwall 요구를 stair-opening의 x 범위와 두 층 datum에 연결하고 frame inset·sill/head offset을 채택했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 폭은 stair-hole 양끝과 frame 여유에서 유도한다.
@evidence principles/core/common.md#scope-preservation 두 층 계단 유리와 그 사이 spandrel을 모두 남겨 계단실을 가짜 복층 거실로 바꾸지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 계단 유리를 entry 문이나 flex 창까지 확장하지 않는다.
@evidence principles/core/common.md#substantive-completion host·두 층의 면하는 공간·유효 span 도출과 floor+0.12/ceiling-0.10 및 frame/reveal을 지정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 층별 sill·head와 중간 band가 지정되어 단일 통유리 판으로 끝나지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전면 계단 유리의 개괄 요구에 실제 stair hole 폭을 사용하는 두 개 층별 cut을 부여했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 계단실 커튼월 요구에 hole과 정렬된 상하층 span을 부여한다.
@evidence principles/design/spaces.md#space-topology 하층은 entry, 상층은 계단 구멍에 면한 upper-storey이며 유리가 새로운 통행 connector를 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 두 pane 층이 각 floor에 대응하며 계단 공간 외부 면에 붙는다.
@evidence principles/design/spaces.md#space-boundary-authority x span은 stair-opening에서, plane과 두께는 front-face에서, 높이는 floor datum에서 받아 사본 치수를 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 계단 범위가 원본이고 front-stair profile은 그 끝에서 파생한다.
@evidence principles/design/spaces.md#space-verification-address 두 층 binding·sill/head·frame 깊이 및 계단/공용 privacy 상태를 opening과 내부 시야에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 front-entry frame과 stair jamb의 간섭을 같은 전면에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면 계단 유리·층선 일치·공용 privacy를 hole 범위와 floor band에 대조했다. 층 구멍 확대나 부모 그래프 변경 없이 두 층 cut을 둘 수 있다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 계단 hole과 층선으로 유리 범위를 얻어 부모의 단일 계단을 이동할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 단일 계단실의 curtainwall을 실제 층 높이와 계단 폭에 맞추고 바닥선 band를 지운 연속 유리판을 만들지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 전면 계단실 유리가 두 층을 드러내되 floor band를 남긴다.
@evidence settings/003-spatial-basis.md#privacy-states 계단/공용 유리의 day·private·night 상태와 shade를 이 두 층 opening에 배정하며 상태별 화면 성공은 아직 검증하지 않았다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 낮의 투명·사적 60% shade·야간 전폐를 계단 유리에 적용한다.
-->

host는 [front-face](#front-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 entry와 2층 upper-storey의 계단 개구에 면한다. 유효 유리 span은 [계단 개구](002-spatial-graph.md#stair-opening)의 x 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. sill과 head는 각 층 floor+0.12m에서 ceiling-0.10m까지이며 두 층 사이 spandrel은 [층 datum](002-spatial-graph.md#mass-and-storeys)을 따른다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 계단/공용 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 전면 작업실 유리 {#front-flex-glazing}

<!--
@evidence principles/core/common.md#declared-basis 전면 가변실의 유리를 실제 flex x clear 범위에서 frame 폭만큼 inset한 고정창으로 선택했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb X=3.06..5.22는 flex clear face와 frame 여유를 따른다.
@evidence principles/core/common.md#scope-preservation 작업실 전면의 유리·틀·reveal·privacy shade를 남기고 방 폭을 늘려 reference 비례를 맞추지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 개구를 entry나 외벽 모서리까지 넓히지 않는다.
@evidence principles/core/common.md#substantive-completion front host와 flex room binding, ground sill/head 및 span 산식을 정해 유리 구멍을 실물 창호로 채울 입력을 제공한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 ground sill·head와 반투명 하부를 창 범위 안에 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전면 작업실의 채광·프라이버시를 room 폭에 대응하는 한 고정창과 사적 상태 배정으로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 가변 작업실 채광 요구에 고정 하부 privacy 층을 더한다.
@evidence principles/design/spaces.md#space-topology 창은 flex-workroom과 외부의 경계이며 현관 직결 문을 대신하는 출입이 아니다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 창은 flex 외피이며 common으로 연결되는 통로가 아니다.
@evidence principles/design/spaces.md#space-boundary-authority flex cell이 span의 원본이고 frame interface가 cut 확장량을 소유해 façade가 작업실 크기를 다시 정하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 flex cell이 창 끝의 원본이며 interior lining은 같은 cut을 소비한다.
@evidence principles/design/spaces.md#space-verification-address front opening과 작업실 내부에서 room binding·frame 깊이·ground floor 대응과 사적 상태를 대조한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 frame 포함 structural cut이 실내 lining 안에 드는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면 작업실·사적 유리 조건을 flex cell과 전면 경계에 대조했다. 유리 폭 때문에 부모의 작업실 위치나 현관 연결을 바꾸지 않는다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 flex 전면 cell 안에 창과 privacy를 배정할 수 있어 부모의 작업실 접근을 고칠 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 가변 작업실의 유리가 자기 방 경계와1층 바닥선에 맞으며 별도 유리 체적을 만들지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 전면 작업실은 창을 갖고 하부 시선대의 프라이버시를 유지한다.
@evidence settings/003-spatial-basis.md#privacy-states 작업실의 하부 반투명·상부 밝음 및 private/night shade 상태를 전면 창에 배정하여 채광과 시선 차단을 함께 검사한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 하부 반투명은 유지하고 사적·야간에는 shade를 전폐한다.
-->

host는 [front-face](#front-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [flex-workroom](002-spatial-graph.md#flex-workroom)과 외부 사이의 고정창이다. 유효 유리 span은 방의 x clear 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 전면 상층 침실 유리 {#front-bedroom-glazing}

<!--
@evidence principles/core/common.md#declared-basis 상층 전면 일부 유리를 child1 전면 cell에서 얻고 하층 flex 서측 jamb 중심을 추가 분할선으로 채택한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb X=1.80..5.22와 하층 flex jamb 중심이 분할의 근거다.
@evidence principles/core/common.md#scope-preservation 상층 침실과 계단 사이의 경계를 보존하고 하층 방 폭에 맞추려고 침실 cell을 잘라내지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 child-one 창을 stair void나 service 코어까지 연장하지 않는다.
@evidence principles/core/common.md#substantive-completion 유효 span·upper sill/head·host와 하층 jamb 대응 분할선을 정해 층간 틀 정렬을 구현 입력으로 제공한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 상층 sill·head와 의무 분할선·하부 privacy가 지정됐다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전면 상층 유리 요구에 L자 침실의 전면 본체와 하층 jamb를 동시에 소비하는 bay 구성을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 상층 전면 유리에 하층 jamb를 잇는 추가 분할을 부여한다.
@evidence principles/design/spaces.md#space-topology child-bedroom-1의 전면 cell만 외부에 면하며 L자 연장부나 계단 hole을 같은 창의 room으로 합치지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 전면 child-one cell과 창이 대응하고 floor band가 아래 flex와 나눈다.
@evidence principles/design/spaces.md#space-boundary-authority opening 끝은 child1 cell, 내부 추가 분할은 하층 jamb 중심, 높이는 upper datum에서 각각 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 상층 room 끝과 하층 jamb 중심을 우선하고 나머지 bay만 반복한다.
@evidence principles/design/spaces.md#space-verification-address upper room binding·하층 jamb 연속·frame 깊이와 사적 privacy를 전면 및 침실 안 관찰에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 층을 사이에 둔 jamb 정렬과 cell 밖 유리 돌출을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 일부 전면 유리와 방/층 대응 요구를 child1의 더 넓은 전면 span에 대조했다. 하층 jamb를 추가 분할로 받으면 부모 방 경계를 이동할 필요가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 하층 jamb 기준을 상층 span에 넣을 수 있어 부모 room 경계를 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 2층 전면 일부 curtainwall을 자기 침실 경계 안에 두고 층선과 하층 방의 창틀 대응을 지킨다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 상층 전면 일부를 child-one 창으로 쓰며 하층 bay와 맞춘다.
@evidence settings/003-spatial-basis.md#privacy-states 침실의 사적 유리 상태와 shade를 전면 opening에 적용할 입력으로 받아 외부에서의 수면 프라이버시를 관찰 질문으로 남긴다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 침실 하부는 반투명이고 사적·야간 shade는 전체를 가린다.
-->

host는 [front-face](#front-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [child-bedroom-1](002-spatial-graph.md#child-bedroom-1)의 전면 cell에 붙는 고정창이다. 유효 유리 span은 전면 cell의 x 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡고, 하층 작업실의 서측 jamb 중심선을 추가 module 분할선으로 소비한다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 후면 공용부 유리 {#rear-common-glazing}

<!--
@evidence principles/core/common.md#declared-basis 후면 공용부의 넓은 유리를 common cell의 전체 x clear span에서 도출한 고정창으로 정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb X=-5.22..5.22는 common 외측 clear 범위에서 파생한다.
@evidence principles/core/common.md#scope-preservation 거실·식당·주방에 면한 후면 유리와 창틀을 모두 남기되 그래프에 없는 rear 출입을 추가하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 고정 유리를 새 후면 출입구로 해석하지 않는다.
@evidence principles/core/common.md#substantive-completion rear host·common binding·frame inset·ground sill/head 및 고정창이라는 기능을 지정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 하층 sill·head와 반복 bay 및 shade 상태를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 대부분의 curtainwall 요구를 한 연속 공용 room의 폭과 공용 privacy 상태에 대응시킨다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 후면 대부분 유리 요구를 단일 common span으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 공용부와 정원을 나누는 고정창이며 외부 정원으로의 새 통행 route는 없다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 거실·식당·주방의 한 room 외부 면에 연속 창이 붙는다.
@evidence principles/design/spaces.md#space-boundary-authority common x 범위와 층 datum에서 span·높이를 얻고 rear-face가 plane/normal/thickness를 소유한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 common 양끝이 원본이며 mullion은 남은 폭에서 나눈다.
@evidence principles/design/spaces.md#space-verification-address 후면 전체 opening과 공용부 안에서 floor line·frame 깊이·room binding·공용 상태가 일치하는지 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 긴 span의 모든 bay와 corner return을 개구 관찰에서 확인한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 연속 공용부와 후면 유리 및 고정 연결 그래프를 대조해 고정창으로 배정했다. 정원 출입을 부모에게 새로 요청할 이유는 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 한 common span으로 후면 유리가 가능해 부모 공용부에 칸막이를 추가할 이유가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 후면 공용부의 curtainwall을 실제 방 폭과 바닥선에 맞추며 문을 추가해 그래프를 바꾸지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 후면 common 전체에 유리를 두어 연속 생활 공간을 드러낸다.
@evidence settings/003-spatial-basis.md#privacy-states 공용 유리의 day clear·private shade60%·night shade100%를 후면 큰 창의 상태로 소비하며 광학 성능 인증은 주장하지 않는다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 낮은 투명·shade 상승, 사적은 60%, 야간은 전폐로 구분한다.
-->

host는 [rear-face](#rear-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [common-room](002-spatial-graph.md#common-room)과 정원의 경계다. 이번 공간 그래프에 없는 별도 rear 출입 route는 추가하지 않는 고정창이다. 유효 유리 span은 방 x clear 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 계단/공용 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 후면 주침실 유리 {#rear-bedroom-glazing}

<!--
@evidence principles/core/common.md#declared-basis 후면 주침실 고정창의 폭은 primary clear face에서 받고 upper floor/ceiling offset으로 높이를 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb X=-2.80..5.22는 primary clear cell과 frame 여유를 따른다.
@evidence principles/core/common.md#scope-preservation 주침실의 후면 유리를 남기면서 욕실과의 shared wall을 관통하는 유리판은 만들지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 후면 전체를 침실 창으로 덮어 욕실 개구를 흡수하지 않는다.
@evidence principles/core/common.md#substantive-completion rear host·primary binding·유효 span 산식과 upper sill/head 및 사적 상태를 지정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 상층 sill·head와 하부 반투명 구간을 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 유리 요구를 주침실 경계에서 끝나는 상층 창으로 나눠 위생실과의 방 구획을 외피에 반영한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 후면 침실 채광 요구에 코어 접촉 jamb를 부여한다.
@evidence principles/design/spaces.md#space-topology opening은 primary-bedroom에만 면하고 욕실과 침실을 하나의 room binding으로 합치지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 primary의 후면 외부 면에만 pane이 붙고 bath와 분리된다.
@evidence principles/design/spaces.md#space-boundary-authority primary x 범위가 창 끝의 원본이며 frame/interface와 rear plane을 소비해 별도 후면 폭을 저작하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 bath-primary shared wall이 창 서측 끝의 우선 기준이다.
@evidence principles/design/spaces.md#space-verification-address 욕실 쪽 jamb와 shared wall 끝, upper 층선·frame 깊이 및 침실 privacy를 후면과 방 안에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 욕실과 만나는 jamb 및 floor transom 정렬을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 후면 유리와 코어 프라이버시를 primary/bath 경계에 대조했다. 침실을 넓히거나 욕실 wall을 지우는 부모 수정이 필요하지 않다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 주침실 cell 안에서 privacy 창을 만들 수 있어 부모 코어 경계를 변경하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 주침실 curtainwall 베이가 방·층 경계에서 끝나게 하여 후면의 많은 유리와 실제 사적 구획을 함께 유지한다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 주침실 후면 유리는 bath 경계에서 멈춰 사적 room 구분을 유지한다.
@evidence settings/003-spatial-basis.md#privacy-states 주침실의 day 사적 유리와 private/night 전체 shade 상태를 이 후면 창에 배정한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 침실 하부 privacy를 유지하며 사적·야간 shade는 전체를 덮는다.
-->

host는 [rear-face](#rear-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [primary-bedroom](002-spatial-graph.md#primary-bedroom)의 후면 고정창이다. 유효 유리 span은 방 x clear 범위 양 끝에서 창호 인터페이스의 frame 면 폭만큼 안쪽으로 잡는다. 욕실과의 shared wall을 관통하지 않는다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 후면 욕실 유리 {#rear-bath-glazing}

<!--
@evidence principles/core/common.md#declared-basis 욕실 후면의 x=-4.86..-3.42 span과 upper floor+1.00/ceiling-0.45는 이 창의 저작 선택이다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb X=-4.86..-3.42와 높이 4.20..5.65는 bathroom 내부에서 정한다.
@evidence principles/core/common.md#scope-preservation 욕실 privacy 창을 남기되 frame까지 실제 bath bounds 안에 들어가야 하며 주침실로 span을 늘리지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 작은 privacy 창을 primary의 대면적 유리로 합치지 않는다.
@evidence principles/core/common.md#substantive-completion host·room·유효 폭·높이 offset과 반투명 상태를 정해 후면 코어의 제한된 개구를 확정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 높은 sill·낮춘 head·전체 frost 상태가 정해졌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 불투명 코어의 위생 프라이버시를 높인 sill과 좁은 고정 반투명 창으로 구체화했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 욕실 privacy 요구에 후면의 제한된 높은 opening을 부여한다.
@evidence principles/design/spaces.md#space-topology 후면 house boundary 안의 opening은 upper-bathroom만 향하며 외부 출입을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 후면 욕실 면 안에 놓여 주침실 채광 범위를 침범하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority span 선택은 이 opening이 소유하고 frame 폭과 plane·층 높이는 각 공통 owner를 소비한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 bath cell이 외곽 한계이며 해당 profile이 이 창 clear를 소유한다.
@evidence principles/design/spaces.md#space-verification-address frame의 bath bounds 포함·sill/head·고정 반투명 상태를 후면 창과 욕실 내부 관찰에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 높은 opening의 room 포함과 frost 재료 바인딩을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 욕실의 고정 반투명 조건을 코어 폭과 후면 창 치수에 대조해 부모의 room 경계나 프라이버시 약속 변경이 필요하지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 코어 cell에 높은 privacy 창을 배정할 수 있어 부모 불투명 코어 원칙을 수정하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 욕실은 불투명 코어 안에 남기고 제한된 유리에도 반투명 제어와 실제 방 경계 대응을 둔다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 후면 욕실 창은 높은 sill과 고정 반투명으로 코어 프라이버시를 지킨다.
@evidence settings/003-spatial-basis.md#privacy-states 욕실 유리는 모든 허용 상태에서 반투명을 유지하고 shade 변화가 이를 clear로 바꾸지 않는 입력을 소비한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 세 상태 모두 전체 반투명을 유지해 낮 상태에서도 욕실이 투명해지지 않는다.
-->

host는 [rear-face](#rear-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [upper-bathroom](002-spatial-graph.md#upper-bathroom)의 후면 고정창이다. 유효 유리 span은 x=-4.86..-3.42m다. 이는 이 opening의 저작 선택이며 방 bounds 안에 frame까지 포함되어야 한다. sill과 head는 upper floor+1.00m에서 upper ceiling-0.45m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 욕실 고정 반투명 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 작업실 측면 유리 {#left-flex-glazing}

<!--
@evidence principles/core/common.md#declared-basis 작업실 동측 창은 z=-5.40..-2.30을 저작 span으로 삼고 ground 높이와 left host를 소비한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Z=-5.40..-2.30은 flex 측면 안에서 정한 저작 span이다.
@evidence principles/core/common.md#scope-preservation 전면 창과 직교하는 측면 유리를 남기면서 corner의 불투명 return을 지우거나 틀을 겹치지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 측창을 전면 전체와 합친 wraparound 면으로 확대하지 않는다.
@evidence principles/core/common.md#substantive-completion host·room·z span·ground sill/head와 corner 비연속 조건을 정해 측면 창의 끝을 확정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 하층 높이·corner return·privacy 하부를 함께 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가변실의 유리 요구에 전면과 분리된 측면 opening 및 opaque corner return이라는 실제 접합 결정을 더했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 가변실 채광 요구에 측면의 제한된 긴 span을 추가한다.
@evidence principles/design/spaces.md#space-topology 창은 flex-workroom과 동측 외부 사이의 고정 경계이며 corner를 넘어 다른 face의 opening으로 합쳐지지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 같은 flex room의 두 외부 면이 실체 corner에서 만난다.
@evidence principles/design/spaces.md#space-boundary-authority 이 opening이 z span을 소유하고 host plane·wall 두께·frame·층 높이는 기존 owner에서 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 left-flex profile이 clear를 소유하고 front face와는 return으로 분리된다.
@evidence principles/design/spaces.md#space-verification-address front cut과 side cut 사이 return·중복 frame·room binding과 사적 유리 상태를 내외 관찰에서 대조한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 측창 양끝과 전면 corner 실체가 겹치거나 벌어지는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 작업실 프라이버시와 단순 외피를 전면/측면 창 접합에 대조했다. 코너를 비우거나 room을 확장하는 부모 변경 없이 return을 남길 수 있다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 corner return을 남기고도 flex 측창이 들어가므로 부모 직사각형 외곽을 고칠 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 작업실의 많은 유리를 실물 corner·방 경계 안에 두며 무리한 유리 모서리 구조를 만들지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 작업실 측창은 모서리 실체를 남겨 무리한 유리 코너를 만들지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 전면과 같은 작업실 사적 상태를 측면 창에도 배정하여 어느 한 면으로 프라이버시가 빠지지 않는지 검사한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 하부 반투명에 사적·야간 전폐 shade를 더해 전면과 같은 방 상태를 유지한다.
-->

host는 [left-face](#left-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [flex-workroom](002-spatial-graph.md#flex-workroom)의 동측 고정창이다. 유효 유리 span은 z=-5.40..-2.30m다. 전면 창과는 직교하는 다른 면에 있으며 모서리까지 유리가 이어지는 창은 아니다. 전면 내측선과 이 측면 cut 사이의 불투명 return을 보존하고 프레임을 중복 겹치지 않는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 작은 침실 1 측면 유리 {#left-bedroom-glazing}

<!--
@evidence principles/core/common.md#declared-basis 첫 침실 동측 창의 span과 module은 하층 작업실 측면 창을 소비하고 높이는 upper datum으로 바꾼다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb left-flex와 같은 Z=-5.40..-2.30 범위를 상층 datum에 올린다.
@evidence principles/core/common.md#scope-preservation 상하 jamb 대응과 첫 침실의 독립 범위를 함께 보존하며 L자 연장부까지 창을 임의 확장하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 창을 child-one의 내부 L형 확장부까지 임의로 늘리지 않는다.
@evidence principles/core/common.md#substantive-completion left host·child1 binding·하층 span/module 소비와 upper sill/head를 지정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 상층 sill·head와 하층 공통 반복 기준을 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 침실 유리를 하층 창 분할에 맞춰 올리되 실제 침실 cell에 속하는 별도 opening으로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 침실 측면 채광에 층 사이 jamb 연속성을 더한다.
@evidence principles/design/spaces.md#space-topology child-bedroom-1의 동측 전면부가 면하는 고정창이며 하층 flex와는 층 band로 분리된다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 하층 flex 위의 child-one 외피로 대응하며 floor band로 층을 구분한다.
@evidence principles/design/spaces.md#space-boundary-authority z span·module은 left-flex-glazing을 재사용하고 upper 높이만 datum에서 얻어 독립된 두 번째 bay 원본을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 공통 Z span과 room 끝을 우선하므로 각 층이 독립 간격을 발명하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 상하 jamb 연속·floor band·child1 binding·frame 깊이와 사적 상태를 side 및 방 안에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 상하 동일 jamb와 child-one cell 포함을 측면 관찰에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 방/층 일치와 침실 프라이버시를 하층 창의 span에 대조했다. child1 외주 안에 맞으므로 부모 침실이나 창의 기본 상태를 변경할 이유가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 하층 span이 상층 child-one 안에도 들어가 부모의 침실 배치를 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 상층 창의 bay를 하층과 정렬하면서 실제 층선·침실 경계를 가로지르지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 첫 자녀실 측창을 하층 작업실 bay와 정렬한다.
@evidence settings/003-spatial-basis.md#privacy-states 첫 침실의 사적 상태와 shade는 동측 창에서도 유지되며 전면 상태만 바꿔 전체 방을 보호했다고 판정하지 않는다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 침실 하부 반투명과 사적·야간 전폐를 이 측창에도 적용한다.
-->

host는 [left-face](#left-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [child-bedroom-1](002-spatial-graph.md#child-bedroom-1)의 동측 고정창이다. 유효 유리 span은 [하층 측면 유리](#left-flex-glazing)의 z span과 module 분할을 소비하여 층선 위에서 jamb가 이어지게 한다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 작은 침실 2 측면 창 {#left-child-two-glazing}

<!--
@evidence principles/core/common.md#declared-basis 둘째 침실 동측 창의 z=0.35..1.90과 upper floor+0.70/ceiling-0.30을 저작값으로 채택한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Z=0.35..1.90과 상층 sill+0.70은 child-two cell 안에서 정한다.
@evidence principles/core/common.md#scope-preservation 작은 침실2에도 실제 창과 privacy 제어를 남기며 room 밖으로 frame을 늘려 창을 크게 보이게 하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 앞 자녀실의 긴 창을 복제해 이 방 범위를 벗어나지 않는다.
@evidence principles/core/common.md#substantive-completion left host·child2 binding·span·sill/head와 양끝 frame의 room 포함 조건을 정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 짧은 span·높은 sill·낮춘 head를 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 번째 작은 수면실의 채광을 높인 sill의 제한된 측면 창과 사적 상태로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 작은 침실 채광 요구에 중간 cell용 높은 창을 추가한다.
@evidence principles/design/spaces.md#space-topology opening은 child-bedroom-2만 향하고 첫 침실이나 주침실 외주와 합쳐진 통합창이 아니다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 동측 중간 침실의 외벽에만 pane이 붙는다.
@evidence principles/design/spaces.md#space-boundary-authority z span과 offset은 여기에서 소유하고 actual plane·두께·upper datum·frame은 공통 owner를 소비한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 child-two profile이 높이를 소유하며 left-bedroom 값을 묵시적으로 재사용하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 짧은 room의 양끝 frame 포함·sill/head·room binding과 privacy 상태를 창 및 실내 역방향에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 짧은 opening과 앞뒤 침실 벽 사이의 간격을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 별도 작은 침실과 사적 유리 조건을 room z 범위에 대조했다. 창 때문에 다른 침실 경계를 이동하거나 부모 프로그램을 줄이지 않는다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 중간 cell 안에 채광 창을 둘 수 있어 부모에 다른 facade나 추가 방을 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 작은 침실의 창호도 자기 방 경계·상층 바닥선에 맞추며 고정 공간 그래프를 바꾸지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 두 번째 침실에도 독립 측창을 주되 인접 침실 경계를 넘지 않는다.
@evidence settings/003-spatial-basis.md#privacy-states 둘째 침실의 day 사적 유리와 private/night shade를 이 창에도 배정해 같은 방의 상태 누락을 검사한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 높은 창에도 침실 privacy 상태를 적용해 사적·야간 노출을 남기지 않는다.
-->

host는 [left-face](#left-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [child-bedroom-2](002-spatial-graph.md#child-bedroom-2)의 동측 고정창이다. 유효 유리 span은 z=0.35..1.90m다. 두 끝의 frame은 해당 room 안에 있어야 한다. sill과 head는 upper floor+0.70m에서 upper ceiling-0.30m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 사적 공간 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 공용부 측면 유리 {#right-common-glazing}

<!--
@evidence principles/core/common.md#declared-basis 공용부 서측 후단 창을 z=3.60..5.40으로 선택하고 ground 높이와 right host의 두께를 소비한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Z=3.60..5.40은 common의 후면 측벽 범위에서 정한다.
@evidence principles/core/common.md#scope-preservation 앞쪽 코어는 닫힌 벽으로 남기고 후방 공용부에만 고정창과 실제 frame을 둔다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 측창을 powder·storage 전면까지 연장하지 않는다.
@evidence principles/core/common.md#substantive-completion room·host·z span·ground sill/head를 정해 불투명 서비스 면의 제한된 개구를 지정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 하층 sill·head와 후면 corner 여유를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 우측 코어 외피의 대부분을 닫으면서 후방 공용부에 면하는 채광 창이라는 세부 배정을 추가했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 공용부 채광에 코어 뒤의 제한된 측면 span을 부여한다.
@evidence principles/design/spaces.md#space-topology 창은 common-room 서측 후단과 외부의 경계이고 앞쪽 위생·수납 room을 노출하는 opening이 아니다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 pane은 common room에 붙으며 서비스 공간의 창이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority side 창의 z span은 이 owner가 소유하고 right plane과 ground datum·frame은 정해진 입력에서 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 right-common profile이 clear를 정하고 right face가 동일 cut을 소비한다.
@evidence principles/design/spaces.md#space-verification-address 후단 room binding·코어 전면 폐쇄·frame 깊이·공용 privacy 상태를 side opening과 공용부 안에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 전면 코어 실체와 후단 창 구분을 우측 면 전체에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 우측 opaque core와 공용부의 유리 상태를 후방 z span에 대조했다. 설비 room을 옮기거나 앞쪽 벽을 뚫도록 부모를 바꿀 필요가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 코어 뒤 common 면을 사용할 수 있어 부모의 우측 불투명 프로그램을 고칠 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 코어를 우측 불투명 벽에 유지하고 뒤쪽 공용부 유리만 실제 방·층 경계 안에 둔다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 우측 유리는 공용부 후단에 한정해 전면 설비 코어를 불투명하게 남긴다.
@evidence settings/003-spatial-basis.md#privacy-states 공용부의 허용 유리·shade 상태를 후면 큰 창뿐 아니라 서측 작은 창에도 적용할 입력으로 받는다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 공용부의 낮 투명·사적 60%·야간 전폐 상태를 후면 창과 함께 적용한다.
-->

host는 [right-face](#right-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 1층 [common-room](002-spatial-graph.md#common-room)의 서측 후단 고정창이다. 유효 유리 span은 z=3.60..5.40m다. 서비스 코어의 앞쪽 불투명 벽을 새 opening으로 뚫지 않는다. sill과 head는 ground floor+0.12m에서 ground ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 계단/공용 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 욕실 측면 유리 {#right-bath-glazing}

<!--
@evidence principles/core/common.md#declared-basis 욕실 서측 창의 z span과 module은 하층 공용부 side 창에서 받고 upper datum에서 sill/head를 구한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 하층 right-common과 같은 Z=3.60..5.40을 상층에 적용한다.
@evidence principles/core/common.md#scope-preservation 상하 창틀 정렬과 욕실의 고정 반투명을 함께 남겨 공용 유리와 같은 clear 창으로 만들지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 욕실 측창을 service 전면의 투명 띠로 확대하지 않는다.
@evidence principles/core/common.md#substantive-completion right host·bath binding·하층 span/module과 upper offset 및 욕실 전용 privacy 입력을 지정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 상층 창 높이와 전체 frost 및 하층 bay 대응을 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 코어 욕실의 측면 창에 하층 jamb 정렬을 받되 다른 광학 상태를 갖는 별도 upper opening을 추가한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 욕실 채광에 공용부 위 정렬된 privacy span을 더한다.
@evidence principles/design/spaces.md#space-topology 상층 욕실에 면한 고정창이고 하층 common과는 floor band로 분리되며 두 room을 한 binding으로 묶지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 하층 common과 상층 bath가 같은 외부 span에서 층 band로 분리된다.
@evidence principles/design/spaces.md#space-boundary-authority 하층 창이 z span/module의 원본이며 욕실 창은 upper 높이와 상태만 자기 입력으로 소비한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 공통 Z 범위는 층간 정렬을 맡고 bath profile은 상층 높이를 소유한다.
@evidence principles/design/spaces.md#space-verification-address 상하 jamb·upper floor line·bath binding과 고정 반투명 및 shade를 서측과 욕실 안에서 대조한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 층별 material binding과 상하 jamb 위치를 함께 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 욕실의 프라이버시와 floor/bay 일치를 하층 후단 창 범위에 대조했다. bath cell 안에 맞으므로 코어 위치나 고정 반투명 조건을 부모에서 바꾸지 않는다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 동일 span이 상층 bath에도 들어가 부모 코어 room의 경계를 바꿀 이유가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 코어 욕실의 큰 측면 유리도 방·층에 맞추고 반투명 제어로 주거 프라이버시 질문에 답하게 한다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 상층 우측 bath 창은 반투명으로 코어의 사적 사용을 유지한다.
@evidence settings/003-spatial-basis.md#privacy-states 욕실은 day·private·night 모두 반투명이라는 조건을 하층 공용 창의 다른 상태와 구별하여 적용한다.
@evidenceReview settings/003-spatial-basis.md#privacy-states #a8e7bae 욕실은 낮·사적·야간 모두 반투명으로 남겨 공용부 tint 상태와 구분한다.
-->

host는 [right-face](#right-face)이며 plane·normal·wall thickness는 그 boundary를 소비한다. 2층 [upper-bathroom](002-spatial-graph.md#upper-bathroom)의 서측 후단 고정창이다. 유효 유리 span은 [하층 공용부 측면 유리](#right-common-glazing)의 z span과 module 분할을 소비한다. sill과 head는 upper floor+0.12m에서 upper ceiling-0.10m까지다. 층 높이는 [datum](002-spatial-graph.md#mass-and-storeys)에서 읽는다.

frame 면 폭과 reveal 깊이는 [창호 인터페이스](#glazing-interface)를 소비한다. frame 외곽까지 실제 벽에서 cut하며 유리와 frame은 구멍에 닿는 부재다. 욕실 고정 반투명 유리의 상태와 shade는 [privacy canon](../settings/003-spatial-basis.md#privacy-states)을 소비한다. [전체 관찰](001-citizen-house.md#spatial-observation)의 이 opening 및 해당 방 안 시야에서 room binding·sill/head·frame 깊이·privacy 상태를 검사한다.

## 외부 모서리 접합 {#envelope-corners}

<!--
@evidence principles/core/common.md#declared-basis mass의 내외 corner가 정하는 두께 square를 대각선으로 나누는 miter 접합을 저작 결정으로 채택한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 0.24m 외벽의 내외측 끝에서 corner 사각 범위를 파생한다.
@evidence principles/core/common.md#scope-preservation 네 외부 corner를 실제 volume으로 닫고 window frame을 감추려 corner 두께를 없애지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 실내 shared-wall junction과 외부 corner 책임을 합치지 않는다.
@evidence principles/core/common.md#substantive-completion 삼각 prism의 입면별 귀속·맞댐·rectangular body 범위와 opening의 corner 배제 조건을 정했다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 사각을 두 삼각 기둥으로 나누는 접합과 소유를 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 완결 입면 단독 소유에 직교하는 두 면이 겹침 없이 만나는 대각 접합 방식을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 온전한 입면 소유 규칙에 실제 모서리에서 만나는 절반 실체를 부여한다.
@evidence principles/design/spaces.md#space-topology 두 인접 외벽은 닫힌90° corner에서 만나며 그 부피 안에 출입이나 room 간 통행을 두지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 인접 두 외벽이 만나 외곽을 닫되 room이나 opening을 추가하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 각 corner square는 datum 내외 모서리에서 얻고 각 façade가 자기 삼각 prism만 소유해 중복 solid를 막는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 각 facade가 자기 return 삼각형을 맡아 같은 corner를 두 번 생성하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 네 corner와 실내 역방향에서 틈·volume 겹침·빠진 return을 검사하며 corner에 걸친 cut은 현재 결정의 실패다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 중복·틈과 corner를 관통하는 cut을 상하 모서리 관찰로 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단일 직사각형 외주와 완결 표면 소유를 miter 분할에 대조했다. 인접 면의 주인을 나누거나 코너창을 추가하도록 부모를 수정할 필요가 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 기존 외곽 두께 안에서 모서리를 닫을 수 있어 부모 매스나 room 끝을 수정하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 직사각형 본채의 네 외부 모서리를 닫고 개구를 내부 방 경계 안에 유지한다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 직사각형 외벽 모서리를 실체로 닫고 유리 효과를 위해 빈 코너를 만들지 않는다.
-->

[매스](002-spatial-graph.md#mass-and-storeys)의 네 외측 모서리와 내측 모서리가 외벽 두께의 corner square를 정한다. 각 square는 내측 모서리에서 외측 모서리로 잇는 대각선으로 두 삼각 prism에 나눈다. 앞/뒤 면에 붙은 삼각형은 해당 front/rear owner, 좌/우 면에 붙은 삼각형은 해당 side owner가 같은 전체 높이로 소유한다. 두 body는 대각 면에서 맞닿고 서로 관통하지 않는다.

각 façade의 rectangular wall body는 두 내측 모서리 사이를 차지하고, 양 끝의 이 miter prism이 외측 모서리까지 닫는다. logical face는 외측 전체 span을 유지하고 opening cut은 inner rectangular body 안에 있어야 한다. corner에 걸치는 opening을 허용하려면 이 현재 결정부터 재검토한다. window frame을 숨기기 위해 코너 두께를 없애지 않는다.

이 규칙은 입면의 완결 시각 면을 다른 owner에게 나누지 않으면서 닫힌 90° 접합을 정한다. [관찰](001-citizen-house.md#spatial-observation)은 네 외부 모서리와 실내 역방향에서 틈·중복 volume·빠진 side return을 확인한다.
