# 전면 지붕과 실내 경계

## 박공 삼각 벽과 포치 위의 외벽 {#front-roof-closures}

전면 전체 입면 owner는 `src/spaces/envelope/front.ts`다. [본채 전면](../00-building.md#main-building-extent)의 벽과 [왼쪽 박공](../roof/00-junctions.md#roof-mass-allocation)은 같은 외곽에서 닫힌다. 박공 삼각 벽의 높이는 [F의 아래면](../roof/00-junctions.md#roof-profile-datums)에서 읽고, 나머지 전면은 주/낮은 지붕의 해당 외벽선 아래면까지 이어진다. 정면에 삼각 판을 별도로 겹쳐 박공처럼 보이게 하지 않는다. 정면 벽의 실제 두께는 기존 외벽 예약을 사용한다.

위 입면의 외측 높이와 [벽 두께 전체의 상단](../roof/00-junctions.md#roof-wall-head-junctions)을 구별한다. 박공 교차선과 높은/낮은 지붕 분할을 벽 두께 안에서도 유지하고, [앞 모서리·차고 공유 벽·단차 벽의 단일 몸체](../07-boundary-assembly.md#exterior-boundary-junctions)를 소비한다. 다른 입면의 완결 마감까지 전면 파일에서 복제하지 않는다.

왼쪽은 [거실](../rooms/living.md#living-plan)과 [올리브 침실](../rooms/bedroom-two.md#bedroom-two-plan), 가운데는 [현관문](../rooms/entry.md#entry-plan)과 [계단 창](../02-stair.md#stair-floor-opening), 오른쪽은 [청회색 침실](../rooms/bedroom-three.md#bedroom-three-plan)과 서비스 띠에 각각 바인딩한다. 포치가 거실창과 현관문을 덮는 관계는 [포치 지붕](../porch.md#porch-roof-columns)이 소유한다. 차고 정면 역시 같은 완결 입면 owner가 소비하되 차고문을 본채 방에 바인딩하지 않는다.

아래 [개구부 배치](#front-openings)는 포치 벽 접합 위와 주/낮은 지붕 처마 아래에 남는 외벽을 소비한다. 특히 계단의 작은 창이 박공 골짜기·포치 접합에 잘리거나, 방 없이 입면에만 붙으면 실패다. 검사 주소는 정면 전체와 두 전면 모서리, 각 삼각 벽/처마 아래 단면 및 모든 실제 개구부다. 실제 void·문틀/창틀과 전체 형상·재료·GPU 프레임은 unverified다.

## 거실·침실·계단의 창과 현관문 {#front-openings}

[공통 개구부 인계](../06-openings.md#external-opening-interface)를 적용한다. 본채 전면 벽의 두께 방향은 Z = [-0.25, 0] m다. 아래 창들은 각각 자기 방/계단에 바인딩한다. 거실의 넓은 세 칸 창, 상층의 두 칸 침실 창과 작은 계단 창의 위계를 01에서 채택했으며 치수는 방 폭·지붕·포치 여유에서 선택했다. 파우더룸과 서비스 접근의 전면에는 창을 추가하지 않는다. 입면/방 내부 양쪽의 창 위계·밝기는 실제 프레임에서 unverified다.

## 포치 아래 거실 묶음창 {#living-front-window}

`living-front-window`는 [전면 벽](#front-openings)의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부로 ground-storey의 [living-room](../rooms/living.md#living-plan)에 속한다. [공통 창틀 예약](../06-openings.md#external-opening-interface) 안의 수직 창 세 칸이며 01의 넓은 창 위계를 맡는다. 위 trim은 포치 보 아래와 높이가 가까워 기둥/보/창틀을 함께 검사한다. 같은 void가 거실 안쪽과 일치하는지, 포치 기둥이 묶음창을 가리는지와 실제 깊이/그림자는 unverified다.

## 왼쪽 자녀실의 정면 창 {#bedroom-two-front-window}

`bedroom-two-front-window`는 [전면 벽](#front-openings)의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부로 upper-storey의 [bedroom-two](../rooms/bedroom-two.md#bedroom-two-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)에 따른 수직 창 두 칸이다. 전면 박공 아래, 포치 벽 접합 위의 방 창이며 장식용 가짜 창이 아니다. 창 위/아래 trim과 두 지붕의 단면, 침대/책상에서 창 접근과 실제 프레임은 unverified다.

## 층간 계단실의 작은 창 {#stair-front-window}

`stair-front-window`는 [전면 벽](#front-openings)의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부다. [공통 인계](../06-openings.md#external-opening-interface)에 따른 작은 수직 고정창 한 칸이며 상층 높이지만 ground-storey 소속 [main-stair의 층간 공간](../02-stair.md#stair-floor-opening)에 속한다. 별도 복도/침실에 바인딩하거나 존재하지 않는 2층 바닥을 덧붙이지 않는다. 창 폭/trim과 실제 계단실 경계의 일치, 위 박공 골짜기·아래 포치 접합과의 단면 및 05에서 요구한 밝은 계단참 읽힘은 unverified다.

## 오른쪽 자녀실의 정면 창 {#bedroom-three-front-window}

`bedroom-three-front-window`는 [전면 벽](#front-openings)의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부로 upper-storey의 [bedroom-three](../rooms/bedroom-three.md#bedroom-three-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸이다. 위 trim을 낮은 본채 지붕 아래면보다 아래에 남기고 차고 위 측면 창으로 대신하지 않는다. 침실 안쪽 reveal·낮은 처마/창 단면·01 정면 위계의 실제 프레임은 unverified다.

## 목재 현관문의 외부 충전 {#front-entry-filling}

`front-door`의 void·순폭 목표·경첩/열림은 [현관 owner](../rooms/entry.md#entry-plan) 그대로다. ground-storey의 포치와 현관을 잇는다. [공통 인계](../06-openings.md#external-opening-interface)에 따라 목재 문짝 상부 유리는 문짝 안에서 세 열·두 행으로 반복 분할하고 검은 손잡이는 경첩 반대편에 둔다. 이 유리를 계단 창과 연결하거나 별도 현관 바닥으로 해석하지 않는다.

관찰은 01/04의 현관문과 포치 접속, 문틀 깊이·목재/상부 유리·열린 문짝과 손잡이를 포함한다. 실제 부재/void·문 앞 양방향 통행·01/04 비교는 unverified다.

## 닫힌 차고문과 상부 이동 예약 {#garage-front-opening}

`garage-front-door`는 [차고](../rooms/garage-interior.md#garage-interior-plan)의 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m의 거친 개구부로 택한다. 바닥은 [차고 datum](../01-storeys.md#ground-threshold-datums)이고 최종 유효 폭 목표는 4.80 m, 높이는 2.15 m다. 두 대 폭의 분절 패널문 하나이며 가운데 고정 기둥이나 두 개의 독립 문으로 나누지 않는다. [차도 상면](../site/driveway.md#driveway-plan)은 이 문턱 바닥과 바깥 벽면에서 접하며 실제 void/문틀 뒤의 접합은 unverified다.

닫힌 문은 네 수평 패널로 나누며 높이는 전체 문짝의 유효 높이에서 같은 간격으로 산출한다. 맨 위 패널 안의 채광 유리는 네 열로 반복 배치하고 나머지 패널에는 불투명한 사각 분절을 둔다. 실제 frame·패널 두께·레일·곡선 가이드의 geometry는 후속 부재가 소유한다. 패널 수와 반복을 외벽의 별도 opening 수로 잘못 보고하지 않는다.

문 안쪽 상부의 가이드/열린 패널 예약은 X = [6.00, 11.20], Z = [-3.40, -0.55], Y = [2.15, 2.50] m다. 양쪽 수직 레일은 이 X 범위의 양 끝 0.16 m 띠, Z = [-0.72, -0.55] m에서 차고 바닥부터 상부 예약까지 이어진다. 이 전체 점유를 차고 천장/보/수납과 대조한다. 머드룸 문 앞 바닥까지 상부 문을 밀어 넣지 않는다. 문은 기본 닫힘이며 머드룸을 통해 검사한다. 실제 열린 패널 순높이·곡선 레일의 이동/간섭·빈 차고의 읽힘은 unverified다.
