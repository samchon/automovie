<!--
@evidence discovery/design/instances.md#work-specific-instance-requirements 공유 instance 계약은 구성원·변환·변이·겹침 규칙을 요구하지만 구성원 집합이 spaces 방 예약 레코드와 일대일로 대응하고 이웃 route·use·swing 구역을 비워야 한다는 조건은 요구하지 않는다. 빈 예약·예약 없는 가구·통로를 먹는 몸체를 막기 위해 reservation-fill을 두고 instances/00-placement-frame.md의 reservation-derived-membership과 placement-fit-validity가 owner이며 house-instance-reservation-fill claim이 instances 층에 적용된다. course 법칙은 surface-ownership.md#whole-surface-owner의 instances claim이 덮고 yaw·무변이·seed 없음은 obligations/design/instances.md의 identity-transform·variation-tiers가 덮는다.
-->

# 방 예약과 개체의 일대일 대응

instances 층의 모든 방 가구·설비·수납·깔개 구성원에 적용하며, 구성원 집합이 spaces 방 예약 레코드와 어떻게 대응하고 이웃 통로를 비우는지를 판단한다.

## 예약 하나에 개체 하나, 예약 밖 통로는 비움 {#reservation-fill}

spaces 방 설계가 남긴 `kind`가 furniture·fixture·storage·covering인 모든 예약은 정확히 하나의 instance 구성원으로 채워지고, 예약 없는 가구·설비 개체는 만들지 않는다. models가 여러 예약을 한 원형으로 정의한 경우(팬트리 L형 선반)에만 한 구성원이 그 예약들을 함께 채우며 그 예외는 해당 instance H2가 이름으로 선언한다. 각 구성원의 월드 경계 상자는 자기 예약의 x·z·y 범위 안에 있고 같은 방의 route·use·swing 예약과 겹치지 않는다. covering 위에 선 몸체만 그 두께 안의 겹침을 허용한다. 예약 치수와 원형 치수가 맞지 않으면 배치에서 줄이거나 옮기지 않고 models 원형 또는 spaces 예약을 먼저 고친다.

가장 이른 owner는 [예약에서 도출하는 구성원과 식별자](../instances/00-placement-frame.md#reservation-derived-membership)와 [예약 안 적합과 통로 보존](../instances/00-placement-frame.md#placement-fit-validity)이다. 현재 실현은 docs/instances/01-ground-rooms.md·02-upper-rooms.md의 방별 H2이며, src/instances/는 아직 없어 모든 예약-개체 대응과 경계 상자 판정은 미검증이다. 검사는 src/spaces/rooms/*.ts의 `reservations`와 src/instances/ 배치 결과를 id로 맞대는 결정론적 비교다.

Review question: 어느 예약이 구성원 없이 남거나, 어느 구성원이 예약 없이 놓이거나, 자기 예약 안에 있으면서 같은 방의 route·use·swing 예약을 차지하는가?

Sources: [방 예약 레코드](../spaces/rooms/common.md#common-room-plan)를 포함한 spaces 방 설계; [instance 구성원 의무](../obligations/design/instances.md#instance-prototype-membership); [배치 검토 의무](../obligations/design/instances.md#instance-placement-review).
