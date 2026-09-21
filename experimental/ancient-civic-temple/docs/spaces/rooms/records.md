# 동측 기록실

## 건조 문서 보관과 열람 {#records-volume}

공간 ID `records`의 본체 경계는 [기준선](../building.md#plan-datums) east-room~east-inner, records-back~records-front다. 남쪽 관리실·북쪽 보관실과 공유 벽을 가지며 각 공유 벽은 개구부 없이 닫혀 있다. 서쪽 주랑으로 직접 문을 내고 동쪽 외벽에는 창을 추가하지 않는다.

동측 spine 안 `door-records`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 기록실이 소유한다. 방 본체의 건조 바닥이 이 구간을 지나 주랑 쪽 벽면까지 이어진다.

[기록실 정체성](../../settings/30-interiors.md#records)을 따라 북쪽 벽에 두루마리 칸 선반, 동쪽에 낮은 궤와 열람대를 배정한다. 선반 전면의 접근 깊이는 0.9m 이상을 예약하고 문 앞과 스툴 인출 영역은 비운다. 바닥은 주랑과 같은 높이의 건조한 상태다. 분수에서 이 방으로 이어지는 물길이나 배관 노출을 추가하지 않는다.

source `src/spaces/rooms/records.ts`가 내벽·바닥·낮은 천장을 모두 소유하며 두루마리 수량은 instances의 후속 결정이다. 서쪽 threshold와 네 모서리·네 방위 외에 선반 전면과 궤 앞을 관찰해 단순 작성실과 구별되는지 본다. 닫힌 궤 표시가 접근 여백의 검사를 면제하지 않는다.
