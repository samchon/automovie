# 1층 방과 실내 공통 커튼의 가구·설비 배치

## 식탁과 여섯 의자 {#dining-table-chairs}
<!--
@evidence principles/core/common.md#scope-preservation 식탁 하나와 여섯 의자의 배치의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 식탁 yaw 0, 여섯 seat-use id별 식탁 향하는 yaw를 정한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 common 식사·seat 예약과 두 식탁 모델이다. 그 위에서 이 H2가 식탁 하나와 여섯 의자의 배치의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 common 식사·seat 예약과 두 식탁 모델이고, 이 H2는 식탁 yaw 0, 여섯 seat-use id별 식탁 향하는 yaw를 정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 식탁 하나와 여섯 의자의 배치에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 식탁 하나와 여섯 의자의 배치의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 식탁 yaw 0, 여섯 seat-use id별 식탁 향하는 yaw를 정한다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 right 의자와 X=2.10 main route의 접촉이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work common 식사·seat 예약과 두 식탁 모델을 실제 식탁 하나와 여섯 의자의 배치와 right 의자와 X=2.10 main route의 접촉에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/common.md#common-dining-reservation 식사 예약의 기준을 dining-table-chairs의 식탁 하나와 여섯 의자의 배치에 소비한다.
@evidence models/10-kitchen-dining.md#dining-table 여섯 좌석 식탁의 기준을 dining-table-chairs의 식탁 하나와 여섯 의자의 배치에 소비한다.
@evidence models/10-kitchen-dining.md#dining-chair 식탁 의자의 기준을 dining-table-chairs의 식탁 하나와 여섯 의자의 배치에 소비한다.
-->

