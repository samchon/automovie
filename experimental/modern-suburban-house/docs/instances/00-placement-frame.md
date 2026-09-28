# 가구·설비 개체의 배치 기준

## 방 예약 구역에서 도출하는 구성원과 식별자 {#reservation-derived-membership}

가구·설비 개체의 구성원은 [방 설계](../spaces/rooms/common.md#common-room-plan)가 남긴 `kind`가 furniture·fixture·storage·covering인 예약 구역 하나마다 정확히 한 개체다. 개체 id는 예약 id를 그대로 쓰고(예: `common-dining-table`), 의자·스툴처럼 use 구역에 서는 개체는 use 구역 id에서 `-use`를 뗀 이름을 쓴다(예: `common-island-stool-1`). 구성원 목록은 src/spaces/rooms/*.ts의 `reservations` 레코드와 이 H2의 규칙에서만 도출하며 문서에 별도의 좌표 표를 두지 않는다. 방 문서가 예약을 추가·삭제하면 개체도 같은 이름으로 생기거나 사라지고, 예약 없는 가구는 만들지 않는다. route·swing 구역과 앞에 사람이 서는 use 구역은 개체를 받지 않는다. 원형(prototype)의 형상은 models branch가 소유하며 각 방 H2가 구성원마다 그 models H2를 링크한다. 이 대응의 계약은 [방 예약과 개체의 일대일 대응](../contracts/reservation-fill.md#reservation-fill)이다. source owner는 src/instances/ 아래 배치 모듈이고, 관찰은 모든 예약 id가 한 개체를 가지는지와 예약 없는 개체가 없는지를 대조한다.

## 월드 변환과 방향 규칙 {#placement-transform-rule}

모든 개체의 부모 frame은 [설정의 좌표](../settings/00-production.md#coordinate-units)인 오른손 Y-up 월드이며 단위는 m·rad다. 원형의 local +Z는 사용자가 다가오는 앞면이며 local 원점의 위치는 각 models H2가 선언한다(평면 중심, 벽에 닿는 뒤 변의 바닥 중심, 벽걸이 하단의 가로 중심 등). 개체의 위치는 그 선언된 원점이 예약 구역에서 대응하는 점이다: 평면 중심 원점은 구역 x·z 중점, 뒤 변 원점은 앞면 반대쪽 구역 변의 중점, 벽걸이 원점은 벽 쪽 구역 변의 중점이며 Y는 예약 y 범위의 하한(바닥 개체는 1층 0.00 m 또는 2층 3.06 m)이다. 회전은 Y축 yaw 하나뿐이며 앞면이 +Z면 0, +X면 π/2, -X면 -π/2, -Z면 π다. 앞면 방향은 예약 옆에 붙은 use·swing 구역이 있는 쪽으로 정하고, 해당 구역이 없는 개체는 각 H2가 방향을 명시한다. scale은 항상 1이며 크기 차이는 원형을 따로 두어 해결한다. 같은 입력은 순회 순서와 무관하게 같은 변환을 낸다.

## 변이·seed 없음 {#no-member-variation}

이 production의 가구·설비 개체는 무작위 변이, 위치 jitter, 회전 흔들림, 재질 변이를 쓰지 않으며 seed도 없다. 같은 원형의 구성원은 변환과, models 원형이 매개변수로 선언한 값(예: 세면장 W·D, 거울 W, siding 판 길이 L)만 다르며 그 값은 models H2가 구역마다 정한 값을 그대로 받는다. 선언되지 않은 형상 차이는 새 원형으로 models에 돌려보낸다. 문 열림, 서랍 열림, 의자 당김 같은 상태는 모든 구성원이 원형의 기본 닫힘·집어넣지 않은 상태 하나로 둔다. 가족 흔적이나 소품 배열을 개체마다 달리하려면 별도 원형을 models에 먼저 둔다. LOD 계층은 한 단계이며 거리에 따라 원형을 바꾸지 않는다. 관찰은 같은 원형 구성원 사이에 변환과 선언된 매개변수 외의 차이가 없는지 확인한다.

## 예약 안 적합과 통로 보존 {#placement-fit-validity}

각 개체의 월드 경계 상자는 자기 예약 구역의 x·z·y 범위 안에 있어야 하며 다른 예약의 route·use·swing 구역과 겹치면 안 된다. 원형 치수가 구역보다 크면 배치 쪽에서 줄이지 않고 models 원형이나 방 예약을 먼저 고친다. covering 예약(거실 러그 0.008 m, 현관 매트 0.006 m) 위에 선 가구는 그 두께 안의 겹침만 허용한다. 개체는 바닥이나 벽 호스트에 접하되 파고들지 않는다. 최악 경우는 구역 여유가 가장 작은 개체(각 방 H2가 이름을 댄다)이며, 관찰은 src/instances/ 배치 결과의 경계 상자와 src/spaces/rooms/*.ts 예약을 비교하는 결정론적 검사와 평면 관찰 프레임에서 한다.
