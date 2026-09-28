# 1층 방의 가구·설비 배치

## 식탁과 여섯 의자 {#dining-table-chairs}

[식사 예약](../spaces/rooms/common.md#common-dining-reservation)의 `common-dining-table`에 [여섯 좌석 식탁](../models/10-kitchen-dining.md#dining-table) 원형 하나를 yaw 0(긴 변이 X)으로 놓는다. 여섯 의자는 [식탁 의자](../models/10-kitchen-dining.md#dining-chair) 한 원형의 구성원이며 이 집합의 예외 규칙으로 몸체 대신 각 seat use 구역 중심에 선다: `common-dining-seat-back-1`·`-back-2`는 yaw 0, `-front-1`·`-front-2`는 yaw π, `-left`는 yaw π/2, `-right`는 yaw -π/2로 모두 식탁을 향한다. 위치는 [배치 규칙](00-placement-frame.md#placement-transform-rule)으로 예약에서 도출하며 이 문서에 좌표 표를 두지 않는다. 의자 몸체가 use 구역에 들어가는지는 models 원형 치수로 판정한다. 최악 경우는 `-right` 의자와 `common-main-route-right`(X 하한 2.10 m)의 비접촉이다. source owner는 src/instances/ 1층 모듈이며 [적합 검사](00-placement-frame.md#placement-fit-validity)와 평면 관찰이 여섯 의자·식탁·통로를 함께 본다.

## 섬 스툴 세 개 {#island-stools}

[섬 예약](../spaces/rooms/common.md#common-island-reservation)의 `common-island-stool-1`·`-2`·`-3` use 구역 중심에 [섬 스툴](../models/10-kitchen-dining.md#kitchen-island-stool) 한 원형의 세 구성원을 yaw -π/2(섬을 향함)로 놓는다. 구성원 번호는 예약 번호를 그대로 쓰며 Z가 작은 쪽이 1이다. 최악 경우는 스툴 몸체가 섬 본체 `common-island`의 +X 경계를 넘는지이며 적합 검사가 판정한다.

## 주방 설비와 붙박이 몸체 {#kitchen-fixtures}

[주방 벽 예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)과 섬 예약의 몸체는 각각 단일 구성원이다. `common-fridge`는 [냉장고](../models/10-kitchen-dining.md#kitchen-refrigerator), `common-range`는 [레인지](../models/10-kitchen-dining.md#kitchen-range), `common-microwave`는 [전자레인지](../models/10-kitchen-dining.md#kitchen-microwave)이며 셋 다 yaw π/2다. `common-island`는 [싱크 섬](../models/10-kitchen-dining.md#kitchen-island), `common-dishwasher`는 [식기세척기](../models/10-kitchen-dining.md#kitchen-dishwasher)이며 yaw -π/2다. `common-island-sink`는 섬 원형 안의 부재여서 별도 구성원을 만들지 않는다. 하부장 세 구간은 [하부장 띠](../models/10-kitchen-dining.md#kitchen-base-run), 상부장 두 구간은 [상부장](../models/10-kitchen-dining.md#kitchen-wall-cabinet)의 구성원이며 뒤 띠는 yaw 0, 왼쪽 띠는 yaw π/2다. L자 모서리는 뒤 띠에만 속한다는 방 예약을 따른다. 최악 경우는 식기세척기 문이 열린 `common-dishwasher-swing`이 섬 밖으로만 나가는지다.

## 가족실 소파와 낮은 탁자 {#family-seating}

[가족실 예약](../spaces/rooms/common.md#common-family-reservation)의 `common-family-sofa`는 거실 소파와 같은 2.10 × 0.95 m 예약이므로 [패브릭 소파](../models/11-living.md#fabric-sofa)의 둘째 구성원으로 두고 yaw π로 앞 칸막이에 등을 댄다. models가 가족실 전용 소파를 따로 정하면 그 원형으로 바꾼다. `common-family-table`은 [낮은 목재 테이블](../models/11-living.md#low-table) 매개변수 원형의 가족실 크기 쌍 L = 1.10 m, W = 0.55 m 구성원으로 yaw 0에 놓는다.

## 거실 좌석·서가·러그 {#living-furniture}

[거실 예약](../spaces/rooms/living.md#living-furniture-use)에 따라 `living-sofa`는 [패브릭 소파](../models/11-living.md#fabric-sofa)의 첫 구성원으로 yaw -π/2, `living-table`은 [낮은 목재 테이블](../models/11-living.md#low-table)로 yaw -π/2, `living-reading-chair`는 [독서 안락의자](../models/11-living.md#reading-armchair)로 yaw 0, `living-bookcase`는 [짙은 책장](../models/11-living.md#dark-bookcase)으로 yaw -π/2, covering `living-rug`는 [얇은 바닥 깔개](../models/11-living.md#floor-covering)로 yaw 0이다. 소파 앞다리는 러그 위에 서며 러그 두께 안의 겹침만 허용한다. 최악 경우는 `living-sofa-use`가 소파와 탁자 사이에서 비어 있는지다.

## 현관 매트 {#entry-mat}

[현관 예약](../spaces/rooms/entry.md#entry-use-routes)의 covering `entry-mat`에 [얇은 바닥 깔개](../models/11-living.md#floor-covering)의 둘째 구성원(치수는 models가 매트용으로 따로 정하면 그 원형)을 yaw 0으로 놓는다. 매트 위에는 아무 개체도 서지 않는다.

## 파우더룸 설비 {#powder-fixtures}

[파우더룸 예약](../spaces/rooms/powder.md#powder-fixture-use)의 `powder-toilet`은 [공용 변기](../models/14-bathrooms.md#shared-toilet)로 yaw -π/2, `powder-basin`은 [세면장](../models/14-bathrooms.md#vanity-basin), `powder-mirror`는 [벽 거울](../models/14-bathrooms.md#wall-mirror), `powder-towel`은 [수건걸이](../models/14-bathrooms.md#towel-bar)로 yaw π이며 세면장·거울·수건걸이의 W·D·H는 그 H2가 이 구역에 준 값이다. 변기는 [위층 욕실](02-upper-rooms.md#bath-fixtures)과 함께 한 원형의 세 구성원이다. 최악 경우는 `powder-door-waiting`에 몸체가 걸치지 않는지다.

## 세탁실 기기와 머드룸 벤치 {#laundry-fixtures}

[세탁실 예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 `laundry-washer`·`laundry-dryer`는 [드럼 세탁기와 건조기](../models/12-service-rooms.md#laundry-machine), `laundry-folding-top`은 [접는 상판](../models/12-service-rooms.md#laundry-folding-top), `laundry-upper-storage`는 [상부 수납](../models/12-service-rooms.md#laundry-upper-storage)이며 모두 yaw -π/2다. `laundry-shoe-bench`는 [신발 벤치](../models/12-service-rooms.md#mudroom-bench), `laundry-coat-hooks`는 [외투 걸이](../models/12-service-rooms.md#mudroom-coat-hooks)이며 yaw π/2다. 세탁기와 건조기가 한 원형의 두 구성원인지는 그 models H2의 구분을 따른다. 최악 경우는 `laundry-upper-waiting`에 기기 몸체가 걸치지 않는지다.

## 팬트리 L형 선반 {#pantry-shelves}

[팬트리 예약](../spaces/rooms/pantry.md#pantry-storage-use)의 `pantry-back-shelf`와 `pantry-right-shelf`는 한 [L형 선반](../models/12-service-rooms.md#pantry-l-shelf)의 두 띠이므로 구성원은 하나(`pantry-l-shelf`)이고 yaw 0으로 두 예약의 합집합 경계 상자 중심에 선다. 이 구성원은 두 예약 id를 모두 채우는 것으로 [구성원 규칙](00-placement-frame.md#reservation-derived-membership)의 예외다. 몸체는 두 띠 밖, 특히 `pantry-turning`에 걸치지 않아야 한다. [식품 용기](../models/12-service-rooms.md#pantry-containers)는 이 선반에 놓이는 별도 구성원이다. 다섯 선반 각각 뒤쪽 띠 길이 2.28 m 안에는 폭 0.12 m 병 다섯과 폭 0.18 m 상자 여섯을 왼쪽에서 병 다섯→상자 여섯 순서로, 사이 0.02 m 간격으로 놓는다. 가로 합 5 × 0.12 + 6 × 0.18 + 10 × 0.02 = 1.88 m이므로 양끝 0.20 m씩 남는다. 오른쪽 띠는 코너 0.30 m를 비운 잔여 길이 1.05 m에 폭 0.30 m 바구니 셋을 0.03 m 간격으로 놓아 3 × 0.30 + 2 × 0.03 = 0.96 m, 양끝 0.045 m를 남긴다. 따라서 다섯 층 × (5 + 6 + 3) = 70개의 용기 구성원이 생긴다. 각 원점 Y는 해당 선반 상면, 뒤판·앞끝은 방 owner의 선반 끝에서 0.02 m 이상 안쪽이다. 용기 count와 배치만 이 instances H2가 결정하며 부피·면 id는 models가 결정한다.

## 차고 선반과 작업대 {#garage-storage}

[차고 예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 `garage-shelf`는 [금속 선반](../models/12-service-rooms.md#garage-shelving), `garage-workbench`는 [작업대](../models/12-service-rooms.md#garage-workbench), `garage-tool-board`는 [공구판](../models/12-service-rooms.md#garage-tool-board)이며 모두 yaw 0이다. 차고 바닥이 1층보다 낮으므로 Y는 예약 하한 그대로 쓴다. 자동차는 설정상 만들지 않는다. 최악 경우는 `garage-shelf-use`·`garage-workbench-use`가 비어 있는지다.
