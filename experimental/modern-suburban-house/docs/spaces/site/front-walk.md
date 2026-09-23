# 현관 보행길과 차도 연결로

## 포치 축의 연속 보행면 {#front-walk-plan}
<!--
@evidence principles/core/common.md#scope-preservation 포치 축의 세로 보행면, 포치 아래 평탄 대기의 포함, 차도로의 가로 연결로와 높이식, 식재 제외 여유, owner를 맡는다.
@evidence principles/core/common.md#substantive-completion 가로 연결로를 Z = [4.25, 5.45] m에 두고 `(1 - t) × 보행길 Y + t × D(Z)` 보간으로 턱 없는 T자 보행 구역을 정한다.
@evidence principles/core/common.md#declared-basis 폭과 중심 X는 포치의 진입 계단, 상면 Y는 앞 보행길 datum, 차도 상면은 driveway owner에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "현관 보행길"을 포치 첫 챌판 앞에서 포장 끝까지 이어지는 한 면과 폭 1.20 m 가로 연결로로 만든다.
@evidence principles/design/spaces.md#space-topology front-walk가 포치와 전면 포장 끝을 잇고 차도와 T자로 합쳐지며 포치 아래 대기에 두 번째 바닥을 겹치지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 바탕은 paving-depth-reservation과 paving-contact-handoff에서 받고 식재 여유 0.20 m를 보행면 폭으로 세지 않는다.
@evidence principles/design/spaces.md#space-verification-address 포치 첫 챌판과의 경계, T자 접점, 차도의 비스듬한 접속선, 외부 포트 끝을 단면/평면과 양방향 접근으로 검사한다.
@evidence settings/10-house.md#porch-entry 외부 보행자가 앞 보도에서 포치와 현관으로 직접 접근하는 보행면을 만든다.
@evidence settings/10-house.md#site-identity 현관 보행길을 차고 진입 차도와 연결하는 대지의 보행면으로 만든다.
@evidence settings/00-production.md#use-profile 가로 연결로 폭 1.20 m를 바구니를 든 점유체가 현관으로 돌아오는 길로 택한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work porch-entry의 직접 접근과 0.35–0.55 m 포치 높이, site-identity의 보행길, use-profile의 바구니 폭을 대조했고 T자 보행면으로 성립해 부모 수정이 없었다.
-->

`front-walk`는 [대지와 식재](../../settings/10-house.md#site-identity)의 현관 보행길이며 house-site/ground-storey의 외부 보행 구역이다. [현관 포치](../porch.md#porch-platform-access)의 첫 챌판 앞에서 [전면 포장 끝](00-access.md#site-access-interface)까지 이어진다. 폭과 중심 X는 포치의 진입 계단을 그대로 소비하고, 안쪽 끝 Z는 그 첫 챌판 위치에서 산출한다. 상면 Y는 [앞 보행길 datum](../01-storeys.md#ground-threshold-datums)이다. 포치가 요구하는 아래 평탄 대기 전체를 이 한 면 안에 포함하며 그곳에 두 번째 바닥을 겹치지 않는다.

차도와의 가로 연결로는 Z = [4.25, 5.45] m, X는 이 보행길의 오른쪽 끝부터 [차도](driveway.md#driveway-plan)의 왼쪽 끝까지다. 세로 길과 가로 길을 하나의 T자 보행 구역으로 합치고 접점에 턱·연석·화분을 두지 않는다. 연결로의 횡단별 높이는 왼쪽의 보행길 상면과 오른쪽의 차도 상면 D(Z)를 직선 보간한다. `t = (X - 보행길 오른쪽 X) / (차도 왼쪽 X - 보행길 오른쪽 X)`, 상면은 `(1 - t) × 보행길 Y + t × D(Z)`다. 차도 쪽을 수평 바닥으로 잘라 작은 단차를 남기지 않는다.

가로 연결로 폭 1.20 m는 [바구니를 든 점유체](../../settings/00-production.md#use-profile)가 현관으로 돌아오는 길을 위한 저작 선택이다. 가장자리부터 바깥 0.20 m는 후속 식재의 줄기·가지·화분이 들어오지 않는 여유로 예약하며 보행면을 그 여유만큼 넓힌 것으로 세지 않는다. 포치의 첫 단 앞 대기에는 가로 길의 경사 보간이 들어가지 않는다. 구체 식재 개체는 이 면이 아닌 후속 소유자가 배치한다.

완결 보행면과 가장자리의 owner는 `src/spaces/site/front-walk.ts`다. 바탕은 [낮은 포장 두께](01-paving-support.md#paving-depth-reservation)와 [접촉 인계](01-paving-support.md#paving-contact-handoff)를 소비하고 줄눈·콘크리트 마감은 같은 면의 후속 저작이다. 포치 첫 챌판과의 경계, T자 접점, 차도의 비스듬한 접속선, 외부 포트 끝을 단면/평면과 양방향 접근으로 검사한다. 접합 높이 비교는 [공유 허용 오차](../01-storeys.md#storey-datums)를 소비한다. 실제 순폭·틈·접지와 01의 보행길 읽힘은 unverified다.
