# 최초 공간 설계의 완결 표면 소유

## 입면·방·층·지붕의 소유 지도 {#surface-map}

<!--
@evidence principles/core/common.md#scope-preservation 입면·방 바닥/내벽/천장·층·roof/처마, 내부 경계벽과 그 reveal, 대지 흙띠·포장·능선의 완결 표면을 표로 배정하고 문턱과 박공의 노출 면까지 같은 소유에 포함한다.
@evidence principles/core/common.md#substantive-completion 각 완결 표면에 design와 source 주소를 짝짓고 surface.<owner>.<face> 식별 및 단독 저작 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 사용자 surface-ownership 의무를 실제 기준 평면과 연결하고, 표와 별도로 방출된 surface ID를 owner별로 열거하는 역검사 결과를 표의 행과 대조한다.
@evidence principles/design/spaces.md#space-topology 공유 물리벽 하나의 양쪽 마감은 다른 시각 표면이고 내부 접촉면은 노출 마감에서 제외한다.
@evidence principles/design/spaces.md#space-boundary-authority 접합 계산·cell 분해·반복 instance가 완결 시각 표면을 쪼개지 못하며 독립 물체 전체는 prototype owner에 남긴다.
@evidence principles/design/spaces.md#space-verification-address source의 실제 노출 면을 역으로 읽어 누락·이중 owner·없는 경계 중 하나라도 있으면 최초 공간 단계를 닫지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 분기 배정을 개별 입면·방·지붕·대지 구획의 단독 파일 주소와 실제 접합 면의 귀속으로 좁힌다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work build-scope의 공간/독립 물체/마감/반복 분담과 사용자 완결 표면 조건을 대조했다. 물리벽과 두 마감의 소유를 구별하면 각 분기를 보존할 수 있어 이 표면 지도 때문에 부모 분담을 바꿀 결함은 없었다. 대지 배정 수정은 site의 결함 보고에 속한다.
@evidence settings/00-delivery.md#build-scope 외피 host와 공간 표면을 spaces에, 대지 지면·경계석·먼 능선을 spaces의 대지 owner에, 기둥·문·수반·이웃·식생 등 독립 물체는 model에 배정한다.
@evidence obligations/design/spaces.md#addressable-spatial-decisions 표면마다 design anchor와 source를 짝짓고 junctions의 계산과 실제 노출 면 소유를 분리한다.
@evidence contracts/obligations-spaces.md#surface-ownership 입면/방/층/roof/대지 전체 소유 표에 문턱·박공·외부 처마 하부·내부 경계벽 reveal까지 귀속시키고 실제 면에서 역검사할 누락 조건을 정한다.
@evidenceExclude settings/00-delivery.md#coverage-map spaces의 전체 H2를 읽었을 때 설정 파일의 사실 소유 목록을 재작성하는 단위는 없다. 각 공간은 목록이 가리킨 실제 그래프·외피·실내·대지·관찰 target을 직접 소비하며 설정 목록 자체의 완전성은 settings account에 남는다.
@evidenceExclude settings/40-environment.md#daylight spaces는 개구부와 가림 geometry 및 그 관찰을 정하지만 태양 고도·광원 방향·노출 값을 정하는 host는 없다. viewer-path도 원래 source를 전달할 경계이며 실제 조명값은 systems의 후속 책임이다.
@evidenceExclude settings/35-objects.md#bench 벤치의 좌면·받침은 독립 물체이고 중정 포장·문턱 표면을 다시 나누지 않는다
@evidenceExclude settings/35-objects.md#portable-lamp 소형 등잔의 금속 접시·줄기는 모델 부재이고 방 벽·바닥의 완결 면이 아니다
@evidenceExclude settings/35-objects.md#jar-rack 두 자리 항아리 받침은 보관실의 이동 가구로서 바닥 판의 표면 owner를 바꾸지 않는다
@evidenceExclude settings/35-objects.md#carrying-yoke 멜대와 고리는 마당에 내려놓는 prototype이며 마당 포장 형상이 아니다
@evidenceExclude settings/35-objects.md#handcart 정지 손수레의 바퀴·판은 독립 외부 소품이고 마당 길이나 문턱 통과의 공간 형상을 결정하지 않는다
@evidenceExclude settings/35-objects.md#bucket 빈 물동이의 몸체·손잡이는 옮길 수 있는 용기이며 중정·마당 바닥 면이 아니다
@evidenceExclude settings/35-objects.md#planter 화분과 흙면은 중정 가장자리 비품이고 대지 흙띠나 중정 포장의 분할이 아니다
@evidenceExclude settings/35-objects.md#votive-plaque 봉헌판의 빈 앞면은 물체 표면이고 제실·봉헌실 벽면 장식이 아니다
@evidenceExclude settings/35-objects.md#offering-tray 얕은 쟁반의 판·테는 독립 소품이며 제단이나 봉헌 탁자의 바닥 표면을 새로 소유하지 않는다
@evidenceExclude settings/35-objects.md#textile 접은 천은 놓이는 비품이고 방 천장·벽·바닥 표면의 재료 띠가 아니다
@evidenceExclude settings/35-objects.md#stylus 첨필의 짧은 막대는 책상 소품이며 관리실·기록실 벽이나 바닥 완결 면이 아니다
@evidenceExclude settings/35-objects.md#writing-tablet 글자 없는 필기판은 책상 소품이며 기록실의 벽 마감이나 바닥 판이 아니다
@evidenceExclude settings/35-objects.md#rope-coil 느슨한 끈의 고리·묶음 띠는 이동 소품이며 보관실이나 마당 포장과 합치지 않는다
@evidenceExclude settings/35-objects.md#censer 꺼진 향로의 컵·재·향은 제단 위 독립 비품이고 제실 벽·바닥의 소유가 아니다
@evidenceExclude settings/35-objects.md#floor-cushion 낮은 좌구의 천 면은 제실 바닥 위 독립 물체이며 바닥의 dado나 포장을 분할하지 않는다
@evidenceExclude settings/35-objects.md#jar-stand 한 자리 원형 받침은 보관실의 독립 가구이고 바닥 구조체나 고정 문턱이 아니다
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 문턱·박공·외부 처마와 대지 표면에 더해 내부 경계벽 reveal 행이 생겨, 역검사에서 owner 없이 방출되던 표면이 표 밖에 남지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 각 행이 design anchor와 source 경로를 짝짓고 surface.<owner>.<face> ID와 단독 저작 규칙을 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 표는 설계 답이고, 방출 surface ID의 owner 열거와 표 행의 대조가 별도 역검사라고 마지막 문단이 구별한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 한 공유벽의 양쪽 마감과 내부 접촉면을 구별해 실체와 시각 면을 같은 것으로 세지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 cell 분해나 반복이 완결 면을 나눌 권한이 없고 독립 물체와 이웃·식생의 표면은 prototype 하나에 남는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 `npm run self-check`의 surfaceOwnerAudit가 표의 방출 owner 열과 실제 방출 owner를 양방향 대조하고 누락·중복을 failure 합에 넣으므로 표 밖 방출을 실패로 돌린다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 settings의 분기 배정을 각 입면·방·roof·대지·내부 경계벽의 단독 파일과 접합 면의 귀속으로 구체화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 물리벽과 양면 마감, reveal을 구별하면 분담이 유지돼 이 표면 지도에서 드러난 부모 결함은 없고, 대지 행 수정은 site의 upstream 보고로 분리돼 있다.
@evidenceReview settings/00-delivery.md#build-scope #8d597f9 고친 build-scope의 대지 행이 표의 두 대지 행으로, 독립 물체 행이 prototype 소유 문장으로 대응한다.
@evidenceReview obligations/design/spaces.md#addressable-spatial-decisions #9c97153 기준·문·접합·표면·관찰·대지·내부 경계벽 owner를 전체 문서와 대조했고 junctions는 새 완결 면 owner가 아니다.
@evidenceReview contracts/obligations-spaces.md#surface-ownership #1a50ebe 방 바닥의 벽 두께 문턱, roof 하부·박공, 대지 표면, 내부 경계벽 reveal까지 표에서 귀속시켜 최초 분해를 지급한다.
@evidenceExcludeReview settings/00-delivery.md#coverage-map #fe00d39 이 공간 소유 지도는 settings 파일 소유 목록 자체를 다시 완성하는 host가 아니며, 각 공간은 설정 목록이 가리킨 실제 그래프·외피·실내·대지·관찰 target을 소비한다.
@evidenceExcludeReview settings/40-environment.md#daylight #eac4028 창·roof·대지 표면의 가림은 결정됐지만 태양 고도·광원 방향·노출을 정하는 host는 없고 조명 수치는 systems에 남는다.
@evidenceExcludeReview settings/35-objects.md#bench #4731814 벤치의 좌면과 받침을 주랑 바닥 표면으로 세지 않는 소유 경계를 확인했다
@evidenceExcludeReview settings/35-objects.md#portable-lamp #2f26356 소형 등잔의 접촉 위치는 배치가 정하며 공간 표면 지도에 등잔 part를 더하지 않는다
@evidenceExcludeReview settings/35-objects.md#jar-rack #433211e 받침 홈과 다리는 모델에 남고 보관실 바닥은 독립 표면으로 남는다
@evidenceExcludeReview settings/35-objects.md#carrying-yoke #7226d89 멜대의 걸침·하중을 공간 표면 지도에서 주장하지 않는다
@evidenceExcludeReview settings/35-objects.md#handcart #58fa819 정지 손수레의 실제 놓임과 포장 접촉은 후속 배치에서 검증한다
@evidenceExcludeReview settings/35-objects.md#bucket #97dc9fe 물동이의 위치와 수량을 공간 완결 면의 일부로 중복 소유하지 않는다
@evidenceExcludeReview settings/35-objects.md#planter #5494e82 화분 내부 흙을 site 바닥 흙띠로 잘못 세지 않는 소유 경계를 확인했다
@evidenceExcludeReview settings/35-objects.md#votive-plaque #564c5ab 봉헌판의 글자 없는 판을 방 벽의 고정 마감으로 오인하지 않는다
@evidenceExcludeReview settings/35-objects.md#offering-tray #00c29b0 쟁반의 받침 접촉은 배치의 문제이고 공간 표면 지도는 탁자·제단 geometry를 복제하지 않는다
@evidenceExcludeReview settings/35-objects.md#textile #4ad9673 직물의 덮개 역할을 모델에 남겨 실내 표면 소유를 바꾸지 않는다
@evidenceExcludeReview settings/35-objects.md#stylus #4491a6c 첨필 위치는 책상 배치가 정하고 공간 표면 지도에는 형상 행이 없다
@evidenceExcludeReview settings/35-objects.md#writing-tablet #cd87272 필기면의 물체 소유와 기록실 공간 표면 소유가 분리돼 있다
@evidenceExcludeReview settings/35-objects.md#rope-coil #96ce70c 느슨한 끈 뭉치의 고리와 묶음 띠가 공간 벽·바닥 형상으로 중복 방출되지 않는다
@evidenceExcludeReview settings/35-objects.md#censer #bb1b3d5 향로가 제단 위에 놓여도 제실 완결 표면 owner는 바뀌지 않는다
@evidenceExcludeReview settings/35-objects.md#floor-cushion #6e384d3 좌구의 앉는 면과 제실 석재 바닥을 서로 다른 표면 소유로 유지한다
@evidenceExcludeReview settings/35-objects.md#jar-stand #5d59a6d 한 자리 받침의 고리·기둥을 보관실 완결 바닥 면에서 제외한다
-->

