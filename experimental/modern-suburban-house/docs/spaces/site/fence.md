# 정원을 감싸는 목재 울타리

## 건물 두 끝에 닿는 울타리 선 {#fence-enclosure-plan}
<!--
@evidence principles/core/common.md#scope-preservation garden-fence의 네 중심선 L·R·B·F, 다섯 연속 구간, 꺾임 접합, 양 건물 끝 접점, 숨은 틈 금지와 owner를 맡는다.
@evidence principles/core/common.md#substantive-completion L을 굴뚝 덮개와 본채의 더 왼쪽 외곽에서 -X로 0.60 m, R을 세로 관리길 오른쪽 끝에서 +X로 0.35 m, B를 뒤 가로 길 바깥 끝에서 -Z로 0.35 m로 정한다.
@evidence principles/core/common.md#declared-basis 이 값은 울타리 중심선의 내부 배치 선택이며 필지 경계나 법정 이격 거리가 아니라고 밝히고 좌표는 coordinate-units에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지 설정의 우측 목재 울타리를 관리문과 함께 정원 뒤까지 이어지는 하나의 울타리 선으로 해석한다.
@evidence principles/design/spaces.md#space-topology 울타리 양 끝이 본채 왼쪽 벽과 차고 오른쪽 앞 모서리에 닿고 건물 외피가 나머지 정원 경계를 이어 앞마당을 횡단하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 울타리 내부 지표는 maps, 테라스·관리길은 각 spaces owner가 소유하고 울타리는 별도 바닥을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 전체 평면과 양쪽 벽 접점, 모든 꺾임의 안팎 시야로 폐합을 검사한다.
@evidence settings/10-house.md#site-identity 우측의 목재 울타리를 기존 관리문에서 정원 뒤까지 다섯 연속 구간으로 잇고 기존 건물 외피와 함께 정원 쪽 경계를 이루어 앞마당을 가로지르지 않게 한다.
@evidence obligations/design/spaces.md#space-access-circulation 정원의 닫힌 경계를 울타리와 건물 외피로 배정하고 관리문 외의 숨은 통행 틈을 남기지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 우측 목재 울타리와 maps 소유 경계를 대조했고 울타리 선을 건물·관리길에서 도출할 수 있어 부모 수정이 없었다.
-->

