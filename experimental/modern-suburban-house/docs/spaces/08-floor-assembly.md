# 층간 바닥과 아래층 천장의 공유 경계

## 한 층간 구조와 서로 다른 두 층의 마감 {#interstorey-floor-boundary}
<!--
@evidence principles/core/common.md#scope-preservation upper.ts가 한 번 만드는 층간 구조, ground.ts와의 분리, 방별 마감 소유, 두 마감 예약, 같은 L형 구멍, 1층·차고·포치로의 비연장을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 upper.ts 단일 구조 바탕, ground.ts의 별도 1층 바탕, 방별 마감 소유, 0.015·0.025 m 예약, 세 층위의 같은 L형 구멍, 차고·포치·테라스 비연장 문단을 대조해 층간 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 층간 0.31 m 안에 아래 천장 마감 0.015 m, 위 바닥 마감 묶음 0.025 m, 구조 0.270 m를 배정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 아래 천장 마감 0.015 m, 위 바닥 마감 묶음 0.025 m, 구조 0.270 m의 합이 01-storeys의 층간 0.31 m 예약과 같고 두 마감의 들어가는 방향이 datum 기준으로 정해짐을 대조해 적층 배분이 완결됨을 확인했다.
@evidence principles/core/common.md#declared-basis 구조 0.270 m는 층간 높이에서 두 마감 예약을 뺀 값이고 부재 규격·경간·하중·내화·차음을 계산한 결과가 아니라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 0.270 m를 기존 층간 높이에서 두 마감 예약을 뺀 값으로 적고 부재 규격·경간·하중·내화·차음 계산이 아닌 공간 점유 저작 선택이라 밝힌 문장을 대조해 구조 예약의 근거 종류가 분명함을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 층간 통행 구멍 요구를 전면 안쪽 외곽에 닿아 닫힌 hole이 아닌 하나의 패인 outer ring으로 만들어 접촉하는 outer/hole ring 거부를 피한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 settings stair의 통행 개구부 요구에 L형 빈 영역이 전면 안쪽 외곽에 닿아 하나의 패인 outer ring으로 구성된다는 결정이 더해졌고, 그 근거가 두 region API의 접촉 ring 거부임을 대조해 확인했다.
@evidence principles/design/spaces.md#space-topology 위아래 방 분할이 달라도 층간 구조는 하나이고 L형 구멍은 이 층간 바닥에만 두며 1층 바닥과 최상부 천장에 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 방 분할이 달라도 upper.ts 구조 하나로 두고 L형 구멍을 위 바닥·공통 구조·아래 천장에만 전달하며 현관 하부 대기 바닥과 계단실 위 2층 천장을 유지한 문장을 대조해 층 관계가 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority upper.ts가 공통 구조, 각 방이 자기 층 마감을 소유하고 욕실 타일·복도 카펫 두께 차이로 실문에 새 단을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 upper.ts가 공통 구조를, ground-storey 천장은 그 아래 경계를 소비하고 방별 마감은 03-surface-owners에 남기며 욕실 타일·복도 카펫을 같은 datum 묶음에 맞춘 문장을 대조해 층간 값의 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 두 층 평면을 같은 좌표로 겹친 결과, 층간 전체 단면, 방 분할이 어긋나는 구간의 상하 마감/몸체 census를 기존 허용 오차로 보게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 두 층 평면 중첩, 층간 전체 단면, 방 분할이 어긋나는 구간의 상하 마감/몸체 census에 00-building 허용 오차를 적용하고 배정표·높이 산술을 측정으로 세지 않는 문단을 대조해 반증 주소를 확인했다.
@evidence settings/10-house.md#stair 두 층 마감과 공통 구조에 같은 통행 구멍을 전달해 계단 경로를 보존한다.
@evidenceReview settings/10-house.md#stair #170ce55 settings stair의 2층 구조 바닥·아래층 천장 통행 개구부 요구를 02-stair의 L형 구멍 하나를 위층 마감·공통 구조·아래 천장 마감에 같은 경계로 전달한다는 문장에 대조해 성립함을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work stair의 "실제 통행 개구부"와 "복층 보이드는 없다"를 층간 구조에 대조했고 L형 구멍 하나만 비우면 되어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 stair의 통행 개구부와 복층 보이드 금지를 층판에서 L형 구멍 하나만 비우고 계단실 위 2층 천장을 유지하는 배정에 대조해 부모 수정 없이 성립함을 확인했다.
-->

