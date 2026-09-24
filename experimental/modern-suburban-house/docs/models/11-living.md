# 거실과 가족실의 가구 원형

## 패브릭 소파 {#fabric-sofa}

패브릭 소파는 [거실 소파 예약](../spaces/rooms/living.md#living-furniture-use)의 X = -2.90 m부터 방 오른쪽 안쪽 면 -1.95 m까지, Z = [-3.75, -1.65], 높이 0.90 m와 [가족실 소파 예약](../spaces/rooms/common.md#common-family-reservation)의 X = [3.25, 5.35], Z = -7.15 m부터 공용부 앞쪽 안쪽 면 -6.20 m까지, 높이 0.90 m에 함께 쓰는 한 원형이다. 두 예약이 모두 길이 2.10 m, 깊이 0.95 m, 높이 0.90 m이므로 외곽을 그대로 그 값으로 둔다. 로컬 원점은 등 쪽 모서리의 바닥 중심, +Z가 앉은 사람이 보는 정면이며 거실에서는 world -X, 가족실에서는 world -Z를 향한다.

부품은 받침, 좌석 쿠션 셋, 등받이, 팔걸이 둘이다. 받침은 Y = [0.08, 0.30]이고 네 모서리의 0.08 m 짧은 다리 위에 놓인다. 팔걸이는 각 폭 0.15 m, 높이 0.62 m로 전체 깊이를 차지한다. 등받이는 두 팔걸이 사이 뒤쪽 깊이 0.20 m, 상단 0.90 m다. 좌석 쿠션은 팔걸이 사이 1.80 m를 세 칸 0.60 m로 나누고 깊이 0.75 m, 상면 0.43 m로 두어 [거실 표의 좌면 0.43 m](../spaces/rooms/living.md#living-furniture-use)와 같다. 가족실 예약과 [공용부 설정](../settings/10-house.md#common-room)은 좌면 높이를 정하지 않으므로 가족실 배치도 같은 0.43 m를 쓰는 것이 이 층의 결정이며, 근거는 두 예약의 외곽이 같고 [거실 설정](../settings/10-house.md#living)의 회색/미색 패브릭 소파 정체성을 한 원형으로 공유하는 것이다. 쿠션 사이 0.005 m 틈으로 세 칸이 읽히게 한다.

재질 경계는 `leg`, `base`, `seat-cushion`, `back`, `arm`이며 패브릭 색은 materials가 두 배치별로 정할 수 있다. 관절은 없고 쿠션 눌림·주름·솔기는 표현하지 않는다. 소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 측면 정사영에서 좌면 0.43 m·팔걸이 0.62 m·등받이 0.90 m의 세 단이 보이는지, 위에서 세 쿠션과 두 팔걸이가 구분되는지, 두 배치에서 외곽이 예약과 같은지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 낮은 목재 테이블 {#low-table}

낮은 목재 테이블은 길이 L과 폭 W를 매개변수로 받는 한 원형이다. [거실 테이블 예약](../spaces/rooms/living.md#living-furniture-use) X = [-3.95, -3.45], Z = [-3.30, -2.00]은 L = 1.30 m, W = 0.50 m이고 긴 방향이 world Z다. [가족실 테이블 예약](../spaces/rooms/common.md#common-family-reservation) X = [3.40, 4.50], Z = [-8.35, -7.80]은 L = 1.10 m, W = 0.55 m이고 긴 방향이 world X다. 두 곳 모두 상면 0.42 m다. 로컬 원점은 바닥 평면 중심, +X가 긴 방향이다.

부품은 상판과 다리 넷이다. 상판은 Y = [0.38, 0.42]의 0.04 m 두께이고, 다리는 0.05 m 각재로 각 모서리에서 0.05 m 안쪽에 세운다. 에이프런과 하부 선반은 두지 않아 소파 앞 발 공간이 상판 아래로 이어진다. 재질 경계는 `top`, `leg`이고 관절은 없다.

소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 두 매개변수 쌍의 외곽이 각 예약과 같은지, 측면에서 상면 0.42 m가 소파 좌면 0.43 m와 거의 같은 높이로 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 독서 안락의자 {#reading-armchair}

독서 안락의자는 [거실 예약](../spaces/rooms/living.md#living-furniture-use)의 X = [-3.90, -3.05], Z = [-5.65, -4.80], 높이 0.90 m를 외곽으로 받아 폭 0.85 m, 깊이 0.85 m다. 로컬 원점은 등 쪽 모서리의 바닥 중심, +Z가 정면이며 배치에서 world +Z를 향한다.

부품은 다리 넷, 받침, 좌석 쿠션 하나, 등받이, 팔걸이 둘이다. 소파와 같은 단면 규칙으로 다리 0.08 m, 받침 Y = [0.08, 0.30], 팔걸이 폭 0.12 m·높이 0.60 m, 등받이 깊이 0.18 m·상단 0.90 m, 좌석 쿠션 상면 0.43 m를 둔다. 좌석 폭은 0.61 m이며 한 사람 좌석임이 소파와의 차이로 읽혀야 한다. 재질 경계는 `leg`, `base`, `seat-cushion`, `back`, `arm`이고 관절은 없다.

소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 측면에서 좌면·팔걸이·등받이 높이가 소파와 같은 계열로 보이는지, 위에서 0.85 m 정사각 외곽이 의자 발 사용 범위 Z = [-4.80, -4.20]로 넘어가지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 짙은 책장과 책 {#dark-bookcase}

짙은 책장은 [거실 예약](../spaces/rooms/living.md#living-furniture-use)의 X = -2.30 m부터 방 오른쪽 안쪽 면 -1.95 m까지, Z = [-5.90, -4.90], 높이 1.90 m를 외곽으로 받아 폭 1.00 m, 깊이 0.35 m, 높이 1.90 m다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 바닥 중심, +Z가 책을 꺼내는 면이며 배치에서 world -X를 향한다. 문 없는 열린 선반이다.

부품은 옆판 둘, 뒤판, 윗판, 걸레받이, 선반 다섯이다. 옆판·윗판 두께는 0.02 m, 뒤판 0.01 m, 걸레받이 높이 0.08 m다. 다섯 선반 상면은 [방 문서의 산출 규칙](../spaces/rooms/living.md#living-furniture-use)대로 0.20 m부터 0.35 m 간격인 0.20, 0.55, 0.90, 1.25, 1.60 m이고 두께 0.02 m를 상면 아래로 둔다. 책은 선반마다 두께 0.02–0.04 m, 높이 0.20–0.28 m, 깊이 0.20 m의 얇은 상자 묶음으로 두며 고정 시드로 두께와 높이를 산출하고 각 칸 폭의 70–85 %를 채운다. 책은 몸체 깊이 안에 있어 전면 밖으로 나오지 않는다.

재질 경계는 `carcass`, `shelf`, `carcass`, `book`이다. 관절은 없고 책은 책장에 고정된 자식 부품이다. 책등 글자·개별 표지는 표현하지 않는다. 소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 정면에서 다섯 선반 간격과 책 묶음이 읽히는지, 측면에서 책 앞면이 0.35 m 안에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 얇은 바닥 깔개 {#floor-covering}

러그와 현관 매트는 사람이 밟고 지나가는 얇은 바닥 덮개이므로 길이 L, 폭 W, 두께 T를 받는 한 원형으로 만든다. [거실 러그 예약](../spaces/rooms/living.md#living-furniture-use)은 X = [-4.00, -2.00], Z = [-3.90, -1.55]로 L = 2.35 m(world Z), W = 2.00 m, T = 0.008 m다. [현관 매트 예약](../spaces/rooms/entry.md#entry-use-routes)은 X = [0.45, 1.35], Z = [-1.95, -1.30]으로 L = 0.90 m(world X), W = 0.65 m, T = 0.006 m다. 로컬 원점은 바닥 평면 중심이며 밑면이 Y = 0에 놓인다.

부품은 몸판 하나와 가장자리 띠 하나다. 가장자리 띠는 몸판 둘레 0.04 m 폭의 같은 두께 영역으로 면만 나누고 높이를 올리지 않는다. 재질 경계는 `field`, `border`다. 무늬·털 높이·술 장식은 표현하지 않는다. 덮개 위에 가구가 놓이며 가구 다리와 겹치는 것은 허용하고 덮개가 가구를 들어 올리지 않는다.

소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 측면에서 두께가 T를 넘지 않아 문턱처럼 읽히지 않는지, 위에서 두 외곽이 예약과 같은지, 바닥면과 z-fighting 없이 구분되는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.
