# 뒤쪽 왼편 주침실

## 복도와 옷방에 직접 닿는 주침실 {#primary-plan}
<!--
@evidence principles/core/common.md#scope-preservation primary-bedroom의 뒤쪽 본체와 왼쪽 부분, 복도 문, 옷방 문의 소비, 두 창과 가구 사용 배정, 비통과 조건을 맡는다.
@evidence principles/core/common.md#substantive-completion 뒤쪽 본체 X = [-5.50, 0.75]·Z = [-10.45, -6.06] m와 왼쪽 부분 X = [-5.50, -3.35]·Z = [-6.06, -4.71] m, hall-primary-door X = [-2.70, -1.70] m와 유효 폭 목표 0.90 m를 정한다.
@evidence principles/core/common.md#declared-basis 외벽은 main-building-extent, 두 창은 입면 owner, 옷방 문은 wardrobe owner에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "상층의 가장 큰 침실로 복도에서 직접 들어간다"를 두 직사각형 합집합과 -X 문설주 경첩·실내 -Z 열림으로 만든다.
@evidence principles/design/spaces.md#space-topology 앞쪽 왼편 자녀 침실, 앞쪽 오른편 복도, 오른쪽 샤워 욕실/옷방과 인접하고 어느 욕실로 가는 길도 이 방을 거치지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 옷방 문은 wardrobe owner의 별도 개구부, 두 창은 rear·left 입면 owner의 void로 소비하고 이 H2는 hall-primary-door만 소유한다.
@evidence principles/design/spaces.md#space-verification-address 왼쪽 부분까지 방 바닥이 이어지는지와 모든 내부 코너, 면적 비교·문/창 binding·옷방 접근을 검사한다.
@evidence settings/10-house.md#primary-bedroom 가장 큰 침실을 복도에서 직접 들어가게 하고 욕실을 통과하거나 방을 통과해 공용 욕실에 가는 길을 만들지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work primary-bedroom의 직접 출입·비통과·별도 옷 수납 조건을 대조했고 복도에서 여는 hall-primary-door, 별도 개구부인 옷방 문, 두 직사각형을 합친 upper-storey의 가장 큰 침실로 성립해 부모 수정이 없었다.
-->

