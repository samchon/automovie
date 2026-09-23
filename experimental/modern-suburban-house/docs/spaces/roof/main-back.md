# 주 지붕의 후방 경사면

## 뒤쪽 처마까지 이어지는 주 지붕 {#main-back-roof}
<!--
@evidence principles/core/common.md#scope-preservation 주 지붕 뒤 절반의 날씨 면·아래면과 뒤 자유 처마, 왼쪽 사선 모서리, 오른쪽 낮은 지붕과의 단차 경계를 맡는다.
@evidence principles/core/common.md#substantive-completion 주 지붕 영역의 뒤 절반에 Mback을 적용하고 전면 박공을 이 면까지 관통시키거나 아래에 가려진 판으로 남기지 않는다.
@evidence principles/core/common.md#declared-basis 영역은 roof-mass-allocation, 높이 함수는 roof-profile-datums, 후면 방 천장과의 관계는 storey-datums에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주 용마루 뒤쪽을 전면 교차가 없는 하나의 후방 경사면으로 확정하고 후면 gutter가 용마루처럼 올라가지 않게 경계별 역할을 정한다.
@evidence principles/design/spaces.md#space-topology 앞 경계는 주 용마루, 뒤는 본채 후면의 자유 처마, 왼쪽은 측면 사선 모서리, 오른쪽은 낮은 지붕과의 단차이고 후면 방 천장과 이 지붕 사이에 거주 층이 없다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 00-junctions의 Mback과 주 지붕 영역에서 받고 오른쪽 단차는 right 입면의 단차 벽이 닫으므로 이 면이 그 경계를 뚫거나 다시 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 후면 전체 입면, 용마루/뒤 처마 단면, 오른쪽 단차의 후방 끝과 아래면을 관찰하게 한다.
@evidence settings/10-house.md#main-mass 좌우 방향 주 용마루의 뒤쪽을 뒤 처마까지 내려가는 한 경사면으로 닫고 전면 박공을 이 면에 관통시키지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "본채의 좌우 방향 주 용마루"와 2층 순높이 2.50–2.65 m를 뒤 면에 대조했고 Mback이 후면 방 천장 위에서 뒤 처마까지 내려가 부모 수정이 없었다.
-->

`roof.main.back`과 아래면은 `src/spaces/roof/main-back.ts`가 소유한다. [주 지붕 영역](00-junctions.md#roof-mass-allocation)의 뒤 절반에서 [Mback](00-junctions.md#roof-profile-datums)을 사용한다. 앞 경계는 주 용마루, 뒤는 본채 후면의 자유 처마, 왼쪽은 측면 사선 모서리, 오른쪽은 낮은 지붕과의 단차다. 전면 박공을 이 면까지 관통시키거나 아래에 가려진 판으로 남기지 않는다.

후면 방 천장과 지붕 아래면은 [층 기준](../01-storeys.md#storey-datums)을 공유하고 중간에 추가 거주 층을 넣지 않는다. 후면 gutter가 용마루처럼 올라가거나 오른쪽 단차를 뚫지 않도록 경계별 역할을 유지하며, 그 단차는 [오른쪽 입면의 단차 벽](../envelope/right.md#right-roof-closures)이 닫으므로 이 면이 다시 만들지 않는다. 검사 주소는 후면 전체 입면, 용마루/뒤 처마 단면, 오른쪽 단차의 후방 끝과 아래면이다. 실제 형상·부재·노출 면 관찰은 unverified다.
