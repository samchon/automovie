# 전면 박공의 왼쪽 경사면

## 전면 왼쪽의 박공 지붕 {#front-gable-left-roof}
<!--
@evidence principles/core/common.md#scope-preservation 박공 중심보다 -X 쪽 면의 날씨 면·아래면·자유 외곽 두께와 전면 삼각 벽 상단의 일치, 왼쪽 골짜기 배출 끝을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 roof.front-gable.left가 박공 중심 -X 쪽 날씨 면·아래면·자유 외곽 두께, front-roof-closures 삼각 벽 상단 일치, 왼쪽 모서리 골짜기 배출 끝을 front-gable-left.ts에 담아 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 높이를 F로 정하고 주 지붕에 가려지는 영역을 원래 사각 판으로 남기지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 -X 면 높이를 F로 두고 뒤쪽 윤곽을 roof-shared-edges 골짜기로 끊어 주 지붕에 가려지는 사각 판을 남기지 않는 본문을 대조해 왼쪽 박공 면 형상이 하위 발명 없이 정해짐을 확인했다.
@evidence principles/core/common.md#declared-basis 박공 중심은 roof-mass-allocation, 높이 F는 roof-profile-datums, 뒤쪽 윤곽은 roof-shared-edges에서 받고 사선 모서리와 아래면을 끝낼 삼각 벽 상단 선은 front-roof-closures에서 받는다고 링크로 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb -X 면의 박공 중심·F·골짜기·삼각 벽 상단이 각각 roof-mass-allocation·roof-profile-datums·roof-shared-edges·front.md#front-roof-closures 링크에 근거함을 본문에서 하나씩 대조해 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 00-junctions의 F와 front-roof-closures의 삼각 벽 상단 접촉을 받아, 박공 -X 경사면의 아래면·노출 사선 두께를 front-gable-left.ts에 배정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 00-junctions는 F와 벽 상단의 아래면 접촉을, front-roof-closures는 전면 삼각 벽의 높이를 이미 정한다. 이 H2는 박공 중심 -X 경사면과 노출 사선 두께·아래면을 front-gable-left.ts가 맡도록 분리한다.
@evidence principles/design/spaces.md#space-topology 앞은 전면 돌출과 삼각 벽, 오른쪽은 박공 용마루, 뒤와 왼쪽 합류는 주 지붕 앞 면과 만난다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 첫 문단의 앞=전면 돌출과 삼각 벽, 오른쪽=박공 용마루, 뒤/왼쪽 합류=주 지붕 앞 면을 대조해 -X 면의 네 방향 인접이 모두 적혀 장소 그래프가 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 뒤쪽 윤곽은 roof-shared-edges가 계산한 골짜기를 소비하고 드러난 사선 모서리와 아래면은 front-roof-closures가 닫는 전면 삼각 벽의 상단과 일치시킨다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 -X 면이 골짜기 좌표를 roof-shared-edges에서, 삼각 벽 상단을 front-roof-closures에서 링크로 소비하고 자기 본문에 그 값을 다시 적지 않음을 대조해 두 경계의 owner가 하나씩임을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 왼쪽 모서리에서 골짜기가 처마로 빠지는 끝, 전면에서 보이는 경사 두께와 그림자를 검사하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 검사 질문인 왼쪽 모서리 골짜기의 처마 배출 끝과 정면에서 보이는 -X 경사 두께·그림자를 두께·일치 주장에 대조했고 source·경계 일치·01 판정이 unverified로 남음을 확인했다.
@evidence settings/10-house.md#main-mass 전면 박공의 왼쪽 경사와 아래면을 실제 삼각 벽 상단에 맞춘다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab 설정 main-mass의 '실제 삼각 벽과 양쪽 경사 지붕, 처마 밑면'을 본문의 -X 경사 아래면을 실제 두께로 끝내 front-roof-closures 상단과 일치시키는 문장에 대조해 왼쪽 절반의 이행을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "각 박공은 실제 삼각 벽과 양쪽 경사 지붕, 처마 밑면으로 닫혀야 한다"를 -X 면에 대조했고 뒤와 왼쪽이 주 지붕 앞 면과 합류하며 골짜기가 왼쪽 모서리에서 처마로 빠지는 면이 전면 삼각 벽 상단까지 닫혀 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 main-mass의 박공 폐합 요구를 -X 면의 주 지붕 앞 면 합류, 왼쪽 모서리 골짜기 배출, 삼각 벽 상단 일치에 대조했고 부모와 충돌 없이 닫혀 설정 수정이 필요 없음을 확인했다.
-->

`roof.front-gable.left`는 [박공 중심](00-junctions.md#roof-mass-allocation)보다 -X 쪽의 면이다. `src/spaces/roof/front-gable-left.ts`가 날씨 면·아래면·자유 외곽 두께를 소유한다. 높이는 [F](00-junctions.md#roof-profile-datums), 뒤쪽 윤곽은 [주 지붕과 같은 골짜기](00-junctions.md#roof-shared-edges)를 소비한다. 앞은 전면 돌출과 삼각 벽, 오른쪽은 박공 용마루, 뒤/왼쪽 합류는 주 지붕 앞 면과 만난다.

주 지붕에 가려지는 영역은 원래 사각 판으로 남기지 않는다. 외부에 드러난 사선 모서리와 아래면은 실제 두께로 끝내며 [전면 삼각 벽](../envelope/front.md#front-roof-closures)의 상단과 일치시킨다. 왼쪽 모서리에서 골짜기가 처마로 빠지는 끝, 전면에서 보이는 경사 두께와 그림자가 검사 질문이다. source·실제 경계 일치·01의 형상 판정은 unverified다.

이 owner의 흰 박공 처마 하부는 전면 자유 끝에서 뒤쪽 −Z로 잰 길이를 U, 왼쪽 자유 처마에서 박공 용마루 쪽 +X로 올라간 실제 경사 거리를 V로 두며 전면 왼쪽 끝에서 시작한다. 지붕널 날씨 면은 [세계 경사 UV](../03-surface-owners.md#exterior-surface-handoff)를 유지한다. 전면 사선과 왼쪽 처마에서 보이는 두께 0.24 m의 흰 fascia는 각 자유 모서리의 사전식으로 작은 (X,Z) 끝에서 실제 3차원 길이 U와 날씨 면부터 아래면까지 수직 거리 V를 다시 시작한다. 오른쪽 용마루와 뒤쪽 골짜기는 공유 이음으로 자르고 주 지붕 아래에 가려진 두께면은 노출시키지 않는다.
