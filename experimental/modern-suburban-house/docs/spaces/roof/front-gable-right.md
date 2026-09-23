# 전면 박공의 오른쪽 경사면

## 계단 창 쪽으로 내려가는 박공 {#front-gable-right-roof}
<!--
@evidence principles/core/common.md#scope-preservation 박공 중심보다 +X 쪽 면의 날씨 면·아래면, 오른쪽 골짜기, 계단 창 위 처마와의 관계를 맡는다.
@evidence principles/core/common.md#substantive-completion F의 오른쪽 기울기와 그 아래면을 이 면에 적용하고 날씨 면·아래면을 front-gable-right.ts 한 owner에 둔다.
@evidence principles/core/common.md#declared-basis 박공 중심은 roof-mass-allocation, 높이는 roof-profile-datums, 골짜기는 roof-shared-edges, 계단 창과의 관계는 front-roof-closures에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전방 박공 가운데 +X 쪽 경사면을 이 owner에 떼어 주고 박공 트림·아래면·주 지붕 합류를 별도 장식 판으로 겹치지 않고 이 면 하나로 닫게 한다.
@evidence principles/design/spaces.md#space-topology 왼쪽 박공 용마루, 앞 전면 사선 모서리, 뒤 주 지붕 앞 면과의 골짜기가 이 면의 세 경계이고 이 면이 계단 창 앞까지 내려와 창을 덮는지를 검사할 차단 관계로 둔다.
@evidence principles/design/spaces.md#space-boundary-authority 골짜기 윤곽과 F 높이는 roof/00의 계산을 그대로 소비하고 계단 창과의 관계는 front-roof-closures에서 받아 이 면이 창 좌표를 정하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 오른쪽 골짜기 끝과 계단 창 위 처마의 정면/측면 단면, 박공 정면의 사선에서 이 면이 계단 창 앞까지 내려와 창을 덮는지 검사하게 한다.
@evidence settings/10-house.md#openings 작은 계단 창 앞까지 이 면이 내려와 창을 덮는지 전면 경계와 함께 대조하고 박공 트림·아래면을 별도 장식 판으로 겹치지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 "계단/복도용의 더 작은 창"과 main-mass의 "정면 왼쪽의 전방을 향한 큰 박공"을 +X 면에 대조했고 창을 덮는지는 stair-front-window 개구부와의 source 검사로 남으며 두 설정 사이 충돌은 없어 부모 수정이 없었다.
-->

`roof.front-gable.right`는 [정면 왼쪽의 전방 박공](../../settings/10-house.md#main-mass) 가운데 [박공 중심](00-junctions.md#roof-mass-allocation)보다 +X 쪽의 면이며 `src/spaces/roof/front-gable-right.ts`가 소유한다. [F의 오른쪽 기울기와 아래면](00-junctions.md#roof-profile-datums), [동일 골짜기](00-junctions.md#roof-shared-edges)를 받는다. 왼쪽은 박공 용마루, 앞은 전면 사선 모서리, 뒤쪽은 주 지붕 앞 면과 만나는 골짜기다.

이 면이 [계단 창](../envelope/front.md#stair-front-window)의 개구부 앞까지 내려와 창을 덮는지 [전면 경계](../envelope/front.md#front-roof-closures)와 함께 검사한다. 박공 트림·아래면·주 지붕 합류를 별도 장식 판으로 겹치지 않는다. 검사 주소는 오른쪽 골짜기 끝과 계단 창 위 처마의 정면/측면 단면, 박공 정면의 사선이다. source가 없어 개구부 간섭·윤곽·그림자 판정은 unverified다.
