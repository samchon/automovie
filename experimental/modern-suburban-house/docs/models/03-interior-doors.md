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
@evidence principles/design/models.md#model-observable-style-basis 실내 문 11개는 한 원형을 공유하고 [공통 국소 좌표](00-model-frame.md#model-local-frame)를 쓰며 원점 면은 문짝이 열리는 쪽 벽면이다. 흰 패널문을 오목 패널 두 개와 casing 0.07 m로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion 문설주 깊이 층과 순폭 척도를 정한다.
@evidence spaces/00-building.md#attached-garage-extent 차고 공유 벽 X = [5.50, 5.75] m를 laundry-garage-door 문설주 깊이 0.25 m로 소비한다.
@evidence settings/10-house.md#openings 흰 실내 문선과 패널문을 casing 0.07 m와 오목 패널 두 개로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 거친 폭에서 문설주 2×0.03 m와 문짝 0.04 m를 빼 11개 문의 순폭이 각 목표와 같음을 산술로 보인다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work spaces/07-boundary-assembly.md#interior-boundary-junctions는 실내 문틀·문짝을 05의 방 owner가 생성한다고 적어 이 원형과 소유가 겹쳤다. 그 부모 H2를 벽 절단·바닥 전환은 spaces, 닫힌 문설주·문선·문짝·철물은 models/03으로 고쳤다. spaces/03-surface-owners.md#interior-surface-handoff의 방 면 owner도 reveal·마감 접면만 검사하고 모델 문짝·창호 메시를 만들지 않도록 명확히 고쳤다. 방별 개구부 좌표와 순폭 목표는 유지했다.
@evidence spaces/03-surface-owners.md#interior-surface-handoff 방 owner의 reveal·마감 접면과 이 원형의 닫힌 문틀·문짝을 같은 void에 맞추고 같은 면을 복제하지 않는다.
@evidence spaces/07-boundary-assembly.md#interior-boundary-ownership 방 사이 벽을 한 벽체로 두는 결정을 문설주 한 부재가 그 벽 두께 전체를 덮는 근거로 소비한다.
@evidence spaces/07-boundary-assembly.md#interior-boundary-junctions 방 owner의 벽 절단과 바닥 전환을 입력으로 받고 닫힌 문설주·문선·문짝·경첩·손잡이만 모델 원형으로 생산한다.
@evidence settings/10-house.md#upper-hall 레퍼런스 05의 흰 문선과 문짝을 상층 복도 문 다섯 개의 casing 0.07 m와 오목 패널 문짝으로 소비한다.
-->

