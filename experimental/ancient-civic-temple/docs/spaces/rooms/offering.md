# 서측 공동 봉헌실

## 긴 공용 봉헌 공간 {#offering-volume}

공간 ID `offering`의 본체는 [기준선](../building.md#plan-datums) west-inner~west-room, north-inner~south-inner의 하나의 긴 방이다. 주랑과 제실의 서쪽에 있고 외벽은 서·북·남 입면과 맞닿는다. 동쪽 문은 주랑에 직접 닿으며 제실을 통한 우회 출입을 요구하지 않는다. 길이가 길다는 이유로 뒤를 숨은 방으로 나누지 않는다.

서측 spine 안 `door-offering`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 봉헌실이 소유하고 동쪽 주랑 바닥까지 이어진다.

[공동 봉헌실](../../settings/30-interiors.md#offering-room)을 따라 긴 탁자는 장축을 Z 방향으로 두고 양측 사용을 남긴다. 주랑 문 축의 통과 구간은 탁자와 진열대 사이에서 비우며 벽 진열은 북쪽과 서쪽을 우선한다. 무대·의자 열·새 의례 공간을 추가하지 않는다. 낮은 보·널판 천장은 [서측 지붕](../roofs/west.md#west-roof)의 실제 하부를 소비한다.

source `src/spaces/rooms/offering.ts`가 내벽·바닥·천장의 완결 표면과 이 공간의 단일 identity를 소유한다. 물체는 제단을 복제하지 않고 별도 봉헌 탁자·진열대 prototype을 소비한다. 네 모서리와 중심 네 방위에 장축 양끝에서 중앙 탁자를 향한 두 보조 관찰을 더해 긴 방의 끝을 숨기지 않는다. 문 스윙·탁자 양옆 여유는 실제 배치 이후 검사한다.
