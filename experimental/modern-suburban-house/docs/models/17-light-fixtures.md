# 빛을 담는 기구 몸체 원형

## 평판 천장등 {#flush-ceiling-fixture}
<!--
@evidence principles/core/common.md#scope-preservation 1층·2층·차고 천장에 배치할 기구 몸체 한 원형과 차고 지름 변형만 맡고 광원 수·강도·위치는 systems와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 보통 지름 0.24 m, 차고 지름 0.40 m, 아래 돌출 0.05 m, 외장과 확산판의 두께·면 id·UV를 정한다.
@evidence principles/core/common.md#declared-basis systems/02-interior-fixtures.md#interior-ground-ceiling 등에서 형상을 models에 맡긴 18개 천장 기구 역할과 spaces 천장면을 확인한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 세대 주택의 납작한 실내 등과 더 큰 차고 등 지름을 나눠 같은 조립 규칙으로 만든다.
@evidence principles/design/models.md#representation-contract 닫힌 16각 외장 링·안쪽 확산판·천장 접합판을 만들고 `fixture-housing`·`fixture-diffuser`로 모든 면을 덮는다. 빛과 전선 내부는 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 국소 원점은 천장 접촉면의 중앙, +Y는 위, +Z는 방 정면이다. 기구는 아래로만 돌출하며 world 배치는 instances가 정한다.
@evidence principles/design/models.md#reviewable-structure 천장 단면에서 돌출 0.05 m와 헤드룸, 실내·차고 정면에서 보통/대형 변형을 비교한다. 실제 프레임은 unverified다.
@evidence principles/design/models.md#model-observable-style-basis 얇은 외장 링과 별도 확산판이 어두운 천장 구멍 대신 실제 기구로 읽히는 형상 근거다. 광학은 materials와 systems가 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 두 지름, 두께, 16각 세그먼트, 모든 면 id와 미터 UV, 원점, 단면 검사를 확정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 천장면과 조명 할당을 그대로 소비하며 기구 두께 때문에 천장이나 방 경계를 수정하지 않는다.
@evidence settings/10-house.md#common-room 공용부와 각 방의 천장 조명 몸체를 구멍이 아닌 실제 부재로 제공한다.
@evidence settings/10-house.md#garage 빈 차고에도 천장등 몸체를 두고 차고문 가이드와 분리한다.
@evidence obligations/design/models.md#addressable-model-decisions 평판 천장등을 매달린 등과 별도 원형으로 두어 크기와 면을 독립 수정한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45° 고정 뷰에서 판 두께와 확산면을 본다.
-->

레퍼런스 04 현관과 05 상층 복도의 얕은 천장등을 채택한다. 방별 광량은 기구 몸체가 아닌 systems가 결정한다.

