# 차고의 낮은 후방 지붕

## 차고 후벽과 본채 접합 {#garage-back-roof}

`roof.garage.back`과 아래면은 `src/spaces/roof/garage-back.ts`가 소유한다. [차고 영역](00-junctions.md#roof-mass-allocation)의 뒤 절반에 [Gback](00-junctions.md#roof-profile-datums)을 적용한다. 앞은 차고 용마루, 뒤는 차고 후벽의 자유 처마, 오른쪽은 박공 사선 모서리, 왼쪽은 본채 벽 접합이다.

후면 돌출이 본채의 공용부 창이나 상층 욕조 욕실 창과 겹치는지는 [오른쪽 입면](../envelope/right.md#right-roof-closures)의 지붕 접촉선을 함께 읽어 검사한다. 이 면을 후면의 별도 작은 동으로 늘리지 않는다. 뒤 처마 아래에서 본채 접점까지, 차고 내부 천장과 위 구조, 후방 경사면 전체가 검사 주소다. 실제 창 위치·source·면 census·시각 읽힘은 unverified다.
