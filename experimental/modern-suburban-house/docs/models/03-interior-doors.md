# 실내 문짝과 문틀

## 실내 문의 부재 계층과 치수 {#interior-door-members}

실내 문 11개는 한 원형을 공유하고 [공통 국소 좌표](00-model-frame.md#model-local-frame)를 쓰며 원점 면은 문짝이 열리는 쪽 벽면이다. 모든 거친 개구부 높이는 2.20 m이고 폭은 0.95–1.05 m이며, 각 room owner가 정한 유효 폭 목표는 모두 거친 폭보다 0.10 m 작다. 이 공통 차이를 모델 결정의 근거로 삼아 좌우 문설주의 개구부 쪽 면 폭을 0.03 m, 문짝 두께를 0.04 m로 택한다. 90° 열림에서 순폭은 거친 폭 - 2 × 0.03 - 0.04로 정확히 각 목표와 같다. 문짝 폭은 거친 폭 - 0.06 m, 문짝 높이는 거친 높이 - 0.03 m 머리 문설주 - 0.01 m 바닥 틈으로 2.16 m다. 문설주 깊이는 개구부를 소유한 벽의 두께다. 실내 칸막이는 0.15 m이며 [거실 문](../spaces/rooms/living.md#living-plan) X = [-1.95, -1.80], [주침실 문](../spaces/rooms/primary.md#primary-plan)·[샤워 욕실 문](../spaces/rooms/shower-bath.md#shower-bath-plan) Z = [-6.06, -5.91], [청회색 침실 문](../spaces/rooms/bedroom-three.md#bedroom-three-plan) X = [3.07, 3.22], [옷방 문](../spaces/rooms/wardrobe.md#primary-wardrobe-plan) X = [0.75, 0.90]처럼 room owner가 적은 벽 구간과 같다. [세탁실](../spaces/rooms/laundry.md#laundry-plan)의 `laundry-garage-door`가 놓인 동쪽 공유 벽은 본채 외곽의 0.25 m 외벽 예약과 같은 벽인지 이 초안에서 확인하지 못했으므로 그 벽 owner의 두께를 그대로 받는다.

계층은 `door` 아래 `jamb`(좌·우·머리), 양쪽 벽면의 `casing`, 그리고 경첩 축 노드 `hinge-pivot` 아래 `leaf`, `handle`로 둔다. casing은 [settings 개구부](../settings/10-house.md#openings)의 흰 실내 문선을 위해 벽면에서 0.015 m 돌출하는 폭 0.07 m 띠로 택한다. 돌출은 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 trim이 실제 돌출과 음영으로 접합을 설명한다는 조건에서, 폭은 [06의 외부 trim 상한 0.10 m](../spaces/06-openings.md#external-opening-interface)보다 좁게 두어 실내 문선이 외부 trim보다 가벼운 위계로 읽히게 하는 모델 결정이다. leaf는 settings의 패널문을 위해 위아래 두 개의 오목 패널을 가지며 패널은 문짝 면에서 0.008 m 들어간다. 손잡이는 레버형으로 바닥 위 0.95 m(사용 프로필 점유체 높이 1.90 m의 절반으로 성인과 자녀 모두의 손 높이 범위 안에 두는 모델 결정), 경첩 반대편 문짝 가장자리에서 0.07 m 안쪽에 두고 문짝 면에서 0.06 m 돌출한다. 손잡이는 90° 열림에서 문짝의 자유단에 있어 문설주 면의 순폭 단면 안에 들어오지 않는다. 소스 owner는 `src/models/interior-door.ts`이며 순폭은 문설주 면 단면에서 측정한다.

## 실내 문의 경첩 배정과 기준 상태 {#interior-door-hinges}

`hinge-pivot`은 경첩 쪽 문설주 안쪽 모서리와 열림 쪽 벽면이 만나는 수직선이며 motion이 쓸 수 있는 유일한 인터페이스는 이 축의 회전이다. 범위는 0부터 π/2 rad까지이고 [settings 개구부](../settings/10-house.md#openings)가 문을 기준 상태에서 통행이 읽히게 연다고 정하므로 기준 상태는 π/2 rad 열림이다. 경첩 쪽과 열림 방향은 각 room owner를 그대로 받는다. [entry-living-door](../spaces/rooms/living.md#living-plan)는 -Z 문설주에서 거실 쪽 -X, [service-powder-door](../spaces/rooms/powder.md#powder-plan)는 -Z 문설주에서 +X, [service-laundry-door와 laundry-garage-door](../spaces/rooms/laundry.md#laundry-plan)는 둘 다 -Z 문설주에서 머드룸 안쪽, [service-pantry-door](../spaces/rooms/pantry.md#pantry-plan)는 +Z 문설주에서 +X, [hall-bedroom-two-door](../spaces/rooms/bedroom-two.md#bedroom-two-plan)는 +X 문설주에서 +Z, [hall-bedroom-three-door](../spaces/rooms/bedroom-three.md#bedroom-three-plan)는 -Z 문설주에서 +X, [hall-primary-door](../spaces/rooms/primary.md#primary-plan)와 [hall-shower-door](../spaces/rooms/shower-bath.md#shower-bath-plan)는 -X 문설주에서 -Z, [hall-tub-door](../spaces/rooms/tub-bath.md#tub-bath-plan)는 +Z 문설주에서 +X, [primary-wardrobe-door](../spaces/rooms/wardrobe.md#primary-wardrobe-plan)는 -Z 문설주에서 -X로 연다.

모델은 경첩 쪽을 국소 -X 또는 +X 중 하나로 두는 좌우 거울 변형 두 가지만 가지며, 열림 쪽 벽면을 원점 면으로 두므로 열림 방향은 항상 국소 +Z다. 소스 owner는 `src/models/interior-door.ts`이며 각 방 threshold view에서 열린 문짝이 room owner의 문 앞 비움 구역을 침범하지 않는지 검사한다.

## 실내 문의 표면 파티션 {#interior-door-surfaces}

안정 표면 id는 [이름 규칙](00-model-frame.md#model-surface-partition-naming)의 `jamb`, `casing`, `leaf`, `leaf-panel`, `handle`, `hinge`다. 문설주와 casing은 양쪽 방의 마감이 다를 수 있어 `-a`/`-b`로 벽면별로 나누고 leaf는 한 면으로 둔다. 소스 owner는 `src/models/interior-door.ts`다.

## 실내 문의 표현 한계 {#interior-door-fidelity}

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 경첩은 눈에 보이는 두 개의 원통 knuckle로만 만들고 걸쇠·잠금·문 닫힘 장치는 만들지 않는다. 문턱은 실내 문에 두지 않으며 차고 쪽 0.15 m 단차는 [세탁실 owner](../spaces/rooms/laundry.md#laundry-plan)가 받은 문턱 datum으로 바닥이 해결한다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 각 방 threshold 관찰이며 실제 렌더는 unverified다.
