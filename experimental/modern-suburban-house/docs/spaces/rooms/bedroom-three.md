# 전면 오른쪽 자녀 침실

## 도착면에서 들어오는 청회색 침실 {#bedroom-three-plan}
<!--
@evidence principles/core/common.md#scope-preservation bedroom-three의 비직사각 경계, 린넨 예약의 제외, 도착면 쪽 자기 문, 전면 창, 오른쪽 지붕 조건과 가려진 코너 관찰을 맡는다.
@evidence principles/core/common.md#substantive-completion 여덟 꼭짓점 (-0.50, -0.25)부터 (-0.50, -3.26)까지의 닫힌 평면과 hall-bedroom-three-door Z = [-4.46, -3.51] m, 유효 폭 목표 0.85 m를 정한다.
@evidence principles/core/common.md#declared-basis 뒤쪽 파인 부분은 upper-linen-storage의 벽 포함 예약, 왼쪽/뒤쪽 중앙은 계단실 경계에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "bedroom-two의 좌표 복사로 대신하지 않는다"를 오른쪽 뒤 진입 부분과 린넨으로 파인 자기 윤곽으로 만든다.
@evidence principles/design/spaces.md#space-topology 문을 도착면/침실 경계에 두어 -Z 문설주 경첩·방 안 +X 열림으로 계단 상부참에 회전하지 않게 한다.
@evidence principles/design/spaces.md#space-boundary-authority 잘린 린넨 구역을 방 면적에 다시 넣지 않고 오른쪽 지붕과 차고 접합 조건은 right-roof-closures에서 소비한다.
@evidence principles/design/spaces.md#space-verification-address 비직사각 면적, 창 binding, 문 열림과 진입 회전, 린넨장과 분리된 두 가려진 코너의 추가 관찰을 검사한다.
@evidence settings/10-house.md#bedroom-three 도착면/침실 경계의 hall-bedroom-three-door와 bedroom-three-front-window void를 갖고 침대·책상·옷장을 여덟 꼭짓점의 비직사각 평면에 둔 청회색 침구의 방으로 만든다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-three의 자기 문·창·좌표 복사 금지와 storage의 린넨장을 대조했고 파인 윤곽 안에서도 침실 기능이 성립해 부모 수정이 없었다.
-->

