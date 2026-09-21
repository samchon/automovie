# 후면 처마와 정원 쪽 외벽

## 두 본채 지붕과 차고 아래의 후면 {#rear-roof-closures}

`src/spaces/envelope/rear.ts`가 본채와 차고의 후면 완결 입면을 소유한다. [본채 후벽](../00-building.md#main-building-extent)은 기존 외벽 두께 안에서 [주/낮은 뒤 지붕 아래면](../roof/00-junctions.md#roof-profile-datums)까지 닫힌다. 두 지붕은 X 분할면에서 높이가 다르므로 후면 벽 상단도 그 단차를 소비한다. 그곳의 +X 방향 단차 벽은 [오른쪽 입면](right.md#right-roof-closures) 소유이고 후면 owner는 같은 모서리에 두 번째 벽을 겹치지 않는다. 전면 교차 박공의 삼각 벽을 후면에 복제하지 않는다.

차고 후벽은 [차고 외곽](../00-building.md#attached-garage-extent)의 같은 평면에서 Gback의 아래면까지 닫는다. 뒤 처마 돌출은 지붕 owner가 소유하며 벽이 그 끝까지 늘어나지 않는다. 본채와 차고의 후벽은 서로 다른 Z에 있으므로 두 뒤 모서리와 그 사이의 노출 본채 측면을 한 평면으로 덮지 않는다. 사이의 측면은 오른쪽 입면 owner와 같은 모서리를 소비한다.

본채 후면의 아래쪽은 [연속 공용부](../rooms/common.md#common-room-plan), 위쪽은 [주침실](../rooms/primary.md#primary-plan)과 [별도 옷방](../rooms/wardrobe.md#primary-wardrobe-plan)에 바인딩한다. 정원문과 창의 정확한 위치는 다음 개구부 배치에서 결정한다. 정원 출입은 공용부에서 직접 이어져야 하며 차고 뒤를 통과하는 숨은 통로로 바꾸지 않는다. 검사 주소는 후면 전체, 본채와 차고 각각의 두 뒤 모서리, 양쪽 처마 아래와 본채 단차의 후방 끝이다. 실제 벽/지붕 경계·개구부·대지 연결·프레임은 unverified다.
