# 신전 밖 이웃과 식생의 배치

국소 대지의 포장·흙띠·먼 능선은 spaces의 완성 표면을 그대로 유지한다. 여기서는 그 표면 위에 놓이는 개체의 수와 변환만 더한다. 모델 원형은 임의 축척으로 늘리거나 줄이지 않는다.

## 길 건너 이웃 외피 {#neighbors}

<!--
@evidence principles/core/common.md#declared-basis 네 배치 구역의 경계와 gable·shed 외피의 바닥 원점을 입력으로 삼고 동서북 세 위치를 이 단위가 선택한다.
@evidence principles/core/common.md#scope-preservation 동서 골목과 북쪽 골목 밖 세 외피를 포함하며 포장·신전 내부·이웃 실내를 새로 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 세 중심과 정면 회전·지면 높이·단일 tier를 고정하여 길 위 점유나 떠 있는 바닥을 반증할 수 있다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 허용 구역은 개체 수와 정면 방향을 정하지 않으므로 세 역할과 위치·회전을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 두 gable과 한 shed 외피만 사용하며 열린 실내나 개별 기와 상세를 추가하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 원형 바닥을 site grade에 맞추고 회전한 전체 지붕 포락이 각 구역 안에 남는 위치를 선택한다.
@evidence principles/design/instances.md#instance-verification-address 동서 골목과 외부 setting 조감에서 지붕 포락·바닥 접촉·주인공 가림을 함께 본다.
@evidence obligations/design/instances.md#addressable-instance-decisions 세 외피의 역할과 개수·좌표·회전은 이 H2의 표가 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership east와 west는 gable, north는 shed의 한 원형을 각각 받는다.
@evidence obligations/design/instances.md#instance-identity-transform neighbor.east/west/north는 좌표나 생성 순서와 무관한 역할 ID이며 단위 배율이다.
@evidence obligations/design/instances.md#instance-variation-tiers 배경 외피 한 tier만 쓰고 카메라 거리별 교체나 이웃 방을 만들지 않는다.
@evidence obligations/design/instances.md#instance-placement-review 도로 경계와 회전 포락을 대조하고 실제 외부 시선에서 포치와 박공의 읽힘을 검사한다.
@evidence models/landscape.md#neighbor-house gable의 8.6×6.6m와 shed의 6.6×7.6m 지붕 포락을 회전한 뒤 구역과 대조한다.
@evidence spaces/site.md#placement-zones 동서 외피는 X=±16.3m 바깥, 북 외피는 Z=−16.05m 바깥의 허용 구역 안에 둔다.
@evidence spaces/site.md#site-grade 외피 바닥 Y는 각 중심 Z의 단일 site grade 함수에서 읽는다.
@evidence spaces/site.md#site-paving 세 외피의 전체 포락을 골목·정면 거리·진입 포장 밖에 둔다.
@evidence spaces/site.md#site-extent 세 개체는 모두 temple-site 아래이며 신전의 외곽 안에 들어가지 않는다.
@evidence settings/40-environment.md#neighborhood 신전보다 낮은 세 기와·회벽 외피가 길 건너의 입체 배경을 이룬다.
@evidence settings/40-environment.md#site 이웃의 지붕 포락까지 국소 직사각형 안에 들어가고 먼 배경 영역으로 퍼지지 않는다.
@evidence materials/00-surface-palette.md#plaster 외피 벽과 닫힌 개구부 뒤판은 같은 따뜻한 회벽을 유지한다.
@evidence materials/00-surface-palette.md#roof-tile 이웃의 단순 지붕 표면은 기와 재료를 쓰되 주인공의 실제 반복 기와와 형상 수준을 혼동하지 않는다.
@evidence materials/00-surface-palette.md#stone 이웃의 낮은 plinth만 석재로 결속한다.
@evidence materials/10-model-bindings.md#binding-map 이웃 wall/recess·roof·plinth의 세 재료 군을 원래 part 구별대로 유지한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 세 회전 지붕 포락이 기존 구역 안에 들어가므로 구역 확장이나 원형 축척 변경이 필요하지 않다.
-->

| 역할 | 원형 | 중심 X/Z(m) | Y | Y축 회전 |
| --- | --- | --- | --- | --- |
| neighbor.east | gable | 23 / −8 | 0 | −90° |
| neighbor.west | gable | −24 / −7 | siteGrade(−7) | +90° |
| neighbor.north | shed | 8 / −26 | 0 | 0° |

동서 외피의 정면은 신전을 바라본다. 북 외피는 남쪽을 바라본다. gable 최고점은 약 4.73m, shed 최고점은 약 5.95m로 주인공 제실의 약 7.67m 용마루보다 낮다. 세 외피의 전체 바닥은 Z=−2.45m보다 북쪽인 Y=0 평탄부에 놓여 경사 지면 위의 틈을 만들지 않는다. 모델의 지붕 돌출을 포함해 구역 안에 남고 외부 조감·포치 정면을 막지 않아야 한다.

## 두 종류 수관 {#trees}

