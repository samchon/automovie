# 실내 기구

## 공용부의 섬 pendant와 식탁등 {#interior-common-pendants}
<!--
@evidence principles/core/common.md#scope-preservation 공용부 섬 pendant 두 개와 식탁등 하나의 위치·갓 외곽 상한·색·강도·상태를 맡는다.
@evidence principles/core/common.md#substantive-completion 섬 X = -3.125, Z = -8.10·-7.05, Y = 1.95 m, 식탁 X = 0.50, Z = -7.95, Y = 1.55 m, 갓 지름 상한 0.30·0.50 m, 2,700 K, 40·60 cd, range 4.0 m, 켜짐을 정한다.
@evidence principles/core/common.md#declared-basis 기능을 조명으로 나누는 근거는 common-room, 좌표는 섬·식탁 예약에서 유도하고 강도는 이 branch의 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation common-room이 가구와 조명으로 기능을 나누라고만 한 데 비해 매달린 광원 세 개의 좌표·높이·갓 상한을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 갓·줄 geometry는 models, 배치는 instances가 이 좌표를 소비한다.
@evidence principles/design/systems.md#system-dependency-basis 좌표는 common-island-reservation·common-dining-reservation 중심에서, 비충돌은 스툴 점유와 common-clear-routes 대조에서 유도한다.
@evidence principles/design/systems.md#system-verification-address 03 프레임의 두 빛 웅덩이와 갓 외곽이 섬·상판 밖이나 동선 예약과 겹치는지의 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work common-room과 섬·식탁·동선 예약을 매달린 갓 외곽에 대조했고 모두 몸체 안에 들어 부모 예약을 고칠 결함이 없었다.
@evidence settings/10-house.md#common-room 가구와 조명으로 주방·식당·가족실을 나눈다는 결정을 섬 pendant와 식탁등으로 실현한다.
@evidence spaces/rooms/common.md#common-room-plan kitchen-dining-family 방 id와 외곽을 광원 소속으로 쓴다.
@evidence spaces/rooms/common.md#common-island-reservation 섬 X = [-3.65, -2.60], Z = [-8.70, -6.45]와 스툴 점유에서 pendant 좌표와 갓 상한을 유도한다.
@evidence spaces/rooms/common.md#common-dining-reservation 식탁 X = [-0.35, 1.35], Z = [-8.40, -7.50] 중심에 식탁등을 둔다.
@evidence spaces/rooms/common.md#common-clear-routes 식탁 오른쪽·뒤쪽 동선 위에 갓이 걸리지 않음을 대조한다.
@evidence spaces/01-storeys.md#storey-datums 1층 천장 2.75 m 아래 매다는 높이를 정한다.
@evidence obligations/core/common.md#purpose-fit 02-interior-fixtures.md는 방별 실내 기구의 좌표·상태 역할을 맡으며 이것이 없으면 17개 공간 중 16개 실내 공간의 켜진 따뜻한 실내등이 정해지지 않는다.
-->

