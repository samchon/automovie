# 외부 문과 대문

## 목재 현관문 {#front-entry-door}
<!--
@evidence principles/core/common.md#scope-preservation front-door의 문짝 0.94×2.14 m, 문설주 0.03 m, 상부 유리 3열×2행, 경첩과 손잡이를 이 H2가 맡고 문턱판은 spaces에 남긴다.
@evidence principles/core/common.md#substantive-completion 90° 순폭 1.00-0.06-0.04=0.90 m, 유리 구간 1.30~2.04 m, stile/rail 0.12 m, 살대 0.03 m, 회전 반경 0.94 m를 산출해 적는다.
@evidence principles/core/common.md#declared-basis 개구부·경첩·열림은 spaces/rooms/entry.md#entry-plan, 유리 분할은 spaces/envelope/front.md#front-entry-filling, 유리 하단 근거는 settings/20-verification.md#frame-condition의 눈높이 1.6 m에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation entry의 '유효 폭 0.90 m 이상 문틀'을 문설주 0.03 m와 문짝 0.04 m의 산술로, front-entry-filling의 3열×2행을 유리 구간 수치로 바꾼다.
@evidence principles/design/models.md#representation-contract door→jamb·exterior-trim·casing·hinge-pivot→leaf·muntin·glass·handle 계층을 정하며 문턱판은 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 원점 면을 전면 벽 실내 면으로, 경첩을 +X 문설주, 열림을 실내 -Z로 적는다.
@evidence principles/design/models.md#reviewable-structure 포치 정면과 현관 threshold view에서 순폭과 유리 구간을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 목재 문짝이 유리 액자가 아닌 목재 틀로 읽히도록 stile/rail 0.12 m를 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 순폭 척도와 유리·목재 층, 경첩 인터페이스를 함께 정한다.
@evidence obligations/design/models.md#articulation-ownership 현관문 hinge-pivot의 0~π/2 rad 회전을 motion 인터페이스로, 기준 상태를 닫힘 0으로 정한다.
@evidence spaces/rooms/entry.md#entry-plan X = [0.40, 1.40], Y = [0, 2.20] m 개구부와 +X 경첩·실내 -Z 열림·0.90 m 목표를 문짝 치수와 관절로 소비한다.
@evidence spaces/envelope/front.md#front-entry-filling 상부 유리 세 열·두 행과 경첩 반대편 검은 손잡이를 유리 구간 1.30~2.04 m와 -X 손잡이로 소비한다.
@evidence settings/20-verification.md#frame-condition 눈높이 1.6 m가 유리 구간 안에 들도록 유리 하단 1.30 m의 근거로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 거친 폭 1.00 m에서 0.06·0.04 m를 뺀 순폭 0.90 m로 entry owner 목표를 산술로 지킨다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work ground-threshold-junctions의 이미 지은 +0.02 m 문턱을 기준으로 문짝 하단을 +0.03 m에 올리고, 이 H2의 중복 threshold를 제거했다. entry-plan의 순폭 목표는 유지한다.
@evidence spaces/00-building.md#main-building-extent 본채 전면 벽의 0.25 m 외벽 예약을 현관문 문설주 깊이로 소비한다.
-->

