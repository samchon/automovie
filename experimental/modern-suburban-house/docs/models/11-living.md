# 거실과 가족실의 가구 원형

## 패브릭 소파 {#fabric-sofa}
<!--
@evidence principles/core/common.md#scope-preservation 거실 소파 예약과 가족실 소파 예약 두 곳을 한 원형으로 받아 외곽 2.10 × 0.95 × 0.90 m, 부품, 재질 경계, 관찰, 소스 owner `src/models/furnishings/living.ts`를 모두 이 H2 안에서 정한다.
@evidence principles/core/common.md#substantive-completion 받침 Y = [0.08, 0.30], 팔걸이 폭 0.15 m·높이 0.62 m, 등받이 깊이 0.20 m·상단 0.90 m, 쿠션 세 칸 0.596 m·깊이 0.75 m·상면 0.43 m, 쿠션 사이 틈 0.006 m까지 수치로 확정해 구현자가 단면을 새로 정할 일이 없다.
@evidence principles/core/common.md#declared-basis 외곽은 두 예약의 같은 길이·깊이·높이에서, 좌면 0.43 m는 거실 표에서 상속하며, 가족실 좌면도 0.43 m로 둔 것은 두 외곽이 같고 거실 설정의 회색/미색 패브릭 소파 정체성을 공유한다는 근거를 밝힌 이 층의 결정이라고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 예약은 외곽과 거실 좌면 0.43 m만 주는데 이 H2는 팔걸이·등받이·세 쿠션의 분할과 0.43/0.62/0.90 m 세 단, 그리고 부모가 정하지 않은 가족실 좌면 높이 결정을 더한다.
@evidence principles/design/models.md#representation-contract 받침·좌석 쿠션 셋·등받이·팔걸이 둘과 네 모서리 0.08 m 다리로 부품을 나누고 재질 경계 `leg`·`base`·`seat-cushion`·`back`·`arm`을 고정하며 쿠션 눌림·주름·솔기는 표현하지 않는다는 한계를 명시한다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따라 +Z를 앉은 사람이 보는 정면으로 두고 거실 배치는 world -X, 가족실 배치는 world -Z를 향하며 외곽은 길이 2.10 m·깊이 0.95 m·높이 0.90 m다.
@evidence principles/design/models.md#reviewable-structure 측면 정사영의 좌면 0.43 m·팔걸이 0.62 m·등받이 0.90 m 세 단, 위에서 본 세 쿠션과 두 팔걸이의 구분, 두 배치 외곽과 예약의 일치를 모델 리뷰 뷰의 고정 뷰로 반증하게 하고 관절이 없다고 밝힌다.
@evidence principles/design/models.md#model-observable-style-basis 거실 설정의 '회색/미색 패브릭 소파' 표지를 0.005 m 틈으로 읽히는 세 쿠션, 전체 깊이를 차지하는 팔걸이, 뒤쪽 등받이라는 구성으로 옮기고 패브릭 색은 materials가 두 배치별로 정하도록 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 좌면 0.43 m 기준, 다리·받침·쿠션·등받이·팔걸이의 높이 층, 다섯 재질 경계, 표현하지 않는 눌림·주름·솔기, 세 가지 관찰이 함께 적혀 거실·가족실 두 배치의 블로킹 표현이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 거실 소파 예약 X = -2.90 m~-1.95 m·Z = [-3.75, -1.65]·높이 0.90 m·좌면 0.43 m와 가족실 소파 예약 X = [3.25, 5.35]·Z = -7.15 m~-6.20 m·높이 0.90 m를 적힌 그대로 외곽으로 썼고, 가족실 좌면 미정은 이 층이 0.43 m로 채울 결정으로 다뤄 부모 수정이 필요하지 않았다.
@evidence settings/10-house.md#living 거실 설정의 회색/미색 패브릭 소파 정체성을 근거로 거실·가족실 두 배치가 한 원형을 공유하게 하고, 패브릭 색은 materials의 배치별 결정으로 넘긴다.
@evidence settings/10-house.md#common-room 공용부 설정의 '가족실에는 소파'를 거실과 같은 원형으로 채우되 이 설정이 좌면 높이를 정하지 않으므로 가족실 좌면 0.43 m가 이 층의 결정이라고 적는다.
@evidence spaces/rooms/living.md#living-furniture-use 거실 소파 예약 X = -2.90 m부터 방 오른쪽 안쪽 면 -1.95 m까지, Z = [-3.75, -1.65], 높이 0.90 m를 외곽으로, 거실 표의 좌면 0.43 m를 좌석 쿠션 상면으로 그대로 소비한다.
@evidence spaces/rooms/common.md#common-family-reservation 가족실 소파 예약 X = [3.25, 5.35], Z = -7.15 m부터 공용부 앞쪽 안쪽 면 -6.20 m까지, 높이 0.90 m를 같은 원형의 외곽으로 쓰고 정면을 world -Z로 둔다.
@evidence obligations/design/models.md#addressable-model-decisions 패브릭 소파의 외곽, 다리·받침·쿠션 셋·등받이·팔걸이 둘의 부품, 다섯 재질 경계 이름, 세 관찰을 {#fabric-sofa} 한 H2에 모아 거실·가족실 두 예약이 같은 원형 하나를 인용하게 한다.
@evidence obligations/design/models.md#model-review-set 측면 정사영, 위에서 본 뷰, 두 배치 외곽과 예약의 비교를 모델 리뷰 뷰(00-model-frame.md#model-review-set)의 고정 뷰로 찍게 해 극적 구도와 무관하게 소파 구성을 판정하며 모든 관찰을 unverified로 둔다.
@evidence obligations/design/models.md#reference-scale 거실 표의 좌면 0.43 m를 쿠션 상면으로 받아 거실·가족실 두 배치가 같은 높이를 쓰게 하고 팔걸이 0.62 m·등받이 0.90 m를 그 위 단으로 두며, 외곽 2.10 × 0.95 × 0.90 m는 두 예약 값과 같은지로 확인한다.
-->

