# 지상층의 높이와 접지

## 하나의 지상층 {#ground-storey}

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 중정/도로의 국소 단차와 제단 석단을 별도 층으로 등록하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 완성면·구조 두께·널판/보 높이를 함께 정해 바닥과 천장의 단면 입력이 있다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 생산 Y 기준과 바닥 접근을 소비하며 실체 단차 통과는 unverified라고 한정했다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 천장 위 구조 틈에 진입 문·바닥·사다리가 없고 제실/주랑은 경사 하부를 따른다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 층은 공통 높이/두께만 맡고 방 마감과 제단 석단을 새로 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 종횡 단면과 문턱에서 끊긴 주랑 또는 0.02m 초과 서비스 단차가 반증된다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 단층 약속을 공간별 완성면과 2.92m 보 아래 예산으로 실제 단면화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 낮은 널판/노출 박공과 정문 두 단·중정 한 단이 양립하므로 층 수나 접근 제한을 수정하지 않았다.
@evidenceReview settings/00-delivery.md#coordinates #4d2b0d4 주랑 완성면 Y=0에서 모든 방과 도로를 같은 m 좌표로 비교한다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 정문 도로와 서비스 외부 높이를 구별해 한쪽의 석단을 다른 쪽에 복사하지 않는다.
@evidenceReview settings/20-envelope.md#ceilings #c397437 봉헌실/업무방의 널판은 제실/주랑에 적용되지 않아 공간별 천장 정체성을 유지한다.
-->

<!--
@evidence principles/core/common.md#scope-preservation 모든 공간을 temple-ground에 귀속하고 중정·정문·제단의 국소 높이차가 새 층을 만들지 않게 한다.
@evidence principles/core/common.md#substantive-completion 주랑 Y=0, 중정 -0.12m, 정문 도로 -0.24m와 바닥 두께·낮은 천장·보의 높이 예산을 결정한다.
@evidence principles/core/common.md#declared-basis 생산 좌표와 바닥 접근 허용값을 소비한 설계 높이이며 실제 단차 검사는 unverified로 구분한다.
@evidence principles/design/spaces.md#space-topology 제실과 주랑은 경사지붕 하부를 따르고 업무방·봉헌실 위 비거주 구조 틈에는 진입이나 새 바닥을 두지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 층은 기준 높이·두께·공유 접합만 정하고 방별 마감과 제단의 석단은 그 소유자에게 남긴다.
@evidence principles/design/spaces.md#space-verification-address 종횡 단면과 문턱·중정 경계를 읽어 끊긴 주랑 바닥이나 서비스 경로의 0.02m 초과 단차를 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 단층 및 낮은 단 허용을 공간별 완성면과 2.92m 보 아래 높이 예산으로 변환한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 바닥 접근의 단높이/문턱 한계와 천장 설정의 낮은 널판·노출 박공 구분을 대조했다. 정문 두 단과 중정 한 단은 허용 안에서 배정되어 settings의 층 수나 접근 조건을 바꾸지 않았다.
@evidence settings/00-delivery.md#coordinates 주랑 완성 바닥을 Y=0으로 잡아 모든 방과 도로의 높이를 같은 m 좌표로 비교한다.
@evidence settings/10-building.md#ground-access 국소 석단과 서비스 연속 바닥을 분리해 단층 안에 배정한다.
@evidence settings/20-envelope.md#ceilings 낮은 널판을 쓰는 방과 경사 하부가 노출되는 제실·주랑을 서로 다른 높이 경계로 구분한다.
-->

