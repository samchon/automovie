# 본채 오른쪽의 낮은 후방 지붕

## 후면까지 닫히는 오른쪽 지붕 {#right-back-roof}
<!--
@evidence principles/core/common.md#scope-preservation 오른쪽 영역 뒤 절반의 날씨 면·아래면, 뒤 자유 처마, 단차 후방 끝, 오른쪽 삼각 벽 상단과의 공유 경계를 맡는다.
@evidence principles/core/common.md#substantive-completion Rback을 적용해 앞쪽 낮은 용마루와 뒤쪽 자유 처마를 잇는 면을 정하고 뒤 처마·단차 후방 끝·오른쪽 삼각 벽 상단을 같은 아래면 경계로 맞춘다.
@evidence principles/core/common.md#declared-basis 뒤 절반 영역과 Rback은 roof/00에서, 왼쪽 단차는 right-roof-closures에서 받고 아래 욕실과 옷방은 지붕 때문에 낮추거나 새 외벽선으로 바꾸지 않는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 00-junctions의 Rback과 벽 상단 접촉을 받아, 오른쪽 뒤 지붕이 만드는 흰 처마 하부·자유 두께면의 UV 시작점과 절단 이음을 정한다.
@evidence principles/design/spaces.md#space-topology 앞은 낮은 용마루, 뒤는 자유 처마, 왼쪽은 주 지붕과의 단차, 오른쪽은 본채 박공 사선 모서리이며 아래에 욕실과 옷방이 그대로 있다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 Rback에서 받고 오른쪽 삼각 벽 상단은 right-roof-closures가 이 면 아래면에 맞춰 닫는 같은 경계라서 삼각 벽 owner가 별도 높이를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 후면/오른쪽 입면과 낮은 용마루 단면에서 처마·삼각 벽 상단의 일치와 층 천장 간섭을 보게 한다.
@evidence settings/10-house.md#main-mass 낮은 오른쪽 지붕의 뒤쪽을 Rback으로 닫고 그 아래 욕실과 옷방을 낮추지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "본채 오른쪽 끝의 더 낮은 지붕"과 2층 순높이 2.50–2.65 m를 뒤 면에 대조했고 욕실·옷방을 낮추지 않고 Rback으로 닫혀 부모 수정이 없었다.
-->

`roof.right.back`과 아래면은 `src/spaces/roof/right-back.ts`의 완결 면이다. [오른쪽 영역](00-junctions.md#roof-mass-allocation)의 뒤 절반에서 [Rback](00-junctions.md#roof-profile-datums)을 쓰고, 앞쪽의 낮은 용마루와 뒤쪽 자유 처마를 잇는다. 왼쪽은 주 지붕과의 [단차](../envelope/right.md#right-roof-closures), 오른쪽은 본채 박공 사선 모서리다.

이 면 아래의 욕실과 옷방을 지붕 때문에 낮추거나 새로운 외벽선으로 바꾸지 않는다. 뒤쪽 처마, 단차의 후방 끝, [오른쪽 입면](../envelope/right.md#right-roof-closures)이 낮은 지붕 아래면에 맞춰 닫는 오른쪽 삼각 벽 상단과 이 면의 아래면을 같은 경계로 맞춘다. 검사 주소는 후면/오른쪽 입면과 낮은 용마루 단면이다. 실제 면·층 천장 간섭·처마 부재 및 프레임은 unverified다.

이 owner가 만드는 흰 처마 하부의 U는 뒤 자유 처마 Z=−11.10 m의 왼쪽 끝 X=1.60 m에서 +X로 잰 거리, V는 그 처마에서 낮은 용마루 쪽 +Z로 올라간 실제 경사 거리다. 지붕 두께 0.24 m를 닫는 후면 fascia는 같은 X=1.60 m 끝에서 자유 모서리를 따라 U를 시작하고 날씨 면에서 아래면까지의 실제 두께 거리를 V로 둔다. 오른쪽 사선과 단차의 노출 두께면도 각 자유 모서리의 사전식으로 작은 (X,Z) 끝에서 실제 3차원 길이 U를 다시 시작한다. 용마루·단차·삼각 벽과 맞닿아 면이 끝나는 곳에서 UV를 자르고 공유 내부 면에는 흰 trim을 중복 부착하지 않는다. 지붕널 날씨 면은 [공통 경사 UV](../03-surface-owners.md#exterior-surface-handoff)를 유지한다.