[공용부](../spaces/rooms/common.md#common-room-plan)는 완전 높이 칸막이 없이 가구와 조명으로 기능을 나누므로 매달린 기구 두 종류가 주방과 식사 구역을 구분한다. 섬 pendant는 point 광원 `light:kitchen-dining-family:island-pendant-1`·`-2`이고 [섬 예약](../spaces/rooms/common.md#common-island-reservation) X = [-3.65, -2.60], Z = [-8.70, -6.45] m의 중심선 X = -3.125 m, Z = -8.10·-7.05 m, 발광점 Y = 1.95 m에 둔다. 식탁등은 `light:kitchen-dining-family:dining-pendant`이며 [식탁 상판](../spaces/rooms/common.md#common-dining-reservation) X = [-0.35, 1.35], Z = [-8.40, -7.50] m의 중심 X = 0.50 m, Z = -7.95 m, Y = 1.55 m에 둔다. 섬 갓의 평면 지름 상한 0.30 m는 X = [-3.275, -2.975] m로 섬 몸체 안에 들고, 스툴 사용 점유(섬 동쪽 끝부터 X = -1.65 m)와 서쪽 작업 통로(X < -3.65 m) 위에 걸리지 않는다. 식탁 갓의 지름 상한 0.50 m는 X = [0.25, 0.75], Z = [-8.20, -7.70] m로 상판 안이며 식탁 오른쪽·뒤쪽의 [공용 동선](../spaces/rooms/common.md#common-clear-routes)의 머리 공간을 침범하지 않는다. 세 광원 모두 약 2,700 K (1.00, 0.72, 0.45), `range` 4.0 m, `intensity` 섬 각 40 cd·식탁 60 cd이고 리뷰 프레임에서 켜짐이다. 강도는 [고정 노출](01-daylight.md#daylight-sky-fill) 아래에서 창 빛과 함께 따뜻한 웅덩이가 읽히도록 이 branch가 택한 값이다. 갓과 줄의 geometry는 models, 배치는 instances가 이 좌표를 소비한다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 03 공용부 프레임에서 섬과 식탁 위 두 빛 웅덩이가 따로 읽히는지, 갓 평면 외곽이 섬·상판 밖으로 나가거나 동선 예약과 겹치는지의 산출물 대조이며 모두 unverified다.

## 1층 방과 통로의 천장등 {#interior-ground-ceiling}
<!--
@evidence principles/core/common.md#scope-preservation 1층 방과 통로 여덟 광원(거실·가족실·현관·서비스 두 띠·파우더룸·세탁실·팬트리)을 맡는다.
@evidence principles/core/common.md#substantive-completion 여덟 광원의 X·Z를 표로, Y = 2.70 m, 2,700 K, 50 cd, range 5.0 m, 켜짐을 정한다.
@evidence principles/core/common.md#declared-basis 좌표는 각 방 owner 외곽 중심의 유도, 서비스실도 켜는 것은 lighting-state의 어두운 방 금지에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state가 따뜻한 천장등만 요구한 데 비해 방별 좌표와 켜짐을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 방 외곽과 천장 datum은 spaces owner에서 받는다.
@evidence principles/design/systems.md#system-dependency-basis 각 좌표를 인용한 방 외곽 수치와 storey-datums의 2.75 m에서 계산한다.
@evidence principles/design/systems.md#system-verification-address 각 좌표의 외곽 포함 대조와 04 프레임의 밝기 연속이 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work 여덟 방 외곽과 1층 천장 datum을 광원 좌표에 대조했고 모두 외곽 안이어서 부모 수정이 없었다.
@evidence settings/20-verification.md#lighting-state 켜진 따뜻한 천장등과 어두운 방 금지를 여덟 광원의 켜짐으로 실현한다.
@evidence spaces/01-storeys.md#storey-datums 1층 천장 Y = 2.75 m에서 발광점 Y = 2.70 m를 유도한다.
@evidence spaces/rooms/living.md#living-plan living-room 외곽 중심 X = -3.725, Z = -3.15에 둔다.
@evidence spaces/rooms/common.md#common-family-reservation 가족실 낮은 테이블과 소파 사이 X = 3.95, Z = -7.80에 둔다.
@evidence spaces/rooms/entry.md#entry-plan front-entry L형의 X = [-0.50, 2.02] 부분 중심에 둔다.
@evidence spaces/rooms/service.md#service-access-plan service-access 두 띠의 중심에 하나씩 둔다.
@evidence spaces/rooms/powder.md#powder-plan powder-room 외곽 중심 X = 4.36, Z = -1.075에 둔다.
@evidence spaces/rooms/laundry.md#laundry-plan laundry-mudroom 외곽 중심 X = 4.36, Z = -3.30에 둔다.
@evidence spaces/rooms/pantry.md#pantry-plan pantry 외곽 중심 X = 4.36, Z = -5.375에 둔다.
-->

1층 방은 [1층 완성 천장 Y = 2.75 m](../spaces/01-storeys.md#storey-datums)에 붙는 평판형 기구로 밝히며 발광점은 Y = 2.70 m다. 매달리지 않으므로 가구·동선 예약과의 머리 공간 충돌은 없다. 좌표는 각 방 owner의 마감 안쪽 외곽에서 산출한 평면 중심 또는 아래 기능 중심이다.

| 광원 id | 방 owner | X, Z (m) | 근거 |
| --- | --- | --- | --- |
| `light:living-room:ceiling` | [거실](../spaces/rooms/living.md#living-plan) | -3.725, -3.15 | X = [-5.50, -1.95], Z = [-6.05, -0.25]의 중심 |
| `light:kitchen-dining-family:family-ceiling` | [가족실 예약](../spaces/rooms/common.md#common-family-reservation) | 3.95, -7.80 | 낮은 테이블 X = [3.40, 4.50], Z = [-8.35, -7.80]과 소파 앞 사이 |
| `light:front-entry:ceiling` | [현관](../spaces/rooms/entry.md#entry-plan) | 0.76, -1.83 | L형 중 X = [-0.50, 2.02], Z = [-3.41, -0.25] 부분의 중심, 계단 구멍 X = [-1.80, -0.65] 밖 |
| `light:service-access:right-strip` | [서비스 통로](../spaces/rooms/service.md#service-access-plan) | 2.545, -3.15 | 오른쪽 띠 X = [2.02, 3.07], Z = [-6.05, -0.25]의 중심 |
| `light:service-access:rear-strip` | 같은 owner | 0.11, -5.38 | 계단 뒤 띠 X = [-1.80, 2.02], Z = [-6.05, -4.71]의 중심 |
| `light:powder-room:ceiling` | [파우더룸](../spaces/rooms/powder.md#powder-plan) | 4.36, -1.075 | X = [3.22, 5.50], Z = [-1.90, -0.25]의 중심 |
| `light:laundry-mudroom:ceiling` | [세탁·머드룸](../spaces/rooms/laundry.md#laundry-plan) | 4.36, -3.30 | X = [3.22, 5.50], Z = [-4.55, -2.05]의 중심 |
| `light:pantry:ceiling` | [팬트리](../spaces/rooms/pantry.md#pantry-plan) | 4.36, -5.375 | X = [3.22, 5.50], Z = [-6.05, -4.70]의 중심 |

모두 point 광원, 약 2,700 K, `intensity` 50 cd, `range` 5.0 m이며 리뷰 프레임에서 켜짐이다. [빛과 기준 상태](../settings/20-verification.md#lighting-state)가 어두운 방을 view별 밝기로 숨기지 못하게 하므로 수납·서비스 공간도 끄지 않는다. 방 id는 각 방 owner가 정한 spaces id를 그대로 쓴다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 각 광원 좌표가 소속 방 외곽 안에 드는지의 산출물 대조와 04 현관/거실/계단 프레임의 밝기 연속이며 unverified다.

## 계단과 2층 복도의 천장등 {#interior-stair-hall}
<!--
@evidence principles/core/common.md#scope-preservation 계단 중간참 위와 2층 복도 두 부분의 천장등을 맡는다.
@evidence principles/core/common.md#substantive-completion 중간참 위 X = -1.225, Z = -3.985, 복도 X = -0.065, Z = -5.31과 X = 2.47, Z = -4.06, 모두 Y = 5.61 m, 50 cd, 켜짐을 정한다.
@evidence principles/core/common.md#declared-basis 좌표는 stair-reservation과 upper-hall-plan 외곽의 중심, 높이는 2층 천장 5.66 m에서 유도한다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation stair·upper-hall 설정이 경로만 정한 데 비해 세 광원 좌표와 머리 공간 대조를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 계단 경로·복도 외곽은 spaces에서 받는다.
@evidence principles/design/systems.md#system-dependency-basis 중간참 Y = 1.36 m와 천장 5.66 m에서 4.25 m 여유를 계산한다.
@evidence principles/design/systems.md#system-verification-address 05 프레임의 계단참·복도 연속과 좌표의 외곽 포함 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work stair-reservation 중간참과 upper-hall 외곽, 2층 천장 datum을 대조했고 머리 공간 2.00 m를 지켜 부모 수정이 없었다.
@evidence spaces/02-stair.md#stair-reservation 중간참 X = [-1.80, -0.65], Z = [-4.56, -3.41], Y = 1.36의 중심 위에 둔다.
@evidence spaces/rooms/upper-hall.md#upper-hall-plan 복도 팔과 도착 부분 외곽의 중심에 하나씩 둔다.
@evidence spaces/01-storeys.md#storey-datums 2층 천장 5.66 m와 머리 공간 2.00 m를 대조한다.
-->

계단은 [중간참](../spaces/02-stair.md#stair-reservation) X = [-1.80, -0.65], Z = [-4.56, -3.41] m(Y = 1.36 m) 위의 [2층 완성 천장 Y = 5.66 m](../spaces/01-storeys.md#storey-datums)에 평판형 `light:main-stair:landing-ceiling`을 X = -1.225 m, Z = -3.985 m, Y = 5.61 m에 둔다. 중간참에서 4.25 m 위이므로 [계단 머리 공간 2.00 m](../spaces/01-storeys.md#storey-datums)를 침범하지 않는다. [2층 복도](../spaces/rooms/upper-hall.md#upper-hall-plan)는 팔 X = [-3.20, 3.07], Z = [-5.91, -4.71] m의 중심 X = -0.065 m, Z = -5.31 m와 도착 부분 X = [1.87, 3.07], Z = [-4.71, -3.41] m의 중심 X = 2.47 m, Z = -4.06 m에 평판형 `light:upper-hall:arm-ceiling`·`light:upper-hall:arrival-ceiling`을 Y = 5.61 m로 둔다. 모두 point, 약 2,700 K, 50 cd, `range` 5.0 m, 켜짐이다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 05 복도/계단참 프레임에서 계단참과 복도 두 팔이 끊김 없이 읽히는지와 좌표의 외곽 포함 대조이며 unverified다.

## 침실과 옷방의 천장등과 협탁등 {#interior-bedrooms}
<!--
@evidence principles/core/common.md#scope-preservation 세 침실·옷방 천장등과 협탁등 네 개를 맡는다.
@evidence principles/core/common.md#substantive-completion 천장등 네 좌표와 협탁등 X·Z·Y(3.96·4.01 m), 2,700 K 50 cd와 2,400 K 8 cd, 켜짐을 정한다.
@evidence principles/core/common.md#declared-basis 협탁등은 primary-bedroom·bedroom-two·bedroom-three 설정의 등, 높이는 spaces 표의 등 포함 높이에서 0.15 m 내린 값이며 models owner가 아직 없다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 침실 설정이 협탁과 조명의 존재만 정한 데 비해 광원 좌표·높이·색온도를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 등 갓과 몸체는 models, 협탁 배치는 instances가 소비한다.
@evidence principles/design/systems.md#system-dependency-basis 좌표는 각 방 외곽과 협탁 예약 중심, 높이는 등 포함 높이에서 계산한다.
@evidence principles/design/systems.md#system-verification-address 02·05 프레임의 협탁등 읽힘, models 갓과의 높이 대조, 외곽 포함 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work 침실 세 설정과 방·협탁 예약을 대조했고 모든 광원이 외곽과 협탁 위에 들어 부모 수정이 없었다.
@evidence settings/10-house.md#primary-bedroom 양옆 협탁 조명을 두 협탁등으로 실현한다.
@evidence settings/10-house.md#bedroom-two 협탁과 조명을 협탁등 하나로 실현한다.
@evidence settings/10-house.md#bedroom-three 협탁/등을 협탁등 하나로 실현한다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-plan 외곽 중심 X = -3.725, Z = -2.405에 천장등을 둔다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 협탁 예약과 등 포함 1.05 m에서 Y = 3.96을 유도한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-plan 앞쪽 직사각 부분 중심 X = 2.50, Z = -1.38에 둔다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 협탁 예약 중심 X = 1.275, Z = -2.875에 둔다.
@evidence spaces/rooms/primary.md#primary-plan 뒤쪽 본체 중심 X = -2.375, Z = -8.255에 둔다.
@evidence spaces/rooms/primary.md#primary-furniture-use 두 협탁 Z = -8.90·-6.80과 등 포함 1.10 m에서 Y = 4.01을 유도한다.
@evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan 옷방 외곽 중심 X = 3.20, Z = -9.70에 둔다.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use 후면 옷걸이 깊이 Z = [-10.45, -9.90] 밖임을 대조한다.
-->

세 침실과 옷방은 2층 천장 Y = 5.61 m의 평판형 천장등을 가진다. [올리브 침실](../spaces/rooms/bedroom-two.md#bedroom-two-plan)은 X = [-5.50, -1.95], Z = [-4.56, -0.25] m의 중심 X = -3.725 m, Z = -2.405 m, [청회색 침실](../spaces/rooms/bedroom-three.md#bedroom-three-plan)은 앞쪽 직사각 부분 X = [-0.50, 5.50], Z = [-2.51, -0.25] m의 중심 X = 2.50 m, Z = -1.38 m, [주침실](../spaces/rooms/primary.md#primary-plan)은 뒤쪽 본체 X = [-5.50, 0.75], Z = [-10.45, -6.06] m의 중심 X = -2.375 m, Z = -8.255 m, [옷방](../spaces/rooms/wardrobe.md#primary-wardrobe-plan)은 X = [0.90, 5.50], Z = [-10.45, -8.95] m의 중심 X = 3.20 m, Z = -9.70 m다. 옷방 좌표는 [후면 옷걸이](../spaces/rooms/wardrobe.md#wardrobe-storage-use) 깊이 Z = [-10.45, -9.90] m 밖이다. 천장등 id는 `light:bedroom-two:ceiling`, `light:bedroom-three:ceiling`, `light:primary-bedroom:ceiling`, `light:primary-wardrobe:ceiling`이다. 협탁등은 [주침실 설정](../settings/10-house.md#primary-bedroom)의 양옆 조명과 [올리브 침실](../settings/10-house.md#bedroom-two)·[청회색 침실](../settings/10-house.md#bedroom-three)의 협탁/등을 실현하는 point 광원이며 각 협탁 예약의 평면 중심, 방 표가 정한 등 포함 높이에서 0.15 m 내린 갓 안쪽에 둔다. [올리브 침실 협탁](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-3.95, -3.50], Z = [-4.50, -4.05] m(등 포함 1.05 m)의 `light:bedroom-two:nightstand-lamp`는 X = -3.725 m, Z = -4.275 m, Y = 3.96 m다. [청회색 침실 협탁](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.05, 1.50], Z = [-3.10, -2.65] m(등 포함 1.05 m)의 `light:bedroom-three:nightstand-lamp`는 X = 1.275 m, Z = -2.875 m, Y = 3.96 m다. [주침실의 두 협탁](../spaces/rooms/primary.md#primary-furniture-use) X = [0.15, 0.65], Z = [-9.15, -8.65]·[-7.05, -6.55] m(등 포함 1.10 m)의 `light:primary-bedroom:nightstand-lamp-rear`·`-front`는 X = 0.40 m, Z = -8.90·-6.80 m, Y = 4.01 m다. 등 갓과 몸체를 정할 models 문서는 아직 없으므로 이 높이는 spaces 표의 등 포함 높이에만 의존하며, 침실 기구 models owner가 생기면 그 갓 중심과 대조한다. 천장등은 2,700 K·50 cd·`range` 5.0 m, 협탁등은 약 2,400 K (1.00, 0.66, 0.38)·8 cd·`range` 2.5 m이며 모두 켜짐이다. 모든 기구가 천장 평판이거나 협탁 위이므로 침대·책상 의자·옷장 사용 예약 위에 매달린 몸체가 없다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 02·05 프레임에서 협탁등이 침대 옆에 따로 읽히는지, 협탁등 높이가 models의 등 갓과 맞는지, 좌표의 외곽 포함 대조이며 unverified다.

## 욕실과 파우더룸의 세면등 {#interior-baths}
<!--
@evidence principles/core/common.md#scope-preservation 파우더룸·두 욕실의 세면등 세 개와 욕실 천장등 두 개를 맡는다.
@evidence principles/core/common.md#substantive-completion 세면등 좌표와 바닥 위 2.00 m, 돌출 0.10 m 이하, 3,000 K 20 cd, 천장등 2,700 K 50 cd, 켜짐을 정한다.
@evidence principles/core/common.md#declared-basis 파우더룸 조명은 powder 설정, 세면 위치·거울 띠는 spaces 기구 사용 H2에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 위생실 설정이 조명의 존재만 정한 데 비해 세면등·천장등 좌표와 거울 띠 위 높이를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 거울·세면대는 spaces 예약과 models에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 세면등 위치는 세면 예약과 벽면, 욕조 욕실은 거울 띠 Y = [4.16, 4.96] 위로 유도한다.
@evidence principles/design/systems.md#system-verification-address 세면등이 거울 위에 있고 거울 면과 겹치지 않는지, 외곽 포함 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work powder 설정과 세 위생실 기구 예약을 대조했고 벽등이 거울 띠 위와 사용 바닥 머리 높이 밖에 들어 부모 수정이 없었다.
@evidence settings/10-house.md#powder 파우더룸 조명을 세면등과 천장등으로 실현한다.
@evidence spaces/rooms/powder.md#powder-fixture-use 세면대 X = [3.65, 4.25], Z = [-0.70, -0.25] 벽 쪽에 세면등을 둔다.
@evidence spaces/rooms/shower-bath.md#shower-bath-plan 외곽 중심 X = 1.985, Z = -7.43에 천장등을 둔다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 세면장 X = 2.52–3.07, Z = [-6.80, -6.10]의 오른쪽 벽에 세면등을 둔다.
@evidence spaces/rooms/tub-bath.md#tub-bath-plan 외곽 중심 X = 4.36, Z = -6.755에 천장등을 둔다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 세면대 Z = [-5.75, -4.90]와 거울 띠 위 Y = 5.06에 세면등을 둔다.
-->

위생실은 천장등과 세면 거울 위 벽등을 함께 둔다. [파우더룸 세면대](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.70, -0.25] m의 벽 쪽에 `light:powder-room:vanity`를 X = 3.95 m, Z = -0.33 m, Y = 2.00 m에 둔다. [샤워 욕실 세면장](../spaces/rooms/shower-bath.md#shower-fixture-use)은 X = 2.52 m부터 오른쪽 안쪽 면 X = 3.07 m까지, Z = [-6.80, -6.10] m이므로 `light:shower-bathroom:vanity`를 X = 2.99 m, Z = -6.45 m, Y = 5.06 m(2층 바닥 3.06 + 2.00)에 둔다. [욕조 욕실 세면대](../spaces/rooms/tub-bath.md#tub-fixture-use)는 X = 4.95 m부터 오른쪽 안쪽 면 X = 5.50 m까지, Z = [-5.75, -4.90] m이고 거울 띠는 2층 바닥 위 Y = [1.10, 1.90] m, 곧 Y = [4.16, 4.96] m이므로 `light:tub-bathroom:vanity`를 거울 위 X = 5.42 m, Z = -5.325 m, Y = 5.06 m에 둔다. 두 욕실의 천장등 `light:shower-bathroom:ceiling`·`light:tub-bathroom:ceiling`은 [샤워 욕실](../spaces/rooms/shower-bath.md#shower-bath-plan) X = [0.90, 3.07], Z = [-8.80, -6.06] m의 중심 X = 1.985 m, Z = -7.43 m와 [욕조 욕실](../spaces/rooms/tub-bath.md#tub-bath-plan) X = [3.22, 5.50], Z = [-8.80, -4.71] m의 중심 X = 4.36 m, Z = -6.755 m, Y = 5.61 m다. 세면등은 약 3,000 K (1.00, 0.78, 0.55)·20 cd·`range` 2.5 m, 천장등은 2,700 K·50 cd·`range` 5.0 m이며 모두 켜짐이다. 세 세면등의 벽 돌출은 0.10 m 이하이고 발광점은 바닥 위 2.00 m라 세면 앞 사용 바닥 위의 사람 머리와 거울 띠 위에 걸리지 않는다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 세면등이 거울 위에 있고 거울 면과 겹치지 않는지, 파우더룸의 [조명 요구](../settings/10-house.md#powder)가 프레임에서 읽히는지이며 unverified다.

## 차고 천장등 {#interior-garage}
<!--
@evidence principles/core/common.md#scope-preservation 차고 천장등 하나의 위치·색·강도·상태와 차고문 가이드 회피를 맡는다.
@evidence principles/core/common.md#substantive-completion X = 8.60, Z = -4.80, Y = 2.50 m, 4,000 K, 60 cd, range 6.0 m, 켜짐을 정한다.
@evidence principles/core/common.md#declared-basis 높이는 차고 천장 2.55 m, 회피는 garage-ceiling-closure의 가이드 예약에서 유도한다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 차고 공간 owner가 외곽과 가이드 예약만 정한 데 비해 광원 좌표와 1.40 m 회피 여유를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 차고문·가이드·선반은 spaces·models에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 가이드 예약 Z = [-3.40, -0.55]의 뒤쪽 끝과 광원 Z를 비교한다.
@evidence principles/design/systems.md#system-verification-address 광원 Z가 가이드 예약 밖인지의 대조와 머드룸을 통한 차고 프레임이 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work 차고 외곽, 천장 datum, 가이드 예약을 대조했고 광원이 예약 밖에 들어 부모 수정이 없었다.
@evidence spaces/00-building.md#attached-garage-extent 차고 안쪽 X = [5.75, 11.45], Z = [-6.45, -0.55] 안에 둔다.
@evidence spaces/01-storeys.md#ground-threshold-datums 차고 천장 Y = 2.55 m에서 Y = 2.50 m를 유도한다.
@evidence spaces/09-ceiling-assembly.md#garage-ceiling-closure 가이드 예약 Z = [-3.40, -0.55]보다 1.40 m 뒤에 둔다.
@evidence spaces/rooms/garage-interior.md#garage-interior-plan garage 방 id를 광원 소속으로 쓴다.
@evidence spaces/rooms/garage-interior.md#garage-storage-use 후벽 선반·작업대 깊이와 겹치지 않음을 대조한다.
-->

[차고 내부](../spaces/rooms/garage-interior.md#garage-interior-plan)는 [차고 천장 Y = 2.55 m](../spaces/01-storeys.md#ground-threshold-datums)의 평판형 `light:garage:ceiling` 하나로 밝히며 [차고 외곽](../spaces/00-building.md#attached-garage-extent)의 안쪽 X = [5.75, 11.45], Z = [-6.45, -0.55] m 중 X = 8.60 m, Z = -4.80 m, Y = 2.50 m에 둔다. [차고문 이동 구역 위의 천장](../spaces/09-ceiling-assembly.md#garage-ceiling-closure)이 예약한 가이드·문짝 구역은 X = [6.00, 11.20], Y = [2.15, 2.50], Z = [-3.40, -0.55] m이다. 광원은 그 뒤쪽 끝 Z = -3.40 m보다 1.40 m 뒤에 있어 올라간 문짝과 레일 위에 놓이지 않고 문짝이 빛을 가리지 않는다. [후벽 선반과 작업대](../spaces/rooms/garage-interior.md#garage-storage-use)는 후벽 깊이에만 있으므로 천장 평판과 겹치지 않는다. 약 4,000 K (1.00, 0.85, 0.70)·60 cd·`range` 6.0 m, 켜짐이다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 광원 Z가 가이드 예약 Z = [-3.40, -0.55] m 밖인지의 산출물 대조와 머드룸을 통한 차고 내부 프레임이며 unverified다.
