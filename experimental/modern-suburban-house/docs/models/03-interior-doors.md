# 실내 문짝과 문틀

## 실내 문의 부재 계층과 치수 {#interior-door-members}
<!--
@evidence principles/core/common.md#scope-preservation 실내 문 11개의 공유 원형, 문설주 0.03 m, 문짝 0.04 m, 문설주 깊이, casing, 패널, 손잡이, UV와 회전 반경을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 순폭 = 거친 폭-0.10으로 모든 목표와 같고, 문짝 높이 2.16 m, 회전 반경 0.89·0.94·0.99 m, 손잡이 0.95 m를 산출한다.
@evidence principles/core/common.md#declared-basis 목표는 각 room plan H2, 칸막이 0.15 m와 차고 공유 벽 0.25 m는 room owner와 spaces/00-building.md#attached-garage-extent, 패널문은 settings/10-house.md#openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation room owner들의 유효 폭 목표를 공통 차이 0.10 m를 채우는 문설주·문짝 두께 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract door→jamb·casing·hinge-pivot→leaf·handle 계층을 정한다.
@evidence principles/design/models.md#spatial-convention 원점 면을 열림 쪽 벽면으로 두어 열림이 항상 국소 +Z라고 적는다.
@evidence principles/design/models.md#reviewable-structure 문설주 면 단면에서 순폭을 재어 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 흰 패널문을 오목 패널 두 개와 casing 0.07 m로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion 문설주 깊이 층과 순폭 척도를 정한다.
@evidence spaces/00-building.md#attached-garage-extent 차고 공유 벽 X = [5.50, 5.75] m를 laundry-garage-door 문설주 깊이 0.25 m로 소비한다.
@evidence settings/10-house.md#openings 흰 실내 문선과 패널문을 casing 0.07 m와 오목 패널 두 개로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 거친 폭에서 문설주 2×0.03 m와 문짝 0.04 m를 빼 11개 문의 순폭이 각 목표와 같음을 산술로 보인다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work room owner들의 개구부와 목표를 그대로 소비했고 세탁실 벽 두께는 00-building 차고 외곽으로 확정해 부모 수정이 없었다.
@evidence spaces/07-boundary-assembly.md#interior-boundary-ownership 방 사이 벽을 한 벽체로 두는 결정을 문설주 한 부재가 그 벽 두께 전체를 덮는 근거로 소비한다.
@evidence settings/10-house.md#upper-hall 레퍼런스 05의 흰 문선과 문짝을 상층 복도 문 다섯 개의 casing 0.07 m와 오목 패널 문짝으로 소비한다.
-->

