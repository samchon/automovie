# 건물 개구부 충전 배치

## 개구부에서 한 충전 원형을 도출하는 규칙 {#opening-fill-membership}
<!--
@evidence principles/core/common.md#scope-preservation window·door 개구부의 충전 membership의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 개구부 id와 같은 fill id를 하나씩 만들고 윤곽 아래 중앙에서 변환한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 spaces 개구부 윤곽과 models 국소 원점이다. 그 위에서 이 H2가 window·door 개구부의 충전 membership의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 spaces 개구부 윤곽과 models 국소 원점이고, 이 H2는 개구부 id와 같은 fill id를 하나씩 만들고 윤곽 아래 중앙에서 변환한다.
@evidence principles/design/instances.md#instance-prototype-boundary window·door 개구부의 충전 membership에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority kind=window·door를 골라 개구부 id를 그대로 충전 id로 쓴다. p·yaw는 윤곽 아래 중앙과 날씨·열림 법선에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 26개 중 남은 fill null 또는 중복 id이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work spaces 개구부 윤곽과 models 국소 원점을 실제 window·door 개구부의 충전 membership와 26개 중 남은 fill null 또는 중복 id에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-prototype-membership 26개 window·door 개구부 id마다 충전 원형 하나를 대응시킨다.
@evidence obligations/design/instances.md#instance-identity-transform 개구부 아래 중앙·법선에서 p·yaw를 생성하고 scale 1을 고정한다.
@evidence models/00-model-frame.md#model-local-frame 개구부 공통 좌표의 기준을 opening-fill-membership의 window·door 개구부의 충전 membership에 소비한다.
@evidence spaces/06-openings.md#external-opening-interface 공간이 내보내는 거친 개구부 id·윤곽·법선을 충전 id·크기·방향의 단일 입력으로 받는다.
-->

