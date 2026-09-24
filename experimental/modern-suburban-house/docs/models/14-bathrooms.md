# 파우더룸과 두 욕실의 설비 원형

## 공용 변기 {#shared-toilet}
<!--
@evidence principles/core/common.md#scope-preservation 이 H2는 파우더룸·샤워 욕실·욕조 욕실 세 예약에 함께 쓰는 변기 원형 하나의 외곽 깊이 0.75 m·높이 0.82 m·폭 0.50 m와 부품 일곱을 맡고, 도기 두께·배수 트랩·급수관은 표현하지 않는다고 범위를 닫는다.
@evidence principles/core/common.md#substantive-completion 물탱크 폭 0.50 m·깊이 0.20 m·Y = [0.40, 0.78], 뚜껑 0.78–0.82 m, 몸통 폭 0.38 m와 좌면 링 상면 0.43 m를 수치로 정해 구현자가 변기 치수를 새로 고를 일이 없다.
@evidence principles/core/common.md#declared-basis 폭 0.50 m는 가장 좁은 샤워 욕실 예약 폭 0.65 m 안에서 세 예약 모두에 양옆 0.075 m 이상 여유를 남기려는 이 층의 결정이고, 깊이 0.75 m·높이 0.82 m는 세 예약의 깊이와 최대 높이에서 가져왔다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 세 방 문서가 준 예약 상자(깊이 0.75 m, 폭 0.70 m 또는 0.65 m, 좌면 0.43 m) 위에 물탱크·몸통·시트 덮개로 나눈 부품 구성과 `seat-lid` 피벗이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 물탱크·탱크 뚜껑·받침·변기 몸통·시트·시트 덮개·세척 레버의 부품과 둥근 끝 상자 몸통을 정하고 표면 id `ceramic`, `toilet-seat`, `lid`, `handle`을 두며, 도기 두께·트랩·급수관은 이 프록시가 주장하지 않는다.
@evidence principles/design/models.md#spatial-convention 로컬 좌표는 가구 국소 좌표를 따라 +Z가 앉는 정면이고, 몸통은 벽에서 0.75 m까지 이어지며 `seat-lid` 피벗은 시트 덮개의 뒤쪽 가로 경첩에 둔다.
@evidence principles/design/models.md#reviewable-structure 모델 리뷰 뷰의 측면에서 좌면 0.43 m와 뚜껑 0.82 m가 보이는지, 세 배치의 평면에서 앞 끝이 각 사용 예약 경계에 멈추는지가 이 변기를 반증할 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨을 두지 않고 폭 0.50 m 물탱크 위의 뚜껑과 폭 0.38 m 둥근 끝 몸통이라는 실루엣·비례만 정하며, 재질 선택 없이 표면 id `ceramic`만 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 기준 치수 좌면 0.43 m, 일곱 부품 계층, 닫힘을 기준 상태로 둔 `seat-lid` 인터페이스, 표현하지 않는 도기 두께·배관, unverified 관찰 두 가지가 함께 적혀 변기 블로킹 표현을 결정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 파우더룸·샤워 욕실·욕조 욕실 사용 예약의 X·Z 범위와 좌면 0.43 m·최대 높이 0.82 m를 적힌 그대로 소비했고, 세 예약 모두 폭 0.50 m 원형을 여유 있게 담아 방 문서나 설정에 고칠 결함이 없었다.
@evidence spaces/rooms/powder.md#powder-fixture-use 파우더룸 예약 X = [4.75, 5.50], Z = [-1.65, -0.95], 전면 -X, 깊이 0.75 m·폭 0.70 m를 원형의 외곽 깊이와 폭 상한으로 소비한다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 욕실 예약 X = [2.32, 2.97], Z = [-8.80, -8.05], 전면 +Z, 폭 0.65 m가 세 예약 중 가장 좁아 원형 폭 0.50 m를 정하는 상한으로 소비된다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실 예약 X = [4.75, 5.50], Z = [-6.65, -5.95], 전면 -X를 파우더룸과 같은 깊이 0.75 m·폭 0.70 m 상자로 받아 같은 원형을 놓게 한다.
@evidence settings/10-house.md#powder 파우더룸 설정이 요구하는 변기를 세 방 공용 원형으로 제공하며, 그 치수는 파우더룸 예약의 깊이 0.75 m·폭 0.70 m 안에 든다.
@evidence settings/10-house.md#shower-bathroom 샤워 욕실 설정의 유리 샤워부스·세면대·변기 중 변기를 이 원형이 맡고, 샤워 욕실 예약의 전면 +Z 방향과 폭 0.65 m를 따른다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실 설정의 욕조·세면대·변기 중 변기를 이 원형이 맡으며, 욕조 욕실 예약의 전면 -X 상자에 놓일 치수로 정한다.
@evidence obligations/design/models.md#addressable-model-decisions 공용 변기의 외곽·부품·`seat-lid` 인터페이스·표면 id·관찰을 이 한 H2에 두고, 세면장·거울·수건걸이·샤워부스·욕조·커튼 레일은 이 파일의 각자 H2로 나눠 결정마다 주소가 하나씩 있다.
@evidence obligations/design/models.md#model-review-set 관찰을 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 측면과 세 배치 평면으로 한정해 극적 샷 구도 없이 변기 구성을 개정 사이에 비교하게 한다.
@evidence obligations/design/models.md#reference-scale 세 예약이 공유하는 좌면 0.43 m·최대 높이 0.82 m를 욕실 설비의 기준 치수로 삼고, 폭은 세 구역 중 가장 좁은 0.65 m 안의 0.50 m로 맞춰 세 구역 어디서든 같은 크기로 검사된다.
@evidence obligations/design/models.md#articulation-ownership 시트 덮개의 뒤쪽 가로 경첩 피벗 `seat-lid`만 motion 인터페이스로 남기고, 방 문서가 여닫는 사용을 예약하지 않으므로 기준 상태를 닫힘으로 둔다.
-->

레퍼런스 02의 상층 욕실 위생도기와 05의 샤워 욕실 가장자리를 변기 계열로 채택한다. 배관 위치는 사진에서 추론하지 않는다.

