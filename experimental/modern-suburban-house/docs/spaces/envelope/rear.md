# 후면 처마와 정원 쪽 외벽

## 두 본채 지붕과 차고 아래의 후면 {#rear-roof-closures}
<!--
@evidence principles/core/common.md#scope-preservation 본채 후벽의 두 지붕 단차 상단, 차고 후벽, 두 후벽 사이의 노출 측면 배정과 공용부·주침실·옷방 바인딩을 맡는다.
@evidence principles/core/common.md#substantive-completion 본채 후벽을 주/낮은 뒤 지붕 아래면까지, 차고 후벽을 Gback 아래면까지 닫고 X 분할면의 단차 벽은 오른쪽 입면에 맡기는 폐합을 정한다.
@evidence principles/core/common.md#declared-basis 후벽 평면은 main-building-extent와 attached-garage-extent, 아래면은 roof-profile-datums, 몸체 배정은 exterior-boundary-junctions에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주 지붕과 더 낮은 오른쪽 지붕의 높이 차를 후벽 상단의 단차로 바꾸고 교차 박공 삼각 벽을 후면에 복제하지 않는다.
@evidence principles/design/spaces.md#space-topology 본채 후면 아래는 kitchen-dining-family, 위는 primary-bedroom·primary-wardrobe에 속하고 본채와 차고 후벽은 서로 다른 Z의 두 평면이다.
@evidence principles/design/spaces.md#space-boundary-authority +X 단차 벽과 사이의 노출 측면은 오른쪽 입면 owner, 처마 돌출은 지붕 owner가 소유하고 이 H2는 두 번째 벽을 겹치지 않는다.
@evidence principles/design/spaces.md#space-verification-address 후면 전체, 본채와 차고의 두 뒤 모서리, 양쪽 처마 아래, 본채 단차의 후방 끝을 반증 주소로 둔다.
@evidence settings/10-house.md#main-mass 본채 오른쪽 끝의 더 낮은 지붕이 만드는 높이 차를 후벽 상단에서 닫는다.
@evidence settings/10-house.md#garage 차고의 낮은 박공 지붕 아래 후벽을 본채 후벽과 별도 평면으로 닫는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 두 지붕 높이 관계와 garage의 낮은 박공·깊이 6.0–6.6 m를 후면 폐합에 적용했고 두 후벽이 서로 다른 Z에서 닫혀 부모 수정이 없었다.
-->