storey ID `temple-ground`의 부모는 `temple`이다. [건물 연결](building.md#containment)의 모든 공간은 여기에 속한다. Y=0은 [설정 좌표](../settings/00-delivery.md#coordinates)의 주랑 완성 바닥이며 제실·봉헌실·관리실·기록실·보관실·서비스 마당도 같은 완성 바닥 높이다. 일반 바닥 구조체는 완성면에서 0.18m 아래까지 있고 방별 상면과 수직 단면은 각 방 표면 소유가 받는다. 이 파일은 층 귀속·기준 높이·구조체 공유면을 소유하며 방 바닥의 마감을 중복 저작하지 않는다.

중정 완성면은 Y=-0.12m다. 정문 앞 도로의 출입 접점은 Y=-0.24m이고 후퇴 현관 안에서 두 단으로 주랑에 오른다. 서비스 외부 문 앞 지면은 Y=0이며 정문 도로와의 대지 높이 이행은 후속 maps가 소유한다. 이 입력은 [바닥 접근](../settings/10-building.md#ground-access)의 허용값을 소비하며 지하실·복층을 만들지 않는다. 제단의 국소 석단은 후속 fit-out이 자기 형상으로 소유하고 이 층을 추가하지 않는다.

봉헌실·관리실·기록실·보관실의 수평 널판 천장 아랫면은 Y=3.10m, 널판 위쪽 구조 예약은 0.10m, 아래로 드러나는 보 깊이 예산은 0.18m다. 따라서 보 아래 유효 높이는 2.92m이며 문틀 상단보다 높다. 실제 보·널판 단면은 후속 부재 단계에서 이 예약과 지붕 하부 사이에 들어가는지 확인한다. 제실과 주랑은 이 낮은 천장을 소비하지 않고 각각 경사지붕의 노출 하부를 따른다. 구조 틈은 비거주이며 진입 문·바닥·사다리를 두지 않는다.

같은 storey에 속한다는 표지만으로 단차를 검증하지 않는다. source 소유 `src/spaces/storey.ts`는 각 바닥 host의 완성면과 두께를 실제 공간 바닥에 묶는다. 관찰은 Y 기준의 종·횡단면, 각 문턱과 중정 가장자리다. 주랑의 바닥이 끊기거나 서비스 경로에 0.02m를 넘는 차이가 생기면 실패이며 현재 실체 검사는 unverified다.

## 벽 두께를 건너는 문턱 바닥 {#threshold-support}

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 벽 양면 사이 바닥과 통과 부피도 배정해 각 방 본체만 만든 빈 문턱을 막는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 슬래브 예약과 유효 support/cell을 구별하고 문별 단독 소유를 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 깊이는 host 양면, 폭은 opening 바닥 절단에서 유도하며 일반 두께를 소비한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 cell 연장은 기존 void 안에만 있고 문틀이나 닫힌 벽은 통과 공간에 포함하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 주랑이 아닌 방 하나에 문턱 전체를 줘 두 방의 반씩 바닥이나 문 model의 중복을 막는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 mesh 상면·support·volume·connector를 함께 대조하므로 선언된 지지만으로 허공을 통과시킬 수 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 문턱 한계를 wall-depth 전체의 슬래브/통과 cell 규칙으로 더 구체화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 낮은 문턱과 실제 reveal은 같은 높이 관통 바닥에서 양립하여 상위 단차 한계를 완화하지 않았다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 단순 연결선 외에 실제 발 디딤과 support 높이를 비교하도록 남겼다.
@evidenceReview settings/20-envelope.md#openings #4053d90 문 양면이 같은 reveal 깊이의 관통 구간을 소비해 벽 두께만큼의 바닥 공백을 막는다.
-->

<!--
@evidence principles/core/common.md#scope-preservation 모든 주랑 문과 외부 서비스 문에 벽 두께를 건너는 바닥·통과 부피를 배정해 본체 사이의 빈 구간을 남기지 않는다.
@evidence principles/core/common.md#substantive-completion 문턱은 주랑이 아닌 방의 단독 소유이며 슬래브 예약·유효 support·통과 cell의 범위까지 정한다.
@evidence principles/core/common.md#declared-basis 층의 일반 두께와 실제 opening host/profile에서 깊이와 폭을 유도하고 단차 한계는 바닥 접근 설정에서 받는다.
@evidence principles/design/spaces.md#space-topology 방 cell을 개구부 안에서 반대쪽 벽면까지 연장하되 닫힌 벽과 문틀은 통과 공간에서 제외한다.
@evidence principles/design/spaces.md#space-boundary-authority 문별 소유 배정으로 두 방이 문턱을 반씩 만들거나 문 model이 별도 바닥을 덮는 중복을 막는다.
@evidence principles/design/spaces.md#space-verification-address 실제 mesh 상면·support 높이·room volume·connector를 같은 산출물에서 대조해 허공의 지지와 중복 바닥을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 문턱 허용을 wall-depth 전체의 슬래브 예약과 귀속 cell 규칙으로 구현 가능한 접합에 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work ground-access의 0~0.02m 문턱과 openings의 실제 reveal 요구를 적용하면 동일 높이의 관통 바닥을 배정할 수 있어 상위 허용값을 완화하지 않았다.
@evidence settings/10-building.md#ground-access 연결선뿐 아니라 실제 발 디딤을 요구하는 조건을 문턱 slab와 support의 대조로 구체화한다.
@evidence settings/20-envelope.md#openings 벽 두께 안 reveal을 실제 깊이로 사용해 문 양면의 바닥이 같은 관통 구간을 소비하게 한다.
-->

[문 목록](openings.md#doors)의 출입문은 벽의 양쪽 면 사이에도 실제 바닥을 가져야 한다. 주랑과 방의 바닥을 각각 벽 안쪽 면에서 끝내고 그 사이를 비워 두지 않는다. 문턱 완성면은 Y=0, 구조체는 그 아래 일반 바닥 두께를 소비한다. 정문 접근 석단과 중정의 낮은 단은 이 문턱과 다른 접점이며 각 공간의 기존 소유를 따른다.

문턱 전체의 단독 소유는 주랑 문에서 주랑이 아닌 쪽 공간이다. 따라서 `door-entry`는 entrance, `door-sanctuary`는 sanctuary, `door-offering`은 offering, 동측 세 방의 문은 각각 administration/records/storage, `door-yard`는 service-yard에 귀속한다. 외부 서비스 문 `door-service-exterior`도 service-yard가 외벽 바깥면까지 소유한다. 문턱의 상면·끝 단면은 그 방의 완결 바닥 표면에 포함하며 별도 공동 소유자나 양쪽 반씩의 바닥을 만들지 않는다. 이 층 문서는 공통 접합 규칙만 소유하고 실체 바닥을 중복 생성하지 않는다.

깊이는 실제 opening host의 양쪽 벽면에서, 벽 길이 방향의 범위는 그 opening profile의 바닥 절단에서 유도한다. 실제 슬래브는 문설주 밑까지 연결하되, 보행 support patch는 문틀·열린 문짝·철물이 침범하지 않는 통과 영역에 둔다. 단차는 0을 목표로 하고 허용 한계는 기존 [바닥 접근](../settings/10-building.md#ground-access)을 소비한다. 주랑 쪽 바닥과 문턱은 같은 높이의 공통 끝선에서 만나며 양의 면적으로 겹치거나 벽 두께만큼 끊기지 않는다. 방 안쪽에서는 같은 소유의 바닥에 연속한다.

일반 방 슬래브는 벽 안쪽 면에 맞닿지만 문턱 슬래브는 벽 두께 안에 들어간다. 그 문턱이 차지하는 실제 평면과 완성면 아래 두께는 벽 실체에서 비워 양의 체적 중첩을 막는다. 문턱 밑의 벽은 슬래브 아랫면까지 이어질 수 있으나 슬래브나 통과 void를 덮지 않는다. 이 구조체 예약은 바닥 소유에서 유도하며 문 profile의 유효 폭·높이나 문짝 fitting을 낮추는 새 개구부가 아니다.

방 문서의 직사각형은 방 본체다. 벽 두께 안의 유효 폭·높이 통과 부피를 그 방의 `cells` 합집합에 추가해 문턱 지지면도 해당 공간 안에 있도록 한다. 이것은 기존 개구부 안의 연장이며 새 공간·벽·문을 만들지 않는다. 문틀 자리나 닫힌 벽을 통과 volume에 포함하지 않고, 주랑 또는 외부의 반대쪽 공간과는 열린 접면만 공유한다. 실제 `IAutoMovieBuiltSurface.space`, support 높이와 mesh 상면, room volume, connector의 진입·도착 위치를 같은 산출물에서 대조해야 한다. 지금은 설계이며 물리 연속성·귀속·충돌은 unverified다.

## 외벽 하단과 지면의 접촉 {#wall-ground-contact}

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 낮은 마당 벽과 현관 반환부까지 같은 하단 규칙에 포함해 일부 외벽의 부유를 면제하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 접촉선 최저 지면/인접 완성면 중 낮은 값에서 바닥 두께를 빼도록 계산이 정해져 있다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb maps 지면이 아직 없으므로 하단 Y를 미검증으로 남기고 매입 여유를 구조 보증으로 부풀리지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 아래 벽 연장은 기존 평면 안이며 방 cell·support·층의 확장으로 해석되지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 지면은 maps, 실체는 입면, 계산은 storey로 나뉘고 문턱 예약은 기존 바닥에서 받는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 묻힌 석단과 문 위 벽 띠도 실패 항목이라 단순한 벽 최저점 검사만으로 완료할 수 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 접지 요구에 변화하는 외부 지면을 소비할 공통 하단 유도식을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 미정 지면을 후속 maps 입력으로 드러냈고 임의 지형이나 지지력 주장을 부모에 추가하지 않았다.
@evidenceReview settings/40-environment.md#site #f317e20 외벽 접촉선 전체의 지면을 읽도록 해 한 점이 닿았다는 이유로 긴 벽의 부유를 통과시키지 않는다.
-->

<!--
@evidence principles/core/common.md#scope-preservation 네 입면·낮은 마당 벽·현관 후퇴벽과 반환벽에 같은 하단 유도를 적용하고 서비스 문턱도 접지 검사에 포함한다.
@evidence principles/core/common.md#substantive-completion 외부 접촉선의 최저 지면과 인접 완성면 중 낮은 값에서 바닥 두께를 빼는 하단 계산을 결정한다.
@evidence principles/core/common.md#declared-basis 실제 높이장은 maps 입력으로 남겨 아직 없는 지면에서 Y값을 발명하지 않고 매입 여유도 구조계산으로 주장하지 않는다.
@evidence principles/design/spaces.md#space-topology 외벽을 기존 평면 안에서 아래로 닫고 지면 아래 연장 때문에 방 cell·보행 support·층을 늘리지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority maps는 지면, 원래 입면은 벽 실체, 층은 하단 계산만 맡으며 문턱 예약을 기존 바닥에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 지면·벽 하단·슬래브를 같은 단면에서 읽어 부유·체적 중첩·묻힌 석단·문 위 벽 띠를 각각 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 기단이 지면에 닿아야 한다는 환경 조건을 변하는 지면에 반응하는 공통 외벽 하단 규칙으로 바꾼다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site의 길 연속성과 기단 접촉을 검토했다. 실제 지면을 후속 maps가 공급하는 인터페이스로 해결되며 미정 높이 때문에 부모에 임의 지형이나 구조 보증을 추가하지 않았다.
@evidence settings/40-environment.md#site 벽 가장자리 흙과 외부 접근 지면이 실제 외벽에 맞닿도록 접촉선 전체에서 하단을 유도한다.
-->

[환경의 접지 요구](../settings/40-environment.md#site)를 소비한다. 외부 지면의 높이장은 후속 maps가 소유하며 이 층에서 새 경사나 지형을 만들지 않는다. 실제 외벽 바깥 접촉선을 따라 읽은 지면의 최저 높이와, 외벽에 닿는 바닥·석단의 최저 완성면 중 낮은 값에서 [일반 바닥 두께](#ground-storey)를 뺀 높이를 공통 외벽 하단으로 선택한다. 이 매입 여유는 렌더에서 노출 틈을 남기지 않을 형상 입력이며 지반 지지력·기초 구조계산이나 고대 시공 치수의 주장으로 쓰지 않는다. 아직 지면 산출물이 없으므로 공통 하단의 실제 Y값은 unverified이며 Y=0이나 대지 후보 수치를 대신 넣지 않는다.

네 외벽과 현관 후퇴벽·반환벽은 같은 하단을 소비해 기존 평면 두께 안에서 지붕/기존 벽 상단까지 닫힌 실체로 이어진다. 낮은 마당 벽도 같은 하단에서 시작하고 상단은 기존 입면을 따른다. 공통 모서리의 아래쪽도 [맞댐](junctions.md#wall-junctions)을 유지한다. 이는 외곽 확대나 새 기단 덩어리의 추가가 아니며, 지하층·통로·관찰 공간을 만들지 않는다. 지면에 묻힌 벽 부분 때문에 방 `cells`나 보행 support를 아래로 늘리지 않는다. 벽 실체와 완결 표면은 원래 입면 owner가 유지하고 이 층은 하단 계산만 소유한다.

벽의 아래 연장도 [문턱 슬래브 예약](#threshold-support)을 소비한다. 지면/포장은 건물의 실제 노출 외측 면에서 만나고 방 바닥·중정·현관 석단 위에 중복 지면을 남기지 않는다. 지도와 건물의 접합에서 각 면의 소유를 보존하며 임의의 두 번째 바닥으로 틈을 감추지 않는다.

외부 네 면·모서리·현관 반환부·서비스 문턱에서 실제 지면과 벽 하단, 내부 슬래브 및 문턱 예약을 종단면으로 대조한다. 부유한 벽, 바닥과 벽의 체적 중첩, 지면에 묻힌 석단, 문 통과 위로 올라온 벽 띠 중 하나라도 있으면 실패다. 지면 공급이 없는 현재는 접지와 매입·절단 결과 모두 unverified로 남긴다.
