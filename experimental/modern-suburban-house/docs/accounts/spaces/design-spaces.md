# 공간 모집단의 주소와 폐합

## 독립 공간 결정의 주소 {#spatial-addressability}
<!--
@evidence obligations/design/spaces.md#addressable-spatial-decisions 외부 창은 창마다 H2를 가지고, 계단은 예약·connector·구멍·순폭·높이별 경계를, 서비스 통로를 뺀 열네 방은 plan과 사용/경로를, 대지는 포장면마다 H2를 나눈다. 따로 바뀔 수 있는 실내 문과 현관문 개구부는 그 방의 plan H2가, 정원문·차고 전면문은 입면 H2가, 관리문은 관리길 H2가 소유하고 05의 연결 표가 id로 인용하며, 필지·지표·외부 도로는 숨긴 것이 아니라 maps 입력으로 명시했다.
@evidenceReview obligations/design/spaces.md#addressable-spatial-decisions #9c97153 본문 목록의 창마다 H2, 계단 다섯 H2, 서비스 통로를 뺀 열네 방의 plan·사용/경로 분리, 현관문은 entry plan·정원문과 차고 전면문은 입면·관리문은 관리길 H2 소유를 단독 owner 요구에 대조했다.
-->

모든 공간 결정이 따로 인용될 수 있는지를 파일군별로 대조했다. 이 account는 H2 경계의 배분만 답한다.

