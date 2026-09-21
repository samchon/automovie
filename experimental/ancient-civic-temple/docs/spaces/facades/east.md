# 동측 외피의 단독 소유

## 서비스 출입이 있는 업무 날개 {#east-envelope}

[기준선](../building.md#plan-datums)의 east-inner~east-outer가 동측 외벽이다. 남쪽부터 관리실·기록실·보관실, 북쪽은 서비스 마당의 바깥면이다. 업무방 벽 상단의 지붕 접합은 [남측](south.md#south-envelope), 낮은 마당 벽은 [북측](north.md#north-envelope)을 소비한다. 외부 서비스 문의 실제 void는 [문 owner](../openings.md#doors)에서 받고 방마다 바깥 출입문을 추가하지 않는다.

source `src/spaces/facades/east.ts`가 동측 완결 외피와 벽 실체를 소유하고 내측은 각 방에 남긴다. 양끝은 [모서리 접합](../junctions.md#wall-junctions)을 소비한다. 업무 날개 지붕은 마당 경계에서 끝나 하늘을 열어 두며 그 북쪽 박공은 [기존 공유 벽](../junctions.md#gable-closures)이 닫는다. 서비스 문에는 깊은 문설주·인방·목재 문짝이 읽혀야 하며 Y=0의 실제 외부 접점이 문턱에 닿는다.

동측 전면과 두 모서리, 서비스 출입 안/밖, 지붕에서 낮은 벽으로 바뀌는 단면을 관찰한다. 외부 문만 떠 있거나 벽 높이 변화 뒤에 없는 방을 암시하면 이 입면과 마당 owner를 함께 수리한다.

외벽 하단은 [층의 지면 접합](../storey.md#wall-ground-contact)을 소비하고, 서비스 문 안의 벽 두께 구간은 마당 소유 문턱 슬래브가 들어갈 부피를 비운다. 지면 아래 벽이 슬래브 아랫면에 닿는 것과 통과 영역을 막는 것을 구별하며, 외부 지면을 Y=0으로 일괄 복사하지 않는다.
