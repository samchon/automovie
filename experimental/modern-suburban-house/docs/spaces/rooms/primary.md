# 뒤쪽 왼편 주침실

## 복도와 옷방에 직접 닿는 주침실 {#primary-plan}

`primary-bedroom`은 upper-storey의 가장 큰 침실이다. 마감 안쪽은 X = [-5.50, 0.75]·Z = [-10.45, -6.06] m의 뒤쪽 본체와 X = [-5.50, -3.35]·Z = [-6.06, -4.71] m의 왼쪽 부분을 합친다. 앞쪽 왼편은 자녀 침실, 앞쪽 오른편은 [복도](upper-hall.md#upper-hall-plan), 오른쪽은 샤워 욕실/옷방, 뒤·왼쪽은 [본채 외벽](../00-building.md#main-building-extent)이다. 작은 자녀실보다 넓은 잠자리 주변과 옷 수납을 확보하되 상층 욕실의 필수 통과실이 되지 않는다.

`hall-primary-door`는 Z = [-6.06, -5.91]의 복도/침실 벽에 X = [-2.70, -1.70], Y = [3.06, 5.26] m의 거친 개구부를 만든다. 목표 유효 폭은 0.90 m다. -X 문설주 경첩에서 실내 -Z 방향으로 연다. [옷방 문](wardrobe.md#primary-wardrobe-plan)은 별도 개구부로 소비한다. 복도에서 어느 욕실로 갈 때도 이 두 문을 거치지 않는다.

[성인 둘의 침실](../../settings/10-house.md#primary-bedroom)로 [primary-rear-window](../envelope/rear.md#primary-rear-window)와 [primary-left-window](../envelope/left.md#primary-left-window)의 void, 큰 침대·양쪽 협탁·서랍장을 배정한다. 침대/수납 점유는 미완료이며 창대 돌출과 커튼 앞 접근을 포함해 배치한다. `src/spaces/rooms/primary.ts`가 소유하며 왼쪽 부분까지 방 바닥이 이어지는지와 모든 내부 코너를 검사한다. 실제 면적 비교·문/창 binding·침대 양옆 여유·옷방 접근과 시야는 unverified다.
