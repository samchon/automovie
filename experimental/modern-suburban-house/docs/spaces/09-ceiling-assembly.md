# 지붕 아래에서 닫히는 실내 천장

## 본채 상층과 계단실의 같은 상부 경계 {#upper-ceiling-closure}
<!--
@evidence principles/core/common.md#scope-preservation 상층 방과 높은 계단실 천장을 모두 닫는다.
@evidence principles/core/common.md#substantive-completion 완성 천장 위 0.18 m를 마감 0.015 m와 바탕 0.165 m로 나눈다.
@evidence principles/core/common.md#declared-basis upper-storey datum과 안쪽 외곽을 사용한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 층 매스에서 최상부의 구멍 없는 바탕과 계단 천장 구역을 결정한다.
@evidence principles/design/spaces.md#space-topology 지붕 속에 별도 방·사다리를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 바탕은 upper.ts, 방 천장은 room, 계단실 마감은 stair가 맡는다.
@evidence principles/design/spaces.md#space-verification-address 반사 천장과 출발점 단면으로 낮은 판의 계단 막힘·누락 띠를 찾는다.
@evidence settings/10-house.md#main-mass 정해진 상층 순높이를 수평 천장으로 유지하고 지붕을 별도 거주 층으로 쓰지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 본채 높이와 보이드 금지를 검사해 계단실까지 같은 높은 천장으로 닫을 수 있어 부모 수정은 없었다.
-->

