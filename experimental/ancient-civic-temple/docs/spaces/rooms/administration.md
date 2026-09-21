# 남동측 관리실

## 작성 작업의 첫 방 {#office-volume}

공간 ID `administration`은 [기준선](../building.md#plan-datums) east-room~east-inner, office-back~south-inner에 있다. 북쪽은 기록실, 동·남쪽은 외벽, 서쪽은 주랑이다. 서쪽의 직접 문만이 실내 접근이며 기록실을 통과하는 숨은 연결문은 없다.

[관리실](../../settings/30-interiors.md#administration)의 단일 작성 책상은 동쪽 벽 가까이 두고 스툴이 서쪽 통로 방향으로 빠질 공간을 예약한다. 작성 도구와 소량 용기를 써서 칸 선반 중심의 기록실과 밀도를 구별한다. 문 스윙은 방 안 남쪽 벽 쪽으로 수용하고 책상 진입과 겹치지 않게 한다. 낮은 목재 천장은 [동측 지붕](../roofs/east.md#east-roof) 하부에 속한다.

source `src/spaces/rooms/administration.ts`가 공간과 내벽·바닥·천장 전체를 소유한다. 서쪽 threshold, 네 안쪽 모서리, 중심 네 방위가 기본 관찰이다. 여기에 책상에서 열린 문까지의 역방향 접근을 확인한다. 실제 문·가구의 비충돌과 작성실 읽힘은 source 및 GPU 관찰 전까지 unverified다.
