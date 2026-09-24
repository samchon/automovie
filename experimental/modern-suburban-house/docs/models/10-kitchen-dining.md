# 주방과 식사 구역의 가구·설비 원형

## 주방 하부장 띠 {#kitchen-base-run}

[주방 설비 설정](../settings/10-house.md#kitchen-equipment)의 L형 하부 수납을 길이 L을 매개변수로 받는 한 원형으로 만든다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 바닥 중심이고 +Y가 위, +Z가 사용자가 서는 작업면이다. 깊이 0.65 m와 상판 상면 0.91 m는 [공용부 벽 주방 예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)의 뒤쪽 띠 Z = [-10.45, -9.80]과 왼쪽 띠 X = [-5.50, -4.85]의 폭, 그리고 두 띠의 Y = [0, 0.91]에서 그대로 받는다. 길이는 뒤쪽 띠 3.35 m, 왼쪽 뒤 조각 0.30 m, 왼쪽 앞 조각 1.30 m의 세 값이며, 교차 코너는 뒤쪽 띠 하나가 소유하고 왼쪽 뒤 조각은 그 코너 앞에서 시작하므로 코너 몸체를 복제하지 않는다.

부품은 걸레받이, 몸통, 문과 서랍 전면, 손잡이, 상판이다. 걸레받이는 높이 0.10 m이고 전면에서 0.07 m 들어간다. 몸통은 Y = [0.10, 0.88], 깊이 0.60 m이며 전면 판 두께 0.02 m를 더한 앞면이 Z = 0.62 m에 온다. 손잡이는 전면에서 0.02 m 돌출한 가로 막대로 앞 끝이 Z = 0.64 m에 머물고, 상판은 Y = [0.88, 0.91], 깊이 0.65 m로 예약 외곽과 정확히 만나 [외곽 안에 손잡이·전면 돌출을 포함하라는 조건](../spaces/rooms/common.md#common-kitchen-wall-reservation)을 지킨다. 전면은 상판 아래 높이 0.15 m의 서랍 띠와 그 아래 문 칸으로 나누고, 길이 방향은 0.60 m 안팎의 균등 칸으로 산출한다. 서랍·문·손잡이가 리뷰 거리에서 구별되어야 한다는 [주방 설비 설정](../settings/10-house.md#kitchen-equipment)이 이 분할과 돌출 손잡이의 근거이며 칸 폭은 이 층의 결정이다. 타일 backsplash는 벽 마감이므로 이 원형에 포함하지 않는다.

재질 경계는 `plinth`, `carcass`, `leaf`, `drawer-front`, `handle`, `countertop`으로 고정하고 색·광학은 materials가 정한다. 문과 서랍은 경첩/레일이 없는 강체이며, 설정과 방 문서가 하부장 문의 작동 예약을 두지 않으므로 이 원형은 관절을 노출하지 않는다. 싱크·레인지 절개는 이 띠에 없고 레인지는 별도 원형이 왼쪽 띠의 빈 구간을 채운다. 블로킹 한계는 경첩·서랍 레일·수전 배관·걸레받이 발 조절을 표현하지 않는 것이다.

소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 측면 정사영에서 상판 0.91 m·걸레받이 홈·상판 앞 돌출 0.03 m가 보이는지, 위에서 본 평면에서 세 조각의 합집합이 L형 두 예약과 틈이나 겹침 없이 같은지, 코너가 한 번만 채워졌는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 주방 상부장 {#kitchen-wall-cabinet}

벽에 매단 상부장은 길이 L을 받는 한 원형이다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 하단 중심이며 원점 높이가 걸림 높이 1.45 m에 놓이고, +Z가 방 안쪽 전면이다. 깊이 0.35 m와 높이 0.90 m는 [공용부 벽 주방 예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)의 왼쪽 상부장 X = [-5.50, -5.15]와 뒤쪽 짧은 상부장 Z = [-10.45, -10.10], 두 예약의 Y = [1.45, 2.35]에서 받는다. 길이는 왼쪽 1.30 m, 뒤쪽 0.85 m다.

부품은 몸통, 문 전면, 손잡이다. 몸통 깊이 0.31 m에 문 전면 0.02 m와 하단 모서리의 세로 막대 손잡이 돌출 0.02 m를 더해 0.35 m가 된다. 문 전면은 왼쪽 상부장을 두 문, 뒤쪽 상부장을 한 문으로 나눈다. 상하부장 손잡이가 리뷰 거리에서 구별되어야 한다는 [주방 설비 설정](../settings/10-house.md#kitchen-equipment)이 돌출 손잡이의 근거다. 재질 경계는 `carcass`, `leaf`, `handle`이며 아래에서 보이는 밑면은 `carcass`에 속한다. 문은 강체이며 관절이 없다.

냉장고·전자레인지 예약과 겹치지 않는다는 조건은 배치가 아니라 이 원형의 길이 값으로 지켜진다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 정면 정사영에서 하단 1.45 m·상단 2.35 m가 하부장 상판과 0.54 m 간격을 이루는지, 뒤쪽 상부장이 주방 창 오른쪽 끝에서 멈추는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 양문 냉장고 {#kitchen-refrigerator}

냉장고는 [예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)의 X = [-5.50, -4.70], Z = [-7.40, -6.45], Y = [0, 1.85]를 그대로 외곽으로 받는다. 로컬 원점은 뒤쪽 모서리의 바닥 중심, +Z가 전면이며 배치에서 world +X를 향한다. 로컬 외곽은 폭 0.95 m, 깊이 0.80 m, 높이 1.85 m다. 깊이 0.80 m는 몸통 0.72 m, 문 두께 0.05 m, 손잡이 0.03 m의 합이며 이 분할은 이 층의 결정이다.

부품 계층은 몸통 아래에 위 두 문, 아래 서랍 하나, 세 손잡이다. 아래 서랍 전면은 Y = [0.05, 0.75], 위 두 문은 Y = [0.77, 1.85]이고 두 문은 중앙 0.005 m 틈을 두고 각 폭 0.47 m다. 각 문은 바깥 세로 모서리의 경첩 피벗을 가지며, 90° 열림에서 문 폭 0.47 m와 손잡이 0.03 m를 더한 0.50 m가 [냉장고 작동 예약 X = [-4.70, -4.15]의 0.55 m](../spaces/rooms/common.md#common-kitchen-wall-reservation) 안에 든다. 서랍은 +Z로 최대 0.55 m 미끄러진다. 피벗 이름 `door-left`, `door-right`, `drawer`가 motion이 바꿀 수 있는 안정 인터페이스이고 손잡이는 각 부품에 고정된 강체다.

재질 경계는 `appliance-body`, `leaf`, `drawer-front`, `handle`, 그리고 열린 상태에서만 보이는 `appliance-interior`다. 내부 선반·조명·가스켓은 표현하지 않고 `appliance-interior`는 빈 상자 하나다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 닫힌 상태의 측면에서 손잡이 끝이 0.80 m 안에 드는지, 두 문 90° 열림과 서랍 0.55 m 인출의 평면에서 앞 끝이 X = -4.15 m를 넘지 않는지, 옆 하부장보다 0.15 m 튀어나온 몸체가 통로 쪽에서 보이는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 레인지와 아래 오븐 {#kitchen-range}

레인지는 [예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)의 X = [-5.50, -4.85], Z = [-9.50, -8.70], Y = [0, 0.91]을 외곽으로 받아 폭 0.80 m, 깊이 0.65 m, 높이 0.91 m다. 로컬 원점은 뒤쪽 모서리의 바닥 중심, +Z가 오븐 전면이다. 뒤쪽 조작 패널은 두지 않는다. 0.91 m 높이 상한 위로 솟는 패널은 예약을 벗어나기 때문이며, 조작 손잡이는 전면 상단 띠에 둔다.

부품은 몸통, 조리 상판, 네 화구 링, 전면 조작 띠, 오븐 문, 오븐 손잡이다. 조리 상판은 Y = [0.88, 0.91]이고 화구 링 넷은 지름 0.20 m, 높이 0.01 m 이내의 얇은 원판으로 상판 위에 올린다. 오븐 문은 Y = [0.10, 0.62]의 0.52 m 높이이며 아래 모서리의 수평 경첩 피벗 `oven-door`로 +Z 쪽으로 최대 90° 내려 연다. 이때 문 높이 0.52 m와 손잡이 0.03 m의 합 0.55 m가 [오븐 작동 예약 X = [-4.85, -4.30]](../spaces/rooms/common.md#common-kitchen-wall-reservation)과 같다. 조작 띠는 Y = [0.66, 0.86]에 둔다.

재질 경계는 `appliance-body`, `cooktop`, `burner`, `control-panel`, `leaf`, `handle`, `appliance-interior`다. 불꽃·열·유리 투과·조작 손잡이 개별 형상은 표현하지 않는다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 측면에서 상판이 옆 하부장과 같은 0.91 m 선에 있는지, 문을 90° 연 평면에서 손잡이 끝이 X = -4.30 m에 멈추는지, 위에서 네 화구가 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 레인지 위 전자레인지 {#kitchen-microwave}

전자레인지는 [예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)의 X = [-5.50, -5.10], Z = [-9.50, -8.70], Y = [1.45, 1.85]를 외곽으로 받아 폭 0.80 m, 깊이 0.40 m, 높이 0.40 m다. 로컬 원점은 뒤쪽 모서리의 하단 중심이며 걸림 높이 1.45 m에 놓이고 +Z가 전면이다. 아래 면은 레인지 위의 후드 역할을 겸하는 평면으로 두고 별도 후드 원형을 만들지 않는다.

부품은 몸통, 문, 조작 판 셋이다. 문은 전면의 왼쪽 0.58 m, 조작 판은 오른쪽 0.22 m를 차지하며 둘 다 몸통 앞면과 같은 면에 있어 돌출이 없다. 방 문서가 전자레인지 문의 작동 예약을 두지 않으므로 문은 강체이고 관절을 노출하지 않는다. 재질 경계는 `appliance-body`, `leaf`, `glass`, `control-panel`다.

소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 정면에서 전자레인지 상단이 옆 상부장 하단보다 낮아 두 예약이 겹치지 않는지, 측면에서 레인지 조리면 위 0.54 m의 빈 공간이 남는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 싱크 섬 {#kitchen-island}

섬은 [섬 예약](../spaces/rooms/common.md#common-island-reservation)의 X = [-3.65, -2.60], Z = [-8.70, -6.45], Y = [0, 0.91]을 외곽으로 받아 길이 2.25 m, 폭 1.05 m, 높이 0.91 m다. 로컬 원점은 바닥 평면의 중심이며 +Z가 작업면(world -X), -Z가 좌석면(world +X), +X가 world -Z 방향의 뒤쪽 끝이다. 아래 부품 위치는 방향에 흔들리지 않도록 뒤쪽 끝과 작업면에서 잰 거리로 준다.

상판은 전체 2.25 × 1.05 m, Y = [0.88, 0.91]이다. 수납 몸통은 작업면부터 0.75 m 깊이까지이며 좌석면 쪽 0.30 m는 [방 문서의 무릎 공간](../spaces/rooms/common.md#common-island-reservation)으로 비운다. 몸통은 높이 0.10 m의 걸레받이를 가진다. 싱크 절개는 뒤쪽 끝에서 0.10 m, 작업면에서 0.10 m 떨어진 0.50 × 0.50 m이며 [싱크 예약 X = [-3.55, -3.05], Z = [-8.60, -8.10]](../spaces/rooms/common.md#common-island-reservation)과 같다. 싱크 볼은 절개 아래로 0.20 m 깊이의 열린 상자다. 수전은 절개 뒤쪽 가장자리 중심에 서는 기둥과 작업면 쪽으로 꺾인 토출구로 두고 높이는 상판 위 0.35 m로 정해 예약 상한 1.31 m 아래에 둔다. 식기세척기 칸은 뒤쪽 끝에서 0.65 m부터 1.25 m까지, 작업면에서 0.60 m 깊이, Y = [0, 0.88]의 빈 칸이며 기기는 [식기세척기 원형](#kitchen-dishwasher)이 채운다.

재질 경계는 `plinth`, `carcass`, `leaf`, `countertop`, `basin`, `faucet`, `leaf`, `drawer-front`, `handle`다. 작업면 수납 전면과 손잡이는 [하부장 띠](#kitchen-base-run)와 같은 분할·돌출 규칙의 강체다. 섬 끝 기둥이나 벽을 두지 않는다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 좌석면 쪽 측면에서 0.30 m 무릎 공간이 전 길이에 걸쳐 비어 있는지, 위에서 싱크 절개와 식기세척기 칸이 서로 0.05 m 떨어져 겹치지 않는지, 수전 끝이 1.26 m를 넘지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 섬 식기세척기 {#kitchen-dishwasher}

식기세척기는 [섬 식기세척기 예약](../spaces/rooms/common.md#common-island-reservation)의 Z = [-8.05, -7.45], 몸체 깊이 0.60 m를 받아 폭 0.60 m, 깊이 0.60 m, 높이 0.88 m다. 높이는 섬 상판 아래 면 0.88 m가 정한다. 로컬 원점은 뒤쪽 모서리의 바닥 중심, +Z가 문 전면이며 배치에서 world -X를 향한다.

부품은 몸통, 문, 조작 띠, 손잡이다. 문은 Y = [0.10, 0.70]의 0.60 m 높이이고 아래 모서리의 수평 경첩 피벗 `door`로 +Z 쪽으로 최대 90° 내려 연다. 90° 열림에서 문 높이 0.60 m가 [식기세척기 작동 예약 X = [-4.25, -3.65]](../spaces/rooms/common.md#common-island-reservation)의 0.60 m와 같으므로 손잡이는 문 윗면과 같은 면의 홈으로 두어 돌출이 없다. 조작 띠는 Y = [0.70, 0.88]의 고정 띠이며 문 높이를 예약 폭에 맞추기 위한 이 층의 결정이다.

재질 경계는 `body`, `leaf`, `control-panel`, `handle`, `appliance-interior`다. 선반·분사 팔·배수는 표현하지 않는다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 닫힌 문이 섬 작업면과 같은 면에 있는지, 90° 연 평면에서 문 끝이 X = -4.25 m에 멈추고 오븐 작동 구간과 Z가 겹치지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 섬 스툴 {#kitchen-island-stool}

스툴은 [섬 앞 세 좌석](../spaces/rooms/common.md#common-island-reservation)에 세 번 쓰는 한 원형이며 세 개의 배치는 instances가 소유한다. 로컬 원점은 바닥의 좌석 중심, +Z가 앉은 사람이 보는 방향(섬 쪽, world -X)이다. 좌면 상면은 방 문서가 정한 0.64 m다. 좌면 평면 0.40 × 0.40 m와 다리 벌림 0.44 × 0.44 m는 각 좌석 사용 폭 0.65 m 안에서 옆 스툴과 0.05 m 이상 떨어지도록 이 층이 정한 값이다.

부품은 좌면, 네 다리, 발걸이 링이다. 좌면 두께는 0.05 m, 다리는 0.03 m 각재로 바닥에서 좌면 아래까지 약간 벌어지며, 발걸이는 높이 0.25 m의 사각 링이다. 등받이는 두지 않는다. 섬 너머 식당 쪽 시야를 막지 않고 좌석면의 0.30 m 무릎 공간 아래로 반쯤 밀어 넣는 모양을 택했기 때문이다. 관절은 없고 앉기·밀어 넣기는 배치 변화로만 표현한다.

재질 경계는 `seat`, `leg`, `footrest`다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 측면에서 좌면 0.64 m가 섬 상판 0.91 m보다 0.27 m 낮은지, 위에서 세 스툴 사이 틈이 보이고 하나의 긴 벤치로 읽히지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 여섯 좌석 식탁 {#dining-table}

식탁은 [식사 구역 예약](../spaces/rooms/common.md#common-dining-reservation)의 상판 X = [-0.35, 1.35], Z = [-8.40, -7.50], 높이 0.75 m를 외곽으로 받아 길이 1.70 m, 폭 0.90 m다. 로컬 원점은 바닥 평면의 중심이고 +X가 긴 방향이다. [가족과 손님이 함께 앉는 여섯 좌석](../settings/10-house.md#common-room)의 무릎 공간을 지키는 것이 부품 배치의 기준이다.

부품은 상판, 에이프런 네 개, 다리 네 개다. 상판은 Y = [0.715, 0.75]의 0.035 m 두께다. 다리는 0.05 × 0.05 m 각재로 상판 네 모서리와 면이 맞게 세운다. 긴 변 좌석 중심 X = 0, 1.00 m 양옆 0.30 m의 사람 폭은 X = [-0.30, 0.30]과 [0.70, 1.30]이므로 모서리 다리 X = [-0.35, -0.30]과 [1.30, 1.35]에 닿기만 하고 겹치지 않는다. 끝 좌석의 사람 폭 Z = [-8.25, -7.65]도 다리 Z = [-8.40, -8.35]와 [-7.55, -7.50] 사이에 든다. 에이프런은 상판 아래 0.08 m 높이, 상판 가장자리에서 0.02 m 들어가며 무릎 아래 여유 0.635 m를 남긴다.

재질 경계는 `top`, `apron`, `leg`다. 관절은 없다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 정면·측면 정사영에서 다리가 네 모서리에만 있고 좌석별 무릎 공간이 열려 있는지, 상판 높이 0.75 m와 의자 좌면의 차가 0.30 m로 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 식탁 의자 {#dining-chair}

식탁 의자는 [여섯 좌석](../spaces/rooms/common.md#common-dining-reservation)에 여섯 번 쓰는 한 원형이며 두 반복 규칙에 따른 배치는 instances가 소유한다. 로컬 원점은 바닥의 좌면 중심, +Z가 식탁 쪽 정면이다. 외곽은 폭 0.45 m, 깊이 0.50 m, 등받이 상단 0.85 m다. 좌면 높이 0.45 m는 식탁 0.75 m보다 0.30 m 낮은 식사 자세를 위한 이 층의 결정이고, 폭 0.45 m는 좌석 사용 폭 0.65 m 안에서 식탁 다리 사이로 밀어 넣을 수 있도록 택했다.

부품은 좌면, 네 다리, 등받이 기둥 둘, 등받이 판이다. 좌면은 Y = [0.42, 0.45]의 두께 0.03 m 판, 다리는 0.035 m 각재이며 뒤 다리가 그대로 올라가 등받이 기둥이 된다. 등받이 판은 Y = [0.62, 0.85], 두께 0.02 m이고 뒤로 5° 기운다. 팔걸이는 없다. 등받이 상단 0.85 m가 식탁 상판 위로 0.10 m 솟으므로 밀어 넣은 상태에서도 등받이가 식탁 가장자리 밖에 남는다. 관절은 없고 꺼내 앉기는 배치 변화다.

재질 경계는 `seat`, `leg`, `back`이다. 소스 owner는 `src/models/furnishings/kitchen-dining.ts`다. 관찰은 측면에서 좌면 0.45 m·등받이 0.85 m와 기울기가 보이는지, 밀어 넣은 평면에서 의자 폭이 두 식탁 다리 사이 1.30 m 안에 드는지, 여섯 의자가 같은 원형의 반복으로 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.
