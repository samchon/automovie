# 실내 공유 경계의 조립

## 방 사이의 한 벽체와 두 안쪽 면 {#interior-boundary-ownership}

이 설계는 [두 storey](01-storeys.md#storey-datums) 안에서 기존 방 사이의 칸막이를 한 번만 생성하기 위한 공간 인계다. 방의 마감 안쪽 윤곽, 칸막이 예약 두께, 문 위치는 [방 연결](05-route-network.md#room-route-network)이 가리키는 원래 owner를 소비한다. 여기서 방 좌표를 다시 정하거나 두 room의 중간선을 평균하여 서로 다른 입력을 숨기지 않는다. 같은 storey에서 맞닿는 두 실의 안쪽 경계와 그 사이 벽 예약이 일치하지 않으면 조립을 멈추고 원래 평면을 고친다.

아래 표의 구조 바탕 owner는 공유 칸막이의 공통 몸체·개구부 절단을 한 번만 생성한다. 양쪽에서 보이는 안쪽 마감과 reveal은 [각 방의 완결 면 owner](03-surface-owners.md#interior-surface-handoff)가 유지한다. 구조 바탕의 원형이나 표면이 마감과 동일한 위치에 겹치는 두 번째 불투명 판을 만들지 않는다. 담당 저작자는 모두 `/root`이며 표의 이름은 설계 연결의 이름이다. 실제 boundary id·개수는 소스에서 생성한 산출물을 읽는다.

| 층 | 맞닿는 실 또는 구간 | 공통 구조 바탕의 소스 owner |
| --- | --- | --- |
| ground-storey | living-room ↔ front-entry, living-room ↔ service-access의 계단 밖 구간 | `src/spaces/rooms/living.ts` |
| ground-storey | kitchen-dining-family ↔ living-room / service-access / pantry의 전면 칸막이 | `src/spaces/rooms/common.ts` |
| ground-storey | powder-room ↔ service-access / laundry-mudroom | `src/spaces/rooms/powder.ts` |
| ground-storey | laundry-mudroom ↔ service-access / pantry | `src/spaces/rooms/laundry.ts` |
| ground-storey | pantry ↔ service-access | `src/spaces/rooms/pantry.ts` |
| upper-storey | bedroom-two ↔ upper-hall | `src/spaces/rooms/bedroom-two.ts` |
| upper-storey | primary-bedroom ↔ bedroom-two / upper-hall | `src/spaces/rooms/primary.ts` |
| upper-storey | bedroom-three ↔ upper-hall의 문 있는 구간 | `src/spaces/rooms/bedroom-three.ts` |
| upper-storey | shower-bathroom ↔ upper-hall / primary-bedroom | `src/spaces/rooms/shower-bath.ts` |
| upper-storey | tub-bathroom ↔ upper-hall / bedroom-three / shower-bathroom | `src/spaces/rooms/tub-bath.ts` |
| upper-storey | primary-wardrobe ↔ primary-bedroom / shower-bathroom / tub-bathroom | `src/spaces/rooms/wardrobe.ts` |

각 행은 방 사이에 실제로 존재하는 구간에만 적용한다. 표의 슬래시로 묶인 상대끼리 새 벽을 만들지 않는다. [현관과 서비스의 열린 접속](rooms/service.md#service-access-plan)과 [계단 끝의 복도 도착](rooms/upper-hall.md#upper-hall-plan)은 벽 없는 연결로 유지한다. 거실/서비스와 공용부 사이에는 기존 상인방 아래의 큰 void가 있고, 나머지 전면 칸막이는 닫힌다. 연결 edge라는 이유로 벽 전체를 삭제하지 않는다.

[본채/차고 공유 벽](00-building.md#attached-garage-extent)은 기존 `src/spaces/garage.ts`, [계단 구멍과 보호/분리 경계](02-stair.md#stair-floor-opening)는 기존 `src/spaces/stair.ts`의 구조 책임을 유지한다. 현관 외투장과 상층 린넨장의 몸체·문·자기 둘레는 각각 [entry](rooms/entry.md#entry-coat-storage), [upper-hall](rooms/upper-hall.md#upper-linen-storage)이 소유하고 계단 구조를 다시 만들지 않는다. 계단 주변은 [높이별 닫힌 벽/열린 보호 경계](02-stair.md#stair-boundary-heights)를 소비하며 평면 예약을 두 층 높이의 막힌 벽으로 일괄 압출하지 않는다. 일반 실내 칸막이의 높이는 해당 storey의 완성 바닥에서 천장까지이며, 계단/수납의 별도 높이를 덮어쓰지 않는다.

`src/spaces/boundaries.ts`는 방·벽·개구부의 동일 경계 인계와 아래 접합 계산을 맡을 예정이며, 벽 geometry나 입면/방 마감을 소유하지 않는다. 조립은 각 경계의 두 상대 공간, storey, 구간, 높이 역할, 구조 바탕 owner, 양쪽 마감 owner를 함께 전달한다. 상대가 하나뿐인 실내 벽, 설명 없는 겹친 방, owner 없는 접면 또는 두 구조 owner가 같은 접면을 생성한 상태는 실패다. 실내의 한쪽이 계단 아래 비통행 영역인 경우 그 역할을 명시하며 새로운 방이나 숨은 통로로 세지 않는다. 전체 층 평면·해당 높이 단면·공유 면 census가 검사 주소이고 실제 조립은 unverified다.

## 모서리와 문턱에서 끊기지 않는 경계 {#interior-boundary-junctions}

위 공유 칸막이는 같은 높이에서 만나는 끝점·L자·T자·십자 접합을 공유한다. 한 직선 벽의 단부가 다른 벽 중심까지 무조건 연장되거나, 양쪽 모두 안쪽 면에서 끝나 모서리에 구멍이 생기지 않게 한다. `src/spaces/boundaries.ts`는 [원래 방 윤곽과 두께](#interior-boundary-ownership)에서 만남의 평면 구역을 산출하고, 높이 구간이 겹치는 부분만 하나의 접합으로 다룬다. 층이 다르거나 계단 위아래에 있는 면의 평면 투영이 겹친다는 이유만으로 합치지 않는다.

접합 구역은 한 번만 공통 몸체로 생성하고 각 직선 몸체에서는 그 구역을 뺀다. 일반 칸막이끼리의 접합 생성 책임은 위 표에서 만나는 source 경로를 사전식으로 정렬한 첫 owner에게 배정한다. 문서 행 순서나 런타임 평가 순서로 책임이 바뀌지 않는다. 외벽·차고 공유 벽·계단 구조와 만나는 경우에는 그 기존 구조 owner가 접합을 받고 일반 칸막이가 그 접면에서 끝난다. 이 배정은 계산된 공통 몸체의 책임이며, 모서리를 감싼 방의 시각적으로 완결된 면을 다른 저작자에게 넘기는 규칙이 아니다. 같은 room의 벽 마감은 자기 모서리를 연속해서 닫는다.

벽 개구부는 [원래 문 owner](05-route-network.md#room-route-network)에서 받아 공통 몸체와 양쪽 마감에 같은 절단 경계로 전달한다. 문틀·문짝은 그 문 owner가 한 번 생성하고 반대편 방은 같은 부재의 반대 면을 관찰한다. 양 방에 문짝을 각각 생성하지 않는다. 거실/서비스에서 공용부로 들어가는 문 없는 개구부도 같은 절단을 사용한다. 외부 문/창은 [외부 개구부 인계](06-openings.md#external-opening-interface)의 입면/방 역할을 유지한다. 개구부가 다른 접합 몸체에 다시 막히거나 문을 닫은 상태를 벽의 void 부재로 오해하면 실패다.

같은 높이의 실내 문 아래는 [해당 층 바닥 owner](03-surface-owners.md#exterior-surface-handoff)가 벽 두께 방향까지 연속된 바탕을 제공한다. 바닥 위 마감 전환선은 거친 칸막이 두께의 중앙면으로 정하고 각 방의 마감이 그 선에서 만난다. 문짝의 경첩 위치를 기준으로 바닥 경계를 이동하지 않는다. 문턱/전환 부재는 원래 문 owner가 한 번 통합하고 양쪽 방이 같은 높이와 접면을 소비한다. [머드룸/차고의 한 단](rooms/laundry.md#laundry-plan), 포치·정원문, 계단 바닥 구멍에는 이 동일 높이 규칙을 적용하지 않으며 각 기존 datum/통행 경계를 보존한다.

검사는 두 층의 모든 실내 공유 벽과 실제 개구부, 그 벽이 만나는 모든 접합에 대해 높이별 단면과 양쪽 방 안 시야를 추가한다. 닫힌 문/열린 문, 서로 다른 바닥 마감, 계단 곁의 위아래 경계도 함께 읽는다. [경계 허용 오차](00-building.md#main-building-extent)는 같은 경계 입력의 일치 비교에 쓰며 작은 틈을 숨길 권한이 아니다. 공개 엔진에서 이 공통 몸체/절단/면 인계를 표현할 수 있는지 아직 실행하지 않았고 지원하지 않는다면 표현 한계를 기록해 조정자에게 올린다. 실제 id·중복/빈틈·문턱 연속·순폭·표면 census와 프레임은 unverified다.
