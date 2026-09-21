# 후면 제실의 높은 박공

## 후면 축의 용마루 {#sanctuary-roof}

[제실 공간](../rooms/sanctuary.md#sanctuary-volume) 위의 지지선은 X=±5.75m, 북쪽 Z=-9.95m, 남쪽 Z=-4.0m다. [공통 높이·경사](assembly.md#roof-junctions)를 소비한 용마루는 X=0의 Z 방향 직선이고, 박공은 북·남을 향한다. 이 매스의 계산 용마루는 약 5.873m로 [설정 허용 높이](../../settings/20-envelope.md#roof-form) 안이다.

후보 끝선의 참조면은 [기준선](../building.md#plan-datums)의 서쪽 west-room, 동쪽 east-room, 북쪽 north-outer, 남쪽 north-ring이다. 각 면에서 공통 돌출을 바깥쪽으로 적용한다. 북측의 노출 박공 처마는 외벽 바깥면을 기준으로 돌출하며, 날개·주랑과 겹친 후보 끝은 assembly에서 자른다. 이 끝선 변경은 층이나 제실의 벽 위치를 바꾸지 않는다.

source `src/spaces/roofs/sanctuary.ts`가 두 경사 상면, 용마루, 외부 처마 하부와 끝 두께를 한 소유로 맡는다. 박공 벽의 외면은 북측 입면 및 제실 남쪽의 주랑 내면이고, 내부 노출 하부는 제실의 표면 소유다. 높은 창은 같은 박공 벽의 [void](../openings.md#clerestories)를 소비한다. 서측 날개와 만나는 면은 공통 교차 규칙으로 자른다.

정면·후면에서 낮은 날개 위 박공이 읽히는지, 내부에서 높은 목재 단면이 남는지, 창 위에 지붕 두께가 들어가는지를 관찰한다. 이는 지붕 매스 선택이며 실제 기와·목재 모듈이나 렌더 완료가 아니다.
