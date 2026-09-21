# 방 경계와 연결의 소스 인계

## 문으로 답하는 두 층 동선 {#room-route-network}

아래 이름은 이번 spaces draft에서 소스로 넘길 식별자다. 컴파일된 id·개수·binding으로 보고하지 않는다. 본채와 차고는 [외곽](00-building.md#main-building-extent), 두 층은 [storey](01-storeys.md#storey-datums), 유일한 층간 연결은 [main-stair](02-stair.md#stair-reservation)가 소유한다. 방의 마감 안쪽 경계·입구·예약 사용 공간은 각각 링크한 owner가 결정한다. 표는 그 값을 복사하지 않고 연결 순서를 인계한다.

| 출발 | 설계 경계/개구부 owner | 도착 및 storey |
| --- | --- | --- |
| front-walk | [포치 아래 대기를 포함한 보행면](site/front-walk.md#front-walk-plan) → [외부 세 단](porch.md#porch-platform-access) | front-porch, ground-storey 외부 |
| driveway | [가로 연결로](site/front-walk.md#front-walk-plan) | front-walk, ground-storey 외부 |
| driveway | [garage-front-door](envelope/front.md#garage-front-opening), 개방 검사 상태 | garage, ground-storey |
| [front-porch](porch.md#porch-platform-access) | [front-door](rooms/entry.md#entry-plan) | front-entry, ground-storey |
| front-entry | [entry-living-door](rooms/living.md#living-plan) | living-room, ground-storey |
| front-entry | [오른쪽 열린 접속](rooms/service.md#service-access-plan) | service-access, ground-storey |
| living-room | [living-common-opening](rooms/common.md#common-room-plan) | kitchen-dining-family, ground-storey |
| service-access | [service-common-opening](rooms/common.md#common-room-plan) | kitchen-dining-family, ground-storey |
| service-access | [service-powder-door](rooms/powder.md#powder-plan) | powder-room, ground-storey |
| service-access | [service-laundry-door](rooms/laundry.md#laundry-plan) | laundry-mudroom, ground-storey |
| service-access | [service-pantry-door](rooms/pantry.md#pantry-plan) | pantry, ground-storey |
| laundry-mudroom | [laundry-garage-door](rooms/laundry.md#laundry-plan) | [garage](rooms/garage-interior.md#garage-interior-plan), ground-storey |
| kitchen-dining-family | [garden-door와 안팎 대기](envelope/rear.md#garden-door) | [garden-terrace](site/terrace.md#garden-terrace-plan), ground-storey 외부 |
| garden-terrace | [중앙 경로와 외부 단](site/terrace.md#garden-steps-plan) | [garden-lower-landing](site/terrace.md#garden-lower-landing-plan), ground-storey 외부 |
| front-entry 하부 대기 | [main-stair 두 flight와 중간참](02-stair.md#stair-reservation) | [upper-hall 도착면](rooms/upper-hall.md#upper-hall-plan), upper-storey |
| upper-hall | [hall-bedroom-two-door](rooms/bedroom-two.md#bedroom-two-plan) | bedroom-two, upper-storey |
| upper-hall | [hall-bedroom-three-door](rooms/bedroom-three.md#bedroom-three-plan) | bedroom-three, upper-storey |
| upper-hall | [hall-primary-door](rooms/primary.md#primary-plan) | primary-bedroom, upper-storey |
| upper-hall | [hall-shower-door](rooms/shower-bath.md#shower-bath-plan) | shower-bathroom, upper-storey |
| upper-hall | [hall-tub-door](rooms/tub-bath.md#tub-bath-plan) | tub-bathroom, upper-storey |
| primary-bedroom | [primary-wardrobe-door](rooms/wardrobe.md#primary-wardrobe-plan) | primary-wardrobe, upper-storey |

복도 린넨과 현관 외투장은 각 소비 공간의 실제 opening과 내부 깊이를 갖는 수납이며, 방 경로 edge로 세지 않는다. 포치 바닥·세 챌판·아래 대기 입력은 위 포치 owner가 소유하고 아래 대기 표면은 연속 보행길이 소비한다. [외부 창/문 인계](06-openings.md#external-opening-interface)와 [대지 내부 접근](site/00-access.md#site-local-routes)을 연결했으나 실제 부재·maps의 보도/도로와 지표 binding·측면 관리 경로는 미완료다. 원점 재검토에서 폐기된 이전 topology나 그 관찰 개수를 다시 쓰지 않는다.

필요한 검사는 현관에서 표의 각 목적지까지 도달하고 같은 경계 순서로 돌아오는 경로다. 팬트리/파우더룸/침실을 통과하지 않고 공용실과 차고·두 욕실에 닿아야 한다. 거친 개구부의 좌표가 벽 안에 있다는 사실과 실제 문틀/문짝 뒤의 통행은 서로 다른 검사다. 표의 방 하나라도 실제 storey·boundary·opening·connector를 갖지 않으면 소스 인계는 미완료다. 현재 topology 보고와 양방향 통행은 unverified다.

후면 공용부 안의 [주 경로와 주방 접근](rooms/common.md#common-clear-routes)은 같은 room 내부의 통행이다. 주방·식사·가족실에 별도 문이나 복도 edge를 추가하지 않는다. 서비스 진입에서 정원문으로 갈 때는 가구 사용 점유를 돌아가는 주 경로를 소비하고, 거실 쪽 주방 진입과 열린 기기 앞 작업은 별도 상태로 검사한다. 식품 운반은 기존 팬트리 → 서비스 접근 → 공용부 경로를 유지한다.

표면 source 분배는 [완결 표면 소유](03-surface-owners.md#interior-surface-handoff)를 소비하고, 방이 실제로 만들어지면 [전체 관찰 파생](04-observations.md#spatial-observation-derivation)에 모두 들어간다. L형 현관·서비스·복도·주침실과 린넨에 의해 파인 청회색 침실의 숨는 코너는 기본 네 모서리 외에 질문을 더한다. 표를 고정 관찰 개수나 대표 view 선택표로 사용하지 않는다.