실내 문 11개는 한 원형을 공유하고 [공통 국소 좌표](00-model-frame.md#model-local-frame)를 쓰며 원점 면은 문짝이 열리는 쪽 벽면이다. 모든 거친 개구부 높이는 2.20 m이고 폭은 0.95–1.05 m이며, 각 room owner가 정한 유효 폭 목표는 모두 거친 폭보다 0.10 m 작다. 이 공통 차이를 모델 결정의 근거로 삼아 좌우 문설주의 개구부 쪽 면 폭을 0.03 m, 문짝 두께를 0.04 m로 택한다. 90° 열림에서 순폭은 거친 폭 - 2 × 0.03 - 0.04로 정확히 각 목표와 같다. 문짝 폭은 거친 폭 - 0.06 m, 문짝 높이는 거친 높이 - 0.03 m 머리 문설주 - 0.01 m 바닥 틈으로 2.16 m다. 문설주 깊이는 개구부를 소유한 벽의 두께다. 실내 칸막이의 문설주 깊이는 room owner가 제공하는 벽 두께 0.15 m이고, [세탁실–차고 문](../spaces/rooms/laundry.md#laundry-plan)만 [차고 공유 벽](../spaces/00-building.md#attached-garage-extent)의 두께 0.25 m를 쓴다. 각 문 world transform은 owner의 개구부 좌표에서 계산한다.

계층은 `door` 아래 `jamb`(좌·우·머리), 양쪽 벽면의 `casing`, 그리고 경첩 축 노드 `hinge-pivot` 아래 `leaf`, `handle`로 둔다. casing은 [settings 개구부](../settings/10-house.md#openings)의 흰 실내 문선을 위해 벽면에서 0.015 m 돌출하는 폭 0.07 m 띠로 택한다. 돌출은 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 trim이 실제 돌출과 음영으로 접합을 설명한다는 조건에서, 폭은 [06의 외부 trim 상한 0.10 m](../spaces/06-openings.md#external-opening-interface)보다 좁게 두어 실내 문선이 외부 trim보다 가벼운 위계로 읽히게 하는 모델 결정이다. leaf는 [settings 개구부](../settings/10-house.md#openings)가 레퍼런스 03–05에서 채택한 흰 패널문을 위해 위아래 두 개의 오목 패널을 가지며 패널은 문짝 면에서 0.008 m 들어간다. 문짝 아래끝은 바닥 위 0.01 m, 두 패널의 로컬 높이 범위는 바닥 위 [0.18, 0.86]·[0.98, 1.98] m이고 양옆에서는 문짝 폭보다 0.12 m씩 좁혀 문짝 폭 W에 대해 패널 폭 W − 0.24 m로 정한다. 두 패널 사이 0.12 m 띠와 위 0.19 m 머리 띠가 남는다. 패널 바닥과 네 챌면의 id는 `leaf-panel`이며 앞뒤의 나머지 면과 네 두께 면은 `leaf`다. 패널 수 둘은 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 실내 threshold view(FOV 60°)에서 문짝이 평판이 아닌 패널문으로 읽히는 가장 단순한 분할로 택한 모델 결정이다. 문짝 면은 평면 법선과 문짝 국소 X·Y에 정렬한 미터 단위 UV를 가져 materials가 칠 마감이나 결을 같은 방향으로 바인딩할 수 있다. 열림 회전 반경은 문짝 폭과 같아 거친 폭 0.95·1.00·1.05 m 문에서 각각 0.89·0.94·0.99 m이고 손잡이는 문짝 가장자리 안쪽이라 반경을 늘리지 않는다. 손잡이는 레퍼런스 05의 둥근 검은 손잡이를 채택한 지름 0.05 m 구형 knob 둘과 지름 0.065 m·두께 0.006 m 원형 받침 둘로, 바닥 위 0.95 m(사용 프로필 점유체 높이 1.90 m의 절반으로 성인과 자녀 모두의 손 높이 범위 안에 두는 모델 결정), 경첩 반대편 문짝 가장자리에서 0.07 m 안쪽에 두고 문짝 양면에서 각각 0.055 m 돌출한다. 경첩은 문짝 하단 위 0.20·1.05·1.90 m 중심의 지름 0.018 m·길이 0.08 m 원통 knuckle 셋이며 표면 id는 `hinge`다. 손잡이는 90° 열림에서 문짝의 자유단에 있어 문설주 면의 순폭 단면 안에 들어오지 않는다. 소스 owner는 `src/models/interior-door.ts`이며 순폭은 문설주 면 단면에서 측정한다.

## 실내 문의 경첩 배정과 기준 상태 {#interior-door-hinges}
<!--
@evidence principles/core/common.md#scope-preservation hinge-pivot 위치, 0~π/2 rad 범위, 기준 상태 π/2 열림, 11개 문의 경첩 쪽과 열림 방향, 좌우 거울 변형 두 가지를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 경첩 축을 경첩 쪽 문설주 안쪽 모서리와 열림 쪽 벽면의 수직선으로 정하고 11개 문 각각의 경첩 쪽을 열거한다.
@evidence principles/core/common.md#declared-basis 경첩 쪽·열림 방향은 각 room plan H2, 기준 열림은 settings/10-house.md#openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 '문은 기준 상태에서 통행이 읽히게 연다'를 π/2 rad 기준 상태로 바꾼다.
@evidence principles/design/models.md#representation-contract 경첩 쪽을 국소 -X 또는 +X로 두는 거울 변형 두 가지로 계층을 한정한다.
@evidence principles/design/models.md#spatial-convention 열림 방향을 항상 국소 +Z로 적는다.
@evidence principles/design/models.md#reviewable-structure 각 방 threshold view에서 열린 문짝이 문 앞 비움 구역을 침범하는지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 경첩 배치라는 관찰 가능한 결정만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 관절 인터페이스와 기준 상태를 모든 실내 문에 정한다.
@evidence obligations/design/models.md#articulation-ownership 실내 문 hinge-pivot의 0~π/2 rad 회전을 유일한 motion 인터페이스로, 기준 상태를 π/2 열림으로 정한다.
@evidence settings/10-house.md#openings 실내 문을 기준 상태에서 통행이 읽히게 연다는 조건을 π/2 rad 기준 상태로 소비한다.
@evidence spaces/rooms/living.md#living-plan entry-living-door의 -Z 문설주, 거실 쪽 -X 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/powder.md#powder-plan service-powder-door의 -Z 문설주, +X 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/laundry.md#laundry-plan service-laundry-door와 laundry-garage-door의 -Z 문설주, 머드룸 안쪽 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/pantry.md#pantry-plan service-pantry-door의 +Z 문설주, +X 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-plan hall-bedroom-two-door의 +X 문설주, +Z 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-plan hall-bedroom-three-door의 -Z 문설주, +X 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/primary.md#primary-plan hall-primary-door의 -X 문설주, -Z 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/shower-bath.md#shower-bath-plan hall-shower-door의 -X 문설주, -Z 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/tub-bath.md#tub-bath-plan hall-tub-door의 +Z 문설주, +X 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidence spaces/rooms/wardrobe.md#primary-wardrobe-plan primary-wardrobe-door의 -Z 문설주, -X 열림을 hinge-pivot 위치와 거울 변형으로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work room owner들의 경첩·열림을 적힌 그대로 소비했고 수정할 부모 결함이 없었다.
-->

레퍼런스 04·05는 흰 패널문과 둥근 검은 손잡이의 실내 인상을 채택한다. 문 높이와 회전 범위는 각 개구부 예약에서 정한다. 이 채택은 아래 원형의 시각적 읽힘만 정하며 외곽·동선의 owner를 바꾸지 않는다.

`hinge-pivot`은 경첩 쪽 문설주 안쪽 모서리와 열림 쪽 벽면이 만나는 수직선이며 motion이 쓸 수 있는 유일한 인터페이스는 이 축의 회전이다. 범위는 0부터 π/2 rad까지이고 [settings 개구부](../settings/10-house.md#openings)가 문을 기준 상태에서 통행이 읽히게 연다고 정하므로 기준 상태는 π/2 rad 열림이다. 경첩 쪽과 열림 방향은 각 room owner를 그대로 받는다. [entry-living-door](../spaces/rooms/living.md#living-plan)는 -Z 문설주에서 거실 쪽 -X, [service-powder-door](../spaces/rooms/powder.md#powder-plan)는 -Z 문설주에서 +X, [service-laundry-door와 laundry-garage-door](../spaces/rooms/laundry.md#laundry-plan)는 둘 다 -Z 문설주에서 머드룸 안쪽, [service-pantry-door](../spaces/rooms/pantry.md#pantry-plan)는 +Z 문설주에서 +X, [hall-bedroom-two-door](../spaces/rooms/bedroom-two.md#bedroom-two-plan)는 +X 문설주에서 +Z, [hall-bedroom-three-door](../spaces/rooms/bedroom-three.md#bedroom-three-plan)는 -Z 문설주에서 +X, [hall-primary-door](../spaces/rooms/primary.md#primary-plan)와 [hall-shower-door](../spaces/rooms/shower-bath.md#shower-bath-plan)는 -X 문설주에서 -Z, [hall-tub-door](../spaces/rooms/tub-bath.md#tub-bath-plan)는 +Z 문설주에서 +X, [primary-wardrobe-door](../spaces/rooms/wardrobe.md#primary-wardrobe-plan)는 -Z 문설주에서 -X로 연다.

모델은 경첩 쪽을 국소 -X 또는 +X 중 하나로 두는 좌우 거울 변형 두 가지만 가지며, 열림 쪽 벽면을 원점 면으로 두므로 열림 방향은 항상 국소 +Z다. 소스 owner는 `src/models/interior-door.ts`이며 각 방 threshold view에서 열린 문짝이 room owner의 문 앞 비움 구역을 침범하지 않는지 검사한다.

## 실내 문의 표면 파티션 {#interior-door-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation 실내 문의 표면 id(jamb·casing·leaf·leaf-panel·handle·hinge)와 벽면별 -a/-b 분리를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문설주와 casing을 양쪽 방 마감 차이 때문에 나누고 leaf는 한 면으로 둔다고 적는다.
@evidence principles/core/common.md#declared-basis jamb·casing·leaf·leaf-panel·handle·hinge id 규칙은 00-model-frame.md#model-surface-partition-naming에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 id 규칙을 실내 문 두 벽면의 분리로 바꾼다.
@evidence principles/design/models.md#representation-contract 실내 문의 안정 표면 소유를 정한다.
@evidence principles/design/models.md#spatial-convention jamb-a/-b와 casing-a/-b는 interior-door-members의 부재 노드에 붙고 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure materials 바인딩 뷰에서 양쪽 casing 경계로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 흰 문선 색은 materials에 두고 경계만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 표면 인터페이스를 모든 실내 문 부재에 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 00의 이름 규칙과 방 owner의 양쪽 마감 배정을 실내 문 -a/-b 분리에 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 04·05는 흰 패널문과 둥근 검은 손잡이의 실내 인상을 채택한다. 문 높이와 회전 범위는 각 개구부 예약에서 정한다. 이 채택은 아래 원형의 시각적 읽힘만 정하며 외곽·동선의 owner를 바꾸지 않는다.

안정 표면 id는 [이름 규칙](00-model-frame.md#model-surface-partition-naming)의 `jamb`, `casing`, `leaf`, `leaf-panel`, `handle`, `hinge`에서 파생한다. 문이 열리는 쪽 방을 A, 반대쪽을 B로 두고 양쪽 벽면에 각각 닿는 문설주 바깥 면은 `jamb-a`·`jamb-b`, 그 사이 개구부 안쪽 두 옆과 머리 챌면은 `jamb-core`다. A·B 쪽 별도 문선의 앞뒤·절단 끝 전체는 각각 `casing-a`·`casing-b`다. 문짝의 두 넓은 면과 위아래·양옆 두께 면은 모두 `leaf`, 오목 패널의 바닥과 네 챌면은 `leaf-panel`, 철물은 `handle`·`hinge`다. 한 완결 면에 id 둘을 겹치지 않는다. 문짝과 문선의 UV는 각 판 왼쪽 아래를 원점으로 국소 X 폭·Y 높이를 미터 단위로, 절단 끝은 길이 방향 U·두께 V로 새로 투영한다. 소스 owner는 `src/models/interior-door.ts`다.

## 실내 문의 표현 한계 {#interior-door-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation 실내 문의 경첩 knuckle 두 개만 만들고 걸쇠·잠금·닫힘 장치와 실내 문턱을 만들지 않는 범위를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 차고 쪽 0.15 m 단차를 문턱이 아니라 세탁실 owner의 바닥 datum으로 해결한다고 적는다.
@evidence principles/core/common.md#declared-basis 상한은 00-model-frame.md#model-representation-ceiling, 단차는 spaces/rooms/laundry.md#laundry-plan에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 상한을 실내 문의 기구 생략 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 실내 문 proxy가 지지하지 않는 관찰을 정한다.
@evidence principles/design/models.md#spatial-convention knuckle 두 개의 위치는 interior-door-hinges의 hinge-pivot을 따르고 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure threshold 관찰에서 문턱 유무와 경첩 표현을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 기구 생략이라는 관찰 가능한 한계를 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 실내 문의 걸쇠·잠금·닫힘 장치와 문턱을 만들지 않는 층으로 명시한다.
@evidence obligations/design/models.md#representation-ceiling 실내 문 계열의 걸쇠·잠금·닫힘 장치 생략을 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work laundry의 문턱 datum을 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 04·05는 흰 패널문과 둥근 검은 손잡이의 실내 인상을 채택한다. 문 높이와 회전 범위는 각 개구부 예약에서 정한다. 이 채택은 아래 원형의 시각적 읽힘만 정하며 외곽·동선의 owner를 바꾸지 않는다.

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 경첩은 눈에 보이는 두 개의 원통 knuckle로만 만들고 걸쇠·잠금·문 닫힘 장치는 만들지 않는다. 문턱은 실내 문에 두지 않으며 차고 쪽 0.15 m 단차는 [세탁실 owner](../spaces/rooms/laundry.md#laundry-plan)가 받은 문턱 datum으로 바닥이 해결한다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 각 방 threshold 관찰이며 실제 렌더는 unverified다.
