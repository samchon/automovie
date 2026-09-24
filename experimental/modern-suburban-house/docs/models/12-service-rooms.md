# 파우더룸·세탁실·팬트리·차고의 설비와 수납 원형

## 드럼 세탁기와 건조기 {#laundry-machine}

세탁기와 건조기는 조작 판 표시만 다른 한 원형의 두 변형이다. [세탁 작업 예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 세탁기 X = [4.75, 5.50], Z = [-3.35, -2.70]과 건조기 X = [4.75, 5.50], Z = [-2.70, -2.05]가 모두 깊이 0.75 m, 폭 0.65 m, Y = [0, 0.88]이므로 외곽을 그 값으로 둔다. 로컬 원점은 뒤쪽 모서리의 바닥 중심, +Z가 문 전면이며 배치에서 world -X를 향한다.

부품은 몸통, 원형 문, 문 손잡이, 조작 띠다. 몸통 깊이는 0.72 m이고 문과 손잡이가 0.03 m를 더한다. 원형 문은 지름 0.45 m, 중심 높이 0.42 m이며 한쪽 세로 접선의 경첩 피벗 `door`로 +Z 쪽으로 최대 90° 연다. 90° 열림의 돌출 0.45 m와 손잡이 0.03 m의 합 0.48 m가 [문 작동 예약 X = [4.25, 4.75]](../spaces/rooms/laundry.md#laundry-equipment-use)의 0.50 m 안에 든다. 조작 띠는 Y = [0.76, 0.86]의 전면 띠다. 재질 경계는 `appliance-body`, `frame`, `glass`, `handle`, `control-panel`, `appliance-interior`이다. 드럼 회전·세제함·배관은 표현하지 않는다.

소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 정면에서 두 기기가 같은 몸통과 다른 조작 띠 표시로 구분되는지, 문 90° 평면에서 손잡이 끝이 X = 4.25 m에 닿지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 세탁기 위 접는 상판 {#laundry-folding-top}

접는 상판은 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [4.75, 5.50], Z = [-3.35, -2.05], Y = [0.88, 0.94]를 외곽으로 받아 길이 1.30 m, 깊이 0.75 m, 두께 0.06 m다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 하단 중심, +Z가 전면(world -X)이다. 상판은 뒤쪽 벽의 받침목과 두 기기 윗면에 얹히며 기기 문 앞에 다리나 옆판을 세우지 않아 [지지 부재가 기기 문을 가리지 않는다는 조건](../spaces/rooms/laundry.md#laundry-equipment-use)을 지킨다.

부품은 상판과 받침목 둘이다. 받침목은 상판 아래 벽면을 따라 높이 0.04 m, 깊이 0.03 m로 두되 예약 Y 범위 안에 들도록 상판 두께에 파묻은 홈으로 처리한다. 재질 경계는 `top`, `cleat`이고 관절은 없다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 상판 상면 0.94 m와 기기 상면 0.88 m 사이 틈이 없는지, 정면에서 문 앞 지지 부재가 없는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 세탁실 상부 수납 {#laundry-upper-storage}

상부 수납은 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [5.20, 5.50], Z = [-3.35, -2.05], Y = [1.50, 2.30]을 외곽으로 받아 길이 1.30 m, 깊이 0.30 m, 높이 0.80 m다. [주방 상부장](10-kitchen-dining.md#kitchen-wall-cabinet)과 같은 몸통·전면 판 구성을 쓰되 깊이와 높이가 달라 별도 원형으로 둔다. 로컬 원점은 벽에 닿는 뒤쪽 하단 중심이고 원점이 1.50 m에 놓이며 +Z가 전면이다.

부품은 몸통(깊이 0.28 m)과 두 문 전면 판(0.02 m)이며 손잡이는 하단 홈이다. 재질 경계는 `carcass`, `leaf`이고 문은 강체다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 정면에서 하단 1.50 m가 접는 상판 위 0.56 m 작업 높이를 남기는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 머드룸 신발 벤치 {#mudroom-bench}

신발 벤치는 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [3.22, 3.62], Z = [-2.85, -2.05], 좌면 0.45 m를 외곽으로 받아 길이 0.80 m, 깊이 0.40 m, 높이 0.45 m다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 바닥 중심, +Z가 앉는 정면이며 배치에서 world +X를 향한다.

부품은 좌판, 옆판 둘, 신발 선반 하나다. 좌판은 Y = [0.42, 0.45], 옆판 두께 0.03 m, 신발 선반 상면은 0.10 m다. 신발 두 켤레를 선반 위의 낮은 상자 둘(0.28 × 0.10 × 0.10 m)로 둔다. 재질 경계는 `seat`, `carcass`, `shelf`, `shoe`이고 관절은 없다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 좌면 0.45 m와 신발 선반이 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 벤치 위 외투 걸이 {#mudroom-coat-hooks}

외투 걸이는 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [3.22, 3.62], Z = [-2.85, -2.05], Y = [1.10, 1.85] 안에 걸이와 걸린 외투의 최대 돌출을 함께 담는다. 로컬 원점은 벽면의 걸이판 하단 중심이고 +Z가 방 안쪽이다. 걸이판은 길이 0.80 m, 높이 0.10 m, 두께 0.02 m이며 하단이 1.65 m에 오고, 걸이 넷은 0.20 m 간격, 돌출 0.08 m다.

걸린 외투 둘은 걸이 두 개에 매단 둥근 모서리 판 덩어리로 두며 폭 0.45 m, 깊이 0.25 m, 걸이 아래 1.10 m 높이까지 내려온다. 외투까지 포함한 돌출이 0.40 m 깊이 안에 든다. 재질 경계는 `rail`, `hook`, `clothes`이고 관절은 없다. 천 주름·소매는 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 외투 하단이 벤치 좌면 위 0.65 m에 멈추는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 팬트리 L형 선반 {#pantry-l-shelf}

팬트리 선반은 [선반 평면](../spaces/rooms/pantry.md#pantry-plan)의 뒤쪽 띠 X = [3.22, 5.50], Z = [-6.05, -5.80](깊이 0.25 m)과 오른쪽 띠 X = [5.20, 5.50], Z = [-6.05, -4.70](깊이 0.30 m)의 합집합을 한 L형 판으로 만든다. 로컬 원점은 두 벽이 만나는 뒤쪽 오른쪽 모서리의 바닥점이며 로컬 축은 world 축과 같다. 방향을 돌리지 않는 한 곳뿐인 원형이기 때문이다.

부품은 L형 선반 판 다섯과 벽 받침 띠다. 선반 상면은 [방 문서](../spaces/rooms/pantry.md#pantry-storage-use)대로 0.20 m부터 0.40 m 간격인 0.20, 0.60, 1.00, 1.40, 1.80 m이고 두께 0.03 m를 상면 아래로 둔다. 코너는 한 판으로 이어지며 코너 기둥은 없다. 받침 띠는 각 선반 아래 벽면을 따라 높이 0.03 m, 깊이 0.02 m다. 재질 경계는 `shelf`, `cleat`이고 관절은 없다.

소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 위에서 L형 코너가 한 번만 채워졌는지, 정면에서 다섯 단 간격이 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 팬트리 식품 용기 {#pantry-containers}

식품은 밀폐 용기, 작은 식료품 상자, 낮은 바구니의 세 변형을 가진 한 소품 원형이다. [방 문서](../spaces/rooms/pantry.md#pantry-storage-use)가 뒤 선반 물건 깊이 0.20 m, 오른쪽 0.25 m, 높이 선반 위 0.30 m 이내, 선반 끝에서 0.02 m 물림을 정하므로 변형 치수를 밀폐 용기 0.12 × 0.12 × 0.20 m, 상자 0.18 × 0.18 × 0.25 m, 바구니 0.30 × 0.20 × 0.15 m로 택한다. 로컬 원점은 밑면 중심이다.

밀폐 용기는 몸통과 뚜껑, 상자는 한 상자, 바구니는 테두리가 있는 열린 상자다. 재질 경계는 `container`, `lid`, `basket`이고 관절은 없다. 소스 owner는 `src/models/furnishings/service-rooms.ts`이며 개수와 배치는 instances가 소유한다. 관찰은 선반 위 용기가 선반 끝을 넘지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 차고 금속 선반 {#garage-shelving}

차고 선반은 [후벽 수납 예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 X = [7.15, 8.85], Z = [-6.45, -5.85], 차고 바닥 위 2.05 m를 외곽으로 받아 길이 1.70 m, 깊이 0.60 m, 높이 2.05 m다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 바닥 중심이며 차고 바닥 Y = -0.15 m에 놓이고 +Z가 선반 앞이다.

부품은 네 모서리 기둥(0.04 m 각)과 선반 판 다섯이다. 선반 상면은 차고 바닥 위 0.20 m부터 0.40 m 간격인 0.20, 0.60, 1.00, 1.40, 1.80 m이고 두께 0.03 m다. 수납 상자 넷을 0.40 × 0.35 × 0.28 m로 아래 두 단에 두어 몸체 깊이 안에 담는다. 재질 경계는 `post`, `shelf`, `bin`이고 관절은 없다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 상자가 0.60 m 안에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 차고 공구 작업대 {#garage-workbench}

작업대는 [예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 X = [9.00, 10.20], Z = [-6.45, -5.85], 상면 차고 바닥 위 0.90 m를 외곽으로 받아 길이 1.20 m, 깊이 0.60 m, 높이 0.90 m다. 로컬 원점은 뒤쪽 모서리의 바닥 중심, 차고 바닥 Y = -0.15 m, +Z가 작업 정면이다.

부품은 상판(두께 0.04 m), 다리 넷, 서랍 둘이다. 서랍은 상판 아래 폭 0.55 m, 높이 0.12 m이고 각각 피벗 `drawer-left`, `drawer-right`로 +Z로 최대 0.45 m 미끄러져 [서랍 작동 예약 Z = [-5.85, -5.40]](../spaces/rooms/garage-interior.md#garage-storage-use)과 같다. 재질 경계는 `top`, `leg`, `drawer-front`, `handle`이다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 서랍 0.45 m 인출 평면에서 작업 사용 범위와 겹치지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 작업대 위 공구판 {#garage-tool-board}

공구판은 [예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 X = [9.00, 10.20], Z = [-6.45, -6.30], world Y = [0.95, 1.95]를 외곽으로 받아 길이 1.20 m, 높이 1.00 m, 전체 깊이 0.15 m다. 로컬 원점은 벽면의 판 하단 중심이고 +Z가 방 안쪽이다. 타공판은 두께 0.02 m이며 걸린 공구는 망치·렌치·톱 세 실루엣과 작은 통 둘로 두고 모두 판 앞 0.13 m 안에 든다.

재질 경계는 `board`, `tool-steel`, `tool-grip`이고 관절은 없다. 공구 개별 형상은 두께 0.02–0.04 m의 판 실루엣 수준이다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 공구 돌출이 0.15 m 안인지, 정면에서 세 공구 실루엣이 구분되는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.
