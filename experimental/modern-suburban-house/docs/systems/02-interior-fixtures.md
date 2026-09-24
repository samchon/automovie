# 실내 기구

## 공용부의 섬 pendant와 식탁등 {#interior-common-pendants}

[공용부](../spaces/rooms/common.md#common-room-plan)는 완전 높이 칸막이 없이 가구와 조명으로 기능을 나누므로 매달린 기구 두 종류가 주방과 식사 구역을 구분한다. 섬 pendant는 point 광원 `light:kitchen-dining-family:island-pendant-1`·`-2`이고 [섬 예약](../spaces/rooms/common.md#common-island-reservation) X = [-3.65, -2.60], Z = [-8.70, -6.45] m의 중심선 X = -3.125 m, Z = -8.10·-7.05 m, 발광점 Y = 1.95 m에 둔다. 식탁등은 `light:kitchen-dining-family:dining-pendant`이며 [식탁 상판](../spaces/rooms/common.md#common-dining-reservation) X = [-0.35, 1.35], Z = [-8.40, -7.50] m의 중심 X = 0.50 m, Z = -7.95 m, Y = 1.55 m에 둔다. 섬 갓의 평면 지름 상한 0.30 m는 X = [-3.275, -2.975] m로 섬 몸체 안에 들고, 스툴 사용 점유(섬 동쪽 끝부터 X = -1.65 m)와 서쪽 작업 통로(X < -3.65 m) 위에 걸리지 않는다. 식탁 갓의 지름 상한 0.50 m는 X = [0.25, 0.75], Z = [-8.20, -7.70] m로 상판 안이며 식탁 오른쪽·뒤쪽의 [공용 동선](../spaces/rooms/common.md#common-clear-routes)의 머리 공간을 침범하지 않는다. 세 광원 모두 약 2,700 K (1.00, 0.72, 0.45), `range` 4.0 m, `intensity` 섬 각 40 cd·식탁 60 cd이고 리뷰 프레임에서 켜짐이다. 강도는 [고정 노출](01-daylight.md#daylight-sky-fill) 아래에서 창 빛과 함께 따뜻한 웅덩이가 읽히도록 이 branch가 택한 값이다. 갓과 줄의 geometry는 models, 배치는 instances가 이 좌표를 소비한다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 03 공용부 프레임에서 섬과 식탁 위 두 빛 웅덩이가 따로 읽히는지, 갓 평면 외곽이 섬·상판 밖으로 나가거나 동선 예약과 겹치는지의 산출물 대조이며 모두 unverified다.

## 1층 방과 통로의 천장등 {#interior-ground-ceiling}

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

계단은 [중간참](../spaces/02-stair.md#stair-reservation) X = [-1.80, -0.65], Z = [-4.56, -3.41] m(Y = 1.36 m) 위의 [2층 완성 천장 Y = 5.66 m](../spaces/01-storeys.md#storey-datums)에 평판형 `light:main-stair:landing-ceiling`을 X = -1.225 m, Z = -3.985 m, Y = 5.61 m에 둔다. 중간참에서 4.25 m 위이므로 [계단 머리 공간 2.00 m](../spaces/01-storeys.md#storey-datums)를 침범하지 않는다. [2층 복도](../spaces/rooms/upper-hall.md#upper-hall-plan)는 팔 X = [-3.20, 3.07], Z = [-5.91, -4.71] m의 중심 X = -0.065 m, Z = -5.31 m와 도착 부분 X = [1.87, 3.07], Z = [-4.71, -3.41] m의 중심 X = 2.47 m, Z = -4.06 m에 평판형 `light:upper-hall:arm-ceiling`·`light:upper-hall:arrival-ceiling`을 Y = 5.61 m로 둔다. 모두 point, 약 2,700 K, 50 cd, `range` 5.0 m, 켜짐이다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 05 복도/계단참 프레임에서 계단참과 복도 두 팔이 끊김 없이 읽히는지와 좌표의 외곽 포함 대조이며 unverified다.

## 침실과 옷방의 천장등과 협탁등 {#interior-bedrooms}

세 침실과 옷방은 2층 천장 Y = 5.61 m의 평판형 천장등을 가진다. [올리브 침실](../spaces/rooms/bedroom-two.md#bedroom-two-plan)은 X = [-5.50, -1.95], Z = [-4.56, -0.25] m의 중심 X = -3.725 m, Z = -2.405 m, [청회색 침실](../spaces/rooms/bedroom-three.md#bedroom-three-plan)은 앞쪽 직사각 부분 X = [-0.50, 5.50], Z = [-2.51, -0.25] m의 중심 X = 2.50 m, Z = -1.38 m, [주침실](../spaces/rooms/primary.md#primary-plan)은 뒤쪽 본체 X = [-5.50, 0.75], Z = [-10.45, -6.06] m의 중심 X = -2.375 m, Z = -8.255 m, [옷방](../spaces/rooms/wardrobe.md#primary-wardrobe-plan)은 X = [0.90, 5.50], Z = [-10.45, -8.95] m의 중심 X = 3.20 m, Z = -9.70 m다. 옷방 좌표는 [후면 옷걸이](../spaces/rooms/wardrobe.md#wardrobe-storage-use) 깊이 Z = [-10.45, -9.90] m 밖이다. 천장등 id는 `light:bedroom-two:ceiling`, `light:bedroom-three:ceiling`, `light:primary-bedroom:ceiling`, `light:primary-wardrobe:ceiling`이다. 협탁등은 [주침실 설정](../settings/10-house.md#primary-bedroom)의 양옆 조명과 [올리브 침실](../settings/10-house.md#bedroom-two)·[청회색 침실](../settings/10-house.md#bedroom-three)의 협탁/등을 실현하는 point 광원이며 각 협탁 예약의 평면 중심, 방 표가 정한 등 포함 높이에서 0.15 m 내린 갓 안쪽에 둔다. [올리브 침실 협탁](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-3.95, -3.50], Z = [-4.50, -4.05] m(등 포함 1.05 m)의 `light:bedroom-two:nightstand-lamp`는 X = -3.725 m, Z = -4.275 m, Y = 3.96 m다. [청회색 침실 협탁](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.05, 1.50], Z = [-3.10, -2.65] m(등 포함 1.05 m)의 `light:bedroom-three:nightstand-lamp`는 X = 1.275 m, Z = -2.875 m, Y = 3.96 m다. [주침실의 두 협탁](../spaces/rooms/primary.md#primary-furniture-use) X = [0.15, 0.65], Z = [-9.15, -8.65]·[-7.05, -6.55] m(등 포함 1.10 m)의 `light:primary-bedroom:nightstand-lamp-rear`·`-front`는 X = 0.40 m, Z = -8.90·-6.80 m, Y = 4.01 m다. 등 갓과 몸체를 정할 models 문서는 아직 없으므로 이 높이는 spaces 표의 등 포함 높이에만 의존하며, 침실 기구 models owner가 생기면 그 갓 중심과 대조한다. 천장등은 2,700 K·50 cd·`range` 5.0 m, 협탁등은 약 2,400 K (1.00, 0.66, 0.38)·8 cd·`range` 2.5 m이며 모두 켜짐이다. 모든 기구가 천장 평판이거나 협탁 위이므로 침대·책상 의자·옷장 사용 예약 위에 매달린 몸체가 없다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 02·05 프레임에서 협탁등이 침대 옆에 따로 읽히는지, 협탁등 높이가 models의 등 갓과 맞는지, 좌표의 외곽 포함 대조이며 unverified다.

## 욕실과 파우더룸의 세면등 {#interior-baths}

위생실은 천장등과 세면 거울 위 벽등을 함께 둔다. [파우더룸 세면대](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.70, -0.25] m의 벽 쪽에 `light:powder-room:vanity`를 X = 3.95 m, Z = -0.33 m, Y = 2.00 m에 둔다. [샤워 욕실 세면장](../spaces/rooms/shower-bath.md#shower-fixture-use)은 X = 2.52 m부터 오른쪽 안쪽 면 X = 3.07 m까지, Z = [-6.80, -6.10] m이므로 `light:shower-bathroom:vanity`를 X = 2.99 m, Z = -6.45 m, Y = 5.06 m(2층 바닥 3.06 + 2.00)에 둔다. [욕조 욕실 세면대](../spaces/rooms/tub-bath.md#tub-fixture-use)는 X = 4.95 m부터 오른쪽 안쪽 면 X = 5.50 m까지, Z = [-5.75, -4.90] m이고 거울 띠는 2층 바닥 위 Y = [1.10, 1.90] m, 곧 Y = [4.16, 4.96] m이므로 `light:tub-bathroom:vanity`를 거울 위 X = 5.42 m, Z = -5.325 m, Y = 5.06 m에 둔다. 두 욕실의 천장등 `light:shower-bathroom:ceiling`·`light:tub-bathroom:ceiling`은 [샤워 욕실](../spaces/rooms/shower-bath.md#shower-bath-plan) X = [0.90, 3.07], Z = [-8.80, -6.06] m의 중심 X = 1.985 m, Z = -7.43 m와 [욕조 욕실](../spaces/rooms/tub-bath.md#tub-bath-plan) X = [3.22, 5.50], Z = [-8.80, -4.71] m의 중심 X = 4.36 m, Z = -6.755 m, Y = 5.61 m다. 세면등은 약 3,000 K (1.00, 0.78, 0.55)·20 cd·`range` 2.5 m, 천장등은 2,700 K·50 cd·`range` 5.0 m이며 모두 켜짐이다. 세 세면등의 벽 돌출은 0.10 m 이하이고 발광점은 바닥 위 2.00 m라 세면 앞 사용 바닥 위의 사람 머리와 거울 띠 위에 걸리지 않는다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 세면등이 거울 위에 있고 거울 면과 겹치지 않는지, 파우더룸의 [조명 요구](../settings/10-house.md#powder)가 프레임에서 읽히는지이며 unverified다.

## 차고 천장등 {#interior-garage}

[차고 내부](../spaces/rooms/garage-interior.md#garage-interior-plan)는 [차고 천장 Y = 2.55 m](../spaces/01-storeys.md#ground-threshold-datums)의 평판형 `light:garage:ceiling` 하나로 밝히며 [차고 외곽](../spaces/00-building.md#attached-garage-extent)의 안쪽 X = [5.75, 11.45], Z = [-6.45, -0.55] m 중 X = 8.60 m, Z = -4.80 m, Y = 2.50 m에 둔다. [차고문 이동 구역 위의 천장](../spaces/09-ceiling-assembly.md#garage-ceiling-closure)이 예약한 가이드·문짝 구역은 X = [6.00, 11.20], Y = [2.15, 2.50], Z = [-3.40, -0.55] m이다. 광원은 그 뒤쪽 끝 Z = -3.40 m보다 1.40 m 뒤에 있어 올라간 문짝과 레일 위에 놓이지 않고 문짝이 빛을 가리지 않는다. [후벽 선반과 작업대](../spaces/rooms/garage-interior.md#garage-storage-use)는 후벽 깊이에만 있으므로 천장 평판과 겹치지 않는다. 약 4,000 K (1.00, 0.85, 0.70)·60 cd·`range` 6.0 m, 켜짐이다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 광원 Z가 가이드 예약 Z = [-3.40, -0.55] m 밖인지의 산출물 대조와 머드룸을 통한 차고 내부 프레임이며 unverified다.
