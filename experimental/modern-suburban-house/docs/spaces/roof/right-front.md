# 본채 오른쪽의 낮은 전방 지붕

## 높은 지붕 아래에 붙는 앞 면 {#right-front-roof}

`roof.right.front`는 [본채 오른쪽 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. 높이와 아래면은 [Rfront](00-junctions.md#roof-profile-datums), 왼쪽 접합은 [단차 벽](../envelope/right.md#right-roof-closures)을 소비한다. 앞은 본채 정면 처마, 뒤는 낮은 용마루, 오른쪽은 본채 측면의 박공 사선 모서리다. 차고 위에 떠 있는 별도 상자나 추가 바닥을 만들지 않는다.

`src/spaces/roof/right-front.ts`가 완결 경사면·아래면을 소유한다. 상층 전면 창 위의 벽 높이를 보존하고 [차고 지붕](garage-front.md#garage-front-roof)과 서로 다른 높이의 외피로 읽히게 한다. 주 지붕 단차의 전면 끝, 상층 창/처마 단면과 낮은 용마루의 정면 실루엣을 검사한다. 실제 부재·창 binding·그림자와 프레임 대조는 unverified다.