<!--
@evidence principles/core/common.md#declared-basis cypress·broad-tree의 원형 포락과 이웃 구역을 입력으로 삼고 북서·북동·서측·동측 네 식재 역할을 정한다.
@evidence principles/core/common.md#scope-preservation 좁은 수관 둘과 넓은 수관 둘을 국소 대지에 두고 석재 중정과 모든 문 접근을 비운다.
@evidence principles/core/common.md#substantive-completion 네 뿌리 좌표·지면 높이·단위 배율을 지정하며 줄기와 수관 빈틈이 실제 시점에서 남는지 검사한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 모델의 수관 형태와 spaces의 허용 구역에 네 개체의 수·좌표를 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 좁은 나무 둘과 넓은 나무 둘은 기존 원형을 그대로 재사용하며 새 수종이나 중정 식재를 추가하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 뿌리 Y는 각 Z의 site grade이고 수관의 전체 가로 포락이 이웃 구역 안에 남는다.
@evidence principles/design/instances.md#instance-verification-address exterior.setting과 네 외부 입면에서 줄기 접촉·문과 박공 비가림을 확인한다.
@evidence obligations/design/instances.md#addressable-instance-decisions 네 식재 역할과 좌표를 이 H2가 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership cypress.west/east와 broad.west/east가 각 원형 두 개체의 유일한 membership이다.
@evidence obligations/design/instances.md#instance-identity-transform 네 역할 ID와 항등 회전·단위 배율을 쓴다.
@evidence obligations/design/instances.md#instance-variation-tiers 수관 원형을 거리로 교체하지 않고 같은 단일 tier로 둔다.
@evidence obligations/design/instances.md#instance-placement-review 각 뿌리와 실제 수관 가장자리를 외부 조감에서 구역에 대조하고 낮은 시점에서 신전 가림을 본다.
@evidence models/landscape.md#cypress 두 1.5m 폭·9m 높이 원형을 북쪽 양옆에 두어 높은 수관이 중앙 박공을 가리지 않는다.
@evidence models/landscape.md#broad-tree 4.4m 폭의 두 넓은 수관을 동서 이웃 구역에 두어 골목과 포치 접근에서 물린다.
@evidence spaces/site.md#placement-zones 네 수관은 허용된 이웃/나무 구역만 점유한다.
@evidence settings/40-environment.md#vegetation 줄기·가지와 수관의 빈틈을 보존하고 중정 분수 중심에 나무를 심지 않는다.
@evidence materials/00-surface-palette.md#foliage 네 나무의 crown은 같은 회녹색 foliage 재료로 결속한다.
@evidence materials/00-surface-palette.md#timber trunk와 branch는 목재 군으로 crown과 구별한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 네 원형의 가로 포락과 문 접근을 기존 구역으로 수용하므로 수관이나 구역을 늘리지 않는다.
-->

cypress.west/east의 X/Z는 (−18,−18)/(18,−20)m, broad.west/east는 (−27,9)/(27,9)m다. 각 뿌리는 siteGrade(Z)에 붙고 회전은 0°, 배율은 1이다. 좁은 수관과 넓은 수관을 각각 두 개체로 유지한다. 나무 사이와 수관 내부의 빈틈, 줄기 접촉, 신전의 외곽·박공·포치 읽힘이 검토 대상이다.

## 벽 밑 풀 {#grass}

<!--
@evidence principles/core/common.md#declared-basis 벽 바깥면 0.6m 안의 흙띠와 grass-tuft의 0.35m 포락에서 여섯 작은 뿌리 위치를 고른다.
@evidence principles/core/common.md#scope-preservation 서측 둘·동측 하나·북측 둘·남측 하나만 놓고 포장·경계석·두 접근 양옆을 비운다.
@evidence principles/core/common.md#substantive-completion 여섯 역할과 좌표·grade 접촉을 정해 임의 밀도나 난수 분포 없이 같은 식생 점유를 재현한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 풀 허용 띠에서 실제 여섯 뿌리와 성긴 분포를 선택한다.
@evidence principles/design/instances.md#instance-prototype-boundary 여섯 개체는 동일한 열두 잎 grass-tuft 원형이며 개별 형상이나 식재 영역을 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 벽에서 0.30m 떨어진 뿌리와 site grade를 사용해 0.175m 반폭까지 흙띠에 남긴다.
@evidence principles/design/instances.md#instance-verification-address 정문 진입·서비스 문 앞과 네 외벽 하단에서 포장 비점유와 접촉을 검사한다.
@evidence obligations/design/instances.md#addressable-instance-decisions 성긴 여섯 풀의 ID와 위치는 이 H2가 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership west.back/front·east.front·north.west/east·south.west가 전체 여섯 membership이다.
@evidence obligations/design/instances.md#instance-identity-transform 역할별 grass ID와 항등 회전·단위 배율을 사용한다.
@evidence obligations/design/instances.md#instance-variation-tiers 밀도나 계절 tier 없이 열두 잎 원형 한 종류만 둔다.
@evidence obligations/design/instances.md#instance-placement-review 실제 풀의 포락을 벽·흙띠·포장 및 접근 여유와 대조하고 뿌리가 떠 있지 않은지 본다.
@evidence models/landscape.md#grass-tuft 0.35m 포락의 실제 열두 잎 원형을 여섯 곳에 둔다.
@evidence spaces/site.md#placement-zones 벽 밑 풀 띠와 접근 양옆 0.5m 금지를 유지한다.
@evidence settings/40-environment.md#vegetation 소량 풀만 벽 밑에 두고 건물이나 문을 가리는 덩어리를 만들지 않는다.
@evidence materials/00-surface-palette.md#foliage 풀의 blade는 나무 crown과 같은 foliage 군으로 결속된다.
@evidence materials/00-surface-palette.md#earth 여섯 뿌리의 아래는 그대로 site.earth 표면이며 풀 때문에 지면 재료를 바꾸지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 0.35m 풀 포락은 기존 0.6m 띠와 접근 금지 폭에 들어가므로 흙띠나 풀 크기를 바꿀 필요가 없다.
-->

X/Z(m)는 west.back (−10.8,−8), west.front (−10.8,7), east.front (10.8,5), north.west (−8,−10.55), north.east (8,−10.55), south.west (−8,10.55)다. Y는 모두 siteGrade(Z)이며 회전 0°, 배율 1이다. 열두 잎의 작은 원형 여섯 개체만 성기게 배치한다. 문 앞 포장과 정문 X=±1.65m 진입 띠는 완전히 비운다.