`front-door`는 [현관 owner](../spaces/rooms/entry.md#entry-plan)의 거친 개구부 X = [0.40, 1.40], Y = [0, 2.20] m를 채운다. [공통 국소 좌표](00-model-frame.md#model-local-frame)에서 열림 쪽이 실내이므로 원점 면은 전면 벽의 실내 면이다. [실내 문](03-interior-doors.md#interior-door-members)과 같은 문설주 면 폭 0.03 m와 문짝 두께 0.04 m를 택해 90° 순폭 0.90 m로 owner의 0.90 m 이상 목표를 만족한다. 문설주 깊이는 0.25 m 외벽 예약 전체다. 계층은 `door` 아래 `jamb`, 바깥 `exterior-trim`, 안쪽 `casing`, `hinge-pivot` 아래 `leaf`, `muntin`, `glass`, `handle`이다. [바탕과 문턱의 단일 owner](../spaces/10-ground-floor.md#ground-threshold-junctions)가 만든 문턱 상면은 완성 바닥 위 0.02 m다. 문짝 아래는 그 위 0.01 m인 Y = 0.03 m, 문짝 위는 머리 문설주 아래 Y = 2.17 m이므로 문짝 폭 0.94 m·높이는 2.14 m다. [전면 충전 owner](../spaces/envelope/front.md#front-entry-filling)의 상부 유리는 바닥 위 1.30–2.05 m 구간을 세 열·두 행으로 나누고 살대 폭 0.03 m, 문짝 둘레 stile/rail 폭 0.12 m로 택한다. 유리 위 끝 2.05 m는 문짝 위 끝 2.17 - top rail 0.12 m이고, 아래 끝 1.30 m는 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 눈높이 1.6 m가 유리 구간 안에 들어오고 손잡이 높이 0.95 m 주변의 목재 lock rail·아래 패널을 남기도록 정한 모델 결정이다. stile/rail 0.12 m는 유리 폭 0.94 - 2 × 0.12 = 0.70 m를 세 열로 나눠 lite 폭 약 0.21 m를 남기면서 [settings 개구부](../settings/10-house.md#openings)의 목재 문짝이 유리 액자가 아닌 목재 틀로 읽히게 하는 폭이다. 경첩은 +X 문설주, 열림은 실내 -Z이고 motion 인터페이스는 경첩 축 회전 0–π/2 rad, 기준 상태는 닫힘 0이다. 검은 손잡이는 경첩 반대편 -X 쪽에 둔다. 열림 회전 반경은 문짝 폭 0.94 m이며 손잡이는 문짝 가장자리 안쪽에 있어 반경을 늘리지 않는다. 소스 owner는 `src/models/exterior-door.ts`이며 포치 정면과 현관 threshold view로 검사한다.

## 두 대 폭의 분절 차고문 {#garage-sectional-door}
<!--
@evidence principles/core/common.md#scope-preservation 차고문 문짝 4.80×2.15 m, 패널 4장과 이음 관절 3개, rail-path, travel 인터페이스를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문설주 0.10 m로 유효 폭 4.80 m, 머리 부재 Y = [2.00, 2.15] m, 레일 수직·반지름 0.30 m 사분원·Y = 2.45 m 수평, travel 0~2.30 m를 수치로 적는다.
@evidence principles/core/common.md#declared-basis 개구부·패널 수·유리 열·레일 예약은 spaces/envelope/front.md#garage-front-opening, 분절 근거는 settings/20-verification.md#visual-grammar에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation garage-front-opening의 '네 수평 패널과 레일 예약'을 panel-joint 세 개와 rail-path 중심선이라는 모델 관절로 바꾼다.
@evidence principles/design/models.md#representation-contract panel-1~4, panel-joint-1-2·2-3·3-4, rail, 오목 분절과 glass lite 계층을 정한다.
@evidence principles/design/models.md#spatial-convention 레일 중심선을 world Z·Y 값으로, 이음 축을 국소 X 평행으로 적는다.
@evidence principles/design/models.md#reviewable-structure 머드룸 쪽 차고 내부 view와 정면 view에서 패널이 레일 예약을 벗어나는지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis charcoal 차고문이 평판이 아니라 분절과 음영으로 읽혀야 한다는 조건을 패널마다 오목 사각형 네 개로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion 패널·레일·이동 인터페이스 층을 정해 평판 차고문 대체를 막는다.
@evidence obligations/design/models.md#articulation-ownership panel-joint 세 축과 rail-path를 따르는 travel 0~2.30 m 한 스칼라를 motion 인터페이스로, 기준 상태를 닫힘으로 정한다.
@evidence spaces/envelope/front.md#garage-front-opening X = [6.10, 11.10] m 개구부, 유효 폭 4.80 m, 네 패널, 위 패널 유리 네 열, 레일 띠와 상부 예약을 문짝·rail-path로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 5.00 m 거친 폭에서 문설주 2×0.10 m를 빼 4.80 m를 지키고 rail-path가 레일 띠와 상부 예약 안에 있음을 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work garage-front-opening의 높이 2.15 m를 차고 바닥에서 잰 유효 높이로 읽었고 가이드 예약 하단 2.15 m와 일치해 부모 수정이 필요하지 않았다.
@evidence spaces/01-storeys.md#ground-threshold-datums 차고 바닥 Y = -0.15 m datum을 차고문 유효 높이 2.15 m의 기준면으로 소비한다.
-->

`garage-front-door`는 [차고문 owner](../spaces/envelope/front.md#garage-front-opening)의 X = [6.10, 11.10], Y = [-0.15, 2.15] m를 채운다. 최종 유효 폭 4.80 m를 위해 좌우 문설주 면 폭을 0.10 m로 택한다. owner의 높이 2.15 m를 차고 바닥 Y = -0.15 m에서 잰 유효 높이로 읽어 문짝 위 끝을 Y = 2.00 m에 두고, 머리 부재가 Y = [2.00, 2.15] m를 차지해 owner의 상부 가이드 예약 Y = [2.15, 2.50] m 바로 아래에서 끝나게 한다. 이 해석은 거친 개구부 위 끝 2.15 m와 가이드 예약 아래 끝 2.15 m가 같다는 점에서 택했다. 문짝은 폭 4.80 m, 높이 2.15 m, 두께 0.05 m이며 같은 높이의 네 수평 패널 `panel-1`–`panel-4`로 나눈다. 맨 위 패널에는 네 열의 `glass` lite, 나머지 패널에는 불투명 사각 분절 `leaf-panel`을 둔다. 패널 수와 유리 열 수는 [차고문 owner](../spaces/envelope/front.md#garage-front-opening)가 정했고, 분절은 패널마다 네 개의 오목 사각형(패널 면에서 0.01 m 들어감)으로 택해 위 유리 열과 세로선이 맞게 한다. 이는 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 charcoal 차고문이 정면 외부 view에서 평판이 아니라 분절과 음영으로 읽혀야 한다는 조건의 모델 결정이다. `rail`은 owner가 정한 양 끝 0.16 m 띠, Z = [-0.72, -0.55] m에서 수직으로 올라가 반지름 0.30 m 곡선을 지나 Y = [2.15, 2.50] m 예약 안에서 Z = -3.40 m까지 수평으로 이어진다. 패널은 아래부터 `panel-1`–`panel-4`이고 이음 관절은 `panel-joint-1-2`, `panel-joint-2-3`, `panel-joint-3-4`로, 각 패널 사이 실내 쪽 모서리를 지나는 국소 X 평행 축이다. 레일 중심선 `rail-path`는 Z = -0.635 m에서 Y = -0.15 m부터 2.15 m까지 수직, 중심 (Z = -0.935, Y = 2.15) m의 반지름 0.30 m 사분원, Y = 2.45 m에서 Z = -0.935 m부터 -3.40 m까지 수평이며 모두 owner의 레일 띠와 상부 예약 안이다. motion 인터페이스는 문짝 아래 끝이 경로를 따라 올라간 거리 `travel` 한 스칼라이고 범위는 0–2.30 m이며, 2.30 m에서 아래 끝이 Y = 2.15 m에 닿아 문짝 위 끝은 Z 약 -2.62 m에 머문다. 각 패널의 자세는 양 끝 이음이 경로 위에 놓이는 위치에서 산출한다. 기준 상태는 닫힘이다. 소스 owner는 `src/models/garage-door.ts`이며 머드룸 쪽 차고 내부 view와 정면 view로 검사한다.

## 정원 쪽 유리문 두 장 {#garden-door-pair}
<!--
@evidence principles/core/common.md#scope-preservation 정원문 두 장의 문짝 1.17 m, 문설주, 경첩, 중앙 손잡이와 회전 반경을 이 H2가 맡고 문턱판은 spaces에 남긴다.
@evidence principles/core/common.md#substantive-completion 주 문만 열 때 순폭 1.20-0.03-0.04=1.13 m, 손잡이 0.06 m를 빼도 0.95 m 초과, 회전 반경 1.17 m가 바깥 대기 1.80 m 안이라고 산출한다.
@evidence principles/core/common.md#declared-basis 개구부·열림·목표·대기는 spaces/envelope/rear.md#garden-door에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation garden-door의 '유리 경첩 문 두 장, 주 문 0.95 m'를 문짝 폭과 순폭 산술로 바꾼다.
@evidence principles/design/models.md#representation-contract 두 hinge-pivot 아래 leaf·glass·handle 계층을 정하고 문턱판은 source에서 중복 생성하지 않는다.
@evidence principles/design/models.md#spatial-convention 원점 면을 후벽 바깥 날씨 면으로, 경첩을 양 끝 문설주로 적는다.
@evidence principles/design/models.md#reviewable-structure 공용부 안쪽과 테라스 쪽 view에서 순폭과 회전 반경을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis stile/rail 0.10 m 외에는 유리로 두어 유리문으로 읽히게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 두 문짝 관절과 spaces 문턱 +0.02 m 위 0.01 m 바닥 틈을 정한다.
@evidence obligations/design/models.md#articulation-ownership 두 경첩 축 각각의 0~π/2 rad 회전을 motion 인터페이스로, 기준 상태를 둘 다 닫힘으로 정한다.
@evidence spaces/envelope/rear.md#garden-door X = [-1.20, 1.20] m 개구부, 바깥 -Z 열림, 0.95 m 목표, 1.80 m 바깥 대기를 문짝 1.17 m와 순폭 1.13 m로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 순폭 1.13 m와 회전 반경 1.17 m를 owner 목표 0.95 m와 대기 깊이 1.80 m에 대조한다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work ground-threshold-junctions의 후면 owner가 이미 지은 +0.02 m 문턱을 확인하고 모델의 중복 문턱 선언을 제거했으며 문짝 하단을 +0.03 m로 정했다.
-->

`garden-door`는 [후면 owner](../spaces/envelope/rear.md#garden-door)의 X = [-1.20, 1.20], Y = [0, 2.25] m를 채운다. 원점 면은 열림 쪽인 후벽 바깥 날씨 면이다. 문설주 면 폭 0.03 m, 문짝 두께 0.04 m, 문짝 폭 각 1.17 m로 두고 +X 주 문만 90° 열 때 순폭은 1.20 - 0.03 - 0.04 = 1.13 m이며 중앙 손잡이 돌출 0.06 m를 빼도 목표 0.95 m보다 크다. 경첩은 양 끝 문설주, 손잡이는 중앙 만남에 두고 각 문짝의 열림 회전 반경은 문짝 폭 1.17 m로 owner의 바깥 대기 깊이 1.80 m 안에 들어간다. 문짝 둘레 stile/rail 폭은 0.10 m, 나머지는 `glass`다. [바탕과 문턱의 단일 owner](../spaces/10-ground-floor.md#ground-threshold-junctions)가 만든 문턱 상면은 완성 바닥 위 0.02 m이고 모델은 문턱을 만들지 않는다. 문짝 아래는 문턱 위 0.01 m인 Y = 0.03 m, 위는 머리 문설주 아래 Y = 2.22 m이므로 높이는 2.19 m다. motion 인터페이스는 두 경첩 축 각각의 회전 0–π/2 rad이며 기준 상태는 둘 다 닫힘이다. 소스 owner는 `src/models/exterior-door.ts`이며 공용부 안쪽과 테라스 쪽 view로 검사한다.

## 옆마당 목재 대문 {#side-yard-gate}
<!--
@evidence principles/core/common.md#scope-preservation 옆마당 대문 문짝 1.18 m, 경첩, 열림, 회전 반경과 하드웨어 점유를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문짝을 S 위 0.05~1.70 m, 두께 0.04 m로 두고 90° 순폭 1.20-0.04-0.05=1.11 m가 목표 1.05 m보다 크다고 산출한다.
@evidence principles/core/common.md#declared-basis 문기둥 구간·경첩·열림·한도는 spaces/site/side-walk.md#side-gate-interface에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation side-gate-interface의 통과 폭 1.05 m와 점유 0.10 m 한도를 문짝 폭과 순폭 산술로 바꾼다.
@evidence principles/design/models.md#representation-contract hinge-pivot 아래 leaf-panel 세로 판재와 가로 띠장 계층을 정하고 문기둥·헤더를 두지 않는다.
@evidence principles/design/models.md#spatial-convention 경첩을 +X 쪽, 열림을 정원 쪽 -Z로 적는다.
@evidence principles/design/models.md#reviewable-structure 옆길 view에서 순폭과 회전 반경을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 목재 판재 대문이라는 구성을 세로 판재와 띠장으로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion 대문의 관절 인터페이스와 판재 층을 정한다.
@evidence obligations/design/models.md#articulation-ownership 대문 경첩 축의 0~π/2 rad 회전을 motion 인터페이스로, 기준 상태를 닫힘으로 정한다.
@evidence spaces/site/side-walk.md#side-gate-interface 1.20 m 보행면 폭, +X 경첩, -Z 열림, 1.05 m 목표, 회전 반경 1.20 m를 문짝 1.18 m와 순폭 1.11 m로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 순폭 1.11 m와 +X 점유 0.05 m를 owner 목표 1.05 m와 한도 0.10 m에 대조한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work side-gate-interface를 적힌 그대로 소비했고 수정할 부모 결함이 없었다.
-->

`side-yard-gate`는 [옆길 owner](../spaces/site/side-walk.md#side-gate-interface)의 문기둥 안쪽 구간을 채우며 문기둥과 상부 헤더는 두지 않는다. 문짝은 보행면 S 위 0.05–1.70 m, 두께 0.04 m, 폭은 문기둥 안쪽 구간인 세로 보행면 폭 1.20 m에서 0.02 m를 뺀 1.18 m이고 세로 판재 `leaf-panel`과 가로 띠장으로 나눈다. 경첩은 +X 쪽, 열림은 정원 쪽 -Z이며 motion 인터페이스는 경첩 축 회전 0–π/2 rad, 기준 상태는 닫힘이다. 90°에서 경첩·문짝의 +X 경계 점유는 0.05 m 이내, 손잡이 포함 회전 반경은 1.20 m 이내로 owner의 한도를 지킨다. 90° 순폭은 1.20 - 0.04 - 0.05 = 1.11 m로 owner의 통과 폭 목표 1.05 m보다 크다. 소스 owner는 `src/models/gate.ts`이며 옆길 view로 검사한다.

## 외부 문의 표면 파티션 {#exterior-door-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation 현관문·정원문·차고문·대문의 표면 id와 leaf-exterior/leaf-interior 분리, 문짝 UV 정렬을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문짝 UV를 국소 X·Y에 맞춰 목재 결이 높이 방향을 따를 수 있다고 적는다.
@evidence principles/core/common.md#declared-basis id 규칙은 00-model-frame.md#model-surface-partition-naming, 분담은 settings/20-verification.md#surface-allocation에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-allocation의 인계를 외부 문 네 종류의 id 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 포치와 현관에서 다른 마감을 받는 문짝 면을 별도 표면으로 둔다.
@evidence principles/design/models.md#spatial-convention UV 축을 문짝 국소 X·Y로 적는다.
@evidence principles/design/models.md#reviewable-structure materials 바인딩 뷰에서 안팎 문짝 면 경계로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 결 방향과 색은 materials에 두고 모델은 면 경계와 UV만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 외부 문 모두에 표면 인터페이스를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work surface-allocation을 그대로 소비했고 부모 수정이 없었다.
-->

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 현관문과 정원문은 `jamb`, `exterior-trim`, `casing`, `muntin`, `glass`, `handle`, `hinge`를 쓴다. 포치·정원 쪽 문짝 넓은 면은 `leaf-exterior`, 방 쪽 넓은 면은 `leaf-interior`, 두 면을 잇는 위·아래·좌우 절단면은 `leaf-edge`다. 오목한 목재 판은 `leaf-panel`로 두되 그 오목한 바닥과 네 챌면을 모두 같은 id로 덮는다. 문턱판은 [spaces의 네 출입 경계](../spaces/10-ground-floor.md#ground-threshold-junctions)가 소유한다. 차고문의 네 패널 넓은 양면은 `leaf-exterior`·`leaf-interior`, 오목 분절은 `leaf-panel`, 패널 사이 홈과 위아래·양끝 두께 면은 `panel-edge`, 채광창은 `glass`, 문설주와 레일은 `jamb`·`rail`이다. 대문의 세로 목판은 앞뒤와 절단 끝 모두 `leaf-panel`, 경첩·손잡이는 `hinge`·`handle`이다. 현관문과 대문의 목재 결 방향은 materials가 정하되, 모델은 문짝 면의 UV를 문짝 국소 X·Y에 정렬하고 절단면마다 길이를 U로 새로 시작해 결이 문짝 높이 방향을 따를 수 있게 한다. 소스 owner는 `src/models/exterior-door.ts`, `src/models/garage-door.ts`, `src/models/gate.ts`다.

## 외부 문의 표현 한계 {#exterior-door-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation 외부 문의 잠금 기구·도어 클로저·차고문 스프링·모터·케이블·걸쇠 내부를 만들지 않는 범위를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 차고문 패널 자세가 롤러 접촉이나 간섭 없음을 증명하지 않는다고 명시한다.
@evidence principles/core/common.md#declared-basis 잠금·클로저·스프링·모터·케이블 생략의 상한은 00-model-frame.md#model-representation-ceiling에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 표현 상한을 외부 문 계열의 제외 기구 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 외부 문 proxy가 지지하지 않는 관찰을 정한다.
@evidence principles/design/models.md#spatial-convention 현관문·정원문·차고문·대문의 좌표는 각 문 H2에 두고 이 한계 H2는 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure 모델 리뷰 뷰에서 문짝·문설주가 평면 대체인지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일이 아니라 기구 생략이라는 관찰 가능한 한계를 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 차고문 스프링·모터·케이블과 대문 걸쇠 내부를 만들지 않는 층으로 명시한다.
@evidence obligations/design/models.md#representation-ceiling 외부 문 계열의 기구 생략과 차고문 간섭 비증명을 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work settings fidelity의 창호·문짝 읽힘 요구를 외부 문 기구 생략과 대조했고 부모 수정이 필요하지 않았다.
-->

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 잠금 기구, 도어 클로저, 차고문 스프링·모터·케이블, 대문 걸쇠 내부는 만들지 않는다. 차고문 패널의 레일 위 자세는 이동량에서 산출한 blocking 자세이며 롤러 접촉이나 간섭 없음을 증명하지 않는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)이며 실제 렌더는 unverified다.
