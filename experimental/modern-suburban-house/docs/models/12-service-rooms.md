# 파우더룸·세탁실·팬트리·차고의 설비와 수납 원형

## 드럼 세탁기와 건조기 {#laundry-machine}
<!--
@evidence principles/core/common.md#scope-preservation 세탁기·건조기 한 원형의 두 변형만 맡아 몸통·원형 문·손잡이·조작 띠를 정하고 드럼 회전·세제함·배관은 표현하지 않는다고 범위를 닫는다.
@evidence principles/core/common.md#substantive-completion 몸통 깊이 0.72 m, 문 지름 0.45 m·중심 높이 0.42 m, 조작 띠 Y = [0.76, 0.86]을 수치로 정해 구현자가 기기 치수를 새로 고를 일이 없다.
@evidence principles/core/common.md#declared-basis 외곽 깊이 0.75 m·폭 0.65 m·높이 0.88 m는 세탁 작업 예약의 두 기기 범위에서 읽은 값이고 문 90° 돌출 0.48 m는 0.45 m와 0.03 m의 산술이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공간 예약이 준 기기 외곽 위에 원형 문 경첩 피벗 `door`, 몸통 0.72 m와 문·손잡이 0.03 m의 깊이 분할, 조작 띠 표시로만 다른 두 변형이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품을 몸통·원형 문·문 손잡이·조작 띠로, 표면 owner를 `appliance-body`, `door-ring`, `glass`, `handle`, `control-panel`, `appliance-interior`, `drum`로 정하고 드럼 회전·세제함·배관은 이 proxy가 표현하지 않는 것으로 둔다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따르며 +Z가 문 전면이고 배치에서 world -X를 향하며, 원형 문 피벗은 한쪽 세로 접선에 두고 +Z 쪽으로 최대 90° 연다.
@evidence principles/design/models.md#reviewable-structure 정면에서 같은 몸통과 다른 조작 띠 표시로 두 기기가 갈리는지, 문 90° 평면에서 손잡이 끝이 X = 4.25 m에 닿지 않는지를 모델 리뷰 뷰의 고정 뷰로 찍는다.
@evidence principles/design/models.md#model-observable-style-basis 이 H2는 제조사나 양식 라벨을 두지 않고 드럼 세탁기라는 구분을 전면 원형 문 0.45 m와 전면 조작 띠라는 관찰 가능한 실루엣 결정으로만 적으며 재질 외관은 재질 경계 이름까지만 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 예약 외곽 0.75 × 0.65 × 0.88 m, 네 부품 위계, `door` 피벗, 여덟 재질 경계, 표현 제외 목록과 두 관찰이 함께 있어 기기 모델이 결정되며 관찰은 모두 unverified로 남는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 세탁 작업 예약의 세탁기·건조기 X·Z 범위와 문 작동 예약 X = [4.25, 4.75]를 적힌 그대로 소비했고 90° 돌출 0.48 m가 0.50 m 안에 들어 부모를 고칠 결함이 없었다.
@evidence settings/10-house.md#laundry-mudroom 설정의 나란한 앞문식 세탁기·건조기와 읽혀야 하는 원형 도어·조작부를 원형 문 0.45 m와 조작 띠 Y = [0.76, 0.86]을 가진 한 원형의 두 변형으로 만든다.
@evidence spaces/rooms/laundry.md#laundry-equipment-use 세탁기 Z = [-3.35, -2.70]·건조기 Z = [-2.70, -2.05]와 X = [4.75, 5.50], Y = [0, 0.88]을 외곽으로 받고 문 작동 예약 X = [4.25, 4.75] 0.50 m 안에 돌출 0.48 m를 맞춘다.
@evidence obligations/design/models.md#addressable-model-decisions 이 파일은 세탁기·접는 상판·상부 수납·벤치·외투 걸이·팬트리 선반·용기·차고 선반·작업대·공구판을 각자 H2로 나누며, 이 H2는 세탁기·건조기 원형 하나의 결정만 담는다.
@evidence obligations/design/models.md#model-review-set 관찰을 모델 리뷰 뷰의 고정 뷰로 찍게 하고 정면 두 기기 비교와 문 90° 평면이라는 두 반복 뷰를 이 원형의 리뷰 몫으로 정한다.
@evidence obligations/design/models.md#articulation-ownership 원형 문의 경첩 피벗 `door`를 +Z 쪽 최대 90° 열림의 motion 인터페이스로 이름 붙이고 몸통·조작 띠에는 관절을 두지 않는다.
-->

레퍼런스 02의 머드룸 뒤 세탁기·건조기 전면 원 두 개를 채택한다. 드럼 안 회전과 물은 보이지 않는 기능이므로 표현하지 않는다.

