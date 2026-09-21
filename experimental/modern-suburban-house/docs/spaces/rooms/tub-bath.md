# 오른쪽 욕조 욕실

## 복도 끝에서 직접 들어가는 욕실 {#tub-bath-plan}

`tub-bathroom`은 upper-storey의 오른쪽 독립 욕실이다. 마감 안쪽 X = [3.22, 5.50], Z = [-8.80, -4.71] m다. 오른쪽은 본채 외벽, 앞쪽은 청회색 침실과 Z = [-4.71, -4.56]의 벽, 뒤쪽은 옷방과 Z = [-8.95, -8.80]의 벽이다. 왼쪽 X = [3.07, 3.22]의 벽은 앞 부분에서 [복도](upper-hall.md#upper-hall-plan), 뒤 부분에서 [샤워 욕실](shower-bath.md#shower-bath-plan)에 닿는다.

`hall-tub-door`는 이 왼쪽 벽의 Z = [-5.86, -4.86], Y = [3.06, 5.26] m를 거친 개구부로 만든다. 유효 폭 0.90 m를 목표로 하고 +Z 문설주 경첩에서 방 안 +X 방향으로 연다. 샤워 욕실과 침실 쪽에는 통과문을 만들지 않는다.

[욕조 겸 샤워·변기·세면장](../../settings/10-house.md#tub-bathroom)의 배치는 뒤쪽으로 긴 순내부 2.28 × 4.09 m를 소비한다. 오른쪽 외벽의 [tub-right-window](../envelope/right.md#tub-right-window)는 차고 뒤 지붕을 피한 높은 흐린 창으로 이 방에만 바인딩한다. 실제 창호와 기구 점유는 아직 미완료다. `src/spaces/rooms/tub-bath.ts`가 소유한다. 변기나 세면장을 넘지 않고 욕조에 닿는 경로, 창의 접근/프라이버시·문/창의 실제 방 binding, 모든 구석과 부재 읽힘은 unverified다.
