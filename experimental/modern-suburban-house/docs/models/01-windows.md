# 외부 창의 충전 부재

## 창 모델의 외곽과 벽 안 깊이 {#window-local-frame}
<!--
@evidence principles/core/common.md#scope-preservation 외부 창 12개가 각각 거친 개구부 하나를 채우고 외곽을 그 개구부와 같게 두며 벽 안 깊이 Z = -0.04 ~ -0.18 m를 쓰는 범위를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion frame 외곽=거친 개구부, shim 없음, 바깥 면 Z = -0.04 m, 안쪽 면 Z = -0.18 m를 수치로 정해 창의 벽 안 위치를 구현자가 고르지 않는다.
@evidence principles/core/common.md#declared-basis 물림 0.04 m·깊이 0.14 m는 spaces/06-openings.md#external-opening-interface, 좌표 관례는 00-model-frame.md#model-local-frame에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 06의 '창 frame 바깥 면을 0.04 m 물리고 깊이 0.14 m 안에 배치'라는 공간 예약을 frame 부재의 국소 Z 두 면이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 창 원형의 점유 범위를 거친 개구부 외곽 × 0.14 m 깊이로 정한다.
@evidence principles/design/models.md#spatial-convention 원점 면을 외벽 날씨 면으로 두고 frame 두 면을 국소 Z 값으로 적는다.
@evidence principles/design/models.md#reviewable-structure 각 방 안쪽 reveal 단면에서 frame 깊이가 0.04 m 물림과 0.14 m를 지키는지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 벽 안에 들어간 창틀 깊이라는 관찰 가능한 결정을 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 벽 두께 층 안의 창 위치를 정해 창이 벽면에 붙은 판으로 남는 층 누락을 막는다.
@evidence spaces/06-openings.md#external-opening-interface 0.04 m 물림과 0.14 m 깊이 예약을 frame 바깥·안쪽 면 Z = -0.04·-0.18 m로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 06의 0.04/0.14 m 예약과 네 입면 owner의 개구부를 적힌 그대로 소비했고 창 외곽을 정하는 데 부모 결함이 없었다.
-->