`primary-bedroom`은 upper-storey의 가장 큰 침실이다. 마감 안쪽은 X = [-5.50, 0.75]·Z = [-10.45, -6.06] m의 뒤쪽 본체와 X = [-5.50, -3.35]·Z = [-6.06, -4.71] m의 왼쪽 부분을 합친다. 앞쪽 왼편은 자녀 침실, 앞쪽 오른편은 [복도](upper-hall.md#upper-hall-plan), 오른쪽은 샤워 욕실/옷방, 뒤·왼쪽은 [본채 외벽](../00-building.md#main-building-extent)이다. 작은 자녀실보다 넓은 잠자리 주변과 옷 수납을 확보하되 상층 욕실의 필수 통과실이 되지 않는다.

`hall-primary-door`는 Z = [-6.06, -5.91]의 복도/침실 벽에 X = [-2.70, -1.70], Y = [3.06, 5.26] m의 거친 개구부를 만든다. 목표 유효 폭은 0.90 m다. -X 문설주 경첩에서 실내 -Z 방향으로 연다. [옷방 문](wardrobe.md#primary-wardrobe-plan)은 별도 개구부로 소비한다. 복도에서 어느 욕실로 갈 때도 이 두 문을 거치지 않는다.

[성인 둘의 침실](../../settings/10-house.md#primary-bedroom)로 [primary-rear-window](../envelope/rear.md#primary-rear-window)와 [primary-left-window](../envelope/left.md#primary-left-window)의 void를 소비하고 [침대·양쪽 협탁·서랍장 사용](#primary-furniture-use)을 배정한다. `src/spaces/rooms/primary.ts`가 소유하며 왼쪽 부분까지 방 바닥이 이어지는지와 모든 내부 코너를 검사한다. 실제 면적 비교·문/창 binding·침대 양옆 여유·옷방 접근과 시야는 unverified다.

## 두 사람의 잠자리와 옷방 접근 {#primary-furniture-use}
<!--
@evidence principles/core/common.md#scope-preservation 성인 둘의 침대, 양쪽 협탁과 등, 낮은 서랍장, 발치 띠, 옷방 접근, 두 창의 커튼을 배정한다.
@evidence principles/core/common.md#substantive-completion 침대 X = [-1.50, 0.65], Z = [-8.65, -7.05] m와 머리 +X, 두 협탁, 서랍장, 발치 띠 X = [-2.50, -1.50] m를 정한다.
@evidence principles/core/common.md#declared-basis 침대 머리를 창 없는 욕실 공유 벽 쪽에 둔 근거를 두 외벽 창과 옷방 문을 가리지 않기 위한 선택으로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "큰 방이라는 차이는 침대만 키우는 대신 양옆과 발치의 사용 여유 및 수납"을 발치 띠에서 양옆과 옷방으로 분기하는 배치로 만든다.
@evidence principles/design/spaces.md#space-topology 모든 가구와 사용을 primary-bedroom 안에 두고 넓은 왼쪽 부분을 통과실이나 두 번째 침실로 나누지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 옷방 문의 경첩·-X 열림과 문 안쪽 돌아설 공간은 wardrobe owner에서 받고, 주침실 쪽 문짝 회전 상한과 그 앞 대기 X = [-0.55, 0.75]·Z = [-10.20, -9.20] m는 이 H2가 주침실 바닥에 비워 두며 창대/손잡이는 06에서 그대로 소비한다.
@evidence principles/design/spaces.md#space-verification-address 문 개방·침대 양옆·발치·두 창·열린 서랍·옷방 진입의 평면/단면과 02·05 시야를 검사한다.
@evidence settings/10-house.md#primary-bedroom 성인 둘의 침대·양쪽 협탁과 등·낮은 서랍장을 평면 예약으로 두고 두 창의 커튼을 방 안쪽 돌출 0.12 m 안에 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work primary-bedroom의 가구 목록과 "양옆과 발치의 사용 여유"를 침대 발치 띠 X = [-2.50, -1.50] m와 왼쪽 부분에서 접근하는 서랍장 앞 작업에 적용했고 협탁 뒤를 유일한 통로로 세지 않고도 성립해 부모 수정이 없었다.
-->

같은 primary-bedroom/upper-storey 안에 [주침실 설정](../../settings/10-house.md#primary-bedroom)의 가구를 두며 침대 머리를 오른쪽의 창 없는 욕실 공유 벽 쪽으로 둔다. 두 외벽 창과 옷방 문을 침대 머리판으로 가리지 않기 위한 선택이다. 아래 평면은 world X/Z m, 높이는 [상층 완성 바닥](../01-storeys.md#storey-datums) 기준이며 몸체·손잡이의 최대 점유 입력이다. 특정 침대/가구 제품 규격을 뜻하지 않는다.

| 가구 | 평면 예약 | 높이와 사용 방향 |
| --- | --- | --- |
| 성인 둘의 침대 | X = [-1.50, 0.65], Z = [-8.65, -7.05] | 매트리스 상면 0.60 m, 머리판 상단 1.00 m, 머리는 +X. |
| 뒤쪽 협탁과 등 | X = [0.15, 0.65], Z = [-9.15, -8.65] | 상면 0.55 m, 등 포함 1.10 m. |
| 앞쪽 협탁과 등 | X는 뒤쪽 협탁과 같음, Z = [-7.05, -6.55] | 뒤쪽 협탁과 같은 높이. |
| 낮은 서랍장 | X는 방 왼쪽 안쪽 면부터 -5.00 m까지, Z = [-6.50, -5.10] | 상면 0.80 m, 서랍은 +X로 최대 0.40 m. |

침대 발치 X = [-2.50, -1.50] m의 띠를 통해 양옆과 옷방으로 분기한다. 앞쪽 침대 옆에서는 복도 문과 침대 사이, 뒤쪽에서는 침대와 후면 창 사이의 바닥을 쓰며 협탁 뒤를 유일한 통로로 세지 않는다. 옷방 문의 경첩과 주침실 쪽 -X 열림, 문 안쪽 돌아설 공간은 [옷방 owner](wardrobe.md#primary-wardrobe-plan)에서 받는다. 주침실 쪽에서는 거친 개구부 폭 1.00 m를 반경으로 한 문짝 회전 상한 X = [-0.25, 0.75]·Z = [-10.20, -9.20] m에 그 앞 0.30 m를 더한 X = [-0.55, 0.75]·Z = [-10.20, -9.20] m를 옷방 문 앞 대기로 비우고 가구를 두지 않는다. 뒤쪽 협탁 Z = [-9.15, -8.65] m와 침대는 이 대기 밖이다. 낮은 서랍장 앞 작업은 X = [-4.60, -4.00], Z는 서랍장과 같은 범위이며 방의 왼쪽 부분에서 접근한다. 열린 서랍/작업자는 침대와 옷방 사이 경로에서 벗어나게 한다.

두 창의 커튼은 해당 개구부 주변에서 방 안쪽 돌출 0.12 m 안에 두고 [창대/손잡이](../06-openings.md#external-opening-interface)와 함께 접근 여유에서 뺀다. 넓은 왼쪽 부분을 통과실이나 두 번째 침실로 나누지 않는다. 회베이지 침구와 가구/등·커튼의 실제 원형·반복 배치·재료는 후속 저작이고 완결 면은 기존 room owner가 유지한다. 문 개방/침대 양옆·발치/두 창/열린 서랍/옷방 진입의 평면·단면과 02·05 및 방 전체 시야를 [관찰 owner](../04-observations.md#spatial-observation-derivation)가 검사하며 실제 점유·회전·프레임은 unverified다.
