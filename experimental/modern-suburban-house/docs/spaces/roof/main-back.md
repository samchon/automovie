# 주 지붕의 후방 경사면

## 뒤쪽 처마까지 이어지는 주 지붕 {#main-back-roof}

`roof.main.back`과 아래면은 `src/spaces/roof/main-back.ts`가 소유한다. [주 지붕 영역](00-junctions.md#roof-mass-allocation)의 뒤 절반에서 [Mback](00-junctions.md#roof-profile-datums)을 사용한다. 앞 경계는 주 용마루, 뒤는 본채 후면의 자유 처마, 왼쪽은 측면 사선 모서리, 오른쪽은 낮은 지붕과의 단차다. 전면 박공을 이 면까지 관통시키거나 아래에 가려진 판으로 남기지 않는다.

후면 방 천장과 지붕 아래면은 [층 기준](../01-storeys.md#storey-datums)을 공유하고 중간에 추가 거주 층을 넣지 않는다. 후면 gutter가 용마루처럼 올라가거나 오른쪽 단차를 뚫지 않도록 경계별 역할을 유지한다. 검사 주소는 후면 전체 입면, 용마루/뒤 처마 단면, 오른쪽 단차의 후방 끝과 아래면이다. 실제 형상·부재·노출 면 관찰은 unverified다.
