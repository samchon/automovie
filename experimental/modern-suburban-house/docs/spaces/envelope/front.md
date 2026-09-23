# 전면 지붕과 실내 경계

## 박공 삼각 벽과 포치 위의 외벽 {#front-roof-closures}
<!--
@evidence principles/core/common.md#scope-preservation 왼쪽 박공 삼각 벽, 주/낮은 지붕 아래의 나머지 전면 벽, 차고 정면까지 하나의 전면 owner가 닫고 좌·중·우 구간의 방 바인딩을 모두 남긴다.
@evidence principles/core/common.md#substantive-completion 삼각 벽 높이를 F의 아래면에서 읽고 정면에 삼각 판을 겹쳐 박공처럼 보이게 하는 방식을 금지하는 전면 폐합 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 외곽은 main-building-extent, 박공 배정과 F 아래면은 roof-mass-allocation·roof-profile-datums, 벽 두께 상단은 roof-wall-head-junctions에서 받는다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "각 박공은 실제 삼각 벽"이라는 설정을 전면 벽 두께 안의 폐합과 거실·올리브 침실·현관·계단 창·청회색 침실·서비스 띠의 구간 배정으로 바꾼다.
@evidence principles/design/spaces.md#space-topology 전면 벽이 왼쪽 거실/올리브 침실, 가운데 현관문/계단 창, 오른쪽 청회색 침실/서비스 띠를 감싸고 차고 정면은 본채 방에 묶지 않는 포함 관계를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 두께·지붕 아래면·앞 모서리와 단차 벽의 단일 몸체를 모두 원래 owner에서 소비하고 다른 입면의 완결 마감을 전면 파일에서 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 정면 전체·두 전면 모서리·삼각 벽/처마 아래 단면에서 계단의 작은 창이 박공 골짜기나 포치 접합에 잘리는지를 반증 주소로 둔다.
@evidence settings/10-house.md#main-mass 정면 왼쪽의 전방을 향한 큰 박공을 실제 삼각 벽으로 전면 벽 두께 안에서 닫고 판 하나로 대체하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 왼쪽 전방 박공·처마 0.35–0.50 m 범위와 house-scale의 "전면 박공의 얕은 돌출만 허용"을 전면 벽 폐합에 적용했고 삼각 벽을 기존 벽 두께 안에서 닫을 수 있어 부모를 고칠 필요가 없었다.
-->

