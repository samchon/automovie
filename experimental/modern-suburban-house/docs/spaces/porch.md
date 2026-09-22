# 현관 포치의 바닥과 지붕

## 현관문에 맞춘 포치와 세 챌판 {#porch-platform-access}
<!--
@evidence principles/core/common.md#scope-preservation 현관 축의 포치·세 챌판·아래 대기와 보행길 접점을 배정한다.
@evidence principles/core/common.md#substantive-completion 1.50 m 진입 폭을 front-door 중심에 맞추고 디딤 Z를 역산한다.
@evidence principles/core/common.md#declared-basis 단차와 깊이는 storeys에서 받아 마지막 챌판을 포치 도착으로 센다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 높은 포치 요구에 실제 바닥 외곽과 문 축의 계단 위치를 더한다.
@evidence principles/design/spaces.md#space-topology 포치에서 거실을 통과하지 않고 현관문으로 직접 들어간다.
@evidence principles/design/spaces.md#space-boundary-authority 아래 대기 면은 front-walk 소유여서 porch가 중복 생성하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 현관문/세 단 축과 되돌아 나오는 길·접지 단면을 관찰한다.
@evidence settings/10-house.md#porch-entry 거실창과 현관 앞의 높은 바닥에 앞 보행길에서 세 단으로 직접 접근한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 설정의 유효 깊이·상승 높이와 문 접근을 대조해 열린 포치를 배정했으며 내부 난간 요구를 낮추지 않는다.
-->

`front-porch`는 ground-storey의 외부 부속 공간이다. [기존 바닥/접근 높이](01-storeys.md#ground-threshold-datums)를 유지한다. 바닥 외곽은 X = [-5.75, 2.20], Z = [0, 2.20] m다. 뒤쪽은 [본채 전면](00-building.md#main-building-extent), 앞쪽은 보행 접근, 위는 아래 포치 지붕이다. 실내 현관문은 [front-door](rooms/entry.md#entry-plan)를 소비한다. 거실을 통과하지 않고 포치에서 현관으로 진입한다.

진입 계단 폭은 1.50 m이며 현관문 개구부 중심 X에 맞춰 배치한다. 0.15 m의 세 챌판은 기존 -0.45 m 접근에서 포치 바닥까지 오른다. 별도 수평 디딤은 두 개로 각각 깊이 0.30 m이고 마지막 챌판은 포치 바닥으로 도달한다. 포치 바닥을 세 번째 독립 디딤으로 중복 생성하지 않는다. 첫 챌판 앞에는 같은 폭과 깊이 1.20 m의 평탄 대기를 둔다. 전체 Z 위치는 포치 앞끝과 디딤 깊이에서 역순으로 산출한다.

전면은 레퍼런스 01처럼 열린 포치로 택하고 외부 난간은 두지 않는다. 이는 [실내 계단 난간](02-stair.md#stair-clearance)을 생략하는 선택이 아니다. 낮은 화분·발판은 진입 폭 밖에 놓는다. [현관 보행길](site/front-walk.md#front-walk-plan)은 앞 문단에서 정한 아래 평탄 대기를 소비하여 첫 챌판에 닿고, 대기와 보행길을 한 완결 면으로 소유한다. `src/spaces/porch.ts`는 포치 바닥·챌판·디딤을 소유하고 아래 대기 바닥을 중복 생성하지 않는다. 지반 마감과 외부 보도 접속은 미완료다. 현관문/세 단/아래 대기의 축, 위에서 아래로 돌아 나오는 길, 포치 가장자리와 접지·그림자는 unverified다.

바닥 상부판·가장자리 지지벽·단 몸체와 세 기둥 아래의 지지는 [높은 평탄면 단면](site/01-paving-support.md#raised-platform-support)을 소비한다. 기존 상면과 단 수·순폭을 유지하면서 하부 대기의 바탕 아래면에 맞추며, 그 접합 기준을 실제 지표나 기초 깊이로 읽지 않는다.

## 세 기둥과 낮은 경사 지붕 {#porch-roof-columns}
<!--
@evidence principles/core/common.md#scope-preservation 기둥 몸통·머리·받침·보·지붕 아래면까지 지지 관계를 정한다.
@evidence principles/core/common.md#substantive-completion 기둥 세 개의 간격과 P(Z), 보 위 받침 간격을 산출하도록 정한다.
@evidence principles/core/common.md#declared-basis 받침의 안쪽 면으로 기존 1.80 m 유효 깊이를 보존한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 부재 요구를 지붕 경사와 기둥/보의 실제 점유로 구체화한다.
@evidence principles/design/spaces.md#space-topology 거실창과 현관을 덮되 차고 정면과 상층 창을 가리지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority porch.ts가 완결 표면을 소유하고 전면 개구부는 해당 입면에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 양 끝 모서리·출입 축 단면·포치 아래 네 방향에서 지지와 충돌을 검사한다.
@evidence settings/10-house.md#porch-entry 낮은 지붕을 흰 사각 기둥과 머리·받침·보가 받는 관계로 설계한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 설정의 깊이와 창/현관을 함께 덮는 조건을 넓은 받침까지 대조했고 세 기둥 배치로 유지되어 부모 수정은 없다.
-->

[포치 바닥](#porch-platform-access) 위에 중심 X = -5.40 m에서 3.65 m 간격으로 기둥 세 개를 둔다. 기둥 몸통 폭/깊이는 0.25 m, 받침/머리의 폭/깊이는 0.35 m다. 공통 중심 Z는 기존 유효 깊이 1.80 m에 받침 깊이의 절반을 더한 1.975 m로 택한다. 가장 넓은 받침의 안쪽 면까지 1.80 m를 보존하며 몸통만 기준으로 순깊이를 주장하지 않는다. 받침 Y = [0, 0.15], 몸통 Y = [0.15, 2.33], 머리 Y = [2.33, 2.45] m다. 기둥 수와 간격에서 좌표를 반복 산출한다.

앞 보의 예약은 X = [-5.75, 2.20], Z = [1.85, 2.10], Y = [2.45, 2.70] m다. 포치 날씨 면은 `P(Z) = 3.50 - (1/4) × Z`, 아래면은 P에서 Y 방향으로 0.22 m 내린 면이다. 지붕 외곽은 X = [-6.10, 2.55], Z = [0, 2.35] m다. 본채 전면에 접하는 뒤쪽에는 벽 접합을 두고, 본채 왼쪽 외곽 밖의 짧은 뒤 모서리는 자유 외곽 두께로 닫는다. 보 상단과 지붕 아래면 사이에는 그 간격에서 산출한 받침 부재를 두어 지붕이 보 위에서 떠 있지 않게 한다.

이 지붕은 거실창과 현관문을 함께 덮고 차고 정면을 넘지 않는다. [전면 창 배치](envelope/front.md#front-openings)의 상층 창과 trim은 지붕 벽 접합보다 위에 남기며, 출입문 head와 포치 보 아래의 높이는 같은 단면에서 검사한다. 순높이의 최저 구조점은 보/머리/받침을 포함하여 다시 읽는다. 폭이 긴 지붕을 두께 없는 판으로 대체하지 않는다. 구조 단면의 용량·재료 적층과 접합 상세는 후속 단계의 미완료다.

지붕·아래면·기둥·머리·받침·보의 완결 표면 owner는 모두 `src/spaces/porch.ts`다. 검사 주소는 정면 전체, 두 끝 모서리, 출입 축 단면과 포치 아래 네 방향이다. 실제 지붕/기둥 접합·기둥과 계단/문 겹침·재료와 그림자 읽힘은 unverified다.
