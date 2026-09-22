# 지상층 바닥과 건물 출입 단면

## 본채의 연속 바닥 바탕 {#main-ground-floor-base}
<!--
@evidence principles/core/common.md#scope-preservation 본채 전체와 칸막이·계단·외투장 아래 바탕을 연속 배정한다.
@evidence principles/core/common.md#substantive-completion 마감 묶음 0.025 m와 아래 지지 바탕 0.15 m를 선택한다.
@evidence principles/core/common.md#declared-basis ground-storey 완성 높이를 받아 아래면을 산출한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주택 바닥 요구를 지하실 없는 지면 지지 방식으로 특정한다.
@evidence principles/design/spaces.md#space-topology 층간 L형 구멍을 1층에 빼거나 수납 아래 통로를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority ground.ts의 한 바탕 위 마감은 방별 원래 윤곽을 소비한다.
@evidence principles/design/spaces.md#space-verification-address 실문 아래·계단 발치·서로 다른 마감 단면의 틈과 턱을 검사한다.
@evidence settings/10-house.md#main-mass 직사각 본채의 1층 바닥을 유지하며 계단 때문에 하부 대기를 비우지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 두 층 본채와 추가 보이드 금지를 지상 바닥에 적용했고 연속 바탕 선택에 부모 제약 부족은 없었다.
-->

