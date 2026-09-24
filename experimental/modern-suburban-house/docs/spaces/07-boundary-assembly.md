# 벽 경계와 접합의 조립

## 방 사이의 한 벽체와 두 안쪽 면 {#interior-boundary-ownership}
<!--
@evidence principles/core/common.md#scope-preservation 두 층의 방 사이 공유 칸막이마다 공통 몸체 생성 owner와 양쪽 마감 owner, 열린 접속의 유지, 계단·차고·수납 구조의 예외를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 ground 5행·upper 6행의 구조 바탕 owner 표, 03-surface-owners 마감 인계, 열린 접속 유지 문단, garage.ts·stair.ts·외투장·린넨장 예외 문단을 대조해 방 사이 칸막이 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 맞닿는 실 쌍마다 공통 구조 바탕의 source owner를 표로 정하고 일반 칸막이 높이를 해당 storey의 완성 바닥에서 천장까지로 둔다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 11개 표 행이 맞닿는 실마다 src/spaces/rooms/*.ts 하나를 지정하고 일반 칸막이 높이를 storey 완성 바닥에서 천장까지로 둔 문장을 대조해 다음 층이 칸막이 생성자나 높이를 정할 일이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 방 안쪽 윤곽·칸막이 두께·문 위치는 05가 가리키는 원래 owner에서 받고 두 방의 중간선을 평균하지 않으며 불일치하면 원래 평면을 고친다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 첫 문단이 안쪽 윤곽·예약 두께·문 위치를 05가 가리키는 원래 owner에서 받고 중간선 평균을 금지하며 불일치 시 조립을 멈추고 원래 평면을 고친다고 적은 것을 대조해 칸막이 값의 근거가 추적됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-allocation이 선언하라고 한 "각 방 내부의 완결 면"과 "접합의 owner"에 맞닿는 실 쌍마다 공통 구조 바탕의 소스 owner 하나를 더해 양쪽 방이 같은 칸막이를 두 번 만들지 않게 한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 settings surface-allocation은 방 내부 완결 면과 접합 owner 선언만 요구하나 본문은 공유 칸막이 몸체를 실 쌍별 source 하나에 두고 안쪽 마감은 03-surface-owners에 남기는 분리를 더했음을 확인했다.
@evidence principles/design/spaces.md#space-topology 현관과 서비스의 열린 접속과 계단 끝의 복도 도착은 벽 없이 두고 거실/서비스와 공용부 사이는 상인방 아래 void 외의 전면 칸막이를 닫는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 현관-서비스 열린 접속과 upper-hall 계단 도착을 벽 없는 연결로, 거실/서비스-공용부를 상인방 아래 void 외 닫힌 칸막이로 둔 문단을 대조해 연결 edge와 막힌 경계가 메쉬 없이 구별됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 공유 벽은 garage.ts, 계단 보호/분리는 stair.ts, 외투장·린넨장은 entry·upper-hall이 유지하고 boundaries.ts는 경계 계산만 하며 벽 geometry를 소유하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본채/차고 공유 벽·계단 경계·외투장·린넨장이 00-building·02-stair·rooms/entry·rooms/upper-hall 링크 owner를 유지하고 boundaries.ts가 벽 geometry를 갖지 않는지 대조해 칸막이 몸체의 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 상대가 하나뿐인 실내 벽, 설명 없는 겹친 방, owner 없는 접면, 두 구조 owner가 같은 접면을 만든 상태를 층 평면·높이 단면·공유 면 census에서 찾는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 상대가 하나뿐인 벽·설명 없는 겹친 방·owner 없는 접면·이중 구조 owner를 실패로 정하고 층 평면·높이 단면·공유 면 census를 검사 주소로 둔 문단을 대조해 칸막이 배정이 반증 가능함을 확인했다.
@evidence settings/20-verification.md#surface-allocation 한 공유 구조와 양쪽 완결 마감을 따로 배정해 같은 벽을 두 번 생성하지 않는다.
@evidenceReview settings/20-verification.md#surface-allocation #aae54d5 표의 구조 바탕 owner와 03-surface-owners의 방별 안쪽 마감을 나누고 마감 위치의 두 번째 불투명 판을 금지한 문장을 surface-allocation의 단일 기준 요구에 대조해 성립함을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work surface-allocation의 "외부 입면, 각 방 내부의 완결 면"과 공유 벽 기준 하나를 실제 방 쌍 표에 적용했고 모든 쌍이 생성 owner 하나로 정해져 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 surface-allocation의 방 내부 완결 면과 단일 기준 요구를 ground·upper 11개 표 행에 대조해 각 행이 source owner 하나로 끝나고 부모 수정 없이 성립함을 확인했다.
-->