- 외부 개구부: 입면마다 폐합 H2와 배치 H2를 두고 창과 문마다 별도 H2를 둔다. 예를 들어 [계단 창](../../spaces/envelope/front.md#stair-front-window)은 거실 창이나 침실 창과 따로 바뀔 수 있다.
- 계단: [공간 예약](../../spaces/02-stair.md#stair-reservation), [connector](../../spaces/02-stair.md#stair-connector-handoff), [층판 구멍](../../spaces/02-stair.md#stair-floor-opening), [순폭](../../spaces/02-stair.md#stair-clearance), [높이별 경계](../../spaces/02-stair.md#stair-boundary-heights)가 각각 H2다.
- 방: [서비스 통로](../../spaces/rooms/service.md#service-access-plan)를 뺀 열네 방은 경계와 입구를 정하는 plan H2와 가구·기구 사용 또는 경로 H2를 따로 가지고, 서비스 통로는 경계·입구와 통행을 H2 하나에서 정한다. [공용부](../../spaces/rooms/common.md#common-room-plan)는 주방 벽·섬·식탁·가족실·동선을 다섯 H2로 더 나눈다.
- 실내 문: 문 개구부는 그 방의 입구이므로 방의 plan H2가 좌표·경첩·열림을 소유한다. 외부 문 가운데 현관문은 [현관 plan](../../spaces/rooms/entry.md#entry-plan)이 소유하지만 [정원문](../../spaces/envelope/rear.md#garden-door)·[차고 전면문](../../spaces/envelope/front.md#garage-front-opening)은 입면 H2가, [관리문](../../spaces/site/side-walk.md#side-gate-interface)은 관리길 H2가 소유한다. [연결 표](../../spaces/05-route-network.md#room-route-network)는 그 값을 복사하지 않고 id와 링크로 인용한다.
- 공유 경계: 벽·층판·천장·지상층·지붕 교차는 07–10과 roof/00의 H2가 소유하고 방이나 입면은 링크로 소비한다.
- 대지: 보행길·차도·관리길·테라스·울타리가 파일을 따로 가지며 테라스와 울타리는 다시 세 H2로 나뉜다.

아직 주소가 없는 결정도 있다. 필지 경계, 외부 보도와 도로, 지표, 식재 위치는 [maps 인계](../../spaces/site/00-access.md#map-handoff-inputs)가 받을 입력으로만 적혀 있다. 이것은 다른 owner의 산문에 숨은 결정이 아니라 maps가 disabled라 아직 저작되지 않은 결정이다.

## 기준·외피·동선·검사의 모집단 폐합 {#spatial-population-closure}
<!--
@evidence obligations/design/spaces.md#space-reference-topology 공통 좌표 위의 house-site, 본채와 차고 외곽, 두 storey, 방과 외부 구역을 이름으로 두고 05의 표가 모든 공간을 출발-경계-도착과 storey로 잇는다. 각 방 plan H2가 storey와 인접 방을 적어 표와 방 파일을 교차 대조할 수 있다.
@evidenceReview obligations/design/spaces.md#space-reference-topology #5053f99 공통 좌표 위 `house-site`, 본채·차고 외곽, 두 storey, 방 plan H2, 외부 구역의 이름과 외부 포장부터 상층 옷방까지 출발·경계·도착·storey를 잇는 연결 표를 명명된 좌표·전이 그래프 요구에 대조했다.
@evidence obligations/design/spaces.md#space-envelope-interface 계단 창을 뺀 외부 창·문 H2는 각각 방 하나에, 계단 창은 main-stair의 층간 공간에 바인딩되고 06이 입면 void와 방 reveal의 소유를 나누며, 외벽 두께·안쪽 한계는 00, 층 높이는 01, 모서리 몸체는 외벽 접합이 한 번 정한다. 차고 공유 벽 뒤의 서비스실처럼 창이 없는 구간도 오른쪽 개구부 H2가 명시한다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 창·문 H2의 방 하나 바인딩과 계단 창의 main-stair 바인딩, 06의 void/reveal 분담, 외벽 두께는 00·층 높이는 01·모서리 몸체는 07 단독 소유, 서비스실 구간의 오른쪽 개구부 명시를 외부·내부 정합 요구에 대조했다.
@evidence obligations/design/spaces.md#space-access-circulation 현관·정원문·차고문·관리문의 외부 출입과 방 사이의 모든 실내 문·문 없는 열린 접속이 05의 표에 있고, 주침실을 뺀 열네 방이 사용 조건의 사람·바구니 점유체를 소비하며 머드룸 횡단과 팬트리 사용 통로처럼 기기나 문을 연 작업 상태를 통과 상태와 따로 검사한다.
@evidenceReview obligations/design/spaces.md#space-access-circulation #76c5e04 현관문·정원문·차고문·관리문 네 외부 출입구와 실내 문·열린 접속의 연결 표 수록, 주침실을 뺀 열네 방의 사람·바구니 점유체 소비, 머드룸 횡단·팬트리 사용 통로의 작업 상태 분리 검사를 대조했다.
@evidence obligations/design/spaces.md#space-review-set 04가 compiled topology에서 외부·방별 질문을 파생하고 방과 대지 H2 54개가 각자 자기 확인 항목을 더해 unverified로 남기며, 문 조작·열린 기기와 서랍의 사용 상태·포장과 단의 단면이 그 추가 질문에 들어가고 다섯 참조 비교가 그 위에 더해진다. 관찰 수는 상수로 선언하지 않는다.
@evidenceReview obligations/design/spaces.md#space-review-set #86bcab4 관찰 파생의 compiled topology 질문, 방 38·대지 16의 H2 54개가 더하는 자기 확인 항목, 문 조작·열린 기기와 서랍·포장과 단 단면, 다섯 참조 가산과 관찰 수 비상수를 유한 관찰 선택 요구에 대조했다.
-->

기준과 topology: 모든 공간은 [공통 좌표](../../settings/00-production.md#coordinate-units) 위의 `house-site` 안에 있다. [본채](../../spaces/00-building.md#main-building-extent)와 [차고](../../spaces/00-building.md#attached-garage-extent) 외곽, [두 storey](../../spaces/01-storeys.md#storey-datums), 각 방의 plan H2, 외부 구역을 이름으로 둔다. [연결 표](../../spaces/05-route-network.md#room-route-network)는 외부 포장부터 상층 옷방까지 출발, 경계/개구부 owner, 도착과 storey를 잇는다. 방 plan H2도 자기 storey와 인접 방을 적으므로 표와 방 파일을 서로 대조할 수 있다.

외피와 실내: 전면, 후면, 왼쪽, 오른쪽의 창·문 H2는 각각 방 하나에 바인딩되고, [계단 창](../../spaces/envelope/front.md#stair-front-window)만 방이 아닌 main-stair의 층간 공간에 바인딩된다. [개구부 인계](../../spaces/06-openings.md#external-opening-interface)는 입면이 void 좌표를, 방이 reveal을 소유하도록 나눈다. 외벽 두께와 안쪽 한계는 [외곽](../../spaces/00-building.md#main-building-extent), 층 높이는 [storey](../../spaces/01-storeys.md#storey-datums), 모서리 몸체는 [외벽 접합](../../spaces/07-boundary-assembly.md#exterior-boundary-junctions)이 한 번 정한다. 차고 공유 벽 뒤의 서비스실처럼 창이 없는 구간도 [오른쪽 개구부](../../spaces/envelope/right.md#right-openings)가 명시한다.

출입과 동선: 표현된 외부 출입구는 현관문, 정원문, 차고문, 관리문 넷이다. 방 사이의 실내 문과 문 없는 열린 접속도 모두 연결 표에 있고, 외투장과 린넨장의 문은 방 경로가 아닌 수납 접면으로 따로 둔다. 주침실을 뺀 열네 방은 plan 또는 사용·경로 H2에서 [사용 조건](../../settings/00-production.md#use-profile)의 사람·바구니 점유체를 소비한다. [머드룸 횡단](../../spaces/rooms/laundry.md#laundry-through-route)과 [팬트리 사용 통로](../../spaces/rooms/pantry.md#pantry-use-route)처럼 기기나 문을 연 작업 상태는 통과 상태와 따로 검사한다. 계단은 [단일 connector](../../spaces/02-stair.md#stair-connector-handoff)로 현관과 상층 복도를 잇는다.

검사 집합: [관찰 파생](../../spaces/04-observations.md#spatial-observation-derivation)이 컴파일된 topology에서 외부와 방별 질문을 만든다. 방과 대지 H2 54개(방 38, 대지 16)는 각자 자기 확인 항목을 더해 unverified로 남기고, 방 파일의 문 조작·열린 기기와 서랍의 사용 상태와 대지 파일의 포장·단 단면이 그 추가 질문에 들어가며 [다섯 참조 비교](../../spaces/04-observations.md#reference-spatial-comparisons)가 그 위에 추가된다. 관찰 수는 상수로 선언하지 않는다.

이 폐합은 설계 문서들 사이의 대조다. 실제 storey binding, 개구부 절단, 경로 도달, 관찰 pose는 source와 compiled 산출물이 없어 모두 unverified다.
