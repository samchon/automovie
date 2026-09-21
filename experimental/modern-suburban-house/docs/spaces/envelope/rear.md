# 후면 처마와 정원 쪽 외벽

## 두 본채 지붕과 차고 아래의 후면 {#rear-roof-closures}

`src/spaces/envelope/rear.ts`가 본채와 차고의 후면 완결 입면을 소유한다. [본채 후벽](../00-building.md#main-building-extent)은 기존 외벽 두께 안에서 [주/낮은 뒤 지붕 아래면](../roof/00-junctions.md#roof-profile-datums)까지 닫힌다. 두 지붕은 X 분할면에서 높이가 다르므로 후면 벽 상단도 그 단차를 소비한다. 그곳의 +X 방향 단차 벽은 [오른쪽 입면](right.md#right-roof-closures) 소유이고 후면 owner는 같은 모서리에 두 번째 벽을 겹치지 않는다. 전면 교차 박공의 삼각 벽을 후면에 복제하지 않는다.

차고 후벽은 [차고 외곽](../00-building.md#attached-garage-extent)의 같은 평면에서 Gback의 아래면까지 닫는다. 뒤 처마 돌출은 지붕 owner가 소유하며 벽이 그 끝까지 늘어나지 않는다. 본채와 차고의 후벽은 서로 다른 Z에 있으므로 두 뒤 모서리와 그 사이의 노출 본채 측면을 한 평면으로 덮지 않는다. 사이의 측면은 오른쪽 입면 owner와 같은 모서리를 소비한다.

본채 후면의 아래쪽은 [연속 공용부](../rooms/common.md#common-room-plan), 위쪽은 [주침실](../rooms/primary.md#primary-plan)과 [별도 옷방](../rooms/wardrobe.md#primary-wardrobe-plan)에 바인딩한다. 아래 [개구부 배치](#rear-openings)는 공용부에서 정원으로 직접 나가며 차고 뒤를 통과하는 숨은 통로를 만들지 않는다. 검사 주소는 후면 전체, 본채와 차고 각각의 두 뒤 모서리, 양쪽 처마 아래와 본채 단차의 후방 끝이다. 실제 벽/지붕 경계·개구부·대지 연결·프레임은 unverified다.

## 공용부와 주침실의 정원 쪽 개구부 {#rear-openings}

본채 후벽 Z = [-10.70, -10.45] m에 [공통 인계](../06-openings.md#external-opening-interface)를 적용한다. 세 공용 기능은 하나의 kitchen-dining-family 공간 안에 있으며 창마다 별도 방을 만들지 않는다. 정원문 옆 주방 창은 03의 조리대 위 창과 유리문 관계에서 채택했다.

옷방 뒤 벽은 기존 옷걸이/선반을 위해 닫고, 차고 후벽에도 추가 문이나 창을 두지 않는다. 창이 없는 방의 밝기는 후속 조명으로 관찰하며 채광 결과로 추정하지 않는다. 아래 창/정원문의 방 binding과 뒤 처마/각 모서리의 실제 읽힘은 unverified다.

## 주방 조리대 위의 후면 창 {#kitchen-rear-window}

`kitchen-rear-window`는 [후벽](#rear-openings)의 X = [-4.50, -3.30], Y = [1.15, 2.30] m 개구부로 ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 한 칸이다. 아래 상판은 높이 0.91 m 이하로 예약하여 창 아래 trim과 함께 공간을 남긴다. 가구의 상한 예약이며 수도꼭지나 상부장을 창호에 관통시키지 않는다. 조리대/창 단면·정원문과의 관계·03의 부재 읽힘은 unverified다.

## 가족실의 후면 묶음창 {#family-rear-window}

`family-rear-window`는 [후벽](#rear-openings)의 X = [2.75, 4.75], Y = [0.75, 2.30] m 개구부다. ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)에 속하고 [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸을 갖는다. 가족실 좌석과 자기 창이 같은 방 안에 있으며 별도 가족실 벽을 추가하지 않는다. 소파/커튼/창대 앞 접근, 오른쪽 모서리에서 측면 창과의 만남·실제 채광/프레임은 unverified다.

## 주침실의 후면 묶음창 {#primary-rear-window}

`primary-rear-window`는 [후벽](#rear-openings)의 X = [-3.85, -1.45], Y = [3.91, 5.31] m 개구부다. upper-storey의 [primary-bedroom](../rooms/primary.md#primary-plan)에 속하고 [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸을 갖는다. 옷방까지 걸치는 창으로 확장하지 않는다. 뒤 처마 아래 창 단면과 침대 양옆에서 창/서랍장에 닿는 경로, 실제 내외부 프레임은 unverified다.

## 공용부에서 정원으로 나가는 문 {#garden-door}

`garden-door`는 [후벽](#rear-openings)의 X = [-1.20, 1.20], Y = [0, 2.25] m 개구부로 ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)와 외부 대기를 잇는다. [공통 인계](../06-openings.md#external-opening-interface)를 소비하며 바깥쪽 -Z 방향으로 열리는 유리 경첩 문 두 장이다. +X 쪽이 일상 진입의 주 문이고 경첩은 양 끝 문설주, 손잡이는 중앙 만남에 둔다. 주 문만 90° 열었을 때 유효 폭 목표는 0.95 m다. 문 한 장의 실제 회전 반경은 문틀을 제외한 문짝 치수에서 산출한다.

안쪽 대기 X = [-1.50, 1.50], Z = [-10.45, -9.25], 바깥 대기 X = [-1.50, 1.50], Z = [-12.50, -10.70] m는 모두 Y = 0 m의 평탄 바닥으로 예약한다. 바깥 대기는 ground-storey 외부 구역이며 깊이 1.80 m를 택해 문을 당겨 열고 물러서는 공간을 남긴다. 문턱은 양쪽 바닥 위 0.02 m 이내이며 바닥 사이 빈틈을 남기지 않는다.

식탁·의자는 안쪽 대기를 막지 않고, 바깥 대기는 열린 두 문짝과 정원에서 돌아오는 중심 경로를 함께 수용해야 한다. 테라스 전체와 주변 지면에 내려가는 접속은 대지 설계의 미완료다. 바깥 대기 바닥의 예정 owner는 `src/spaces/site.ts`, 문과 후벽은 rear owner다. 실제 양방향 통행·문짝/식탁 충돌·프라이버시·채광·03의 프레임은 unverified다.
