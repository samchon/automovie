# 2층 방의 가구·설비 배치

## 주침실 침대·협탁·서랍장 {#primary-furniture}
<!--
@evidence principles/core/common.md#scope-preservation 주침실 침대·협탁 둘·서랍장과 러그의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 침대·협탁 yaw −π/2, 서랍장 π/2, 침대 러그는 침대에서 유도한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 primary 가구 예약과 bed·nightstand·dresser·covering 모델이다. 그 위에서 이 H2가 주침실 침대·협탁 둘·서랍장과 러그의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 primary 가구 예약과 bed·nightstand·dresser·covering 모델이고, 이 H2는 침대·협탁 yaw −π/2, 서랍장 π/2, 침대 러그는 침대에서 유도한다.
@evidence principles/design/instances.md#instance-prototype-boundary 주침실 침대·협탁 둘·서랍장과 러그에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 주침실 침대·협탁 둘·서랍장과 러그의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 침대·협탁 yaw −π/2, 서랍장 π/2, 침대 러그는 침대에서 유도한다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 뒤 협탁과 wardrobe-door-wait의 0.05 m 틈이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidence upstream/design/instances.md#parent-revision-from-instance-work 세 침대에서 파생한 러그의 독립 covering 예약이 spaces 방 문서에 없어 reservation-fill의 일대일 대응을 위반한다. primary·bedroom-two·bedroom-three 공간 owner에 세 예약을 추가해야 한다.
@evidence spaces/rooms/primary.md#primary-furniture-use 주침실 예약의 기준을 primary-furniture의 주침실 침대·협탁 둘·서랍장과 러그에 소비한다.
@evidence models/13-bedrooms.md#headboard-bed 머리판 있는 침대의 기준을 primary-furniture의 주침실 침대·협탁 둘·서랍장과 러그에 소비한다.
@evidence models/13-bedrooms.md#nightstand-lamp 협탁과 등의 기준을 primary-furniture의 주침실 침대·협탁 둘·서랍장과 러그에 소비한다.
@evidence models/13-bedrooms.md#low-dresser 낮은 서랍장의 기준을 primary-furniture의 주침실 침대·협탁 둘·서랍장과 러그에 소비한다.
@evidence models/11-living.md#floor-covering 침대 밑 러그의 기준을 primary-furniture의 주침실 침대·협탁 둘·서랍장과 러그에 소비한다.
@evidence settings/10-house.md#primary-bedroom `primary-bedroom`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/primary.md#primary-plan `primary-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[주침실 예약](../spaces/rooms/primary.md#primary-furniture-use)의 `primary-bedroom-bed`는 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)이며 머리판을 +X 벽 쪽에 두어 yaw -π/2, `primary-bedroom-rear-nightstand`·`-front-nightstand`는 [협탁과 등](../models/13-bedrooms.md#nightstand-lamp) 한 원형의 두 구성원으로 yaw -π/2, `primary-bedroom-dresser`는 [낮은 서랍장](../models/13-bedrooms.md#low-dresser)으로 yaw π/2다. 위치는 [배치 규칙](00-placement-frame.md#placement-transform-rule)으로 예약에서 도출한다. 최악 경우는 뒤 협탁과 `primary-bedroom-wardrobe-door-wait` 사이 0.05 m 틈이며 [적합 검사](00-placement-frame.md#placement-fit-validity)가 판정한다.

