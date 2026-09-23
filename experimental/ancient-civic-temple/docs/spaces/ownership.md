# 최초 공간 설계의 완결 표면 소유

## 입면·방·층·지붕의 소유 지도 {#surface-map}

<!--
@evidence principles/core/common.md#scope-preservation 입면·방 바닥/내벽/천장·층·roof/처마와 대지 흙띠·포장·능선의 완결 표면을 표로 배정하고 문턱과 박공의 노출 면까지 같은 소유에 포함한다.
@evidence principles/core/common.md#substantive-completion 각 완결 표면에 design와 source 주소를 짝짓고 surface.<owner>.<face> 식별 및 단독 저작 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 사용자 surface-ownership 의무를 실제 기준 평면과 연결하며 source 경로 지정과 compiled host binding의 역검사를 구별한다.
@evidence principles/design/spaces.md#space-topology 공유 물리벽 하나의 양쪽 마감은 다른 시각 표면이고 내부 접촉면은 노출 마감에서 제외한다.
@evidence principles/design/spaces.md#space-boundary-authority 접합 계산·cell 분해·반복 instance가 완결 시각 표면을 쪼개지 못하며 독립 물체 전체는 prototype owner에 남긴다.
@evidence principles/design/spaces.md#space-verification-address source 생성 뒤 실제 노출 면을 역으로 읽어 누락·이중 owner·없는 경계 중 하나라도 있으면 최초 공간 단계를 닫지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 분기 배정을 개별 입면·방·지붕·대지 구획의 단독 파일 주소와 실제 접합 면의 귀속으로 좁힌다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work build-scope의 공간/독립 물체/마감/반복 분담과 사용자 완결 표면 조건을 대조했다. 물리벽과 두 마감의 소유를 구별하면 각 분기를 보존할 수 있어 이 표면 지도 때문에 부모 분담을 바꿀 결함은 없었다. 대지 배정 수정은 site의 결함 보고에 속한다.
@evidence settings/00-delivery.md#build-scope 외피 host와 공간 표면을 spaces에, 대지 지면·경계석·먼 능선을 spaces의 대지 owner에, 기둥·문·수반·이웃·식생 등 독립 물체는 model에 배정한다.
@evidence obligations/design/spaces.md#addressable-spatial-decisions 표면마다 design anchor와 source를 짝짓고 junctions의 계산과 실제 노출 면 소유를 분리한다.
@evidence contracts/obligations-spaces.md#surface-ownership 입면/방/층/roof/대지 전체 소유 표에 문턱·박공·외부 처마 하부까지 귀속시키고 실제 면에서 역검사할 누락 조건을 정한다.
@evidenceExclude settings/00-delivery.md#coverage-map spaces의 전체 H2를 읽었을 때 설정 파일의 사실 소유 목록을 재작성하는 단위는 없다. 각 공간은 목록이 가리킨 실제 그래프·외피·실내·대지·관찰 target을 직접 소비하며 설정 목록 자체의 완전성은 settings account에 남는다.
@evidenceExclude settings/40-environment.md#daylight spaces는 개구부와 가림 geometry 및 그 관찰을 정하지만 태양 고도·광원 방향·노출 값을 정하는 host는 없다. viewer-path도 원래 source를 전달할 경계이며 실제 조명값은 systems의 후속 책임이다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 문턱·박공·외부 처마와 대지 흙띠·포장·능선까지 표에 귀속시켜 방 바닥과 입면 상면만 남기는 소유 누락을 막는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 각 행이 design anchor와 source 경로를 짝짓고 surface.<owner>.<face> ID와 단독 저작 규칙을 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 표는 사용자 의무의 설계 답이며 compiled binding의 역검사 통과를 뜻하지 않는다고 첫 문단에 적었다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 한 공유벽의 양쪽 마감과 내부 접촉면을 구별해 실체와 시각 면을 같은 것으로 세지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 cell 분해나 반복이 완결 면을 나눌 권한이 없고 독립 물체와 이웃·식생의 표면은 prototype 하나에 남는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 실제 노출 면에서 역검사해 누락·이중 owner·없는 경계가 하나라도 있으면 최초 공간 단계를 닫지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 settings의 분기 배정을 각 입면·방·roof·대지 구획의 단독 파일과 접합 면의 귀속으로 구체화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 물리벽 하나와 양면 마감을 구별하면 분담이 유지돼 이 표면 지도에서 드러난 부모 결함은 없고, build-scope의 대지 행 수정은 site의 upstream 보고로 분리돼 있다.
@evidenceReview settings/00-delivery.md#build-scope #8d597f9 고친 build-scope의 대지 행이 표의 두 대지 행으로, 독립 물체 행이 prototype 소유 문장으로 대응한다.
@evidenceReview obligations/design/spaces.md#addressable-spatial-decisions #9c97153 기준·문·접합·표면·관찰·대지 owner를 전체 문서와 대조했고 junctions는 새 완결 면 owner가 아니다.
@evidenceReview contracts/obligations-spaces.md#surface-ownership #1a50ebe 방 바닥에 벽 두께 문턱을 포함하고 roof 하부·박공·대지 표면까지 표에서 귀속시켜 최초 분해를 지급한다.
@evidenceExcludeReview settings/00-delivery.md#coverage-map #fe00d39 27개 파일 43 H2는 실제 settings 단위를 소비하며 settings 파일 소유 목록 자체를 다시 완성하는 host는 없다.
@evidenceExcludeReview settings/40-environment.md#daylight #eac4028 창·roof·대지 표면의 가림은 결정됐지만 태양 고도·광원 방향·노출을 정하는 host는 없고 조명 수치는 systems에 남는다.
-->

