# 건물 개구부 충전 배치 초안

## 개구부에서 한 충전 원형을 도출하는 규칙 {#opening-fill-membership}

[개구부 공통 좌표](../models/00-model-frame.md#model-local-frame)에 따라 `src/spaces/environment-links.ts`가 내보내는 `kind=window` 또는 `kind=door` 개구부마다 같은 id의 충전 instance 하나를 배정한다. 원형은 아래 표의 models H2를 가리킨다. instance의 평행이동은 거친 개구부 아래 변의 가로 중앙과 원점 면의 교점이고, 회전은 Y축 yaw 하나, scale은 1이다. 로컬 +Y는 위, +Z는 외부 창·문에서 날씨 쪽이고 실내 문에서 열리는 방 쪽이다. yaw 0은 +Z, π는 −Z, +π/2는 +X, −π/2는 −X를 향한다. 폭과 높이는 spaces 개구부 윤곽에서 계산해 모델 매개변수로 넘기며 별도 배율로 늘리지 않는다. 표의 좌표는 현 reviewed 공간 윤곽에 적용한 배치 검토값이고, 구현에서는 id와 공간 owner를 입력으로 이 규칙을 재생성한다. `fill: null`을 완성 상태로 해석하지 않으며, 후속 instance source가 개구부 id와 모델 instance id를 일대일로 연결해야 한다.

## 외벽 창 열두 곳 {#window-fill-placement}

아래 열두 개는 [상하창](../models/01-windows.md#double-hung-window), [고정창](../models/01-windows.md#fixed-window), [상부 경첩창](../models/01-windows.md#awning-window) 중 한 원형을 쓴다. 원점은 각 날씨 면에 있으므로 창틀의 벽 안쪽 들임은 models 원형에서만 적용한다. 표의 `p`는 `(world X,Y,Z)` m이다.

| 개구부 id | 원형 | p | yaw | 거친 폭×높이 m |
|---|---|---|---|---|
| `living-front-window` | 상하창 | (−3.70, 0.70, 0) | 0 | 2.80×1.60 |
| `bedroom-two-front-window` | 상하창 | (−3.75, 3.91, 0) | 0 | 2.10×1.40 |
| `stair-front-window` | 고정창 | (−1.23, 4.11, 0) | 0 | 0.78×1.10 |
| `bedroom-three-front-window` | 상하창 | (3.70, 3.91, 0) | 0 | 2.10×1.40 |
| `kitchen-rear-window` | 상하창 | (−3.90, 1.15, −10.70) | π | 1.20×1.15 |
| `family-rear-window` | 상하창 | (3.75, 0.75, −10.70) | π | 2.00×1.55 |
| `primary-rear-window` | 상하창 | (−2.65, 3.91, −10.70) | π | 2.40×1.40 |
| `living-left-window` | 상하창 | (−5.75, 0.75, −4.90) | −π/2 | 1.20×1.55 |
| `primary-left-window` | 상하창 | (−5.75, 3.91, −8.10) | −π/2 | 1.60×1.40 |
| `family-right-window` | 상하창 | (5.75, 0.75, −9.10) | +π/2 | 1.70×1.55 |
| `tub-right-window` | 상부 경첩창 | (5.75, 4.56, −7.95) | +π/2 | 0.90×0.75 |
| `garage-right-window` | 고정창 | (11.70, 1.40, −5.05) | +π/2 | 1.60×0.80 |

## 외부 문 세 곳과 옆마당 대문 {#exterior-door-fill-placement}

완성 외부 문 세 곳은 [현관문](../models/02-exterior-doors.md#front-entry-door), [차고문](../models/02-exterior-doors.md#garage-sectional-door), [정원문](../models/02-exterior-doors.md#garden-door-pair)을 각각 한 번 사용한다. 기준 열림은 원형이 소유한다. 정원문은 완성 문턱 위 Y=0을 원점으로 쓴다. 따라서 벽 절개가 완성 바닥 아래까지 이어져도 문 원형을 아래로 내리지 않는다.

| 개구부 id | 원형 | p (m) | yaw | 거친 폭×높이 m |
|---|---|---|---|---|
| `front-door` | 현관문 | (0.90, 0, 0) | 0 | 1.00×2.20 |
| `garage-front-door` | 차고문 | (8.60, −0.15, −0.30) | 0 | 5.00×2.30 |
| `garden-door` | 정원문 | (0, 0, −10.70) | π | 2.40×2.25 |

[옆마당 관리문 경계](../spaces/site/side-walk.md#side-gate-interface)는 environment 개구부 목록 대신 울타리의 별도 빈 구간이다. [옆마당 대문 원형](../models/02-exterior-doors.md#side-yard-gate)은 닫힌 판재 X=[12.31,13.49] m·Z=[−0.32,−0.28] m와 +X 경첩축을 세계 좌표로 정한다. 따라서 이 원형 한 개의 instance 변환은 위치 (0,0,0) m·yaw 0·scale 1이며, 이 H2에서 X=12.90 m 중심이나 정원 쪽 −Z 방향을 두 번째 변환으로 적용하지 않는다. 현장 경계 X=[12.30,13.50] m와 문짝의 맞댐만 검사하고 울타리 기둥·패널은 다시 만들지 않는다. 대문도 건물 충전 모집단에 넣되 환경의 `fill` 개수에는 합산하지 않는다.

## 실내 여닫이문 열한 곳 {#interior-door-fill-placement}

열한 곳은 [실내 문 원형](../models/03-interior-doors.md#interior-door-members)을 각각 한 번 쓴다. p는 열리는 방 쪽 벽면과 거친 개구부 아래 중앙의 교점이다. 경첩 끝의 low/high는 [방별 경첩 표](../models/03-interior-doors.md#interior-door-hinges)에 있는 개구부 수평 좌표의 낮은/높은 끝이며, 모델의 거울 변형으로 좌우를 맞춘다. `local hinge`는 +Z 쪽에서 본 좌/우다. 모든 문의 기준 상태는 원형의 π/2 열림을 따른다.

| 개구부 id | p (m) | yaw | 거친 폭 m | world 경첩 끝 | local hinge |
|---|---|---|---|---|---|
| `laundry-garage-door` | (5.50, 0, −3.875) | −π/2 | 1.05 | low Z | 좌 |
| `entry-living-door` | (−1.95, 0, −0.850) | −π/2 | 1.00 | low Z | 좌 |
| `service-powder-door` | (3.22, 0, −1.175) | +π/2 | 0.95 | low Z | 우 |
| `service-laundry-door` | (3.22, 0, −3.875) | +π/2 | 1.05 | low Z | 우 |
| `service-pantry-door` | (3.22, 0, −5.275) | +π/2 | 0.95 | high Z | 좌 |
| `hall-primary-door` | (−2.20, 3.06, −6.06) | π | 1.00 | low X | 우 |
| `primary-wardrobe-door` | (0.75, 3.06, −9.70) | −π/2 | 1.00 | low Z | 좌 |
| `hall-bedroom-two-door` | (−2.60, 3.06, −4.56) | 0 | 1.00 | high X | 우 |
| `hall-bedroom-three-door` | (3.22, 3.06, −3.985) | +π/2 | 0.95 | low Z | 우 |
| `hall-shower-door` | (1.55, 3.06, −6.06) | π | 1.00 | low X | 우 |
| `hall-tub-door` | (3.22, 3.06, −5.36) | +π/2 | 1.00 | high Z | 좌 |

## 열린 통로와 붙박이 수납문의 경계 {#non-door-opening-fills}

나머지 `kind=opening` 네 곳은 여닫이문 목록에 넣지 않는다. `living-common-opening`과 `service-common-opening`은 통행을 위해 비워 두는 공간 개구부다. `entry-coat-opening`은 [외투장 미닫이문](../models/05-closet-fittings.md#coat-closet-doors), `upper-linen-opening`은 [린넨장 미닫이문](../models/05-closet-fittings.md#linen-closet-fittings)이 닫는다. 두 모델 H2는 부재를 세계 좌표로 이미 정했으므로 각 instance의 변환은 위치 (0,0,0) m·yaw 0·scale 1이다. 외투장 앞면 X=2.02 m·가로 Z=[−4.51,−3.56] m·바닥 Y=0, 린넨장 앞면 Z=−3.41 m·가로 X=[1.97,2.97] m·바닥 Y=3.06 m를 각각 맞댐 기준으로 검사한다. 두 번째 이동·회전을 적용하거나 공간 벽·완성 바닥을 복제하지 않는다.

## 배치의 관찰 문턱 {#opening-fill-observation}

후속 source는 26개 window/door 개구부 각각에 정확히 하나의 모델 충전 참조를 넣고, 2개 통로는 의도적으로 비워 두며, 2개 수납 개구부와 별도 대문을 배치한다. 건물 viewer에서 정면·반대쪽·양 측면·개구부 높이 cut·문설주 및 창대 근접 화면을 찍어 구멍, 벽과 충전의 겹침, 뜬 부재, 빠진 재료 면을 확인한다. 현재 공간 뷰어의 `fill: null` 상태와 시험용 모델 입력은 이 배치가 아직 구현되지 않았음을 보여 주므로 이 문서는 draft 결정이다. 개구부의 위치·크기를 바꾸는 경우에는 해당 spaces owner를 먼저 고치고 이 표와 충전 입력을 함께 갱신한다.