모든 외부 창은 [공통 국소 좌표](00-model-frame.md#model-local-frame)를 쓰고 원점 면은 외벽 날씨 면이다. 창 모델 하나는 [공통 개구부 인계](../spaces/06-openings.md#external-opening-interface)의 거친 직사각 개구부 하나를 채우고 좌표와 칸 수는 네 입면 owner에서 받는다. frame 외곽의 폭과 높이는 거친 개구부와 같고, blocking 수준의 틈새 shim은 [표현 상한](00-model-frame.md#model-representation-ceiling)에서 만들지 않는 부재로 본다. frame 바깥 면은 국소 Z = -0.04 m, 안쪽 면은 Z = -0.18 m로 06의 0.04 m 물림과 0.14 m 깊이를 그대로 소비한다. 소스 owner는 `src/models/windows.ts`이며 각 방 안쪽 reveal 단면으로 검사한다.

## 창틀·sash·mullion·살대의 부재 치수 {#window-member-sizes}
<!--
@evidence principles/core/common.md#scope-preservation frame 0.06·sash 0.05·mullion 0.08·살대 0.025 m 부재 폭과 칸 폭 산출식, 깊이 배분, 유리 법선·UV를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 칸 폭 = (거친 폭 - 2×0.06 - (칸 수-1)×0.08)/칸 수와 0.30 m 미만 실패 조건, 계단 창 유리 폭 0.56 m 산출을 적는다.
@evidence principles/core/common.md#declared-basis 부재 폭 근거를 settings/20-verification.md#visual-grammar의 charcoal 창틀과 #frame-condition의 외부 기본 view, 계단 창 폭 0.78 m에서 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings openings의 '두께 있는 frame·sash·유리·살대'를 네 부재 폭과 유리 두께 0.006 m라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 부재 폭·깊이와 유리를 닫힌 얇은 상자(양면 바깥 법선)로 정하고, 금속 프레임은 부재 길이를 U로 한 미터 UV를 낸다.
@evidence principles/design/models.md#spatial-convention 부재 폭을 정면 입면 방향, 깊이를 국소 Z로 적어 방향 관례를 분명히 한다.
@evidence principles/design/models.md#reviewable-structure 정면 직교 뷰에서 부재 폭을 재고 칸 폭 0.30 m 미만을 실패로 본다.
@evidence principles/design/models.md#model-observable-style-basis charcoal 창틀이 흰 trim 안에서 선으로 읽혀야 한다는 visual-grammar 요구를 0.06/0.05 m 폭으로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion 가장 작은 창에서도 유리 층이 남는 척도 관계를 산출해 부재가 유리를 덮는 경우를 막는다.
@evidence settings/20-verification.md#visual-grammar 짙은 charcoal 창틀과 흰 trim이 구별돼야 한다는 조건을 frame 0.06·sash 0.05 m 부재 폭의 근거로 소비한다.
@evidence spaces/envelope/front.md#stair-front-window 폭 0.78 m 계단 창을 최소 창으로 삼아 유리 폭 0.56 m를 산출한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work visual-grammar·frame-condition과 입면 owner의 칸 수를 그대로 소비했고 부재 폭이 부모 값과 충돌하지 않았다.
-->

spaces와 settings가 부재 폭을 정하지 않았으므로 frame 둘레 입면 폭 0.06 m, sash 둘레 0.05 m, 칸 사이 mullion 0.08 m, 살대 0.025 m를 모델 결정으로 택한다. 근거는 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 짙은 charcoal 창틀이 흰 trim 안쪽에서 선으로 읽혀야 하고 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 외부 기본 view에서도 frame과 sash가 구별돼야 한다는 점, 그리고 가장 작은 [계단 창](../spaces/envelope/front.md#stair-front-window) 폭 0.78 m에서도 유리 폭이 0.56 m 남는다는 산출이다. 칸 폭은 (거친 폭 - 2 × 0.06 - (칸 수 - 1) × 0.08) / 칸 수이고 이 값이 0.30 m 미만이면 실패로 보고한다. 깊이는 frame 0.14 m 전부, sash 0.05 m, 유리는 두께 0.006 m 판 하나다. 유리는 앞뒤 면이 각각 바깥 법선을 갖는 닫힌 얇은 상자로 만들어 실내외 양쪽 view에서 같은 판이 보이게 한다. 창틀·sash·살대는 면마다 평면 법선을 쓰고, [charcoal 미세결](../materials/01-exterior.md#window-frame-charcoal)이 붙을 수 있도록 각 직선 부재의 시작 모서리를 원점으로 길이 U·부재 폭 V를 미터 단위로 기록하며 맞댐에서 끊는다. 유리 앞뒤 면에는 창 유리판의 왼쪽 아래를 원점으로 가로 U·세로 V를 미터 단위로 기록한다. 소스 owner는 `src/models/windows.ts`이며 정면 직교 뷰에서 부재 폭을 잰다.

## 살대 격자 {#window-muntin-grid}
<!--
@evidence principles/core/common.md#scope-preservation 투명 유리 sash 전부의 2열×2행 살대 격자와 흐린 욕실 창의 살대 없음, 살대의 유리 양면 부착을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 세로·가로 살대 하나씩, 깊이 0.01 m 막대를 유리 양면에 붙이고 유리를 관통하지 않는다고 정해 격자를 구현자가 고르지 않는다.
@evidence principles/core/common.md#declared-basis 살대 요구는 settings/10-house.md#openings, 위계는 spaces/envelope/front.md#front-openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings openings의 '살대'를 sash마다 같은 2×2 격자라는 모델 결정으로 바꾸고 위계는 칸 수와 창 크기로만 읽게 한다.
@evidence principles/design/models.md#representation-contract 살대를 유리 양면의 별도 막대 부재로 정해 유리에 구멍이 생기지 않는 연결을 명시한다.
@evidence principles/design/models.md#spatial-convention 살대 위치를 sash 가운데 세로·가로선으로 정한다.
@evidence principles/design/models.md#reviewable-structure 입면 정면에서 모든 투명 sash가 같은 2×2 격자인지와 욕실 창에 살대가 없는지로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 살대 무늬로 창 위계를 바꾸지 않는다는 관찰 가능한 결정을 정하고 색은 materials에 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 살대 층이 유리 층 위에 있는지를 정해 층 누락을 막는다.
@evidence settings/10-house.md#openings 외부 창의 실제 살대 요구를 투명 sash마다 2열×2행 살대로 소비한다.
@evidence spaces/envelope/front.md#front-openings 넓은 거실창·침실 창·작은 계단 창의 위계를 살대가 아니라 칸 수와 창 크기로 읽게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work settings openings와 front-openings의 위계를 그대로 소비했고 격자 결정이 부모와 충돌하지 않았다.
-->

[settings 개구부](../settings/10-house.md#openings)가 살대를 요구하므로 투명 유리를 가진 모든 sash는 가운데 세로 살대 하나와 가로 살대 하나로 2열 × 2행 유리 칸을 만든다. 한 sash 안의 격자는 입면 전체에서 같은 비례로 반복되어 [전면 입면](../spaces/envelope/front.md#front-openings)의 넓은 창·침실 창·작은 계단 창의 위계를 칸 수와 창 크기로만 읽게 하고 살대 무늬로 위계를 바꾸지 않는다. 흐린 유리의 [욕조 욕실 창](../spaces/envelope/right.md#tub-right-window)은 살대를 두지 않는다. 살대는 유리 양면에 붙는 0.01 m 깊이 막대로 만들고 유리를 관통하는 구멍을 만들지 않는다. 소스 owner는 `src/models/windows.ts`다.

## 상하 미닫이 창의 계층과 기준 상태 {#double-hung-window}
<!--
@evidence principles/core/common.md#scope-preservation 거실·침실·주방·가족실의 상하 미닫이 창 9개의 계층(frame→unit-n→upper/lower-sash), 트랙 간격, 관절과 기준 상태를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 두 sash가 칸 높이를 반씩 나누고 트랙 간격 0.02 m와 깊이 0.12 m가 0.14 m 안에 앞뒤 0.01 m 여유를 남기며 lower-sash만 0~sash 높이 절반 이동한다고 적는다.
@evidence principles/core/common.md#declared-basis 작동 종류는 spaces/06-openings.md#external-opening-interface, 대상 창 좌표는 네 입면 H2, 닫힌 기준 상태는 settings/10-house.md#openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 06의 '상하 미닫이 sash'를 upper 고정·lower 평행 이동이라는 모델 관절로 바꾼다.
@evidence principles/design/models.md#representation-contract 칸마다 unit 노드 아래 두 sash를 두는 계층과 upper rigid·lower 이동을 정한다.
@evidence principles/design/models.md#spatial-convention lower-sash 이동 축을 국소 +Y, 범위를 sash 높이 절반으로 적는다.
@evidence principles/design/models.md#reviewable-structure 닫힘과 최대 열림 사선 투시로 sash가 frame 밖으로 나가는지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 상하 미닫이라는 라벨을 두 sash의 앞뒤 트랙과 반높이 분할이라는 관찰 가능한 구성으로 바꾼다.
@evidence principles/design/models.md#model-scale-layer-completion 칸·sash 두 층과 이동 인터페이스를 정해 층이나 관절이 빠진 창이 통과하지 않게 한다.
@evidence obligations/design/models.md#articulation-ownership lower-sash의 국소 +Y 평행 이동을 motion 인터페이스로, upper-sash를 rigid로 정한다.
@evidence spaces/envelope/front.md#living-front-window X = [-5.10, -2.30] m 세 칸 거실창을 상하 미닫이 세 unit으로 채운다.
@evidence spaces/envelope/front.md#bedroom-two-front-window 올리브 침실의 두 칸 창을 상하 미닫이 두 unit으로 채운다.
@evidence spaces/envelope/front.md#bedroom-three-front-window 청회색 침실의 두 칸 창을 상하 미닫이 두 unit으로 채운다.
@evidence spaces/envelope/rear.md#kitchen-rear-window 주방 한 칸 창을 상하 미닫이 한 unit으로 채운다.
@evidence spaces/envelope/rear.md#family-rear-window 가족실 후면 두 칸 창을 상하 미닫이 두 unit으로 채운다.
@evidence spaces/envelope/rear.md#primary-rear-window 주침실 후면 두 칸 창을 상하 미닫이 두 unit으로 채운다.
@evidence spaces/envelope/left.md#living-left-window 거실 왼쪽 한 칸 창을 상하 미닫이 한 unit으로 채운다.
@evidence spaces/envelope/left.md#primary-left-window 주침실 왼쪽 두 칸 창을 상하 미닫이 두 unit으로 채운다.
@evidence spaces/envelope/right.md#family-right-window 가족실 오른쪽 두 칸 창을 상하 미닫이 두 unit으로 채운다.
@evidence settings/10-house.md#openings 외부 창이 기준 상태에서 닫힌다는 조건을 lower-sash 이동 0의 기준 상태로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 06의 작동 배정과 입면 좌표를 적힌 그대로 소비했고 수정할 부모 결함이 없었다.
-->

거실·침실·주방·가족실의 창은 [06의 작동 배정](../spaces/06-openings.md#external-opening-interface)대로 상하 미닫이다. 대상은 [거실 전면 세 칸](../spaces/envelope/front.md#living-front-window), [올리브 침실](../spaces/envelope/front.md#bedroom-two-front-window)·[청회색 침실](../spaces/envelope/front.md#bedroom-three-front-window) 두 칸, [주방 한 칸](../spaces/envelope/rear.md#kitchen-rear-window), [가족실 후면 두 칸](../spaces/envelope/rear.md#family-rear-window), [주침실 후면 두 칸](../spaces/envelope/rear.md#primary-rear-window), [거실 왼쪽 한 칸](../spaces/envelope/left.md#living-left-window), [주침실 왼쪽 두 칸](../spaces/envelope/left.md#primary-left-window), [가족실 오른쪽 두 칸](../spaces/envelope/right.md#family-right-window)이다. 계층은 `frame` 아래 칸마다 `unit-<n>`, 그 아래 `upper-sash`와 `lower-sash`이며 두 sash는 칸 유효 높이를 같은 두 부분으로 나눈다. 바깥 트랙의 upper와 안쪽 트랙의 lower 사이는 0.02 m이며 두 sash 깊이 0.10 m와 합한 0.12 m가 0.14 m frame 깊이 안에 앞뒤 0.01 m씩 여유를 남기도록 정했다.

motion 인터페이스는 각 `lower-sash`의 국소 +Y 평행 이동 하나이며 범위는 0부터 sash 높이의 절반까지다. `upper-sash`는 rigid 고정이다. 기준 상태는 [06](../spaces/06-openings.md#external-opening-interface)과 [settings 개구부](../settings/10-house.md#openings)대로 모두 닫힌 이동 0이다. 소스 owner는 `src/models/windows.ts`이며 닫힘과 최대 열림의 사선 투시로 검사한다.

## 고정창의 계층 {#fixed-window}
<!--
@evidence principles/core/common.md#scope-preservation 계단 창 한 칸과 차고 측면 창 두 칸의 고정창 계층(frame→unit-n→fixed-sash)을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion sash를 frame 깊이 가운데 두고 관절 없이 모든 부재를 rigid로 정한다.
@evidence principles/core/common.md#declared-basis 고정창 배정은 spaces/06-openings.md#external-opening-interface, 좌표는 front.md#stair-front-window와 right.md#garage-right-window에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 06의 '작은 계단 창과 차고 측면은 고정창'을 관절 없는 fixed-sash 하나의 계층으로 바꾼다.
@evidence principles/design/models.md#representation-contract 고정창의 계층과 rigid 상태를 정한다.
@evidence principles/design/models.md#spatial-convention fixed-sash의 깊이 위치를 frame 깊이 가운데로 적는다.
@evidence principles/design/models.md#reviewable-structure 계단참과 차고 내부 reveal 단면에서 sash 위치를 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 고정창이라는 라벨을 움직이는 노드가 없는 계층이라는 관찰 가능한 결정으로 바꾼다.
@evidence principles/design/models.md#model-scale-layer-completion 고정창에도 frame·sash·유리 층이 모두 있음을 정해 사각 구멍 대체를 막는다.
@evidence spaces/envelope/front.md#stair-front-window X = [-1.62, -0.84], Y = [4.11, 5.21] m 계단 창을 고정창 한 unit으로 채운다.
@evidence spaces/envelope/right.md#garage-right-window 차고 측면 두 칸 창을 고정창 두 unit으로 채운다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 06과 두 입면 H2를 적힌 그대로 소비했고 수정할 부모 결함이 없었다.
@evidence spaces/02-stair.md#stair-floor-opening 계단 창이 실제 계단 공간으로 열리고 창호는 후속 부재가 구현한다는 인계를 고정창 한 unit으로 소비한다.
-->

[계단 창](../spaces/envelope/front.md#stair-front-window)의 한 칸과 [차고 측면 창](../spaces/envelope/right.md#garage-right-window)의 두 칸은 고정창이다. 계층은 `frame` 아래 칸마다 `unit-<n>`과 `fixed-sash` 하나이며 sash는 frame 깊이의 가운데에 둔다. 관절 인터페이스는 없고 모든 부재가 rigid다. 소스 owner는 `src/models/windows.ts`이며 계단참과 차고 내부 reveal 단면으로 검사한다.

## 욕조 욕실의 상부 경첩창 {#awning-window}
<!--
@evidence principles/core/common.md#scope-preservation 욕조 욕실 창 한 칸의 상부 경첩창 계층, 경첩 축, 열림 범위, 흐린 유리 표면을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 경첩 축을 sash 위 변 바깥 모서리의 국소 X 평행선으로, 범위를 0~π/6 rad로 정하고 sash 높이 0.63 m에서 바깥 돌출 약 0.32 m를 산출한다.
@evidence principles/core/common.md#declared-basis 개구부와 흐린 유리 배정은 spaces/envelope/right.md#tub-right-window와 spaces/06-openings.md#external-opening-interface에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 06의 '높은 욕실 창은 흐린 유리의 상부 경첩창'을 위 변 축 회전과 π/6 상한이라는 모델 관절로 바꾼다.
@evidence principles/design/models.md#representation-contract frame 아래 awning-sash 하나와 obscured-glass 표면을 정한다.
@evidence principles/design/models.md#spatial-convention 경첩 축 위치와 회전 방향(바깥)을 국소 좌표로 적는다.
@evidence principles/design/models.md#reviewable-structure 욕실 안쪽 단면과 최대 열림 사선 투시로 돌출을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 흐림 정도는 materials에 넘기고 모델은 흐린 유리 표면 경계만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 경첩 인터페이스와 열림 상한을 정해 관절 없는 욕실 창이 통과하지 않게 한다.
@evidence obligations/design/models.md#articulation-ownership awning-sash의 위 변 축 회전을 0~π/6 rad motion 인터페이스로 정한다.
@evidence spaces/envelope/right.md#tub-right-window Z = [-8.40, -7.50], Y = [4.56, 5.31] m 욕실 창을 상부 경첩창 한 칸으로 채운다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work right.md와 06의 욕실 창 배정을 그대로 소비했고 수정할 부모 결함이 없었다.
-->

[욕조 욕실 창](../spaces/envelope/right.md#tub-right-window) Z = [-8.40, -7.50], Y = [4.56, 5.31] m은 한 칸의 상부 경첩창이다. 계층은 `frame` 아래 `awning-sash` 하나이며 경첩 축은 sash 위 변 바깥 모서리를 지나는 국소 X 평행선이다. motion 인터페이스는 이 축의 바깥쪽 회전 하나이고 범위는 0–π/6 rad다. 이 상한은 높이 0.75 m 개구부에서 frame을 뺀 sash 높이 0.63 m의 아래 변 바깥 돌출을 약 0.32 m로 묶어 오른쪽 입면 윤곽에서 튀어나온 판으로 읽히지 않게 하려는 모델 결정이다. 기준 상태는 닫힌 0 rad이다. 흐림은 `obscured-glass` 표면으로 넘기고 정도는 materials가 정한다. 소스 owner는 `src/models/windows.ts`다.

## 창대와 외부 trim {#window-sill-trim}
<!--
@evidence principles/core/common.md#scope-preservation 외부 trim과 안쪽 창대의 폭·돌출·두께와 frame 형제 노드 배치를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion trim을 0.10 m 폭·0.02 m 돌출로, 창대를 frame 안쪽 면에서 0.13 m 돌출·0.03 m 두께로 수치화한다.
@evidence principles/core/common.md#declared-basis 0.10 m·0.06 m 한도는 spaces/06-openings.md#external-opening-interface, 돌출 근거는 settings/20-verification.md#visual-grammar에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 06의 trim 0.10 m 이내·돌출 0.06 m 이내 예약을 실제 부재 치수로 바꾼다.
@evidence principles/design/models.md#representation-contract exterior-trim과 interior-sill을 frame의 형제 노드로 두는 계층을 정한다.
@evidence principles/design/models.md#spatial-convention trim은 날씨 면 기준, 창대는 frame 안쪽 면과 실내 마감 면 두 기준에서 돌출을 산출한다.
@evidence principles/design/models.md#reviewable-structure 입면 정면과 측면 단면에서 trim 폭과 창대 돌출을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis trim이 실제 돌출과 음영으로 접합을 설명한다는 visual-grammar를 0.02 m 돌출로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion trim과 창대 층을 창 원형에 포함시켜 층 누락을 막는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 06의 두 예약과 visual-grammar를 그대로 소비했고 부모 수정이 필요하지 않았다.
-->

외부 trim은 [06의 예약](../spaces/06-openings.md#external-opening-interface)대로 거친 개구부의 좌우·위·아래에 0.10 m 폭으로 두고, [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 trim이 실제 돌출과 음영으로 접합을 설명한다는 조건을 위해 날씨 면에서 0.02 m 돌출시킨다. 안쪽 창대는 frame 안쪽 면 -0.18 m에서 실내 마감 면 -0.25 m를 지나 방 쪽 끝 -0.31 m까지 0.13 m 돌출하는 두께 0.03 m 판이며 실내 마감 면 기준으로 0.06 m만 돌출해 06의 한도를 지킨다. `exterior-trim`과 `interior-sill`은 `frame`의 형제 노드다. 소스 owner는 `src/models/windows.ts`이며 입면 정면과 측면 단면으로 검사한다.

## 창의 표면 파티션 {#window-surface-partitions}
<!--
@evidence principles/core/common.md#scope-preservation 창의 표면 id 8개(frame·sash·mullion·muntin·glass·obscured-glass·exterior-trim·interior-sill)를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion frame·sash·mullion·muntin을 교체 경로 때문에 분리한다고 적어 표면 경계를 구현자가 합치지 않게 한다.
@evidence principles/core/common.md#declared-basis id 규칙은 00-model-frame.md#model-surface-partition-naming, 유리 조건은 settings/10-house.md#openings에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings openings의 '유리는 불투명 검은 판이 아니다'를 glass/obscured-glass 별도 표면으로 바꾼다.
@evidence principles/design/models.md#representation-contract 창의 안정 표면 소유를 부재별로 정한다.
@evidence principles/design/models.md#spatial-convention 표면 id는 01의 부재 노드에 붙고 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure materials 바인딩 뷰에서 부재 경계와 id 경계가 일치하는지로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis charcoal 계열 색은 materials에 남기고 모델은 표면 경계만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 표면 인터페이스를 모든 창 부재에 정해 빈 표면이 없게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work settings openings와 00의 이름 규칙을 그대로 소비했고 부모 수정이 없었다.
-->

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 창의 안정 표면 id는 `frame`, `sash`, `mullion`, `muntin`, `glass`, `obscured-glass`, `exterior-trim`, `interior-sill`이다. `frame`·`sash`·`mullion`·`muntin`은 같은 charcoal 계열로 쓰일 예정이지만 교체 경로가 달라 분리한다. 유리를 불투명 검은 판으로 대신하지 않는다는 [settings](../settings/10-house.md#openings) 조건은 materials가 소비한다. 소스 owner는 `src/models/windows.ts`다.

## 창의 표현 한계 {#window-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation 창 부재가 모두 두께 있는 별도 부재로 읽혀야 하는 범위와 웨더스트립·잠금쇠·방충망·이중 유리·물끊기 홈을 만들지 않는 범위를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 검사자가 단열·방수·개폐 하중을 추론하지 않는다고 명시한다.
@evidence principles/core/common.md#declared-basis 상한은 00-model-frame.md#model-representation-ceiling과 settings/20-verification.md#fidelity에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation fidelity의 '창호가 캡처에서 읽혀야 한다'를 창 부재 목록과 제외 기구 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 창 proxy가 지지하는 관찰과 지지하지 않는 관찰을 정한다.
@evidence principles/design/models.md#spatial-convention 새 좌표를 정하지 않고 01의 관례를 쓴다.
@evidence principles/design/models.md#reviewable-structure 모델 리뷰 뷰와 전체 관찰에서 사각 구멍이나 평면 대체가 있으면 반증된다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 대신 두께 있는 부재라는 관찰 가능한 구성을 요구한다.
@evidence principles/design/models.md#model-scale-layer-completion 만들지 않는 층을 명시해 누락과 의도된 생략을 구별한다.
@evidence obligations/design/models.md#representation-ceiling 창 계열의 표현 한계로 웨더스트립·잠금쇠·방충망·이중 유리·물끊기 홈 제외와 단열·방수 추론 금지를 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work fidelity를 적힌 그대로 소비했고 부모 수정이 필요하지 않았다.
-->

[표현 상한](00-model-frame.md#model-representation-ceiling)에 따라 frame·sash·mullion·살대·유리·trim·창대는 모두 두께 있는 별도 부재로 읽혀야 하며 사각 구멍이나 평면 한 장으로 대신하지 않는다. 웨더스트립·잠금쇠·방충망·이중 유리 공기층·물끊기 홈은 만들지 않고, 검사자는 이 모델에서 단열·방수·개폐 하중을 추론하지 않는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)이며 실제 렌더는 unverified다.