본채 ground-storey의 바탕은 [마감 안쪽 외곽](00-building.md#main-building-extent) 전체를 받는 연속 지면 지지 방식으로 택한다. 지하실·사람이 드나드는 바닥 밑 공간·새 계단을 만들지 않는다. 완성 높이는 [ground-storey datum](01-storeys.md#storey-datums)을 소비한다. 실내 칸막이와 계단 아래에서도 바탕은 이어지고 [층간 L형 구멍](02-stair.md#stair-floor-opening)을 이 바닥에서 빼지 않는다. 첫 챌판 앞 하부 대기는 기존 현관 바닥이며 별도 계단 디딤을 더하지 않는다.

완성 바닥에서 아래로 마감/깔개 묶음 0.025 m, 그 아래 지지 바탕 0.15 m를 예약한다. 바탕 아래면은 완성 바닥에서 두 예약의 합만큼 내린 높이다. 이 예약은 평탄한 실내 마감과 그 아래 받침을 구별하기 위한 공간 선택이고 구조 부재의 용량·재료 성능을 검증한 값이 아니다. 마루·타일 등 실제 마감이 달라도 같은 묶음 안에서 바탕 높이를 맞추며 파우더룸이나 세탁실 문 앞에 의도하지 않은 단을 만들지 않는다. 층간 구조와 같은 숫자가 있어도 [그 구조의 적층](08-floor-assembly.md#interstorey-floor-boundary)을 1층에 복사하는 규칙은 아니다.

`src/spaces/floors/ground.ts`가 공통 바탕을 한 번 소유한다. 각 방의 보이는 바닥은 [기존 room owner](03-surface-owners.md#interior-surface-handoff)가 자기 안쪽 윤곽과 [문턱 전환선](07-boundary-assembly.md#interior-boundary-junctions)을 소비한다. 계단 아래 외투 수납의 내부는 entry owner, 계단 몸체에 가려진 지지 바탕은 ground owner다. room별 바탕 상자를 포개거나 수납 바닥을 사람의 통과 경로로 추가하지 않는다. 칸막이/계단의 지지 접촉은 마감 묶음 안에서도 끊기지 않게 단면으로 배정하고 마감판만으로 구조를 지지했다고 세지 않는다.

검사는 1층 전체 바닥 평면과 모든 실내 문 아래, 칸막이/계단 발치, 외투장, 서로 다른 마감 사이 단면이다. [공유 허용 오차](01-storeys.md#storey-datums)로 완성 높이·바탕 연속·겹침/빈틈을 대조하고 [전체 관찰](04-observations.md#spatial-observation-derivation)에 이를 더한다. 실제 바탕·마감 적층·지지·통행은 unverified다.

## 낮은 차고의 독립 바닥 {#garage-ground-floor-base}
<!--
@evidence principles/core/common.md#scope-preservation 빈 차고의 낮은 바닥과 문·수납 발치의 접촉을 배정한다.
@evidence principles/core/common.md#substantive-completion 자기 완성 높이 아래 0.15 m 콘크리트 바탕을 예약한다.
@evidence principles/core/common.md#declared-basis 차고 외곽과 낮은 datum을 받아 평탄면을 유지한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 차고 콘크리트 요구에 독립 지면 지지와 상면 단일 소유를 더한다.
@evidence principles/design/spaces.md#space-topology 본채 바닥을 연장해 머드룸 단을 없애지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority garage 몸체와 garage-interior 노출 면을 한 경계로 잇는다.
@evidence principles/design/spaces.md#space-verification-address 차고문 끝·머드룸 단·선반 발치에서 겹침과 뜬 지지를 찾는다.
@evidence settings/10-house.md#garage 차량 없이도 바닥·레일·선반이 실제로 접하는 차고 내부를 설계한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 콘크리트 바닥과 머드룸 직접 연결은 낮은 독립 바탕에서 양립하므로 부모 차고 설정을 수정하지 않았다.
-->

차고의 바탕은 [차고 안쪽 외곽](00-building.md#attached-garage-extent)을 받으며 [자기 완성 바닥](01-storeys.md#ground-threshold-datums)에서 아래로 0.15 m를 예약한다. 본채 바닥을 이쪽으로 연장하거나 차고를 본채 높이로 올리지 않는다. 이 차고는 지면에 연속해서 지지되는 콘크리트 바닥으로 계획하며 지하 공간은 없다. 실내 바닥은 기존 대기/수납/문 이동 예약이 소비하는 평탄면을 유지한다. 배수 경사를 새로 발명하여 머드룸 한 단이나 전면 문턱 높이를 바꾸지 않는다. 실제 배수·구조 성능은 아직 검증하지 않았다.

공통 바탕은 `src/spaces/garage.ts`, 그 바탕의 노출 윗면과 실내 마감은 `src/spaces/rooms/garage-interior.ts`가 소유한다. 노출 콘크리트 면은 같은 바탕의 경계이므로 같은 높이에 두 번째 불투명 바닥판을 포개지 않는다. 마감 처리가 필요하면 기존 완성 높이를 유지하며 지지 바탕과 한 번만 맞물리게 배정한다. 수납/레일의 발치는 이 실제 바닥을 소비하며 차량을 추가하지 않는다.

검사는 차고 바닥 전체 평면, 전면문 양 끝과 머드룸의 단, 선반/작업대 발치와 네 벽의 하단 단면이다. [차고의 내부 접근](rooms/garage-interior.md#garage-use-routes)과 [전체 관찰](04-observations.md#spatial-observation-derivation)을 유지하며 본채 바닥과 겹친 몸체, 떠 있는 레일/선반, 완성 높이가 다른 문턱을 찾는다. 실제 바탕·순높이·접지·콘크리트 읽힘은 unverified다.

## 외벽 두께 안에서 이어지는 네 출입 경계 {#ground-threshold-junctions}
<!--
@evidence principles/core/common.md#scope-preservation 현관·정원문·차고문·머드룸 문 아래 네 지지 단면을 배정한다.
@evidence principles/core/common.md#substantive-completion void 폭에서 외벽 두께를 가로지르는 바탕과 문턱 소유를 결정한다.
@evidence principles/core/common.md#declared-basis 각 문 owner의 폭과 실내외 datum을 그대로 소비한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 실제 문턱 요구에 평탄 접속과 머드룸 한 단의 서로 다른 지지 방식을 더한다.
@evidence principles/design/spaces.md#space-topology 창/닫힌 벽 아래로 보행 마감을 확장하거나 두 번째 단을 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 문 아래 바탕은 바닥 owner가 받고 벽 몸체에서 해당 점유를 뺀다.
@evidence principles/design/spaces.md#space-verification-address 모든 문 중앙·양 문설주와 안팎 대기에서 틈·겹침·순폭을 검사한다.
@evidence settings/10-house.md#openings 문틀·문턱이 구별되고 실제 바닥에 받쳐지도록 네 외부 연결의 단면을 정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 문턱 읽힘과 서비스의 차고 연결을 검토해 기존 높이에서 지지 경계를 만들 수 있어 부모 출입 조건 수정은 없다.
-->

본채와 차고의 실내 바닥은 평면에서 벽 안쪽에 끝나지만, 출입 개구부 아래에는 벽 두께를 지나는 지지 바탕이 필요하다. 아래 네 경계는 원래 문 owner의 거친 void 폭과 안팎 벽 면을 소비한다. 바탕은 자기 실내 바닥 예약 높이로 그 띠 전체를 받치고, 문틀·문턱의 최종 순폭은 충전 부재를 넣은 뒤 읽는다. 창 아래나 닫힌 벽 아래까지 바닥 마감을 연장하는 규칙은 아니다.

| 경계와 연결 | 바탕의 끝과 단면 | 문턱의 완결 소유 |
| --- | --- | --- |
| [front-door](rooms/entry.md#entry-plan): 현관 ↔ 포치 | 본채 ground 바탕이 전면 벽의 바깥 면까지 이어지고 [포치 바닥](porch.md#porch-platform-access)은 그 면에서 만난다. 두 완성 바닥의 datum을 유지한다. | `src/spaces/envelope/front.ts`가 벽 두께 안의 문턱/충전을 맡는다. 상면 돌출은 양쪽 완성 바닥 위 0.02 m 이내로 예약하고 실내 entry 마감과 바깥 porch 마감은 각 안팎 벽 면에서 만난다. |
| [garden-door](envelope/rear.md#garden-door): 공용부 ↔ 테라스 | 본채 ground 바탕이 후벽 바깥 면까지 이어지고 [테라스](site/terrace.md#garden-terrace-plan)가 그 면에서 만난다. | `src/spaces/envelope/rear.ts`가 기존 문턱 돌출 한계를 소비한다. common 바닥은 안쪽 면까지, terrace 바닥은 바깥 면부터이며 같은 문턱판을 두 실에서 만들지 않는다. |
| [garage-front-door](envelope/front.md#garage-front-opening): 차고 ↔ 차도 | 차고 바탕이 자기 전면 벽 바깥 면까지 이어지고 [차도](site/driveway.md#driveway-plan)가 같은 끝선 높이에서 만난다. | `src/spaces/rooms/garage-interior.ts`가 벽 두께 안까지 연속된 콘크리트 상면을 맡고 front owner의 닫힌 문 하부 밀폐재가 이 면에 닿는다. 바닥을 가로막는 별도 높은 문턱은 없다. |
| [laundry-garage-door](rooms/laundry.md#laundry-plan): 머드룸 ↔ 차고 | 본채 ground 바탕이 공유 벽의 차고 쪽 면까지 높은 문턱을 받친다. 차고 바닥은 그 면에서 기존 낮은 datum으로 끝나므로 기존 한 단이 남는다. | `src/spaces/rooms/laundry.ts`가 문턱 상면과 차고 쪽에 노출된 챌면을 통째로 맡는다. 상면은 본채 완성 높이에 맞추고 차고 바닥은 그 챌면 아래끝에 닿는다. 새로운 디딤판이나 두 번째 단을 추가하지 않는다. |

각 문 아래의 바탕 예약과 벽 몸체가 겹치는 구역은 위 바닥 owner가 한 번만 생성하고 벽 owner는 그 예약을 제외한다. 개구부 Y 하한 아래에 벽을 남긴 채 바닥을 포개지 않는다. 그보다 아래의 기단/지지 접합은 [지면 인계](#ground-support-handoff)를 따르며 문 아래 전체 벽을 지면까지 삭제하지 않는다. 문설주의 받침과 문턱은 같은 단면에서 맞물려야 한다. 보이는 문턱/챌면 마감도 기존 바탕/벽과 겹치는 별도 면을 남기지 않고 해당 경계의 한 소유자가 닫는다.

검사는 네 출입구 모두의 중앙 및 양 문설주 단면, 안팎 대기, 닫힌 문과 열린 문 아래다. 포치/테라스/차도와 방의 서로 다른 바닥 owner를 따라가며 빈틈·겹침·의도하지 않은 턱, 머드룸 한 단의 위치와 차고 하부 대기를 읽는다. [전체 관찰](04-observations.md#spatial-observation-derivation)의 각 문/방/외부 구역 질문은 줄이지 않는다. 설계 연결과 실제 문턱 부재·순폭·문 하단 작동·양방향 통행은 별개이며 후자는 unverified다.

## 바닥 아래 지지와 지도 지표의 인계 {#ground-support-handoff}
<!--
@evidence principles/core/common.md#scope-preservation 바닥 아래 채움·기단의 책임과 아직 없는 지표 입력을 드러낸다.
@evidence principles/core/common.md#substantive-completion 본채/차고 바탕과 외벽 두께 구역의 지지 소유를 나눈다.
@evidence principles/core/common.md#declared-basis 지지 하단과 기초 깊이는 maps 지표 없이 확정하지 않는다고 명시한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지와 집의 접촉 요구를 지표를 받은 뒤 대조할 바탕/벽 접면으로 특정한다.
@evidence principles/design/spaces.md#space-topology 공중 빈층을 지지로 세거나 본채 바탕을 포장 전체 아래로 늘리지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 노출 기단 마감은 입면이 통합하고 바닥 owner가 외장 띠를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 전체 둘레·출입·포장 접점의 높이 단면과 낮은 시야를 지정한다.
@evidence settings/10-house.md#site-identity 측량값을 가정하지 않고 저작 maps 지표와 건물 지지의 실제 접촉을 요구한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 대지 지표를 maps가 정한다는 설정을 검사해 미수령 하단을 노출하는 인계로 배정했으며 부모 대신 지반값을 발명하지 않았다.
-->

이 건물은 위 본채/차고 바탕 아래를 연속해서 받치는 채움과 가장자리 지지로 계획한다. 바탕 아래에 보이지 않는 빈 공중층을 남기고 두꺼운 바닥판만으로 접지를 주장하지 않는다. 채움의 하단, 기단/기초의 깊이·폭과 실제 구조 부재는 현재 미결이다. [maps 지표 입력](site/00-access.md#map-handoff-inputs)이 없으므로 임의의 수평 지표나 지반 성능을 확정하지 않는다. 외부 완성 지표가 채움의 지지면이나 기초 하단과 같은 값이라는 가정도 하지 않는다.

본채 실내 바탕 아래의 지지 구역은 ground 바닥 owner, 차고 것은 garage 구조 owner가 맡는다. 외벽/공유 벽 두께 구역의 기단은 기존 벽 구조 owner가 소유하고, 실제 지표에 드러나는 수직 마감은 각 완결 입면 owner가 통합한다. 실내 바탕의 가장자리를 외장 바깥으로 내밀어 기단 띠를 중복 생성하지 않는다. 포치·테라스·차도는 자기 owner의 지지를 유지하고 본채 바탕을 그 전체 아래로 확장하지 않는다. 지하 접합에서도 두 owner의 몸체는 같은 면에서 만나야 하며 중복 점유를 지지 증거로 세지 않는다.

maps에서 받아야 하는 것은 기존 좌표계의 실제 외부 지표와 접촉선이다. 그 입력을 받은 뒤 건물 owner가 바탕 아래면·외벽/문턱·지표를 함께 놓고 지지 하단과 기단을 결정하며, 불가능한 접합은 원래 입력으로 돌아가 수정한다. 지표로 완성 바닥을 덮거나 건물을 통째로 옮겨 접합을 숨기지 않는다. 벽돌/사이딩의 마감 경계와 방습/단열/배수/구조 성능은 후속 해당 owner가 다룰 미완료이고 이 공간 예약으로 지불하지 않는다.

검사는 두 바닥 아래면과 전체 건물 둘레, 공유 벽, 네 출입 경계, 포치/테라스/차도 접점을 포함한 높이별 단면과 외부 낮은 시야다. [site 인계](site/00-access.md#map-handoff-inputs)와 [전체 관찰](04-observations.md#spatial-observation-derivation)에 실제 지표/지지/마감의 상대 owner와 접촉을 함께 읽는 질문을 추가한다. 현재 maps binding·채움/기단/기초·접지·구조 성능·GPU 그림자는 unverified이며 지상층 바닥 구현 완료를 주장하지 않는다.