[개구부 공통 좌표](../models/00-model-frame.md#model-local-frame)에 따라 `src/spaces/environment-links.ts`가 내보내는 `kind=window` 또는 `kind=door` 개구부마다 같은 id의 충전 instance 하나를 배정한다. 원형은 아래 표의 models H2를 가리킨다. instance의 평행이동은 거친 개구부 아래 변의 가로 중앙과 원점 면의 교점이고, 회전은 Y축 yaw 하나, scale은 1이다. 로컬 +Y는 위, +Z는 외부 창·문에서 날씨 쪽이고 실내 문에서 열리는 방 쪽이다. yaw 0은 +Z, π는 −Z, +π/2는 +X, −π/2는 −X를 향한다. 폭과 높이는 spaces 개구부 윤곽에서 계산해 모델 매개변수로 넘기며 별도 배율로 늘리지 않는다. 아래 표는 id별 원형과 방향·경첩이라는 instance 선택만 기록한다. p와 폭·높이는 매번 공간 개구부 윤곽에서 다시 계산하며 별도의 복사 목록을 유지하지 않는다. `fill: null`을 완성 상태로 해석하지 않으며, 후속 instance source가 개구부 id와 모델 instance id를 일대일로 연결해야 한다.

## 외벽 창 열두 곳 {#window-fill-placement}
<!--
@evidence principles/core/common.md#scope-preservation 외벽 열두 창의 원형 선택과 법선의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 욕조 창은 상부 경첩, 계단·차고 창은 고정창, 나머지는 상하창으로 고른다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 외피 개구부 치수와 창 모델의 들임·원점이다. 그 위에서 이 H2가 외벽 열두 창의 원형 선택과 법선의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 외피 개구부 치수와 창 모델의 들임·원점이고, 이 H2는 욕조 창은 상부 경첩, 계단·차고 창은 고정창, 나머지는 상하창으로 고른다.
@evidence principles/design/instances.md#instance-prototype-boundary 외벽 열두 창의 원형 선택과 법선에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 개구부 id는 원형·yaw 표의 키이며 p와 크기는 매번 해당 spaces 개구부에서 재계산한다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 높은 tub-right-window와 우측 garage-right-window의 틈이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 외피 개구부 치수와 창 모델의 들임·원점을 실제 외벽 열두 창의 원형 선택과 법선와 높은 tub-right-window와 우측 garage-right-window의 틈에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence models/01-windows.md#double-hung-window 상하창의 기준을 window-fill-placement의 외벽 열두 창의 원형 선택과 법선에 소비한다.
@evidence models/01-windows.md#fixed-window 고정창의 기준을 window-fill-placement의 외벽 열두 창의 원형 선택과 법선에 소비한다.
@evidence models/01-windows.md#awning-window 상부 경첩창의 기준을 window-fill-placement의 외벽 열두 창의 원형 선택과 법선에 소비한다.
@evidence spaces/envelope/front.md#living-front-window 거실 전면 묶음창의 2.80 m 거친 폭과 +Z 법선에서 상하창 변환을 만든다.
@evidence spaces/envelope/front.md#bedroom-two-front-window 둘째 침실 앞창의 윤곽을 같은 상하창 원형에 넘긴다.
@evidence spaces/envelope/front.md#stair-front-window 계단실 작은 창에는 고정창 원형을 골라 그 높은 창대 윤곽에 맞춘다.
@evidence spaces/envelope/front.md#bedroom-three-front-window 셋째 침실 앞창을 둘째와 별도 id로 유지한다.
@evidence spaces/envelope/rear.md#kitchen-rear-window 주방 뒤 조리대 위의 창을 −Z 법선 상하창으로 놓는다.
@evidence spaces/envelope/rear.md#family-rear-window 가족실 후면 묶음창의 너비를 원형 인자로 받는다.
@evidence spaces/envelope/rear.md#primary-rear-window 주침실 뒤 창의 상층 Y 윤곽을 원형에 넘긴다.
@evidence spaces/envelope/left.md#living-left-window 벽난로 뒤쪽의 거실 측창은 −X 법선에 창 원점을 맞춘다.
@evidence spaces/envelope/left.md#primary-left-window 주침실 왼쪽 창의 윤곽을 별도 side id로 유지한다.
@evidence spaces/envelope/right.md#family-right-window 가족실 오른쪽 창은 +X 법선에 상하창을 맞춘다.
@evidence spaces/envelope/right.md#tub-right-window 욕조 욕실의 높은 흐린 창에 상부 경첩창 원형을 배정한다.
@evidence spaces/envelope/right.md#garage-right-window 차고 측면 채광에는 고정창 원형을 배정한다.
@evidenceExclude models/01-windows.md#window-fidelity `window-fidelity`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidence models/01-windows.md#window-local-frame `window-local-frame`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidenceExclude models/01-windows.md#window-member-sizes `window-member-sizes`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/01-windows.md#window-muntin-grid `window-muntin-grid`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/01-windows.md#window-sill-trim `window-sill-trim`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/01-windows.md#window-surface-partitions `window-surface-partitions`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidence settings/10-house.md#openings `openings`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/envelope/left.md#left-openings `left-openings`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/envelope/rear.md#rear-openings `rear-openings`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/envelope/right.md#right-openings `right-openings`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

아래 열두 개는 [상하창](../models/01-windows.md#double-hung-window), [고정창](../models/01-windows.md#fixed-window), [상부 경첩창](../models/01-windows.md#awning-window) 중 한 원형을 쓴다. 원점은 각 날씨 면에 있으므로 창틀의 벽 안쪽 들임은 models 원형에서만 적용한다. 원점 `p`는 각 개구부 아래 변 중앙의 `(world X,Y,Z)` m로 계산하므로 여기서는 수치를 반복하지 않는다.

| 개구부 id | 원형 | yaw |
|---|---|---|
| `living-front-window` | 상하창 | 0 |
| `bedroom-two-front-window` | 상하창 | 0 |
| `stair-front-window` | 고정창 | 0 |
| `bedroom-three-front-window` | 상하창 | 0 |
| `kitchen-rear-window` | 상하창 | π |
| `family-rear-window` | 상하창 | π |
| `primary-rear-window` | 상하창 | π |
| `living-left-window` | 상하창 | −π/2 |
| `primary-left-window` | 상하창 | −π/2 |
| `family-right-window` | 상하창 | +π/2 |
| `tub-right-window` | 상부 경첩창 | +π/2 |
| `garage-right-window` | 고정창 | +π/2 |

## 외부 문 세 곳과 옆마당 대문 {#exterior-door-fill-placement}
<!--
@evidence principles/core/common.md#scope-preservation 현관·차고·정원문과 별도 관리문의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 정원문 Y=0, world 원점 대문은 identity 변환으로 놓는다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 외피 문턱·옆마당 빈 구간과 네 문 원형이다. 그 위에서 이 H2가 현관·차고·정원문과 별도 관리문의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 외피 문턱·옆마당 빈 구간과 네 문 원형이고, 이 H2는 정원문 Y=0, world 원점 대문은 identity 변환으로 놓는다.
@evidence principles/design/instances.md#instance-prototype-boundary 현관·차고·정원문과 별도 관리문에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 현관·차고·정원문과 별도 관리문의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 정원문 Y=0, world 원점 대문은 identity 변환으로 놓는다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 정원문 바닥 관통 또는 대문의 이중 평행이동이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 외피 문턱·옆마당 빈 구간과 네 문 원형을 실제 현관·차고·정원문과 별도 관리문와 정원문 바닥 관통 또는 대문의 이중 평행이동에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence models/02-exterior-doors.md#front-entry-door 현관문의 기준을 exterior-door-fill-placement의 현관·차고·정원문과 별도 관리문에 소비한다.
@evidence models/02-exterior-doors.md#garage-sectional-door 차고문의 기준을 exterior-door-fill-placement의 현관·차고·정원문과 별도 관리문에 소비한다.
@evidence models/02-exterior-doors.md#garden-door-pair 정원문의 기준을 exterior-door-fill-placement의 현관·차고·정원문과 별도 관리문에 소비한다.
@evidence spaces/site/side-walk.md#side-gate-interface 옆마당 관리문 경계의 기준을 exterior-door-fill-placement의 현관·차고·정원문과 별도 관리문에 소비한다.
@evidence models/02-exterior-doors.md#side-yard-gate 옆마당 대문 원형의 기준을 exterior-door-fill-placement의 현관·차고·정원문과 별도 관리문에 소비한다.
@evidence spaces/envelope/front.md#front-entry-filling 현관문 거친 윤곽과 전면 날씨 면을 앞문 원형의 변환 기준으로 받는다.
@evidence spaces/envelope/front.md#garage-front-opening 차고문 X=[6.10,11.10] m 개구부와 낮은 바닥 datum을 원형에 넘긴다.
@evidence spaces/envelope/rear.md#garden-door 정원문 윤곽의 벽 아래 절개 대신 완성 문턱 Y=0을 원형 원점으로 쓴다.
@evidenceExclude models/02-exterior-doors.md#exterior-door-fidelity `exterior-door-fidelity`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/02-exterior-doors.md#exterior-door-surfaces `exterior-door-surfaces`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidence spaces/site/fence.md#fence-gate-junction `fence-gate-junction`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/site/fence.md#fence-ground-profile `fence-ground-profile`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/site/side-walk.md#side-walk-plan `side-walk-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

완성 외부 문 세 곳은 [현관문](../models/02-exterior-doors.md#front-entry-door), [차고문](../models/02-exterior-doors.md#garage-sectional-door), [정원문](../models/02-exterior-doors.md#garden-door-pair)을 각각 한 번 사용한다. 기준 열림은 원형이 소유한다. 정원문은 완성 문턱 위 Y=0을 원점으로 쓴다. 따라서 벽 절개가 완성 바닥 아래까지 이어져도 문 원형을 아래로 내리지 않는다.

| 개구부 id | 원형 | yaw |
|---|---|---|
| `front-door` | 현관문 | 0 |
| `garage-front-door` | 차고문 | 0 |
| `garden-door` | 정원문 | π |

[옆마당 관리문 경계](../spaces/site/side-walk.md#side-gate-interface)는 environment 개구부 목록 대신 울타리의 별도 빈 구간이다. [옆마당 대문 원형](../models/02-exterior-doors.md#side-yard-gate)은 닫힌 판재 X=[12.31,13.49] m·Z=[−0.32,−0.28] m와 +X 경첩축을 세계 좌표로 정한다. 따라서 이 원형 한 개의 instance 변환은 위치 (0,0,0) m·yaw 0·scale 1이며, 이 H2에서 X=12.90 m 중심이나 정원 쪽 −Z 방향을 두 번째 변환으로 적용하지 않는다. 현장 경계 X=[12.30,13.50] m와 문짝의 맞댐만 검사하고 울타리 기둥·패널은 다시 만들지 않는다. 대문도 건물 충전 모집단에 넣되 환경의 `fill` 개수에는 합산하지 않는다.

## 실내 여닫이문 열한 곳 {#interior-door-fill-placement}
<!--
@evidence principles/core/common.md#scope-preservation 서비스실과 상층 복도 문 열한 곳의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 열리는 방 yaw와 low/high 경첩을 id별로 배정한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 실내 개구부와 문 원형의 경첩 거울 변형이다. 그 위에서 이 H2가 서비스실과 상층 복도 문 열한 곳의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 실내 개구부와 문 원형의 경첩 거울 변형이고, 이 H2는 열리는 방 yaw와 low/high 경첩을 id별로 배정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 서비스실과 상층 복도 문 열한 곳에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 열한 개구부 id가 yaw·경첩 표의 키이고 p와 폭은 개구부 아래 중앙·윤곽에서 재계산한다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 service-pantry-door high Z와 hall-primary-door π yaw이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 실내 개구부와 문 원형의 경첩 거울 변형을 실제 서비스실과 상층 복도 문 열한 곳와 service-pantry-door high Z와 hall-primary-door π yaw에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence models/03-interior-doors.md#interior-door-members 실내 문 원형의 기준을 interior-door-fill-placement의 서비스실과 상층 복도 문 열한 곳에 소비한다.
@evidence models/03-interior-doors.md#interior-door-hinges 방별 경첩 표의 기준을 interior-door-fill-placement의 서비스실과 상층 복도 문 열한 곳에 소비한다.
@evidence spaces/05-route-network.md#room-route-network 열한 문의 A방 열림 방향을 동선 owner에서 받고 각 yaw·경첩 변형과 맞춘다.
@evidenceExclude models/03-interior-doors.md#interior-door-fidelity `interior-door-fidelity`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/03-interior-doors.md#interior-door-surfaces `interior-door-surfaces`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
-->

열한 곳은 [실내 문 원형](../models/03-interior-doors.md#interior-door-members)을 각각 한 번 쓴다. p는 열리는 방 쪽 벽면과 거친 개구부 아래 중앙의 교점이다. 경첩 끝의 low/high는 [방별 경첩 표](../models/03-interior-doors.md#interior-door-hinges)에 있는 개구부 수평 좌표의 낮은/높은 끝이며, 모델의 거울 변형으로 좌우를 맞춘다. `local hinge`는 +Z 쪽에서 본 좌/우다. 모든 문의 기준 상태는 원형의 π/2 열림을 따른다.

| 개구부 id | yaw | world 경첩 끝 | local hinge |
|---|---|---|---|
| `laundry-garage-door` | −π/2 | low Z | 좌 |
| `entry-living-door` | −π/2 | low Z | 좌 |
| `service-powder-door` | +π/2 | low Z | 우 |
| `service-laundry-door` | +π/2 | low Z | 우 |
| `service-pantry-door` | +π/2 | high Z | 좌 |
| `hall-primary-door` | π | low X | 우 |
| `primary-wardrobe-door` | −π/2 | low Z | 좌 |
| `hall-bedroom-two-door` | 0 | high X | 우 |
| `hall-bedroom-three-door` | +π/2 | low Z | 우 |
| `hall-shower-door` | π | low X | 우 |
| `hall-tub-door` | +π/2 | high Z | 좌 |

## 열린 통로와 붙박이 수납문의 경계 {#non-door-opening-fills}
<!--
@evidence principles/core/common.md#scope-preservation 빈 통로 둘과 수납 미닫이문 둘의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 두 통로는 빈 채로 두고 수납문은 world 원형에 identity 변환을 준다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 spaces의 opening 네 곳과 closet 모델의 world 좌표이다. 그 위에서 이 H2가 빈 통로 둘과 수납 미닫이문 둘의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 spaces의 opening 네 곳과 closet 모델의 world 좌표이고, 이 H2는 두 통로는 빈 채로 두고 수납문은 world 원형에 identity 변환을 준다.
@evidence principles/design/instances.md#instance-prototype-boundary 빈 통로 둘과 수납 미닫이문 둘에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 빈 통로 둘과 수납 미닫이문 둘의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 두 통로는 빈 채로 두고 수납문은 world 원형에 identity 변환을 준다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 entry-coat X=2.02 또는 upper-linen Z=−3.41의 이중 변환이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work spaces의 opening 네 곳과 closet 모델의 world 좌표을 실제 빈 통로 둘과 수납 미닫이문 둘와 entry-coat X=2.02 또는 upper-linen Z=−3.41의 이중 변환에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence models/05-closet-fittings.md#coat-closet-doors 외투장 미닫이문의 기준을 non-door-opening-fills의 빈 통로 둘과 수납 미닫이문 둘에 소비한다.
@evidence models/05-closet-fittings.md#linen-closet-fittings 린넨장 미닫이문의 기준을 non-door-opening-fills의 빈 통로 둘과 수납 미닫이문 둘에 소비한다.
@evidence spaces/06-openings.md#external-opening-interface environment의 window·door와 별도인 네 opening 종류를 받아 두 통로를 비워 둔다.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-fidelity `closet-fitting-fidelity`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-surfaces `closet-fitting-surfaces`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidence models/05-closet-fittings.md#coat-closet-rod-shelf `coat-closet-rod-shelf`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence models/18-house-props.md#linen-folded-towels `linen-folded-towels`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence settings/10-house.md#upper-hall `upper-hall`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/rooms/upper-hall.md#upper-hall-plan `upper-hall-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage `upper-linen-storage`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

나머지 `kind=opening` 네 곳은 여닫이문 목록에 넣지 않는다. `living-common-opening`과 `service-common-opening`은 통행을 위해 비워 두는 공간 개구부다. `entry-coat-opening`은 [외투장 미닫이문](../models/05-closet-fittings.md#coat-closet-doors), `upper-linen-opening`은 [린넨장 미닫이문](../models/05-closet-fittings.md#linen-closet-fittings)이 닫는다. 두 모델 H2는 부재를 세계 좌표로 이미 정했으므로 각 instance의 변환은 위치 (0,0,0) m·yaw 0·scale 1이다. 외투장 앞면 X=2.02 m·가로 Z=[−4.51,−3.56] m·바닥 Y=0, 린넨장 앞면 Z=−3.41 m·가로 X=[1.97,2.97] m·바닥 Y=3.06 m를 각각 맞댐 기준으로 검사한다. 두 번째 이동·회전을 적용하거나 공간 벽·완성 바닥을 복제하지 않는다.

[린넨장 다섯 선반](../spaces/rooms/upper-hall.md#upper-linen-storage)의 상면에는 [접힌 수건 원형](../models/18-house-props.md#linen-folded-towels)을 선반마다 세 더미·더미마다 두 장으로 결속한다. 개체 id는 `upper-linen-towel-<shelf>-<stack>-<layer>`이고 shelf=1…5는 아래에서 위, stack=1…3은 왼쪽에서 오른쪽, layer=1…2는 아래에서 위다. 각 장의 원점은 해당 선반 상면의 뒤쪽에서 0.05 m 띄운 깊이와, 선반 길이 1.20 m 안의 양끝 0.16 m·더미 사이 0.02 m 간격을 사용한다. 모델의 국소 +Z는 문 쪽이고 여섯 방향 변이 없이 전체 30장을 같은 수납 host에 둔다. 열린 문 정면에서 다섯 층이 보이고 앞끝이 미닫이 문 트랙을 침범하지 않는지 검사한다.

## 배치의 관찰 문턱 {#opening-fill-observation}
<!--
@evidence principles/core/common.md#scope-preservation 충전 26·빈 통로 2·수납문 2·대문 1의 검증의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 외벽 네 시야, 개구부 높이 cut, 문설주·창대 근접 검사로 판정한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 환경 개구부 집합과 충전 id 집합이다. 그 위에서 이 H2가 충전 26·빈 통로 2·수납문 2·대문 1의 검증의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 환경 개구부 집합과 충전 id 집합이고, 이 H2는 외벽 네 시야, 개구부 높이 cut, 문설주·창대 근접 검사로 판정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 26개 충전 참조의 원형은 창·문 배치 H2에서 이미 선택된다. 이 H2의 census는 새 모델이나 변형을 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority window·door 개구부 id 집합에서 충전 id 집합을 뺀 결과와 중복 id 수를 계산한다. 손으로 적은 26이라는 수는 생성 권위가 아니다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 fill null 하나 또는 벽과 창틀의 틈 하나이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 환경 개구부 집합과 충전 id 집합을 실제 충전 26·빈 통로 2·수납문 2·대문 1의 검증와 fill null 하나 또는 벽과 창틀의 틈 하나에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-placement-review 26개 충전 census와 외벽 네 시야·문설주·창대 view가 누락과 틈을 판정한다.
@evidence settings/20-verification.md#frame-condition `frame-condition`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/20-verification.md#observation-allocation `observation-allocation`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/20-verification.md#viewer-handoff `viewer-handoff`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/04-observations.md#engine-render-handoff `engine-render-handoff`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/04-observations.md#reference-spatial-comparisons `reference-spatial-comparisons`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/04-observations.md#spatial-observation-derivation `spatial-observation-derivation`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

현재 building source는 26개 window/door 개구부 각각에 하나의 충전 참조를 넣고, 2개 통로는 비워 두며, 2개 수납 개구부와 별도 대문을 배치한다. 이 연결은 공간 단독 산출물의 `fill: null`과 구분한다. 403개 전체 건물 방향·높이 cut·근접 원본과 모델 정면/측면/사선의 material·face-ID 쌍을 대조해 문설주·창대·문선·창살·유리 및 양면의 맞댐을 확인했다. 관절 최대치는 같은 사선 카메라에서 별도 판독했으며 수납 미닫이는 한 문짝씩 최대치로 움직여 반대 문짝과 교환되어 다시 닫히는 입력을 사용하지 않았다. 린넨 수건30장은 별도 미제작 사물 초안이며 고정 수납문의 관찰로 완료를 주장하지 않는다. 개구부의 위치·크기를 바꾸는 경우에는 해당 spaces owner를 먼저 고치고 이 표와 충전 입력을 함께 갱신한다.
