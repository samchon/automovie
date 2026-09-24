# 파우더룸과 두 욕실의 설비 원형

## 공용 변기 {#shared-toilet}

변기는 세 방에 쓰는 한 원형이다. [파우더룸 예약](../spaces/rooms/powder.md#powder-fixture-use) X = [4.75, 5.50], Z = [-1.65, -0.95]와 [욕조 욕실 예약](../spaces/rooms/tub-bath.md#tub-fixture-use) X = [4.75, 5.50], Z = [-6.65, -5.95]는 전면 -X, 깊이 0.75 m, 폭 0.70 m다. [샤워 욕실 예약](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [2.32, 2.97], Z = [-8.80, -8.05]는 전면 +Z, 깊이 0.75 m, 폭 0.65 m다. 세 곳 모두 좌면 0.43 m·최대 높이 0.82 m다. 그러므로 외곽은 깊이 0.75 m, 높이 0.82 m, 폭은 가장 좁은 0.65 m 안의 0.50 m로 정한다. 폭 0.50 m는 물탱크 폭이며 세 예약 모두에 양옆 0.075 m 이상의 여유를 남기려는 이 층의 결정이다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 바닥 중심, +Z가 앉는 정면이며 공통 좌표 규칙은 [모델 국소 좌표](00-model-frame.md#model-local-frame)를 따른다.

부품은 물탱크, 탱크 뚜껑, 받침, 변기 몸통, 시트, 시트 덮개, 세척 레버다. 물탱크는 폭 0.50 m, 깊이 0.20 m, Y = [0.40, 0.78]이고 뚜껑이 0.78–0.82 m를 차지한다. 몸통은 폭 0.38 m, 벽에서 0.75 m까지 이어지는 둥근 끝 상자이며 좌면 링의 상면이 0.43 m다. 시트 덮개는 뒤쪽 가로 경첩 피벗 `seat-lid`를 갖지만 방 문서가 여닫는 사용을 예약하지 않으므로 기준 상태는 닫힘이고 이 인터페이스만 남긴다. 표면 id는 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 `ceramic`, `seat`, `lid`, `handle`이다.

도기 두께·배수 트랩·급수관은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 측면에서 좌면 0.43 m와 뚜껑 0.82 m가 보이는지, 세 배치의 평면에서 앞 끝이 각 사용 예약의 경계에 멈추는지다. 모든 관찰은 unverified다.

## 세면장 {#vanity-basin}

세면장은 폭 W와 깊이 D를 받는 한 원형이며 상면은 세 곳 모두 0.85 m다. [파우더룸](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.70, -0.25]는 W = 0.60 m, D = 0.45 m, 전면 -Z다. [샤워 욕실](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [2.52, 3.07], Z = [-6.80, -6.10]은 W = 0.70 m, D = 0.55 m이고, [욕조 욕실](../spaces/rooms/tub-bath.md#tub-fixture-use) X = [4.95, 5.50], Z = [-5.75, -4.90]은 W = 0.85 m, D = 0.55 m이며 둘 다 전면 -X다. 로컬 원점은 벽에 닿는 뒤쪽 모서리의 바닥 중심, +Z가 사용자가 서는 정면이다.

부품은 걸레받이(0.10 m), 수납 몸통, 문 전면, 상판(0.03 m), 매립 세면볼, 수전이다. 상판은 전체 W × D이고 세면볼은 상판 중심의 W − 0.20 m × D − 0.20 m 타원 절개 아래 0.15 m 깊이의 열린 그릇이다. 수전은 볼 뒤쪽 가장자리에 서며 상판 위 0.20 m, 토출 끝이 볼 위에 온다. 문은 홈 손잡이의 강체다. 표면 id는 `plinth`, `carcass`, `leaf`, `countertop`, `ceramic`, `faucet`이다.

배관·배수는 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 세 매개변수 쌍의 평면 외곽이 각 예약과 같은지, 측면에서 상면 0.85 m가 읽히는지다. 모든 관찰은 unverified다.

## 벽 거울 {#wall-mirror}

거울은 폭 W를 받는 한 원형이며 높이 0.80 m, 돌출 0.04 m다. [파우더룸 거울](../spaces/rooms/powder.md#powder-fixture-use) X = [3.65, 4.25], Z = [-0.29, -0.25], 높이 1.10–1.90 m는 W = 0.60 m이고, [욕조 욕실 거울](../spaces/rooms/tub-bath.md#tub-fixture-use) X = [5.46, 5.50], Z = [-5.75, -4.90], 상층 바닥 위 1.10–1.90 m는 W = 0.85 m다. 로컬 원점은 벽면 위 거울 하단의 가로 중심이며 원점 높이가 1.10 m에 놓이고 +Z가 방 안쪽이다.

부품은 테두리(폭 0.02 m, 깊이 0.04 m)와 거울 판(깊이 0.01 m, 테두리 안쪽 면에서 0.03 m 뒤)이다. 표면 id는 `frame`, `mirror`다. 실제 반사는 materials와 렌더 소유이며 이 원형은 평면만 준다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 측면에서 돌출이 0.04 m를 넘지 않는지, 정면에서 하단이 세면장 상면 위 0.25 m에 있는지다. 모든 관찰은 unverified다.

## 수건걸이와 수건 {#towel-bar}

수건걸이는 폭 W와 높이 H를 받는 한 원형이며 걸린 수건까지 돌출 0.08 m 안에 담는다. [파우더룸](../spaces/rooms/powder.md#powder-fixture-use) X = [4.40, 4.90], 높이 1.20–1.50 m는 W = 0.50 m, H = 0.30 m이고, [샤워 욕실](../spaces/rooms/shower-bath.md#shower-fixture-use) X = [2.20, 2.45], 상층 바닥 위 1.10–1.50 m는 W = 0.25 m, H = 0.40 m이며, [욕조 욕실](../spaces/rooms/tub-bath.md#tub-fixture-use) Z = [-6.85, -6.10], 상층 바닥 위 1.10–1.50 m는 W = 0.75 m, H = 0.40 m다. 로컬 원점은 벽면 위 예약 하단의 가로 중심이고 +Z가 방 안쪽이다.

부품은 벽 받침 둘, 가로 봉, 걸린 수건이다. 봉은 지름 0.02 m, 벽에서 0.05 m, 예약 상단 0.03 m 아래에 둔다. 수건은 봉에 반으로 접어 건 두께 0.03 m의 판 둘(앞뒤)로 봉 폭의 90 %를 덮고 예약 하단까지 내려온다. 표면 id는 `rail`, `towel`이다. 주름은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 측면에서 수건 앞면이 벽에서 0.08 m 안인지다. 모든 관찰은 unverified다.

## 미닫이 유리 샤워부스 {#sliding-shower-booth}

샤워부스는 [샤워 욕실 예약](../spaces/rooms/shower-bath.md#shower-fixture-use)의 X = [0.90, 2.15], Z = [-8.80, -7.70], 상층 바닥 위 2.10 m를 외곽으로 받아 폭 1.25 m, 깊이 1.10 m, 높이 2.10 m다. 방 왼쪽 벽과 뒤쪽 벽이 두 면을 이루므로 원형은 앞면과 오른쪽 면만 만든다. 로컬 원점은 뒤쪽 벽 모서리의 바닥 중심, +Z가 앞면(world +Z), +X가 world +X다.

부품은 바닥판, 오른쪽 고정 유리, 위아래 세 트랙 레일, 미닫이 유리 셋, 손잡이, 샤워 수전과 헤드다. 바닥판은 상면 0.02 m 이내다. 오른쪽 고정 유리는 두께 0.008 m, 전체 깊이, 높이 2.10 m다. 앞면 세 유리는 각 폭 0.43 m이며 닫힘에서 0.01 m씩 겹쳐 1.25 m를 채운다. 세 패널은 피벗 `panel-1`, `panel-2`, `panel-3`로 로컬 +X를 따라 미끄러져 오른쪽 끝에 한 장 폭으로 포개지고, 포갠 묶음 0.43 m와 벽 쪽 프로파일 0.02 m를 빼면 왼쪽 통과 폭이 [방 문서의 0.80 m 이상](../spaces/rooms/shower-bath.md#shower-fixture-use)과 같은 0.80 m가 된다. 트랙 셋은 각 깊이 0.03 m로 앞면 안쪽 0.09 m에 들어 부스 외곽을 넘지 않는다. 손잡이는 가장 왼쪽 패널의 세로 막대다. 수전은 뒤쪽 벽 가운데 1.00 m, 헤드는 1.95 m에 둔다.

표면 id는 `shower-tray`, `glass`, `rail`, `handle`, `faucet`이며 손잡이의 검은 마감은 materials가 바인딩한다. 물·김 서림·실링은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 닫힘과 최대 열림의 사선 투시에서 패널이 외곽 안에서만 움직이는지, 열린 평면에서 왼쪽 통과 폭 0.80 m가 남는지다. 모든 관찰은 unverified다.

## 욕조 겸 샤워 {#bathtub}

욕조는 [욕조 욕실 예약](../spaces/rooms/tub-bath.md#tub-fixture-use)의 X = [4.70, 5.50], Z = [-8.70, -6.90], 상층 바닥 위 가장자리 0.55 m를 외곽으로 받아 폭 0.80 m, 길이 1.80 m, 높이 0.55 m다. 로컬 원점은 벽에 닿는 긴 변의 바닥 중심, +Z가 앞치마 면(world -X), +X가 world -Z인 수전 쪽 끝이다.

부품은 외피 상자, 앞치마 판, 가장자리 테, 욕조 속, 수전, 샤워 기둥, 헤드다. 가장자리 테는 폭 0.06 m, 욕조 속은 테 안쪽에서 바닥 위 0.15 m까지 파인 둥근 모서리 공간이다. 수전은 뒤쪽 끝 벽면 가운데 테 위 0.15 m, 샤워 기둥과 헤드는 같은 끝에서 바닥 위 1.90 m까지 오른다. 표면 id는 `ceramic`, `faucet`이다. 물과 배수는 표현하지 않는다.

소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 측면에서 가장자리 0.55 m, 정면에서 수전이 뒤쪽 끝에 있는지다. 모든 관찰은 unverified다.

## 욕조 커튼 레일과 커튼 {#tub-curtain-rail}

커튼 레일은 [방 문서](../spaces/rooms/tub-bath.md#tub-fixture-use)대로 world X = 4.62 m에서 욕조의 Z 길이 [-8.70, -6.90]을 따라 상층 바닥 위 2.05 m에 놓인다. 로컬 원점은 뒤쪽 벽에 닿는 레일 끝의 높이 2.05 m 점, +Z가 레일 방향(world +Z)이다. 레일은 지름 0.025 m, 길이 1.80 m이며 앞쪽 끝은 천장까지 내려오는 지름 0.02 m 매달림 봉으로 받친다. 천장 높이는 방 owner에서 받는다.

커튼은 레일 아래 0.03 m부터 바닥 위 0.60 m까지 내려오는 두께 0.01 m의 판이고 매개변수 `curtain-open`이 펼친 길이를 1.80 m에서 0.25 m까지 바꾼다. 걷은 상태에서는 뒤쪽 끝 0.25 m 안에 모이며 이때 주름을 네 번 꺾인 판으로 표현한다. 표면 id는 `rail`, `curtain`이다. 소스 owner는 `src/models/furnishings/bathrooms.ts`다. 관찰은 펼친 상태와 걷은 상태의 사선 투시에서 커튼이 욕조 사용 범위로 늘어지지 않는지다. 모든 관찰은 unverified다.