이 원형은 [실내 벽 접합](../spaces/07-boundary-assembly.md#interior-boundary-junctions)의 방 owner가 만든 벽 절단·reveal과 바닥 전환을 입력으로 받는다. 닫힌 문설주·문선·문짝·경첩·손잡이는 `src/models/interior-door.ts`만 만들며 두 방의 spaces source는 복제하지 않는다.

실내 문 11개는 한 원형을 공유하고 [공통 국소 좌표](00-model-frame.md#model-local-frame)를 쓰며 원점 면은 문짝이 열리는 쪽 벽면이다. 모든 거친 개구부 높이는 2.20 m이고 폭은 0.95–1.05 m이며, 각 room owner가 정한 유효 폭 목표는 모두 거친 폭보다 0.10 m 작다. 이 공통 차이를 모델 결정의 근거로 삼아 좌우 문설주의 개구부 쪽 면 폭을 0.03 m, 문짝 두께를 0.04 m로 택한다. 90° 열림에서 순폭은 거친 폭 - 2 × 0.03 - 0.04로 정확히 각 목표와 같다. 문짝 폭은 거친 폭 - 0.06 m, 문짝 높이는 거친 높이 - 0.03 m 머리 문설주 - 0.01 m 바닥 틈으로 2.16 m다. 문설주 깊이는 개구부를 소유한 벽의 두께다. 실내 칸막이의 문설주 깊이는 room owner가 제공하는 벽 두께 0.15 m이고, [세탁실–차고 문](../spaces/rooms/laundry.md#laundry-plan)만 [차고 공유 벽](../spaces/00-building.md#attached-garage-extent)의 두께 0.25 m를 쓴다. 각 문 world transform은 owner의 개구부 좌표에서 계산한다.

계층은 `door` 아래 `jamb`(좌·우·머리), 양쪽 벽면의 `casing`, 그리고 경첩 축 노드 `hinge-pivot` 아래 `leaf`, `handle`로 둔다. casing은 [settings 개구부](../settings/10-house.md#openings)의 흰 실내 문선을 위해 벽면에서 0.015 m 돌출하는 폭 0.07 m 띠로 택한다. 돌출은 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 trim이 실제 돌출과 음영으로 접합을 설명한다는 조건에서, 폭은 [06의 외부 trim 상한 0.10 m](../spaces/06-openings.md#external-opening-interface)보다 좁게 두어 실내 문선이 외부 trim보다 가벼운 위계로 읽히게 하는 모델 결정이다. leaf는 [settings 개구부](../settings/10-house.md#openings)가 레퍼런스 03–05에서 채택한 흰 패널문을 위해 위아래 두 개의 오목 패널을 가지며 패널은 문짝 면에서 0.008 m 들어간다. 문짝 아래끝은 바닥 위 0.01 m, 두 패널의 로컬 높이 범위는 바닥 위 [0.18, 0.86]·[0.98, 1.98] m이고 양옆에서는 문짝 폭보다 0.12 m씩 좁혀 문짝 폭 W에 대해 패널 폭 W − 0.24 m로 정한다. 두 패널 사이 0.12 m 띠와 위 0.19 m 머리 띠가 남는다. 패널 바닥과 네 챌면의 id는 `leaf-panel`이며 앞뒤의 나머지 면과 네 두께 면은 `leaf`다. 패널 수 둘은 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 실내 threshold view(FOV 60°)에서 문짝이 평판이 아닌 패널문으로 읽히는 가장 단순한 분할로 택한 모델 결정이다. 문짝 면은 평면 법선과 문짝 국소 X·Y에 정렬한 미터 단위 UV를 가져 materials가 칠 마감이나 결을 같은 방향으로 바인딩할 수 있다. 열림 회전 반경은 문짝 폭과 같아 거친 폭 0.95·1.00·1.05 m 문에서 각각 0.89·0.94·0.99 m이고 손잡이는 문짝 가장자리 안쪽이라 반경을 늘리지 않는다. 기본형 일곱 문의 손잡이는 레퍼런스 05의 둥근 검은 손잡이를 채택한 지름 0.05 m 구형 knob 둘과 지름 0.065 m·두께 0.006 m 원형 받침 둘로, 바닥 위 0.95 m(사용 프로필 점유체 높이 1.90 m의 절반으로 성인과 자녀 모두의 손 높이 범위 안에 두는 모델 결정), 경첩 반대편 문짝 가장자리에서 0.07 m 안쪽에 두고 문짝 양면에서 각각 0.055 m 돌출한다. 경첩은 문짝 하단 위 0.20·1.05·1.90 m 중심의 지름 0.018 m·길이 0.08 m 원통 knuckle 셋이며 표면 id는 `hinge`다. 손잡이는 90° 열림에서 문짝의 자유단에 있어 문설주 면의 순폭 단면 안에 들어오지 않는다. 소스 owner는 `src/models/interior-door.ts`이며 순폭은 문설주 면 단면에서 측정한다.

문선의 기본 위치는 11개 문의 개구부 국소 좌표로 결정하되, 아래 욕조 욕실 문 한 곳의 모서리 쪽 판만 벽 경계에서 잘라 낸다. 거친 개구부 왼쪽 아래를 (X,Y)=(0,0), 폭을 W=0.95·1.00·1.05 m 중 해당 방의 값으로 둔다. 열림 쪽 A와 반대쪽 B의 완성 벽면 각각에서 `casing-a`·`casing-b` 좌우 세로 판은 X=[−0.07,0]·[W,W+0.07] m, Y=[0,2.20] m이고 머리 판은 X=[−0.07,W+0.07] m, Y=[2.20,2.27] m다. 세 판의 뒷면은 각 방의 완성 벽면에 있고 앞면은 그 방으로 0.015 m 돌출한다. 세로 두 발은 각 방 완성 바닥에 닿고 문턱판은 개구부 폭 안에서만 공간 owner가 만든다. 머리 판은 세로 판 윗면에 직각으로 접하며 부피를 복제하지 않는다. 차고 공유 벽에서는 열림 쪽 세탁실 `casing-a`의 +Z 세로 판이 [laundry-garage-door](../spaces/rooms/laundry.md#laundry-plan)의 월드 X=[5.485,5.50], Z=[−3.35,−3.28], Y=[0,2.20] m를 차지한다. 반대쪽 차고 `casing-b`의 바닥 끝은 차고 완성 바닥 Y=−0.15 m이며 그 판만 높이 2.35 m로 연장해 문 머리 Y=2.20 m에서 끝난다. 세탁기·상판·상부장 홈은 세탁실 쪽 닫힌 체적을 비운다. 팬트리 선반은 별도 service-pantry-door 문선의 인접 원형이므로 그 선반의 절개는 팬트리 선반 H2가 정한다.

hall-tub-door는 복도 쪽 −Z 모서리에서 다음 샤워 욕실 칸막이의 시작 Z=−5.91 m까지 0.05 m만 비어 있다. 따라서 그 문의 복도 쪽 `casing-b` −Z 세로 판은 세계 Z=[−5.91,−5.86]·X=[3.055,3.07] m, 상층 바닥 위 Y=[0,2.20] m로 만들고 머리 판도 −Z 끝을 −5.91 m에서 닫는다. 반대 +Z 판은 공통 폭 0.07 m를 유지한다. 두 판의 새 −Z 절단면은 `casing-b`가 덮으며 샤워 칸막이 세계 Z≤−5.91 m와 면으로만 접한다.

팬트리 문 한 개는 [팬트리 작동 예약](../spaces/rooms/pantry.md#pantry-plan)의 문설주·문짝·손잡이 합계 0.08 m를 위해 돌출 손잡이 대신 문짝 양면에 파인 원형 잡이 홈을 쓴다. 지름 0.05 m·깊이 0.008 m의 홈 중심은 바닥 위 0.95 m이고 자유단에서 0.07 m 안쪽이다. 홈 안쪽과 둘레의 id는 `handle`이며 문짝의 외곽을 늘리지 않는다. 문설주 0.03 m + 문짝 두께 0.04 m = 0.07 m로 예약 안에 0.01 m가 남는다. [옷방 문](../spaces/rooms/wardrobe.md#primary-wardrobe-plan)의 둥근 손잡이 돌출은 0.030 m로 줄여 기준 열림의 문짝 넓은 면에서 손잡이 끝이 예약 끝 Z=−0.20 m를 넘지 않게 한다. service-laundry-door와 laundry-garage-door 두 개는 팬트리와 같은 지름 0.05 m·깊이 0.008 m의 파인 원형 잡이 홈을 사용해 기준 열림 때 손잡이가 [머드룸 횡단](../spaces/rooms/laundry.md#laundry-through-route) 안으로 나오지 않게 한다. 나머지 일곱 문은 0.055 m 돌출 둥근 손잡이를 쓴다. 열한 문의 높이·표면 id는 같다.

## 실내 문의 경첩 배정과 기준 상태 {#interior-door-hinges}
<!--
@evidence principles/core/common.md#scope-preservation hinge-pivot 위치, 0~π/2 rad 범위, 기준 상태 π/2 열림, 11개 문의 경첩 쪽과 열림 방향, 좌우 거울 변형 두 가지를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 경첩 축을 경첩 쪽 문설주 안쪽 모서리와 열림 쪽 벽면의 수직선으로 정하고 11개 문 각각의 경첩 쪽을 열거한다.
@evidence principles/core/common.md#declared-basis 경첩 쪽·열림 방향은 각 room plan H2, 기준 열림은 settings/10-house.md#openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 '문은 기준 상태에서 통행이 읽히게 연다'를 π/2 rad 기준 상태로 바꾼다.
@evidence principles/design/models.md#representation-contract 경첩 쪽을 국소 -X 또는 +X로 두는 거울 변형 두 가지로 계층을 한정한다.
@evidence principles/design/models.md#spatial-convention 열림 방향을 항상 국소 +Z로 적는다.
@evidence principles/design/models.md#reviewable-structure 각 방 threshold view에서 열린 문짝이 문 앞 비움 구역을 침범하는지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 05의 열린 방문은 여닫이 부재로 채택한다. 스타일 라벨 없이 경첩 배치라는 관찰 가능한 결정만 정한다.
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
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-living-door의 기준 열림 반경 0.94 m가 spaces/rooms/living.md#living-plan의 종전 0.90 m 예약을 0.04 m 넘어서 부모 예약을 X=[−2.89,−1.95] m로 고쳤다. 다른 열 실내 문의 경첩·열림은 각 room owner를 소비한다.
-->

레퍼런스 05의 열린 방문은 여닫이 부재로 채택한다. 어느 각도에서 멈췄는지는 사진에서 측정하지 않고 방별 회전 예약을 따른다.

`hinge-pivot`은 경첩 쪽 문설주 안쪽 모서리와 열림 쪽 벽면이 만나는 수직선이며 motion이 쓸 수 있는 유일한 인터페이스는 이 축의 회전이다. 범위는 0부터 π/2 rad까지이고 [settings 개구부](../settings/10-house.md#openings)가 문을 기준 상태에서 통행이 읽히게 연다고 정하므로 기준 상태는 π/2 rad 열림이다. 경첩 쪽과 열림 방향은 각 room owner를 그대로 받는다. [entry-living-door](../spaces/rooms/living.md#living-plan)는 -Z 문설주에서 거실 쪽 -X, [service-powder-door](../spaces/rooms/powder.md#powder-plan)는 -Z 문설주에서 +X, [service-laundry-door와 laundry-garage-door](../spaces/rooms/laundry.md#laundry-plan)는 둘 다 -Z 문설주에서 머드룸 안쪽, [service-pantry-door](../spaces/rooms/pantry.md#pantry-plan)는 +Z 문설주에서 +X, [hall-bedroom-two-door](../spaces/rooms/bedroom-two.md#bedroom-two-plan)는 +X 문설주에서 +Z, [hall-bedroom-three-door](../spaces/rooms/bedroom-three.md#bedroom-three-plan)는 -Z 문설주에서 +X, [hall-primary-door](../spaces/rooms/primary.md#primary-plan)와 [hall-shower-door](../spaces/rooms/shower-bath.md#shower-bath-plan)는 -X 문설주에서 -Z, [hall-tub-door](../spaces/rooms/tub-bath.md#tub-bath-plan)는 +Z 문설주에서 +X, [primary-wardrobe-door](../spaces/rooms/wardrobe.md#primary-wardrobe-plan)는 -Z 문설주에서 -X로 연다.

모델은 경첩 쪽을 국소 -X 또는 +X 중 하나로 두는 좌우 거울 변형 두 가지만 가지며, 열림 쪽 벽면을 원점 면으로 두므로 열림 방향은 항상 국소 +Z다. 소스 owner는 `src/models/interior-door.ts`이며 각 방 threshold view에서 열린 문짝이 room owner의 문 앞 비움 구역을 침범하지 않는지 검사한다.

## 실내 문의 표면 파티션 {#interior-door-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation 실내 문의 표면 id(`jamb-a/b/core`·`casing-a/b`·`leaf`·`leaf-panel`·`handle`·`hinge`)와 A/B 벽면별 문설주·문선 분리, 절단 끝의 UV를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문설주와 casing을 양쪽 방 마감 차이 때문에 나누고 leaf는 한 면으로 둔다고 적는다.
@evidence principles/core/common.md#declared-basis jamb·casing·leaf·leaf-panel·handle·hinge id 규칙은 00-model-frame.md#model-surface-partition-naming에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 id 규칙을 실내 문 두 벽면의 분리로 바꾼다.
@evidence principles/design/models.md#representation-contract 실내 문의 안정 표면 소유를 정한다.
@evidence principles/design/models.md#spatial-convention jamb-a/-b와 casing-a/-b는 interior-door-members의 부재 노드에 붙고 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure materials 바인딩 뷰에서 양쪽 casing 경계로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 04·05의 흰 문짝, 챌면, 검은 손잡이가 따로 읽히므로 그 면들을 분리한다. 흰 문선 색은 materials에 두고 경계만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 표면 인터페이스를 모든 실내 문 부재에 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 00의 이름 규칙과 방 owner의 양쪽 마감 배정을 실내 문 -a/-b 분리에 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 04·05의 흰 문짝, 챌면, 검은 손잡이가 따로 읽히므로 그 면들을 분리한다. 나무결 사진을 표면으로 붙이지 않는다.

안정 표면 id는 [이름 규칙](00-model-frame.md#model-surface-partition-naming)의 `jamb`, `casing`, `leaf`, `leaf-panel`, `handle`, `hinge`에서 파생한다. 문이 열리는 쪽 방을 A, 반대쪽을 B로 두고 양쪽 벽면에 각각 닿는 문설주 바깥 면은 `jamb-a`·`jamb-b`, 그 사이 개구부 안쪽 두 옆과 머리 챌면은 `jamb-core`다. A·B 쪽 별도 문선의 앞뒤·절단 끝 전체는 각각 `casing-a`·`casing-b`다. 문짝의 두 넓은 면과 위아래·양옆 두께 면은 모두 `leaf`, 오목 패널의 바닥과 네 챌면은 `leaf-panel`, 철물은 `handle`·`hinge`다. 한 완결 면에 id 둘을 겹치지 않는다. 문짝과 문선의 UV는 각 판 왼쪽 아래를 원점으로 국소 X 폭·Y 높이를 미터 단위로, 절단 끝은 길이 방향 U·두께 V로 새로 투영한다. 소스 owner는 `src/models/interior-door.ts`다.

`jamb-a`·`jamb-b`·`jamb-core`는 해당 세로 문설주의 바닥 끝과 머리 문설주의 왼쪽 끝을 각각 원점으로 부재 길이 U·폭 V를 1 UV/m로 둔다. `casing-a`·`casing-b`도 각 방의 세로 판과 머리 판을 별도 길이 U로 투영한다. `hinge`의 knuckle과 `handle`의 판·막대는 각 부품의 국소 +Z 앞쪽 seam에서 실제 둘레 길이 U·축 길이 V를 시작하며 판에서 원통으로 넘어갈 때 이음을 끊는다. 모든 끝면·뒷면에도 공통 UV 규칙을 적용한다.

## 실내 문의 표현 한계 {#interior-door-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation 실내 문 부재 H2가 정한 경첩 knuckle 셋만 만들고 걸쇠·잠금·닫힘 장치와 실내 문턱을 만들지 않는 범위를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 차고 쪽 0.15 m 단차를 문턱이 아니라 세탁실 owner의 바닥 datum으로 해결한다고 적는다.
@evidence principles/core/common.md#declared-basis 상한은 00-model-frame.md#model-representation-ceiling, 단차는 spaces/rooms/laundry.md#laundry-plan에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 상한을 실내 문의 기구 생략 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 실내 문 proxy가 지지하지 않는 관찰을 정한다.
@evidence principles/design/models.md#spatial-convention knuckle 셋의 높이는 interior-door-members의 문짝 하단 위 0.20·1.05·1.90 m를 따르고 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure threshold 관찰에서 문턱 유무와 경첩 표현을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 기구 생략이라는 관찰 가능한 한계를 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 실내 문의 걸쇠·잠금·닫힘 장치와 문턱을 만들지 않는 층으로 명시한다.
@evidence obligations/design/models.md#representation-ceiling 실내 문 계열의 걸쇠·잠금·닫힘 장치 생략을 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work laundry의 문턱 datum을 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 05의 문짝 패널과 손잡이까지만 형상 목표로 채택한다. 문 속 심재·힌지 나사·도어클로저는 보이는 기능을 늘리지 않아 제외한다.

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 경첩은 [공유 실내 문 부재](#interior-door-members)가 정한 세 개의 원통 knuckle로만 만들고 걸쇠·잠금·문 닫힘 장치는 만들지 않는다. 문턱은 실내 문에 두지 않으며 차고 쪽 0.15 m 단차는 [세탁실 owner](../spaces/rooms/laundry.md#laundry-plan)가 받은 문턱 datum으로 바닥이 해결한다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 각 방 threshold 관찰이며 실제 렌더는 unverified다.