패브릭 소파는 [거실 소파 예약](../spaces/rooms/living.md#living-furniture-use)의 X = -2.90 m부터 방 오른쪽 안쪽 면 -1.95 m까지, Z = [-3.75, -1.65], 높이 0.90 m와 [가족실 소파 예약](../spaces/rooms/common.md#common-family-reservation)의 X = [3.25, 5.35], Z = -7.15 m부터 공용부 앞쪽 안쪽 면 -6.20 m까지, 높이 0.90 m에 함께 쓰는 한 원형이다. 두 예약이 모두 길이 2.10 m, 깊이 0.95 m, 높이 0.90 m이므로 외곽을 그대로 그 값으로 둔다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 앉은 사람이 보는 정면이며 거실에서는 world -X, 가족실에서는 world -Z를 향한다.

부품은 받침, 좌석 쿠션 셋, 등받이, 팔걸이 둘이다. 받침은 Y = [0.08, 0.30]이고 네 모서리의 0.08 m 짧은 다리 위에 놓인다. 팔걸이는 각 폭 0.15 m, 높이 0.62 m로 전체 깊이를 차지한다. 등받이는 두 팔걸이 사이 뒤쪽 깊이 0.20 m, 상단 0.90 m다. 좌석 쿠션은 팔걸이 사이 1.80 m를 세 칸 0.596 m와 두 틈 0.006 m(3 × 0.596 + 2 × 0.006 = 1.800 m)로 나누고 깊이 0.75 m, 상면 0.43 m로 두어 [거실 표의 좌면 0.43 m](../spaces/rooms/living.md#living-furniture-use)와 같다. 가족실 예약과 [공용부 설정](../settings/10-house.md#common-room)은 좌면 높이를 정하지 않으므로 가족실 배치도 같은 0.43 m를 쓰는 것이 이 층의 결정이며, 근거는 두 예약의 외곽이 같고 [거실 설정](../settings/10-house.md#living)의 회색/미색 패브릭 소파 정체성을 한 원형으로 공유하는 것이다. 쿠션 사이 0.006 m 틈으로 세 칸이 읽히게 한다.

재질 경계는 `leg`, `base`, `seat-cushion`, `back`, `arm`이며 패브릭 색은 materials가 두 배치별로 정할 수 있다. 관절은 없고 쿠션 눌림·주름·솔기는 표현하지 않는다. 소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 측면 정사영에서 좌면 0.43 m·팔걸이 0.62 m·등받이 0.90 m의 세 단이 보이는지, 위에서 세 쿠션과 두 팔걸이가 구분되는지, 두 배치에서 외곽이 예약과 같은지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 낮은 목재 테이블 {#low-table}
<!--
@evidence principles/core/common.md#scope-preservation 거실과 가족실의 낮은 테이블 두 예약을 길이 L·폭 W 매개변수 한 원형으로 받아 두 매개변수 쌍, 상판과 다리, 재질 경계, 관찰, 소스 owner를 이 H2에 모은다.
@evidence principles/core/common.md#substantive-completion 상판 Y = [0.38, 0.42]의 두께 0.04 m, 모서리에서 0.05 m 안쪽의 0.05 m 각재 다리 넷, 에이프런·하부 선반 없음까지 정해 두 배치를 바로 구성할 수 있다.
@evidence principles/core/common.md#declared-basis L = 1.30 m·W = 0.50 m와 L = 1.10 m·W = 0.55 m, 상면 0.42 m는 두 예약에서 상속하고, 원점을 바닥 평면 중심에 둔 것은 사방에서 쓰는 테이블이라는 이유를 밝힌 가구 국소 좌표의 예외다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약은 외곽과 상면 0.42 m만 주고 이 H2는 L·W 매개변수화, 상판 두께 0.04 m, 다리 위치, 에이프런을 두지 않아 소파 앞 발 공간을 상판 아래로 잇는 결정을 더한다.
@evidence principles/design/models.md#representation-contract 상판 하나와 다리 넷의 부품 구성, 재질 경계 `top`·`leg`, 관절 없음, 에이프런·하부 선반이 없어 상판 아래가 비어 있는 음공간을 정한다. 보이지 않는 한계는 본문의 "나뭇결·모서리 모따기·다리 이음은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 로컬 원점을 바닥 평면 중심에, +X를 긴 방향에 두며 거실 배치는 긴 방향이 world Z, 가족실 배치는 world X이고 두 곳 모두 상면이 0.42 m다.
@evidence principles/design/models.md#reviewable-structure 두 매개변수 쌍의 외곽이 각 예약과 같은지, 측면에서 상면 0.42 m가 소파 좌면 0.43 m와 거의 같은 높이로 읽히는지를 모델 리뷰 뷰의 고정 뷰로 확인하게 한다.
@evidence principles/design/models.md#model-observable-style-basis '낮은 목재 테이블' 표지를 0.04 m 얇은 상판과 0.05 m 각재 다리, 에이프런·하부 선반 없는 구성으로 옮기며 목재의 외관은 이 H2가 정하지 않고 `top`·`leg` 경계만 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 상면 0.42 m를 소파 좌면 0.43 m와 비교하는 높이 관계, 상판·다리 두 층, 두 재질 경계, 두 관찰이 적혀 있어 매개변수 한 쌍마다 블로킹 표현이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 거실 테이블 예약 X = [-3.95, -3.45]·Z = [-3.30, -2.00]과 가족실 테이블 예약 X = [3.40, 4.50]·Z = [-8.35, -7.80], 두 곳의 상면 0.42 m를 적힌 그대로 L·W와 높이로 썼고 부모 값에 고칠 결함이 없었다.
@evidence settings/10-house.md#living 제목의 '낮은 목재 테이블'은 거실 설정 정체성 항목을 그대로 원형 이름으로 삼은 것이고, 거실 배치 L = 1.30 m·W = 0.50 m로 소파 앞에 둔다.
@evidence settings/10-house.md#common-room 공용부 설정의 '가족실에는 소파와 낮은 테이블'의 테이블을 같은 원형의 L = 1.10 m·W = 0.55 m 배치로 채운다.
@evidence spaces/rooms/living.md#living-furniture-use 거실 테이블 예약 X = [-3.95, -3.45], Z = [-3.30, -2.00]을 L = 1.30 m, W = 0.50 m, 긴 방향 world Z, 상면 0.42 m로 소비한다.
@evidence spaces/rooms/common.md#common-family-reservation 가족실 테이블 예약 X = [3.40, 4.50], Z = [-8.35, -7.80]을 L = 1.10 m, W = 0.55 m, 긴 방향 world X, 상면 0.42 m로 소비한다.
-->

[거실 설정](../settings/10-house.md#living)의 낮은 목재 테이블과 [공용부 설정](../settings/10-house.md#common-room)의 가족실 낮은 테이블은 길이 L과 폭 W를 매개변수로 받는 한 원형이다. [거실 테이블 예약](../spaces/rooms/living.md#living-furniture-use) X = [-3.95, -3.45], Z = [-3.30, -2.00]은 L = 1.30 m, W = 0.50 m이고 긴 방향이 world Z다. [가족실 테이블 예약](../spaces/rooms/common.md#common-family-reservation) X = [3.40, 4.50], Z = [-8.35, -7.80]은 L = 1.10 m, W = 0.55 m이고 긴 방향이 world X다. 두 곳 모두 상면 0.42 m다. [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 사방에서 쓰므로 로컬 원점을 바닥 평면 중심에 두고 +X를 긴 방향으로 둔다.

부품은 상판과 다리 넷이다. 상판은 Y = [0.38, 0.42]의 0.04 m 두께이고, 다리는 0.05 m 각재로 각 모서리에서 0.05 m 안쪽에 세운다. 에이프런과 하부 선반은 두지 않아 소파 앞 발 공간이 상판 아래로 이어진다. 재질 경계는 `top`, `leg`이고 관절은 없다.

나뭇결·모서리 모따기·다리 이음은 표현하지 않는다. 레퍼런스 02의 가족실 TV 콘솔과 높은 화면은 이번 배치에서 채택하지 않는다. 가족실 소파가 향한 후면과 오른쪽 외벽은 두 창과 접근 통로이고, 뒤쪽 벽은 소파 등 뒤라 화면을 마주할 벽이 없다. 창 아래 낮은 콘솔만 두면 TV 화면을 창 앞에 세워야 하므로 두 창 접근·채광을 가린다. 소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 두 매개변수 쌍의 외곽이 각 예약과 같은지, 측면에서 상면 0.42 m가 소파 좌면 0.43 m와 거의 같은 높이로 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 독서 안락의자 {#reading-armchair}
<!--
@evidence principles/core/common.md#scope-preservation 거실 안락의자 예약 하나를 외곽으로 받아 다리·받침·쿠션·등받이·팔걸이의 단면, 재질 경계, 관찰, 소스 owner를 이 H2에서 정한다.
@evidence principles/core/common.md#substantive-completion 다리 0.08 m, 받침 Y = [0.08, 0.30], 팔걸이 폭 0.12 m·높이 0.60 m, 등받이 깊이 0.18 m·상단 0.90 m, 좌면 0.43 m, 좌석 폭 0.61 m를 수치로 확정한다.
@evidence principles/core/common.md#declared-basis 외곽 0.85 × 0.85 m·높이 0.90 m는 거실 예약에서 받고, 단면 높이는 '소파와 같은 단면 규칙'을 근거로 적으며 좌석 폭 0.61 m는 한 사람 좌석임을 읽히게 하려는 이 층의 선택으로 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약은 외곽과 높이 0.90 m만 주고 이 H2는 쿠션 하나의 한 사람 좌석, 팔걸이 0.12 m·등받이 0.18 m의 단면, 좌면 0.43 m를 더한다.
@evidence principles/design/models.md#representation-contract 다리 넷·받침·좌석 쿠션 하나·등받이·팔걸이 둘로 부품을 나누고 재질 경계 `leg`·`base`·`seat-cushion`·`back`·`arm`을 두며 관절이 없다고 정한다. 보이지 않는 한계는 본문의 "쿠션 눌림·솔기·패브릭 주름은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따라 +Z를 정면으로 두고 배치에서 world +Z를 향하며 외곽은 폭 0.85 m·깊이 0.85 m·높이 0.90 m다.
@evidence principles/design/models.md#reviewable-structure 측면에서 좌면·팔걸이·등받이 높이가 소파와 같은 계열로 보이는지, 위에서 0.85 m 정사각 외곽이 의자 발 사용 범위 Z = [-4.80, -4.20]로 넘어가지 않는지를 고정 뷰로 확인한다.
@evidence principles/design/models.md#model-observable-style-basis '독서 안락의자' 표지를 좌석 폭 0.61 m의 한 사람 좌석과 소파와 같은 계열의 단면이라는 관찰 가능한 결정으로 옮기며 재질과 색은 정하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 좌면 0.43 m·팔걸이 0.60 m·등받이 0.90 m의 높이 층을 소파와 같은 단면 규칙에 묶고 다섯 재질 경계와 두 관찰을 함께 적어 예약 안의 표현이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 거실 예약 X = [-3.90, -3.05]·Z = [-5.65, -4.80]·높이 0.90 m와 의자 발 사용 범위 Z = [-4.80, -4.20]을 적힌 그대로 외곽과 관찰 한계로 썼고 부모 수정이 필요하지 않았다.
@evidence settings/10-house.md#living 거실 설정 정체성의 '작은 안락의자'를 0.85 m 정사각 외곽의 한 사람 좌석으로 구체화한다.
@evidence spaces/rooms/living.md#living-furniture-use 거실 예약 X = [-3.90, -3.05], Z = [-5.65, -4.80], 높이 0.90 m를 외곽으로, 의자 발 사용 범위 Z = [-4.80, -4.20]을 넘지 말아야 할 관찰 경계로 소비한다.
-->

[거실 설정](../settings/10-house.md#living)의 작은 독서 안락의자는 [거실 예약](../spaces/rooms/living.md#living-furniture-use)의 X = [-3.90, -3.05], Z = [-5.65, -4.80], 높이 0.90 m를 외곽으로 받아 폭 0.85 m, 깊이 0.85 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 정면이며 배치에서 world +Z를 향한다.

부품은 다리 넷, 받침, 좌석 쿠션 하나, 등받이, 팔걸이 둘이다. 소파와 같은 단면 규칙으로 다리 0.08 m, 받침 Y = [0.08, 0.30], 팔걸이 폭 0.12 m·높이 0.60 m, 등받이 깊이 0.18 m·상단 0.90 m, 좌석 쿠션 상면 0.43 m를 둔다. 좌석 폭은 0.61 m이며 한 사람 좌석임이 소파와의 차이로 읽혀야 한다. 재질 경계는 `leg`, `base`, `seat-cushion`, `back`, `arm`이고 관절은 없다.

쿠션 눌림·솔기·패브릭 주름은 표현하지 않는다. 소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 측면에서 좌면·팔걸이·등받이 높이가 소파와 같은 계열로 보이는지, 위에서 0.85 m 정사각 외곽이 의자 발 사용 범위 Z = [-4.80, -4.20]로 넘어가지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 짙은 책장과 책 {#dark-bookcase}
<!--
@evidence principles/core/common.md#scope-preservation 거실 책장 예약을 외곽으로 받아 몸체 판재, 선반 다섯, 책 묶음, 재질 경계, 관찰, 소스 owner를 이 H2에서 정한다.
@evidence principles/core/common.md#substantive-completion 옆판·윗판 0.02 m, 뒤판 0.01 m, 걸레받이 0.08 m, 선반 상면 0.20·0.55·0.90·1.25·1.60 m, 책 두께 0.02–0.04 m·높이 0.20–0.28 m·깊이 0.20 m, 칸 폭 70–85 % 채움을 수치로 정한다.
@evidence principles/core/common.md#declared-basis 외곽과 선반 산출 규칙(0.20 m부터 0.35 m 간격)은 방 문서에서 상속하고, 판 두께·책 치수 범위·고정 시드 산출은 부모 링크 없이 이 H2가 새로 정한 값으로 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 문서는 외곽과 선반 상면 산출 규칙을 주고 이 H2는 판재 구성, 선반 두께 0.02 m를 상면 아래로 두는 규칙, 고정 시드 책 묶음과 그 채움 비율을 더한다.
@evidence principles/design/models.md#representation-contract 옆판 둘·뒤판·윗판·걸레받이·선반 다섯의 부품, 책장에 고정된 자식 부품인 책, 문 없는 열린 선반, 책이 몸체 깊이 안에 있어 전면 밖으로 나오지 않는다는 점유 경계를 정한다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따라 +Z를 책을 꺼내는 면으로 두고 배치에서 world -X를 향하며 외곽은 폭 1.00 m·깊이 0.35 m·높이 1.90 m다.
@evidence principles/design/models.md#reviewable-structure 정면에서 다섯 선반 간격과 책 묶음이 읽히는지, 측면에서 책 앞면이 0.35 m 안에 드는지를 모델 리뷰 뷰의 고정 뷰로 반증하게 하고 관절이 없다고 밝힌다.
@evidence principles/design/models.md#model-observable-style-basis '짙은 책장' 표지의 색은 이 H2가 정하지 않고 재질 경계만 넘기며, 기하로는 문 없는 열린 선반과 칸 폭 70–85 %를 채운 얇은 상자 책 묶음이 관찰 가능한 결정이다.
@evidence principles/design/models.md#model-scale-layer-completion 몸체 1.00 × 0.35 × 1.90 m, 옆판·윗판 0.02 m·뒤판 0.01 m·걸레받이 0.08 m, 다섯 선반 상면 0.20–1.60 m와 책 묶음의 층, 표면 id `carcass`·`plinth`·`shelf`·`book`, 책등 글자·개별 표지 비표현 한계와 두 관찰이 함께 표현을 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 거실 예약 X = -2.30 m~-1.95 m·Z = [-5.90, -4.90]·높이 1.90 m와 선반 상면을 0.20 m부터 0.35 m 간격으로 두는 산출 규칙을 적힌 그대로 썼고 부모 수정이 필요하지 않았다.
@evidence settings/10-house.md#living 거실 설정 정체성의 '짙은 책장'을 문 없는 열린 선반과 책 묶음의 원형으로 구체화하며 짙은 색 자체는 이 H2에서 정하지 않는다.
@evidence spaces/rooms/living.md#living-furniture-use 거실 책장 예약 X = -2.30 m부터 방 오른쪽 안쪽 면 -1.95 m까지, Z = [-5.90, -4.90], 높이 1.90 m를 외곽으로, 방 문서의 산출 규칙을 선반 상면 0.20·0.55·0.90·1.25·1.60 m로 소비한다.
@evidence obligations/design/models.md#representation-ceiling 책을 선반마다 두께 0.02–0.04 m·높이 0.20–0.28 m·깊이 0.20 m의 얇은 상자 묶음으로만 두고 책등 글자·개별 표지는 표현하지 않아, 선반 간격과 책 묶음의 읽힘까지만 주장하고 개별 책 식별은 주장하지 않는다.
-->

[거실 설정](../settings/10-house.md#living)의 짙은 책장은 [거실 예약](../spaces/rooms/living.md#living-furniture-use)의 X = -2.30 m부터 방 오른쪽 안쪽 면 -1.95 m까지, Z = [-5.90, -4.90], 높이 1.90 m를 외곽으로 받아 폭 1.00 m, 깊이 0.35 m, 높이 1.90 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 책을 꺼내는 면이며 배치에서 world -X를 향한다. 문 없는 열린 선반이다.

부품은 옆판 둘, 뒤판, 윗판, 걸레받이, 선반 다섯이다. 옆판·윗판 두께는 0.02 m, 뒤판 0.01 m, 걸레받이 높이 0.08 m다. 다섯 선반 상면은 [방 문서의 산출 규칙](../spaces/rooms/living.md#living-furniture-use)대로 0.20 m부터 0.35 m 간격인 0.20, 0.55, 0.90, 1.25, 1.60 m이고 두께 0.02 m를 상면 아래로 둔다. 책은 선반마다 25권이며, 인덱스 s = 0…4(아래부터), i = 0…24(왼쪽부터), 정수 시드 1952를 쓴다. 책 i의 두께는 `0.025 + 0.001 × ((1952 + 17s + 7i) mod 11)` m, 높이는 `0.20 + 0.01 × ((1952 + 13s + 5i) mod 9)` m, 깊이는 0.20 m다. 다섯 단의 두께 합은 차례로 0.749, 0.745, 0.752, 0.748, 0.755 m로 선반 안쪽 폭 0.96 m의 77.6–78.6 %다. 각 묶음은 선반 왼쪽 안쪽에서 0.02 m 띄워 순서대로 쌓는다. 책은 몸체 깊이 안에 있어 전면 밖으로 나오지 않는다.

재질 경계는 `carcass`, `plinth`, `shelf`, `book`이다. 관절은 없고 책은 책장에 고정된 자식 부품이다. 책등 글자·개별 표지는 표현하지 않는다. 소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 정면에서 다섯 선반 간격과 책 묶음이 읽히는지, 측면에서 책 앞면이 0.35 m 안에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 얇은 바닥 깔개 {#floor-covering}
<!--
@evidence principles/core/common.md#scope-preservation 거실 러그·현관 매트와 침대 세 개의 host 유도 덮개을 L·W·T 한 원형으로 받아 다섯 매개변수 셋, 몸판과 가장자리 띠, 재질 경계, 가구 겹침 규칙, 관찰을 이 H2에서 정한다.
@evidence principles/core/common.md#substantive-completion 거실 L = 2.35 m·W = 2.00 m·T = 0.008 m, 현관 L = 0.90 m·W = 0.65 m·T = 0.006 m, 침대 아래 L = 침대 길이 + 0.30 m·W = 침대 폭 + 0.30 m·T = 0.008 m, 가장자리 띠 폭 0.04 m, 밑면 Y = 0을 확정한다.
@evidence principles/core/common.md#declared-basis 외곽은 거실 러그 예약과 현관 매트 예약에서 받고, 두 덮개를 한 원형으로 묶고 원점 예외를 두는 근거를 '사람이 밟고 지나가는 얇은 바닥 덮개'라는 이유로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약은 외곽만 주고 이 H2는 몸판과 둘레 0.04 m 띠의 면 분할, 띠의 높이를 올리지 않는 규칙, 가구 다리 겹침을 허용하되 덮개가 가구를 들어 올리지 않는 규칙을 더한다.
@evidence principles/design/models.md#representation-contract 몸판 하나와 같은 두께의 가장자리 띠 하나로 부품을 두고 재질 경계 `field`·`border`를 고정하며 무늬·털 높이·술 장식은 표현하지 않는다고 명시한다.
@evidence principles/design/models.md#spatial-convention 로컬 원점을 바닥 평면 중심에, +X를 L 방향에, 밑면을 Y = 0에 두며 러그는 L이 world Z, 매트는 L이 world X다.
@evidence principles/design/models.md#reviewable-structure 측면에서 두께가 T를 넘지 않아 문턱처럼 읽히지 않는지, 위에서 두 외곽이 예약과 같은지, 바닥면과 z-fighting 없이 구분되는지를 고정 뷰로 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 러그와 매트 표지에서 이 H2가 기하로 정하는 것은 T = 0.008/0.006 m의 얇은 두께와 `field`·`border` 두 면 분할뿐이고 무늬·털 높이·술 장식은 표현하지 않는다고 밝힌다.
@evidence principles/design/models.md#model-scale-layer-completion 다섯 배치의 T 0.008 m·0.006 m, 몸판과 같은 두께의 띠 한 층, 가구 다리 겹침 규칙, 세 관찰을 함께 적어 밟는 덮개의 블로킹 표현이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 거실 러그 예약 X = [-4.00, -2.00]·Z = [-3.90, -1.55]와 현관 매트 예약 X = [0.45, 1.35]·Z = [-1.95, -1.30]을 적힌 그대로 L·W로 썼고 부모 수정이 필요하지 않았다.
@evidence settings/10-house.md#living 거실 설정의 '절제된 무늬 러그'를 T = 0.008 m의 거실 러그 배치로 받되 무늬는 기하로 표현하지 않고 `field`·`border` 면 분할만 둔다.
@evidence settings/10-house.md#entry 현관 설정의 '얕은 매트'를 T = 0.006 m 매트로 받아 측면에서 문턱처럼 읽히지 않는지를 관찰하게 한다.
@evidence spaces/rooms/living.md#living-furniture-use 거실 러그 예약 X = [-4.00, -2.00], Z = [-3.90, -1.55]를 L = 2.35 m(world Z), W = 2.00 m로 소비한다.
@evidence spaces/rooms/entry.md#entry-use-routes 현관 매트 예약 X = [0.45, 1.35], Z = [-1.95, -1.30]을 L = 0.90 m(world X), W = 0.65 m로 소비한다.
@evidence obligations/design/models.md#model-representation-completion 이 H2는 덮개 원형의 몸판·띠 층, 다섯 배치의 L·W·T, 재질 경계 `field`·`border`, 표현하지 않는 무늬·털·술, 세 관찰을 모두 적되 모든 관찰이 unverified라 구조적 유효성과 의미적 완결성 판정은 아직 없다.
-->

러그와 현관 매트는 사람이 밟고 지나가는 얇은 바닥 덮개이므로 길이 L, 폭 W, 두께 T를 받는 한 원형으로 만든다. [거실 러그 예약](../spaces/rooms/living.md#living-furniture-use)은 X = [-4.00, -2.00], Z = [-3.90, -1.55]로 L = 2.35 m(world Z), W = 2.00 m, T = 0.008 m다. [현관 매트 예약](../spaces/rooms/entry.md#entry-use-routes)은 X = [0.45, 1.35], Z = [-1.95, -1.30]으로 L = 0.90 m(world X), W = 0.65 m, T = 0.006 m다. 레퍼런스 02의 침대 아래 얇은 러그도 채택한다. [침대 원형](13-bedrooms.md#headboard-bed)의 길이·폭에 각각 0.30 m를 더한 host 유도 변형으로 주침실은 2.45 × 1.90 × 0.008 m, 작은 침실 둘은 각각 2.45 × 1.45 × 0.008 m다. 침대 중심에서 사방 0.15 m씩 보이되 문턱·바닥 관찰 통로의 높이를 0.008 m 이상 올리지 않는다. 별도 방이나 새 벽을 만들지 않고, 실제 배치가 문 회전·가구 다리와 맞는지는 instance 적합 검사의 대상이며 지금은 unverified다. [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 밟고 지나가는 덮개이므로 로컬 원점을 바닥 평면 중심에 두고 +X를 L 방향으로 두며 밑면이 Y = 0에 놓인다.

부품은 몸판 하나와 가장자리 띠 하나다. 가장자리 띠는 몸판 둘레 0.04 m 폭의 같은 두께 영역으로 면만 나누고 높이를 올리지 않는다. 재질 경계는 `field`, `border`다. 무늬·털 높이·술 장식은 표현하지 않는다. 덮개 위에 가구가 놓이며 가구 다리와 겹치는 것은 허용하고 덮개가 가구를 들어 올리지 않는다.

소스 owner는 `src/models/furnishings/living.ts`다. 관찰은 측면에서 두께가 T를 넘지 않아 문턱처럼 읽히지 않는지, 위에서 두 외곽이 예약과 같은지, 바닥면과 z-fighting 없이 구분되는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 벽난로의 검은 화구와 목재 선반 {#fireplace-insert-mantel}
<!--
@evidence principles/core/common.md#scope-preservation spaces가 만든 벽돌 앞면과 굴뚝을 복제하지 않고 그 앞면의 실제 빈 화구 속과 상부 목재 선반만 맡는다.
@evidence principles/core/common.md#substantive-completion 화구 폭 1.04 m·높이 0.64 m·깊이 0.55 m, 검은 안쪽 판 두께 0.025 m, 선반 1.60 × 0.55 × 0.10 m를 정한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#living의 검은 화구·벽돌 본체·목재 선반 구분과 spaces/envelope/left.md#chimney-roof-interface의 실내 앞면 예약에서 치수를 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 빈 벽돌 상자 대신 실제 화구 void 안의 검은 다섯 면과 바로 위 선반을 별도 원형으로 결정한다.
@evidence principles/design/models.md#representation-contract 화구의 뒤·좌우·위·아래 다섯 닫힌 금속판은 `firebox`, 전면 얇은 테는 `firebox-trim`, 목재 선반의 모든 면은 `mantel`로 덮는다. 불꽃과 실제 연도는 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 원점은 화구 아래 가운데의 벽돌 앞면, 국소 +Z는 거실 쪽, +X는 화구 가로, +Y는 위다. 배치는 굴뚝 면에서 산출한다.
@evidence principles/design/models.md#reviewable-structure 정면에서 검은 빈 중심·벽돌 테·목재 상단의 세 겹, 측면에서 깊이와 선반의 경계, 45°에서 꺼진 화구를 검토한다.
@evidence principles/design/models.md#model-observable-style-basis 04의 낮은 벽돌 벽난로는 검은 내부와 목재 선반의 별도 부피가 있을 때 읽히며 색·결은 materials에 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 화구·선반의 외곽, 판 두께, 접합 범위, 세 면 id, 미터 UV와 국소 프레임을 확정한다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 벽돌 상자 앞면에 비어 있어야 할 화구를 확인해 spaces/envelope/left.md와 src/spaces/envelope/left.ts를 네 닫힌 벽돌 부재로 수정했다. 목재 선반의 Y = [1.30, 1.40] m를 별도 소유로 남긴다.
@evidence settings/10-house.md#living 거실의 검은 화구·벽돌 본체·목재 선반을 세 표면으로 구분한다.
@evidence spaces/envelope/left.md#chimney-roof-interface 거실 쪽 예약의 화구 빈 구간과 선반 높이를 그대로 채운다.
@evidence obligations/design/models.md#addressable-model-decisions 벽돌 몸통과 다른 검은 화구·목재 선반의 원형을 독립 H2에서 정한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 거실의 레퍼런스 04 뷰를 검사한다.
-->

[거실 조건](../settings/10-house.md#living)은 검은 화구·벽돌 본체·목재 선반을 구별한다. 벽돌 앞면과 굴뚝은 [왼쪽 입면 owner](../spaces/envelope/left.md#chimney-roof-interface)가 지었고, 화구 자리만 빈다. 이 원형의 국소 원점은 화구 아래 가운데의 벽돌 앞면이고 +Z는 거실 쪽, +X는 화구 가로, +Y는 위다. 화구 void는 폭 1.04 m, 높이 0.64 m, 바닥 위 0.23–0.87 m, 깊이 0.55 m다. 뒤·좌우·위·아래에 각각 두께 0.025 m의 닫힌 검은 금속 판을 놓되 판의 외곽은 void를 넘지 않는다. 전면 테는 폭 0.025 m, 두께 0.015 m이며 벽돌 앞면 안으로 물려 거실 쪽으로 돌출하지 않는다. 내부에서 벽돌과 화구가 함께 보이게 하는 것이 목적이고 불꽃·연도·연소는 구현하지 않는다.

목재 선반은 벽돌 앞면 전체 폭 1.60 m, 깊이 0.55 m, 높이 0.10 m다. 바닥 위 Y = [1.30, 1.40] m를 채워 그 아래 벽돌 상단과 한 경계에서 만난다. 상면·아래면·네 옆면 모두 `mantel`, 금속 내부 판 모든 면은 `firebox`, 전면 테 모든 면은 `firebox-trim`이다. 목재 결을 위한 UV는 가로를 U·깊이를 V로, 검은 판은 각 판 국소 가로·세로를 미터로 투영한다. 위치와 크기는 [실내 앞면 예약](../spaces/envelope/left.md#chimney-roof-interface) 안이며 벽난로 앞 0.90 m 통로까지 늘어나지 않는다. 소스 owner는 `src/models/furnishings/living.ts`; [모델 고정 뷰](00-model-frame.md#model-review-set)와 레퍼런스 04의 거실 정면에서 검은 중심·벽돌·목재 세 재료를 대조한다. 실제 source와 렌더는 unverified다.
