# 차고 옆에서 정원으로 잇는 관리길

## 차도와 테라스 아래 대기를 잇는 보행면 {#side-walk-plan}
<!--
@evidence principles/core/common.md#scope-preservation 차도 오른쪽에서 차고 옆을 지나 정원 아래 대기에 닿는 세 띠, 앞쪽 경사 연결, 식재 제외 여유, maps 인계 조건, owner를 맡는다.
@evidence principles/core/common.md#substantive-completion 세로 길 왼쪽 끝을 차고 바깥 오른쪽 면에서 +X로 0.60 m, 폭 1.20 m로 두고 앞쪽 연결로 상면을 `(1 - t) × D(Z) + t × S`로 정한다.
@evidence principles/core/common.md#declared-basis S는 정원 아래 대기의 높이, D(Z)는 차도 owner의 상면에서 받고 이 식이 배수 성능이나 법규 판정이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지 설정의 우측 울타리와 관목 쪽 마당을 차도와 테라스 아래를 잇는 연속 관리 보행면으로 만든다.
@evidence principles/design/spaces.md#space-topology 세 띠의 합집합이 하나의 완결 보행면이며 세 번째 도로 포트나 차고 옆문을 추가하지 않고 아래 대기와 끝선에서만 맞닿는다.
@evidence principles/design/spaces.md#space-boundary-authority 앞쪽 연결로의 Z는 전면 포장 끝에서, 뒤쪽 가로 길은 아래 대기의 바깥 끝에서 받아 새 기준을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 두 꺾임, 경사 연결의 두 끝, 아래 대기와의 경계에서 사람/바구니의 양방향 이동을 평면/단면으로 검사한다.
@evidence settings/10-house.md#site-identity 우측의 목재 울타리와 관목 사이로 차도와 후면 정원을 잇는 대지 보행면을 둔다.
@evidence settings/00-production.md#use-profile 폭 1.20 m 보행면에서 사람/바구니의 양방향 이동을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 우측 울타리·관목과 use-profile의 바구니 폭을 관리길에 적용했고 maps 없이도 내부 보행면을 정할 수 있어 부모 수정이 없었다.
-->