세탁기와 건조기는 조작 판 표시만 다른 한 원형의 두 변형이다. [세탁 작업 예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 세탁기 X = [4.75, 5.50], Z = [-3.35, -2.70]과 건조기 X = [4.75, 5.50], Z = [-2.70, -2.05]가 모두 깊이 0.75 m, 폭 0.65 m, Y = [0, 0.88]이므로 외곽을 그 값으로 둔다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 문 전면이며 배치에서 world -X를 향한다.

부품은 몸통, 원형 문, 문 손잡이, 조작 띠다. 몸통 깊이는 0.72 m이고 문과 손잡이가 0.03 m를 더한다. 원형 문은 지름 0.45 m, 중심 높이 0.42 m이며 한쪽 세로 접선의 경첩 피벗 `door`로 +Z 쪽으로 최대 90° 연다. 90° 열림의 돌출 0.45 m와 손잡이 0.03 m의 합 0.48 m가 [문 작동 예약 X = [4.25, 4.75]](../spaces/rooms/laundry.md#laundry-equipment-use)의 0.50 m 안에 든다. 조작 띠는 Y = [0.76, 0.86]의 전면 띠다. 재질 경계는 `appliance-body`, `leaf`, `door-ring`, `glass`, `handle`, `control-panel`, `appliance-interior`, `drum`이다. 원형 문의 불투명 외측 판은 `leaf`, 지름 0.45 m 둘레 폭 0.025 m의 금속 고리는 `door-ring`, 안쪽 지름 0.39 m의 유리 뒤 0.06 m에는 움직이지 않는 얕은 원통 `drum`을 둔다. 드럼 회전·세제함·배관은 표현하지 않는다.

소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 정면에서 두 기기가 같은 몸통과 다른 조작 띠 표시로 구분되는지, 문 90° 평면에서 손잡이 끝이 X = 4.25 m에 닿지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 세탁기 위 접는 상판 {#laundry-folding-top}
<!--
@evidence principles/core/common.md#scope-preservation 세탁기 위 접는 상판과 받침목 두 부품만 맡고 아래 두 기기는 다른 H2에 두며, 기기 문을 가리는 지지 부재를 세우지 않는다.
@evidence principles/core/common.md#substantive-completion 길이 1.30 m, 깊이 0.75 m, 두께 0.06 m와 받침목 높이 0.04 m·깊이 0.03 m를 정해 상판을 바로 만들 수 있다.
@evidence principles/core/common.md#declared-basis 상판 외곽은 예약 X = [4.75, 5.50], Z = [-3.35, -2.05], Y = [0.88, 0.94]에서 받았고 받침목을 상판 두께의 홈으로 파묻는 것은 예약 Y 범위를 지키려는 선택이라고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약은 범위와 문 앞 지지 금지만 주지만 이 H2는 뒤쪽 벽 받침목과 두 기기 윗면에 얹는 지지 방식과 파묻은 홈이라는 구성을 더한다.
@evidence principles/design/models.md#representation-contract 상판과 받침목 두 부품, 재질 경계 `top`·`cleat`, 관절 없음, 기기 문 앞에 다리나 옆판이 없다는 열린 경계를 정한다. 보이지 않는 한계는 본문의 "상판 가장자리 몰딩과 받침목 고정 철물은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 원점을 뒤쪽 모서리 선의 하단 중심 Y = 0.88 m에 두고 +Z가 yaw -π/2에서 world -X가 된다고 가구 국소 좌표에서 달라지는 점을 밝힌다.
@evidence principles/design/models.md#reviewable-structure 측면에서 상판 상면 0.94 m와 기기 상면 0.88 m 사이 틈이 없는지, 정면에서 문 앞 지지 부재가 없는지를 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 기기 위를 덮는 0.06 m 한 판과 다리·옆판을 세우지 않는 구성이라는 관찰 가능한 결정만 두고 마감은 `top`·`cleat` 경계로 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 예약에서 받은 세 축 범위, 두 부품, 두 재질 경계, 관절 없음과 두 관찰로 상판 모델이 결정되며 이 H2는 proxy가 지지하지 않는 관찰을 따로 열거하지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 세탁 작업 예약의 상판 범위 Y = [0.88, 0.94]와 지지 부재가 기기 문을 가리지 않는다는 조건을 그대로 소비했고 부모 값에서 고칠 결함을 찾지 않았다.
@evidence settings/10-house.md#laundry-mudroom 설정이 요구한 접는 상판을 두 기기 위 1.30 m 한 판으로 만들고 기기 문 앞에 다리를 두지 않는다.
@evidence spaces/rooms/laundry.md#laundry-equipment-use 예약 X = [4.75, 5.50], Z = [-3.35, -2.05], Y = [0.88, 0.94]를 외곽으로 받고 지지 부재가 기기 문을 가리지 않는다는 조건을 벽 받침목 지지로 지킨다.
-->

레퍼런스 02의 세탁기 위 작업 상판을 채택한다. 기기 뚜껑과 상판을 한 면으로 합치지 않고 실제 높이차를 둔다.

접는 상판은 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [4.75, 5.50], Z = [-3.35, -2.05], Y = [0.88, 0.94]를 외곽으로 받아 길이 1.30 m, 깊이 0.75 m, 두께 0.06 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르되 원점을 뒤쪽 모서리 선의 하단 중심 Y = 0.88 m에 두고, +Z는 yaw -π/2에서 world -X다. 상판은 뒤쪽 벽의 받침목과 두 기기 윗면에 얹히며 기기 문 앞에 다리나 옆판을 세우지 않아 [지지 부재가 기기 문을 가리지 않는다는 조건](../spaces/rooms/laundry.md#laundry-equipment-use)을 지킨다.

부품은 상판과 받침목 둘이다. 받침목은 상판 아래 벽면을 따라 높이 0.04 m, 깊이 0.03 m로 두되 예약 Y 범위 안에 들도록 상판 두께에 파묻은 홈으로 처리한다. 재질 경계는 `top`, `cleat`이고 관절은 없다. 상판 가장자리 몰딩과 받침목 고정 철물은 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 상판 상면 0.94 m와 기기 상면 0.88 m 사이 틈이 없는지, 정면에서 문 앞 지지 부재가 없는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 세탁실 상부 수납 {#laundry-upper-storage}
<!--
@evidence principles/core/common.md#scope-preservation 세탁실 벽걸이 상부 수납 한 원형을 맡고 주방 상부장과 같은 구성이라도 깊이·높이가 달라 별도 원형으로 둔다고 경계를 긋는다.
@evidence principles/core/common.md#substantive-completion 길이 1.30 m, 깊이 0.30 m, 높이 0.80 m와 몸통 깊이 0.28 m·전면 판 0.02 m, 하단 홈 손잡이를 정한다.
@evidence principles/core/common.md#declared-basis 외곽은 예약 X = [5.20, 5.50], Y = [1.50, 2.30]에서 받았고 하단 1.50 m가 상판 위 0.56 m 작업 높이를 남긴다는 것은 1.50 − 0.94의 산술이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약의 상부 수납 범위에 몸통과 두 문 전면 판 분할, 하단 홈 손잡이, 강체 문이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품을 몸통과 두 문 전면 판으로, 재질 경계를 `carcass`·`leaf`로 정하고 문을 강체로 둔다. 보이지 않는 한계는 본문의 "경첩·내부 선반·세제 용기는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 벽걸이 원형이므로 원점을 뒤쪽 모서리 선의 하단 중심 1.50 m에 둔다고 가구 국소 좌표의 예외를 밝힌다.
@evidence principles/design/models.md#reviewable-structure 정면에서 하단 1.50 m가 접는 상판 위 0.56 m 작업 높이를 남기는지를 모델 리뷰 뷰로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 대신 주방 상부장과 같은 몸통·전면 판 구성이라는 관찰 가능한 기준을 인용하고 깊이 0.30 m·높이 0.80 m로 차이를 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 예약 외곽, 몸통·두 전면 판 위계, 두 재질 경계, 강체 문과 한 관찰로 원형이 결정되며 문 열림 관절은 두지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 세탁 작업 예약의 상부 수납 범위 X = [5.20, 5.50], Z = [-3.35, -2.05], Y = [1.50, 2.30]을 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#laundry-mudroom 설정의 상부장/선반 요구를 1.30 m 길이 두 문 벽걸이 수납으로 만든다.
@evidence spaces/rooms/laundry.md#laundry-equipment-use 예약 X = [5.20, 5.50], Z = [-3.35, -2.05], Y = [1.50, 2.30]을 외곽 1.30 × 0.30 × 0.80 m로 받는다.
-->

레퍼런스 02의 세탁 구역 윗수납을 채택한다. 사진에 없는 내부 선반 치수는 세탁 작업 예약으로 정한다.

상부 수납은 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [5.20, 5.50], Z = [-3.35, -2.05], Y = [1.50, 2.30]을 외곽으로 받아 길이 1.30 m, 깊이 0.30 m, 높이 0.80 m다. [주방 상부장](10-kitchen-dining.md#kitchen-wall-cabinet)과 같은 몸통·전면 판 구성을 쓰되 깊이와 높이가 달라 별도 원형으로 둔다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르되 벽걸이 원형이므로 원점을 뒤쪽 모서리 선의 하단 중심 1.50 m에 둔다.

부품은 몸통(깊이 0.28 m)과 두 문 전면 판(0.02 m)이며 손잡이는 하단 홈이다. 재질 경계는 `carcass`, `leaf`이고 문은 강체다. 경첩·내부 선반·세제 용기는 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 정면에서 하단 1.50 m가 접는 상판 위 0.56 m 작업 높이를 남기는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 머드룸 신발 벤치 {#mudroom-bench}
<!--
@evidence principles/core/common.md#scope-preservation 머드룸 신발 벤치의 좌판·옆판·신발 선반과 선반 위 신발 두 켤레만 맡고 외투 걸이는 다음 H2에 둔다.
@evidence principles/core/common.md#substantive-completion 좌판 Y = [0.42, 0.45], 옆판 두께 0.03 m, 신발 선반 상면 0.10 m, 신발 상자 0.28 × 0.10 × 0.10 m를 정한다.
@evidence principles/core/common.md#declared-basis 길이 0.80 m·깊이 0.40 m·좌면 0.45 m는 예약 X = [3.22, 3.62], Z = [-2.85, -2.05]와 좌면 0.45 m에서 받았고 신발을 낮은 상자 둘로 두는 것은 저작 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약이 준 벤치 범위와 좌면 높이 위에 좌판·옆판 둘·신발 선반 분할과 신발 두 켤레 proxy를 더한다.
@evidence principles/design/models.md#representation-contract 부품을 좌판·옆판 둘·신발 선반과 신발 상자 둘로, 재질 경계를 `seat`·`carcass`·`shelf`·`shoe`로 정하고 관절은 두지 않는다. 보이지 않는 한계는 본문의 "신발 끈·밑창 형상과 좌판 모서리 모따기는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따르며 +Z가 앉는 정면이고 배치에서 world +X를 향한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 좌면 0.45 m와 신발 선반이 읽히는지를 모델 리뷰 뷰의 고정 뷰로 찍는다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 옆판 둘이 받치는 좌판과 아래 낮은 신발 선반이라는 관찰 가능한 구성만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 좌면 0.45 m 기준 높이, 네 부품 종류, 네 재질 경계, 관절 없음과 측면 관찰로 벤치가 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 세탁 작업 예약의 벤치 범위와 좌면 0.45 m를 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#laundry-mudroom 설정이 요구한 신발 벤치를 좌면 0.45 m와 신발 선반 0.10 m의 벤치로 만든다.
@evidence spaces/rooms/laundry.md#laundry-equipment-use 예약 X = [3.22, 3.62], Z = [-2.85, -2.05]와 좌면 0.45 m를 벤치 외곽 0.80 × 0.40 × 0.45 m로 받는다.
@evidence obligations/design/models.md#reference-scale 예약에서 받은 좌면 0.45 m를 벤치 높이 0.45 m와 좌판 Y = [0.42, 0.45]로 그대로 쓰고 측면 관찰에서 이 좌면 높이가 읽히는지를 확인하게 한다.
-->

레퍼런스 02의 차고와 공용부 사이 머드룸 앉는 자리를 채택한다. 벤치 길이는 사진의 방 폭이 아니라 예약 상자에 맞춘다.

신발 벤치는 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [3.22, 3.62], Z = [-2.85, -2.05], 좌면 0.45 m를 외곽으로 받아 길이 0.80 m, 깊이 0.40 m, 높이 0.45 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 앉는 정면이며 배치에서 world +X를 향한다.

부품은 좌판, 옆판 둘, 신발 선반 하나다. 좌판은 Y = [0.42, 0.45], 옆판 두께 0.03 m, 신발 선반 상면은 0.10 m다. 신발 두 켤레를 선반 위의 낮은 상자 둘(0.28 × 0.10 × 0.10 m)로 둔다. 재질 경계는 `seat`, `carcass`, `shelf`, `shoe`이고 관절은 없다. 신발 끈·밑창 형상과 좌판 모서리 모따기는 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 좌면 0.45 m와 신발 선반이 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 벤치 위 외투 걸이 {#mudroom-coat-hooks}
<!--
@evidence principles/core/common.md#scope-preservation 벤치 위 걸이판·걸이 넷과 걸린 외투 둘만 맡고 천 주름·소매는 표현하지 않는다고 범위를 닫는다.
@evidence principles/core/common.md#substantive-completion 걸이판 0.80 × 0.10 × 0.02 m, 하단 1.65 m, 걸이 넷 중심 -0.25·-0.08·+0.08·+0.25 m·돌출 0.08 m, 외투 폭 0.30 m·깊이 0.25 m를 정한다.
@evidence principles/core/common.md#declared-basis 외곽 Y = [1.10, 1.85]와 X·Z 범위는 예약에서 받았고 외투가 걸이 아래 1.10 m 높이까지 내려온다는 값은 그 범위 하단에 맞춘 것이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약 범위 안에 걸이판 하단 1.65 m, 걸이 중심 -0.25·-0.08·+0.08·+0.25 m, 외투를 둥근 모서리 판 덩어리로 매단다는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품을 걸이판·걸이 넷·외투 둘로, 재질 경계를 `rail`·`hook`·`clothes`로 두고 천 주름·소매는 표현하지 않는다고 밝힌다.
@evidence principles/design/models.md#spatial-convention 벽걸이 원형이므로 원점을 벽면의 걸이판 하단 중심에 두고 두 외투의 가로 점유는 각각 [-0.40, -0.10]·[0.10, 0.40] m로 0.80 m 예약 안에서 0.20 m 떨어지고, 외투까지 포함한 돌출은 0.40 m 깊이 안에 든다.
@evidence principles/design/models.md#reviewable-structure 측면에서 외투 하단이 벤치 좌면 위 0.65 m에 멈추는지를 모델 리뷰 뷰로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 둥근 모서리 판 덩어리 외투와 0.08 m 돌출 걸이라는 추상화 수준을 관찰 가능한 결정으로 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 걸이판 하단 1.65 m와 외투 하단 1.10 m의 높이 층, 세 재질 경계, 관절 없음, 표현 제외와 측면 관찰로 원형이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 세탁 작업 예약의 외투 걸이 범위 X = [3.22, 3.62], Z = [-2.85, -2.05], Y = [1.10, 1.85]를 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#laundry-mudroom 설정의 외투 걸이 요구를 걸이 넷과 걸린 외투 둘로 만든다.
@evidence spaces/rooms/laundry.md#laundry-equipment-use 예약 X = [3.22, 3.62], Z = [-2.85, -2.05], Y = [1.10, 1.85] 안에 걸이와 걸린 외투의 최대 돌출을 함께 담는다.
-->

레퍼런스 02에는 머드룸 외투의 개별 형상이 선명하지 않다. 세탁·머드룸의 사용 요구로 걸이 넷과 외투 둘을 결정한다.

외투 걸이는 [예약](../spaces/rooms/laundry.md#laundry-equipment-use)의 X = [3.22, 3.62], Z = [-2.85, -2.05], Y = [1.10, 1.85] 안에 걸이와 걸린 외투의 최대 돌출을 함께 담는다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르되 벽걸이 원형이므로 원점을 벽면의 걸이판 하단 중심에 둔다. 걸이판은 길이 0.80 m, 높이 0.10 m, 두께 0.02 m이며 하단이 1.65 m에 오고, 걸이 넷은 판 중심에서 -0.25·-0.08·+0.08·+0.25 m, 돌출 0.08 m다.

걸린 외투 둘은 양끝 걸이(-0.25·+0.25 m)에 매단 둥근 모서리 판 덩어리로 두며 폭 0.30 m, 깊이 0.25 m, 걸이 아래 1.10 m 높이까지 내려온다. 두 외투의 가로 점유는 각각 [-0.40, -0.10]·[0.10, 0.40] m로 0.80 m 예약 안에서 0.20 m 떨어지고, 외투까지 포함한 돌출은 0.40 m 깊이 안에 든다. 재질 경계는 `rail`, `hook`, `clothes`이고 관절은 없다. 천 주름·소매는 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 외투 하단이 벤치 좌면 위 0.65 m에 멈추는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 팬트리 L형 선반 {#pantry-l-shelf}
<!--
@evidence principles/core/common.md#scope-preservation 팬트리 L형 선반 판 다섯과 벽 받침 띠만 맡고 선반 위 식품은 다음 H2에 둔다.
@evidence principles/core/common.md#substantive-completion 선반 상면 0.20, 0.60, 1.00, 1.40, 1.80 m, 두께 0.03 m, 받침 띠 높이 0.03 m·깊이 0.02 m와 기둥 없는 한 판 코너를 정한다.
@evidence principles/core/common.md#declared-basis 뒤쪽 띠 깊이 0.25 m와 오른쪽 띠 깊이 0.30 m는 선반 평면에서, 다섯 단 높이는 방 문서에서 받았다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공간이 준 두 띠를 한 L형 판으로 합치고 코너 기둥 없이 벽 받침 띠로 지지한다는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 두 띠의 합집합을 한 L형 판으로 만들고 부품을 선반 판 다섯과 받침 띠로, 재질 경계를 `shelf`·`cleat`로 둔다. 보이지 않는 한계는 본문의 "선반 브래킷 개별 형상·나사·앞 모서리 몰딩은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 원점을 두 벽이 만나는 뒤쪽 오른쪽 모서리의 바닥점에 두고 로컬 축을 world 축과 같게 둔다는 가구 국소 좌표의 예외를 밝힌다.
@evidence principles/design/models.md#reviewable-structure 위에서 L형 코너가 한 번만 채워졌는지, 정면에서 다섯 단 간격이 읽히는지를 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 코너 기둥 없는 한 판 L형과 0.40 m 간격 다섯 단이라는 관찰 가능한 구성을 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 두 띠 범위, 다섯 단 높이, 두 재질 경계, 관절 없음, 두 관찰로 선반이 결정되며 proxy가 지지하지 않는 관찰은 따로 열거하지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 선반 평면의 두 띠 범위와 방 문서의 다섯 단 높이를 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#pantry 설정의 선반을 둔 별도 식품 수납실을 뒤쪽·오른쪽 벽의 L형 다섯 단 선반으로 만든다.
@evidence spaces/rooms/pantry.md#pantry-plan 뒤쪽 띠 X = [3.22, 5.50], Z = [-6.05, -5.80]과 오른쪽 띠 X = [5.20, 5.50], Z = [-6.05, -4.70]의 합집합을 선반 외곽으로 쓴다.
@evidence spaces/rooms/pantry.md#pantry-storage-use 방 문서의 0.20 m부터 0.40 m 간격 선반 상면을 0.20, 0.60, 1.00, 1.40, 1.80 m 다섯 단으로 그대로 받는다.
-->

레퍼런스 02의 주방 옆 작고 닫힌 팬트리 위치를 채택한다. 선반의 L형 치수와 단수는 부모의 수납 예약에서 계산한다.

팬트리 선반은 [선반 평면](../spaces/rooms/pantry.md#pantry-plan)의 뒤쪽 띠 X = [3.22, 5.50], Z = [-6.05, -5.80](깊이 0.25 m)과 오른쪽 띠 X = [5.20, 5.50], Z = [-6.05, -4.70](깊이 0.30 m)의 합집합을 한 L형 판으로 만든다. [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 두 벽에 걸친 L형 한 곳뿐인 원형이므로 원점을 두 벽이 만나는 뒤쪽 오른쪽 모서리의 바닥점에 두고 로컬 축을 world 축과 같게 둔다.

부품은 L형 선반 판 다섯과 벽 받침 띠다. 선반 상면은 [방 문서](../spaces/rooms/pantry.md#pantry-storage-use)대로 0.20 m부터 0.40 m 간격인 0.20, 0.60, 1.00, 1.40, 1.80 m이고 두께 0.03 m를 상면 아래로 둔다. 코너는 한 판으로 이어지며 코너 기둥은 없다. 받침 띠는 각 선반 아래 벽면을 따라 높이 0.03 m, 깊이 0.02 m다. 재질 경계는 `shelf`, `cleat`이고 관절은 없다.

선반 브래킷 개별 형상·나사·앞 모서리 몰딩은 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 위에서 L형 코너가 한 번만 채워졌는지, 정면에서 다섯 단 간격이 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 팬트리 식품 용기 {#pantry-containers}
<!--
@evidence principles/core/common.md#scope-preservation 밀폐 용기·식료품 상자·낮은 바구니 세 변형의 형상만 맡고 개수와 배치는 instances가 소유한다고 넘긴다.
@evidence principles/core/common.md#substantive-completion 밀폐 용기 0.12 × 0.12 × 0.20 m, 상자 0.18 × 0.18 × 0.25 m, 바구니 0.30 × 0.20 × 0.15 m를 정한다.
@evidence principles/core/common.md#declared-basis 세 변형 치수는 방 문서의 물건 깊이 0.20·0.25 m와 선반 위 0.30 m 한계를 근거로 택했다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 문서가 준 깊이·높이 한계를 세 변형의 구체 치수와 몸통·뚜껑·테두리 구성으로 좁힌다.
@evidence principles/design/models.md#representation-contract 밀폐 용기는 몸통과 뚜껑, 상자는 한 상자, 바구니는 테두리 있는 열린 상자로 두고 재질 경계를 `container`·`lid`·`basket`으로 정한다. 보이지 않는 한계는 본문의 "라벨·내용물·투명 용기의 투과는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 선반 위 소품이므로 원점을 밑면 중심에 둔다고 가구 국소 좌표의 예외를 밝힌다.
@evidence principles/design/models.md#reviewable-structure 선반 위 용기가 선반 끝을 넘지 않는지를 모델 리뷰 뷰의 고정 뷰로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 상표나 식품 종류 라벨 없이 뚜껑 있는 용기·닫힌 상자·테두리 있는 열린 바구니라는 세 실루엣 구분만 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 세 변형 치수, 세 재질 경계, 관절 없음, instances로 넘긴 개수·배치와 한 관찰로 소품 원형이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 팬트리 점유의 물건 깊이·높이·0.02 m 물림 한계를 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#pantry 설정의 식품 보관 용기·상자를 밀폐 용기·상자·바구니 세 변형의 소품 원형으로 만든다.
@evidence spaces/rooms/pantry.md#pantry-storage-use 뒤 선반 0.20 m·오른쪽 0.25 m 깊이와 선반 위 0.30 m 이내 높이 안에 세 변형 치수를 고른다.
-->

레퍼런스 02의 팬트리는 속 물건이 보이지 않는다. 보관 기능을 설명할 용기·상자·바구니 원형을 settings와 선반 깊이에서 정한다.

식품은 밀폐 용기, 작은 식료품 상자, 낮은 바구니의 세 변형을 가진 한 소품 원형이다. [방 문서](../spaces/rooms/pantry.md#pantry-storage-use)가 뒤 선반 물건 깊이 0.20 m, 오른쪽 0.25 m, 높이 선반 위 0.30 m 이내, 선반 끝에서 0.02 m 물림을 정하므로 변형 치수를 밀폐 용기 0.12 × 0.12 × 0.20 m, 상자 0.18 × 0.18 × 0.25 m, 바구니 0.30 × 0.20 × 0.15 m로 택한다. [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 선반 위 소품이므로 원점을 밑면 중심에 둔다.

밀폐 용기는 몸통과 뚜껑, 상자는 한 상자, 바구니는 테두리가 있는 열린 상자다. 재질 경계는 `container`, `lid`, `basket`이고 관절은 없다. 라벨·내용물·투명 용기의 투과는 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`이며 개수와 배치는 instances가 소유한다. 관찰은 선반 위 용기가 선반 끝을 넘지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 차고 금속 선반 {#garage-shelving}
<!--
@evidence principles/core/common.md#scope-preservation 차고 후벽 금속 선반의 기둥·선반 판과 아래 두 단 수납 상자 넷만 맡고 작업대·공구판은 다른 H2에 둔다.
@evidence principles/core/common.md#substantive-completion 기둥 0.04 m 각 넷, 선반 상면 0.20–1.80 m 다섯 단·두께 0.03 m, 상자 0.40 × 0.35 × 0.28 m 넷을 정한다.
@evidence principles/core/common.md#declared-basis 외곽 1.70 × 0.60 × 2.05 m는 후벽 수납 예약 X = [7.15, 8.85], Z = [-6.45, -5.85], 바닥 위 2.05 m에서 받았다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후벽 수납 예약 범위를 네 모서리 기둥과 다섯 단 선반, 아래 두 단 상자 배치라는 모델 결정으로 채운다.
@evidence principles/design/models.md#representation-contract 부품을 네 모서리 기둥·선반 판 다섯·수납 상자 넷으로, 재질 경계를 `post`·`shelf`·`bin`으로 정하고 관절은 두지 않는다. 보이지 않는 한계는 본문의 "기둥 타공 구멍·볼트·상자 뚜껑 손잡이는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 원점을 차고 바닥 Y = -0.15 m에 두고 +Z가 선반 앞이며 상자는 몸체 깊이 0.60 m 안에 담긴다.
@evidence principles/design/models.md#reviewable-structure 측면에서 상자가 0.60 m 깊이 안에 드는지를 모델 리뷰 뷰로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 금속 선반이라는 이름을 0.04 m 각 기둥 넷과 얇은 선반 판이라는 관찰 가능한 형상으로 적고 금속 외관은 `post`·`shelf` 경계로 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 차고 바닥 Y = -0.15 m 기준, 다섯 단 높이, 세 재질 경계, 관절 없음과 측면 관찰로 선반이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 차고 후벽 수납 예약의 X·Z 범위와 바닥 위 2.05 m를 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#garage 설정이 빈 차고에도 요구한 선반 수납을 후벽 1.70 m 다섯 단 금속 선반으로 만든다.
@evidence spaces/rooms/garage-interior.md#garage-storage-use 후벽 수납 예약 X = [7.15, 8.85], Z = [-6.45, -5.85]와 바닥 위 2.05 m를 선반 외곽으로 받는다.
-->

레퍼런스 02의 차고 벽면 수납을 채택하고 영상의 두 자동차는 사용자 지시에 따라 거부한다. 선반은 빈 차고 보행 폭 안에 둔다.

차고 선반은 [후벽 수납 예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 X = [7.15, 8.85], Z = [-6.45, -5.85], 차고 바닥 위 2.05 m를 외곽으로 받아 길이 1.70 m, 깊이 0.60 m, 높이 2.05 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 원점은 차고 바닥 Y = -0.15 m에 놓이고 +Z는 선반 앞이다.

부품은 네 모서리 기둥(0.04 m 각)과 선반 판 다섯이다. 선반 상면은 차고 바닥 위 0.20 m부터 0.40 m 간격인 0.20, 0.60, 1.00, 1.40, 1.80 m이고 두께 0.03 m다. 수납 상자 넷을 0.40 × 0.35 × 0.28 m로 아래 두 단에 두어 몸체 깊이 안에 담는다. 재질 경계는 `post`, `shelf`, `bin`이고 관절은 없다. 기둥 타공 구멍·볼트·상자 뚜껑 손잡이는 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 상자가 0.60 m 안에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 차고 공구 작업대 {#garage-workbench}
<!--
@evidence principles/core/common.md#scope-preservation 차고 공구 작업대의 상판·다리·서랍 둘만 맡고 위 공구판은 다음 H2에 둔다.
@evidence principles/core/common.md#substantive-completion 상판 두께 0.04 m, 다리 넷, 서랍 폭 0.55 m·높이 0.12 m와 최대 인출 0.45 m를 정한다.
@evidence principles/core/common.md#declared-basis 외곽 1.20 × 0.60 × 0.90 m는 예약 X = [9.00, 10.20], Z = [-6.45, -5.85], 상면 0.90 m에서, 인출 0.45 m는 서랍 작동 예약 Z = [-5.85, -5.40]에서 받았다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약 작업대 범위에 상판·다리·서랍 분할과 두 서랍 피벗이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품을 상판·다리 넷·서랍 둘로, 재질 경계를 `top`·`leg`·`drawer-front`·`handle`로 정한다. 보이지 않는 한계는 본문의 "서랍 레일·바이스·상판 흠집은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따르며 +Z가 작업 정면이고 서랍 피벗은 +Z로 최대 0.45 m 미끄러진다.
@evidence principles/design/models.md#reviewable-structure 서랍 0.45 m 인출 평면에서 작업 사용 범위와 겹치지 않는지를 모델 리뷰 뷰로 찍는다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 다리 넷 위 0.04 m 상판과 상판 아래 서랍 둘이라는 관찰 가능한 구성만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 예약 외곽, 세 부품 종류, 네 재질 경계, 두 서랍 피벗과 인출 관찰로 작업대가 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 차고 작업대 예약과 서랍 작동 예약을 그대로 소비했다. 손잡이를 오목 홈으로 정해 인출 0.45 m 이외의 돌출이 없어 부모 결함이 없다.
@evidence settings/10-house.md#garage 설정이 빈 차고에 요구한 공구 수납을 서랍 둘 달린 1.20 m 작업대로 만든다.
@evidence spaces/rooms/garage-interior.md#garage-storage-use 예약 X = [9.00, 10.20], Z = [-6.45, -5.85], 상면 0.90 m를 외곽으로, 서랍 작동 예약 Z = [-5.85, -5.40]을 인출 한계로 받는다.
@evidence obligations/design/models.md#articulation-ownership 두 서랍을 피벗 `drawer-left`·`drawer-right`로 이름 붙여 +Z 최대 0.45 m 인출의 motion 인터페이스로 둔다.
-->

레퍼런스 02의 차고 벽 작업대와 공구 수납을 채택한다. 자동차 주차 칸은 비워 두며 서랍 인출은 작업 예약 안으로 한정한다.

작업대는 [예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 X = [9.00, 10.20], Z = [-6.45, -5.85], 상면 차고 바닥 위 0.90 m를 외곽으로 받아 길이 1.20 m, 깊이 0.60 m, 높이 0.90 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 작업 정면이다.

부품은 상판(두께 0.04 m), 다리 넷, 서랍 둘이다. 서랍은 상판 아래 폭 0.55 m, 높이 0.12 m이고 각각 피벗 `drawer-left`, `drawer-right`로 +Z로 최대 0.45 m 미끄러져 [서랍 작동 예약 Z = [-5.85, -5.40]](../spaces/rooms/garage-interior.md#garage-storage-use)과 같다. 손잡이는 서랍 전면에 깊이 0.015 m로 판 오목 홈이라 전면에서 돌출하지 않고, 연 상태의 최전방은 인출량 0.45 m와 같다. 다리는 0.05 m 각재로 네 모서리에서 0.06 m 안쪽에 세운다. 재질 경계는 `top`, `leg`, `drawer-front`, `handle`이다. 서랍 레일·바이스·상판 흠집은 표현하지 않는다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 서랍 0.45 m 인출 평면에서 작업 사용 범위와 겹치지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 작업대 위 공구판 {#garage-tool-board}
<!--
@evidence principles/core/common.md#scope-preservation 작업대 위 타공판과 망치·렌치·톱 세 실루엣, 작은 통 둘만 맡는다.
@evidence principles/core/common.md#substantive-completion 판 1.20 × 1.00 m, 타공판 두께 0.02 m, 전체 깊이 0.15 m, 공구 돌출 0.13 m 이내를 정한다.
@evidence principles/core/common.md#declared-basis 외곽은 예약 X = [9.00, 10.20], Z = [-6.45, -6.30], world Y = [0.95, 1.95]에서 받았고 공구 셋과 통 둘의 구성은 저작 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 예약 공구판 범위에 타공판 두께와 걸린 공구 세 실루엣·통 둘이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품을 타공판·공구 셋·통 둘로, 재질 경계를 `board`·`tool-steel`·`tool-grip`·`bin`으로 두고 각 공구·통의 외곽을 본문에서 수치로 제한한다.
@evidence principles/design/models.md#spatial-convention 벽걸이 원형이므로 원점을 벽면의 판 하단 중심에 두고 모든 공구가 판 앞 0.13 m 안에 든다.
@evidence principles/design/models.md#reviewable-structure 측면에서 공구 돌출이 0.15 m 안인지, 정면에서 세 공구 실루엣이 구분되는지를 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 공구를 망치·렌치·톱의 판 실루엣 수준으로 추상화한다는 관찰 가능한 결정을 두고 공구의 금속·손잡이 외관은 재질 경계로 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 예약 외곽, 0.15 m 깊이 층, 네 재질 경계, 공구 셋·통 둘의 외곽과 위치, 관절 없음과 두 관찰로 공구판이 결정된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 차고 공구판 예약 X·Z 범위와 world Y = [0.95, 1.95]를 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#garage 설정이 빈 차고에 요구한 공구 수납을 걸린 공구 세 실루엣과 통 둘의 타공판으로 만든다.
@evidence spaces/rooms/garage-interior.md#garage-storage-use 예약 X = [9.00, 10.20], Z = [-6.45, -6.30], world Y = [0.95, 1.95]를 공구판 외곽 1.20 × 1.00 × 0.15 m로 받는다.
@evidence obligations/design/models.md#representation-ceiling 공구 개별 형상을 두께 0.02–0.04 m 판 실루엣 수준으로 제한해 리뷰어가 공구의 실제 형상 세부를 이 모델에서 읽어내지 않게 한다.
@evidence obligations/design/models.md#model-representation-completion 파일의 열 원형이 모두 `src/models/furnishings/service-rooms.ts`를 소스 owner로, 모델 리뷰 뷰를 관찰 owner로 두지만 모든 관찰이 unverified라 구조 유효성과 의미 완결 판정은 아직 없다.
-->

레퍼런스 02의 차고 수납 실루엣을 공구판으로 채택한다. 사진에서 공구를 세지 않고 이 H2의 결정된 실루엣과 통 두 개로 구성한다.

공구판은 [예약](../spaces/rooms/garage-interior.md#garage-storage-use)의 X = [9.00, 10.20], Z = [-6.45, -6.30], world Y = [0.95, 1.95]를 외곽으로 받아 길이 1.20 m, 높이 1.00 m, 전체 깊이 0.15 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르되 벽걸이 원형이므로 원점을 벽면의 판 하단 중심에 둔다. 타공판은 두께 0.02 m이며 걸린 공구는 망치·렌치·톱 세 실루엣과 작은 통 둘이다. 원점은 판 하단 가운데, +X는 오른쪽, +Y는 위, +Z는 방 쪽이다. 망치 외곽 0.12 × 0.36 × 0.035 m의 중심은 (-0.35, 0.57), 렌치 0.06 × 0.30 × 0.025 m의 중심은 (-0.05, 0.60), 톱 0.32 × 0.16 × 0.030 m의 중심은 (0.30, 0.58)이다. 작은 통 둘은 각각 0.16 × 0.12 × 0.10 m이며 중심 X = -0.24, 0.24 m, 하단 Y = 0.12 m다. 모든 공구와 통의 앞끝은 판 앞 0.13 m 이내다.

재질 경계는 `board`, `tool-steel`, `tool-grip`, `bin`이고 관절은 없다. 망치 머리 0.12 × 0.035 m와 손잡이 0.025 × 0.32 m, 렌치 양끝 턱 폭 0.06 m와 몸통 폭 0.025 m, 톱의 0.32 × 0.12 m 날과 0.08 × 0.10 m 손잡이를 각각 앞의 외곽 안에 둔다. 소스 owner는 `src/models/furnishings/service-rooms.ts`다. 관찰은 측면에서 공구 돌출이 0.15 m 안인지, 정면에서 세 공구 실루엣이 구분되는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.