본채의 최상부 실내 경계는 [upper-storey의 완성 천장](01-storeys.md#storey-datums) 높이에 있는 수평 천장이다. 공통 바탕의 평면은 [본채 마감 안쪽 외곽](00-building.md#main-building-extent) 전체를 소비한다. [층간 바닥](08-floor-assembly.md#interstorey-floor-boundary)과 별개의 경계이며, 그 L형 계단 구멍을 이 천장에 복제하지 않는다. 지붕 아래의 빈 부피는 거주 층·방·복도·수납 통로가 아니고 실내에서 올라가는 문/사다리를 만들지 않는다. 경사진 지붕의 아래면을 방 천장으로 대신하여 침실 높이를 바꾸지 않는다.

천장 마감과 바탕을 합친 수직 점유 예약은 완성 천장 위로 0.18 m다. 그 아래 0.015 m는 보이는 천장 마감, 나머지 0.165 m는 바탕/지지 부재의 예약으로 택한다. 천장 마감의 아래면이 기존 완성 높이이며 두께를 실내 쪽으로 덧붙이지 않는다. 이 값은 공간 점유 선택으로, 장선의 규격·간격·경간·하중을 검증한 결과가 아니다. 후속 부재는 예약 안에 실제 지지 관계를 구성하고 숨은 바탕 전체를 불투명 고형 판으로 채운 것만으로 시공 가능성을 주장하지 않는다.

`src/spaces/floors/upper.ts`가 본채의 이 공통 바탕을 한 번 소유하고 [각 upper-storey 방 owner](03-surface-owners.md#interior-surface-handoff)가 자기 방 안에서 보이는 천장을 소유한다. 방별 완성 천장 윤곽은 그 방의 안쪽 벽 면에서 끝나며 인접 방이 같은 마감판을 다시 만들지 않는다. 칸막이 위의 숨은 바탕은 연속되고 낮은 붙박이장 때문에 지붕까지 열린 구멍을 남기지 않는다. 방/수납 분할은 기존 owner를 소비하며 천장 분할을 이유로 새 공간을 만들지 않는다.

[main-stair](02-stair.md#stair-floor-opening) 위의 마감은 `src/spaces/stair.ts`가 완결 면을 맡는다. 평면은 기존 계단 구멍의 투영과, 그 둘레 보호/분리 띠 중 천장 높이에서 노출되는 부분을 합친다. [경계별 높이 역할](02-stair.md#stair-boundary-heights)을 소비하여 천장까지 닿는 침실 분리벽 부분은 제외하고, 낮은 뒤쪽 벽과 난간 위의 띠는 모서리까지 이 계단 천장에 포함한다. 뒤쪽의 마감 끝은 기존 상층 복도의 안쪽 끝과 만나므로 보호 띠 위에 빈틈이나 중복 판이 남지 않는다. 이는 높은 천장 마감의 배정이며 층간 구멍/바닥과 난간 높이는 바꾸지 않는다. 이 계단은 ground-storey 소속이어도 자기 위쪽 천장에는 upper-storey의 완성 천장 높이를 소비한다. ground-storey 천장 높이의 판을 계단 중간에 덧씌우지 않는다. 위층 복도의 열린 도착 위에서도 같은 높이의 두 소유 면이 만나 상부 경계가 끊기지 않는다. 기존 전면 계단 창은 그대로 계단실에 바인딩한다.

검사는 상층 반사 천장 평면, 계단 출발부터 높은 창/천장까지의 단면, 상층의 모든 방과 계단실에서 위를 보는 관찰이다. 계단 구멍을 복제한 구멍, 낮은 수납/난간 위 누락, 방 경계의 겹친 마감, 계단을 가로막는 아래층 천장판을 찾는다. [공유 허용 오차](01-storeys.md#storey-datums)로 높이/접촉을 대조하며 실제 바탕·마감·공간 binding·순높이·프레임은 unverified다.

## 차고문 이동 구역 위의 천장 {#garage-ceiling-closure}
<!--
@evidence principles/core/common.md#scope-preservation 차고의 독립 천장과 레일·공유 벽 접점을 배정한다.
@evidence principles/core/common.md#substantive-completion 본채와 다른 datum 아래에 패널 이동과 천장 바탕의 위치를 구분한다.
@evidence principles/core/common.md#declared-basis 차고 안쪽 외곽과 공통 천장 점유 예약을 인용한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 빈 차고의 완성 요구에 레일 위 천장 폐합과 간섭 검사 구역을 더한다.
@evidence principles/design/spaces.md#space-topology 지붕 밑 수납층을 만들거나 본채 층판을 차고로 늘리지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority garage 구조와 garage-interior의 보이는 천장을 구분한다.
@evidence principles/design/spaces.md#space-verification-address 레일 방향 단면과 문 열림 상태에서 행거·등기구 간섭을 확인한다.
@evidence settings/10-house.md#garage 문 레일·천장·수납을 갖춘 빈 차고의 상부 공간을 낮은 박공 아래 닫는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 설정의 닫힌 패널문과 실제 레일/천장 요구를 분리해 배정할 수 있었고 차량이나 추가 층을 요구하지 않는다.
-->

차고는 [자기 바닥/천장 datum](01-storeys.md#ground-threshold-datums)을 갖는 ground-storey 부속 공간이다. 천장 바탕은 [차고의 마감 안쪽 외곽](00-building.md#attached-garage-extent) 전체를 덮고 [차고 지붕](roof/00-junctions.md#roof-mass-allocation) 아래에서 닫힌다. 본채 바닥/천장을 이쪽으로 늘리거나 공유 벽을 넘어 같은 높이의 방을 만들지 않는다. 수직 점유와 마감 두께는 [위 천장 예약](#upper-ceiling-closure)을 차고 완성 천장 기준으로 소비한다. 차고 지붕 밑 공간에도 별도 방·수납층·추가 계단을 두지 않는다.

바탕은 `src/spaces/garage.ts`, 실내에서 보이는 전체 천장 마감은 `src/spaces/rooms/garage-interior.ts`가 소유한다. 공유 벽과 나머지 세 외벽의 안쪽 면에 같은 천장 가장자리가 닿고, 네 벽의 구조/외장 owner는 그대로 유지한다. 차고 밖의 처마 밑면은 지붕 owner의 별도 외부 표면이므로 실내 천장판을 처마 끝까지 밀어 내지 않는다.

[열린 전면 패널/가이드의 예약](envelope/front.md#garage-front-opening)은 완성 천장 아래에 유지한다. 천장 datum과 그 예약의 상단 사이 높이 차는 입력상 0.05 m다. 이 차이는 실제 레일/천장 간섭 검사의 결과가 아니다. 후속 보·행거·체결부와 등기구를 배치할 때 움직이는 패널의 전체 점유를 가로막지 않도록 검사하며, 천장 높이를 올리거나 패널을 얇게 축소해 충돌을 숨기지 않는다. 레일을 지지하는 고정 접합 자체와 그 사이를 지나는 움직이는 패널을 구별한다. 후벽 선반/작업대의 높이는 [차고 내부 owner](rooms/garage-interior.md#garage-storage-use)를 그대로 소비한다.

검사는 차고 반사 천장 평면, 전면 레일을 따라 지붕까지 보는 단면, 공유 벽 접점, 네 안쪽 모서리와 문 닫힘/열림 상태의 실내 시야다. 위층 바닥으로 잘못 생성된 천장, 지붕/천장 겹침, 레일과 고정 부재의 충돌, 천장 마감 사이 빈틈을 찾는다. 실제 순높이·문 작동·부재 지지·마감과 빈 차고의 프레임은 unverified다.

## 낮은 지붕과 천장 바탕의 접합 여유 {#ceiling-roof-clearance}
<!--
@evidence principles/core/common.md#scope-preservation 천장 예약과 낮은 지붕·단차·외벽 접촉을 함께 대조한다.
@evidence principles/core/common.md#substantive-completion 분리 목표 0.010 m를 두고 실내 끝선에서 여유 식을 명시한다.
@evidence principles/core/common.md#declared-basis 지붕 아래면·벽 두께·천장 datum을 원래 owner에서 대입한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 본채 높이 요구에 천장 바탕 위의 분리 조건을 추가한다.
@evidence principles/design/spaces.md#space-topology 처마 끝 높이로 실내 천장을 낮추지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 두께 전체는 지붕 함수로 닫고 천장은 안쪽 벽 면에서 끝낸다.
@evidence principles/design/spaces.md#space-verification-address 두 예시 산술만으로 통과시키지 않고 모든 지붕 구역 단면을 검사한다.
@evidence settings/10-house.md#main-mass 상층 순높이와 낮은 지붕을 동시에 유지할 천장 상부 여유를 설계한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 설정의 높이/지붕 범위를 적용한 실내 끝선에 여유가 있어 부모 범위를 바꿀 필요는 없으며 실제 부재 적합성은 미검증이다.
-->

천장은 [본채 실내 평면](00-building.md#main-building-extent)과 [차고 실내 평면](00-building.md#attached-garage-extent) 각각의 안쪽 면까지이고, 지붕은 [자기 외곽과 교차 경계](roof/00-junctions.md#roof-shared-edges)를 갖는다. 각 천장 예약 상단을 그 평면 위에 실제로 배정된 지붕의 아래면과 비교한다. 지붕 날씨 면에서 임의 두께를 다시 정하지 않고 [기존 아래면 함수](roof/00-junctions.md#roof-profile-datums)를 소비한다. 본채 외벽 바깥 선이나 처마 끝의 더 낮은 높이를 실내 천장 윤곽의 높이로 혼동하지 않는다.

평탄 천장 예약의 상단과 지붕 아래면 사이에는 최소 0.010 m의 분리 여유를 설계 목표로 둔다. 현재 입력에서 본채의 가장 낮은 대조 구간은 오른쪽 지붕 아래 전후 실내 끝선이다. 그 아래면과 상층 천장 예약 상단의 차는 `(5.95 + (7/12) × 0.25 - 0.24) - (5.66 + 0.18)`로 약 0.0158 m다. 차고의 전후 실내 끝선에서는 `(2.95 + (5/12) × 0.25 - 0.24) - (2.55 + 0.18)`로 약 0.0842 m다. 식의 값은 위 링크의 지붕·외벽 두께·완성 천장과 이 문서의 점유 예약을 대입한 표기다. 독립 치수 입력으로 복제하지 않으며 원래 owner가 바뀌면 같은 관계로 다시 산출한다. 이는 설계식 대조이고 실제 산출물 계측이나 구조/환기/단열 적합성 결과가 아니다.

천장 바탕은 안쪽 벽 면에서 끝나고 외벽 두께 구역은 입면/공유 벽 owner가 [각 위치의 지붕 아래면](roof/00-junctions.md#roof-wall-head-junctions)까지 닫는다. 외측 벽 높이를 안쪽까지 수평 연장하여 천장 옆에 틈을 남기지 않는다. 벽에 받치는 단부는 그 벽과 하나의 접촉 경계를 공유하며 두 owner가 같은 접합 몸체를 포개지 않는다. 지붕 단차·박공 교차·굴뚝 주변의 실제 부재는 각 지붕/입면 owner를 소비하고, 천장 예약 바깥으로 내려오는 부재가 생기면 단면과 해당 실의 순높이를 다시 검사한다. 지지 부재의 의도된 접합은 이 평탄 예약 사이의 분리 여유와 구별해 명시하며 관통/겹침을 임의 접합으로 인정하지 않는다.

검사는 모든 지붕 배정 구역의 천장 단면, 낮은 앞뒤 끝선과 네 외벽 모서리, 본채 지붕 단차 아래, 계단실 위, 차고 공유 벽/레일 구간이다. 같은 산출물에서 지붕 아래면·천장 예약·실제 부재와 접합 id를 읽고 [전체 관찰](04-observations.md#spatial-observation-derivation)에 안팎 시야를 더한다. 숫자 두 개만 맞춰 나머지 부재를 통과 처리하지 않는다. 실제 최소 여유·중복/빈틈·표면 census·머리 공간·GPU 관찰은 unverified다.
