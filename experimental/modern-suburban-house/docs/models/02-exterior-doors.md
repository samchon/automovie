# 외부 문과 대문

## 목재 현관문 {#front-entry-door}

`front-door`는 [현관 owner](../spaces/rooms/entry.md#entry-plan)의 거친 개구부 X = [0.40, 1.40], Y = [0, 2.20] m를 채운다. [공통 국소 좌표](00-model-frame.md#model-local-frame)에서 열림 쪽이 실내이므로 원점 면은 전면 벽의 실내 면이다. [실내 문](03-interior-doors.md#interior-door-members)과 같은 문설주 면 폭 0.03 m와 문짝 두께 0.04 m를 택해 90° 순폭 0.90 m로 owner의 0.90 m 이상 목표를 만족한다. 문설주 깊이는 0.25 m 외벽 예약 전체다. 계층은 `door` 아래 `jamb`, 바깥 `exterior-trim`, 안쪽 `casing`, `threshold`, `hinge-pivot` 아래 `leaf`, `muntin`, `glass`, `handle`이다. 문짝은 폭 0.94 m, 높이 2.16 m(머리 문설주 0.03 m와 문턱 위 틈 0.01 m 제외)다. [전면 충전 owner](../spaces/envelope/front.md#front-entry-filling)의 상부 유리는 바닥 위 1.30–2.04 m 구간을 세 열·두 행으로 나누고 살대 폭 0.03 m, 문짝 둘레 stile/rail 폭 0.12 m로 택한다. 유리 구간의 위 끝은 문짝 위 끝 2.16 m에서 top rail 0.12 m를 뺀 값이고, 아래 끝 1.30 m는 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 눈높이 1.6 m가 유리 구간 안에 들어오고 손잡이 높이 0.95 m 주변의 목재 lock rail·아래 패널을 남기도록 정한 모델 결정이다. stile/rail 0.12 m는 유리 폭 0.94 - 2 × 0.12 = 0.70 m를 세 열로 나눠 lite 폭 약 0.21 m를 남기면서 [settings 개구부](../settings/10-house.md#openings)의 목재 문짝이 유리 액자가 아닌 목재 틀로 읽히게 하는 폭이다. 경첩은 +X 문설주, 열림은 실내 -Z이고 motion 인터페이스는 경첩 축 회전 0–π/2 rad, 기준 상태는 닫힘 0이다. 검은 손잡이는 경첩 반대편 -X 쪽에 둔다. 소스 owner는 `src/models/exterior-door.ts`이며 포치 정면과 현관 threshold view로 검사한다.

## 두 대 폭의 분절 차고문 {#garage-sectional-door}

`garage-front-door`는 [차고문 owner](../spaces/envelope/front.md#garage-front-opening)의 X = [6.10, 11.10], Y = [-0.15, 2.15] m를 채운다. 최종 유효 폭 4.80 m를 위해 좌우 문설주 면 폭을 0.10 m로 택한다. owner의 높이 2.15 m를 차고 바닥 Y = -0.15 m에서 잰 유효 높이로 읽어 문짝 위 끝을 Y = 2.00 m에 두고, 머리 부재가 Y = [2.00, 2.15] m를 차지해 owner의 상부 가이드 예약 Y = [2.15, 2.50] m 바로 아래에서 끝나게 한다. 이 해석은 거친 개구부 위 끝 2.15 m와 가이드 예약 아래 끝 2.15 m가 같다는 점에서 택했다. 문짝은 폭 4.80 m, 높이 2.15 m, 두께 0.05 m이며 같은 높이의 네 수평 패널 `panel-1`–`panel-4`로 나눈다. 맨 위 패널에는 네 열의 `glass` lite, 나머지 패널에는 불투명 사각 분절 `leaf-panel`을 둔다. `rail`은 owner가 정한 양 끝 0.16 m 띠, Z = [-0.72, -0.55] m에서 수직으로 올라가 반지름 0.30 m 곡선을 지나 Y = [2.15, 2.50] m 예약 안에서 Z = -3.40 m까지 수평으로 이어진다. motion 인터페이스는 레일 경로를 따르는 이동량 한 스칼라이며 각 패널은 인접 패널과 수평 경첩으로 이어져 레일 위의 자기 위치에서 자세를 얻는다. 기준 상태는 닫힘이다. 소스 owner는 `src/models/garage-door.ts`이며 머드룸 쪽 차고 내부 view와 정면 view로 검사한다.

## 정원 쪽 유리문 두 장 {#garden-door-pair}

`garden-door`는 [후면 owner](../spaces/envelope/rear.md#garden-door)의 X = [-1.20, 1.20], Y = [0, 2.25] m를 채운다. 원점 면은 열림 쪽인 후벽 바깥 날씨 면이다. 문설주 면 폭 0.03 m, 문짝 두께 0.04 m, 문짝 폭 각 1.17 m로 두고 +X 주 문만 90° 열 때 순폭은 1.20 - 0.03 - 0.04 = 1.13 m이며 중앙 손잡이 돌출 0.06 m를 빼도 목표 0.95 m보다 크다. 경첩은 양 끝 문설주, 손잡이는 중앙 만남에 두고 문짝 둘레 stile/rail 폭은 0.10 m, 나머지는 `glass`다. 문턱은 양쪽 바닥 위 0.02 m 이내다. motion 인터페이스는 두 경첩 축 각각의 회전 0–π/2 rad이며 기준 상태는 둘 다 닫힘이다. 소스 owner는 `src/models/exterior-door.ts`이며 공용부 안쪽과 테라스 쪽 view로 검사한다.

## 옆마당 목재 대문 {#side-yard-gate}

`side-yard-gate`는 [옆길 owner](../spaces/site/side-walk.md#side-gate-interface)의 문기둥 안쪽 구간을 채우며 문기둥과 상부 헤더는 두지 않는다. 문짝은 보행면 S 위 0.05–1.70 m, 두께 0.04 m, 폭은 문기둥 안쪽 구간인 세로 보행면 폭 1.20 m에서 0.02 m를 뺀 1.18 m이고 세로 판재 `leaf-panel`과 가로 띠장으로 나눈다. 경첩은 +X 쪽, 열림은 정원 쪽 -Z이며 motion 인터페이스는 경첩 축 회전 0–π/2 rad, 기준 상태는 닫힘이다. 90°에서 경첩·문짝의 +X 경계 점유는 0.05 m 이내, 손잡이 포함 회전 반경은 1.20 m 이내로 owner의 한도를 지킨다. 90° 순폭은 1.20 - 0.04 - 0.05 = 1.11 m로 owner의 통과 폭 목표 1.05 m보다 크다. 소스 owner는 `src/models/gate.ts`이며 옆길 view로 검사한다.

## 외부 문의 표면 파티션 {#exterior-door-surfaces}

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 현관문과 정원문은 `jamb`, `exterior-trim`, `casing`, `threshold`, `muntin`, `glass`, `handle`, `hinge`를 쓰고, 문짝은 포치와 현관에서 다른 마감을 받을 수 있어 `leaf-exterior`와 `leaf-interior`로 나눈다. 차고문은 `leaf-exterior`, `leaf-interior`, `leaf-panel`, `glass`, `jamb`, `rail`, 대문은 `leaf-panel`, `hinge`, `handle`을 쓴다. 현관문과 대문의 목재 결 방향은 materials가 정하되, 모델은 문짝 면의 UV를 문짝 국소 X·Y에 정렬해 결이 문짝 높이 방향을 따를 수 있게 한다. 소스 owner는 `src/models/exterior-door.ts`, `src/models/garage-door.ts`, `src/models/gate.ts`다.

## 외부 문의 표현 한계 {#exterior-door-fidelity}

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 잠금 기구, 도어 클로저, 차고문 스프링·모터·케이블, 대문 걸쇠 내부는 만들지 않는다. 차고문 패널의 레일 위 자세는 이동량에서 산출한 blocking 자세이며 롤러 접촉이나 간섭 없음을 증명하지 않는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)과 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)이며 실제 렌더는 unverified다.