`garden-fence`는 `house-site`/`ground-storey`의 외부 경계다. [대지와 식재](../../settings/10-house.md#site-identity)의 우측 목재 울타리를 기존 [관리문](side-walk.md#side-gate-interface)과 함께 정원 뒤까지 이어지는 하나의 울타리로 해석한다. 집 안의 방이나 도로 접근 node를 추가하지 않는다. 울타리 내부의 지표는 maps, 기존 테라스·관리길은 각 spaces owner가 소유하며 울타리가 별도 바닥을 생성하지 않는다.

좌표는 [공통 world 기준](../../settings/00-production.md#coordinate-units)이다. 앞쪽 평면 F는 관리문 owner가 정한 Z, 왼쪽 선 L은 [굴뚝 덮개](../envelope/left.md#chimney-roof-interface)와 [본채](../00-building.md#main-building-extent)의 더 왼쪽 외곽에서 -X로 0.60 m, 오른쪽 선 R은 [세로 관리길](side-walk.md#side-walk-plan)의 오른쪽 끝에서 +X로 0.35 m, 뒤쪽 선 B는 같은 owner의 뒤 가로 길 바깥 끝에서 -Z로 0.35 m다. 이 값은 울타리 중심선의 내부 배치 선택이며 필지 경계 선언이나 법정 이격 거리가 아니다. maps의 실제 경계가 이 울타리 점유를 수용하는지는 [입력 인계](00-access.md#map-handoff-inputs)에서 확인해야 한다.

| 연속 구간 | 중심선의 시작과 끝 | 관계 |
| --- | --- | --- |
| 왼쪽 앞 닫힘 | (본채 왼쪽 바깥 X, F) → (L, F) | 창과 굴뚝을 뚫지 않는 본채 왼쪽 전면 벽에서 시작한다. 문은 두지 않는다. |
| 왼쪽 긴 면 | (L, F) → (L, B) | 굴뚝 옆과 집 뒤 정원을 지나간다. |
| 뒤쪽 긴 면 | (L, B) → (R, B) | 관리길 뒤쪽을 닫는다. |
| 오른쪽 긴 면 | (R, B) → (R, F) | 관리길 바깥 여유를 따라 전면으로 돌아온다. |
| 오른쪽 앞 닫힘 | (R, F) → (차고 오른쪽 바깥 X, F) | 아래 관리문 개구부를 제외하고 차고 외벽에 닿는다. |

위 꺾임은 공유 끝점 하나로 접합하며 겹친 모서리 기둥을 두지 않는다. 양 끝은 각각 본채 왼쪽 벽과 차고 오른쪽 앞 모서리에 닿는다. 기존 건물 외피가 정원 쪽 나머지 경계를 이으므로 앞마당 전체를 횡단하는 울타리를 덧붙이지 않는다. 현관·차도에서 정원으로 가는 외부 경로는 기존 관리문이며, 왼쪽 앞 구간 뒤로 사람이 지나갈 숨은 틈을 남기지 않는다. 패널 밑의 시공 간격은 통행 개구부로 세지 않는다.

완결 울타리의 양면·끝·모서리·문·기둥 owner는 `src/spaces/site/fence.ts`, 담당은 이 production의 단일 저작자다. 같은 선의 패널·반복 판재·마감은 후속 단계에서도 이 완결 면 책임을 유지한다. 이 문서는 source 예약이며 실제 길이·부재 수·닫힌 경계·필지 포함을 측정한 결과가 아니다. 전체 평면과 양쪽 벽 접점, 모든 꺾임의 안팎 시야를 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 추가하고 실제 폐합은 unverified로 둔다.

## 오른쪽 앞 면의 관리문 접속 {#fence-gate-junction}
<!--
@evidence principles/core/common.md#scope-preservation 관리문 개구부 비우기, 문기둥, 두 짧은 잔여 패널, 양 건물 접점의 끝기둥과 막음 부재, 닫힘/열림 검사를 맡는다.
@evidence principles/core/common.md#substantive-completion 문기둥 공간 예약 폭 0.12 m를 개구부 안쪽 경계 바깥에 두고 두 문기둥의 안쪽 면을 개구부 양 끝과 일치시킨다.
@evidence principles/core/common.md#declared-basis 문 평면·회전·문짝 위아래·손잡이 반경·대기·순폭은 side-gate-interface의 값을 그대로 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 울타리와 관리문의 관계를 패널 연속 생성 후 문짝을 붙이는 방식 대신 개구부를 비우는 접합으로 만든다.
@evidence principles/design/spaces.md#space-topology 오른쪽 앞 구간의 잔여 패널이 문기둥 바깥에서 차고 접점/오른쪽 모서리 기둥까지 닫는다.
@evidence principles/design/spaces.md#space-boundary-authority 끝기둥/기초 중심을 벽 위에 놓지 않고 외벽을 두 번째 기둥으로 두껍게 하지 않으며 창과 굴뚝을 지지체로 쓰지 않는다.
@evidence principles/design/spaces.md#space-verification-address 닫힌 문에서 패널/문짝 경계의 연속과 열린 문의 앞뒤 통행·대기·회전을 별도로 검사한다.
@evidence settings/10-house.md#site-identity 우측 목재 울타리가 관리문까지 실제로 닫히게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 "우측의 목재 울타리"를 관리문 개구부에 대조했고 문기둥과 두 잔여 패널로 울타리를 문까지 닫을 수 있어 부모 수정이 없었다.
-->

위 [오른쪽 앞 구간](#fence-enclosure-plan)에서 [side-yard-gate](side-walk.md#side-gate-interface)의 개구부 X 구간을 그대로 비운다. 문 평면·회전 방향·문짝 위아래·손잡이 반경·앞뒤 대기·최종 순폭은 그 owner의 값이며 여기서 재정의하지 않는다. 패널을 연속 생성한 뒤 문짝만 앞에 붙이는 방식은 이 개구부를 만들지 못한다.

문기둥의 공간 예약 폭은 0.12 m이며 개구부 안쪽 경계 바깥으로 놓는다. 왼쪽 문기둥의 안쪽 면은 개구부 왼쪽 끝, 오른쪽 문기둥의 안쪽 면은 오른쪽 끝과 일치한다. 오른쪽 앞 구간의 두 짧은 잔여 패널은 문기둥 바깥에서 각각 차고 접점/오른쪽 모서리 기둥까지 닫는다. 길이가 짧다는 이유로 잔여 구간을 삭제하지 않고, 기둥이 필요한 구간을 잠식하면 같은 owner에서 접합 부재를 고친다. 문기둥은 관리길 여유에 허용된 예외지만 문 유효폭을 차지할 권한은 없다. 기둥의 지상 받침도 개구부 X 구간 바깥에 두고, 기초가 포장 아래로 들어가는 부분은 완성 보행면 위로 솟지 않아야 한다.

양 건물 접점은 독립 끝기둥과 얇은 막음 부재로 벽 외피에 닿게 예약한다. 끝기둥/기초는 중심을 벽 위에 놓지 않고 벽 바깥으로 물려 전체 점유가 건물 바깥에 있도록 하며, 그 사이를 막음 부재가 닫는다. 외벽을 두 번째 기둥으로 두껍게 하거나 거친 벽 좌표만 맞춘 뒤 실제 사이딩 돌출과 틈을 남기지 않는다. 오른쪽은 차고 정면문 바깥의 코너이므로 패널·끝기둥을 차도나 차고 문설주 앞으로 연장하지 않는다. 왼쪽은 [측면 창과 굴뚝](../envelope/left.md#left-openings) 앞의 벽 접면이며 창 개구부나 굴뚝을 울타리 지지체로 쓰지 않는다.

기준 상태에서 문을 닫아 패널/문짝의 경계가 이어지는지, 문을 열어 [앞뒤 두 구역](side-walk.md#side-gate-interface)의 통행과 대기·회전이 유지되는지 별도로 검사한다. 양 잔여 구간·문기둥·벽 접점의 실제 부재와 접지, 걸쇠 조작·문 회전·바구니 순폭은 unverified다. 목재 판재 폭·반복 간격·연결 철물의 실제 형태는 후속 부재/모듈 저작에서 이 예약을 소비한다.

## 지표를 받는 높이와 점유 {#fence-ground-profile}
<!--
@evidence principles/core/common.md#scope-preservation 패널 상단과 아래끝의 높이 규칙, 문 앞뒤 접촉, 일반 기둥·패널·기초의 평면 점유, 식재와의 관계를 맡는다.
@evidence principles/core/common.md#substantive-completion 패널 상단을 관리문 문짝 상단과 같은 world 높이로, 아래끝을 g + 0.05 m로, 일반 기둥 0.12 m 정방형·패널 중심선 양쪽 0.05 m·기초 0.24 m 정방형으로 정한다.
@evidence principles/core/common.md#declared-basis g는 maps의 실제 지표 높이로 아직 없으며 일정 높이로 꾸며 넣지 않는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 목재 울타리를 지표를 따라가는 아래끝과 관리길 제외 여유를 침범하지 않는 기초 점유로 만든다.
@evidence principles/design/spaces.md#space-topology 문 앞뒤의 보행면과 문기둥 접촉을 관리길 상면 S와 맞추고 일반 기초는 포장에 침투하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 문짝 상단은 side-gate-interface, 제외 여유는 side-walk-plan에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 연속 지표 접촉선과 기둥/패널 아래의 그림자를 각 긴 면의 양쪽 시야와 높이가 달라지는 단면에서 검사한다.
@evidence settings/10-house.md#site-identity 우측 목재 울타리와 관목이 함께 놓여도 관목이 울타리 아래 틈을 가리지 않게 하고 지표 경사는 maps의 선택으로 받아 g로 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 울타리·관목·maps 소유 지표를 대조했고 g를 변수로 둔 높이 규칙으로 성립해 부모 수정이 없었다.
-->

울타리 패널 상단은 [관리문](side-walk.md#side-gate-interface)의 문짝 상단과 같은 world 높이로 예약한다. 울타리 중심선의 실제 maps 지표 높이를 g라 할 때 패널 아래끝은 g + 0.05 m를 따른다. 문 앞뒤의 보행면과 문기둥 접촉은 관리길 상면 S와 맞아야 한다. 지표가 아직 없으므로 g를 일정 높이로 꾸며 넣거나 패널 높이·접지를 완료했다고 보고하지 않는다. 실제 지표가 올라와 패널 상하가 역전되거나 필요한 통행을 막으면 지표/울타리의 해당 owner에서 해결한다.

문기둥을 제외한 일반 기둥은 중심선의 기둥 위치에서 평면 0.12 m 정방형, 패널과 연결 부재의 두께 점유는 중심선 양쪽 각각 0.05 m 안으로 예약한다. 받침/기초의 최대 평면 점유는 같은 기둥 위치 중심의 0.24 m 정방형이다. 이는 접합과 관리길의 제외 여유를 확인할 공간 예약이며 기초 깊이·내풍·구조 성능을 정한 값이 아니다. [관리길 바깥 제외 여유](side-walk.md#side-walk-plan)와 이 최대 점유가 겹치지 않아야 한다. 일반 기초는 포장에 침투하지 않고 문기둥만 기존 예외를 소비한다. 건물 끝기둥은 위 [벽 접점](#fence-gate-junction)의 후퇴를 먼저 적용한다.

관목·나무를 울타리 아래 틈이나 접점 결함을 가리는 용도로 배치하지 않는다. 식재 원형·수관과 울타리의 실제 점유는 후속 배치에서 대조하며 관리문 대기와 회전, 창·처마 앞 시야를 보존한다. 연속 지표 접촉선과 기둥/패널 아래의 그림자는 각 긴 면의 양쪽 시야 및 높이가 달라지는 단면에서 검사한다. 최종 순폭·지표/기초 간섭·모든 표면 census·01의 목재 경계 읽힘은 unverified다.