`bedroom-three`는 upper-storey의 전면 오른쪽 방이다. 마감 안쪽 평면은 (X, Z) m로 (-0.50, -0.25), (5.50, -0.25), (5.50, -4.56), (3.22, -4.56), (3.22, -2.51), (1.72, -2.51), (1.72, -3.26), (-0.50, -3.26)를 차례로 잇고 닫는다. 앞/오른쪽은 [본채 외벽](../00-building.md#main-building-extent), 왼쪽/뒤쪽 중앙은 [계단실 경계](../02-stair.md#stair-floor-opening)다. 뒤쪽 파인 부분은 [계단참 가까운 복도 수납](../../settings/10-house.md#storage)인 [복도 린넨장의 벽 포함 예약](upper-hall.md#upper-linen-storage)이고, 오른쪽 뒤의 짧은 부분이 자기 진입 바닥이다. 잘린 린넨 구역을 방 면적에 다시 넣지 않는다.

`hall-bedroom-three-door`는 X = [3.07, 3.22]의 도착면/침실 경계에 Z = [-4.46, -3.51], Y = [3.06, 5.26] m의 거친 개구부를 만든다. 최종 유효 폭 목표는 0.85 m다. -Z 문설주 경첩에서 방 안 +X 방향으로 열고 계단 상부참으로 회전하지 않는다. 이 문 앞의 오른쪽 진입 부분은 수납으로 메우지 않는다.

[청회색 침구의 방](../../settings/10-house.md#bedroom-three)으로 [bedroom-three-front-window](../envelope/front.md#bedroom-three-front-window)의 void, 침대·책상·옷장을 둔다. [오른쪽 지붕과 차고 접합](../envelope/right.md#right-roof-closures)이 정한 외벽 조건을 소비하며 차고 지붕에 걸리는 측면 창을 추가해 채광을 지불하지 않는다. `src/spaces/rooms/bedroom-three.ts`가 소유하며 린넨장과 분리된 두 가려진 코너는 전체 관찰에 추가한다. 비직사각형 면적·창 binding·문 열림과 진입 회전·가구 뒤 시야는 실제 산출물에서 unverified다.

## 청회색 침실의 꺾인 경계 안 배치 {#bedroom-three-furniture-use}
<!--
@evidence principles/core/common.md#scope-preservation 꺾인 경계 안의 침대·협탁·책상·옷장, 의자 사용, 입구에서의 두 동선 띠, 창 접근과 커튼을 배정한다.
@evidence principles/core/common.md#substantive-completion 네 가구의 평면·높이·방향 표와 오른쪽 세로 띠 X = [3.30, 4.20], Z = [-4.30, -1.60] m, 가로 띠 X = [0.90, 4.20], Z = [-2.50, -1.60] m를 정한다.
@evidence principles/core/common.md#declared-basis 높이는 상층 완성 바닥 기준이고 린넨으로 파인 경계는 bedroom-three-plan에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "침구색과 창 주변 가구 배치로 별도 방임이 읽혀야"를 왼쪽 잠자리·전면 중앙 책상·오른쪽 옷장과 오른쪽 세로 띠 앞쪽에서 책상 오른쪽을 돌아 전면 창에 닿는 접근으로 만든다.
@evidence principles/design/spaces.md#space-topology 오른쪽 뒤 입구에서 앞으로 들어온 뒤 각 기능으로 꺾고 침대 발치와 책상 사이 틈을 주 통로로 세지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 가로 띠의 뒤쪽을 린넨 경계 밖에 두고 문짝이 세로 띠에 들어오면 문 부재와 배치를 먼저 고친다.
@evidence principles/design/spaces.md#space-verification-address 문 회전·두 동선 띠·린넨 옆 숨은 코너·창·옷장과 02/05의 작은 침실 읽힘을 검사한다.
@evidence settings/10-house.md#bedroom-three 청회색 침구의 침대·협탁/등·책상/의자·옷 수납을 자기 창과 실제 벽에 맞춰 배치한다.
@evidence settings/00-production.md#use-profile 입구 세로 띠와 가로 띠를 사용체와 실제 미닫이·의자 geometry로 대조할 입력으로 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-three의 가구 목록·별도 방 읽힘과 use-profile을 파인 윤곽에 적용했고 X = [3.30, 4.20] m 세로 띠와 Z = [-2.50, -1.60] m 가로 띠가 성립해 부모 수정이 없었다.
-->

같은 bedroom-three/upper-storey에서 왼쪽 부분에 잠자리, 전면 중앙에 책상, 오른쪽 벽에 옷장을 배치한다. [린넨장으로 파인 경계](#bedroom-three-plan)는 그대로 비워 두고 오른쪽 뒤의 입구에서 앞으로 들어온 뒤 각 기능으로 꺾는다. 아래 world X/Z m는 가구 점유 입력이며 높이는 상층 완성 바닥 기준이다.

| 가구 | 평면 예약 | 높이와 방향 |
| --- | --- | --- |
| 자녀 침대 | X = [-0.25, 0.90], Z = [-3.10, -0.95] | 매트리스 상면 0.55 m, 머리판 0.95 m, 머리는 -Z. |
| 협탁과 등 | X = [1.05, 1.50], Z = [-3.10, -2.65] | 상면 0.50 m, 등 포함 1.05 m. |
| 책상 | X = [1.40, 2.55], Z = -0.85 m부터 방 전면 안쪽 면까지 | 상면 0.75 m, 좌석은 -Z 쪽에서 +Z를 향함. |
| 옷장 | X = 4.90 m부터 방 오른쪽 안쪽 면까지, Z = [-2.80, -1.30] | 높이 2.20 m, -X 쪽 미닫이 문. |

책상 의자의 꺼낸 사용 범위는 X = [1.50, 2.25], Z = [-1.60, -0.85] m다. 옷장 사용은 X = [4.30, 4.90] m, Z는 옷장과 같은 폭이다. 입구에서 X = [3.30, 4.20], Z = [-4.30, -1.60] m의 오른쪽 세로 띠로 들어와, X = [0.90, 4.20], Z = [-2.50, -1.60] m의 가로 띠에서 침대의 중앙 옆면과 책상으로 분기한다. 가로 띠의 뒤쪽은 린넨 경계 밖이어야 하며, 입구 문짝이 90° 열렸을 때 두께/손잡이가 세로 띠에 들어오면 먼저 문 부재와 배치를 고친다. 침대 발치와 책상 사이 틈을 주 통로로 세지 않는다.

전면 창으로는 오른쪽 세로 띠의 앞쪽에서 책상 오른쪽과 옷장 앞 끝을 돌아 접근한다. 창의 커튼 돌출은 안쪽 0.12 m 이내이며 창대와 함께 순폭에 반영한다. [사용체](../../settings/00-production.md#use-profile)와 실제 미닫이/옷·선반·의자 geometry는 후속 구현에서 대조한다. 청회색 침구를 포함한 면 책임은 기존 room owner가 유지한다. 문 회전·두 동선 띠·린넨 옆 숨은 코너·창·옷장과 02/05의 작은 침실 읽힘은 [관찰 owner](../04-observations.md#spatial-observation-derivation)가 전체 질문에 더하며 현재 실제 충돌/순폭/프레임은 unverified다.