[식사 예약](../spaces/rooms/common.md#common-dining-reservation)의 `common-dining-table`에 [여섯 좌석 식탁](../models/10-kitchen-dining.md#dining-table) 원형 하나를 yaw 0(긴 변이 X)으로 놓는다. 여섯 의자는 [식탁 의자](../models/10-kitchen-dining.md#dining-chair) 한 원형의 구성원이며 이 집합의 예외 규칙으로 몸체 대신 각 seat use 구역 중심에 선다: `common-dining-seat-back-1`·`-back-2`는 yaw 0, `-front-1`·`-front-2`는 yaw π, `-left`는 yaw π/2, `-right`는 yaw -π/2로 모두 식탁을 향한다. 위치는 [배치 규칙](00-placement-frame.md#placement-transform-rule)으로 예약에서 도출하며 이 문서에 좌표 표를 두지 않는다. 의자 몸체가 use 구역에 들어가는지는 models 원형 치수로 판정한다. 최악 경우는 `-right` 의자와 `common-main-route-right`(X 하한 2.10 m)의 비접촉이다. source owner는 src/instances/ 1층 모듈이며 [적합 검사](00-placement-frame.md#placement-fit-validity)와 평면 관찰이 여섯 의자·식탁·통로를 함께 본다.

## 섬 스툴 세 개 {#island-stools}
<!--
@evidence principles/core/common.md#scope-preservation 섬 앞 스툴 세 개의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion stool-1·2·3을 Z 오름차순 예약 중심에 yaw −π/2로 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 common-island-stool use 예약과 스툴 원형이다. 그 위에서 이 H2가 섬 앞 스툴 세 개의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 common-island-stool use 예약과 스툴 원형이고, 이 H2는 stool-1·2·3을 Z 오름차순 예약 중심에 yaw −π/2로 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 섬 앞 스툴 세 개에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 섬 앞 스툴 세 개의 id와 위치는 본문의 한 입력 규칙에서 산출한다. stool-1·2·3을 Z 오름차순 예약 중심에 yaw −π/2로 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 스툴 몸체의 섬 +X 경계 침범이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work common-island-stool use 예약과 스툴 원형을 실제 섬 앞 스툴 세 개와 스툴 몸체의 섬 +X 경계 침범에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/common.md#common-island-reservation 섬 예약의 기준을 island-stools의 섬 앞 스툴 세 개에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-island-stool 섬 스툴의 기준을 island-stools의 섬 앞 스툴 세 개에 소비한다.
-->

[섬 예약](../spaces/rooms/common.md#common-island-reservation)의 `common-island-stool-1`·`-2`·`-3` use 구역 중심에 [섬 스툴](../models/10-kitchen-dining.md#kitchen-island-stool) 한 원형의 세 구성원을 yaw -π/2(섬을 향함)로 놓는다. 구성원 번호는 예약 번호를 그대로 쓰며 Z가 작은 쪽이 1이다. 최악 경우는 스툴 몸체가 섬 본체 `common-island`의 +X 경계를 넘는지이며 적합 검사가 판정한다.

## 주방 설비와 붙박이 몸체 {#kitchen-fixtures}
<!--
@evidence principles/core/common.md#scope-preservation 주방 벽 가전과 섬·장 몸체의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion fridge·range·microwave는 yaw π/2, island·dishwasher는 −π/2로 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 주방 벽·섬 예약과 가전·장 모델이다. 그 위에서 이 H2가 주방 벽 가전과 섬·장 몸체의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 주방 벽·섬 예약과 가전·장 모델이고, 이 H2는 fridge·range·microwave는 yaw π/2, island·dishwasher는 −π/2로 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 주방 벽 가전과 섬·장 몸체에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 주방 벽 가전과 섬·장 몸체의 id와 위치는 본문의 한 입력 규칙에서 산출한다. fridge·range·microwave는 yaw π/2, island·dishwasher는 −π/2로 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 dishwasher swing과 섬의 간섭이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 주방 벽·섬 예약과 가전·장 모델을 실제 주방 벽 가전과 섬·장 몸체와 dishwasher swing과 섬의 간섭에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/common.md#common-kitchen-wall-reservation 주방 벽 예약의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-refrigerator 냉장고의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-range 레인지의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-microwave 전자레인지의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-island 싱크 섬의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-dishwasher 식기세척기의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-base-run 하부장 띠의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/10-kitchen-dining.md#kitchen-wall-cabinet 상부장의 기준을 kitchen-fixtures의 주방 벽 가전과 섬·장 몸체에 소비한다.
@evidence models/18-house-props.md#kitchen-food-utensils `kitchen-food-utensils`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence settings/10-house.md#kitchen-equipment `kitchen-equipment`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
-->

[주방 벽 예약](../spaces/rooms/common.md#common-kitchen-wall-reservation)과 섬 예약의 몸체는 각각 단일 구성원이다. `common-fridge`는 [냉장고](../models/10-kitchen-dining.md#kitchen-refrigerator), `common-range`는 [레인지](../models/10-kitchen-dining.md#kitchen-range), `common-microwave`는 [전자레인지](../models/10-kitchen-dining.md#kitchen-microwave)이며 셋 다 yaw π/2다. `common-island`는 [싱크 섬](../models/10-kitchen-dining.md#kitchen-island), `common-dishwasher`는 [식기세척기](../models/10-kitchen-dining.md#kitchen-dishwasher)이며 yaw -π/2다. `common-island-sink`는 섬 원형 안의 부재여서 별도 구성원을 만들지 않는다. 하부장 세 구간은 [하부장 띠](../models/10-kitchen-dining.md#kitchen-base-run), 상부장 두 구간은 [상부장](../models/10-kitchen-dining.md#kitchen-wall-cabinet)의 구성원이며 뒤 띠는 yaw 0, 왼쪽 띠는 yaw π/2다. L자 모서리는 뒤 띠에만 속한다는 방 예약을 따른다. 최악 경우는 식기세척기 문이 열린 `common-dishwasher-swing`이 섬 밖으로만 나가는지다.

하부장 세 구성원 id는 `common-kitchen-back-base`·`common-kitchen-left-base-rear`·`common-kitchen-left-base-front`, 상부장 둘은 `common-kitchen-left-wall-cabinet`·`common-kitchen-back-wall-cabinet`다. `common-island-sink` fixture 예약은 `common-island` 원형의 싱크 부재로 충전하므로 예약 하나를 비워 둔 것이 아니며 싱크 원형을 중복 배치하지 않는다.

[조리 소품 원형](../models/18-house-props.md#kitchen-food-utensils)의 도마·도구통·식료품 병은 기존 주방 상판에 얹는 구성원이다. 도마 `common-island-board`는 섬 상판 Y=0.91 m의 싱크 절개 바깥 X=-3.30, Z=-7.05 m에 놓고, 도구통 `common-island-utensils`는 같은 상판 X=-3.30, Z=-6.65 m에 놓는다. 두 바닥 윤곽은 0.075 m 이상 떨어지고 상판 앞·뒤 변에서도 각각 0.10 m 이상 안쪽이다. 작은 병 `common-kitchen-bottle`은 `common-kitchen-back-base`의 완성 상판에서 레인지·전자레인지 수직 투영을 뺀 연결 구간 가운데에 놓는다. [식탁](#dining-table-chairs) 중앙에는 `common-dining-fruit-bowl`을 yaw 0으로 놓아 모델의 과일 다섯이 그릇 안에 유지되게 한다. 조리면·싱크·식탁 좌석 use 구역은 물건의 몸체가 아니라 손 접근까지 평면에서 확인하며 실제 접촉은 unverified다.

## 가족실 소파와 낮은 탁자 {#family-seating}
<!--
@evidence principles/core/common.md#scope-preservation 가족실 소파와 낮은 탁자의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 소파 yaw π, 탁자는 L=1.10·W=0.55 m와 yaw 0으로 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 common-family 예약과 sofa·low-table 원형이다. 그 위에서 이 H2가 가족실 소파와 낮은 탁자의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 common-family 예약과 sofa·low-table 원형이고, 이 H2는 소파 yaw π, 탁자는 L=1.10·W=0.55 m와 yaw 0으로 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 가족실 소파와 낮은 탁자에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 가족실 소파와 낮은 탁자의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 소파 yaw π, 탁자는 L=1.10·W=0.55 m와 yaw 0으로 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 소파와 탁자 사이 통행·사용 여유이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work common-family 예약과 sofa·low-table 원형을 실제 가족실 소파와 낮은 탁자와 소파와 탁자 사이 통행·사용 여유에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/common.md#common-family-reservation 가족실 예약의 기준을 family-seating의 가족실 소파와 낮은 탁자에 소비한다.
@evidence models/11-living.md#fabric-sofa 패브릭 소파의 기준을 family-seating의 가족실 소파와 낮은 탁자에 소비한다.
@evidence models/11-living.md#low-table 낮은 목재 테이블의 기준을 family-seating의 가족실 소파와 낮은 탁자에 소비한다.
@evidence models/19-room-accents.md#sofa-throws `sofa-throws`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence settings/10-house.md#common-room `common-room`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/common.md#common-clear-routes `common-clear-routes`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[가족실 예약](../spaces/rooms/common.md#common-family-reservation)의 `common-family-sofa`는 거실 소파와 같은 2.10 × 0.95 m 예약이므로 [패브릭 소파](../models/11-living.md#fabric-sofa)의 둘째 구성원으로 두고 yaw π로 앞 칸막이에 등을 댄다. `common-family-table`은 [낮은 목재 테이블](../models/11-living.md#low-table) 매개변수 원형의 가족실 크기 쌍 L = 1.10 m, W = 0.55 m 구성원으로 yaw 0에 놓는다.

`common-family-rug`는 같은 [얇은 바닥 깔개](../models/11-living.md#floor-covering)의 가족실 크기 구성원으로 covering 예약 중심에 yaw 0으로 놓는다. 소파 앞다리와는 깔개 두께만 겹치고 식탁 앞 사용 공간을 덮더라도 사람 통로로 세지 않는다.

[소파 보조 쿠션·담요](../models/19-room-accents.md#sofa-throws)는 `common-family-sofa`의 국소 좌면·팔걸이를 host로 하여 `common-family-sofa-accents` 한 묶음으로 결속한다. [낮은 탁자 소품](../models/19-room-accents.md#living-tabletop-props)의 가족실 구성원 `common-family-tabletop`은 `common-family-table` 상판을 host로 쓰고 책 둘·쟁반·꽃병을 모델의 국소 배열 그대로 둔다. 두 묶음은 새로운 바닥 점유를 만들지 않고 소파·탁자 yaw를 함께 받는다. 가족실 [매단 등](00-placement-frame.md#lighting-fixture-members)의 식탁 쪽 깊이와 소품 최고점이 겹치지 않는지 측면에서 본다.

## 거실 좌석·서가·러그 {#living-furniture}
<!--
@evidence principles/core/common.md#scope-preservation 거실 소파·탁자·의자·책장·러그의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 다섯 id별 yaw를 정하고 소파 다리만 얇은 러그 중첩을 허용한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 living 방 예약과 네 가구·깔개 원형이다. 그 위에서 이 H2가 거실 소파·탁자·의자·책장·러그의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 living 방 예약과 네 가구·깔개 원형이고, 이 H2는 다섯 id별 yaw를 정하고 소파 다리만 얇은 러그 중첩을 허용한다.
@evidence principles/design/instances.md#instance-prototype-boundary 거실 소파·탁자·의자·책장·러그에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 거실 소파·탁자·의자·책장·러그의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 다섯 id별 yaw를 정하고 소파 다리만 얇은 러그 중첩을 허용한다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 living-sofa-use의 소파·탁자 사이 빈 공간이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work living 방 예약과 네 가구·깔개 원형을 실제 거실 소파·탁자·의자·책장·러그와 living-sofa-use의 소파·탁자 사이 빈 공간에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/living.md#living-furniture-use 거실 예약의 기준을 living-furniture의 거실 소파·탁자·의자·책장·러그에 소비한다.
@evidence models/11-living.md#fabric-sofa 패브릭 소파의 기준을 living-furniture의 거실 소파·탁자·의자·책장·러그에 소비한다.
@evidence models/11-living.md#low-table 낮은 목재 테이블의 기준을 living-furniture의 거실 소파·탁자·의자·책장·러그에 소비한다.
@evidence models/11-living.md#reading-armchair 독서 안락의자의 기준을 living-furniture의 거실 소파·탁자·의자·책장·러그에 소비한다.
@evidence models/11-living.md#dark-bookcase 짙은 책장의 기준을 living-furniture의 거실 소파·탁자·의자·책장·러그에 소비한다.
@evidence models/11-living.md#floor-covering 얇은 바닥 깔개의 기준을 living-furniture의 거실 소파·탁자·의자·책장·러그에 소비한다.
@evidence models/11-living.md#fireplace-insert-mantel `fireplace-insert-mantel`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence models/19-room-accents.md#living-tabletop-props `living-tabletop-props`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence models/19-room-accents.md#wall-art-indoor-plant `wall-art-indoor-plant`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence settings/10-house.md#living `living`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/living.md#living-plan `living-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/living.md#living-through-route `living-through-route`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[거실 예약](../spaces/rooms/living.md#living-furniture-use)에 따라 `living-sofa`는 [패브릭 소파](../models/11-living.md#fabric-sofa)의 첫 구성원으로 yaw -π/2, `living-table`은 [낮은 목재 테이블](../models/11-living.md#low-table)로 yaw -π/2, `living-reading-chair`는 [독서 안락의자](../models/11-living.md#reading-armchair)로 yaw 0, `living-bookcase`는 [짙은 책장](../models/11-living.md#dark-bookcase)으로 yaw -π/2, covering `living-rug`는 [얇은 바닥 깔개](../models/11-living.md#floor-covering)로 yaw 0이다. 소파 앞다리는 러그 위에 서며 러그 두께 안의 겹침만 허용한다. 최악 경우는 `living-sofa-use`가 소파와 탁자 사이에서 비어 있는지다.

`living-sofa-accents`는 [보조 쿠션 둘과 접힌 담요](../models/19-room-accents.md#sofa-throws)를 `living-sofa`의 좌면·팔걸이 국소 접점에 결속한다. `living-tabletop`은 [책 둘·쟁반·꽃병](../models/19-room-accents.md#living-tabletop-props)을 `living-table` 상면에 놓고 host yaw -π/2를 따른다. [검은 화구와 목재 선반](../models/11-living.md#fireplace-insert-mantel)의 `living-fireplace-insert`는 [왼쪽 외벽의 기존 벽난로 자리](../spaces/envelope/left.md#chimney-roof-interface)에 p=(-4.95,0,-2.20) m·yaw π/2·scale 1로 놓는다. 국소 앞면 Z=0이 벽돌의 거실 쪽 X=-4.95 m에 닿고 선반 국소 Z=[−0.55,0] m가 벽돌 위에 놓이며, 벽돌·굴뚝 몸체를 다시 만들지 않는다. [벽 액자·작은 식물](../models/19-room-accents.md#wall-art-indoor-plant) 중 큰 액자 하나는 소파 뒤 닫힌 벽에서 창·문·벽난로 개구부를 뺀 가장 긴 연결 띠의 가운데 Y=1.55 m에, 작은 식물 하나는 `living-bookcase`의 맨 위 열린 선반 가운데에 둔다. 두 구성원은 `living-art`·`living-bookcase-plant`이며 액자는 기존 벽 접점 법선, 식물은 선반 상면을 원점으로 받는다. 실제 닫힌 벽 띠·천장과의 간섭은 unverified다.

## 여덟 창의 실내 커튼 {#window-curtain-members}
<!--
@evidence principles/core/common.md#scope-preservation 거실·가족실·주침실·두 작은 침실의 커튼 fixture 예약 여덟 개를 하나도 남기지 않고 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 여덟 instance id와 동일 커튼 원형, 창 안쪽 법선 yaw, 원형 W·H 및 아랫단 인자, 가장 좁은 창의 비간섭 검사를 정한다.
@evidence principles/core/common.md#declared-basis 여덟 예약은 다섯 방 owner와 selected-window-curtain-strips에서, 봉·천 원점과 인자는 primary-window-curtains에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방의 fixture 띠와 커튼 원형에는 없는 여덟 id의 membership과 입면별 yaw·검토 표본을 결정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 여덟 구성원은 primary-window-curtains 원형 하나의 선언된 폭·높이만 바꾸며 천 패널이나 봉을 새로 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority fixture 예약 id를 instance id로 쓰고 창 원점·실내 법선에서 변환하므로 방 순회 순서에 좌우되지 않는다.
@evidence principles/design/instances.md#instance-verification-address living-front와 primary-rear의 법선, 폭이 좁은 living-left의 창대 간섭, 여덟 fixture 예약 census가 반증 주소다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 다섯 방의 여덟 fixture 예약과 모델의 하나의 커튼 원형·0.12 m 안쪽 점유를 대조했고 배치 위해 부모 값을 바꿀 필요가 없다.
@evidence models/13-bedrooms.md#primary-window-curtains 봉·천·원점을 공유하는 여덟 구성원에 창별 W·H와 아랫단만 넘긴다.
@evidence spaces/06-openings.md#selected-window-curtain-strips 여섯 공용·작은 침실 창의 점유 띠가 instance 변환의 안쪽 법선과 여유를 준다.
@evidence spaces/rooms/living.md#living-furniture-use living-front와 living-left 두 fixture 예약을 채운다.
@evidence spaces/rooms/common.md#common-room-plan family-rear와 family-right 두 fixture 예약을 채운다.
@evidence spaces/rooms/primary.md#primary-furniture-use primary-rear와 primary-left 두 fixture 예약을 채운다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 둘째 침실 앞창 fixture 하나를 채운다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 셋째 침실 앞창 fixture 하나를 채운다.
-->

[커튼 원형](../models/13-bedrooms.md#primary-window-curtains) 하나의 여덟 구성원은 1층 `living-front-curtain`·`living-left-curtain`·`family-rear-curtain`·`family-right-curtain`과 2층 `primary-rear-curtain`·`primary-left-curtain`·`bedroom-two-front-curtain`·`bedroom-three-front-curtain`이다. [거실](../spaces/rooms/living.md#living-furniture-use)·[공용부](../spaces/rooms/common.md#common-room-plan)·[주침실](../spaces/rooms/primary.md#primary-furniture-use)·[둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use)·[셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use)의 fixture 예약과 [여덟 창 점유 띠](../spaces/06-openings.md#selected-window-curtain-strips)가 유일한 구성원 입력이다. 각 instance id는 예약 id이고 p는 창 원형의 안쪽 왼쪽 아래 원점, yaw는 해당 창의 실내 방향 법선이며 scale 1이다. W·H와 바닥 위 아랫단은 커튼 원형에 선언된 각 창 값을 그대로 받는다. 커튼의 봉·받침·접힌 천은 원형이 만들고 창틀·유리·벽은 복제하지 않는다. 관찰은 왼쪽 앞 `living-front-curtain`과 후면 `primary-rear-curtain`의 방향, 가장 좁은 `living-left-curtain`의 창대 및 손잡이 비간섭, 여덟 fixture 예약의 정확한 충전이다.

## 현관 매트 {#entry-mat}
<!--
@evidence principles/core/common.md#scope-preservation 현관 매트 한 장의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion entry-mat covering을 yaw 0에 두고 위에 다른 개체를 놓지 않는다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 entry 방의 covering 예약과 바닥 깔개 원형이다. 그 위에서 이 H2가 현관 매트 한 장의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 entry 방의 covering 예약과 바닥 깔개 원형이고, 이 H2는 entry-mat covering을 yaw 0에 두고 위에 다른 개체를 놓지 않는다.
@evidence principles/design/instances.md#instance-prototype-boundary 현관 매트 한 장에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 현관 매트 한 장의 id와 위치는 본문의 한 입력 규칙에서 산출한다. entry-mat covering을 yaw 0에 두고 위에 다른 개체를 놓지 않는다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 현관문 대기 구역과 매트의 중첩이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work entry 방의 covering 예약과 바닥 깔개 원형을 실제 현관 매트 한 장와 현관문 대기 구역과 매트의 중첩에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/entry.md#entry-use-routes 현관 예약의 기준을 entry-mat의 현관 매트 한 장에 소비한다.
@evidence models/11-living.md#floor-covering 얇은 바닥 깔개의 기준을 entry-mat의 현관 매트 한 장에 소비한다.
@evidence settings/10-house.md#entry `entry`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/entry.md#entry-coat-storage `entry-coat-storage`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/entry.md#entry-plan `entry-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[현관 예약](../spaces/rooms/entry.md#entry-use-routes)의 covering `entry-mat`에 [얇은 바닥 깔개](../models/11-living.md#floor-covering)의 매트 매개변수 L=0.90 m·W=0.65 m·T=0.006 m 구성원을 yaw 0으로 놓는다. 매트 위에는 아무 개체도 서지 않는다.

## 파우더룸 설비 {#powder-fixtures}
<!--
@evidence principles/core/common.md#scope-preservation 파우더룸 변기·세면장·거울·수건걸이의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 변기 yaw −π/2, 나머지 벽 설비 yaw π를 정한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 powder 구역과 bathroom 모델의 W·D·H이다. 그 위에서 이 H2가 파우더룸 변기·세면장·거울·수건걸이의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 powder 구역과 bathroom 모델의 W·D·H이고, 이 H2는 변기 yaw −π/2, 나머지 벽 설비 yaw π를 정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 파우더룸 변기·세면장·거울·수건걸이에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 파우더룸 변기·세면장·거울·수건걸이의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 변기 yaw −π/2, 나머지 벽 설비 yaw π를 정한다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 powder-door-waiting과 설비 몸체의 접촉이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work powder 구역과 bathroom 모델의 W·D·H을 실제 파우더룸 변기·세면장·거울·수건걸이와 powder-door-waiting과 설비 몸체의 접촉에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/powder.md#powder-fixture-use 파우더룸 예약의 기준을 powder-fixtures의 파우더룸 변기·세면장·거울·수건걸이에 소비한다.
@evidence models/14-bathrooms.md#shared-toilet 공용 변기의 기준을 powder-fixtures의 파우더룸 변기·세면장·거울·수건걸이에 소비한다.
@evidence models/14-bathrooms.md#vanity-basin 세면장의 기준을 powder-fixtures의 파우더룸 변기·세면장·거울·수건걸이에 소비한다.
@evidence models/14-bathrooms.md#wall-mirror 벽 거울의 기준을 powder-fixtures의 파우더룸 변기·세면장·거울·수건걸이에 소비한다.
@evidence models/14-bathrooms.md#towel-bar 수건걸이의 기준을 powder-fixtures의 파우더룸 변기·세면장·거울·수건걸이에 소비한다.
@evidence settings/10-house.md#powder `powder`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/powder.md#powder-plan `powder-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[파우더룸 예약](../spaces/rooms/powder.md#powder-fixture-use)의 `powder-toilet`은 [공용 변기](../models/14-bathrooms.md#shared-toilet)로 yaw -π/2, `powder-basin`은 [세면장](../models/14-bathrooms.md#vanity-basin), `powder-mirror`는 [벽 거울](../models/14-bathrooms.md#wall-mirror), `powder-towel`은 [수건걸이](../models/14-bathrooms.md#towel-bar)로 yaw π이며 세면장·거울·수건걸이의 W·D·H는 그 H2가 이 구역에 준 값이다. 변기는 [위층 욕실](02-upper-rooms.md#bath-fixtures)과 함께 한 원형의 세 구성원이다. 최악 경우는 `powder-door-waiting`에 몸체가 걸치지 않는지다.

## 세탁실 기기와 머드룸 벤치 {#laundry-fixtures}
<!--
@evidence principles/core/common.md#scope-preservation 세탁기·건조기·상판·상부장·벤치·걸이의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 동쪽 기기 yaw −π/2와 반대쪽 벤치·걸이 yaw π/2를 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 laundry 예약과 service-room 모델이다. 그 위에서 이 H2가 세탁기·건조기·상판·상부장·벤치·걸이의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 laundry 예약과 service-room 모델이고, 이 H2는 동쪽 기기 yaw −π/2와 반대쪽 벤치·걸이 yaw π/2를 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 세탁기·건조기·상판·상부장·벤치·걸이에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 세탁기·건조기·상판·상부장·벤치·걸이의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 동쪽 기기 yaw −π/2와 반대쪽 벤치·걸이 yaw π/2를 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 laundry-upper-waiting에 기기 몸체 침범이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work laundry 예약과 service-room 모델을 실제 세탁기·건조기·상판·상부장·벤치·걸이와 laundry-upper-waiting에 기기 몸체 침범에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/laundry.md#laundry-equipment-use 세탁실 예약의 기준을 laundry-fixtures의 세탁기·건조기·상판·상부장·벤치·걸이에 소비한다.
@evidence models/12-service-rooms.md#laundry-machine 드럼 세탁기와 건조기의 기준을 laundry-fixtures의 세탁기·건조기·상판·상부장·벤치·걸이에 소비한다.
@evidence models/12-service-rooms.md#laundry-folding-top 접는 상판의 기준을 laundry-fixtures의 세탁기·건조기·상판·상부장·벤치·걸이에 소비한다.
@evidence models/12-service-rooms.md#laundry-upper-storage 상부 수납의 기준을 laundry-fixtures의 세탁기·건조기·상판·상부장·벤치·걸이에 소비한다.
@evidence models/12-service-rooms.md#mudroom-bench 신발 벤치의 기준을 laundry-fixtures의 세탁기·건조기·상판·상부장·벤치·걸이에 소비한다.
@evidence models/12-service-rooms.md#mudroom-coat-hooks 외투 걸이의 기준을 laundry-fixtures의 세탁기·건조기·상판·상부장·벤치·걸이에 소비한다.
@evidence settings/10-house.md#laundry-mudroom `laundry-mudroom`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/laundry.md#laundry-plan `laundry-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/laundry.md#laundry-through-route `laundry-through-route`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[세탁실 예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 `laundry-washer`·`laundry-dryer`는 [드럼 세탁기와 건조기](../models/12-service-rooms.md#laundry-machine)로 yaw -π/2다. `laundry-folding-top`은 [접는 상판](../models/12-service-rooms.md#laundry-folding-top), `laundry-upper-storage`는 [상부 수납](../models/12-service-rooms.md#laundry-upper-storage)이며 두 원형은 동쪽 벽의 world XZ와 예약 높이로 미리 변환되어 있다. 따라서 이 두 instance는 p=(0,층 바닥 Y,0) m·yaw 0·scale 1이며 -π/2를 두 번째로 적용하지 않는다. `laundry-shoe-bench`는 [신발 벤치](../models/12-service-rooms.md#mudroom-bench)로 yaw π/2다. `laundry-coat-hooks`는 [외투 걸이](../models/12-service-rooms.md#mudroom-coat-hooks)이며 서쪽 벽의 world XZ와 걸이 높이가 원형에 이미 있으므로 p=(0,층 바닥 Y,0) m·yaw 0·scale 1이다. 세탁기와 건조기가 한 원형의 두 구성원인지는 그 models H2의 구분을 따른다. 최악 경우는 `laundry-upper-waiting`에 기기 몸체가 걸치지 않는지다.

## 팬트리 L형 선반 {#pantry-shelves}
<!--
@evidence principles/core/common.md#scope-preservation L 선반 한 개와 다섯 층 용기 70개의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 두 선반 예약을 한 원형으로 채우고 각 층에 병 5·상자 6·바구니 3개를 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 pantry 두 선반 예약과 L 원형·식품 용기 원형이다. 그 위에서 이 H2가 L 선반 한 개와 다섯 층 용기 70개의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 pantry 두 선반 예약과 L 원형·식품 용기 원형이고, 이 H2는 두 선반 예약을 한 원형으로 채우고 각 층에 병 5·상자 6·바구니 3개를 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary L 선반 한 개와 다섯 층 용기 70개에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority L 선반 한 개와 다섯 층 용기 70개의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 두 선반 예약을 한 원형으로 채우고 각 층에 병 5·상자 6·바구니 3개를 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 pantry-turning에 선반이 걸치거나 마지막 바구니가 끝을 넘음이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work pantry 두 선반 예약과 L 원형·식품 용기 원형을 실제 L 선반 한 개와 다섯 층 용기 70개와 pantry-turning에 선반이 걸치거나 마지막 바구니가 끝을 넘음에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence contracts/reservation-fill.md#reservation-fill pantry-back-shelf와 pantry-right-shelf 두 예약을 한 L 원형이 합집합으로 채우는 유일한 예외를 이름으로 선언한다.
@evidence spaces/rooms/pantry.md#pantry-storage-use 팬트리 예약의 기준을 pantry-shelves의 L 선반 한 개와 다섯 층 용기 70개에 소비한다.
@evidence models/12-service-rooms.md#pantry-l-shelf L형 선반의 기준을 pantry-shelves의 L 선반 한 개와 다섯 층 용기 70개에 소비한다.
@evidence models/12-service-rooms.md#pantry-containers 식품 용기의 기준을 pantry-shelves의 L 선반 한 개와 다섯 층 용기 70개에 소비한다.
@evidence settings/10-house.md#pantry `pantry`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/10-house.md#service-band `service-band`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/pantry.md#pantry-plan `pantry-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/pantry.md#pantry-use-route `pantry-use-route`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/service.md#service-access-plan `service-access-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[팬트리 예약](../spaces/rooms/pantry.md#pantry-storage-use)의 `pantry-back-shelf`와 `pantry-right-shelf`는 한 [L형 선반](../models/12-service-rooms.md#pantry-l-shelf)의 두 띠이므로 구성원은 하나(`pantry-l-shelf`)다. 두 띠의 world XZ와 다섯 단의 바닥 위 높이가 원형에 이미 있으므로 instance는 p=(0,층 바닥 Y,0) m·yaw 0·scale 1이다. 합집합 경계 상자의 중심으로 다시 평행이동하지 않는다. 이 구성원은 두 예약 id를 모두 채우는 것으로 [구성원 규칙](00-placement-frame.md#reservation-derived-membership)의 예외다. 몸체는 두 띠 밖, 특히 `pantry-turning`에 걸치지 않아야 한다. [식품 용기](../models/12-service-rooms.md#pantry-containers)는 이 선반에 놓이는 별도 구성원이다. 다섯 선반 각각 뒤쪽 띠 길이 2.28 m 안에는 폭 0.12 m 병 다섯과 폭 0.18 m 상자 여섯을 왼쪽에서 병 다섯→상자 여섯 순서로, 사이 0.02 m 간격으로 놓는다. 가로 합 5 × 0.12 + 6 × 0.18 + 10 × 0.02 = 1.88 m이므로 양끝 0.20 m씩 남는다. 오른쪽 띠는 코너 0.30 m를 비운 잔여 길이 1.05 m에 폭 0.30 m 바구니 셋을 0.03 m 간격으로 놓아 3 × 0.30 + 2 × 0.03 = 0.96 m, 양끝 0.045 m를 남긴다. 따라서 다섯 층 × (5 + 6 + 3) = 70개의 용기 구성원이 생긴다. 각 원점 Y는 해당 선반 상면, 뒤판·앞끝은 방 owner의 선반 끝에서 0.02 m 이상 안쪽이다. 용기 count와 배치만 이 instances H2가 결정하며 부피·면 id는 models가 결정한다.

## 차고 선반과 작업대 {#garage-storage}
<!--
@evidence principles/core/common.md#scope-preservation 빈 차고의 선반·작업대·공구판의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 세 가구를 yaw 0으로 두고 자동차 instance는 만들지 않는다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 garage 저장 예약과 세 service-room 원형이다. 그 위에서 이 H2가 빈 차고의 선반·작업대·공구판의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 garage 저장 예약과 세 service-room 원형이고, 이 H2는 세 가구를 yaw 0으로 두고 자동차 instance는 만들지 않는다.
@evidence principles/design/instances.md#instance-prototype-boundary 빈 차고의 선반·작업대·공구판에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 빈 차고의 선반·작업대·공구판의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 세 가구를 yaw 0으로 두고 자동차 instance는 만들지 않는다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 garage-shelf-use·garage-workbench-use의 비움이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work garage 저장 예약과 세 service-room 원형을 실제 빈 차고의 선반·작업대·공구판와 garage-shelf-use·garage-workbench-use의 비움에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/rooms/garage-interior.md#garage-storage-use 차고 예약의 기준을 garage-storage의 빈 차고의 선반·작업대·공구판에 소비한다.
@evidence models/12-service-rooms.md#garage-shelving 금속 선반의 기준을 garage-storage의 빈 차고의 선반·작업대·공구판에 소비한다.
@evidence models/12-service-rooms.md#garage-workbench 작업대의 기준을 garage-storage의 빈 차고의 선반·작업대·공구판에 소비한다.
@evidence models/12-service-rooms.md#garage-tool-board 공구판의 기준을 garage-storage의 빈 차고의 선반·작업대·공구판에 소비한다.
@evidence settings/10-house.md#garage `garage`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/garage-interior.md#garage-interior-plan `garage-interior-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/garage-interior.md#garage-use-routes `garage-use-routes`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[차고 예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 `garage-shelf`는 [금속 선반](../models/12-service-rooms.md#garage-shelving), `garage-workbench`는 [작업대](../models/12-service-rooms.md#garage-workbench), `garage-tool-board`는 [공구판](../models/12-service-rooms.md#garage-tool-board)이며 모두 yaw 0이다. 차고 바닥이 1층보다 낮으므로 Y는 예약 하한 그대로 쓴다. 자동차는 설정상 만들지 않는다. 최악 경우는 `garage-shelf-use`·`garage-workbench-use`가 비어 있는지다.

[차고문 원형](../models/02-exterior-doors.md#garage-sectional-door) 한 구성원의 `rail` 부재는 `garage-door-overhead-guide`·`garage-door-left-rail`·`garage-door-right-rail` 세 fixture 예약을 함께 채운다. 이 예약들에 별도 레일 instance를 더하면 같은 금속 부재가 중복되므로 세 id를 차고문 instance의 부재에 대응시키며 별도 개체로 세지 않는다.