전면 전체 입면 owner는 `src/spaces/envelope/front.ts`다. [본채 전면](../00-building.md#main-building-extent)의 벽과 [왼쪽 박공](../roof/00-junctions.md#roof-mass-allocation)은 같은 외곽에서 닫힌다. 박공 삼각 벽의 높이는 [F의 아래면](../roof/00-junctions.md#roof-profile-datums)에서 읽고, 나머지 전면은 주/낮은 지붕의 해당 외벽선 아래면까지 이어진다. 정면에 삼각 판을 별도로 겹쳐 박공처럼 보이게 하지 않는다. 정면 벽의 실제 두께는 기존 외벽 예약을 사용한다.

위 입면의 외측 높이와 [벽 두께 전체의 상단](../roof/00-junctions.md#roof-wall-head-junctions)을 구별한다. 박공 교차선과 높은/낮은 지붕 분할을 벽 두께 안에서도 유지하고, [앞 모서리·차고 공유 벽·단차 벽의 단일 몸체](../07-boundary-assembly.md#exterior-boundary-junctions)를 소비한다. 다른 입면의 완결 마감까지 전면 파일에서 복제하지 않는다.

왼쪽은 [거실](../rooms/living.md#living-plan)과 [올리브 침실](../rooms/bedroom-two.md#bedroom-two-plan), 가운데는 [현관문](../rooms/entry.md#entry-plan)과 [계단 창](../02-stair.md#stair-floor-opening), 오른쪽은 [청회색 침실](../rooms/bedroom-three.md#bedroom-three-plan)과 서비스 띠에 각각 바인딩한다. 포치가 거실창과 현관문을 덮는 관계는 [포치 지붕](../porch.md#porch-roof-columns)이 소유한다. 차고 정면 역시 같은 완결 입면 owner가 소비하되 차고문을 본채 방에 바인딩하지 않는다.

아래 [개구부 배치](#front-openings)는 포치 벽 접합 위와 주/낮은 지붕 처마 아래에 남는 외벽을 소비한다. 특히 계단의 작은 창이 박공 골짜기·포치 접합에 잘리거나, 방 없이 입면에만 붙으면 실패다. 검사 주소는 정면 전체와 두 전면 모서리, 각 삼각 벽/처마 아래 단면 및 모든 실제 개구부다. 실제 void·문틀/창틀과 전체 형상·재료·GPU 프레임은 unverified다.

## 거실·침실·계단의 창과 현관문 {#front-openings}
<!--
@evidence principles/core/common.md#scope-preservation 거실의 세 칸 창, 상층 두 침실 창, 작은 계단 창의 위계와 함께 파우더룸·서비스 접근 전면에 창을 두지 않는 결정까지 전면 개구부 전부를 배정한다.
@evidence principles/core/common.md#substantive-completion 전면 벽 두께 방향 Z = [-0.25, 0] m를 모든 전면 개구부의 관통 구간으로 정하고 각 창을 자기 방/계단에 하나씩 바인딩한다.
@evidence principles/core/common.md#declared-basis 창의 위계는 01에서 채택했고 치수는 방 폭·지붕·포치 여유에서 저작 선택했다고 근거를 구별한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation openings 설정의 넓은 묶음창·침실 창들·더 작은 계단 창의 위계를 어느 방의 몇 칸 창인지와 창이 없는 전면 구간으로 확정한다.
@evidence principles/design/spaces.md#space-topology 각 전면 창이 living-room·bedroom-two·main-stair·bedroom-three 중 자기 공간의 외벽에만 속하고 파우더룸과 서비스 접근의 전면은 닫힌 벽으로 남는다.
@evidence principles/design/spaces.md#space-boundary-authority 전면 벽 두께 방향 Z = [-0.25, 0] m는 본채 외곽의 Z = 0 m 바깥 면과 0.25 m 외벽 예약에서 나온 구간으로만 쓰고 창틀 깊이는 06, 각 창 좌표는 하위 창 H2가 소유한다.
@evidence principles/design/spaces.md#space-verification-address 입면과 방 내부 양쪽에서 창 위계와 밝기가 같은 방으로 읽히는지를 실제 프레임의 비교 대상으로 남긴다.
@evidence settings/10-house.md#openings 전면 거실의 넓은 묶음창, 상층 침실 창들, 계단/복도용의 더 작은 창이라는 위계를 전면 벽의 실제 방 바인딩으로 나눈다.
@evidence obligations/design/spaces.md#space-envelope-interface 전면 입면의 개구부 각각을 거실·두 침실·계단실의 실내 경계와 하나씩 묶어 외부 창 위계와 방 배치가 서로 다른 집을 묘사하지 않게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 "창을 배정한 방과 그 창을 품은 외벽이 같아야 한다"와 01의 전면 위계를 전면 방 배치에 대조했고 파우더룸 전면을 창 없이 닫아도 설정 요구와 충돌하지 않았다.
-->

[공통 개구부 인계](../06-openings.md#external-opening-interface)를 적용한다. 본채 전면 벽의 두께 방향은 Z = [-0.25, 0] m다. 아래 창들은 각각 자기 방/계단에 바인딩한다. 거실의 넓은 세 칸 창, 상층의 두 칸 침실 창과 작은 계단 창의 위계를 01에서 채택했으며 치수는 방 폭·지붕·포치 여유에서 선택했다. 파우더룸과 서비스 접근의 전면에는 창을 추가하지 않는다. 입면/방 내부 양쪽의 창 위계·밝기는 실제 프레임에서 unverified다.

## 포치 아래 거실 묶음창 {#living-front-window}
<!--
@evidence principles/core/common.md#scope-preservation 거실 전면 묶음창 하나의 void, 수직 세 칸 분할, 포치 보와의 높이 관계를 모두 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부와 수직 창 세 칸을 확정한다.
@evidence principles/core/common.md#declared-basis 넓은 창 위계는 01에서, 창틀 예약은 공통 인계에서, 좌표는 거실 폭 안의 저작 선택에서 온다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "01의 넓은 전면 창은 이 거실의 외벽에 실제로 속한다"를 living-room 소속의 좌표·칸 수로 만든다.
@evidence principles/design/spaces.md#space-topology 창을 ground-storey의 living-room 전면 외벽에 속하게 하고 포치 지붕 아래에 놓는다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 두께와 창틀 깊이는 front-openings·external-opening-interface에서, 포치 보 높이는 porch owner에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 같은 void가 거실 안쪽과 일치하는지, 포치 기둥이 묶음창을 가리는지를 기둥/보/창틀을 함께 읽는 단면으로 검사한다.
@evidence settings/10-house.md#living 거실 외벽에 실제로 속하는 넓은 전면 창을 이 개구부 하나로 실현한다.
@evidence settings/10-house.md#porch-entry 포치가 왼쪽 거실창을 덮는 관계 때문에 위 trim과 포치 보 높이를 함께 검사 대상으로 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work living의 넓은 전면창 소속과 porch-entry의 거실창·현관문을 함께 덮는 포치, 유효 깊이 1.6–2.0 m를 대조했고 창이 포치 아래 전면 벽에 들어가 부모 수정이 필요 없었다.
-->

`living-front-window`는 [전면 벽](#front-openings)의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부로 ground-storey의 [living-room](../rooms/living.md#living-plan)에 속한다. [공통 창틀 예약](../06-openings.md#external-opening-interface) 안의 수직 창 세 칸이며 01의 넓은 창 위계를 맡는다. 위 trim은 포치 보 아래와 높이가 가까워 기둥/보/창틀을 함께 검사한다. 같은 void가 거실 안쪽과 일치하는지, 포치 기둥이 묶음창을 가리는지와 실제 깊이/그림자는 unverified다.

## 왼쪽 자녀실의 정면 창 {#bedroom-two-front-window}
<!--
@evidence principles/core/common.md#scope-preservation 올리브 침실의 유일한 외벽 창 하나와 그 위아래 trim·지붕 단면 관계를 맡는다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부와 수직 창 두 칸을 정한다.
@evidence principles/core/common.md#declared-basis 창틀은 공통 인계, 위치는 전면 박공 아래·포치 벽 접합 위의 남은 벽이라는 전면 폐합에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation bedroom-two의 "자기 외벽 창"을 전면 박공 아래의 구체 개구부로 정해 굴뚝 쪽 측면 창을 두지 않게 한다.
@evidence principles/design/spaces.md#space-topology 창을 upper-storey bedroom-two의 전면 벽, 전면 박공 아래에 바인딩하고 장식용 가짜 창을 금지한다.
@evidence principles/design/spaces.md#space-boundary-authority 박공 아래면·포치 벽 접합 높이를 다른 owner에서 소비하고 창 좌표만 이 H2가 소유한다.
@evidence principles/design/spaces.md#space-verification-address 창 위/아래 trim과 두 지붕의 단면, 침대/책상에서의 창 접근을 반증 관찰로 둔다.
@evidence settings/10-house.md#bedroom-two 한 자녀의 독립 침실이 갖는 자기 외벽 창을 전면 박공 아래 두 칸 창으로 실현한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-two의 자기 외벽 창과 main-mass의 전면 박공, 2층 순높이 2.50–2.65 m를 창 높이에 적용했고 Y = [3.91, 5.31] m가 두 지붕 사이에 들어가 부모 수정이 없었다.
-->

`bedroom-two-front-window`는 [전면 벽](#front-openings)의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부로 upper-storey의 [bedroom-two](../rooms/bedroom-two.md#bedroom-two-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)에 따른 수직 창 두 칸이다. 전면 박공 아래, 포치 벽 접합 위의 방 창이며 장식용 가짜 창이 아니다. 창 위/아래 trim과 두 지붕의 단면, 침대/책상에서 창 접근과 실제 프레임은 unverified다.

## 층간 계단실의 작은 창 {#stair-front-window}
<!--
@evidence principles/core/common.md#scope-preservation 상층 높이에 있지만 계단실에 속하는 작은 전면 창 하나와 그 소속 공간을 맡는다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부를 작은 수직 고정창 한 칸으로 정한다.
@evidence principles/core/common.md#declared-basis 계단실의 범위는 stair-floor-opening, 창틀은 공통 인계, 창 위계는 openings 설정에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 계단/복도용 더 작은 창을 복도가 아닌 ground-storey 소속 main-stair 층간 공간에 바인딩하는 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 창을 main-stair의 층간 공간에 속하게 하고 별도 복도/침실 바인딩이나 존재하지 않는 2층 바닥의 추가를 금지한다.
@evidence principles/design/spaces.md#space-boundary-authority 계단 구멍과 계단실 경계는 02-stair가 소유하고 이 H2는 창 void만 저작한다.
@evidence principles/design/spaces.md#space-verification-address 창 폭/trim과 계단실 경계의 일치, 위 박공 골짜기와 아래 포치 접합의 단면, 05의 밝은 계단참 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#openings 상층 전면의 침실 창보다 작은 계단용 창으로 위계를 만든다.
@evidence settings/10-house.md#stair 복층 보이드 없이 단일 계단 공간 하나에 창을 두어 계단 창을 실제 계단실에 한정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 작은 계단/복도 창 위계와 stair의 "별도 계단·사다리·복층 보이드는 없다"를 대조했고 창을 계단실에 두어도 두 조건이 함께 성립해 부모 수정이 없었다.
-->

`stair-front-window`는 [전면 벽](#front-openings)의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부다. [공통 인계](../06-openings.md#external-opening-interface)에 따른 작은 수직 고정창 한 칸이며 상층 높이지만 ground-storey 소속 [main-stair의 층간 공간](../02-stair.md#stair-floor-opening)에 속한다. 별도 복도/침실에 바인딩하거나 존재하지 않는 2층 바닥을 덧붙이지 않는다. 창 폭/trim과 실제 계단실 경계의 일치, 위 박공 골짜기·아래 포치 접합과의 단면 및 05에서 요구한 밝은 계단참 읽힘은 unverified다.

## 오른쪽 자녀실의 정면 창 {#bedroom-three-front-window}
<!--
@evidence principles/core/common.md#scope-preservation 청회색 침실의 요구 창 하나와 낮은 본채 지붕 아래 trim 한계를 맡는다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부와 수직 창 두 칸을 정한다.
@evidence principles/core/common.md#declared-basis 창틀은 공통 인계, 위 trim 한계는 낮은 지붕 아래면에서, 좌표는 방 폭 안의 저작 선택에서 온다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation bedroom-three의 자기 외벽 창을 전면에 두고 차고 위 측면 창으로 대신하지 않는 위치 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 창을 upper-storey bedroom-three의 전면 외벽에 바인딩하고 차고 지붕 위 측면 벽으로 옮기지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 낮은 본채 지붕 아래면은 roof owner에서 소비하고 창의 위 trim을 그 아래로 제한하는 결과만 이 H2에 둔다.
@evidence principles/design/spaces.md#space-verification-address 침실 안쪽 reveal, 낮은 처마와 창의 단면, 01 정면 위계를 반증 관찰로 둔다.
@evidence settings/10-house.md#bedroom-three 두 번째 자녀 침실의 자기 외벽 창을 전면 오른쪽 두 칸 창으로 실현한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-three의 자기 외벽 창과 main-mass의 본채 오른쪽 더 낮은 지붕을 대조했고 위 trim을 낮은 지붕 아래면 아래에 둘 수 있어 부모 수정이 없었다.
-->

`bedroom-three-front-window`는 [전면 벽](#front-openings)의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부로 upper-storey의 [bedroom-three](../rooms/bedroom-three.md#bedroom-three-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸이다. 위 trim을 낮은 본채 지붕 아래면보다 아래에 남기고 차고 위 측면 창으로 대신하지 않는다. 침실 안쪽 reveal·낮은 처마/창 단면·01 정면 위계의 실제 프레임은 unverified다.

## 목재 현관문의 외부 충전 {#front-entry-filling}
<!--
@evidence principles/core/common.md#scope-preservation 현관문의 외부 충전인 문짝·상부 유리 분할·손잡이 위치와 01/04의 관찰 질문을 함께 맡는다.
@evidence principles/core/common.md#substantive-completion 목재 문짝 상부 유리를 문짝 안에서 세 열·두 행으로 반복 분할하고 검은 손잡이를 경첩 반대편에 두는 구성을 정한다.
@evidence principles/core/common.md#declared-basis front-door의 void·순폭 목표·경첩/열림은 entry-plan에서 그대로 받고 유리 분할만 이 H2의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 설정의 "목재문·유리 상부·어두운 손잡이"를 반복 분할 규칙과 손잡이 측으로 구체화한다.
@evidence principles/design/spaces.md#space-topology front-door가 ground-storey 포치와 front-entry를 잇는 연결임을 유지하고 상부 유리를 계단 창이나 별도 현관 바닥과 연결하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 문 void 좌표를 다시 적지 않고 entry owner로 링크한다.
@evidence principles/design/spaces.md#space-verification-address 01/04의 현관문과 포치 접속, 문틀 깊이·목재/상부 유리·열린 문짝과 손잡이, 문 앞 양방향 통행을 반증 관찰로 둔다.
@evidence settings/10-house.md#porch-entry 현관의 목재문·유리 상부·어두운 손잡이를 문짝 안의 분할과 손잡이 배치로 구현할 입력으로 만든다.
@evidence settings/10-house.md#openings 문짝·경첩측·손잡이가 구별되도록 손잡이를 경첩 반대편에 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work porch-entry의 문 구성과 openings의 "문짝·경첩측·손잡이·문틀·문턱이 구별된다"를 entry-plan의 문 void에 적용했고 문짝 분할로 모두 충족돼 부모 수정이 없었다.
-->

`front-door`의 void·순폭 목표·경첩/열림은 [현관 owner](../rooms/entry.md#entry-plan) 그대로다. ground-storey의 포치와 현관을 잇는다. [공통 인계](../06-openings.md#external-opening-interface)에 따라 목재 문짝 상부 유리는 문짝 안에서 세 열·두 행으로 반복 분할하고 검은 손잡이는 경첩 반대편에 둔다. 이 유리를 계단 창과 연결하거나 별도 현관 바닥으로 해석하지 않는다.

관찰은 01/04의 현관문과 포치 접속, 문틀 깊이·목재/상부 유리·열린 문짝과 손잡이를 포함한다. 실제 부재/void·문 앞 양방향 통행·01/04 비교는 unverified다.

## 닫힌 차고문과 상부 이동 예약 {#garage-front-opening}
<!--
@evidence principles/core/common.md#scope-preservation 차고의 닫힌 분절 패널문, 패널/채광 반복, 안쪽 상부 가이드와 수직 레일 예약, 차도 접합을 모두 맡는다.
@evidence principles/core/common.md#substantive-completion 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m 개구부, 유효 폭 목표 4.80 m, 네 수평 패널과 맨 위 네 열 유리를 정한다.
@evidence principles/core/common.md#declared-basis 바닥은 ground-threshold-datums의 차고 datum, 차도 상면은 driveway owner에서 받고 패널 높이는 문짝 유효 높이의 균등 분할로 산출한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 대용 폭의 분절 패널문 하나와 상부 채광 유리를 가운데 기둥 없는 단일 개구부, 패널 수, 레일 점유 X = [6.00, 11.20], Z = [-3.40, -0.55], Y = [2.15, 2.50] m로 바꾼다.
@evidence principles/design/spaces.md#space-topology garage-front-door를 garage 전면 벽에 두고 차도와 문턱 바닥에서 접하게 하며 기본 닫힘에서 내부 관찰은 머드룸을 통하게 한다.
@evidence principles/design/spaces.md#space-boundary-authority 차고 바닥 datum과 차도 상면은 원래 owner에서 소비하고 패널 수와 반복을 외벽의 별도 opening 수로 세지 않는다.
@evidence principles/design/spaces.md#space-verification-address 열린 패널 순높이, 곡선 레일의 이동/간섭, 상부 예약과 천장/보/수납의 대조, 빈 차고의 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#garage 두 대용 폭 분절 패널문 하나·상부 채광 유리·문 레일/상부 구조와 닫힌 기준 상태를 개구부와 이동 예약으로 만든다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 외곽 폭 5.8–6.4 m 범위, 문 하나·상부 유리·레일, "문을 임시 제거한 외부 view로 완성을 주장하지 않는다"를 X = [6.10, 11.10] m 개구부와 레일 예약에 적용했고 모두 함께 성립해 부모 수정이 없었다.
-->

`garage-front-door`는 [차고](../rooms/garage-interior.md#garage-interior-plan)의 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m의 거친 개구부로 택한다. 바닥은 [차고 datum](../01-storeys.md#ground-threshold-datums)이고 최종 유효 폭 목표는 4.80 m, 높이는 2.15 m다. 두 대 폭의 분절 패널문 하나이며 가운데 고정 기둥이나 두 개의 독립 문으로 나누지 않는다. [차도 상면](../site/driveway.md#driveway-plan)은 이 문턱 바닥과 바깥 벽면에서 접하며 실제 void/문틀 뒤의 접합은 unverified다.

닫힌 문은 네 수평 패널로 나누며 높이는 전체 문짝의 유효 높이에서 같은 간격으로 산출한다. 맨 위 패널 안의 채광 유리는 네 열로 반복 배치하고 나머지 패널에는 불투명한 사각 분절을 둔다. 실제 frame·패널 두께·레일·곡선 가이드의 geometry는 후속 부재가 소유한다. 패널 수와 반복을 외벽의 별도 opening 수로 잘못 보고하지 않는다.

문 안쪽 상부의 가이드/열린 패널 예약은 X = [6.00, 11.20], Z = [-3.40, -0.55], Y = [2.15, 2.50] m다. 양쪽 수직 레일은 이 X 범위의 양 끝 0.16 m 띠, Z = [-0.72, -0.55] m에서 차고 바닥부터 상부 예약까지 이어진다. 이 전체 점유를 차고 천장/보/수납과 대조한다. 머드룸 문 앞 바닥까지 상부 문을 밀어 넣지 않는다. 문은 기본 닫힘이며 머드룸을 통해 검사한다. 실제 열린 패널 순높이·곡선 레일의 이동/간섭·빈 차고의 읽힘은 unverified다.
