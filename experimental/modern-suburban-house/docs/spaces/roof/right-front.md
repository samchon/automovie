# 본채 오른쪽의 낮은 전방 지붕

## 높은 지붕 아래에 붙는 앞 면 {#right-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 낮은 본채 앞 지붕의 면·아래면과 창 위 공간을 배정한다.
@evidence principles/core/common.md#substantive-completion Rfront 앞 절반을 높은 주 지붕의 단차에 붙인다.
@evidence principles/core/common.md#declared-basis 오른쪽 영역과 단차 벽 owner의 입력을 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 우측 지붕을 차고와 다른 높이의 앞 실루엣으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 떠 있는 별도 상자나 추가 바닥을 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority right-front.ts가 완결 경사면을 맡고 단차 벽은 입면이 맡는다.
@evidence principles/design/spaces.md#space-verification-address 단차 전단·상층 창/처마 단면·낮은 용마루를 검사한다.
@evidence settings/10-house.md#main-mass 본채 안에서 낮아지는 오른쪽 지붕을 상층 전면 창 위에 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 낮은 지붕과 같은 본채라는 요구를 창 위 공간에 적용할 수 있어 부모 그래프 변경은 없다.
-->

`roof.right.front`는 [본채 오른쪽 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. 높이와 아래면은 [Rfront](00-junctions.md#roof-profile-datums), 왼쪽 접합은 [단차 벽](../envelope/right.md#right-roof-closures)을 소비한다. 앞은 본채 정면 처마, 뒤는 낮은 용마루, 오른쪽은 본채 측면의 박공 사선 모서리다. 차고 위에 떠 있는 별도 상자나 추가 바닥을 만들지 않는다.

`src/spaces/roof/right-front.ts`가 완결 경사면·아래면을 소유한다. 상층 전면 창 위의 벽 높이를 보존하고 [차고 지붕](garage-front.md#garage-front-roof)과 서로 다른 높이의 외피로 읽히게 한다. 주 지붕 단차의 전면 끝, 상층 창/처마 단면과 낮은 용마루의 정면 실루엣을 검사한다. 실제 부재·창 binding·그림자와 프레임 대조는 unverified다.