[두 storey의 완성면](01-storeys.md#storey-datums) 사이에 있는 층간 바닥은 upper-storey 바닥의 한 구조다. `src/spaces/floors/upper.ts`가 이 공통 구조 바탕을 한 번 생성하고 ground-storey의 천장이 같은 구조의 아래 경계를 소비한다. `src/spaces/floors/ground.ts`는 본채 1층 바닥 바탕을 소유하며 층간 바닥의 두 번째 몸체나 별도 1층 천장판을 생성하지 않는다. 위층의 방 분할과 아래층의 방 분할이 다르다는 이유로 방마다 독립 구조 상자를 포개지 않는다. 이 배정은 [완결 시각 면의 방별 소유](03-surface-owners.md#interior-surface-handoff)를 바꾸지 않는다.

기존 층간 높이 예약 안에서 아래쪽 천장 마감에 0.015 m, 위쪽 바닥 마감 묶음에 0.025 m를 배정한다. 천장 마감은 ground-storey 완성 천장에서 위쪽으로, 바닥 마감은 upper-storey 완성 바닥에서 아래쪽으로 들어간다. 그 사이에 남는 구조 예약은 기존 층간 높이에서 두 마감 예약을 뺀 0.270 m다. 얇은 마감재를 택할 때도 바탕/깔개를 포함한 묶음의 완성면을 같은 datum에 맞춘다. 욕실 타일과 복도 카펫의 두께가 다르다는 이유로 실문에 새 단을 만들지 않는다. 이것은 공간 점유의 저작 선택이며 목재 부재 규격·경간·하중·내화 또는 차음 성능을 계산한 결과가 아니다. 실제 구조와 재료는 후속 외피/마감 단계에서 이 예약 안에 구성하고, 지탱할 수 없는 부재를 단순한 두꺼운 판으로 대체해 완성이라고 주장하지 않는다.

구조 바탕의 평면은 [본채 마감 안쪽 외곽](00-building.md#main-building-extent)을 소비하며 일반 실내 칸막이 아래에서도 연속된다. 통행을 위해 비우는 곳은 [기존 L형 계단 구멍](02-stair.md#stair-floor-opening) 하나다. 그 구멍을 위층 바닥 마감·공통 구조·아래층 천장 마감에 같은 경계로 전달한다. 각 room의 마감 구역은 자기 층의 실제 방 윤곽과 문턱 인계를 소비하므로 아래층 방 경계를 위층 바닥에 복제하거나 위층 방 경계로 아래층 천장을 나누지 않는다. 계단 구멍 아래의 현관 하부 대기 바닥은 ground-storey에 그대로 남고, 계단실 위의 본채 2층 천장도 유지한다. 층간 구멍을 모든 층판에 일괄 적용하지 않는다.

이 L형 빈 영역은 전면 안쪽 외곽에 닿으므로 평면 메쉬의 닫힌 내부 hole이 아니다. 남은 층판의 outer ring이 전면에서 계단실 둘레를 돌아 다시 전면으로 나오는 하나의 패인 윤곽을 갖는다. `triangulateAutoMovieRegion`과 `extrudeAutoMovieRegion`은 서로 접촉하는 outer/hole ring을 거부하므로 기존 전면 끝을 같은 좌표로 두고 외곽선을 구성한다. 통과를 위해 틈을 벌리거나 계단실 앞에 층판 띠를 남기지 않는다. 같은 윤곽을 두께 방향으로 생성하되 바닥·천장 마감과 계단 쪽 수직 마감의 기존 소유는 유지한다. 공개 입력 조건과의 이 대조는 실제 층판의 연결성·빈틈·법선 검사를 대신하지 않는다.

upper-storey의 실문 아래는 [문턱 중앙면의 마감 인계](07-boundary-assembly.md#interior-boundary-junctions)를 받으며 공통 구조를 문 폭마다 다시 끊지 않는다. 복도 린넨장 아래에도 같은 층간 바탕이 이어지고 장의 보이는 내부는 기존 upper-hall owner가 유지한다. ground-storey의 열린 현관/서비스 접속·공용부 개구부·계단 아래 영역은 ground 바닥 owner의 별도 바탕을 소비한다. 이 층간 마감 두께 예약을 1층 바닥에 옮겨 적용하지 않는다. 낮은 차고·포치·테라스에도 본채 층간 구조를 연장하지 않는다.

검사는 두 층 평면을 같은 좌표로 겹친 결과와 층간 전체 단면, 방 분할이 어긋나는 구간의 상하 마감/몸체 census다. 완성 높이·예약 합·계단 구멍 일치에는 [기존 비교 허용 오차](00-building.md#main-building-extent)를 적용한다. 구조 몸체 생성 책임, 마감 owner, 실제 surface id를 구분해 읽으며 이 문서의 배정표나 높이 산술은 산출물 측정으로 세지 않는다. 실제 구조·마감 적층·구멍·순높이와 프레임은 unverified다.

## 외벽과 계단 가장자리에서 닫히는 층간 단면 {#interstorey-edge-junctions}
<!--
@evidence principles/core/common.md#scope-preservation 층간 구조의 외벽 둘레, 실내 칸막이 상하 접촉, 계단 뒤 분리벽과 층판의 겹침, 계단 구멍 수직 단면 마감, 마지막 챌판과 도착 바닥, 기존 차고 구조 owner를 유지하는 차고 쪽 공유 벽 접점을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 외벽 둘레, 칸막이 상하 접촉, 계단 뒤 분리벽 겹침, 구멍 수직 단면 마감, 마지막 챌판·복도 도착, 차고 쪽 공유 벽 문단을 대조해 층간 가장자리마다 owner가 있음을 확인했다.
@evidence principles/core/common.md#substantive-completion 계단 구멍 단면 마감을 최대 0.015 m 두께로 층판 쪽에 들여 원래 통행 구멍의 완성 경계를 좁히지 않게 한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 계단실 연속 마감을 최대 0.015 m 층판 쪽으로 들이고 구조 바탕이 그만큼 물러나 02-stair 통행 구멍의 완성 경계를 좁히지 않는다는 문장을 대조해 다음 층이 구멍 단면 두께를 정할 일이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 외벽 안쪽 면은 00, 칸막이 높이 역할은 07, 계단 경계 높이는 stair-boundary-heights에서 받는다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 외벽 안쪽 면을 00-building#main-building-extent, 칸막이 높이 역할을 07#interior-boundary-ownership, 분리벽·보호 벽 높이를 02-stair#stair-boundary-heights 링크로 받는지 대조해 가장자리 진술의 근거를 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 표면 분해 조건을 계단실 연속 수직 마감은 stair, 구조 가장자리는 upper, 도착 바닥은 upper-hall로 나누는 소유로 세분한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 surface-allocation의 계단 구멍·접합 owner 선언을 구멍 단면은 stair.ts 연속 마감·upper.ts 구조 가장자리, 도착 끝은 upper-hall 바닥·stair 챌판으로 나눈 결정이 부모에 없음을 확인했다.
@evidence principles/design/spaces.md#space-topology 층판을 외장 바깥까지 내밀어 띠를 노출하지 않고 마지막 챌판을 복도 도착 바닥 끝에 접하게 하며 보호 벽/난간을 열린 도착 끝까지 늘리지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 층판 가장자리를 사이딩·벽돌 사이로 내밀지 않고 마지막 챌판을 upper-hall 도착 바닥 끝에 접하며 보호 벽/난간을 열린 도착 끝까지 늘리지 않는 문장을 대조해 도착과 외피 관계가 메쉬 없이 읽힘을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 계단 뒤 분리벽과 층간 바탕이 겹치는 구역은 upper 층판 owner가 한 번 생성하고 그 벽 몸체에서 뺀다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 02-stair#stair-boundary-heights의 뒤쪽 분리벽이 층간 바탕과 겹치는 몸체를 upper 층판 owner가 한 번 만들고 벽 몸체에서 빼되 높이 역할과 난간은 유지하는 문장을 대조해 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 외벽 둘레, 공유 벽 접점, 칸막이 상하, 구멍 꺾임·전면 끝·상부 도착 단면과 계단/복도 양방향 시야에서 노출된 층판 띠·막힌 도착·마감 후 머리 공간을 읽게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 외벽-층간 전체 둘레, 공유 벽 접점, 칸막이 상하, 구멍 꺾임·전면 끝·상부 도착 단면과 계단/복도 양방향 시야를 04-observations에 더하는 문단을 대조해 층판 띠·막힌 도착 주장이 반증 가능함을 확인했다.
@evidence settings/20-verification.md#surface-allocation 층판과 계단 구멍의 몸체·수직 마감·도착 바닥을 각각 기존 소유에 잇는다.
@evidenceReview settings/20-verification.md#surface-allocation #a6f76e5 surface-allocation의 층판·계단 구멍 owner 요구를 외벽 두께 구역의 입면/공유 벽 owner 유지, 구멍 단면의 stair.ts 단일 마감, 방 마감 owner의 테두리 덧씌움 금지에 대조해 표면 분해가 이어짐을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work surface-allocation의 "각 층 바닥·천장·계단 구멍과 접합의 owner"를 층간 가장자리에 대조했고 구조·수직 마감·도착 바닥을 기존 owner로 나눌 수 있어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 surface-allocation의 층 바닥·천장·계단 구멍·접합 owner 요구를 외벽 둘레·분리벽 겹침·구멍 단면·도착 끝 네 가장자리에 대조해 기존 owner 분할로 부모 수정 없이 성립함을 확인했다.
-->

[층간 구조](#interstorey-floor-boundary)는 본채 내부에서 [외벽의 동일 안쪽 면](00-building.md#main-building-extent)에 닿는다. 외벽의 두께 구역은 기존 입면/공유 벽 owner가 유지하고, 층판 가장자리를 외장 바깥까지 연장해 사이딩이나 벽돌 사이에 띠를 노출시키지 않는다. 두 층 사이 높이 구간의 외벽도 연속해서 닫는다. 내부 바닥과 천장을 붙였다는 이유로 외벽 그 구간을 비우거나, 반대로 외벽 몸체를 방 안으로 늘려 실내 순폭을 줄이지 않는다. 후속 받침·장선 끝 등 실제 구조 접합은 같은 벽 예약 안에서 기존 벽 owner와 층간 구조 owner가 한 접촉 경계를 공유해야 하며 겹친 고형체를 지지 증거로 쓰지 않는다.

일반 실내 칸막이는 [층별 높이 역할](07-boundary-assembly.md#interior-boundary-ownership)을 유지한다. 아래층 칸막이 상단은 아래 완성 천장에, 위층 칸막이 하단은 위 완성 바닥에 닿는다. 칸막이의 아래/위 숨은 지지 접합은 구조 예약 안에서 해결하고 보나 벽이 완성 천장 아래로 내려오면 해당 방·개구부·경로의 순높이를 다시 판단한다. 공간 입력의 충돌을 천장 안으로 숨겼다고 간주하지 않는다. 방의 보이는 천장/바닥은 자기 안쪽 벽 면에서 닫히고 바탕의 전체 평면을 그대로 보이는 마감으로 사용하지 않는다.

[계단 뒤쪽의 분리벽](02-stair.md#stair-boundary-heights)처럼 두 층 사이 높이까지 이어지는 내부 구조가 층간 바탕과 만나는 경우, 겹치는 몸체 구역은 upper 층판 owner가 한 번만 생성하고 해당 벽 몸체에서 그 구역을 뺀다. 이는 접합 몸체의 분할이며 뒤쪽 분리벽의 높이 역할이나 위 복도 난간을 삭제하는 지시가 아니다. 그 앞에서 계단실로 보이는 벽/층판 단면 마감은 stair owner가 하나의 연속 면으로 잇고 같은 높이에 두 마감을 포개지 않는다. 외벽 두께 구역은 앞 문단의 외벽 owner 배정을 유지한다.

계단 구멍의 수직 두께 단면은 `src/spaces/floors/upper.ts`의 공통 구조 가장자리를 소비하되, 계단실에서 보이는 연속 마감은 `src/spaces/stair.ts`가 통째로 맡는다. 이 마감의 두께는 최대 0.015 m를 남겨 둔 층판 쪽으로 들여 배치하고 구조 바탕이 그 자리만큼 물러난다. [원래 통행 구멍](02-stair.md#stair-floor-opening)의 완성 경계를 마감 두께만큼 안으로 좁히지 않는다. 볼록/오목 모서리와 전면 외벽에 닿는 끝에서도 같은 경계를 공유하고 방 마감 owner가 별도 테두리를 덧씌우지 않는다. 보호 벽이 이미 단면을 가리는 구간은 [계단의 높이별 경계](02-stair.md#stair-boundary-heights)와 만나며 노출되지 않는 겹친 장식 띠를 만들지 않는다.

위 flight의 마지막 챌판은 [기존 상층 복도 도착](rooms/upper-hall.md#upper-hall-plan) 바닥 끝에 접한다. 그 끝의 공통 구조는 upper 층판 owner, 보이는 복도 바닥은 upper-hall owner, 마지막 챌판과 계단 손잡이는 stair owner가 맡는다. 도착 바닥을 별도 계단 디딤판으로 한 번 더 포개거나 얇은 틈을 남기지 않는다. 계단 구멍의 나머지 둘레에 필요한 보호 벽/난간을 열린 도착 끝까지 연장하지 않는다. 차고 쪽 공유 벽은 [기존 차고 구조 owner](00-building.md#attached-garage-extent)를 유지하고 차고 내부 천장이나 머드룸 한 단을 본채 층간 가장자리로 바꾸지 않는다.

검사 주소는 외벽과 층간 구조가 만나는 전체 둘레, 공유 벽 접점, 모든 실내 칸막이의 상하 접촉, 계단 구멍의 각 꺾임·전면 끝·상부 도착 단면과 계단/복도 양방향 시야다. [전체 관찰](04-observations.md#spatial-observation-derivation)에 이를 더하며 실제 겹침·빈틈·노출된 층판 띠·막힌 도착과 마감 후 머리 공간을 읽는다. 구조 안전·공개 엔진에서의 표현·실제 표면 census·부재 접합·GPU 프레임은 unverified다.
