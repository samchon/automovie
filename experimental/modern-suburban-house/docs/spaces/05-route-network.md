# 방 경계와 연결의 소스 인계

## 문으로 답하는 두 층 동선 {#room-route-network}
<!--
@evidence principles/core/common.md#scope-preservation 외부 포장부터 상층 옷방까지의 모든 출발-경계-도착, 수납의 경로 제외, 도달·귀환 검사, 인접성과 통행의 구별, maps 이후의 외부 시작점을 맡는다.
@evidence principles/core/common.md#substantive-completion 방별 문 또는 열린 접속의 owner와 도착 storey를 한 연결 표로 정하고 계단을 front-entry 하부 대기에서 upper-hall 도착면으로 가는 단일 connector로 넣는다.
@evidence principles/core/common.md#declared-basis 표의 이름은 소스로 넘길 식별자이며 compiled id·개수·binding이 아니고 문 좌표는 링크한 방 owner가 결정한다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 고정 그래프를 builtEnvironmentAdjacentSpaces의 경계 인접성과 분리해 통행용 문·열린 접속·connector만 사람 경로 edge로 세는 규칙을 더한다.
@evidence principles/design/spaces.md#space-topology 팬트리·파우더룸·침실을 통과하지 않고 공용실·차고·두 욕실에 닿아야 하며 차고에는 laundry-garage-door로만 들어간다.
@evidence principles/design/spaces.md#space-boundary-authority 표는 방 owner의 좌표를 복사하지 않고 연결 순서만 인계하며 층간 연결은 main-stair, 두 층은 storey owner가 소유한다.
@evidence principles/design/spaces.md#space-verification-address 현관에서 각 목적지까지 갔다 같은 경계 순서로 돌아오는 경로를 검사하고 거친 개구부 좌표와 문틀/문짝 뒤 통행을 다른 검사로 둔다.
@evidence settings/10-house.md#service-band 서비스에서 세 실로 분기하고 차고에는 머드룸을 거쳐 직접 연결한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entry의 직접 분배, service-band의 세 실 분기와 머드룸-차고 연결, upper-hall의 세 침실·두 욕실·수납 직접 접근을 표의 개구부 owner에 대조했고 모두 문이나 열린 접속으로 이어져 부모 그래프 변경이 없었다.
@evidence obligations/design/spaces.md#space-reference-topology 외부 포장부터 상층 옷방까지 모든 공간의 출발-경계/개구부-도착과 storey를 한 표로 이어 이름 없는 경계를 건너는 연결이 없게 한다.
@evidence obligations/design/spaces.md#space-access-circulation 현관에서 각 목적지까지 갔다 돌아오는 경로와 팬트리/파우더룸/침실 비통과, 창·벽만 공유하는 인접성을 통행 edge에서 제외하는 규칙을 배정한다.
-->