`side-walk`는 house-site/ground-storey의 연속 외부 보행면이다. [차도](driveway.md#driveway-plan)의 오른쪽에서 나와 차고 오른쪽을 지나 [정원 아래 대기](terrace.md#garden-lower-landing-plan)의 바깥 끝에 닿는다. [maps 접속](00-access.md#site-access-interface)의 외부 node나 세 번째 도로 포트를 추가하지 않는다. 아래는 maps에 인계할 내부 보행면 예약이며 채택된 필지나 지표가 이미 있다는 주장이 아니다.

세계 X/Z m에서 세로 길의 왼쪽 끝은 [차고 바깥 오른쪽 면](../00-building.md#attached-garage-extent)에서 +X로 0.60 m, 폭은 1.20 m다. 앞쪽 연결로는 [전면 포장 끝](00-access.md#site-access-interface)보다 Z가 1.40 m 작은 곳부터 0.20 m 작은 곳까지의 1.20 m 띠로 두고, X는 차도 오른쪽 끝부터 세로 길 오른쪽 끝까지 잇는다. 세로 길의 앞쪽 끝은 이 연결로의 앞쪽 끝이다. 포장 끝까지 세로 길을 연장하여 보도에 별도 출입을 만들지 않는다.

뒤쪽 가로 길은 정원 아래 대기의 바깥 끝에서 -Z 방향 폭 1.20 m, X는 그 대기의 왼쪽 끝부터 세로 길 오른쪽 끝까지다. 세로 길은 이 가로 길의 바깥 끝까지 내려온다. 세 띠는 합집합으로 하나의 완결 보행면을 만들고 접점의 바닥을 복제하지 않는다. 아래 대기와는 끝선에서만 맞닿으며 기존 테라스/외부 단/대기를 덮지 않는다. 차고의 옆문이나 집 안의 두 번째 계단을 만들지 않는다.

세로/뒤쪽 길 상면 S는 정원 아래 대기의 높이를 소비한다. 앞쪽 연결로 중 차도 오른쪽 끝과 세로 길 왼쪽 끝 사이에서는 `t = (X - 차도 오른쪽 X) / (세로 길 왼쪽 X - 차도 오른쪽 X)`, 상면을 `(1 - t) × D(Z) + t × S`로 보간한다. D(Z)는 차도 owner의 상면이다. 세로 길 안에서는 S를 유지한다. 앞쪽 연결을 수평 판으로 만들면 차도의 경사면과 작은 턱이 생기므로 채택하지 않는다. 이 식은 외부 통행용 높이 예약이고 배수 성능이나 법규 적합성 판정은 아니다.

보행면 바깥 0.20 m는 줄기·바위와 [대지와 식재](../../settings/10-house.md#site-identity)의 관목·우측 목재 울타리 기초가 들어오지 않는 여유다. 그 여유를 통로 폭에 더하지 않는다. [문기둥 접속](#side-gate-interface)만 경계를 따라 허용하고 실제 기둥·문짝/손잡이를 뺀 순폭을 별도로 검사한다. maps가 받아야 할 필지 범위는 이 전체 보행면과 여유를 포함해야 하며, 실제 경계와 맞지 않으면 이 배치나 그 경계의 저작 owner에서 해결한다. 보행면 위 지표 중복, 포장 아래 빈틈, 처마/가지의 머리 공간은 미검증이다.

`src/spaces/site/side-walk.ts`가 연속 상면·옆면과 차도 접속을 소유한다. 바탕은 [보행 포장 두께](01-paving-support.md#paving-depth-reservation)와 [접촉/문기둥 인계](01-paving-support.md#paving-contact-handoff)를 소비하며 포장 원형·줄눈·마감은 같은 owner의 후속 저작이다. 두 꺾임, 경사 연결의 두 끝, 아래 대기와의 경계에서 [사람/바구니](../../settings/00-production.md#use-profile)의 양방향 이동을 평면/단면과 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 추가한다. 실제 구역·표면·접촉·통행과 01/03의 마당 읽힘은 unverified다.

## 측면 울타리 문과 양쪽 대기 {#side-gate-interface}
<!--
@evidence principles/core/common.md#scope-preservation 문 앞뒤 두 외부 구역, side-yard-gate의 평면·폭·경첩·문짝 높이·회전, 양쪽 대기와 조작 순서, 울타리 owner로의 인계를 맡는다.
@evidence principles/core/common.md#substantive-completion 최종 통과 폭 목표 1.05 m, 문짝 S 위 0.05–1.70 m, 회전 반경 1.20 m 이내, 앞 대기 +Z 0.10–1.60 m와 뒤 대기 -Z 1.30–2.80 m를 정한다.
@evidence principles/core/common.md#declared-basis 문 평면 Z는 차고 전면 바깥 면, 개구부 폭은 세로 보행면 폭에서 받고 무장애 인증이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 우측 목재 울타리를 +X 경첩·정원 쪽 -Z 열림의 문과 `side-front-access`·`side-rear-access` 두 구역으로 만든다.
@evidence principles/design/spaces.md#space-topology gate가 같은 연속 포장 위의 두 외부 구역을 나누고 둘 다 house-site/ground-storey에 속한다.
@evidence principles/design/spaces.md#space-boundary-authority 문짝과 기둥은 src/spaces/site/fence.ts 하나가 소유하고 보행면 owner는 문짝을 중복 생성하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 닫힌 문의 걸쇠 조작과 90° 열린 문 통과를 구별하고 두 구역 각각의 기본 시점과 꺾임의 가려진 코너를 검사한다.
@evidence settings/10-house.md#site-identity 우측 목재 울타리에 관리 통행용 문을 둔다.
@evidence obligations/design/spaces.md#space-access-circulation 관리길의 표현된 출입구인 gate에 양쪽 대기와 회전 반경을 배정하고 문으로만 앞뒤 구역을 나누게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 "우측의 목재 울타리와 관목"을 관리길에 대조했고 그 울타리에 통과 폭 목표 1.05 m의 관리문과 두 대기를 두는 결정은 설정이 정하지 않은 공간 선택이라 부모 수정 없이 성립했다. 문의 기본 닫힘은 이 H2 자신의 선택이다.
-->

위 [보행면](#side-walk-plan)에서 gate 앞을 `side-front-access`, 뒤를 `side-rear-access`의 두 외부 구역으로 택하고 둘 다 house-site/ground-storey에 속한다. 양쪽은 같은 연속 포장 owner를 공유하고 각각 threshold·코너·중심 네 방향과 가려지는 꺾임의 추가 질문을 가진다. 문 때문에 갈라진 구역의 질문을 한 개 대표 view로 줄이지 않는다.

`side-yard-gate`의 경계 평면 Z는 차고 전면 바깥 면을 소비한다. 문기둥 안쪽 사이의 X 구간은 세로 보행면의 폭과 같고, +X 쪽 경첩에서 정원 쪽 -Z 방향으로 연다. 최종 통과 폭 목표는 1.05 m다. 문기둥은 이 구간 바깥에 놓고 보행면 위를 가로지르는 상부 보/헤더는 두지 않는다. 목재 문짝은 S 위 0.05–1.70 m 안에, 손잡이를 포함한 회전 반경은 1.20 m 이내에 예약한다. 문을 90° 열었을 때 +X 경계에서 안쪽으로 들어오는 하드웨어 점유는 0.10 m 이내여야 한다. 실제 경첩/문틀/걸쇠 뒤의 폭·높이와 열림은 후속 부재에서 검사한다.

앞쪽 대기는 문 평면에서 +Z로 0.10–1.60 m, 뒤쪽 대기는 -Z로 1.30–2.80 m이며 두 곳 모두 세로 길 폭 전체를 쓴다. 두 대기는 새 판이 아니라 같은 보행면의 사용 구역이다. 닫힌 문에서 걸쇠를 조작하는 순간과 90° 열린 문을 통과하는 순간을 구별하고, 돌아올 때는 문짝이 회전할 동안 뒤쪽 대기로 물러난다. 기본 상태는 닫힘이며 동선 검사에서는 실제 문을 열어 양방향으로 통과한다. 차량 진입이나 무장애 인증을 뜻하지 않는다.

완결 목재 울타리와 문짝/기둥의 예정 owner는 `src/spaces/site/fence.ts` 하나다. 그 owner가 이 개구부/대기를 소비하며 보행면 owner는 문짝을 중복 생성하지 않는다. [울타리 전체 선](fence.md#fence-enclosure-plan)은 건물과 관리길의 외곽에서 도출하고 [잔여 패널/문기둥](fence.md#fence-gate-junction)이 이 문까지 닫는다. 실제 지표 접촉과 채택될 maps 경계는 아직 미완료다. 주변 울타리가 실제 문기둥까지 닫히고 이 문으로만 앞뒤 구역을 나누는지도 함께 검사해야 하므로, 현재 gate만으로 정원 경계가 완성됐다고 주장하지 않는다. 실제 문 조작·발/손 점유·전체 울타리 접합·01의 목재 경계와 두 구역의 관찰은 unverified다.
