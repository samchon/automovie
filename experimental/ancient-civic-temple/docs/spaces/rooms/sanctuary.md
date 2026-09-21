# 후면 축의 작은 제실

## 제단을 향한 방 {#sanctuary-volume}

공간 ID `sanctuary`의 본체 경계는 [공유 기준선](../building.md#plan-datums) west-ring~east-ring, north-inner~sanctuary-front다. 남쪽 중앙의 실제 문 하나가 북쪽 주랑에 직접 닿고 다른 방을 통과하지 않는다. 북쪽은 후면 외벽, 서쪽은 봉헌실 경계, 동쪽은 서비스 마당 경계다. 위쪽은 [제실 박공](../roofs/sanctuary.md#sanctuary-roof)의 내부 단면까지이며 평평한 천장으로 지붕 부피를 잘라 숨기지 않는다.

남벽 안 `door-sanctuary`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 제실이 소유하고 본체 바닥에서 주랑 쪽 벽면까지 이어진다.

[제실 정체성](../../settings/30-interiors.md#sanctuary)의 제단은 북쪽 중심 축에 두되 제단 후면에서 벽까지 0.7m 이상, 전면 활동 깊이는 1.5m 이상을 예약한다. 남쪽 문 스윙과 이 활동 영역은 겹치지 않는다. 제단을 포함한 폭 예산은 설정의 원래 크기를 유지한다. 후면 무문양 감실과 좌우 등잔이 중심 위계를 만들고 문 축에서 중정 수반을 볼 수 있게 한다. 구체 집기 mesh·석단은 후속 fit-out 소유다.

source `src/spaces/rooms/sanctuary.ts`가 방과 내벽·바닥·노출 지붕 하부의 완결 표면을 맡는다. 높은 작은 채광구는 [개구부](../openings.md#clerestories)의 실제 void를 공유한다. 단면은 제실의 깊이와 박공 높이, 문턱 관찰은 제단 위계, 중심 네 방위와 네 모서리는 사각지대·누광·표면 누락을 검사한다. 현재 통행·빛·방 정체성은 unverified다.