아래 이름은 이 spaces 문서가 소스로 넘길 식별자다. 컴파일된 id·개수·binding으로 보고하지 않는다. 본채와 차고는 [외곽](00-building.md#main-building-extent), 두 층은 [storey](01-storeys.md#storey-datums), 유일한 층간 연결은 [main-stair](02-stair.md#stair-reservation)가 소유한다. 방의 마감 안쪽 경계·입구·예약 사용 공간은 각각 링크한 owner가 결정한다. 표는 그 값을 복사하지 않고 연결 순서를 인계한다.

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
| driveway | [경사 보간 앞 연결로](site/side-walk.md#side-walk-plan) | side-front-access, ground-storey 외부 |
| side-front-access | [side-yard-gate](site/side-walk.md#side-gate-interface), 개방 검사 상태 | side-rear-access, ground-storey 외부 |
| side-rear-access | [뒤쪽 가로 길과 아래 대기의 끝선](site/side-walk.md#side-walk-plan) | garden-lower-landing, ground-storey 외부 |
| front-entry 하부 대기 | [main-stair 두 flight와 중간참을 묶는 단일 연결](02-stair.md#stair-connector-handoff) | [upper-hall 도착면](rooms/upper-hall.md#upper-hall-plan), upper-storey |
| upper-hall | [hall-bedroom-two-door](rooms/bedroom-two.md#bedroom-two-plan) | bedroom-two, upper-storey |
| upper-hall | [hall-bedroom-three-door](rooms/bedroom-three.md#bedroom-three-plan) | bedroom-three, upper-storey |
| upper-hall | [hall-primary-door](rooms/primary.md#primary-plan) | primary-bedroom, upper-storey |
| upper-hall | [hall-shower-door](rooms/shower-bath.md#shower-bath-plan) | shower-bathroom, upper-storey |
| upper-hall | [hall-tub-door](rooms/tub-bath.md#tub-bath-plan) | tub-bathroom, upper-storey |
| primary-bedroom | [primary-wardrobe-door](rooms/wardrobe.md#primary-wardrobe-plan) | primary-wardrobe, upper-storey |

복도 린넨과 현관 외투장은 각 소비 공간의 실제 opening과 내부 깊이를 갖는 수납이며, 방 경로 edge로 세지 않는다. 포치 바닥·세 챌판·아래 대기 입력은 위 포치 owner가 소유하고 아래 대기 표면은 연속 보행길이 소비한다. [외부 창/문 인계](06-openings.md#external-opening-interface)와 [대지 내부 접근](site/00-access.md#site-local-routes), 측면 관리길의 앞뒤 연결을 예약했으나 실제 부재·maps의 보도/도로와 지표 binding·울타리 전체 경계는 미완료다. 원점 재검토에서 폐기된 이전 topology나 그 관찰 개수를 다시 쓰지 않는다.

필요한 검사는 현관에서 표의 각 목적지까지 도달하고 같은 경계 순서로 돌아오는 경로다. 팬트리/파우더룸/침실을 통과하지 않고 공용실과 차고·두 욕실에 닿아야 한다. 거친 개구부의 좌표가 벽 안에 있다는 사실과 실제 문틀/문짝 뒤의 통행은 서로 다른 검사다. 표의 방 하나라도 실제 storey·boundary·opening·connector를 갖지 않으면 소스 인계는 미완료다. 현재 topology 보고와 양방향 통행은 unverified다.

`builtEnvironmentAdjacentSpaces`는 같은 boundary의 반대쪽 공간을 개구부 유무와 관계없이 반환한다. 그 목록을 그대로 사람의 도달 그래프로 쓰면 막힌 칸막이나 층판을 통과한 것으로 오판한다. 위 표의 사람 경로는 통행용 문/열린 접속의 실제 boundary·void와 해당 조작 상태, 또는 저작된 connector에 근거해야 한다. 창·벽·천장만 공유하는 인접성은 통행 edge가 아니다. 문을 조작해 갈 수 있는 연결과 문이 닫힌 현재 상태에서 즉시 통과할 수 있는 연결도 구별한다. connector의 중간 landing은 실제 참의 공간으로 읽고, `main-stair`는 [동일 계단 연결](02-stair.md#stair-connector-handoff)의 중간 stop으로 현관과 상층 복도 양쪽에서 닿는다. 이 인계는 기존 공간/문/층을 추가하지 않으며 실제 도달 여부는 compiled 부재와 상태가 생긴 뒤에만 판정한다.

이 표의 외부 시작점은 아직 house-site 안 포장이다. [map 입력 인계](site/00-access.md#map-handoff-inputs)가 실제 외부 보도와 한 node의 두 포트를 결합하면 그 보도에서 시작하는 접근/복귀를 같은 경로 앞에 붙인다. 포트의 중심점만 이어 붙이거나 관리길을 세 번째 도로 포트로 취급하지 않는다. 필지/지표가 없는 현재 표만으로 도로에서 각 방까지 도달했다고 보고하지 않는다.

[현관의 분배 바닥](rooms/entry.md#entry-use-routes)에서 계단·거실·서비스로 직접 분기한다. 거실은 [좌석 밖의 앞뒤 경로](rooms/living.md#living-through-route)로 주방에 이어지고, 서비스에서는 [외투 수납](rooms/entry.md#entry-coat-storage)을 쓰고 같은 길로 돌아온다. 위 표의 방/개구부 연결은 그대로이며, 문 조작·좌석·수납 사용의 순차 상태를 통행 상태와 구별한다.

후면 공용부 안의 [주 경로와 주방 접근](rooms/common.md#common-clear-routes)은 같은 room 내부의 통행이다. 주방·식사·가족실에 별도 문이나 복도 edge를 추가하지 않는다. 서비스 진입에서 정원문으로 갈 때는 가구 사용 점유를 돌아가는 주 경로를 소비하고, 거실 쪽 주방 진입과 열린 기기 앞 작업은 별도 상태로 검사한다. 식품 운반은 기존 팬트리 → 서비스 접근 → 공용부 경로를 유지한다.

서비스 접근 → [머드룸 횡단](rooms/laundry.md#laundry-through-route) → 차고 하부 대기 → [차고 내부](rooms/garage-interior.md#garage-use-routes)는 두 세탁 기기 앞 작업과 함께 검사한다. 같은 서비스 접근에서 [파우더룸 기구](rooms/powder.md#powder-fixture-use)로 분기하며 그 방을 차고의 통과실로 쓰지 않는다. 방 사이 edge는 위 표 그대로이고 새 H2들은 그 내부에서 문/설비를 사용하는 순서와 점유의 owner다.

서비스 접근 → [팬트리 사용 통로](rooms/pantry.md#pantry-use-route) → [선반 식품](rooms/pantry.md#pantry-storage-use)의 경로는 같은 문으로 돌아와 서비스 뒤쪽 개구부와 공용부 주방으로 이어진다. 팬트리 뒤벽을 통과하는 새 edge는 없다. 문 조작과 꺼내기/회전 상태를 따로 검사하고, 서비스 통로에 내려둔 물건을 지운 채 통행을 판정하지 않는다.

상층의 내부 사용 경로는 [주침실](rooms/primary.md#primary-furniture-use)·[올리브 침실](rooms/bedroom-two.md#bedroom-two-furniture-use)·[청회색 침실](rooms/bedroom-three.md#bedroom-three-furniture-use)·[샤워 욕실](rooms/shower-bath.md#shower-fixture-use)·[욕조 욕실](rooms/tub-bath.md#tub-fixture-use)이 자기 문에서 가구/기구까지 소유한다. 옷방은 계속 주침실에만 연결되며 두 욕실은 복도에서 직접 접근한다. 의자·열린 수납·문 조작을 생략해서 위 방 연결 표의 통행을 합격으로 바꾸지 않는다.

표면 source 분배는 [완결 표면 소유](03-surface-owners.md#interior-surface-handoff)를 소비하고, 방이 실제로 만들어지면 [전체 관찰 파생](04-observations.md#spatial-observation-derivation)에 모두 들어간다. L형 현관·서비스·복도·주침실과 린넨에 의해 파인 청회색 침실의 숨는 코너는 기본 네 모서리 외에 질문을 더한다. 표를 고정 관찰 개수나 대표 view 선택표로 사용하지 않는다.
