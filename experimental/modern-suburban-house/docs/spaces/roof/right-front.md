# 본채 오른쪽의 낮은 전방 지붕

## 높은 지붕 아래에 붙는 앞 면 {#right-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 본채 오른쪽 영역 앞 절반의 날씨 면·아래면, 상층 전면 창 위 벽 높이의 보존, 차고 지붕과의 높이 구별을 맡는다.
@evidence principles/core/common.md#substantive-completion Rfront를 이 면의 날씨 면·아래면에 적용해 주 지붕보다 낮은 앞 면을 확정하고 완결 경사면과 아래면을 right-front.ts 한 owner에 둔다.
@evidence principles/core/common.md#declared-basis 앞 절반 영역과 Rfront는 roof/00에서, 왼쪽 접합은 right-roof-closures의 단차 벽에서 받고 차고와의 높이 차이는 garage-front-roof와 비교해 읽는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 본채 오른쪽의 낮은 지붕을 차고 지붕과 다른 높이의 앞 실루엣으로 정하고 상층 전면 창 위 벽 높이를 보존하는 위치로 둔다.
@evidence principles/design/spaces.md#space-topology 앞은 본채 정면 처마, 뒤는 낮은 용마루, 오른쪽은 본채 측면의 박공 사선 모서리, 왼쪽은 주 지붕 단차이며 차고 위에 떠 있는 별도 상자가 아니다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 Rfront에서만 받고 왼쪽 단차 벽은 right 입면 owner가 닫으므로 이 면은 완결 경사면과 아래면만 만든다.
@evidence principles/design/spaces.md#space-verification-address 주 지붕 단차의 전면 끝, 상층 창/처마 단면, 낮은 용마루의 정면 실루엣을 검사하게 한다.
@evidence settings/10-house.md#main-mass 본채 안에서 낮아지는 오른쪽 지붕을 상층 전면 창 위에 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "본채 오른쪽 끝의 더 낮은 지붕"과 "오른쪽 박공은 별도 독립 동이나 세 번째 층이 아니다"를 앞 면에 대조했고 Rfront가 본채 영역 안에서 상층 창 위에 남아 부모 수정이 없었다.
-->

`roof.right.front`는 [본채 오른쪽 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. 높이와 아래면은 [Rfront](00-junctions.md#roof-profile-datums), 왼쪽 접합은 [단차 벽](../envelope/right.md#right-roof-closures)을 소비한다. 앞은 본채 정면 처마, 뒤는 낮은 용마루, 오른쪽은 본채 측면의 박공 사선 모서리다. 차고 위에 떠 있는 별도 상자나 추가 바닥을 만들지 않는다.

`src/spaces/roof/right-front.ts`가 완결 경사면·아래면을 소유한다. 상층 전면 창 위의 벽 높이를 보존하고 [차고 지붕](garage-front.md#garage-front-roof)과 서로 다른 높이의 외피로 읽히게 한다. 주 지붕 단차의 전면 끝, 상층 창/처마 단면과 낮은 용마루의 정면 실루엣을 검사한다. 실제 부재·창 binding·그림자와 프레임 대조는 unverified다.