[침대 밑 러그](../models/11-living.md#floor-covering)는 각 침대 yaw와 길이·폭보다 각 0.30 m 큰 외곽을 받되, 모델이 정한 침대 국소 발끝 방향 오프셋 0.07 m(주침실)·0.11 m(둘째 침실)·0.01 m(셋째 침실)을 적용해 세 구성원을 만든다. 각각 침대 id에서 `-bed`를 `-rug`로 바꾼 id를 쓴다. 바닥 0.008 m 층이며 원형은 가구 다리 발자국을 깔개 면에서 빼 물리 부피가 겹치지 않게 한다. 문 회전·다른 가구의 수평 중첩은 적합 검사에서 별도로 보고하고 현재 세 프레임은 unverified다.

두 협탁 id는 `primary-bedroom-rear-nightstand`와 `primary-bedroom-front-nightstand`다. 침대 밑 러그는 세 방의 covering 예약이 공간 owner에 추가되어야 실제 구성원으로 셀 수 있으며, 현재의 침대 예약만으로 이를 완료했다고 세지 않는다.

## 드레스룸 수납 {#wardrobe-storage}
<!--
@evidence principles/core/common.md#scope-preservation 드레스룸 옷걸이 구간과 선반의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 두 저장 예약 id에 별도 원형 하나씩 yaw 0으로 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 wardrobe-storage 예약과 두 wardrobe 모델이다. 그 위에서 이 H2가 드레스룸 옷걸이 구간과 선반의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 wardrobe-storage 예약과 두 wardrobe 모델이고, 이 H2는 두 저장 예약 id에 별도 원형 하나씩 yaw 0으로 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 드레스룸 옷걸이 구간과 선반에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 드레스룸 옷걸이 구간과 선반의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 두 저장 예약 id에 별도 원형 하나씩 yaw 0으로 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 primary-wardrobe-turning과 수납 몸체의 접촉이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work wardrobe-storage 예약과 두 wardrobe 모델을 실제 드레스룸 옷걸이 구간과 선반와 primary-wardrobe-turning과 수납 몸체의 접촉에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use 드레스룸 예약의 기준을 wardrobe-storage의 드레스룸 옷걸이 구간과 선반에 소비한다.
@evidence models/13-bedrooms.md#wardrobe-hanging 옷방 옷걸이 구간의 기준을 wardrobe-storage의 드레스룸 옷걸이 구간과 선반에 소비한다.
@evidence models/13-bedrooms.md#wardrobe-shelves 옷방 선반 구간의 기준을 wardrobe-storage의 드레스룸 옷걸이 구간과 선반에 소비한다.
@evidence settings/10-house.md#storage `storage`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan `primary-wardrobe-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[드레스룸 예약](../spaces/rooms/wardrobe.md#wardrobe-storage-use)의 `primary-wardrobe-hanging`과 `primary-wardrobe-shelves`는 각각 [옷방 옷걸이 구간](../models/13-bedrooms.md#wardrobe-hanging)과 [옷방 선반 구간](../models/13-bedrooms.md#wardrobe-shelves)이다. 두 원형은 방의 world XZ와 바닥 위 부재 높이가 이미 저장되어 있으므로 p=(0,3.06,0) m·yaw 0·scale 1이며 예약 중심 평행이동을 다시 하지 않는다. 최악 경우는 `primary-wardrobe-turning`에 몸체가 걸치지 않는지다.

## 두 자녀실의 같은 가구 집합 {#child-bedroom-furniture}
<!--
@evidence principles/core/common.md#scope-preservation 두 자녀실 침대·협탁·책상·의자·옷장의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 같은 원형을 공유하면서 둘째 책상 π/2·셋째 책상 π로 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 두 침실의 방 예약과 bedrooms 모델이다. 그 위에서 이 H2가 두 자녀실 침대·협탁·책상·의자·옷장의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 두 침실의 방 예약과 bedrooms 모델이고, 이 H2는 같은 원형을 공유하면서 둘째 책상 π/2·셋째 책상 π로 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 두 자녀실 침대·협탁·책상·의자·옷장에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 두 자녀실 침대·협탁·책상·의자·옷장의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 같은 원형을 공유하면서 둘째 책상 π/2·셋째 책상 π로 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 두 책상 방향에서 같은 원형의 외곽 적합이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 두 침실의 방 예약과 bedrooms 모델을 실제 두 자녀실 침대·협탁·책상·의자·옷장와 두 책상 방향에서 같은 원형의 외곽 적합에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 침실 둘의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 침실 셋의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence models/13-bedrooms.md#nightstand-lamp 협탁의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence models/13-bedrooms.md#child-desk 작은 책상의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence models/13-bedrooms.md#desk-chair 책상 의자의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence models/13-bedrooms.md#sliding-closet 미닫이 옷장의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence models/13-bedrooms.md#headboard-bed 머리판 있는 침대의 기준을 child-bedroom-furniture의 두 자녀실 침대·협탁·책상·의자·옷장에 소비한다.
@evidence settings/10-house.md#bedroom-three `bedroom-three`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/10-house.md#bedroom-two `bedroom-two`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-plan `bedroom-three-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-plan `bedroom-two-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[침실 둘](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use)과 [침실 셋](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use)은 싱글 침대, [협탁](../models/13-bedrooms.md#nightstand-lamp), [작은 책상](../models/13-bedrooms.md#child-desk), [책상 의자](../models/13-bedrooms.md#desk-chair), [미닫이 옷장](../models/13-bedrooms.md#sliding-closet)을 각각 한 원형씩 공유하고 방마다 한 구성원을 받는다. 협탁은 주침실 두 개와 합쳐 한 원형의 네 구성원이다. 침대는 두 방 모두 머리를 -Z에 두어 yaw 0, 협탁은 yaw 0이다. 책상은 침실 둘 yaw π/2, 침실 셋 yaw π이고 책상 의자는 desk-chair use 구역 중심에서 책상을 향해 침실 둘 yaw -π/2, 침실 셋 yaw 0이다. 붙박이장은 두 방 모두 yaw -π/2다. 싱글 침대가 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 크기 변형인지 별도 원형인지는 그 H2의 정의를 따른다. 책상 예약은 방향이 90° 다르므로 한 원형이 두 구역에 모두 들어가는지는 models 원형 치수로 판정한다. 관찰은 두 방의 같은 원형 구성원이 변환 외에 다르지 않은지다.

예약에서 읽는 개체 id는 `bedroom-two-bed`·`bedroom-two-nightstand`·`bedroom-two-desk`·`bedroom-two-closet`, 그리고 `bedroom-three-bed`·`bedroom-three-nightstand`·`bedroom-three-desk`·`bedroom-three-closet`이다. 책상 의자 둘은 각 `bedroom-two-desk-chair-use`·`bedroom-three-desk-chair-use`에서 `-use`를 뗀 id를 가진다. 싱글 침대는 위 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 W=1.15 m 매개변수 구성이므로 다른 원형을 만들지 않는다.

## 욕실 설비와 변기 세 구성원 {#bath-fixtures}
<!--
@evidence principles/core/common.md#scope-preservation 상층 두 욕실 설비·벽감 병·매트의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 세 변기를 한 원형으로 공유하고 샤워 벽감에는 병 세 개를 놓는다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 shower·tub 예약과 bathrooms 모델이다. 그 위에서 이 H2가 상층 두 욕실 설비·벽감 병·매트의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 shower·tub 예약과 bathrooms 모델이고, 이 H2는 세 변기를 한 원형으로 공유하고 샤워 벽감에는 병 세 개를 놓는다.
@evidence principles/design/instances.md#instance-prototype-boundary 상층 두 욕실 설비·벽감 병·매트에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 상층 두 욕실 설비·벽감 병·매트의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 세 변기를 한 원형으로 공유하고 샤워 벽감에는 병 세 개를 놓는다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 폭 0.65 m 샤워 욕실 변기와 벽감 병 간섭이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work shower·tub 예약과 bathrooms 모델을 실제 상층 두 욕실 설비·벽감 병·매트와 폭 0.65 m 샤워 욕실 변기와 벽감 병 간섭에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 욕실의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#sliding-shower-booth 미닫이 유리 샤워부스의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#shared-toilet 공용 변기의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#vanity-basin 세면장의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#towel-bar 수건걸이의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#bathtub 욕조 겸 샤워의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#wall-mirror 벽 거울의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#tub-curtain-rail 욕조 커튼 레일의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#shower-niche-bottles 샤워 벽감 병의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence models/14-bathrooms.md#bath-floor-mats 욕실 매트의 기준을 bath-fixtures의 상층 두 욕실 설비·벽감 병·매트에 소비한다.
@evidence settings/10-house.md#shower-bathroom `shower-bathroom`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/10-house.md#tub-bathroom `tub-bathroom`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/shower-bath.md#shower-bath-plan `shower-bath-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/tub-bath.md#tub-bath-plan `tub-bath-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[샤워 욕실](../spaces/rooms/shower-bath.md#shower-fixture-use)의 [미닫이 유리 샤워부스](../models/14-bathrooms.md#sliding-shower-booth)와 [공용 변기](../models/14-bathrooms.md#shared-toilet)는 yaw 0, [세면장](../models/14-bathrooms.md#vanity-basin)은 yaw -π/2, [수건걸이](../models/14-bathrooms.md#towel-bar)는 yaw π다. [욕조 욕실](../spaces/rooms/tub-bath.md#tub-fixture-use)의 세면장·공용 변기·[욕조 겸 샤워](../models/14-bathrooms.md#bathtub)·[벽 거울](../models/14-bathrooms.md#wall-mirror)은 yaw -π/2, 수건걸이는 yaw π/2다. [욕조 커튼 레일](../models/14-bathrooms.md#tub-curtain-rail)은 [욕조 앞쪽 물 쪽 0.10 m 띠](../spaces/rooms/tub-bath.md#tub-fixture-use)의 독립 구성원이며 원형의 국소 +Z 길이축을 세계 +Z의 욕조 길이축에 맞춰 yaw 0을 쓴다. 욕조 원형의 길이축은 국소 +X라 yaw -π/2이며 두 원형의 yaw 수치가 같지는 않다. [샤워 벽감 병](../models/14-bathrooms.md#shower-niche-bottles)은 벽감 선반을 host로 한 세 구성원, [욕실 매트](../models/14-bathrooms.md#bath-floor-mats)는 두 사용 바닥 각각의 중심에 한 구성원씩 둔다. 실제 벽감 절개와 배치 간섭은 unverified다. 변기는 [파우더룸](01-ground-rooms.md#powder-fixtures)과 함께 한 원형의 세 구성원이며 구역은 앞면 방향 깊이 × 폭으로 파우더 0.75 × 0.70, 샤워 욕실 0.75 × 0.65, 욕조 욕실 0.75 × 0.70 m여서 샤워 욕실 폭 0.65 m가 최악 경우다. 세면장·거울·수건걸이는 각각 한 원형의 구성원이며 구역별 W·D·H만 다르다.

샤워 욕실의 `shower-bathroom-booth` 한 개가 [샤워부스 원형](../models/14-bathrooms.md#sliding-shower-booth)의 수전·헤드까지 포함한다. `shower-bathroom-faucet`·`shower-bathroom-head`는 그 두 부재가 채우는 예약이며 독립 instance를 만들지 않는다. 나머지 fixture id는 `shower-bathroom-toilet`·`shower-bathroom-vanity`·`shower-bathroom-towel`·`shower-bathroom-mirror`, `tub-bathroom-vanity`·`tub-bathroom-toilet`·`tub-bathroom-tub`·`tub-bathroom-curtain-rail`·`tub-bathroom-towel`·`tub-bathroom-mirror`다.
