# 전면 박공의 왼쪽 경사면

## 전면 왼쪽의 박공 지붕 {#front-gable-left-roof}
<!--
@evidence principles/core/common.md#scope-preservation 박공 중심보다 -X 쪽 면의 날씨 면·아래면·자유 외곽 두께와 전면 삼각 벽 상단의 일치, 왼쪽 골짜기 배출 끝을 맡는다.
@evidence principles/core/common.md#substantive-completion 높이를 F로 정하고 주 지붕에 가려지는 영역을 원래 사각 판으로 남기지 않는다.
@evidence principles/core/common.md#declared-basis 박공 중심은 roof-mass-allocation, 높이 F는 roof-profile-datums, 뒤쪽 윤곽은 roof-shared-edges에서 받고 사선 모서리와 아래면을 끝낼 삼각 벽 상단 선은 front-roof-closures에서 받는다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 전방 박공 가운데 -X 쪽 경사면을 이 owner에 떼어 주고 드러난 사선 모서리와 아래면을 실제 두께로 끝내 전면 삼각 벽 상단과 맞추게 한다.
@evidence principles/design/spaces.md#space-topology 앞은 전면 돌출과 삼각 벽, 오른쪽은 박공 용마루, 뒤와 왼쪽 합류는 주 지붕 앞 면과 만난다.
@evidence principles/design/spaces.md#space-boundary-authority 뒤쪽 윤곽은 roof-shared-edges가 계산한 골짜기를 소비하고 드러난 사선 모서리와 아래면은 front-roof-closures가 닫는 전면 삼각 벽의 상단과 일치시킨다.
@evidence principles/design/spaces.md#space-verification-address 왼쪽 모서리에서 골짜기가 처마로 빠지는 끝, 전면에서 보이는 경사 두께와 그림자를 검사하게 한다.
@evidence settings/10-house.md#main-mass 전면 박공의 왼쪽 경사와 아래면을 실제 삼각 벽 상단에 맞춘다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "각 박공은 실제 삼각 벽과 양쪽 경사 지붕, 처마 밑면으로 닫혀야 한다"를 -X 면에 대조했고 뒤와 왼쪽이 주 지붕 앞 면과 합류하며 골짜기가 왼쪽 모서리에서 처마로 빠지는 면이 전면 삼각 벽 상단까지 닫혀 부모 수정이 없었다.
-->

`roof.front-gable.left`는 [박공 중심](00-junctions.md#roof-mass-allocation)보다 -X 쪽의 면이다. `src/spaces/roof/front-gable-left.ts`가 날씨 면·아래면·자유 외곽 두께를 소유한다. 높이는 [F](00-junctions.md#roof-profile-datums), 뒤쪽 윤곽은 [주 지붕과 같은 골짜기](00-junctions.md#roof-shared-edges)를 소비한다. 앞은 전면 돌출과 삼각 벽, 오른쪽은 박공 용마루, 뒤/왼쪽 합류는 주 지붕 앞 면과 만난다.

주 지붕에 가려지는 영역은 원래 사각 판으로 남기지 않는다. 외부에 드러난 사선 모서리와 아래면은 실제 두께로 끝내며 [전면 삼각 벽](../envelope/front.md#front-roof-closures)의 상단과 일치시킨다. 왼쪽 모서리에서 골짜기가 처마로 빠지는 끝, 전면에서 보이는 경사 두께와 그림자가 검사 질문이다. source·실제 경계 일치·01의 형상 판정은 unverified다.
