# 외부 창의 충전 부재

## 창 모델의 외곽과 벽 안 깊이 {#window-local-frame}

모든 외부 창은 [공통 국소 좌표](00-model-frame.md#model-local-frame)를 쓰고 원점 면은 외벽 날씨 면이다. 창 모델 하나는 [공통 개구부 인계](../spaces/06-openings.md#external-opening-interface)의 거친 직사각 개구부 하나를 채우고 좌표와 칸 수는 네 입면 owner에서 받는다. frame 외곽의 폭과 높이는 거친 개구부와 같고, blocking 수준의 틈새 shim은 [표현 상한](00-model-frame.md#model-representation-ceiling)에서 만들지 않는 부재로 본다. frame 바깥 면은 국소 Z = -0.04 m, 안쪽 면은 Z = -0.18 m로 06의 0.04 m 물림과 0.14 m 깊이를 그대로 소비한다. 소스 owner는 `src/models/windows.ts`이며 각 방 안쪽 reveal 단면으로 검사한다.

## 창틀·sash·mullion·살대의 부재 치수 {#window-member-sizes}

spaces와 settings가 부재 폭을 정하지 않았으므로 frame 둘레 입면 폭 0.06 m, sash 둘레 0.05 m, 칸 사이 mullion 0.08 m, 살대 0.025 m를 모델 결정으로 택한다. 근거는 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 짙은 charcoal 창틀이 흰 trim 안쪽에서 선으로 읽혀야 하고 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 외부 기본 view에서도 frame과 sash가 구별돼야 한다는 점, 그리고 가장 작은 [계단 창](../spaces/envelope/front.md#stair-front-window) 폭 0.78 m에서도 유리 폭이 0.56 m 남는다는 산출이다. 칸 폭은 (거친 폭 - 2 × 0.06 - (칸 수 - 1) × 0.08) / 칸 수이고 이 값이 0.30 m 미만이면 실패로 보고한다. 깊이는 frame 0.14 m 전부, sash 0.05 m, 유리는 두께 0.006 m 판 하나다. 소스 owner는 `src/models/windows.ts`이며 정면 직교 뷰에서 부재 폭을 잰다.

## 살대 격자 {#window-muntin-grid}

[settings 개구부](../settings/10-house.md#openings)가 살대를 요구하므로 투명 유리를 가진 모든 sash는 가운데 세로 살대 하나와 가로 살대 하나로 2열 × 2행 유리 칸을 만든다. 한 sash 안의 격자는 입면 전체에서 같은 비례로 반복되어 [전면 입면](../spaces/envelope/front.md#front-openings)의 넓은 창·침실 창·작은 계단 창의 위계를 칸 수와 창 크기로만 읽게 하고 살대 무늬로 위계를 바꾸지 않는다. 흐린 유리의 [욕조 욕실 창](../spaces/envelope/right.md#tub-right-window)은 살대를 두지 않는다. 살대는 유리 양면에 붙는 0.01 m 깊이 막대로 만들고 유리를 관통하는 구멍을 만들지 않는다. 소스 owner는 `src/models/windows.ts`다.

## 상하 미닫이 창의 계층과 기준 상태 {#double-hung-window}

거실·침실·주방·가족실의 창은 [06의 작동 배정](../spaces/06-openings.md#external-opening-interface)대로 상하 미닫이다. 대상은 [거실 전면 세 칸](../spaces/envelope/front.md#living-front-window), [올리브 침실](../spaces/envelope/front.md#bedroom-two-front-window)·[청회색 침실](../spaces/envelope/front.md#bedroom-three-front-window) 두 칸, [주방 한 칸](../spaces/envelope/rear.md#kitchen-rear-window), [가족실 후면 두 칸](../spaces/envelope/rear.md#family-rear-window), [주침실 후면 두 칸](../spaces/envelope/rear.md#primary-rear-window), [거실 왼쪽 한 칸](../spaces/envelope/left.md#living-left-window), [주침실 왼쪽 두 칸](../spaces/envelope/left.md#primary-left-window), [가족실 오른쪽 두 칸](../spaces/envelope/right.md#family-right-window)이다. 계층은 `frame` 아래 칸마다 `unit-<n>`, 그 아래 `upper-sash`와 `lower-sash`이며 두 sash는 칸 유효 높이를 같은 두 부분으로 나눈다. 바깥 트랙의 upper와 안쪽 트랙의 lower 사이는 0.02 m이며 두 sash 깊이 0.10 m와 합한 0.12 m가 0.14 m frame 깊이 안에 앞뒤 0.01 m씩 여유를 남기도록 정했다.

motion 인터페이스는 각 `lower-sash`의 국소 +Y 평행 이동 하나이며 범위는 0부터 sash 높이의 절반까지다. `upper-sash`는 rigid 고정이다. 기준 상태는 [06](../spaces/06-openings.md#external-opening-interface)과 [settings 개구부](../settings/10-house.md#openings)대로 모두 닫힌 이동 0이다. 소스 owner는 `src/models/windows.ts`이며 닫힘과 최대 열림의 사선 투시로 검사한다.

## 고정창의 계층 {#fixed-window}

[계단 창](../spaces/envelope/front.md#stair-front-window)의 한 칸과 [차고 측면 창](../spaces/envelope/right.md#garage-right-window)의 두 칸은 고정창이다. 계층은 `frame` 아래 칸마다 `unit-<n>`과 `fixed-sash` 하나이며 sash는 frame 깊이의 가운데에 둔다. 관절 인터페이스는 없고 모든 부재가 rigid다. 소스 owner는 `src/models/windows.ts`이며 계단참과 차고 내부 reveal 단면으로 검사한다.

## 욕조 욕실의 상부 경첩창 {#awning-window}

[욕조 욕실 창](../spaces/envelope/right.md#tub-right-window) Z = [-8.40, -7.50], Y = [4.56, 5.31] m은 한 칸의 상부 경첩창이다. 계층은 `frame` 아래 `awning-sash` 하나이며 경첩 축은 sash 위 변 바깥 모서리를 지나는 국소 X 평행선이다. motion 인터페이스는 이 축의 바깥쪽 회전 하나이고 범위는 0–π/6 rad다. 이 상한은 높이 0.75 m 개구부에서 frame을 뺀 sash 높이 0.63 m의 아래 변 바깥 돌출을 약 0.32 m로 묶어 오른쪽 입면 윤곽에서 튀어나온 판으로 읽히지 않게 하려는 모델 결정이다. 기준 상태는 닫힌 0 rad이다. 흐림은 `obscured-glass` 표면으로 넘기고 정도는 materials가 정한다. 소스 owner는 `src/models/windows.ts`다.

## 창대와 외부 trim {#window-sill-trim}

외부 trim은 [06의 예약](../spaces/06-openings.md#external-opening-interface)대로 거친 개구부의 좌우·위·아래에 0.10 m 폭으로 두고, [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 trim이 실제 돌출과 음영으로 접합을 설명한다는 조건을 위해 날씨 면에서 0.02 m 돌출시킨다. 안쪽 창대는 frame 안쪽 면에서 방 쪽으로 0.06 m 돌출하는 두께 0.03 m 판이며 06의 0.06 m 한도를 그대로 쓴다. `exterior-trim`과 `interior-sill`은 `frame`의 형제 노드다. 소스 owner는 `src/models/windows.ts`이며 입면 정면과 측면 단면으로 검사한다.

## 창의 표면 파티션 {#window-surface-partitions}

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 창의 안정 표면 id는 `frame`, `sash`, `mullion`, `muntin`, `glass`, `obscured-glass`, `exterior-trim`, `interior-sill`이다. `frame`·`sash`·`mullion`·`muntin`은 같은 charcoal 계열로 쓰일 예정이지만 교체 경로가 달라 분리한다. 유리를 불투명 검은 판으로 대신하지 않는다는 [settings](../settings/10-house.md#openings) 조건은 materials가 소비한다. 소스 owner는 `src/models/windows.ts`다.

## 창의 표현 한계 {#window-fidelity}

[표현 상한](00-model-frame.md#model-representation-ceiling)에 따라 frame·sash·mullion·살대·유리·trim·창대는 모두 두께 있는 별도 부재로 읽혀야 하며 사각 구멍이나 평면 한 장으로 대신하지 않는다. 웨더스트립·잠금쇠·방충망·이중 유리 공기층·물끊기 홈은 만들지 않고, 검사자는 이 모델에서 단열·방수·개폐 하중을 추론하지 않는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)이며 실제 렌더는 unverified다.
