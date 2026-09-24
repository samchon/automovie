# 침실과 옷방의 가구 원형

## 머리판 있는 침대 {#headboard-bed}

침대는 폭 W, 길이 L, 매트리스 상면 H, 머리판 상단 B를 받는 한 원형이다. [주침실 예약](../spaces/rooms/primary.md#primary-furniture-use) X = [-1.50, 0.65], Z = [-8.65, -7.05]는 L = 2.15 m, W = 1.60 m, H = 0.60 m, B = 1.00 m이고 머리가 +X다. [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-5.25, -4.10], Z = [-4.50, -2.35]와 [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [-0.25, 0.90], Z = [-3.10, -0.95]는 L = 2.15 m, W = 1.15 m, H = 0.55 m, B = 0.95 m이고 머리가 -Z다. 로컬 원점은 머리판 뒷면의 바닥 중심, +Z가 발끝 방향이며 높이는 상층 완성 바닥 기준이다.

부품은 머리판, 프레임, 매트리스, 침구 덮개, 베개다. 머리판은 두께 0.06 m, 전체 폭 W다. 프레임은 Y = [0.10, 0.30], 네 모서리 다리 0.10 m 위에 놓인다. 매트리스는 Y = [0.30, H − 0.03], 침구 덮개는 매트리스 위 0.03 m 두께로 발끝과 양옆으로 0.02 m 내려와 외곽 안에 머문다. 베개는 주침실 둘, 작은 침실 하나로 각 0.60 × 0.40 × 0.12 m이며 머리판 앞에 둔다. 재질 경계는 `headboard`, `bed-frame`, `mattress`, `bedding`, `pillow`이고 회베이지·올리브·청회색 침구는 materials가 배치별로 정한다. 관절은 없고 이불 주름은 표현하지 않는다.

소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 측면에서 H와 B가 배치별 값과 같은지, 위에서 외곽이 세 예약과 같은지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 협탁과 등 {#nightstand-lamp}

협탁은 정사각 폭 S, 상면 T, 등 상단 U를 받는 한 원형이다. [주침실의 두 협탁](../spaces/rooms/primary.md#primary-furniture-use) X = [0.15, 0.65], Z = [-9.15, -8.65]와 Z = [-7.05, -6.55]는 S = 0.50 m, T = 0.55 m, U = 1.10 m다. [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-3.95, -3.50], Z = [-4.50, -4.05]와 [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.05, 1.50], Z = [-3.10, -2.65]는 S = 0.45 m, T = 0.50 m, U = 1.05 m다. 로컬 원점은 뒤쪽 모서리의 바닥 중심, +Z가 서랍 정면이다.

부품은 몸통, 서랍 전면 하나, 등 받침, 등 기둥, 갓이다. 서랍 전면은 상면 아래 0.15 m 높이이며 방 문서가 협탁 서랍 작동을 예약하지 않으므로 강체다. 등은 지름 0.14 m 받침, 기둥, 지름 0.25 m·높이 0.22 m 원뿔대 갓이며 갓 상단이 U에 온다. 재질 경계는 `carcass`, `drawer-front`, `lamp-base`, `lamp-shade`다. 빛 방출은 lighting 소유다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 측면에서 T와 U, 위에서 갓이 S 안에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 낮은 서랍장 {#low-dresser}

서랍장은 [주침실 예약](../spaces/rooms/primary.md#primary-furniture-use)의 X = [-5.50, -5.00], Z = [-6.50, -5.10], 상면 0.80 m를 외곽으로 받아 길이 1.40 m, 깊이 0.50 m, 높이 0.80 m다. 로컬 원점은 벽에 닿는 뒤쪽 바닥 중심, +Z가 서랍 정면(world +X)이다.

부품은 몸통, 다리 넷(0.08 m), 서랍 여섯(2열 × 3단)이다. 각 서랍은 피벗 `drawer-<열>-<단>`으로 +Z로 최대 0.40 m 미끄러져 [서랍 작동 예약 X = [-5.00, -4.60]](../spaces/rooms/primary.md#primary-furniture-use)과 같고, 손잡이는 서랍 윗 모서리 홈이라 돌출이 없다. 재질 경계는 `carcass`, `drawer-front`, `handle`, `leg`다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 서랍 0.40 m 인출 평면이 작업 범위 X = [-4.60, -4.00]로 넘어가지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 작은 책상 {#child-desk}

책상은 길이 L을 받는 한 원형이며 깊이 0.60 m, 상면 0.75 m다. [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-5.50, -4.90], Z = [-1.60, -0.40]은 L = 1.20 m, [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.40, 2.55], Z = [-0.85, -0.25]는 L = 1.15 m다. 로컬 원점은 벽에 닿는 뒤쪽 바닥 중심, +Z가 앉는 쪽이다.

부품은 상판(0.03 m), 다리 넷(0.04 m 각), 상판 아래 앞으로 열리지 않는 얕은 칸막이 선반 하나(0.10 m 높이)다. 책상 소품은 램프 대신 책 세 권 묶음과 연필꽂이 원통 하나로 상판 뒤쪽 0.25 m 안에 둔다. 재질 경계는 `top`, `leg`, `shelf`, `prop`이다. 관절은 없다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 측면에서 상판 아래 무릎 공간 0.62 m가 비어 있는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 책상 의자 {#desk-chair}

책상 의자는 두 침실의 [의자 사용 예약](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) 0.75 × 0.75 m 안에서 쓰는 한 원형이다. 몸체 예약이 없으므로 폭 0.45 m, 깊이 0.48 m, 좌면 0.45 m, 등받이 0.82 m를 이 층이 택하며, 근거는 책상 상면 0.75 m와 0.30 m 차이의 앉은 자세와 사용 영역 안에서 밀고 당기는 여유다. [식탁 의자](10-kitchen-dining.md#dining-chair)와 같은 좌면·다리·등받이 구성을 쓰되 등받이가 낮고 폭이 좁아 별도 원형이다.

재질 경계는 `seat`, `leg`, `back`이고 관절은 없다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 밀어 넣은 상태에서 의자가 책상 다리 사이에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 미닫이 옷장 {#sliding-closet}

옷장은 [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-2.55, -1.95], Z = [-2.95, -1.45]와 [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [4.90, 5.50], Z = [-2.80, -1.30]에 쓰는 한 원형이다. 두 예약 모두 폭 1.50 m, 깊이 0.60 m, 높이 2.20 m이고 -X 면에 미닫이 문을 둔다. 로컬 원점은 벽에 닿는 뒤쪽 바닥 중심, +Z가 문 면이다.

부품은 몸통, 앞뒤 두 레일 위의 미닫이 문 둘(각 폭 0.76 m, 두께 0.02 m), 옷걸이 봉(뒤에서 0.28 m, 높이 1.65 m), 윗선반(1.85 m), 걸린 옷 덩어리다. 문 피벗 `door-front`, `door-back`은 로컬 X 방향으로 최대 0.72 m 미끄러지며 몸체 깊이 안에서만 움직인다. 재질 경계는 `carcass`, `leaf`, `handle`, `rail`, `shelf`, `clothes`다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 문이 열린 상태에서도 몸체 앞면 밖으로 나오지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 옷방 옷걸이 구간 {#wardrobe-hanging}

옷걸이 구간은 [옷방 예약](../spaces/rooms/wardrobe.md#wardrobe-storage-use)의 X = [2.10, 4.25], Z = [-10.45, -9.90], 높이 상층 바닥 위 2.05 m를 외곽으로 받아 길이 2.15 m, 깊이 0.55 m다. 로컬 원점은 후벽의 바닥 중심, +Z가 방 안쪽이다. 봉은 후면에서 0.28 m, 높이 1.65 m이고 상단 선반은 상면 2.05 m, 깊이 0.55 m다. 옷은 두께 0.03–0.06 m, 폭 0.50 m의 판 묶음을 고정 시드로 늘어놓고 뒤벽과 0.55 m 앞면 사이에 머문다. 재질 경계는 `rail`, `shelf`, `carcass`, `clothes`이고 관절은 없다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 위에서 옷 앞 끝이 Z = -9.90 m를 넘지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 옷방 선반 구간 {#wardrobe-shelves}

선반 구간은 [옷방 예약](../spaces/rooms/wardrobe.md#wardrobe-storage-use)의 X = [4.40, 5.50], Z = [-10.45, -9.90]을 받아 길이 1.10 m, 깊이 0.55 m다. 네 선반 상면은 바닥 위 0.20 m부터 0.45 m 간격인 0.20, 0.65, 1.10, 1.55 m이고 두께 0.03 m다. 접은 옷 더미와 신발 상자를 0.30 × 0.35 × 0.20 m 이하 상자로 둔다. 로컬 원점은 후벽의 바닥 중심, +Z가 방 안쪽이다. 재질 경계는 `shelf`, `carcass`, `folded`, `shoe-box`이고 관절은 없다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 정면에서 네 단이 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.
