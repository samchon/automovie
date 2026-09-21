# 전면 지붕과 실내 경계

## 박공 삼각 벽과 포치 위의 외벽 {#front-roof-closures}

전면 전체 입면 owner는 `src/spaces/envelope/front.ts`다. [본채 전면](../00-building.md#main-building-extent)의 벽과 [왼쪽 박공](../roof/00-junctions.md#roof-mass-allocation)은 같은 외곽에서 닫힌다. 박공 삼각 벽의 높이는 [F의 아래면](../roof/00-junctions.md#roof-profile-datums)에서 읽고, 나머지 전면은 주/낮은 지붕의 해당 외벽선 아래면까지 이어진다. 정면에 삼각 판을 별도로 겹쳐 박공처럼 보이게 하지 않는다. 정면 벽의 실제 두께는 기존 외벽 예약을 사용한다.

왼쪽은 [거실](../rooms/living.md#living-plan)과 [올리브 침실](../rooms/bedroom-two.md#bedroom-two-plan), 가운데는 [현관문](../rooms/entry.md#entry-plan)과 [계단 창](../02-stair.md#stair-floor-opening), 오른쪽은 [청회색 침실](../rooms/bedroom-three.md#bedroom-three-plan)과 서비스 띠에 각각 바인딩한다. 포치가 거실창과 현관문을 덮는 관계는 [포치 지붕](../porch.md#porch-roof-columns)이 소유한다. 차고 정면 역시 같은 완결 입면 owner가 소비하되 차고문을 본채 방에 바인딩하지 않는다.

창의 정확한 void·높이·문틀/창틀과 차고 정면 개구부는 아직 미완료다. 다음 개구부 배치는 포치 벽 접합 위와 주/낮은 지붕 처마 아래에 남는 외벽을 읽고 결정한다. 특히 계단의 작은 창이 박공 골짜기·포치 접합에 잘리거나, 차고 지붕을 창처럼 그려 놓고 방과 일치한다고 보고하지 않는다. 검사 주소는 정면 전체와 두 전면 모서리, 각 삼각 벽/처마 아래 단면 및 모든 실제 개구부다. 외부 창 위치와 전체 형상·재료·GPU 프레임은 unverified다.