[추가 공간 의무](../contracts/obligations-spaces.md#surface-ownership)를 실제 평면 경계와 연결한다. 아래의 source 경로는 각 완결 표면의 단독 저작 owner다. 표가 있다는 사실은 compiled binding의 역검사 통과를 뜻하지 않는다. 저작자는 이번 production 세션 한 명이고 fan-out이 생겨도 하나의 행이 가진 완결 표면을 여러 사람에게 나누지 않는다. 내부벽의 물리 topology는 [boundaries](openings.md#boundary-ownership) 한 소유이며 마주 보는 두 마감은 각각의 방 소유다.

| 완결 표면/역할 | design owner | 후속 source owner | 방출 owner |
| --- | --- | --- | --- |
| 남측 외피와 후퇴 입구 바깥 반환면 | [남측](facades/south.md#south-envelope) | src/spaces/facades/south.ts | `facade-south` |
| 북측 외피·제실 북 박공 | [북측](facades/north.md#north-envelope) | src/spaces/facades/north.ts | `facade-north` |
| 서측 전체 외피 | [서측](facades/west.md#west-envelope) | src/spaces/facades/west.ts | `facade-west` |
| 동측 전체 외피·서비스 문 바깥 | [동측](facades/east.md#east-envelope) | src/spaces/facades/east.ts | `facade-east` |
| 한 층의 기준·바닥 구조체 공유 접합 | [층](storey.md#ground-storey) | src/spaces/storey.ts | 없음(각 방 바닥 owner에 귀속) |
| 내부 경계벽의 실체와 그 벽을 뚫은 문·창의 reveal(문설주·인방 안쪽 면) | [경계와 개구부](openings.md#boundary-ownership) | src/spaces/boundaries.ts | `boundaries` |
| 현관 안쪽 반환면·계단·상부참 | [현관](rooms/entrance.md#entrance-volume) | src/spaces/rooms/entrance.ts | `entrance` |
| 중정 바닥·연속 석재 턱 | [중정](rooms/courtyard.md#court-volume) | src/spaces/rooms/courtyard.ts | `courtyard` |
| 한 고리 전체 내벽·바닥·노출 천장 | [주랑](rooms/colonnade.md#ring-volume) | src/spaces/rooms/colonnade.ts | `colonnade` |
| 제실 내벽·바닥·노출 박공 하부 | [제실](rooms/sanctuary.md#sanctuary-volume) | src/spaces/rooms/sanctuary.ts | `sanctuary` |
| 봉헌실 내벽·바닥·낮은 천장 | [봉헌실](rooms/offering.md#offering-volume) | src/spaces/rooms/offering.ts | `offering` |
| 관리실 내벽·바닥·천장 | [관리실](rooms/administration.md#office-volume) | src/spaces/rooms/administration.ts | `administration` |
| 기록실 내벽·바닥·천장 | [기록실](rooms/records.md#records-volume) | src/spaces/rooms/records.ts | `records` |
| 보관실 내벽·바닥·천장 | [보관실](rooms/storage.md#storage-volume) | src/spaces/rooms/storage.ts | `storage` |
| 마당 포장·안쪽 벽·낮은 벽 상단 | [서비스 마당](rooms/service-yard.md#yard-volume) | src/spaces/rooms/service-yard.ts | `service-yard` |
| 제실 지붕 상부·바깥 처마 하부 | [제실 지붕](roofs/sanctuary.md#sanctuary-roof) | src/spaces/roofs/sanctuary.ts | `roof-sanctuary` |
| 서측 날개 지붕 상부·바깥 하부 | [서측 지붕](roofs/west.md#west-roof) | src/spaces/roofs/west.ts | `roof-west` |
| 동측 날개 지붕 상부·바깥 하부 | [동측 지붕](roofs/east.md#east-roof) | src/spaces/roofs/east.ts | `roof-east` |
| 남북 주랑 덮개 상부·바깥 끝 | [주랑 지붕](roofs/colonnade.md) | src/spaces/roofs/colonnade.ts | `roof-colonnade` |
| 포치 지붕과 외부 처마 전체 | [포치 지붕](roofs/porch.md#porch-roof) | src/spaces/roofs/porch.ts | `roof-porch` |
| 대지 흙띠·경계석·포장·이웃 바닥 | [흙띠·경계석·포장](site.md#site-paving) | src/spaces/site/ground.ts | `site` |
| 먼 능선과 기슭 | [먼 능선과 기슭](site.md#distant-ridge) | src/spaces/site/ridge.ts | `site-distant` |

2026-09-25 사물 제작 지시로 추가한 낮은 벤치·소형 등잔·항아리 받침대·멜대·정지 손수레·물동이·화분·봉헌판·쟁반·접은 천·첨필·필기판·끈 뭉치·향로·좌구·한 자리 받침은 모두 독립 물체 prototype이다. 각 방에서 물체가 닿는 위치와 수량은 instances의 후속 검토 대상이며, 이 공간 표면 지도는 그 물체의 part나 부피를 방 바닥·벽·대지 포장에 흡수하지 않는다.

surface ID는 `surface.<owner>.<face>`로 안정되게 정하고 실제 boundary/element의 면 범위에 결속한다. [벽 접합](junctions.md#wall-junctions)의 공통 내부 접면은 노출 마감이 아니며 모서리 절단이 외측 면의 소유를 바꾸지 않는다. [박공 폐쇄](junctions.md#gable-closures)의 노출 면도 위의 입면·방·지붕 소유에 속한다. junctions는 접합 계산의 소유이고 완결 시각 표면의 새 공동 소유자가 아니다. 마감의 수치값은 materials가 이 host를 소비하며 면을 다른 owner로 쪼개지 않는다. 기둥·문틀·문짝·수반·제단 같은 독립 물체의 전체 표면은 해당 model prototype 한 소유이고 방 파일은 배치와 접촉을 소비한다. 반복 instance마다 표면 정의를 복제하지 않는다.

표의 방 바닥은 [문턱 귀속](storey.md#threshold-support)에 배정된 벽 두께 안 문턱까지 포함한다. 같은 문턱을 주랑과 방이 반씩 만들거나 문 model이 별도 바닥으로 덮지 않는다. 계측용 support patch나 계산 cell의 분해도 이 완결 표면 소유를 나누지 않는다.

이 지도는 compiled host binding이 아니다. source의 실제 모든 노출 면을 역으로 읽어 빠진 면·두 owner가 붙은 면·존재하지 않는 경계를 분모에 남긴다. `npm run self-check`가 방출된 surface ID를 owner별로 열거하고 위 표의 `방출 owner` 열과 양방향으로 대조한다. 방출 owner가 표에 없거나 표의 owner가 방출되지 않거나 표에 중복되면 실패한다. 대지의 지면·경계석·먼 능선 표면은 [대지](site.md#site-extent) owner가 건물과 다른 소유 단위로 만든다. 이웃 외피·나무·풀의 전체 표면은 각 model prototype 한 소유이고 instances가 [배치 구역](site.md#placement-zones) 안에 둔다. 대지 표면을 건물 표면에 섞지 않는다.

## 주랑과 제실 벽의 하부 띠 {#interior-dado}

<!--
@evidence principles/core/common.md#scope-preservation 주랑 전 둘레와 제실 네 벽의 하부 띠를 함께 나누고 띠를 두지 않는 방과 외부 입면을 명시해 적용 범위를 닫는다.
@evidence principles/core/common.md#substantive-completion 띠 윗선 Y=0.60m, 두 dado 표면 ID, 문에서의 끊김과 묻힌 면의 처리를 정해 source가 경계를 새로 고르지 않게 한다.
@evidence principles/core/common.md#declared-basis 띠의 존재와 범위는 material-language·sanctuary 설정에서 받고 0.60m는 이미지 03·04의 문 높이 비교에서 고른 저작 값이라고 밝힌다.
@evidence principles/design/spaces.md#space-topology 띠는 기존 주랑·제실 벽 마감 위의 면 분할일 뿐 새 공간·경계·턱을 만들지 않고 문 통과를 막지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 실체는 기존 입면·경계 owner, 두 dado 표면은 주랑·제실 방 owner에 남고 재료 값은 materials로 보낸다.
@evidence principles/design/spaces.md#space-verification-address 주랑 여섯 영역·제실 네 벽·문 양옆에서 다른 방으로 샌 띠, 높이 불일치, 문을 가로지른 띠, 겹친 표면을 실패로 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 낮은 적갈색 띠라는 색 관계를 높이·표면 ID·적용 방이 정해진 공간 표면 분할로 바꾼다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work material-language의 띠 범위, walls의 높이 경계, sanctuary의 낮은 붉은 띠와 방별 문 높이를 대조했다. 기존 벽 마감을 한 수평선으로 나누면 모두 성립해 부모를 고치지 않았다.
@evidence settings/20-envelope.md#material-language 적갈색 띠를 중정 둘레(주랑 벽)와 제실 벽 하부에만 두고 업무방은 밝은 회벽으로 남긴다.
@evidence settings/20-envelope.md#walls 띠의 재료 경계를 임의 패치가 아니라 바닥 위 일정 높이의 수평 경계에 둔다.
@evidence settings/30-interiors.md#sanctuary 이미지 04의 낮은 붉은 띠를 제실 네 벽 하부의 dado 표면으로 받는다.
@evidence contracts/obligations-spaces.md#surface-ownership 새 dado 표면을 각 방의 완결 표면으로 귀속시키고 한 벽 면이 두 표면에 겹치지 않게 한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 주랑 여섯 영역과 제실 네 벽이 대상이고 봉헌실·업무방·마당·외부가 제외로 열거돼 적갈색 띠를 방 하나에만 두는 축소나 모든 방으로의 확대가 남지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 0.60m 수평선과 두 표면 ID, 문에서의 끊김이 적혀 environment가 분할 높이와 대상을 추정하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 띠의 범위는 설정 링크에서, 0.60m는 이미지 03·04에서 약 0.5~0.75m로 읽은 범위 안의 저작 값이며 실측이 아니라고 구별했다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 같은 평면의 면 분할이고 턱·돌출이 없다고 적어 띠가 주랑 통행이나 제실 문 통과에 새 장애를 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 소유 지도의 주랑·제실 행을 그대로 따르며 dado 표면도 같은 방 owner라서 입면이나 materials가 이 면을 새로 소유하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 owner 색 검사와 납품 보기를 함께 쓰라는 문장이 재료가 없는 현재에도 띠 경계를 반증할 수단을 준다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모는 색 관계와 범위만 줬고 윗선 높이·표면 ID·문에서의 끊김은 공간 층이 더한 결정이다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 세 설정 조건이 기존 벽 마감의 한 수평 분할로 함께 성립해 부모의 색 관계나 방별 용도를 고칠 결함이 없었다.
@evidenceReview settings/20-envelope.md#material-language #25e6ffa 부모의 중정·제실 띠와 밝은 업무방이 대상 두 표면과 제외 목록으로 그대로 옮겨졌다.
@evidenceReview settings/20-envelope.md#walls #35026c5 띠 경계가 바닥 위 일정 높이의 수평선이라 부모의 높이 경계를 따르는 재료 경계 원칙에 맞는다.
@evidenceReview settings/30-interiors.md#sanctuary #224fd8d 제실 네 벽 하부의 sanctuary.dado가 이미지 04의 낮은 붉은 띠를 받는다.
@evidenceReview contracts/obligations-spaces.md#surface-ownership #1a50ebe 두 dado 표면이 각 방 owner의 완결 표면으로 귀속되고 한 면이 두 표면에 겹치면 실패로 명시돼 단독 소유가 유지된다.
-->

[재료 관계](../settings/20-envelope.md#material-language)는 적갈색 띠가 중정과 제실 벽 하부를 연속해서 따르고 업무방은 밝은 회벽을 유지한다고 정한다. [외피 canon](../settings/20-envelope.md#walls)은 재료 경계가 부재와 높이 경계를 따르게 하고, [제실](../settings/30-interiors.md#sanctuary)은 이미지 04의 낮은 붉은 띠를 채택한다. 이 H2는 그 경계를 공간 표면의 분할로 정한다. 중정을 둘러싼 벽은 [주랑](rooms/colonnade.md#ring-volume)의 벽 마감 `surface.colonnade.wall`이고 제실은 [제실](rooms/sanctuary.md#sanctuary-volume)의 벽 마감 `surface.sanctuary.wall`이다.

저작자 결정: 띠의 윗선은 두 방의 완성 바닥 Y=0 위 0.60m 수평선이다. 이미지 03·04에서 문 높이에 견준 띠 윗선이 약 0.5~0.75m로 읽혀 그 안에서 고른 값이며 실측은 아니다. 윗선 아래 면은 `surface.colonnade.dado`와 `surface.sanctuary.dado`, 위는 원래 벽 마감 ID로 남는다. 두 방의 띠는 같은 높이로 이어지고 문 void와 문틀에서만 끊긴다. 봉헌실·관리실·기록실·보관실·서비스 마당과 외부 입면에는 띠를 두지 않는다.

이 분할은 벽 실체와 두께를 바꾸지 않는 같은 평면의 면 분할이며 새 공간·경계·부재가 아니다. 띠 윗선에 턱이나 돌출을 만들지 않는다. 바닥 아래로 묻힌 벽 면도 띠 표면에 들지만 바닥 slab 뒤에 가려진다. 표면 소유는 위 [소유 지도](#surface-map)의 주랑·제실 행을 따르며 두 dado 표면도 각 방 owner의 완결 표면이다. 색·거칠기·마모는 materials가 두 dado 표면에 결속한다. 대상 표면과 높이는 `src/spaces/ownership.ts`가 내보내고 environment가 해당 벽 면을 그 높이에서 나눈다.

관찰은 주랑 여섯 영역의 벽, 제실 네 벽, 각 문 양옆의 띠 끝을 owner 색 검사와 납품 보기에서 함께 본다. 띠가 업무방·봉헌실이나 외부로 새거나, 두 방의 높이가 다르거나, 문 void를 가로지르거나, 한 벽 면이 두 표면에 겹치면 실패다.