`src/spaces/envelope/rear.ts`가 본채와 차고의 후면 완결 입면을 소유한다. [본채 후벽](../00-building.md#main-building-extent)은 기존 외벽 두께 안에서 [주/낮은 뒤 지붕 아래면](../roof/00-junctions.md#roof-profile-datums)까지 닫힌다. 두 지붕은 X 분할면에서 높이가 다르므로 후면 벽 상단도 그 단차를 소비한다. 그곳의 +X 방향 단차 벽은 [오른쪽 입면](right.md#right-roof-closures) 소유이고 후면 owner는 같은 모서리에 두 번째 벽을 겹치지 않는다. 전면 교차 박공의 삼각 벽을 후면에 복제하지 않는다.

[후벽 두께 안팎의 상단](../roof/00-junctions.md#roof-wall-head-junctions)은 각 위치의 지붕 아래면에 닿는다. [뒤 모서리와 단차 벽 접합의 몸체 배정](../07-boundary-assembly.md#exterior-boundary-junctions)을 소비하며, right가 소유하는 노출 면과 rear가 받는 공통 몸체를 두 벽으로 중복 생성하지 않는다.

차고 후벽은 [차고 외곽](../00-building.md#attached-garage-extent)의 같은 평면에서 Gback의 아래면까지 닫는다. 뒤 처마 돌출은 지붕 owner가 소유하며 벽이 그 끝까지 늘어나지 않는다. 본채와 차고의 후벽은 서로 다른 Z에 있으므로 두 뒤 모서리와 그 사이의 노출 본채 측면을 한 평면으로 덮지 않는다. 사이의 측면은 오른쪽 입면 owner와 같은 모서리를 소비한다.

본채 후면의 아래쪽은 [연속 공용부](../rooms/common.md#common-room-plan), 위쪽은 [주침실](../rooms/primary.md#primary-plan)과 [별도 옷방](../rooms/wardrobe.md#primary-wardrobe-plan)에 바인딩한다. 아래 [개구부 배치](#rear-openings)는 공용부에서 정원으로 직접 나가며 차고 뒤를 통과하는 숨은 통로를 만들지 않는다. 검사 주소는 후면 전체, 본채와 차고 각각의 두 뒤 모서리, 양쪽 처마 아래와 본채 단차의 후방 끝이다. 실제 벽/지붕 경계·개구부·대지 연결·프레임은 unverified다.

## 공용부와 주침실의 정원 쪽 개구부 {#rear-openings}
<!--
@evidence principles/core/common.md#scope-preservation 본채 후벽의 창·정원문 배치와 옷방·차고 후벽을 닫는 결정, 창 없는 방의 밝기 관찰 경로까지 맡는다.
@evidence principles/core/common.md#substantive-completion 후벽 Z = [-10.70, -10.45] m에 공용부 세 개구부와 주침실 창을 두고 창마다 별도 방을 만들지 않는 배치를 정한다.
@evidence principles/core/common.md#declared-basis 정원문 옆 주방 창은 03의 조리대 위 창과 유리문 관계에서 채택했다고 밝히고 창틀은 공통 인계에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 하나의 공용부 설정을 한 방 안의 주방 창·정원문·가족실 창으로 나누고 옷방 뒤 벽은 옷걸이를 위해 닫는 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 후면 개구부를 kitchen-dining-family와 primary-bedroom에만 바인딩하고 차고 후벽에는 문이나 창을 두지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 후벽 Z = [-10.70, -10.45] m는 본채 외곽의 뒤 바깥 면에서 나온 구간이고 옷방 뒤 벽을 닫는 결과는 primary-wardrobe-plan의 후면 옷걸이/선반 예약을 소비한다.
@evidence principles/design/spaces.md#space-verification-address 창/정원문의 방 binding과 뒤 처마·각 모서리의 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#common-room 주방·식당·가족실을 하나의 연속 공간으로 두어 후면 창마다 칸막이 방을 만들지 않는다.
@evidence settings/20-verification.md#lighting-state 창이 없는 옷방의 밝기를 채광 결과로 추정하지 않고 후속 실내 조명으로 관찰하게 한다.
@evidence obligations/design/spaces.md#space-envelope-interface 후면 입면의 개구부를 공용부 세 기능과 주침실의 실내 배치에 묶고 옷방·차고 쪽을 닫아 안팎이 같은 후벽을 설명하게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 연속 공간·정원 출입 가까운 식탁과 storage의 옷 수납 요구를 후벽에 대조했고 옷방 뒤를 닫아도 설정과 충돌하지 않아 부모 수정이 없었다.
-->

본채 후벽 Z = [-10.70, -10.45] m에 [공통 인계](../06-openings.md#external-opening-interface)를 적용한다. 세 공용 기능은 하나의 kitchen-dining-family 공간 안에 있으며 창마다 별도 방을 만들지 않는다. 정원문 옆 주방 창은 03의 조리대 위 창과 유리문 관계에서 채택했다.

옷방 뒤 벽은 기존 옷걸이/선반을 위해 닫고, 차고 후벽에도 추가 문이나 창을 두지 않는다. 창이 없는 방의 밝기는 후속 조명으로 관찰하며 채광 결과로 추정하지 않는다. 아래 창/정원문의 방 binding과 뒤 처마/각 모서리의 실제 읽힘은 unverified다.

## 주방 조리대 위의 후면 창 {#kitchen-rear-window}
<!--
@evidence principles/core/common.md#scope-preservation 주방 조리대 위 후면 창 하나와 그 아래 상판 높이 상한을 맡는다.
@evidence principles/core/common.md#substantive-completion 후벽의 X = [-4.50, -3.30], Y = [1.15, 2.30] m 개구부와 아래 상판 0.91 m 이하 예약을 정한다.
@evidence principles/core/common.md#declared-basis 창틀은 공통 인계, 상판 높이는 가구 상한의 저작 선택이며 제품 규격이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "창은 외벽과 조리 배치에 종속시키고 싱크를 관통하지 않는다"를 창 하단과 상판 상한의 높이 관계로 만든다.
@evidence principles/design/spaces.md#space-topology 창을 ground-storey kitchen-dining-family 후벽의 주방 구역, 정원문 왼쪽에 속하게 한다.
@evidence principles/design/spaces.md#space-boundary-authority 창 아래 상판 상한은 이 H2가 정하고 주방 L형 수납의 평면은 common-kitchen-wall-reservation이 소비한다.
@evidence principles/design/spaces.md#space-verification-address 조리대/창 단면, 정원문과의 관계, 03의 부재 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#kitchen-equipment 수도꼭지나 상부장을 창호에 관통시키지 않도록 창 하단 Y = 1.15 m와 상판 0.91 m 이하를 분리한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work kitchen-equipment의 창 종속·싱크 비관통과 "두 수도꼭지를 필수 중복 설비로 해석하지 않는다"를 대조했고 싱크를 섬에 두어 창 아래에 수도꼭지가 없어 부모 수정이 없었다.
-->

`kitchen-rear-window`는 [후벽](#rear-openings)의 X = [-4.50, -3.30], Y = [1.15, 2.30] m 개구부로 ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 한 칸이다. 아래 상판은 높이 0.91 m 이하로 예약하여 창 아래 trim과 함께 공간을 남긴다. 가구의 상한 예약이며 수도꼭지나 상부장을 창호에 관통시키지 않는다. 조리대/창 단면·정원문과의 관계·03의 부재 읽힘은 unverified다.

## 가족실의 후면 묶음창 {#family-rear-window}
<!--
@evidence principles/core/common.md#scope-preservation 가족실 좌석을 비추는 후면 묶음창 하나를 맡는다.
@evidence principles/core/common.md#substantive-completion 후벽의 X = [2.75, 4.75], Y = [0.75, 2.30] m 개구부와 수직 창 두 칸을 정한다.
@evidence principles/core/common.md#declared-basis 창틀은 공통 인계, 위치는 가족실 좌석이 우측이라는 설정에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가족실 좌석의 우측 배치를 자기 창이 같은 방 안에 있는 후면 개구부로 만들고 별도 가족실 벽을 두지 않는다.
@evidence principles/design/spaces.md#space-topology 창을 kitchen-dining-family의 후벽 오른쪽에 속하게 한다.
@evidence principles/design/spaces.md#space-boundary-authority 창틀·창대 돌출은 06에서 받고 가족실 좌석 예약은 common-family-reservation이 소비한다.
@evidence principles/design/spaces.md#space-verification-address 소파/커튼/창대 앞 접근, 오른쪽 모서리에서 측면 창과의 만남, 채광을 반증 관찰로 둔다.
@evidence settings/10-house.md#common-room 가족실 좌석을 우측에 둔 공용부의 일부로 이 창을 같은 방에 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 "가족실 좌석은 우측"과 완전 높이 칸막이 금지를 후벽 오른쪽 창에 대조했고 하나의 방 안에서 성립해 부모 수정이 없었다.
-->

`family-rear-window`는 [후벽](#rear-openings)의 X = [2.75, 4.75], Y = [0.75, 2.30] m 개구부다. ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)에 속하고 [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸을 갖는다. 가족실 좌석과 자기 창이 같은 방 안에 있으며 별도 가족실 벽을 추가하지 않는다. 소파/커튼/창대 앞 접근, 오른쪽 모서리에서 측면 창과의 만남·실제 채광/프레임은 unverified다.

## 주침실의 후면 묶음창 {#primary-rear-window}
<!--
@evidence principles/core/common.md#scope-preservation 주침실 후면 묶음창 하나와 옷방으로 확장하지 않는 한계를 맡는다.
@evidence principles/core/common.md#substantive-completion 후벽의 X = [-3.85, -1.45], Y = [3.91, 5.31] m 개구부와 수직 창 두 칸을 정한다.
@evidence principles/core/common.md#declared-basis 창의 소속은 primary-plan의 뒤쪽 본체 후벽, 옷방 쪽을 닫는 결정은 rear-openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주침실 창을 뒤 처마 아래 본체 후벽에 두고 옷방까지 걸치지 않게 폭을 제한하는 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 창을 upper-storey primary-bedroom 후벽에 속하게 하고 같은 후벽의 옷방 구간으로 넘기지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 옷방 X 구간과 뒤 지붕 아래면은 다른 owner에서 소비한다.
@evidence principles/design/spaces.md#space-verification-address 뒤 처마 아래 창 단면, 침대 양옆에서 창/서랍장에 닿는 경로를 반증 관찰로 둔다.
@evidence settings/10-house.md#primary-bedroom 가장 큰 침실의 창과 얇은 커튼을 후면 두 칸 창으로 실현한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work primary-bedroom의 창·커튼 요구와 storage의 옷 수납 요구를 대조했고 창이 옷방 X 구간 전에서 끝나 부모 수정이 없었다.
-->

`primary-rear-window`는 [후벽](#rear-openings)의 X = [-3.85, -1.45], Y = [3.91, 5.31] m 개구부다. upper-storey의 [primary-bedroom](../rooms/primary.md#primary-plan)에 속하고 [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸을 갖는다. 옷방까지 걸치는 창으로 확장하지 않는다. 뒤 처마 아래 창 단면과 침대 양옆에서 창/서랍장에 닿는 경로, 실제 내외부 프레임은 unverified다.

## 공용부에서 정원으로 나가는 문 {#garden-door}
<!--
@evidence principles/core/common.md#scope-preservation 공용부의 정원 출입문 두 장, 안쪽/바깥 대기, 문턱, 식탁·테라스와의 관계, 표면 owner 구분을 맡는다.
@evidence principles/core/common.md#substantive-completion 후벽의 X = [-1.20, 1.20], Y = [0, 2.25] m 개구부에 바깥 -Z로 열리는 유리 경첩 문 두 장, 주 문 유효 폭 0.95 m, 깊이 1.80 m의 바깥 대기를 정한다.
@evidence principles/core/common.md#declared-basis 문짝 회전 반경은 문틀을 뺀 문짝 치수에서 산출하고 바깥 대기 깊이는 문을 당겨 열고 물러서는 저작 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 정원 출입의 설정을 +X 주 문, 양 끝 경첩, 중앙 손잡이, 안쪽 X = [-1.50, 1.50], Z = [-10.45, -9.25]·바깥 Z = [-12.50, -10.70] m 대기로 만든다.
@evidence principles/design/spaces.md#space-topology garden-door가 kitchen-dining-family와 ground-storey 외부 대기를 잇고 테라스가 그 대기를 포함한다.
@evidence principles/design/spaces.md#space-boundary-authority 바깥 대기 바닥은 terrace owner, 문과 후벽은 rear owner로 나누고 문턱은 양쪽 바닥 위 0.02 m 이내로 둔다.
@evidence principles/design/spaces.md#space-verification-address 양방향 통행, 문짝/식탁 충돌, 프라이버시·채광, 03의 프레임을 반증 관찰로 둔다.
@evidence settings/10-house.md#common-room 식탁을 후면 정원 출입 가까이 두는 관계에서 식탁·의자가 안쪽 대기를 막지 않게 한다.
@evidence settings/10-house.md#site-identity 공용부에서 닿는 작은 포장 테라스로 나가는 문과 바깥 대기를 정한다.
@evidence obligations/design/spaces.md#space-access-circulation 공용부와 정원 사이의 표현된 출입구에 안팎 대기와 주 문 유효폭을 배정해 문과 동선 그래프가 일치하게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 "식탁은 후면 정원 출입 가까이"와 site-identity의 "공용부에서 닿는 작은 포장 테라스"를 후벽 개구부에 대조했고 안쪽 대기를 식탁에서 떼고 바깥 대기를 테라스에 포함해 둘 다 성립해 부모 수정이 없었다.
-->

`garden-door`는 [후벽](#rear-openings)의 X = [-1.20, 1.20], Y = [0, 2.25] m 개구부로 ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)와 외부 대기를 잇는다. [공통 인계](../06-openings.md#external-opening-interface)를 소비하며 바깥쪽 -Z 방향으로 열리는 유리 경첩 문 두 장이다. +X 쪽이 일상 진입의 주 문이고 경첩은 양 끝 문설주, 손잡이는 중앙 만남에 둔다. 주 문만 90° 열었을 때 유효 폭 목표는 0.95 m다. 문 한 장의 실제 회전 반경은 문틀을 제외한 문짝 치수에서 산출한다.

안쪽 대기 X = [-1.50, 1.50], Z = [-10.45, -9.25], 바깥 대기 X = [-1.50, 1.50], Z = [-12.50, -10.70] m는 모두 Y = 0 m의 평탄 바닥으로 예약한다. 바깥 대기는 ground-storey 외부 구역이며 깊이 1.80 m를 택해 문을 당겨 열고 물러서는 공간을 남긴다. 문턱은 양쪽 바닥 위 0.02 m 이내이며 바닥 사이 빈틈을 남기지 않는다.

식탁·의자는 안쪽 대기를 막지 않고, 바깥 대기는 열린 두 문짝과 정원에서 돌아오는 중심 경로를 함께 수용해야 한다. [테라스](../site/terrace.md#garden-terrace-plan)는 이 대기를 포함하고 중앙 경로와 외부 단을 정원 쪽으로 연결한다. 바깥 대기 바닥은 완결 테라스 owner인 `src/spaces/site/terrace.ts`, 문과 후벽은 rear owner다. 실제 지표와의 접속은 maps 입력이 없어 미완료다. 실제 양방향 통행·문짝/식탁 충돌·프라이버시·채광·03의 프레임은 unverified다.
