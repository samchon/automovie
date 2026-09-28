# 주방 가까운 팬트리

## 뒤쪽 식품 수납실 {#pantry-plan}
<!--
@evidence principles/core/common.md#scope-preservation pantry의 경계, 서비스 쪽 실문과 열림, L형 선반 깊이, 비통과 조건과 식품 운반 경로를 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [3.22, 5.50], Z = [-6.05, -4.70] m, service-pantry-door Z = [-5.75, -4.80] m, 뒤 선반 0.25 m·오른쪽 선반 0.30 m를 정한다.
@evidence principles/core/common.md#declared-basis 뒤 선반을 0.25 m로 얕게 택한 근거를 열린 문/손잡이와 통로를 함께 담기 위한 것으로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "서비스 접근 통로에서 열리는 별도 식품 수납 공간"을 +Z 문설주 경첩·+X 열림의 실문과 앞쪽 벽 선반 배제로 만든다.
@evidence principles/design/spaces.md#space-topology pantry는 서비스 접근 뒤쪽에서 직접 들어가며 다른 실로 통과하는 문이 없고 식품은 서비스 접근을 거쳐 공용부로 간다.
@evidence principles/design/spaces.md#space-boundary-authority 오른쪽 벽은 차고 공유 벽, 뒤쪽은 공용부 경계를 소비하고 두 번째 팬트리 문을 추가하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 선반 끝, 90° 열린 문짝, 문틀을 반영한 진입과 선반 접근, 좁은 실 내부 관찰을 검사 대상으로 둔다.
@evidence settings/10-house.md#pantry 화장실이나 차고로 가기 위해 통과하지 않는 별도 식품 수납 공간으로 만든다.
@evidence settings/10-house.md#service-band 팬트리 내부가 다음 실의 필수 통과 경로가 되지 않게 서비스 통로에서 분기한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work pantry의 "주방 또는 그에 바로 닿는 서비스 접근 통로에서 열리는" 조건과 service-band의 분기를 대조했고 서비스 접근이 공용부로 바로 열려 성립해 부모 수정이 없었다.
-->

