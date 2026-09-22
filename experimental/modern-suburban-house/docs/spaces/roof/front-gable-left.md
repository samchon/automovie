# 전면 박공의 왼쪽 경사면

## 전면 왼쪽의 박공 지붕 {#front-gable-left-roof}
<!--
@evidence principles/core/common.md#scope-preservation 왼쪽 박공의 날씨 면·아래면·사선 두께를 소유한다.
@evidence principles/core/common.md#substantive-completion 박공 중심 -X 면에서 주 지붕에 가려지는 부분을 제외한다.
@evidence principles/core/common.md#declared-basis F와 같은 골짜기를 지붕 접합 owner에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전방 박공 요구를 왼쪽 처마로 빠지는 골짜기 끝까지 배정한다.
@evidence principles/design/spaces.md#space-topology 앞 삼각 벽·오른쪽 용마루·뒤 주 지붕의 만남을 지정한다.
@evidence principles/design/spaces.md#space-boundary-authority front-gable-left.ts는 이미 계산된 뒤 윤곽을 다시 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 왼쪽 골짜기 배출 끝과 전면 두께/그림자를 관찰한다.
@evidence settings/10-house.md#main-mass 전면 박공의 왼쪽 경사와 아래면을 실제 삼각 벽 상단에 맞춘다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전방 박공과 양쪽 경사 요구를 왼쪽 면에 적용할 때 별도 동이나 층을 요구하지 않아 부모를 유지했다.
-->

`roof.front-gable.left`는 [박공 중심](00-junctions.md#roof-mass-allocation)보다 -X 쪽의 면이다. `src/spaces/roof/front-gable-left.ts`가 날씨 면·아래면·자유 외곽 두께를 소유한다. 높이는 [F](00-junctions.md#roof-profile-datums), 뒤쪽 윤곽은 [주 지붕과 같은 골짜기](00-junctions.md#roof-shared-edges)를 소비한다. 앞은 전면 돌출과 삼각 벽, 오른쪽은 박공 용마루, 뒤/왼쪽 합류는 주 지붕 앞 면과 만난다.

주 지붕에 가려지는 영역은 원래 사각 판으로 남기지 않는다. 외부에 드러난 사선 모서리와 아래면은 실제 두께로 끝내며 [전면 삼각 벽](../envelope/front.md#front-roof-closures)의 상단과 일치시킨다. 왼쪽 모서리에서 골짜기가 처마로 빠지는 끝, 전면에서 보이는 경사 두께와 그림자가 검사 질문이다. source·실제 경계 일치·01의 형상 판정은 unverified다.