이 설계는 [두 storey](01-storeys.md#storey-datums) 안에서 기존 방 사이의 칸막이를 한 번만 생성하기 위한 공간 인계다. 방의 마감 안쪽 윤곽, 칸막이 예약 두께, 문 위치는 [방 연결](05-route-network.md#room-route-network)이 가리키는 원래 owner를 소비한다. 여기서 방 좌표를 다시 정하거나 두 room의 중간선을 평균하여 서로 다른 입력을 숨기지 않는다. 같은 storey에서 맞닿는 두 실의 안쪽 경계와 그 사이 벽 예약이 일치하지 않으면 조립을 멈추고 원래 평면을 고친다.

아래 표의 구조 바탕 owner는 공유 칸막이의 공통 몸체·개구부 절단을 한 번만 생성한다. 양쪽에서 보이는 안쪽 마감과 reveal은 [각 방의 완결 면 owner](03-surface-owners.md#interior-surface-handoff)가 유지한다. 구조 바탕의 원형이나 표면이 마감과 동일한 위치에 겹치는 두 번째 불투명 판을 만들지 않는다. 담당 저작자는 모두 이 production의 단일 저작자이며 표의 이름은 설계 연결의 이름이다. 실제 boundary id·개수는 소스에서 생성한 산출물을 읽는다.

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

[본채/차고 공유 벽](00-building.md#attached-garage-extent)은 기존 `src/spaces/garage.ts`, [계단과 보호/분리 경계](02-stair.md#stair-floor-opening)는 기존 `src/spaces/stair.ts`의 구조 책임을 유지한다. 계단 owner의 통행 구멍을 소비하는 층간 몸체와 벽/층판 접합은 [단일 층간 조립](08-floor-assembly.md#interstorey-edge-junctions)이 배정한다. 현관 외투장과 상층 린넨장의 몸체·문·자기 둘레는 각각 [entry](rooms/entry.md#entry-coat-storage), [upper-hall](rooms/upper-hall.md#upper-linen-storage)이 소유하고 계단 구조를 다시 만들지 않는다. 계단 주변은 [높이별 닫힌 벽/열린 보호 경계](02-stair.md#stair-boundary-heights)를 소비하며 평면 예약을 두 층 높이의 막힌 벽으로 일괄 압출하지 않는다. 일반 실내 칸막이의 높이는 해당 storey의 완성 바닥에서 천장까지이며, 계단/수납의 별도 높이를 덮어쓰지 않는다.

`src/spaces/boundaries.ts`는 방·벽·개구부의 동일 경계 인계와 아래 접합 계산을 맡을 예정이며, 벽 geometry나 입면/방 마감을 소유하지 않는다. 조립은 각 경계의 두 상대 공간, storey, 구간, 높이 역할, 구조 바탕 owner, 양쪽 마감 owner를 함께 전달한다. 상대가 하나뿐인 실내 벽, 설명 없는 겹친 방, owner 없는 접면 또는 두 구조 owner가 같은 접면을 생성한 상태는 실패다. 실내의 한쪽이 계단 아래 비통행 영역인 경우 그 역할을 명시하며 새로운 방이나 숨은 통로로 세지 않는다. 전체 층 평면·해당 높이 단면·공유 면 census가 검사 주소이고 실제 조립은 unverified다.

## 모서리와 문턱에서 끊기지 않는 경계 {#interior-boundary-junctions}
<!--
@evidence principles/core/common.md#scope-preservation 공유 칸막이의 끝점·L·T·십자 접합, 벽 개구부 절단과 별도 문 부재로의 인계, 벽 부착물의 지지 접면, 실내 문 아래 바닥과 마감 전환선, 네 건물 출입구로의 인계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 끝점·L·T·십자 접합과 문 절단은 spaces, 닫힌 문틀·문선·문짝은 models/03, 문 아래 바닥 전환은 spaces라는 분할을 본문과 대조했다. 수건걸이·거울·선반 지지 접면과 10-ground-floor 출입구 인계도 이 H2가 남겨 둔다.
@evidence principles/core/common.md#substantive-completion 접합 구역을 한 번 공통 몸체로 만들고 일반 칸막이끼리의 생성 책임을 source 경로 사전식 첫 owner로, 실내 문 아래 마감 전환선을 거친 칸막이 두께의 중앙면으로 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 접합 구역의 단일 공통 몸체와 직선 몸체 차감, source 경로 사전식 첫 owner 배정, 거친 칸막이 두께 중앙면 전환선을 대조해 다음 층이 접합 책임이나 마감 경계를 새로 정할 일이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 접합 구역은 원래 방 윤곽과 두께에서 높이 구간이 겹치는 부분만 산출하고 문 절단은 05의 원래 문 owner에서 받는다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 접합 평면 구역을 #interior-boundary-ownership의 원래 윤곽·두께에서 높이 겹침만으로 산출하고 문 절단을 05의 원래 문 owner에서 받는다는 문장을 대조해 접합 진술의 근거가 추적됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 한 구조 기준 요구에 문서 행 순서나 런타임 평가 순서에 흔들리지 않는 접합 배정 규칙과 부착물이 닫힌 벽 구간에만 붙는 조건을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 surface-allocation의 단일 기준 요구 위에 행 순서·런타임 순서와 무관한 사전식 owner 규칙과 부착물 접면 전체가 닫힌 벽 구간에 있어야 하는 조건이 본문에 더해졌음을 확인했다.
@evidence principles/design/spaces.md#space-topology 층이 다르거나 계단 위아래에 있는 면을 평면 투영 겹침만으로 합치지 않고 머드룸 한 단·포치·정원문·계단 구멍에는 같은 높이 규칙을 적용하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 다른 층·계단 위아래 면의 평면 투영 겹침을 접합으로 합치지 않는 문장과 머드룸/차고 한 단·포치·정원문·계단 바닥 구멍의 동일 높이 규칙 제외를 대조해 층 구분이 place graph에서 유지됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 원래 방 owner는 문 개구부의 위치·절단과 마감 전환을 한 번 만들고, models/03은 그 절단을 받아 닫힌 문틀·문선·문짝·철물을 한 번 만들며, 반대 방은 같은 부재의 반대 면만 관찰한다. 외벽·공유 벽·계단 구조 접합은 기존 구조 owner가 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 05의 방 owner가 벽 개구부를, 03-interior-doors의 모델 원형이 문틀·문선·문짝·철물을 맡는 본문을 각각 대조했다. 외벽·차고 공유 벽·계단 접합은 기존 구조 owner에게 남아 있어 같은 문 부재를 두 방이 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 두 층의 모든 실내 공유 벽과 그 실제 개구부, 그 벽이 만나는 모든 접합의 높이별 단면과 양쪽 방 안 시야에서 닫힌/열린 문과 서로 다른 바닥 마감을 함께 읽게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 모든 실내 공유 벽·개구부·접합의 높이별 단면과 양쪽 방 시야, 닫힌/열린 문·다른 바닥 마감·계단 곁 경계 읽기, 경계 허용 오차의 사용 한정을 대조해 접합 주장이 관찰로 반증 가능함을 확인했다.
@evidence settings/10-house.md#openings 벽의 실제 void와 닫힌 문 부재를 양 방이 공유하되 spaces 절단·바닥 전환과 models 문 충전을 구별한다.
@evidenceReview settings/10-house.md#openings #5663f6c settings의 문틀·문턱 구별을 벽 개구부의 단일 절단, spaces 바닥 전환, models 문틀·문짝의 별도 닫힌 면에 대조했다. 닫힌 문짝을 벽 void를 메우는 구조 벽으로 세지 않는다.
@evidence settings/00-production.md#build-allocation 공개 엔진이 이 공통 몸체/절단/면 인계를 지원하지 않으면 표현 한계를 기록해 조정자에게 올리도록 정해, 엔진에 없는 기능을 제한 기록으로 다루는 배분을 따른다.
@evidenceReview settings/00-production.md#build-allocation #b85e84f 공통 몸체/절단/면 인계의 엔진 표현 가능성을 아직 실행하지 않았고 미지원 시 한계를 기록해 조정자에게 올린다는 검사 문단을 build-allocation의 엔진 기능 부족 처리에 대조해 일치함을 확인했다.
@evidenceExclude settings/20-verification.md#implementation-boundary spaces 47개 문서에는 편집 범위·의존성 선언·설치·lockfile 제출을 정하거나 소비하는 공간 결정이 없다. 이 H2처럼 엔진 기능 부족을 다루는 문장은 기록과 조정자 이관만 말하며 그 배분은 build-allocation이 소유한다.
@evidenceExcludeReview settings/20-verification.md#implementation-boundary #e90ff46 본문의 엔진 관련 문장이 표현 한계 기록과 조정자 이관뿐이고 package.json 선언·pnpm install·lockfile을 다루지 않음을 implementation-boundary 범위에 대조해 이 H2가 그 모집단 밖임을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work settings/10-house.md#openings는 문짝·경첩·손잡이·문틀·문턱을 구별하라고 이미 정한다. 이 H2는 절단과 바닥 전환을 spaces에, 별도 문 부재를 models/03에 배분하여 그 부모 설정을 고치지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 openings의 문 부재 구별과 05의 방별 개구부 배정을 본문의 spaces 절단·바닥 전환 및 models/03 닫힌 충전 분리와 대조했다. 이 수정은 자식인 spaces/07의 소유 문장만 바로잡고 settings와 방별 평면은 유지한다.
-->

위 공유 칸막이는 같은 높이에서 만나는 끝점·L자·T자·십자 접합을 공유한다. 한 직선 벽의 단부가 다른 벽 중심까지 무조건 연장되거나, 양쪽 모두 안쪽 면에서 끝나 모서리에 구멍이 생기지 않게 한다. `src/spaces/boundaries.ts`는 [원래 방 윤곽과 두께](#interior-boundary-ownership)에서 만남의 평면 구역을 산출하고, 높이 구간이 겹치는 부분만 하나의 접합으로 다룬다. 층이 다르거나 계단 위아래에 있는 면의 평면 투영이 겹친다는 이유만으로 합치지 않는다.

접합 구역은 한 번만 공통 몸체로 생성하고 각 직선 몸체에서는 그 구역을 뺀다. 일반 칸막이끼리의 접합 생성 책임은 위 표에서 만나는 source 경로를 사전식으로 정렬한 첫 owner에게 배정한다. 문서 행 순서나 런타임 평가 순서로 책임이 바뀌지 않는다. 외벽·차고 공유 벽·계단 구조와 만나는 경우에는 그 기존 구조 owner가 접합을 받고 일반 칸막이가 그 접면에서 끝난다. 이 배정은 계산된 공통 몸체의 책임이며, 모서리를 감싼 방의 시각적으로 완결된 면을 다른 저작자에게 넘기는 규칙이 아니다. 같은 room의 벽 마감은 자기 모서리를 연속해서 닫는다.

벽 개구부의 위치는 [원래 방 owner](05-route-network.md#room-route-network)에서 받아 공통 몸체와 양쪽 마감에 같은 절단 경계로 전달한다. 그 표에서 각 문 개구부의 설계 경계/개구부 owner로 지정한 단일 spaces 방 H2가 벽 절단·reveal과 아래 바닥 마감 전환만 만든다. [실내 문 모델 원형](../models/03-interior-doors.md#interior-door-members)이 이 절단을 받아 닫힌 문설주·문선·문짝·경첩·손잡이를 한 번 만들고, 반대편 방은 같은 부재의 반대 면을 관찰한다. 양 방에 문짝을 각각 생성하지 않는다. 거실/서비스에서 공용부로 들어가는 문 없는 개구부도 같은 절단을 사용한다. 외부 문/창은 [외부 개구부 인계](06-openings.md#external-opening-interface)의 입면/방 역할을 유지한다. 개구부가 다른 접합 몸체에 다시 막히거나 문을 닫은 상태를 벽의 void 부재로 오해하면 실패다.

벽 부착물의 지지 접면도 같은 절단 뒤의 실제 벽 면을 소비한다. room 이름과 평면상의 벽 방향만으로 수건걸이·거울·상부장·선반을 배정하지 않는다. 해당 층의 높이 기준을 적용한 접면 전체가 닫힌 벽 구간에 있어야 하며 개구부를 가로지르는 가짜 받침을 생성하지 않는다. 각 room owner는 자기 부착물/담긴 물건의 최대 점유와 원래 문·창 owner의 틀/문선 및 개폐 점유를 같은 좌표로 대조한다. 충돌하면 부착물의 배치를 원래 room에서 고치며 문을 막거나 반대쪽 방의 벽을 이동하지 않는다. 창 앞 커튼처럼 의도적으로 개구부를 덮는 가동 물건도 벽의 지지 위치와 사용 상태를 구별한다.

같은 높이의 실내 문 아래는 [해당 층 바닥 owner](03-surface-owners.md#exterior-surface-handoff)가 벽 두께 방향까지 연속된 바탕을 제공한다. 바닥 위 마감 전환선은 거친 칸막이 두께의 중앙면으로 정하고 각 방의 마감이 그 선에서 만난다. 문짝의 경첩 위치를 기준으로 바닥 경계를 이동하지 않는다. 바닥 문턱/전환 면은 위 05 표의 해당 문 개구부 owner인 한 spaces 방 H2가 통합하고 양쪽 방이 같은 높이와 접면을 소비한다. 별도 문 충전은 models/03의 부재이며 이 바닥 면을 복제하지 않는다. [머드룸/차고의 한 단](rooms/laundry.md#laundry-plan), 포치·정원문, 계단 바닥 구멍에는 이 동일 높이 규칙을 적용하지 않으며 각 기존 datum/통행 경계를 보존한다.

본채·차고의 네 건물 출입구 아래는 [지상층 바탕의 별도 인계](10-ground-floor.md#ground-threshold-junctions)가 외벽/공유 벽 두께를 지나는 바탕과 문턱을 배정한다. 벽 개구부 하한 아래의 예약도 함께 분할하여 지지 바탕과 벽 몸체가 포개지지 않게 하며, 일반 실문의 중앙 전환선을 외부 문이나 머드룸 한 단에 옮기지 않는다.

검사는 두 층의 모든 실내 공유 벽과 실제 개구부, 그 벽이 만나는 모든 접합에 대해 높이별 단면과 양쪽 방 안 시야를 추가한다. 닫힌 문/열린 문, 서로 다른 바닥 마감, 계단 곁의 위아래 경계도 함께 읽는다. [경계 허용 오차](00-building.md#main-building-extent)는 같은 경계 입력의 일치 비교에 쓰며 작은 틈을 숨길 권한이 아니다. 공개 엔진에서 이 공통 몸체/절단/면 인계를 표현할 수 있는지 아직 실행하지 않았고 지원하지 않는다면 표현 한계를 기록해 조정자에게 올린다. 실제 id·중복/빈틈·문턱 연속·순폭·표면 census와 프레임은 unverified다.

## 외벽 모서리와 지붕 단차의 단일 몸체 {#exterior-boundary-junctions}
<!--
@evidence principles/core/common.md#scope-preservation 본채·차고 외벽 모서리, 차고 앞뒤 벽의 왼쪽 끝, 단차 벽과 앞뒤 외벽의 교차, 굴뚝과 본채 벽의 중복 구역에서 공통 몸체의 단일 배정을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 표의 본채 앞뒤 모서리·차고 오른쪽 모서리·차고 벽 왼쪽 끝·단차 벽 교차 5행과 굴뚝 중복 구역의 left owner 통합 문장을 대조해 외벽 접합 구역마다 몸체 owner가 있음을 확인했다.
@evidence principles/core/common.md#substantive-completion 앞뒤 모서리 몸체는 front/rear, 차고 앞뒤 벽의 왼쪽 끝은 garage 공유 벽 owner가 받고 측벽 직선 몸체는 앞뒤 벽의 안쪽 면에서 끝나게 한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 표가 모서리 몸체를 front/rear, 차고 벽 왼쪽 끝을 garage 공유 벽 owner에 주고 left/right·차고 right 직선 몸체의 끝을 앞뒤 벽 안쪽 면으로 정함을 대조해 외벽 몸체 경계가 완결됨을 확인했다.
@evidence principles/core/common.md#declared-basis 외곽은 00, 벽 상단은 roof-wall-head-junctions에서 받고 서로 다른 지붕 높이를 평균하지 않으며 실제로 겹치는 높이 구간만 공유한다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 첫 문단이 외곽을 00-building 두 H2, 벽 상단을 roof-wall-head-junctions에서 받고 지붕 높이 평균을 금지하며, 다음 문단이 실제로 겹치는 높이 구간만 공유한다고 적은 것을 대조해 근거를 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-allocation의 "여러 소유자의 독립 기준을 허용하지 않는다"를 본채·차고 외벽 모서리, 차고 앞뒤 벽의 왼쪽 끝, 단차 벽 교차마다 단일 우선 owner를 두는 표로 구체화하고 몸체 배정이 옆면의 연속 마감 소유를 바꾸지 않게 한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 surface-allocation의 단일 기준 금지를 모서리·차고 왼쪽 끝·단차 교차별 우선 owner 표로 구체화하고, 몸체 배정이 left/right 옆면 마감을 쪼개지 않는다는 문장이 부모에 없는 결정임을 확인했다.
@evidence principles/design/spaces.md#space-topology 본채/차고 공유 벽의 상부를 본채 지붕 아래까지 이어 차고 지붕/천장에서 본채 경계를 자르지 않고 굴뚝 중복 구역에서 거실 화구 접면을 막지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 공유 벽 상부를 본채 지붕 아래까지 이어 차고 지붕/천장이 본채 경계를 자르지 않고 굴뚝 중복 구역에서 거실 화구 접면을 막지 않는다는 문장을 대조해 본채와 차고의 안팎 관계가 유지됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority front가 받는 모서리 몸체의 옆면 마감은 left/right 입면 owner의 연속 면으로 남고 boundaries.ts는 구역과 높이만 계산한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 boundaries.ts의 구역·높이 전달, front/rear/garage 모서리 구조 몸체, left/right의 연속 날씨 면과 models/15의 별도 닫힌 trim을 본문에서 분리해 대조했다. 구조 벽의 옆면과 돌출 판의 닫힌 면을 한 owner가 중복 저작하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 모든 외벽 모서리·공유 벽 두 끝·단차 교차·굴뚝 접점의 높이별 평면과 상단 단면에서 몸체 합집합·교집합과 void 재폐쇄를 읽게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 모든 외벽 모서리·공유 벽 두 끝·단차 교차·굴뚝 접점의 높이별 평면과 상단 단면, 몸체 합집합/교집합과 void 재폐쇄 읽기, 표 행 수를 census로 쓰지 않는 조건을 대조해 반증 주소를 확인했다.
@evidence settings/20-verification.md#surface-allocation 접합 몸체의 단일 생성과 입면별 완결 마감을 구별해 모서리 소유를 이어 준다.
@evidenceReview settings/20-verification.md#surface-allocation #aae54d5 표의 구조 몸체 배정, 03-surface-owners의 입면 마감과 models/15의 닫힌 모서리 trim을 각각 다른 표면으로 대조했다. 입면의 연속 날씨 면을 모서리 판 때문에 쪼개지 않으며 판의 닫힌 면은 모델 원형 한 곳이 소유한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work surface-allocation의 "여러 소유자의 독립 기준을 허용하지 않는다"와 main-mass의 "본채 오른쪽 끝의 더 낮은 지붕"을 모서리·단차 몸체에 대조했고 구역별 단일 owner로 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 main-mass의 본채 오른쪽 낮은 지붕을 단차 벽 행의 front/rear 우선·right 제외 배정에, surface-allocation 단일 기준을 모서리 행에 대조해 부모 수정 없이 성립함을 확인했다.
@evidence obligations/design/spaces.md#space-envelope-interface 본채·차고 외벽 모서리, 차고 앞뒤 벽의 왼쪽 끝, 단차 벽과 앞뒤 외벽의 교차 몸체를 front·rear·garage 공유 벽 owner 가운데 하나에 배정해 만나는 두 입면이 같은 몸체를 겹치지 않게 하고, 방의 안쪽 면과 문·창·storey 관계는 그대로 둔다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 각 입면 외측 면·방 안쪽 면·기존 문·창·storey 관계를 유지한다는 첫 문단과 표의 front·rear·garage 공유 벽 owner 배정을 대조해 만나는 두 입면이 한 몸체를 겹쳐 기술하지 않음을 확인했다.
-->

이 접합은 [본채 외벽](00-building.md#main-building-extent)과 [차고 외벽/공유 벽](00-building.md#attached-garage-extent)의 예약 안에서 만나는 외부 경계를 잇는다. 각 입면의 외측 면, 방의 안쪽 면, 기존 문·창·storey 관계를 유지하고 별도 방이나 출입구를 만들지 않는다. 지붕에 닿는 상단은 [벽 두께 전체의 지붕 접촉](roof/00-junctions.md#roof-wall-head-junctions)을 소비하며 서로 다른 지붕 높이를 평균하지 않는다. 실내 칸막이의 접합은 위 [별도 배정](#interior-boundary-junctions)을 유지한다.

| 실제로 만나는 구역 | 공통 몸체의 단일 배정 |
| --- | --- |
| 본채 앞쪽 두 모서리 | front 입면 owner가 앞 벽 두께 안의 모서리 몸체를 받는다. left/right 직선 몸체는 앞 벽의 안쪽 면에서 끝난다. |
| 본채 뒤쪽 두 모서리 | rear 입면 owner가 뒤 벽 두께 안의 모서리 몸체를 받는다. left/right 직선 몸체는 뒤 벽의 안쪽 면에서 끝난다. |
| 차고 오른쪽 앞/뒤 모서리 | 각각 front/rear 입면 owner가 받는다. 차고 right 직선 몸체는 두 벽의 안쪽 면 사이에서 끝난다. |
| 차고 앞/뒤 벽의 왼쪽 끝 | 기존 garage 공유 벽 owner를 우선한다. 두 차고 벽은 공유 벽의 차고 쪽 면에서 끝나며 본채 벽 두께 안에 겹친 끝기둥을 만들지 않는다. |
| [본채 지붕 단차](../settings/10-house.md#main-mass) 벽의 앞/뒤 외벽 접합 | 실제로 겹치는 앞/뒤 외벽 두께 안의 몸체는 각각 front/rear owner가 받는다. right owner의 단차 벽은 그 구역을 제외하고, 외벽 바깥 처마 구간과 외벽 안쪽 지붕 구간의 나머지를 잇는다. |

이 배정은 평면의 모서리 사각형을 모든 높이에 일괄 복제하는 규칙이 아니다. 각 몸체의 아래/위 경계가 실제로 겹치는 높이 구간만 공유하고 문·창 void도 동일하게 제외한다. 본채/차고 공유 벽의 상부는 본채 지붕 아래까지 이어지며 차고 지붕/천장에서 본채 경계를 잘라 버리지 않는다. 차고 지붕 위에서 바깥에 드러나는 면은 기존 right 입면 owner가 유지한다. 왼쪽 굴뚝과 본채 벽의 중복 구역도 기존 left owner 안에서 한 몸체 경계로 통합하며 거실의 화구 접면을 다시 막지 않는다.

`src/spaces/boundaries.ts`는 같은 만남의 구역과 높이 경계를 계산해 전달하고 geometry를 추가하지 않는다. 표가 배정한 구조 바탕과 [완결 시각 표면](03-surface-owners.md#exterior-surface-handoff)은 구별한다. 예를 들어 front가 받는 모서리 몸체의 옆면 마감은 계속 left/right 입면 owner의 연속 면이다. 그 두 날씨 면의 외측 교선은 [닫힌 모서리 trim 원형](../models/15-outdoor.md#exterior-corner-trim)에 한 번 넘기고 spaces의 입면·경계 source는 그 판을 만들지 않는다. 모서리 trim이나 한쪽 방 마감을 몸체 배정 때문에 쪼개지 않는다. 담당 저작자는 기존과 같이 이 production의 단일 저작자다.

검사는 본채/차고의 모든 외벽 모서리, 차고 공유 벽의 두 끝, 단차 벽과 앞뒤 외벽의 교차, 굴뚝 접점에 대한 높이별 평면과 상단 단면이다. 실제 몸체 점유의 합집합과 교집합, 개구부가 다시 막히지 않는지, 각 완결 입면/방의 연결을 같은 산출물에서 읽는다. [공유 허용 오차](01-storeys.md#storey-datums)와 [전체 관찰](04-observations.md#spatial-observation-derivation)을 적용하며, 표의 행 수를 접합/표면 census로 쓰지 않는다. 실제 분할·폐합·void·GPU 프레임은 unverified다.
