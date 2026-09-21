# 전면 왼쪽 자녀 침실

## 올리브 침실의 자기 경계 {#bedroom-two-plan}

`bedroom-two`는 upper-storey의 전면 왼쪽 방이다. 마감 안쪽 X = [-5.50, -1.95], Z = [-4.56, -0.25] m다. 앞·왼쪽은 [본채 외벽](../00-building.md#main-building-extent), 오른쪽은 [계단실 왼쪽 경계](../02-stair.md#stair-floor-opening), 뒤쪽은 Z = [-4.71, -4.56]의 복도/주침실 경계다. 순내부 예약 3.55 × 4.31 m는 한 자녀의 침대·책상·옷장과 별도 보행길을 넣기 위한 선택이다.

`hall-bedroom-two-door`는 뒤쪽 공유 벽에서 X = [-3.10, -2.10], Y = [3.06, 5.26] m의 거친 개구부다. 최종 유효 폭 0.90 m를 목표로 한다. +X 문설주 경첩에서 방 안 +Z 방향으로 열고 복도의 계단 보호 경계에 문짝을 세우지 않는다. [복도](upper-hall.md#upper-hall-plan)에서 자기 문으로 바로 들어오며 다른 침실이나 욕실을 지나지 않는다.

[올리브 침구의 방](../../settings/10-house.md#bedroom-two)으로 실현하며 전면 창을 이 방에 배정한다. 침대·책상·장과 창의 정확한 배치는 미완료다. 창 앞, 문 안쪽과 침대 옆 길을 가구 예약으로 재검사한다. `src/spaces/rooms/bedroom-two.ts`가 완결 내부 owner다. 문/창의 실제 binding·자기 공간 안 네 방향과 네 모서리의 시야·가구 접근은 unverified다.