천장면에 붙는 평판 기구는 [실내 조명 할당](../systems/02-interior-fixtures.md#interior-ground-ceiling)이 넘긴 몸체 원형이다. 반복 수와 위치는 후속 배치가 맡고 빛의 색·강도는 systems가 맡는다. 일반 방은 지름 D = 0.24 m, 차고는 D = 0.40 m다. 국소 원점은 천장 접촉면 중앙이고 +Y가 천장 위쪽이며 기구 전체는 Y = [-0.05, 0] m 안에 든다. 천장 접합판은 지름 0.70D·두께 0.008 m로 Y = [-0.008, 0] m에 두고, 외장 16각 링은 외경 D·내경 D − 0.04 m·높이 0.035 m로 Y = [-0.05, -0.015] m에 둔다. 링 윗면에는 외경 D·두께 0.005 m의 16각 연결판을 Y = [-0.020, -0.015] m에 놓고, 연결판과 접합판 사이에는 지름 0.70D의 16각 목을 Y = [-0.015, -0.008] m에 이어 모든 부재가 닿게 한다. 확산판은 내경에 맞는 16각 원판·두께 0.012 m이고 Y = [-0.05, -0.038] m라 링 아래면과 같은 높이다. 접합판·목·링의 닫힌 모든 면은 `fixture-housing`, 확산판은 `fixture-diffuser`를 부여한다. 위·아래 면 UV는 국소 X·Z, 세로 면은 둘레 거리 U·높이 V를 미터로 둔다. 광원은 기구 중심 안쪽에 systems가 배치하며 전선과 광학 복사는 이 메시의 주장이 아니다. 소스 owner는 `src/models/lighting-fixtures.ts`다. [고정 뷰](00-model-frame.md#model-review-set)의 측면과 실내 관찰에서 판이 천장과 만나는지 확인한다. 실제 렌더는 unverified다.

## 섬과 식탁의 매단 등 {#pendant-fixtures}
<!--
@evidence principles/core/common.md#scope-preservation 섬 두 개와 식탁 한 개의 서로 다른 갓 원형을 맡고 광원·배치·줄 반복은 systems와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 섬 원형 외경 0.28 m·내림 0.80 m, 식탁 원형 외경 0.48 m·내림 1.20 m, 천장 접합판·줄·갓 치수를 정한다.
@evidence principles/core/common.md#declared-basis spaces의 섬과 식탁 상판 및 systems/02-interior-fixtures.md#interior-common-pendants의 광원 역할과 갓 상한을 대조한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 섬은 작은 종형 두 개, 식탁은 넓은 원통형 한 개로 분리해 레퍼런스 03의 두 조명 구역을 형상으로 만든다.
@evidence principles/design/models.md#representation-contract 16각 접합판·닫힌 매달림 줄·두께 있는 갓·안쪽 확산면을 제공하고 `fixture-canopy`·`fixture-stem`·`fixture-shade`·`fixture-diffuser`로 면을 나눈다.
@evidence principles/design/models.md#spatial-convention 원점은 천장 접점 중심, +Y 위, +Z 사용 방향이다. 내림은 원점에서 아래로 재고 world 좌표를 저장하지 않는다.
@evidence principles/design/models.md#reviewable-structure 천장부터 갓 아래까지의 단면, 섬 두 기구와 식탁 한 기구의 정면 구분, 상판 외곽과의 간섭을 검토한다.
@evidence principles/design/models.md#model-observable-style-basis 종형과 원통형 갓의 반지름 프로파일을 수치로 정하며 색과 투과는 materials에 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 두 변형의 모든 반지름·높이·단면·id·UV·원점·검사 주소를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 상판 예약과 천장 높이를 소비하고 갓 지름을 각 사용 상판 안에 두므로 부모 공간 수정을 요구하지 않는다.
@evidence settings/10-house.md#common-room 공용부의 주방과 식당을 조명기구 형상으로 구분한다.
@evidence spaces/rooms/common.md#common-island-reservation 섬 갓 외경 0.28 m를 섬 폭 1.05 m 안에 둔다.
@evidence spaces/rooms/common.md#common-dining-reservation 식탁 갓 외경 0.48 m를 상판 폭 0.90 m 안에 둔다.
@evidence obligations/design/models.md#addressable-model-decisions 두 변형의 갓 프로파일을 평판 천장등과 다른 원형 H2에서 정한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°에서 갓 깊이와 줄 접속을 본다.
-->

[레퍼런스 03의 공용부](../settings/10-house.md#common-room)는 섬 위의 작은 등 둘과 식탁 위의 넓은 등 하나로 기능을 구분한다. 이 H2는 그 두 기구 형상만 소유한다. 원점은 천장 접점 중심, +Y는 위다. 섬 종형은 천장에서 갓 아래까지 0.80 m, 외경 0.28 m다. 식탁 원통형은 내림 1.20 m, 외경 0.48 m다. 두 변형의 천장 접합판은 지름 0.10 m·두께 0.025 m, 줄은 지름 0.012 m의 닫힌 원통이다. 섬 갓은 아래에서 위로 반지름 0.14, 0.12, 0.055 m의 세 16각 링을 각각 갓 아래·위로 0.10·0.22 m에 둔 종형 껍질이며 두께 0.008 m다. 식탁 갓은 반지름 0.24 m·높이 0.20 m의 16각 원통 껍질이고 아래에 두께 0.008 m의 확산 원판이 있다. 갓 윗면·아랫면·두께 면도 닫고 `fixture-shade`, 접합판은 `fixture-canopy`, 줄은 `fixture-stem`, 확산판은 `fixture-diffuser`다. 면 UV는 평면 X·Z 또는 둘레 U·높이 V를 미터로 둔다. 식탁 갓 아래면은 식탁 상판 위 0.80 m, 섬 갓 아래면은 섬 상판 위 1.04 m로 두어 앉은 사람의 머리 공간과 분리한다. 배치와 광원은 instances와 systems가 정한다. 소스 owner는 `src/models/lighting-fixtures.ts`; 실제 점유와 조명 프레임은 unverified다.

## 세면 거울 위 벽등 {#vanity-wall-fixture}
<!--
@evidence principles/core/common.md#scope-preservation 세 위생실의 거울 위 벽등 몸체 한 원형만 맡고 광원과 방별 위치는 systems와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 폭 0.36 m·높이 0.06 m·벽 돌출 0.08 m와 받침·확산봉의 면 id를 정한다.
@evidence principles/core/common.md#declared-basis settings의 위생실 조명 요구와 spaces의 거울 위 빈 벽을 근거로 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 거울 위 짧은 가로 조명을 방별로 같은 원형으로 두어 침실 천장등이나 협탁등과 구별한다.
@evidence principles/design/models.md#representation-contract 닫힌 벽판과 앞쪽 확산봉을 만들고 금속·확산면을 별도 id로 분리하며 광원 자체는 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 원점은 거울 위 벽 접점 중앙, +Z는 방 안쪽, +Y는 위이고 길이는 +X다.
@evidence principles/design/models.md#reviewable-structure 방 안쪽 측면에서 0.08 m 돌출과 거울 비접촉, 정면에서 거울 중앙 정렬을 대조한다.
@evidence principles/design/models.md#model-observable-style-basis 얇은 가로 봉과 양끝 작은 금속 받침의 부피가 거울 위 조명으로 읽히게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 폭·높이·돌출·부품 분할·id·UV·원점·검사 뷰를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 거울 띠와 0.10 m 이내 돌출을 소비하고 위생실 벽·거울 위치를 바꾸지 않는다.
@evidence settings/10-house.md#powder 파우더룸 거울 위 조명 몸체를 제공한다.
@evidence settings/10-house.md#shower-bathroom 샤워 욕실의 세면등 몸체를 제공한다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실의 세면등 몸체를 제공한다.
@evidence obligations/design/models.md#addressable-model-decisions 거울 위 벽등의 돌출·면을 독립 H2로 정한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 거울 위 방 뷰에서 대조한다.
-->

레퍼런스 02·05의 욕실 거울 위 밝은 띠를 세면 벽등으로 채택한다. 사진의 빛 번짐을 기구 형상으로 복제하지 않는다.

세 위생실은 같은 벽등 원형을 거울 위에 쓴다. 원점은 벽 접점 중앙, +Z는 방 안쪽이다. 뒤 받침판은 폭 0.36 m·높이 0.06 m·두께 0.015 m, 양끝 받침은 폭 0.025 m·높이 0.06 m·앞 돌출 0.08 m, 확산봉은 양끝 받침 사이 길이 0.31 m·지름 0.045 m다. 전체 벽 돌출은 0.08 m로 [실내 기구의 0.10 m 상한](../systems/02-interior-fixtures.md#interior-baths) 안이다. 금속 판과 받침 모든 면은 `fixture-housing`, 확산봉 모든 면은 `fixture-diffuser`다. 길이 U·둘레 V를 미터로 제공한다. 빛의 세기와 색은 systems, 위치는 instances가 정한다. 소스 owner는 `src/models/lighting-fixtures.ts`; 거울 간섭과 실제 프레임은 unverified다.

## 포치 문 옆의 벽등 {#porch-wall-sconce}
<!--
@evidence principles/core/common.md#scope-preservation 포치 현관문 옆 벽등 몸체만 맡고 광원의 낮 기준 상태·위치는 systems와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 벽판 0.10 × 0.18 m, 갓 아래 외경 0.14 m와 앞 돌출 0.015 + 0.015 + 0.14 = 0.17 m, 세 표면 id를 정한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#porch-entry와 systems/03-exterior-fixtures.md#exterior-porch-sconce의 문 옆 기구 인계를 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 천장이나 차고에 등을 늘리지 않고 문 옆 한 기구의 세로 벽판·투명 갓을 정한다.
@evidence principles/design/models.md#representation-contract 닫힌 벽판·짧은 목·갓을 별도 부피로 만들며 `fixture-housing`·`fixture-stem`·`fixture-glass`로 모든 면을 덮는다.
@evidence principles/design/models.md#spatial-convention 원점은 외벽 접점 중앙, +Z는 포치 바깥, +Y는 위이고 문짝 열림은 벽 안쪽이다.
@evidence principles/design/models.md#reviewable-structure 포치 정면과 측면에서 문틀 비접촉, 벽판·목·갓이 더해진 0.17 m 돌출, 꺼진 낮 상태의 기구 실루엣을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 세로 금속판과 짧은 목에 매달린 8각 갓으로 레퍼런스 01의 작은 현관 벽등을 읽히게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 벽판·목·갓의 치수·id·UV·원점·검사 뷰를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 포치 유효 깊이와 현관문 거친 개구부를 소비하고 벽등을 위해 포치나 문을 수정하지 않는다.
@evidence settings/10-house.md#porch-entry 현관 옆의 한 벽등을 꺼진 낮 상태에도 보일 기구 몸체로 제공한다.
@evidence obligations/design/models.md#addressable-model-decisions 포치 등은 세면등과 다른 갓 형상·유리 표면을 이 H2에서 정한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 현관문 옆 포치 뷰를 사용한다.
-->

레퍼런스 01의 현관문 왼쪽 작은 검은 벽등을 채택한다. 갓 안의 빛과 해 질 녘 밝기는 systems가 정하고 기구 원형은 실제 두께와 돌출만 정한다.

[포치 설정](../settings/10-house.md#porch-entry)의 문 옆 벽등은 낮에 광원이 꺼져도 기구 형상이 남는다. 국소 원점은 외벽 접점 중앙, +Z는 포치 쪽이다. 벽판은 폭 0.10 m·높이 0.18 m·두께 0.015 m, 앞쪽 목은 지름 0.025 m·길이 0.015 m, 8각 갓은 위 지름 0.10 m·아래 지름 0.14 m·높이 0.20 m다. 갓의 뒤쪽 면은 벽에서 0.030 m(벽판 0.015 + 목 0.015)에 시작하며 갓의 앞뒤 깊이는 아래 지름과 같은 0.14 m라 가장 앞점은 0.030 + 0.14 = 0.17 m다. 벽판 모든 면은 `fixture-housing`, 목은 `fixture-stem`, 갓은 `fixture-glass`이고 면 UV는 X·Y 또는 둘레 U·높이 V를 미터로 둔다. 문은 실내로 열려 기구와 겹치지 않는다. 광원 기준 상태와 위치는 systems·instances가 맡는다. 소스 owner는 `src/models/lighting-fixtures.ts`; 실제 포치 캡처는 unverified다.