[추가 공간 의무](../contracts/obligations-spaces.md#surface-ownership)를 실제 평면 경계와 연결한다. 아래의 source 경로는 각 완결 표면의 단독 저작 owner다. 표가 있다는 사실은 compiled binding의 역검사 통과를 뜻하지 않는다. 저작자는 이번 production 세션 한 명이고 fan-out이 생겨도 하나의 행이 가진 완결 표면을 여러 사람에게 나누지 않는다. 내부벽의 물리 topology는 [boundaries](openings.md#boundary-ownership) 한 소유이며 마주 보는 두 마감은 각각의 방 소유다.

| 완결 표면/역할 | design owner | 후속 source owner |
| --- | --- | --- |
| 남측 외피와 후퇴 입구 바깥 반환면 | [남측](facades/south.md#south-envelope) | src/spaces/facades/south.ts |
| 북측 외피·제실 북 박공 | [북측](facades/north.md#north-envelope) | src/spaces/facades/north.ts |
| 서측 전체 외피 | [서측](facades/west.md#west-envelope) | src/spaces/facades/west.ts |
| 동측 전체 외피·서비스 문 바깥 | [동측](facades/east.md#east-envelope) | src/spaces/facades/east.ts |
| 한 층의 기준·바닥 구조체 공유 접합 | [층](storey.md#ground-storey) | src/spaces/storey.ts |
| 현관 안쪽 반환면·계단·상부참 | [현관](rooms/entrance.md#entrance-volume) | src/spaces/rooms/entrance.ts |
| 중정 바닥·연속 석재 턱 | [중정](rooms/courtyard.md#court-volume) | src/spaces/rooms/courtyard.ts |
| 한 고리 전체 내벽·바닥·노출 천장 | [주랑](rooms/colonnade.md#ring-volume) | src/spaces/rooms/colonnade.ts |
| 제실 내벽·바닥·노출 박공 하부 | [제실](rooms/sanctuary.md#sanctuary-volume) | src/spaces/rooms/sanctuary.ts |
| 봉헌실 내벽·바닥·낮은 천장 | [봉헌실](rooms/offering.md#offering-volume) | src/spaces/rooms/offering.ts |
| 관리실 내벽·바닥·천장 | [관리실](rooms/administration.md#office-volume) | src/spaces/rooms/administration.ts |
| 기록실 내벽·바닥·천장 | [기록실](rooms/records.md#records-volume) | src/spaces/rooms/records.ts |
| 보관실 내벽·바닥·천장 | [보관실](rooms/storage.md#storage-volume) | src/spaces/rooms/storage.ts |
| 마당 포장·안쪽 벽·낮은 벽 상단 | [서비스 마당](rooms/service-yard.md#yard-volume) | src/spaces/rooms/service-yard.ts |
| 제실 지붕 상부·바깥 처마 하부 | [제실 지붕](roofs/sanctuary.md#sanctuary-roof) | src/spaces/roofs/sanctuary.ts |
| 서측 날개 지붕 상부·바깥 하부 | [서측 지붕](roofs/west.md#west-roof) | src/spaces/roofs/west.ts |
| 동측 날개 지붕 상부·바깥 하부 | [동측 지붕](roofs/east.md#east-roof) | src/spaces/roofs/east.ts |
| 남북 주랑 덮개 상부·바깥 끝 | [주랑 지붕](roofs/colonnade.md) | src/spaces/roofs/colonnade.ts |
| 포치 지붕과 외부 처마 전체 | [포치 지붕](roofs/porch.md#porch-roof) | src/spaces/roofs/porch.ts |
| 대지 흙띠·경계석·포장·이웃 바닥 | [흙띠·경계석·포장](site.md#site-paving) | src/spaces/site/ground.ts |
| 먼 능선과 기슭 | [먼 능선과 기슭](site.md#distant-ridge) | src/spaces/site/ridge.ts |

surface ID는 `surface.<owner>.<face>`로 안정되게 정하고 실제 boundary/element의 면 범위에 결속한다. [벽 접합](junctions.md#wall-junctions)의 공통 내부 접면은 노출 마감이 아니며 모서리 절단이 외측 면의 소유를 바꾸지 않는다. [박공 폐쇄](junctions.md#gable-closures)의 노출 면도 위의 입면·방·지붕 소유에 속한다. junctions는 접합 계산의 소유이고 완결 시각 표면의 새 공동 소유자가 아니다. 마감의 수치값은 materials가 이 host를 소비하며 면을 다른 owner로 쪼개지 않는다. 기둥·문틀·문짝·수반·제단 같은 독립 물체의 전체 표면은 해당 model prototype 한 소유이고 방 파일은 배치와 접촉을 소비한다. 반복 instance마다 표면 정의를 복제하지 않는다.

표의 방 바닥은 [문턱 귀속](storey.md#threshold-support)에 배정된 벽 두께 안 문턱까지 포함한다. 같은 문턱을 주랑과 방이 반씩 만들거나 문 model이 별도 바닥으로 덮지 않는다. 계측용 support patch나 계산 cell의 분해도 이 완결 표면 소유를 나누지 않는다.

이 지도는 compiled host binding이 아니다. source가 생기면 실제 모든 노출 면을 역으로 읽어 빠진 면·두 owner가 붙은 면·존재하지 않는 경계를 분모에 남긴다. 한 누락이라도 있으면 최초 공간 단계는 닫히지 않는다. 대지의 지면·경계석·먼 능선 표면은 [대지](site.md#site-extent) owner가 건물과 다른 소유 단위로 만든다. 이웃 외피·나무·풀의 전체 표면은 각 model prototype 한 소유이고 instances가 [배치 구역](site.md#placement-zones) 안에 둔다. 대지 표면을 건물 표면에 섞지 않는다.
