# 2층 방의 가구·설비 배치

## 주침실 침대·협탁·서랍장 {#primary-furniture}

[주침실 예약](../spaces/rooms/primary.md#primary-furniture-use)의 `primary-bedroom-bed`는 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)이며 머리판을 +X 벽 쪽에 두어 yaw -π/2, `primary-bedroom-rear-nightstand`·`-front-nightstand`는 [협탁과 등](../models/13-bedrooms.md#nightstand-lamp) 한 원형의 두 구성원으로 yaw -π/2, `primary-bedroom-dresser`는 [낮은 서랍장](../models/13-bedrooms.md#low-dresser)으로 yaw π/2다. 위치는 [배치 규칙](00-placement-frame.md#placement-transform-rule)으로 예약에서 도출한다. 최악 경우는 뒤 협탁과 `primary-bedroom-wardrobe-door-wait` 사이 0.05 m 틈이며 [적합 검사](00-placement-frame.md#placement-fit-validity)가 판정한다.

[침대 밑 러그](../models/11-living.md#floor-covering)는 각 침대의 중심과 yaw를 그대로 상속하되 침대 길이·폭보다 각 0.30 m 큰 얇은 덮개 한 장씩 세 구성원을 만든다. host 침대 예약에서 유도한 구성원이며 바닥 0.008 m 층만 점유하므로 실내 문·다른 가구와의 수평 중첩은 적합 검사에서 별도로 보고한다. 현재 세 중첩·프레임은 unverified다.

## 드레스룸 수납 {#wardrobe-storage}

[드레스룸 예약](../spaces/rooms/wardrobe.md#wardrobe-storage-use)의 `primary-wardrobe-hanging`과 `primary-wardrobe-shelves`는 각각 [옷방 옷걸이 구간](../models/13-bedrooms.md#wardrobe-hanging)과 [옷방 선반 구간](../models/13-bedrooms.md#wardrobe-shelves)으로 yaw 0이다. 최악 경우는 `primary-wardrobe-turning`에 몸체가 걸치지 않는지다.

## 두 자녀실의 같은 가구 집합 {#child-bedroom-furniture}

[침실 둘](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use)과 [침실 셋](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use)은 싱글 침대, [협탁](../models/13-bedrooms.md#nightstand-lamp), [작은 책상](../models/13-bedrooms.md#child-desk), [책상 의자](../models/13-bedrooms.md#desk-chair), [미닫이 옷장](../models/13-bedrooms.md#sliding-closet)을 각각 한 원형씩 공유하고 방마다 한 구성원을 받는다. 협탁은 주침실 두 개와 합쳐 한 원형의 네 구성원이다. 침대는 두 방 모두 머리를 -Z에 두어 yaw 0, 협탁은 yaw 0이다. 책상은 침실 둘 yaw π/2, 침실 셋 yaw π이고 책상 의자는 desk-chair use 구역 중심에서 책상을 향해 침실 둘 yaw -π/2, 침실 셋 yaw 0이다. 붙박이장은 두 방 모두 yaw -π/2다. 싱글 침대가 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 크기 변형인지 별도 원형인지는 그 H2의 정의를 따른다. 책상 예약은 방향이 90° 다르므로 한 원형이 두 구역에 모두 들어가는지는 models 원형 치수로 판정한다. 관찰은 두 방의 같은 원형 구성원이 변환 외에 다르지 않은지다.

## 욕실 설비와 변기 세 구성원 {#bath-fixtures}

[샤워 욕실](../spaces/rooms/shower-bath.md#shower-fixture-use)의 [미닫이 유리 샤워부스](../models/14-bathrooms.md#sliding-shower-booth)와 [공용 변기](../models/14-bathrooms.md#shared-toilet)는 yaw 0, [세면장](../models/14-bathrooms.md#vanity-basin)은 yaw -π/2, [수건걸이](../models/14-bathrooms.md#towel-bar)는 yaw π다. [욕조 욕실](../spaces/rooms/tub-bath.md#tub-fixture-use)의 세면장·공용 변기·[욕조 겸 샤워](../models/14-bathrooms.md#bathtub)·[벽 거울](../models/14-bathrooms.md#wall-mirror)은 yaw -π/2, 수건걸이는 yaw π/2다. [욕조 커튼 레일](../models/14-bathrooms.md#tub-curtain-rail)은 [욕조 앞쪽 물 쪽 0.10 m 띠](../spaces/rooms/tub-bath.md#tub-fixture-use)의 독립 구성원이며 욕조 길이 방향과 같은 yaw를 쓴다. [샤워 벽감 병](../models/14-bathrooms.md#shower-niche-bottles)은 벽감 선반을 host로 한 세 구성원, [욕실 매트](../models/14-bathrooms.md#bath-floor-mats)는 두 사용 바닥 각각의 중심에 한 구성원씩 둔다. 실제 벽감 절개와 배치 간섭은 unverified다. 변기는 [파우더룸](01-ground-rooms.md#powder-fixtures)과 함께 한 원형의 세 구성원이며 구역은 앞면 방향 깊이 × 폭으로 파우더 0.75 × 0.70, 샤워 욕실 0.75 × 0.65, 욕조 욕실 0.75 × 0.70 m여서 샤워 욕실 폭 0.65 m가 최악 경우다. 세면장·거울·수건걸이는 각각 한 원형의 구성원이며 구역별 W·D·H만 다르다.
