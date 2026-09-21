# 대지 안 접근의 접속 책임

## 외부 네트워크에 넘길 포장 끝 {#site-access-interface}

`house-site`는 [본채와 차고](../00-building.md#main-building-extent), 포치와 아래의 외부 접근 구역을 포함할 site다. 건물에 딸린 보행길·차도·테라스는 [ground-storey](../01-storeys.md#storey-datums)의 외부 구역으로도 바인딩한다. 실내 방이나 별도 층을 추가하지 않는다. 좌표는 [공통 기준](../../settings/00-production.md#coordinate-units)을 사용한다. `src/spaces/site.ts`는 이 containment와 접속의 조립 owner이며 포장·지형을 직접 중복 생성하지 않는다.

이 초안은 전면 포장의 바깥 끝을 Z = 6.50 m에 둔다. 이 선은 spaces가 요구하는 포장 끝이며 필지 경계나 공공 보도 선의 선언이 아니다. 같은 선 위 [현관 보행길](front-walk.md#front-walk-plan)의 끝과 [차고 차도](driveway.md#driveway-plan)의 끝은 모두 기존 [앞 보행길 datum](../01-storeys.md#ground-threshold-datums)에 닿는다. maps는 실제 필지 경계와 보도·연석·도로, 하나의 이름 있는 `house-site-access` node를 소유하고 이 두 접속 단면을 그 node의 보행/차도 포트로 받아야 한다. 별개의 두 외부 네트워크를 발명하지 않는다.

현재 maps는 disabled이며 채택된 경계/node가 없다. 따라서 house-site의 세계 경계와 이 두 포트의 외부 연결은 미완료이고, 아래 내부 경로를 외부 도로까지 이어진 것으로 보고하지 않는다. maps 초안의 후보와 근거는 선행 조사에만 있으며 확정된 map geometry를 이 문서에 복사하지 않는다. 상위 boundary가 채택되면 포장 끝·좌표 변환·높이·폭을 양쪽에서 대조하고 불일치는 해당 설계 owner에서 고친다. 실제 map/space binding은 unverified다.

## 포장과 계단의 내부 연결 {#site-local-routes}

현관 경로는 front-walk → front-porch의 아래 대기 → 외부 세 단 → 포치 → front-door → front-entry다. 차도에서 현관으로 걸어올 때는 driveway → front-walk의 가로 연결로 → 같은 포치 경로를 쓴다. 차고의 실내 진입은 기존 [머드룸 연결](../rooms/laundry.md#laundry-plan)이며 외부 차고문은 기본 닫힘을 유지한다. 차고문 작동 검사를 할 때만 열린 상태의 차도/차고 문턱 접속을 관찰한다. 자동차나 차량 주행 과제를 추가하지 않는다.

후면 경로는 kitchen-dining-family → [garden-door](../envelope/rear.md#garden-door) → garden-terrace의 대기 → 중앙 보행 띠 → 테라스 외부 단 → garden-lower-landing이다. 아래 대기의 바깥 끝은 [측면 관리길](side-walk.md#side-walk-plan)을 통해 차도로 이어진다. 그 길의 앞뒤 구역과 [울타리 문](side-walk.md#side-gate-interface)은 별도 내부 연결이며 외부 node를 늘리지 않는다. [울타리 선](fence.md#fence-enclosure-plan)은 건물/관리길에서 도출하지만 실제 정원 지표·필지 포함·폐합은 maps 입력과 함께 남은 항목이다. 잔디를 통과할 수 있다는 말로 열린 연결을 대신하지 않는다.

maps에 넘기는 포장 접속은 기존 전면 두 포트 외에 측면 관리길의 전체 외곽·식재 제외 여유와 아래 [지표 접합 입력](#map-handoff-inputs)이다. 높은 테라스 상면과 낮은 아래 대기를 모두 잔디에 수평 접속하는 것으로 취급하지 않는다. 이는 필지 형상이나 울타리 선을 대신 확정하는 값이 아니다. [전체 표면 인계](../03-surface-owners.md#exterior-surface-handoff)는 관리길과 목재 울타리의 파일 책임을 미리 배정하고 실제 세계 경계·지표·식재 census는 미완료로 둔다.

각 경로는 [사용 점유체](../../settings/00-production.md#use-profile)와 바구니 폭을 소비한다. 보행면의 단면과 위에서 돌아 내려오는 시야, 문짝 개방 및 후속 가구/식재 점유를 포함한 양방향 통행을 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 추가한다. 외부 구역도 threshold·각 코너·중심 방향의 질문을 부담하고 T자 보행길의 오목한 접점에는 질문을 더한다. 설계 경로는 compiled topology나 관찰 수를 대신하지 않으며 실제 통행·표면 연결은 unverified다.

## 지도에서 받아야 할 경계와 지표 입력 {#map-handoff-inputs}

이 H2는 `house-site`가 maps로부터 받아야 할 입력과 거부할 불일치를 소유한다. 실제 필지·외부 네트워크·지형은 maps owner의 답이며, 아래 요구만으로 maps가 채택되거나 연결된 것은 아니다. 좌표·높이의 원본은 링크한 spaces/settings owner에 유지하고 지표에 맞추기 위해 건물이나 계단을 뷰어에서 따로 이동하지 않는다.

| 받을 입력 | 소비하는 spaces 값과 접속 조건 |
| --- | --- |
| 세계 좌표와 site 배치 | [공통 좌표](../../settings/00-production.md#coordinate-units)와 원점·축·단위·높이 datum이 일치하는 변환을 받는다. 이 집은 그 공통 좌표에 직접 저작하므로 site 변환은 항등으로 요구한다. 렌더 카메라 이동은 site 변환을 바꾸지 않는다. |
| 닫힌 필지 경계 | [본채/차고](../00-building.md#main-building-extent), 포치·굴뚝·처마의 실제 외곽과 네 포장 owner의 윤곽 및 식재 제외 여유, [울타리 전체 선과 최대 점유](fence.md#fence-ground-profile)를 모두 수용해야 한다. 지붕 투영선과 지면을 점유하는 기초선은 구별한다. 경계가 예약을 자르면 원래 maps 또는 spaces owner에서 고치며 잘린 면을 숨기지 않는다. |
| 하나의 외부 접근 node와 두 포트 | 위 [전면 포장 끝](#site-access-interface)의 front-walk/driveway 전체 끝선을 받는다. 폭은 각 포장 owner의 X 구간, 높이는 그 끝선의 상면, 접속 방향은 +Z다. 중심점 하나가 같다는 이유로 연결을 인정하지 않는다. 외부 보도는 두 끝선 전체와 턱 없이 만나고 차도 포트가 가로지르는 보행 구간도 연속되어야 한다. |
| 낮은 보행면의 지표 접합 | [현관 보행길](front-walk.md#front-walk-plan), [차도](driveway.md#driveway-plan), [측면 관리길](side-walk.md#side-walk-plan)의 노출 가장자리별 높이식을 소비한다. 가로 연결로는 횡방향 보간까지 포함한다. [아래 대기](terrace.md#garden-lower-landing-plan)의 양옆은 그 상면에서 지표와 이어지고 뒤끝은 이미 관리길이 받으므로 두 번째 지형 면을 넣지 않는다. |
| 높은 테라스와 건물의 접지 | [테라스와 세 단](terrace.md#garden-steps-plan)은 상하 높이 차를 유지한다. 지표를 테라스 상면까지 끌어올려 챌판이나 옆면을 지우지 않는다. 테라스·기초·굴뚝의 수직 옆면에 닿는 지표 접촉선을 받아 후속 지지/마감 부재가 닫는다. 해당 부재가 없는 현재 상태에서는 접지 완료를 주장하지 않는다. |
| 식재와 울타리의 경계 입력 | 포장 여유와 [gate 앞뒤 대기/회전](side-walk.md#side-gate-interface), 출입·창·처마 앞의 점유를 식재 배치 제외 조건으로 넘긴다. 필지/지표를 받은 뒤 울타리 owner가 [전체 선](fence.md#fence-enclosure-plan)의 포함과 [문기둥/벽 접점](fence.md#fence-gate-junction)을 확인한다. 현재 gate만으로 필지나 정원이 닫혔다고 세지 않는다. |

지표의 노출 면은 포장 상면과 겹치지 않고, 기초·포장 지지체 아래의 접지와 수직 옆면은 실제 단면으로 닫아야 한다. 처마 투영 영역 전체를 지형에서 빼면 포치/처마 아래 지면이 사라지므로 그 투영선을 지표 삭제 윤곽으로 쓰지 않는다. 후속 지형 owner는 각 접촉선의 높이와 상대 owner를 받아야 하며, 포장 두께나 지지체 형상을 이 인터페이스에서 새로 발명하지 않는다.

인계 검사에는 필지 포함 평면, 두 포트의 전체 단면, 차도 양옆과 두 경사 연결로의 접합, 테라스 상면·챌판·아래 대기·지표를 함께 지나는 단면을 추가한다. 허용 오차는 [공유 기준](../01-storeys.md#storey-datums)을 소비한다. 실제 source가 생기면 같은 산출물의 world/site/space 식별자·변환·경계·접촉을 읽고 [전체 관찰](../04-observations.md#spatial-observation-derivation)에서 양방향 시야를 확인한다. 입력 표의 행 수는 surface나 observation 개수가 아니며 현재 포함·접지·연결·식재 간섭은 unverified다.