`pantry`는 ground-storey, [서비스 접근](service.md#service-access-plan)의 뒤쪽에서 직접 들어가는 방이다. 마감 안쪽 X = [3.22, 5.50], Z = [-6.05, -4.70] m다. 앞쪽은 세탁실 칸막이, 뒤쪽은 [공용부](common.md#common-room-plan) 경계, 오른쪽은 [차고 공유 벽](../00-building.md#attached-garage-extent)이다. [서비스 띠 설정](../../settings/10-house.md#service-band)에 따라 다른 실로 통과하는 문은 없다. 서비스 통로가 바로 공용부로 열리므로 식품을 가져오기 위해 세탁실을 통과하지 않는다.

`service-pantry-door`는 서쪽 칸막이의 Z = [-5.75, -4.80], Y = [0, 2.20] m를 거친 개구부로 삼고 유효 폭 0.85 m 이상을 목표로 한다. +Z 문설주 경첩에서 실내 +X 방향으로 열린다. 선반은 뒤쪽 벽에서 +Z로 깊이 0.25 m, 오른쪽 벽에서 -X로 깊이 0.30 m의 L형 예약 안에 둔다. 뒤 선반을 종전 0.30 m보다 얕게 택한 이유는 아래 [열린 문/손잡이와 통로](#pantry-use-route)를 함께 담기 위해서다. 앞쪽 벽에 또 선반을 두어 방 깊이를 양쪽에서 줄이지 않는다.

`src/spaces/rooms/pantry.ts`가 방을 소유한다. 선반 끝, 90° 열린 문짝, 실제 문틀을 반영한 진입과 선반 접근 및 좁은 실 내부 관찰을 검사한다. 식품을 가져오면 서비스 접근을 통해 [공용부의 주 경로](common.md#common-clear-routes)와 주방으로 가며 뒤 벽에 두 번째 팬트리 문을 추가하지 않는다. 예약 치수는 [식품 수납의 정체성](../../settings/10-house.md#pantry)을 위한 입력이고 실제 수납·기구 점유·회전은 unverified다.

## L형 선반과 식품의 점유 {#pantry-storage-use}
<!--
@evidence principles/core/common.md#scope-preservation L형 선반 면, 다섯 단 높이, 선반 두께, 식품 용기·상자·바구니의 깊이/높이 한계와 비울 바닥을 맡는다.
@evidence principles/core/common.md#substantive-completion 선반 상면을 1층 완성 바닥 위 0.20 m에서 0.40 m 간격으로 다섯 단 산출하고 두께 0.03 m, 뒤 물건 0.20 m·오른쪽 0.25 m·높이 0.30 m 이내를 정한다.
@evidence principles/core/common.md#declared-basis 선반 평면은 pantry-plan에서 받고 식품 수량·원형·배치는 후속 models/instances의 저작으로 남긴다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "선반·식품 용기·작은 상자"를 단별 용도와 L형 코너를 하나의 선반 면으로 만드는 결정으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 선반과 물건을 pantry 안에 두고 별도 수납방이나 바닥 위 가구를 더하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 겹친 코너에 판을 겹치거나 코너 기둥을 두 번 놓지 않고 높이 반복은 규칙에서 산출한다.
@evidence principles/design/spaces.md#space-verification-address 선반을 채운 평면/단면, 위 단의 꺼내기, L형 코너 접근, 방 내부 전체 시점을 검사 주소로 둔다.
@evidence settings/10-house.md#pantry 선반·식품 용기·작은 상자를 두되 선반 모서리가 유효폭을 줄이지 않도록 물건을 선반 평면 안에 물린다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work pantry의 선반·식품 용기·작은 상자와 빈 작업 여유를 다섯 단 L형 선반에 적용했고 물건 깊이 한계로 통로가 유지돼 부모 수정이 없었다.
-->

같은 pantry/ground-storey의 [선반 평면](#pantry-plan)을 소비한다. 뒤쪽 띠와 오른쪽 띠의 겹친 코너는 하나의 L형 선반 면으로 만들며 판을 겹치거나 코너 기둥을 두 번 놓지 않는다. 기둥·브래킷·앞턱은 이 평면 안에 예약하고 통로로 추가 돌출하지 않는다. 별도 수납방이나 바닥 위 가구를 더하지 않는다.

선반 상면 높이는 [1층 완성 바닥](../01-storeys.md#storey-datums) 위 0.20 m에서 0.40 m 간격으로 다섯 단을 산출한다. 선반 두께 예약은 0.03 m이며 상면에서 아래로 둔다. 이는 높이 반복의 설계 입력이고 다섯 개의 수작업 복제 레코드나 현재 compiled 부재 수가 아니다. 지지 부재·반복 판재·마감은 후속 저작에서 이 방의 완결 면 owner가 통합한다.

[팬트리 설정](../../settings/10-house.md#pantry)의 식품은 밀폐 용기·작은 식료품 상자·낮은 바구니로 구분하고 선반 평면 끝에서 0.02 m씩 물린 범위 안에 놓는다. 뒤 선반 물건의 최대 깊이는 0.20 m, 오른쪽은 0.25 m, 각 물건 높이는 해당 선반 위 0.30 m 이내로 예약한다. 아래 단에는 낮은 바구니/용기, 가운데는 자주 꺼내는 식품 상자와 용기, 윗단에는 작은 용기를 둔다. 식품 수량·원형·배치는 후속 models/instances의 저작이며 이 문서에서 보이지 않는 물건이나 전체 재고를 발명하지 않는다.

물건을 바닥이나 문 뒤에 쌓아 통로를 줄이지 않는다. 코너 안쪽에 몸을 넣어야만 꺼낼 수 있는 깊은 물건이나 필수 이동식 발판을 두지 않는다. 물건을 선반 끝까지 꽉 채우는 대신 꺼내는 경로도 아래 [사용 통로](#pantry-use-route)와 대조한다. 실제 원형·손잡이/뚜껑·선반 지지와 물건의 접촉, 위 단의 꺼내기, L형 코너의 접근과 식품 수납실 읽힘은 unverified다. 선반을 채운 평면/단면과 방 내부 전체 시점이 검사 주소다.

## 열린 문에서 선반까지의 사용 통로 {#pantry-use-route}
<!--
@evidence principles/core/common.md#scope-preservation 열린 실문/손잡이 점유, 주 사용 띠, 방향 전환 구역, 두 선반 앞 자세, 문 조작·진입·꺼내기·귀환의 구분을 맡는다.
@evidence principles/core/common.md#substantive-completion 문/손잡이 -Z 점유 0.08 m 이내, 오른쪽 선반 전면에서 -X로 0.50 m에 둔 0.90 m 정방형 회전 구역, 선반 앞 0.15 m·0.20 m 간격을 정한다.
@evidence principles/core/common.md#declared-basis 0.08 m는 저작한 상한이며 제품이나 계측값이 아니고 0.90 m 목표는 use-profile에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "문을 열어도 선반 모서리가 유효폭을 줄이지 않게"를 열린 문과 뒤 선반 전면 사이의 사용 띠와 한 사람 사용 상태로 만든다.
@evidence principles/design/spaces.md#space-topology 물건을 꺼낸 뒤 같은 문→서비스 접근→공용부→주방으로 돌아가는 경로를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 실문 유효폭 목표는 pantry-plan에서 유지하고 부재가 예약을 넘으면 문/선반 owner에서 해결한다.
@evidence principles/design/spaces.md#space-verification-address 열린 실문과 선반 물건의 전체 평면, 문턱·선반 전면·코너 단면, 물건을 들고 지나는 양방향 경로를 추가한다.
@evidence settings/00-production.md#use-profile 사람의 폭·깊이·바구니 폭을 선반에 맞춰 축소하지 않고 문턱 뒤 연속 통로를 0.90 m 목표로 검사한다.
@evidence settings/10-house.md#pantry 문을 연 상태에서도 선반 모서리와 물건이 사용 띠를 좁히지 않게 한다.
@evidence obligations/design/spaces.md#space-access-circulation 서비스 통로에서 팬트리 선반까지의 문 조작·진입·회전·귀환 과제에 사용 띠와 회전 구역을 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work use-profile의 0.75 m 바구니·0.90 m 통로 목표와 pantry의 선반 유효폭 조건을 열린 문 상태에 적용했고 뒤 선반 깊이를 문 돌출 상한까지 고려해 정해 성립해 부모 수정이 없었다.
-->

위 [실문](#pantry-plan)을 90° 열고 pantry 안에서 수납을 사용하는 상태를 예약한다. 열린 문짝과 손잡이의 -Z 방향 점유는 +Z 문설주 평면에서 0.08 m 이내여야 한다. 문틀을 포함한 문턱 유효폭은 기존 실문 목표를 유지한다. 이 돌출량은 저작한 상한이며 실제 손잡이 제품이나 계측값이 아니다. 뒤 선반의 깊이를 정할 때 이 상한까지 뺀 통로를 고려했고, 실제 부재가 예약을 넘으면 사람을 줄이지 않고 문/선반 owner에서 해결한다.

주 사용 띠는 X 방향으로 실 입구에서 오른쪽 선반 전면까지, Z 방향으로 뒤 선반 전면과 위 열린 문/손잡이의 가장 뒤쪽 한계 사이를 잇는다. [팬트리 설정](../../settings/10-house.md#pantry)의 선반 유효폭 조건에 따라 선반 물건·브래킷·걸레받이도 이 띠로 돌출하지 않는다. 문턱을 지난 연속 통로는 [사용 조건](../../settings/00-production.md#use-profile)의 0.90 m 목표에 대해 검사하며 입구의 별도 유효폭 목표와 혼동하지 않는다.

오른쪽 끝의 방향 전환 예약은 오른쪽 선반 전면에서 -X로 0.50 m, 위 사용 띠의 Z 중심에 놓는 0.90 m 정방형이다. 몸과 든 물건이 도는 공간이며 독립 방이나 바닥 판이 아니다. 문을 연 상태에서도 이 구역을 비운다. 오른쪽 선반에서 꺼낼 때는 선반 전면과 몸 앞 사이에 0.15 m를 두고 +X를 향한다. 뒤 선반에서는 전면과 몸 앞 사이 0.20 m를 두고 -Z를 향하며 몸 폭 전체가 양쪽 벽/선반 안으로 들어가지 않는 위치를 쓴다. 사람의 폭·깊이·바구니 포함 폭은 기존 사용 조건을 소비하고 선반에 맞춰 축소하지 않는다.

서비스 통로에서 문을 조작하는 순간, 열린 문을 지나 들어가는 순간, 선반 앞에서 물건을 꺼내고 돌아서는 순간을 구별한다. 이 작은 실은 한 사람이 사용하는 상태로 검사하고 선반을 사용하는 사람 뒤를 다른 사람이 동시에 통과할 수 있다고 주장하지 않는다. 물건을 꺼낸 뒤에는 같은 문 → [서비스 접근](service.md#service-access-plan) → 공용부 → 주방으로 돌아간다. 임시 바구니나 발판을 서비스 통로에 내려놓고 그 점유를 생략하지 않는다.

검사에는 열린 실문/손잡이와 선반 물건의 전체 평면, 문턱·선반 전면·코너·각 높이의 단면, 물건을 들고 양방향으로 지나가는 경로와 실 안쪽 시야를 추가한다. 회전 구역의 치수는 실제 회전 가능성의 증명이 아니며 최종 geometry와 점유체로 확인해야 한다. 실제 문 순폭·회전·물건 꺼내기·접촉/충돌은 unverified다. [전체 관찰](../04-observations.md#spatial-observation-derivation)의 threshold·네 코너·중심 방향은 이 좁은 실에서도 유지한다.