변기는 [파우더룸](../settings/10-house.md#powder), [샤워 욕실](../settings/10-house.md#shower-bathroom), [욕조 욕실](../settings/10-house.md#tub-bathroom) 설정이 요구하는 변기를 세 방에 쓰는 한 원형이다. [파우더룸 예약](../spaces/rooms/powder.md#powder-fixture-use) X = [4.75, 5.50], Z = [-1.65, -0.95]와 [욕조 욕실 예약](../spaces/rooms/tub-bath.md#tub-fixture-use) X = [4.75, 5.50], Z = [-6.65, -5.95]는 전면 -X, 깊이 0.75 m, 폭 0.70 m다. [샤워 욕실 예약](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [2.32, 2.97], Z = [-8.80, -8.05]는 전면 +Z, 깊이 0.75 m, 폭 0.65 m다. 세 곳 모두 좌면 0.43 m·최대 높이 0.82 m다. 그러므로 외곽은 깊이 0.75 m, 높이 0.82 m, 폭은 가장 좁은 0.65 m 안의 0.50 m로 정한다. 폭 0.50 m는 물탱크 폭이며 세 예약 모두에 양옆 0.075 m 이상의 여유를 남기려는 이 층의 결정이다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 앉는 정면이며 공통 좌표 규칙은 [모델 국소 좌표](00-model-frame.md#model-local-frame)를 따른다.

부품은 물탱크, 탱크 뚜껑, 받침, 변기 몸통, 시트, 시트 덮개, 세척 레버다. 물탱크는 폭 0.50 m, 깊이 0.20 m, Y = [0.40, 0.78]이고 뚜껑이 0.78–0.82 m를 차지한다. 몸통은 벽에서 0.28–0.75 m까지 이어지는 12각 타원 단면이다. 바닥 접지 발은 폭 0.24 m·깊이 0.35 m·높이 0.20 m이고, 도기 몸통은 그 위에서 폭 0.38 m로 넓어져 Y = 0.40 m에 이른다. 그릇 상단은 폭 0.38 m·깊이 0.45 m, 안쪽 빈 공간은 폭 0.27 m·깊이 0.31 m·깊이 0.15 m인 12각 타원 컷이며 밑은 닫힌다. 두께 0.03 m 좌대 링의 상면은 0.43 m, 닫힌 덮개는 그 위 두께 0.025 m다. 좌대와 덮개 경첩은 뒤쪽 끝에 있다. 시트 덮개는 뒤쪽 가로 경첩 피벗 `seat-lid`를 갖지만 방 문서가 여닫는 사용을 예약하지 않으므로 기준 상태는 닫힘이고 이 인터페이스만 남긴다. 표면 id는 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 `ceramic`, `toilet-seat`, `lid`, `handle`이다.

국소 원점은 물탱크 뒤쪽 바닥 중앙이고 +Z는 앉는 방향이다. 탱크는 Z = [0, 0.20] m, 도기 발은 Z = [0.28, 0.63] m, 그릇은 Z = [0.28, 0.73] m, 앞끝 0.75 m까지는 0.02 m 도기 테가 차지한다. 좌대 링과 덮개는 각각 가로 0.38 m·앞뒤 0.45 m로 그릇 위에 놓고, 덮개의 뒤쪽 피벗은 Z = 0.28 m다. 물탱크 뚜껑은 0.50 × 0.20 × 0.04 m, 세척 레버는 탱크 앞면 왼쪽 X = -0.18 m·Y = 0.68 m에 중심을 둔 0.08 × 0.015 × 0.015 m 막대로 앞끝 Z = 0.215 m다.

도기 두께·배수 트랩·급수관은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 측면에서 좌면 0.43 m와 뚜껑 0.82 m가 보이는지, 세 배치의 평면에서 앞 끝이 각 사용 예약의 경계에 멈추는지다. 모든 관찰은 unverified다.

## 세면장 {#vanity-basin}
<!--
@evidence principles/core/common.md#scope-preservation 폭 W·깊이 D를 받는 한 세면장 원형으로 파우더룸·샤워 욕실·욕조 욕실 세 배치와 샤워 욕실 전용 세면 소품 셋을 맡고 배관·배수는 표현하지 않는다.
@evidence principles/core/common.md#substantive-completion 공통 상면 0.85 m, 걸레받이 0.10 m, 상판 0.03 m, W − 0.20 m × D − 0.20 m 타원 절개 아래 0.15 m 깊이의 세면볼, 상판 위 0.20 m 수전을 정해 세 매개변수 쌍에서 형상이 결정된다.
@evidence principles/core/common.md#declared-basis W·D 세 쌍(0.60/0.45 m, 0.70/0.55 m, 0.85/0.55 m)은 각 방 예약의 X·Z 범위에서 읽은 값이고, 소품을 상판 뒤쪽 0.12 m 띠에 두는 까닭을 세면볼 절개와 수전을 가리지 않기 위해서라고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 세 방 예약의 평면 상자와 상면 높이 위에 걸레받이·수납 몸통·문 전면·상판·매립 세면볼·수전의 부품 분할과 샤워 욕실에서만 켜는 선택 소품이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품 여섯과 선택 소품 셋, 세면볼을 열린 그릇으로 두는 음의 공간, 표면 id `plinth`, `carcass`, `leaf`, `countertop`, `ceramic`, `faucet`, `accessory`를 정하고 문은 홈 손잡이의 강체로 둔다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따라 +Z가 사용자가 서는 정면이고, 세면볼은 상판 중심, 수전은 볼 뒤쪽 가장자리, 소품은 상판 뒤쪽 0.12 m 띠라는 배치 오프셋을 준다.
@evidence principles/design/models.md#reviewable-structure 샤워 욕실 배치에서 세 소품이 볼과 수전 뒤에 보이는지, 세 매개변수 쌍의 평면 외곽이 각 예약과 같은지, 측면에서 상면 0.85 m가 읽히는지가 반증 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 라벨 대신 홈 손잡이 문 전면, 타원 절개 매립 볼, 두께 0.03 m 상판이라는 구성 결정을 두고 색·마감은 정하지 않은 채 표면 id로만 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 공통 상면 0.85 m, W·D 매개변수, 여섯 부품 계층, 샤워 욕실 전용 소품 층, 배관·배수 비표현, unverified 관찰 셋이 함께 있어 세 배치 모두 추가 발명 없이 만들어진다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 세 방 예약의 X·Z 범위와 전면 방향(-Z, -X, -X)을 W·D 매개변수로 그대로 옮겼고 샤워 욕실 설정의 세면 소품 요구도 적힌 대로 받아 부모에 고칠 결함이 없었다.
@evidence spaces/rooms/powder.md#powder-fixture-use 파우더룸 예약 X = [3.65, 4.25], Z = [-0.70, -0.25]를 W = 0.60 m, D = 0.45 m, 전면 -Z 세면장으로 소비한다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 욕실 예약 X = [2.52, 3.07], Z = [-6.80, -6.10]을 W = 0.70 m, D = 0.55 m, 전면 -X 세면장으로 소비한다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실 예약 X = [4.95, 5.50], Z = [-5.75, -4.90]을 가장 넓은 W = 0.85 m, D = 0.55 m, 전면 -X 세면장으로 소비한다.
@evidence settings/10-house.md#shower-bathroom 샤워 욕실 설정이 요구하는 세면 소품을 비누 받침 0.12 × 0.08 × 0.02 m, 펌프 병 지름 0.07 m·높이 0.18 m, 칫솔 컵 지름 0.07 m·높이 0.10 m의 선택 부품으로 샤워 욕실 배치에서만 켠다.
@evidence settings/10-house.md#powder 파우더룸 설정의 손씻는 세면대를 W = 0.60 m, D = 0.45 m 매개변수의 이 원형으로 제공한다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실 설정의 세면대를 W = 0.85 m, D = 0.55 m 매개변수로 제공하되 설정이 말한 회갈색은 이 H2가 정하지 않고 표면 id `carcass`, `leaf`로만 남긴다.
-->

레퍼런스 02의 욕실 세면장과 05의 샤워 욕실 문 너머 세면 구역을 채택한다. 방마다 다른 폭은 예약에서 받는다.

세면장은 폭 W와 깊이 D를 받는 한 원형이며 상면은 세 곳 모두 0.85 m다. [파우더룸](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.70, -0.25]는 W = 0.60 m, D = 0.45 m, 전면 -Z다. [샤워 욕실](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [2.52, 3.07], Z = [-6.80, -6.10]은 W = 0.70 m, D = 0.55 m이고, [욕조 욕실](../spaces/rooms/tub-bath.md#tub-fixture-use) X = [4.95, 5.50], Z = [-5.75, -4.90]은 W = 0.85 m, D = 0.55 m이며 둘 다 전면 -X다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 사용자가 서는 정면이다.

부품은 걸레받이(0.10 m), 수납 몸통, 문 전면, 상판(0.03 m), 매립 세면볼, 수전이다. 상판은 전체 W × D이고 세면볼은 상판 중심의 W − 0.20 m × D − 0.20 m 타원 절개 아래 0.15 m 깊이의 열린 그릇이다. 수전은 볼 뒤쪽 가장자리 가운데에 서며 지름 0.025 m의 수직 기둥 0.16 m와 지름 0.018 m의 토출관 0.10 m를 연결해 상판 위 0.20 m에 끝을 둔다. 폭 0.60 m 파우더룸에는 폭 0.56 m 문 한 장, 폭 0.70·0.85 m인 두 욕실에는 각각 폭 0.32·0.395 m 문 두 장을 둔다. 몸통 옆판과 각 문 사이 0.02 m, 두 문 사이 0.02 m를 남긴다. 따라서 0.70 = 2 × 0.32 + 3 × 0.02 m, 0.85 = 2 × 0.395 + 3 × 0.02 m다. 각 문은 Y = [0.10, 0.82] m, 두께 0.02 m이고 윗변에서 깊이 0.012 m·높이 0.018 m의 홈 손잡이를 파며 추가 전면 돌출이 없는 강체다. 표면 id는 `plinth`, `carcass`, `leaf`, `countertop`, `ceramic`, `faucet`, 홈 안쪽의 `handle`이다.

[샤워 욕실 설정](../settings/10-house.md#shower-bathroom)이 요구하는 세면 소품은 샤워 욕실 배치에서만 켜는 선택 부품으로 두며, 상판 뒤쪽 0.12 m 띠 안에 비누 받침(0.12 × 0.08 × 0.02 m), 펌프 병(지름 0.07 m, 높이 0.18 m), 칫솔 컵(지름 0.07 m, 높이 0.10 m)을 놓아 세면볼 절개와 수전을 가리지 않는다. 표면 id는 `accessory`다. 배관·배수는 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 샤워 욕실 배치에서 세 소품이 볼과 수전 뒤에 보이는지, 세 매개변수 쌍의 평면 외곽이 각 예약과 같은지, 측면에서 상면 0.85 m가 읽히는지다. 모든 관찰은 unverified다.

## 벽 거울 {#wall-mirror}
<!--
@evidence principles/core/common.md#scope-preservation 폭 W를 받는 벽 거울 원형으로 파우더룸과 욕조 욕실 두 배치만 맡고 실제 반사는 materials와 렌더 소유로 넘긴다.
@evidence principles/core/common.md#substantive-completion 높이 0.80 m, 돌출 0.04 m, 테두리 폭 0.02 m·깊이 0.04 m, 테두리 안쪽 면에서 0.03 m 뒤의 깊이 0.01 m 거울 판을 정한다.
@evidence principles/core/common.md#declared-basis W = 0.60 m와 0.85 m는 두 방 거울 예약의 가로 폭이고 높이 0.80 m는 두 예약의 1.10–1.90 m 범위와 같아 수치의 출처가 본문 링크에서 추적된다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 문서의 거울 예약 상자(두께 0.04 m, 높이 1.10–1.90 m) 위에 테두리와 뒤로 물러난 거울 판의 두 부품 구성, 하단 중심 원점이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 테두리와 거울 판 두 부품, 표면 id `mirror-frame`, `mirror`를 두고 이 원형은 평면만 주며 반사를 주장하지 않는다고 적는다. 보이지 않는 한계는 본문의 "거울 뒤 고정 철물과 모서리 모따기는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 벽걸이 원형이므로 원점을 벽면 위 거울 하단의 가로 중심 1.10 m에 두는 가구 국소 좌표의 예외를 밝힌다.
@evidence principles/design/models.md#reviewable-structure 측면에서 돌출이 0.04 m를 넘지 않는지, 정면에서 하단이 세면장 상면 위 0.25 m에 있는지가 거울을 반증할 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 폭 0.02 m 얇은 테두리와 0.03 m 들어간 판이라는 구성만 정하고 반사 외관은 materials와 렌더에 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 돌출 0.04 m·높이 0.80 m 규모, 테두리·판 두 부품 계층, 반사 비표현 한계, unverified 관찰 두 가지가 함께 거울 블로킹을 결정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 파우더룸 거울 X = [3.65, 4.25]·Z = [-0.29, -0.25]와 욕조 욕실 거울 X = [5.46, 5.50]·Z = [-5.75, -4.90]의 1.10–1.90 m 범위를 적힌 그대로 받았고 돌출 0.04 m가 두 예약 두께와 같아 부모 수정이 없었다.
@evidence spaces/rooms/powder.md#powder-fixture-use 파우더룸 거울 예약 X = [3.65, 4.25], Z = [-0.29, -0.25], 높이 1.10–1.90 m를 W = 0.60 m 거울로 소비한다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실 거울 예약 X = [5.46, 5.50], Z = [-5.75, -4.90], 상층 바닥 위 1.10–1.90 m를 W = 0.85 m 거울로 소비한다.
@evidence settings/10-house.md#powder 파우더룸 설정이 요구하는 거울을 이 원형의 W = 0.60 m 배치로 제공한다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실 설정이 기능 표지로 든 거울을 이 원형의 W = 0.85 m 배치로 제공한다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 욕실 오른쪽 벽 세면장 위의 거울 예약 X = [3.03, 3.07], Z = [-6.80, -6.10], 상층 바닥 위 1.10–1.90 m를 W = 0.70 m, 돌출 0.04 m의 세 번째 배치로 소비한다.
@evidence settings/10-house.md#shower-bathroom 샤워 욕실 설정의 거울을 세면장 폭과 같은 W = 0.70 m 벽 거울 배치로 제공한다.
-->

레퍼런스 02의 욕실 거울은 세면장 위 직사각으로 채택한다. 반사 속 장면을 거울 텍스처로 붙이지 않는다.

거울은 폭 W를 받는 한 원형이며 높이 0.80 m, 돌출 0.04 m다. [파우더룸 거울](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.29, -0.25], 높이 1.10–1.90 m는 W = 0.60 m이고, [욕조 욕실 거울](../spaces/rooms/tub-bath.md#tub-fixture-use) X = [5.46, 5.50], Z = [-5.75, -4.90], 상층 바닥 위 1.10–1.90 m는 W = 0.85 m이며, [샤워 욕실 거울](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [3.03, 3.07], Z = [-6.80, -6.10], 상층 바닥 위 1.10–1.90 m는 세면장 폭과 같은 W = 0.70 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르되 벽걸이 원형이므로 원점을 벽면 위 거울 하단의 가로 중심 1.10 m에 둔다.

부품은 테두리(폭 0.02 m, 깊이 0.04 m)와 거울 판(깊이 0.01 m, 테두리 안쪽 면에서 0.03 m 뒤)이다. 표면 id는 `mirror-frame`, `mirror`다. 실제 반사는 materials와 렌더 소유이며 이 원형은 평면만 준다. 거울 뒤 고정 철물과 모서리 모따기는 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 측면에서 돌출이 0.04 m를 넘지 않는지, 정면에서 하단이 세면장 상면 위 0.25 m에 있는지다. 모든 관찰은 unverified다.

## 수건걸이와 수건 {#towel-bar}
<!--
@evidence principles/core/common.md#scope-preservation 폭 W·높이 H를 받는 수건걸이와 걸린 수건 원형으로 세 방 배치를 맡고 수건 주름은 표현하지 않는다.
@evidence principles/core/common.md#substantive-completion 봉 지름 0.02 m, 봉 앞면 벽에서 0.05 m·수건 앞면 0.08 m, 예약 상단 0.03 m 아래, 두께 0.03 m 수건 판 둘이 봉 폭의 90 %를 덮고 예약 하단까지 내려온다고 정한다.
@evidence principles/core/common.md#declared-basis W·H 세 쌍(0.50/0.30 m, 0.25/0.40 m, 0.75/0.40 m)은 방 예약의 폭과 높이 범위에서 왔고 걸린 수건까지 돌출 0.08 m 안에 담는다는 한계를 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 세 방의 수건 예약 상자에 벽 받침 둘·가로 봉·앞뒤 두 판으로 접은 수건이라는 부품 결정을 더한다.
@evidence principles/design/models.md#representation-contract 벽 받침 둘, 가로 봉, 걸린 수건의 부품과 표면 id `rod`, `towel`을 두고 주름은 이 프록시가 주장하지 않는다.
@evidence principles/design/models.md#spatial-convention 벽걸이 원형이므로 원점을 벽면 위 예약 하단의 가로 중심에 두고 봉 앞면은 벽에서 0.05 m, 수건 앞면은 0.08 m, 예약 상단 0.03 m 아래에 둔다.
@evidence principles/design/models.md#reviewable-structure 측면에서 수건 앞면이 벽에서 0.08 m 안인지가 수건걸이를 반증할 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 라벨 없이 지름 0.02 m 봉과 반으로 접은 두께 0.03 m 두 판이라는 단순한 실루엣과 추상화 수준만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 돌출 0.08 m 상한, W·H 매개변수, 받침·봉·수건 계층, 주름 비표현, 측면 관찰 하나가 함께 수건걸이 블로킹을 결정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 파우더룸 X = [4.40, 4.90]·1.20–1.50 m, 샤워 욕실 X = [2.20, 2.45]·1.10–1.50 m, 욕조 욕실 Z = [-6.85, -6.10]·1.10–1.50 m 예약을 W·H로 그대로 옮겼고 부모에 고칠 결함이 없었다.
@evidence spaces/rooms/powder.md#powder-fixture-use 파우더룸 수건 예약 X = [4.40, 4.90], 높이 1.20–1.50 m를 W = 0.50 m, H = 0.30 m로 소비한다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 욕실 수건 예약 X = [2.20, 2.45], 상층 바닥 위 1.10–1.50 m를 W = 0.25 m, H = 0.40 m로 소비한다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실 수건 예약 Z = [-6.85, -6.10], 상층 바닥 위 1.10–1.50 m를 W = 0.75 m, H = 0.40 m로 소비한다.
@evidence settings/10-house.md#powder 파우더룸 설정의 수건을 봉에 반으로 접어 건 W = 0.50 m, H = 0.30 m 수건으로 제공한다.
@evidence settings/10-house.md#shower-bathroom 샤워 욕실 설정의 수건을 세 배치 중 가장 좁은 W = 0.25 m, H = 0.40 m 수건걸이로 제공한다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실 설정이 기능 표지로 든 수건을 W = 0.75 m 봉에 걸린 앞뒤 두 판으로 제공한다.
-->

레퍼런스 02·05의 욕실 직물 소품을 수건걸이에 걸린 수건으로 채택한다. 주름과 문양은 원형 형상에서 제외한다.

수건걸이는 폭 W와 높이 H를 받는 한 원형이며 걸린 수건까지 돌출 0.08 m 안에 담는다. [파우더룸](../spaces/rooms/powder.md#powder-fixture-use) X = [4.40, 4.90], 높이 1.20–1.50 m는 W = 0.50 m, H = 0.30 m이고, [샤워 욕실](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [2.20, 2.45], 상층 바닥 위 1.10–1.50 m는 W = 0.25 m, H = 0.40 m이며, [욕조 욕실](../spaces/rooms/tub-bath.md#tub-fixture-use) Z = [-6.85, -6.10], 상층 바닥 위 1.10–1.50 m는 W = 0.75 m, H = 0.40 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르되 벽걸이 원형이므로 원점을 벽면 위 예약 하단의 가로 중심에 둔다.

부품은 벽 받침 둘, 가로 봉, 걸린 수건이다. 가로 봉의 표면 id는 `rod`다. 봉은 지름 0.02 m이고 중심이 벽에서 0.04 m라 봉 앞면이 0.05 m에 오며, 예약 상단 0.03 m 아래에 둔다. 돌출 0.08 m는 벽면에서 앞쪽 수건 판의 앞면까지 잰 값이며 봉 앞면 0.05 m에 수건 두께 0.03 m를 더해 정확히 0.08 m다. 벽 받침 둘은 지름 0.03 m 원판과 짧은 팔이며 표면 id는 `bracket`이다. 수건은 봉에 반으로 접어 건 두께 0.03 m의 판 둘(앞뒤)로 봉 폭의 90 %를 덮고 예약 하단까지 내려온다. 표면 id는 `rod`, `bracket`, `towel`이다. 주름은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 측면에서 수건 앞면이 벽에서 0.08 m 안인지다. 모든 관찰은 unverified다.

## 미닫이 유리 샤워부스 {#sliding-shower-booth}
<!--
@evidence principles/core/common.md#scope-preservation 샤워 욕실 예약의 폭 1.25 m·깊이 1.10 m·높이 2.10 m 부스에서 방 벽이 이루는 두 면을 빼고 앞면과 오른쪽 면만 만들며 물·김 서림·실링은 제외한다.
@evidence principles/core/common.md#substantive-completion 오른쪽 고정 유리 두께 0.008 m, 앞면 유리 셋 각 폭 0.43 m와 0.02 m 겹침, 앞면 안쪽 0.09 m에 드는 깊이 0.03 m 트랙 셋, 수전 1.00 m·헤드 1.95 m를 정한다.
@evidence principles/core/common.md#declared-basis 왼쪽 통과 폭 0.80 m가 1.25 m에서 포갠 묶음 0.43 m와 벽 쪽 프로파일 0.02 m를 뺀 산술이며 방 문서의 0.80 m 이상 요구와 맞춘 값이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 문서의 부스 외곽과 0.80 m 이상 통과 폭 요구 위에 세 장 미닫이 유리·세 트랙·오른쪽 끝 포개짐이라는 모델 구성을 더한다.
@evidence principles/design/models.md#representation-contract 바닥판·오른쪽 고정 유리·위아래 트랙 레일·미닫이 유리 셋·손잡이·수전과 헤드의 부품과 표면 id `shower-tray`, `glass`, `rail`, `handle`, `faucet`을 정하고 나머지 두 면은 방 벽에 맡긴다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 yaw 0으로 두어 로컬 +X·+Z가 world +X·+Z이고, 세 패널 피벗은 로컬 +X를 따라 미끄러지며 트랙은 부스 외곽을 넘지 않는다.
@evidence principles/design/models.md#reviewable-structure 닫힘과 최대 열림의 사선 투시에서 패널이 외곽 안에서만 움직이는지와 열린 평면에서 왼쪽 통과 폭 0.80 m가 남는지가 반증 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 라벨 대신 세 장이 겹치는 유리 앞면과 가장 왼쪽 패널의 세로 막대 손잡이라는 구성을 정하고 손잡이의 검은 마감은 materials 바인딩으로 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽 1.25 × 1.10 × 2.10 m, 패널 폭 0.43 m, 세 피벗 인터페이스, 물·김 서림·실링 비표현, 닫힘·최대 열림 두 상태 관찰이 함께 부스 블로킹을 결정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 샤워 욕실 예약 X = [0.90, 2.15]·Z = [-8.80, -7.70]·2.10 m와 통과 폭 0.80 m 이상 요구를 그대로 소비했고 포갠 뒤 통과 폭 0.80 m로 요구가 충족되어 부모 수정이 없었다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 욕실 예약 X = [0.90, 2.15], Z = [-8.80, -7.70], 상층 바닥 위 2.10 m를 부스 외곽으로, 0.80 m 이상 통과 폭을 최대 열림의 목표로 소비한다.
@evidence settings/10-house.md#shower-bathroom 샤워 욕실 설정의 유리 샤워부스와 유리문·검은 금속 손잡이를 미닫이 유리 셋과 세로 막대 손잡이로 표현하고 검은 마감은 materials가 바인딩한다고 넘긴다.
@evidence obligations/design/models.md#representation-ceiling 이 부스는 물·김 서림·실링을 표현하지 않고 손잡이 마감도 materials에 넘기므로, 리뷰어는 유리 형상에서 물 표현이나 방수 실링을 읽어 내면 안 된다.
@evidence obligations/design/models.md#articulation-ownership 앞면 세 유리의 피벗 `panel-1`, `panel-2`, `panel-3`가 로컬 +X로 미끄러져 오른쪽 끝에 한 장 폭으로 포개지는 motion 인터페이스이고, 오른쪽 유리는 고정 유리로 둔다.
-->

레퍼런스 02의 상층 유리 샤워부스를 채택한다. 레퍼런스 05는 내부를 부분만 보여 주므로 문 패널 수의 근거로 쓰지 않는다.

샤워부스는 [샤워 욕실 예약](../spaces/rooms/shower-bath.md#shower-fixture-use)의 X = [0.90, 2.15], Z = [-8.80, -7.70], 상층 바닥 위 2.10 m를 외곽으로 받아 폭 1.25 m, 깊이 1.10 m, 높이 2.10 m다. 방 왼쪽 벽과 뒤쪽 벽이 두 면을 이루므로 원형은 앞면과 오른쪽 면만 만든다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 yaw 0이므로 로컬 +Z는 world +Z, 로컬 +X는 world +X다.

부품은 바닥판, 오른쪽 고정 유리, 위아래 세 트랙 레일, 미닫이 유리 셋, 손잡이, 샤워 수전과 헤드다. 바닥판은 두께 0.018 m이고 상면은 완성 바닥 위 0.018 m다. 둘레 0.010 m 가장자리를 남기고 내부는 배수구 방향으로 0.004 m 내려가는 평면 네 장으로 나눈다. 오른쪽 고정 유리는 두께 0.008 m, 전체 깊이, 높이 2.10 m다. 앞면 세 유리는 각 폭 0.43 m이며 닫힘에서 0.02 m씩 겹쳐 3 × 0.43 - 2 × 0.02 = 1.25 m를 채운다. 세 패널은 피벗 `panel-1`, `panel-2`, `panel-3`로 로컬 +X를 따라 미끄러져 오른쪽 끝에 한 장 폭으로 포개지고, 포갠 묶음 0.43 m와 벽 쪽 프로파일 0.02 m를 빼면 왼쪽 통과 폭이 [방 문서의 0.80 m 이상](../spaces/rooms/shower-bath.md#shower-fixture-use)과 같은 0.80 m가 된다. 트랙 셋은 각 깊이 0.03 m로 앞면 안쪽 0.09 m에 들어 부스 외곽을 넘지 않는다. 손잡이는 가장 왼쪽 패널의 세로 막대다. 수전은 뒤쪽 벽의 가로 중앙에서 상층 바닥 위 1.05 m, 헤드는 2.05 m에 두어 방 owner의 높이와 맞춘다. 세 트랙은 각각 깊이 0.03 m·높이 0.025 m의 닫힌 직사각 단면이며 전면 안쪽부터 순서대로 놓는다. 세 이동 유리의 두께는 0.008 m, 높이는 바닥판 상면 0.018 m와 아래·위 레일 각 0.025 m를 빼 2.032 m다. 손잡이는 가장 왼쪽 패널 자유단에서 0.04 m 안쪽, 부스 바닥 위 1.00 m 중심의 지름 0.018 m·길이 0.20 m 수직 봉이며 부스 안쪽으로 0.025 m만 돌출한다. 수전은 뒤벽 중앙의 지름 0.08 m·깊이 0.025 m 원판과 지름 0.025 m·길이 0.075 m 토출관, 헤드는 벽에서 0.175 m 뻗은 지름 0.025 m 관 끝의 지름 0.14 m·두께 0.025 m 원판이다. 벽에서 최대 돌출은 수전 0.10 m·헤드 0.20 m의 부모 예약을 넘지 않는다.

표면 id는 `shower-tray`, `glass`, `rail`, `handle`, `faucet`이며 손잡이의 검은 마감은 materials가 바인딩한다. 물·김 서림·실링은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 닫힘과 최대 열림의 사선 투시에서 패널이 외곽 안에서만 움직이는지, 열린 평면에서 왼쪽 통과 폭 0.80 m가 남는지다. 모든 관찰은 unverified다.

## 욕조 겸 샤워 {#bathtub}
<!--
@evidence principles/core/common.md#scope-preservation 욕조 욕실 예약 안의 욕조 겸 샤워 하나를 외피 상자·앞치마 판·가장자리 테·욕조 속·수전·샤워 기둥·헤드로 맡고 물과 배수는 제외한다.
@evidence principles/core/common.md#substantive-completion 폭 0.80 m, 길이 1.80 m, 높이 0.55 m, 가장자리 테 폭 0.06 m, 바닥 위 0.15 m까지 파인 욕조 속, 테 위 0.15 m 수전, 바닥 위 1.90 m까지 오르는 샤워 기둥을 정한다.
@evidence principles/core/common.md#declared-basis 외곽 치수를 방 문서 예약 X = [4.70, 5.50]·Z = [-8.70, -6.90]·가장자리 0.55 m에서 읽고, 수전이 로컬 -X 끝인 근거를 yaw -π/2 변환과 world -Z 뒤쪽 끝으로 댄다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 예약 상자 위에 앞치마 면 +Z, 배치 yaw -π/2, 둥근 모서리 욕조 속이라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 부품 일곱과 테 안쪽의 둥근 모서리 욕조 속이라는 음의 공간, 표면 id `ceramic`, `faucet`을 정하고 물과 배수는 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 배치 yaw -π/2에서 로컬 +Z가 world -X, 로컬 +X가 world +Z이므로 수전이 있는 뒤쪽 끝(world -Z)이 로컬 -X 끝이라고 적는다.
@evidence principles/design/models.md#reviewable-structure 측면에서 가장자리 0.55 m가, 정면에서 수전이 뒤쪽 끝에 있는지가 욕조를 반증할 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 라벨 없이 앞치마 판, 폭 0.06 m 테, 둥근 모서리 욕조 속이라는 실루엣 결정만 두고 마감은 표면 id `ceramic`으로 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 길이 1.80 m와 가장자리 0.55 m, 일곱 부품 계층, 물·배수 비표현, unverified 관찰 두 가지가 함께 욕조 블로킹을 결정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 욕조 욕실 예약 X = [4.70, 5.50]·Z = [-8.70, -6.90]·가장자리 0.55 m를 외곽으로 그대로 받았고 이 H2가 방 문서 값을 바꿀 필요가 없어 부모 수정이 없었다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실 예약 X = [4.70, 5.50], Z = [-8.70, -6.90], 상층 바닥 위 가장자리 0.55 m를 폭 0.80 m·길이 1.80 m·높이 0.55 m 외곽으로 소비한다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실 설정의 욕조 겸 샤워와 욕조 가장자리·샤워 수전을 폭 0.06 m 테, 뒤쪽 끝 수전, 바닥 위 1.90 m까지 오르는 샤워 기둥과 헤드로 제공한다.
-->

레퍼런스 02의 별도 욕조 욕실 안 흰 욕조를 채택한다. 물과 배수 작동은 사진의 밝은 표면에서 추론하지 않는다.

욕조는 [욕조 욕실 예약](../spaces/rooms/tub-bath.md#tub-fixture-use)의 X = [4.70, 5.50], Z = [-8.70, -6.90], 상층 바닥 위 가장자리 0.55 m를 외곽으로 받아 폭 0.80 m, 길이 1.80 m, 높이 0.55 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z는 앞치마 면이다. 배치 yaw는 -π/2이고 이때 로컬 +Z는 world -X, 로컬 +X는 world +Z이므로 수전이 있는 뒤쪽 끝(world -Z)은 로컬 -X 끝이다.

부품은 외피 상자, 앞치마 판, 가장자리 테, 욕조 속, 수전, 샤워 기둥, 헤드다. 가장자리 테는 폭 0.06 m, 욕조 속은 테 안쪽에서 바닥 위 0.15 m까지 파인 둥근 모서리 공간이다. 수전은 뒤쪽 끝 벽면 가운데 테 위 0.15 m, 샤워 기둥과 헤드는 같은 끝에서 바닥 위 1.90 m까지 오른다. 표면 id는 `ceramic`, `faucet`이다. 물과 배수는 표현하지 않는다.

소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 측면에서 가장자리 0.55 m, 정면에서 수전이 뒤쪽 끝에 있는지다. 모든 관찰은 unverified다.

## 욕조 커튼 레일과 커튼 {#tub-curtain-rail}
<!--
@evidence principles/core/common.md#scope-preservation 욕조 위 커튼 레일, 앞쪽 매달림 봉, 커튼 판과 `curtain-open` 매개변수를 맡고 천장 높이는 방 owner에서 받는다고 경계를 둔다.
@evidence principles/core/common.md#substantive-completion 레일 지름 0.025 m·길이 1.80 m·높이 2.05 m, 매달림 봉 지름 0.02 m, 레일 아래 0.03 m부터 바닥 위 0.60 m까지 내려오는 두께 0.01 m 커튼 판을 정한다.
@evidence principles/core/common.md#declared-basis 레일은 욕조 전면에서 물 쪽 0.04 m의 부모 예약 안에 있고 길이 1.80 m는 욕조 길이와 같아 출처가 추적된다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 문서의 레일 위치와 높이 위에 앞쪽 매달림 봉 지지, 네 번 꺾인 판 주름, `curtain-open` 범위 1.80–0.25 m라는 모델 결정을 더한다.
@evidence principles/design/models.md#representation-contract 레일·매달림 봉·커튼 판의 부품과 표면 id `rail`, `curtain`을 정하고 걷은 상태의 주름을 네 번 꺾인 판으로 제한한다.
@evidence principles/design/models.md#spatial-convention 선형 부재 예외로 원점을 뒤쪽 벽에 닿는 레일 끝의 높이 2.05 m 점에 두고 +Z를 레일 방향, yaw 0으로 로컬 +Z = world +Z라고 적는다.
@evidence principles/design/models.md#reviewable-structure 펼친 상태와 걷은 상태의 사선 투시에서 커튼이 욕조 사용 범위로 늘어지지 않는지가 반증 관찰이다.
@evidence principles/design/models.md#model-observable-style-basis 라벨 없이 지름 0.025 m 원형 레일과 꺾인 판 주름이라는 추상화 수준만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 레일 길이 1.80 m와 높이 2.05 m, 천장까지 내려오는 매달림 봉, `curtain-open` 인터페이스, 두 상태 관찰이 함께 커튼 블로킹을 결정한다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 기존 레일이 욕조 전면보다 건조한 통로 쪽 0.08 m에 있어 커튼이 물을 욕조 밖으로 흘릴 수 있고 원형 점유 띠도 없었다. spaces/rooms/tub-bath.md#tub-fixture-use를 욕조 안쪽 0.04 m와 폭 0.10 m 띠로 정정하고 이 H2는 그 띠를 소비한다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 욕실 사용 예약의 물 쪽 0.04 m 레일·폭 0.10 m 띠·높이 2.05 m와 욕조 길이 1.80 m를 레일 원점과 점유 범위로 소비한다.
@evidence settings/10-house.md#tub-bathroom 욕조 욕실 설정이 기능 표지로 든 curtain rail/커튼을 지름 0.025 m 레일과 `curtain-open`으로 펼침 길이가 바뀌는 커튼 판으로 제공한다.
@evidence obligations/design/models.md#articulation-ownership 매개변수 `curtain-open`이 커튼의 펼친 길이를 1.80 m에서 0.25 m까지 바꾸는 motion 인터페이스이고 걷은 상태에서는 뒤쪽 끝 0.25 m 안에 모인다.
@evidence obligations/design/models.md#model-representation-completion 욕조 커튼의 레일·매달림 봉·커튼 층, 기준 치수 1.80 m·2.05 m, `curtain-open` 인터페이스, 표면 `rail`·`rod`·`curtain`, unverified 관찰 owner를 적는다. 뒤따르는 욕실 매트와 벽감 병도 이 파일의 별도 원형으로 계정에 포함한다.
-->

레퍼런스 02의 욕조 옆 가림막을 커튼·레일로 채택한다. 실제 펼침과 걷힘은 방의 사용 예약에 맞는 관절 범위로 정한다.

커튼 레일은 [방 문서](../spaces/rooms/tub-bath.md#tub-fixture-use)가 예약한 욕조 앞면에서 물 쪽으로 0.04 m 들어간 선을 따라 욕조 길이 1.80 m 전체에 놓인다. [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 선형 부재이므로 원점을 뒤쪽 벽에 닿는 레일 끝의 높이 2.05 m 점에 두고 +Z를 레일 방향으로 둔다. 배치 yaw는 욕조의 긴 축과 맞추되 world 좌표는 방 owner에게서 계산한다. 레일은 지름 0.025 m, 길이 1.80 m이며 앞쪽 끝은 천장까지 내려오는 지름 0.02 m 매달림 봉으로 받친다. 천장 높이는 방 owner에서 받는다.

커튼은 레일 아래 0.03 m부터 바닥 위 0.60 m까지 내려오는 두께 0.01 m의 판이고 매개변수 `curtain-open`이 펼친 길이를 1.80 m에서 0.25 m까지 바꾼다. 걷은 상태에서는 뒤쪽 끝 0.25 m 안에 모이며 이때 주름을 네 번 꺾인 판으로 표현한다. 레일의 모든 면은 `rail`, 천장에 닿는 받침봉은 `rod`, 커튼의 양면과 절단 끝은 `curtain`이다. 걷은 네 접힘의 욕조 전면 법선 변위는 각 절점에서 0, +0.015, 0, -0.015, 0 m이고 천 두께 0.01 m를 더해도 중심선에서 ±0.02 m여서 부모의 폭 0.10 m 띠 안에 머문다. 레일·봉의 UV는 길이 U·둘레 V, 커튼은 긴 방향 U·높이 V를 미터로 둔다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 펼친 상태와 걷은 상태의 사선 투시에서 커튼이 욕조 사용 범위로 늘어지지 않는지다. 모든 관찰은 unverified다.

## 두 욕실의 얇은 바닥 매트 {#bath-floor-mats}
<!--
@evidence principles/core/common.md#scope-preservation 샤워 욕실과 욕조 욕실의 이미 예약된 기구 앞 사용 바닥에 깔리는 두 매트 원형을 맡고 바닥 슬래브·타일 면을 복제하지 않는다.
@evidence principles/core/common.md#substantive-completion 샤워 매트 0.65 × 0.45 × 0.008 m, 욕조 매트 0.80 × 0.45 × 0.008 m와 사용 영역의 좌우 여유를 산술로 정한다.
@evidence principles/core/common.md#declared-basis spaces/rooms/shower-bath.md#shower-fixture-use와 spaces/rooms/tub-bath.md#tub-fixture-use의 서 있는 구간을 host 예약으로 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 기구 사용 바닥에 얇은 직물 덮개를 추가하되 통행·문 회전과 바닥 owner를 바꾸지 않는다.
@evidence principles/design/models.md#representation-contract 0.04 m 안쪽 테 `border`와 몸판 `field`의 모든 면을 나누고 젖은 상태·섬유 털은 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 원점은 host 사용 바닥 중심, 긴 방향을 기구 전면에 평행한 국소 X, 두께는 Y = [0, 0.008] m다.
@evidence principles/design/models.md#reviewable-structure 각 사용 영역 안의 매트 외곽과 문 회전·발 디딤을 위에서 검사한다.
@evidence principles/design/models.md#model-observable-style-basis 타일 위 작은 직물 면과 좁은 테가 레퍼런스 05 욕실을 빈 타일 바닥과 구별한다.
@evidence principles/design/models.md#model-scale-layer-completion 두 매개변수 외곽·두께·면·UV·원점과 02·05 검사 주소를 모두 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 이미 지정한 기구 앞 사용 바닥에 0.008 m 얇은 덮개가 포함돼 부모 경계 변경은 없다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워부스 앞 대기 폭 0.90 m·깊이 0.60 m에 작은 매트를 맞춘다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use 욕조 긴 면 앞 사용 폭 1.05 m·길이 1.55 m에 작은 매트를 맞춘다.
@evidence obligations/design/models.md#addressable-model-decisions 욕실 매트를 도기·유리와 다른 H2에 둬 얇은 덮개가 기구로 계산되지 않게 한다.
-->

레퍼런스 02·05의 욕실 매트를 채택한다. [샤워 욕실 대기](../spaces/rooms/shower-bath.md#shower-fixture-use)의 0.90 × 0.60 m 바닥에는 0.65 × 0.45 m 매트 하나를 중심에 놓아 양쪽 0.125 m·앞뒤 0.075 m를 남긴다. [욕조 앞 사용](../spaces/rooms/tub-bath.md#tub-fixture-use)의 1.05 × 1.55 m 바닥에는 0.80 × 0.45 m 매트 하나를 욕조 긴 면에 평행하게 놓아 폭 방향 양끝 0.125 m를 남긴다. 둘 다 두께 0.008 m이고 둘레 0.04 m 띠 `border`와 안쪽 `field`가 상·하·절단면을 서로 겹치지 않게 덮는다. 접지 바닥 중심이 원점, 긴 방향 국소 X·짧은 방향 Z이며 UV는 국소 X/Z 미터다. 물의 흡수·미끄럼 저항·실제 바닥 배수는 주장하지 않는다. source owner는 `src/models/furnishings/bathrooms.ts`; 실제 기구 충돌·GPU 읽힘은 unverified다.

## 샤워 벽감 안의 용기 {#shower-niche-bottles}
<!--
@evidence principles/core/common.md#scope-preservation 왼쪽 샤워벽의 좁은 벽감에 놓는 병 세 개만 원형으로 맡고 벽감의 빈 부피·타일 면은 spaces가 소유한다.
@evidence principles/core/common.md#substantive-completion 지름 0.06·0.07·0.055 m, 높이 0.18·0.20·0.14 m 세 병과 0.025 m 사이 간격을 수치로 정한다.
@evidence principles/core/common.md#declared-basis 레퍼런스 05의 벽감 병과 spaces/rooms/shower-bath.md#shower-fixture-use에 정정한 0.40 m 벽감 폭·0.08 m 깊이를 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 비어 있는 벽감에 세 높이의 용기와 펌프를 더하되 벽 면을 소품으로 채운 듯 가장하지 않는다.
@evidence principles/design/models.md#representation-contract 병 몸통 `container`, 뚜껑·펌프 `lid`의 닫힌 면을 나누고 라벨·내용물은 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 원점은 벽감 선반 중앙, +Y 위·+Z는 샤워 사용자 쪽이며 위치는 host 벽감에서 instances가 계산한다.
@evidence principles/design/models.md#reviewable-structure 세 병이 벽감 바깥 0.90 m 방 안쪽 면을 넘지 않는지 단면에서 검사한다.
@evidence principles/design/models.md#model-observable-style-basis 크기가 다른 세 수납 병으로 05의 실제 사용하는 욕실 느낌을 내되 색·글자는 materials에 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 세 지름·높이·간격·표면 id·UV·host 점유를 결정하고 실제 벽감 geometry는 unverified다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 샤워 욕실 벽감의 host 좌표와 닫힌 후면 두께가 없어 spaces/rooms/shower-bath.md#shower-fixture-use에 벽감 예약을 추가했다. spaceSources의 실제 벽감 절개는 아직 unverified다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use 샤워 왼쪽 칸막이 벽감 0.40 × 0.40 × 0.08 m에 세 병을 담는다.
@evidence obligations/design/models.md#addressable-model-decisions 벽감의 벽 면과 내부 병 면을 다른 분기 owner로 구별한다.
-->

레퍼런스 05의 샤워 벽감 안 병 세 개를 채택한다. [샤워 욕실 벽감 예약](../spaces/rooms/shower-bath.md#shower-fixture-use)의 가로 0.40 m, 높이 0.40 m, 깊이 0.08 m 안에서 병 지름은 순서대로 0.06·0.07·0.055 m, 높이는 0.18·0.20·0.14 m다. 인접 간격은 0.025 m이므로 가로 합은 0.06 + 0.07 + 0.055 + 2 × 0.025 = 0.235 m이고 양끝 0.0825 m를 남긴다. 병은 12각 닫힌 원통, 윗 펌프는 지름 0.025 m·높이 0.035 m이고 전체 높이 값 안에 포함한다. 몸통 `container`, 뚜껑·펌프 `lid`는 모든 면을 덮고 원통 둘레 U·높이 V를 미터로 준다. 벽감 선반 가운데가 원점이고 실제 벽 절개는 `src/spaces/rooms/shower-bath.ts`가 소유한다. 세 병의 깊이 중심은 뒤판에서 개방면 쪽으로 0.04 m이고 최대 반지름 0.035 m를 적용하면 뒤판과 개방면에 각각 0.005 m 여유가 남는다. 병 밑면은 벽감 바닥에 닿고 가장 높은 병 위는 벽감 바닥보다 0.20 m 높아 천장보다 0.20 m 낮다. 병의 실제 source·GPU 프레임은 unverified다. source owner는 `src/models/furnishings/bathrooms.ts`다.
