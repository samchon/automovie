# 시민 주택 공간 설계

## 시민 주택 공간 {#citizen-house-space}

<!--
@evidence principles/core/common.md#declared-basis 단일 본채와 금지 연결은 사용자 고정 그래프에서 받고, house를 citizen-site 아래 두 storey의 부모로 두는 주소 관계를 이 공간 단위에서 정했다. 외곽과 층 높이는 별도 datum owner를 링크한다.
@evidence principles/core/common.md#scope-preservation 집 전체를 대지·두 층·방·외주와 한 계단의 관계로 배정하고, 어느 입면이나 실내를 대표 화면 밖의 무소유 공간으로 남기지 않는다. 인테리어를 제외한 외관만의 집으로 납품 범위를 줄이지 않는다.
@evidence principles/core/common.md#substantive-completion 본채의 부모와 자식, 외부와 실내를 가르는 경계, 층 사이 유일한 연결이 결정되어 있다. 구현자는 house의 계층을 새로 고르지 않고 링크된 층과 표면 결정을 조합한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 한 채·두 층 요구를 house, citizen-site, ground-storey, upper-storey의 포함 관계와 외주·층별 결정의 소비 주소로 구체화했다. 이 계층 배정은 납품 범위의 문장만 반복하는 것이 아니다.
@evidence principles/design/spaces.md#space-topology 본채는 site에 포함되고 두 층을 포함하며 외주 opening과 단일 계단만으로 외부·층간 연결을 가진다. 별동이나 별도 계단을 mesh의 우연한 접촉으로 추가할 수 없다.
@evidence principles/design/spaces.md#space-boundary-authority 본채 크기와 두께는 002의 mass-and-storeys, 방 연결은 두 partition, 외피는 003의 입면들이 소유한다. 이 조립 관계 H2는 그 값을 다시 적거나 다른 외곽으로 덮어쓰지 않는다.
@evidence principles/design/spaces.md#space-verification-address 전체 공간 관찰과 stage-one-verification을 통해 house/site 포함, room/storey 귀속, 층간 계단과 외주의 불연속을 묻는다. 단순히 집 이름이 존재하는 것으로 이 관계를 검증하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work settings/001의 단일 library 납품과 settings/003의 두 층·한 계단을 house의 계층 및 외주 분담과 대조했다. 이 구조에 추가 world나 별동이 필요하지 않아 부모 범위를 수정하지 않았으며 maps는 선택되지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 한 본채·두 storey·단일 계단을 집 수준에서 고정하고 중정·브리지·캔틸레버·복층 거실을 추가하지 않는다. 실제 통행과 curtainwall 대응은 연결한 세부 owner와 컴파일 검증이 답해야 한다.
@evidence settings/001-production.md#delivery-scope 시간축 없는 집 하나의 범위를 site, house, 두 storey와 각 실내의 포함 관계로 실현한다. reference를 geometry asset으로 끼워 넣는 별도 장소를 만들지 않는다.
@evidence settings/001-production.md#governing-aim 현관에서 생활 구역과 단일 계단으로 이어지는 관계를 두 partition의 직접 소비로 남겨, 외관을 닮게 하는 추가 체적보다 일상 동선을 우선한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 외주의 완결 표면과 각 층·방의 구현 책임을 settings의 단독 배정으로 연결한다. 집 조립 owner가 같은 창호나 바닥을 중복 생성할 권한을 갖지 않는다.
@evidenceExclude settings/001-production.md#module-boundary 선택된 spaces 세 파일의 site/building/storey/room, wall·opening·stair, 입면·corner와 관찰 도출을 대조했다. 이 결정들은 typed topology의 포함·치수·연결·가시성 관계이며 어느 H2도 engine을 어느 모듈 로더로 실행할지 결정하거나 그 형식을 입력으로 사용하지 않는다. 관찰 도출 역시 컴파일 산출물의 face/cell을 소비할 뿐 CJS에서 수치가 달라지는 규칙이 아니다. CJS 서버·Node import 경계는 이 population 밖의 실행 도구가 settings에서 직접 소비한다.
@evidenceExclude settings/001-production.md#settings-coverage-map 설정 population의 canon 배분 지도는 이 본채의 방이나 경계를 하나 더 만들지 않는다. 공간은 그 지도 문장을 복사하지 않고 납품 범위·층 그래프·외피·관찰의 실제 설정 H2를 각각 소비한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb house의 단일 본채 성격과 금지된 체적은 고정 그래프에 근거하고, citizen-site 아래에 두 storey를 두는 식별 관계는 이 설계의 결정이다. 외곽과 층 datum은 mass-and-storeys를 가리켜 여기서 치수를 독립적으로 추정하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 house 아래의 두 층과 각 방을 남기고 외주 전체를 네 입면과 지붕으로 연결한다. 외관만 있는 모형으로 범위를 줄이거나 화면에 안 잡힌 층의 실내를 납품 밖으로 빼는 해석은 이 포함 관계와 맞지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 building의 parent와 두 storey의 주소, 외부로 통하는 opening의 소속, 층 사이 유일한 계단이 정해져 있다. 다음 구현 단계가 집의 계층이나 외피와 내부 연결의 조립 방식을 새로 선택해야 하는 빈 이름에 머물지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 납품 범위의 ‘주택 한 채’와 생활 동선의 요구를 house–citizen-site 및 ground-storey·upper-storey의 주소 관계로 바꾸고, 분할과 외피의 실제 설계 owner를 연결했다. 이 부모들은 그러한 id와 설계 파일 간 결합을 이미 정해 놓지 않았다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 house가 대지 안에 있고 방들이 두 storey에 속하며 외주 boundary의 opening과 단일 계단으로 외부 및 층간 통행이 이어진다. 이 관계는 mesh가 우연히 맞닿는 모습을 해석하지 않고 본문과 연결된 partition에서 읽을 수 있다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 집 조립은 mass-and-storeys의 외곽·datum·두께를 다시 수치로 소유하지 않는다. 방 배치는 두 partition으로, 닫힌 외주는 외피의 완결 표면으로 넘겨 같은 집에 두 번째 크기나 경계가 생기지 않게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 포함·도달·외피 불연속을 전체 공간 관찰과 stage-one-verification에 연결했다. house라는 id가 존재해도 room의 층 귀속이나 계단 연결이 어긋나면 이 검증 역할에서 실패할 수 있어 이름 등록을 검증으로 대신하지 않는다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 단일 library의 납품 범위와 두 층·한 계단의 조건을 집의 포함 구조 및 외주 분담에 대조했다. 이 집 수준의 조립에는 별동이나 추가 world가 필요하지 않았고 maps도 선택되지 않아 이 단위 때문에 부모의 규모·연결 권한을 바꿀 근거는 없다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 집 수준에서는 한 본채 아래 두 층을 두고 그 사이 통행을 single-stair로 한정하며 중정·브리지·추가 계단과 복층 거실을 배제한다. 세부 room 연결과 curtainwall 대응은 링크된 설계와 미지급 컴파일 검사에 남겨 이 조립 문장만으로 고정 그래프의 실현을 승인하지 않는다.
@evidenceReview settings/001-production.md#delivery-scope #e314261 재사용할 집의 공간 범위를 citizen-site, house, 두 storey와 그 안의 방으로 배정한다. 별동이나 추가 체적을 만드는 납품으로 확장하지 않으며 외피와 실내를 같은 본채의 구성으로 유지한다.
@evidenceReview settings/001-production.md#governing-aim #e9869fc 1층과 2층 partition 및 단일 계단을 집 조립의 직접 입력으로 삼아 현관 이후의 생활 동선을 보존한다. 외관을 꾸미기 위해 추가 계단이나 분리된 체적을 허용하는 조립이라면 이 지배 목적을 소비한 현재 관계가 성립하지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #fc2e198 입면·층·방의 건축 면 주소와 물체 prototype·instance·조명 과정·finish 결합의 다른 owner를 읽었다. 현행 메시 교체는 각 기존 element를 후속 part/emitter에 대응시키는 조건 뒤에만 일어나며 이 집 H2는 건축 공간 관계만 연결한다.
@evidenceExcludeReview settings/001-production.md#module-boundary #6450145 세 spaces 파일의 포함 계층, clear 경계, opening·계단·입면 및 관찰 도출을 모두 대조했으며 어느 결정도 CJS나 ESM을 공간 입력으로 삼지 않는다. stage-one-verification이 컴파일 뒤의 검사를 요구하는 사실도 모듈 로더의 선택은 아니므로, 이 foundation target의 직접 소비는 공간 population 밖의 실행 source와 viewer에 남는다.
@evidenceExcludeReview settings/001-production.md#settings-coverage-map #b9b42d6 설정 소유 지도가 방·문·외피를 spaces에, 물체 형상을 models에, 배치를 instances에 배정한 개정 문장을 확인했다. spaces population은 납품 범위·좌표·층 그래프·외피의 실제 H2를 소비하고 물체 배치 결정을 가져오지 않으므로 이 지도 자체를 공간 사실로 중복 인용하지 않는다.
-->

본채 space id house는 [citizen-site](#site-access)의 자식인 단일 본채다. [ground-storey](002-spatial-graph.md#ground-level)와 [upper-storey](002-spatial-graph.md#upper-level) 두 층을 포함하고 각 방은 해당 층에 귀속한다. 엔진의 building unit id citizen-house는 이 전체 대지·본채를 한 단위로 소유하며, 논리 루트는 부모가 없는 citizen-site, 가시 요소 루트는 house-root다. 단위의 논리 루트 바인딩과 본채의 공간 id를 구분하며 별도 건물 단위를 추가하지 않는다. 본채의 외곽·층 datum·벽 두께는 [매스와 층](002-spatial-graph.md#mass-and-storeys)이 유일하게 소유한다.

본채의 닫힌 외주는 [네 입면과 지붕](003-surface-ownership.md#whole-surface-owners)이고 외부와 실내는 그 boundary에 선언된 opening으로만 이어진다. [1층](002-spatial-graph.md#ground-partition)과 [2층](002-spatial-graph.md#upper-partition) 사이 통행은 [단일 계단](002-spatial-graph.md#single-stair) 하나다. 별동·중정·브리지·캔틸레버·추가 계단·복층 거실을 포함하지 않는다. 이는 [고정 그래프](../contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements)의 본채 realization이며 세부 형상은 아직 컴파일 전이다.

완결 표면의 작성자와 파일 배정은 [표면 분해 선언](../settings/003-spatial-basis.md#surface-decomposition)에 보존한다. [전체 공간 관찰](#spatial-observation)과 [검증 역할](002-spatial-graph.md#stage-one-verification)이 포함·도달·외피 불연속을 반증한다. 현재 review 선언은 이전 시각 승인을 뜻하지 않는다. 기각된 구현과 선택한 제자리 재작성의 근거는 [원점 재검토 기록](../../.wiki/99-worklog/2026-09-21-reassessment.md#restart-review)에 남아 있다.

## 대지와 전면 접근 {#site-access}

<!--
@evidence settings/001-production.md#delivery-scope 주택 한 채의 작은 앞마당 범위를 citizen-site와 전면 보도·현관 도착으로 배정한다. 주변 건물이나 교통망을 새 납품 영역으로 추가하지 않는다.
@evidence settings/003-spatial-basis.md#coordinate-datum 본채와 같은 metre·Y-up 좌표에서 site bounds와 지면·tread 높이를 정하고 현관 floor datum을 소비한다. reference 픽셀을 측량 치수로 사용하지 않는다.
@evidence settings/004-observation.md#accessibility-products 세 단차로 구성한 도착 경로를 실물 무장애 인증으로 보고하지 않는 공간 설계상의 경계를 소비한다. 키보드나 음성 제품의 구현 책임을 대지 geometry의 통과로 대신하지 않는다.
@evidenceReview settings/001-production.md#delivery-scope #e314261 site의 15.60×17.00m 안에 집·앞마당과 임시 작업 예약면을 배정했다. 배수망은 집수구 접속 밖을 납품하지 않아 작은 대지라는 범위를 주변 기반시설로 확대하지 않는다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum #8a862c9 같은 m·Y-up의 y=-0.45 지면에서 세 번 0.15m 올라 현관 y=0에 닿는다. 집수구도 이 지면 아래 깊이로 정의하여 관·보도에 다른 높이 기준을 만들지 않는다.
@evidenceReview settings/004-observation.md#accessibility-products #2e72dbe 세 단차와 flush 격자를 정하면서도 무장애 인증·주행 하중을 미검증으로 명시했다. 물리적 도착을 그렸다는 사실로 viewer의 키보드 대안이나 비시각 동등성을 인증하지 않는다.
-->

<!--
@evidence principles/core/common.md#declared-basis 작은 대지와 전면 접근은 납품 범위에서 상속하고, 대지 폭·깊이·보도와 세 단차는 이 H2의 저작 입력으로 명시했다. 본채 높이와 위치는 mass-and-storeys를 소비하며 측량 사실을 주장하지 않는다.
@evidence principles/core/common.md#scope-preservation 본채 앞마당과 보도부터 현관문까지의 도착을 포함한다. 식재가 접근을 덮지 못하게 하고 주변 교통망을 새 납품 대상으로 끌어오지 않는다.
@evidence principles/core/common.md#substantive-completion 대지 외곽, 지면과 그 지면이 본채 plinth에 닿는 접합, 보도, 접근 폭, 두 tread와 landing의 위치·높이와 지면부터의 채움 및 문과의 접속을 결정했다. 단차를 그리는 source가 계단 개수나 마지막 도착 높이, 떠 있는 부재를 발명하지 않아도 된다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 작은 대지와 주택 진입을 실제 site 범위와 전면 보도·계단의 연속 경로로 해석했다. 부모의 좌표 관례에 대지 치수와 지면부터 문까지의 접속 결정을 더한다.
@evidence principles/design/spaces.md#space-topology citizen-site 안에 house가 있으며 보도에서 전면 계단과 landing을 지나 front-entry로 연결된다. 남은 가장자리 식재는 이 도착 route를 점유하지 못한다.
@evidence principles/design/spaces.md#space-boundary-authority site bounds와 각 tread는 여기서 소유하고 본채 및 현관문은 각각 mass-and-storeys와 front-entry를 참조한다. 문 위치를 조경 파일에 독립 복제하는 기준을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address stage-one-verification의 containment·tread 접지·문 threshold와 setting 관찰이 대지 주장을 반증한다. 식재와 창 점검 공간의 간섭도 garden owner의 실물 관찰에 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work settings의 작은 앞마당, 좌표 관례, 현관 직접 진입을 ground datum과 전면 문 범위에 대조했다. 세 단차로 도착을 구성할 수 있었고 실물 무장애 인증은 부모도 약속하지 않아 경사로나 넓은 외부 망을 추가하는 부모 수정은 필요하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 본채 하나가 있는 대지에서 전면 현관으로만 도착하며 별동·브리지나 두 번째 내부 계단을 도입하지 않는다. 외부 세 단차와 내부 단일 꺾임계단의 역할을 혼동하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 작은 앞마당은 delivery-scope에서, 집 datum은 mass에서 받고 site 경계·tread는 지역 저작값으로 선언했다. 장비 reach는 roof 원본을 참조해 조경자가 별도의 장비 성능을 가정하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 현관 접근·식재와 함께 두 유지관리 예약대 및 관 아래 집수 공간을 garden에 남겼다. 식재를 우선해 작업 여유를 지우거나 집수구 밖 우수망까지 납품했다고 할 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 대지 지면이 본채 외곽 밖에서 끝나 plinth에 y=-0.45로 닿는 접합, 지면 위 tread·landing·후면 포장을 지면부터 자기 상면까지 채우는 규칙, 지면 높이의 보도·예약대 포장·cassette 예약면을 흙 바닥 y=-0.852까지 채우는 규칙을 정했다. 그 바닥은 집수 공간 바닥판 하면이어서 집수 공간의 벽과 출구도 흙 안에 묻힌다. 두 tread·landing의 구간과 높이, staging pad와 flush 집수구의 범위·깊이·출구도 있어 구현자가 단차 수·도착 높이·지면 아래 관 끝을 발명하거나 떠 있는 부재를 남길 여지가 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 작은 대지와 현관 도착이라는 부모 조건을 실제 세 단차·예약대·집수구로 전개했다. roof가 요구한 여유를 기존 대지 안의 점유 금지 구역으로 해결하는 것이 site의 추가 결정이며, 식재 재배치는 roof-face의 결정을 garden이 실현한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 보도에서 landing을 거쳐 front-entry에 닿는 한 도착 경로를 유지한다. 양 측면 예약대는 임시 장비 공간이며 집에 새 출입 connector나 별동을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 site는 지면·계단과 집수구를 소유하고 현관문은 front-entry, 장비 envelope는 roof를 소비한다. 관과 격자 사이 0.15m 낙차가 두 owner의 접합 결과로 명시되어 독립된 출구 높이를 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 containment·tread 접지·문 threshold와 식재의 접근 간섭을 전수 관찰에 붙였다. 예약대나 PV 탈거 공간을 수관이 침범해도 조경의 외관 한 장만 보고 성공 처리할 수 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 작은 앞마당과 현관 직접 진입은 세 단차로 이어지며 2m 장비 예약대도 기존 site 경계 안이다. 장비·하중 인증은 부모의 약속이 아니므로 대지를 넓히거나 경사로를 추가하는 settings 수정이 필요하지 않다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 외부 세 단차는 한 현관으로만 이어지고 내부 꺾임계단을 대체하지 않는다. 임시 장비·cart의 예약면을 별동·브리지나 두 번째 주택 출입 동선으로 만들지 않았다.
-->

[작은 앞마당의 납품 범위](../settings/001-production.md#delivery-scope)를 site id citizen-site로 배정하며 본채 house를 포함한다. [좌표 관례](../settings/003-spatial-basis.md#coordinate-datum)를 따른다. broad world·주변 건물·공공 교통망은 만들지 않는다. x=-7.80..7.80, z=-8.50..8.50m의 15.60×17.00m 경계를 이번 저작 치수로 채택한다. 지면 기준 y=-0.45m이며 본채의 위치·외곽과 층 datum은 [매스와 층](002-spatial-graph.md#mass-and-storeys)을 소비한다. 대지 지면은 본채 외곽 밖에서 끝나 [1층 owner](002-spatial-graph.md#ground-level)의 plinth 외면에 y=-0.45로 맞닿고 본채 아래로 이어지지 않는다. 지면 위 부재(현관 tread·landing, 후면 포장)는 지면에서 자기 상면까지 채워 떠 있지 않다. 대지 흙은 집수 공간 바닥판 하면 y=-0.852부터 지면 -0.45까지이며(집수 깊이 0.40m와 바닥판 0.002m), 지면 높이에 놓이는 보도·측면 예약대 포장·cassette 예약면도 흙 바닥 y=-0.852부터 채워 그 아래에 빈 공간을 남기지 않는다. 이 치수는 측량값이나 기존 산출물 유지 판정이 아니다.

전면 보도는 z=-8.50..-7.70m이고, 현관 접근은 x=1.30..2.90m의 폭으로 z=-7.70에서 [출입문](002-spatial-graph.md#front-entry)까지 이어진다. z=-7.44..-7.12의 첫 tread 상단은 y=-0.30, z=-7.12..-6.80의 둘째는 y=-0.15, z=-6.80..-6.00의 문 앞 landing은 y=0이다. 각 rise 0.15m의 세 단계가 지면과 현관을 잇는다. 마지막 landing은 문 구멍을 통해 현관 바닥에 닿고 식재를 놓지 않는다. 이 도착 경로는 [접근성 납품의 구분](../settings/004-observation.md#accessibility-products)에 따라 실물 무장애 인증이나 경사로의 대체물이 아니다.

대지의 남은 가장자리 식재는 이 접근과 창 바로 앞의 점검 폭을 막지 않는다. 조경 전체는 garden owner 한 명이 소유하고 식물별 접지·수관과 창의 간섭을 실물 관찰에서 확인한다. [전수 검증](002-spatial-graph.md#stage-one-verification)은 site/house containment, 세 tread의 접지와 문 threshold, setting·모든 노출 외부 면을 질문한다.


캐노피 r2의 [점검·배수 인터페이스](003-surface-ownership.md#roof-face)가 요구하는 양 측면 폭 2.00m 예약대를 garden owner가 지면과 함께 소유한다. 그 예약대는 기존 대지 안에서 고정 수간·관목·화단 턱을 두지 않는 평탄한 잔디 보강 포장으로 남기고 임시 장비 바퀴가 도착할 때 다른 공간으로 이어지는 새 connector를 만들지 않는다. 장비 envelope와 도달 높이의 수치 원본은 roof-face다. 경계 바로 위의 전선·수관도 PV 탈거 공간을 침범하지 않는다. 장비 진입 중 보행자와의 동시 사용이나 차량 하중 인증은 unverified다. 전면 x=-4.30..-2.80,z=-8.50..-6.30의 1.50×2.20m는 내려놓은 cassette와 운반 cart의 임시 예약면으로 쓰며 식재를 놓지 않는다. 이 면은 현관의 x=1.30..2.90 접근과 분리되고 보도를 지나는 유지관리 작업 때만 점유된다. 영구 부속 건물이나 창고를 추가하지 않는다.

[우측 입면 배수관](003-surface-ownership.md#right-face)의 열린 하단 아래에 x=-6.10..-5.55,z=-0.30..0.30, 상단 y=-0.45의 flush 집수 격자를 두고 그 아래 깊이 0.40m의 보이는 집수 공간을 garden owner가 만든다. 관 출구 y=-0.30과 격자 사이 낙차는 0.15m다. roof overflow의 x=-5.90,z=-0.10..0.10 수직 낙수 범위도 이 격자 안이다. 격자는 0.55×0.60m 전체를 위로 드는 탈착 면이고 위에 고정 화분·식재를 놓지 않는다. 지중 배출 연결점은 집수 공간의 -X 벽 하단 y=-0.80, 내경 0.10m로 명시하되 그 바깥 지중 우수망은 납품하지 않는다. 이 접속은 보이는 fixture와 점검 공간을 납품한다는 household 범위의 끝이며 유량·지반 침투·부지 밖 우수 처리의 실물 성능은 unverified다. 격자의 주행 하중 또한 인증하지 않는다.

식재의 정비 재배치는 [roof-face의 조경 이동·보존 결정](003-surface-ownership.md#roof-face)을 소비한다. 그 결정이 나무·관목·낮은 풀의 원래 위치, 후면 목적지와 회전·반복식, 보존할 ID·형상·재료를 소유한다. garden owner는 이를 같은 대지 조립에서 실현하며 현관 경로나 집수구를 식물에 맞춰 옮기지 않는다. 이 H2를 실현하는 `citizenHouseSpaceSource`의 evidence 관계는 `buildHouse()`→`garden(a)`와 그 식물의 native bounds를 검사하는 `auditCanopy`까지 잇는다. 뒤로 옮긴 식재가 현재 여유를 만족하는지는 그 컴파일 결과와 기존 setting·외부 관찰로 확인하며, 조경의 최종 시각 완성이나 실제 장비 운용으로 확대 해석하지 않는다.

## 공간 관찰의 도출 {#spatial-observation}

<!--
@evidence principles/core/common.md#declared-basis raster와 eye는 settings/004의 관찰 장치, 전체 분모는 settings/001의 종료 조건에서 상속한다. 그 분모를 boundary face·opening profile·cell·surface·connector에 연결하고 L자 추가 질문을 정하는 것이 이 H2의 공간 결정이다.
@evidence principles/core/common.md#scope-preservation setting·모든 노출 외부 면과 모서리·지붕/하부·개구 및 모든 공간의 threshold·corner·cardinal을 남긴다. 실패 위치나 두 L자 방 때문에 어려운 관찰을 지우지 않고 다섯 reference도 추가한다.
@evidence principles/core/common.md#substantive-completion 평면은 cell와 벽·문·route, 계단 단면은 tread·구멍·도착, 입면은 bay와 층·방 경계를 함께 보도록 결정했다. 검사 도구가 보기 좋은 몇 방향을 임의 분모로 고를 수 없다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 정한 외부·실내 관찰 역할을 현재 집의 경계와 두 L자 방의 오목 모서리·연장부에 배정하고, 계단과 bay의 반례를 드러낼 plan/section/elevation 조합을 더했다.
@evidence principles/design/spaces.md#space-topology 각 시점은 해당 공간 내부나 노출 면의 바깥이라는 포함 관계를 답해야 한다. cell 밖 L자 corner는 다른 위치로 성공 처리하지 않고 별도 실패 주소를 유지한다.
@evidence principles/design/spaces.md#space-boundary-authority 카메라 조건은 관찰 장치에서, 위치와 수의 최종 기준은 현재 컴파일 topology에서 읽는다. 이 문서가 source와 다른 방 경계나 opening 목록을 관찰용 사본으로 소유하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 평면·단면·입면·실내외 원근이 각각 드러낼 단절·slab 충돌·bay 불일치를 구분하고 실패 id와 source·상태·URL·RENDERER의 연결을 요구한다. frame 자체로 치수 계측을 대체하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work settings/004의 0.25m inset, 내부 eye와 실패 id 유지 조건을 두 L자 방·작은 core에 대조했다. 조건을 만족하지 않는 위치를 실패로 남기는 규칙이 이미 있어 임의 축소나 부모 camera 조건 변경으로 회피할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 고정 그래프의 room/storey·문·단일 계단과 curtainwall의 room/floor 대응을 각각 실제 topology와 화면의 질문으로 남긴다. 절개 조감이나 다섯 대표 reference로 전수 분모를 대신하지 않는다.
@evidence settings/001-production.md#delivery-review-condition 컴파일된 외피와 공간에서 질문을 파생하고 실패 id도 남기며 다섯 reference를 그 위에 더한다. 검사 수단인 절개를 기본 납품 외관으로 세지 않는다.
@evidence settings/001-production.md#delivery-fidelity 실내 원근과 외부 실제 geometry 관찰을 평면·단면 진단과 구별한다. 공간 라벨이나 box cell이 보인다는 것만으로 방과 부재가 읽힌다고 승인하지 않는다.
@evidence settings/004-observation.md#review-apparatus settings가 소유한 raster·lens·eye와 공간 안 시점 조건을 그대로 소비하고 compiled normal/bounds에서 외부 관찰을 산출하게 한다. camera 위치가 성립하지 않는 경우를 실패 id로 보존한다.
@evidence settings/004-observation.md#accessibility-products 텍스트로 읽을 공간·관찰 id를 topology에서 파생하는 공간 입력을 제공하며 실패 id도 목록에서 지우지 않는다. 이 관계는 공간 질문의 식별 가능한 설계를 답하고, 키보드·focus·자막 등의 UI 납품이나 시각 판정의 비시각 동등성을 구현했다는 뜻이 아니다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb raster·lens·eye는 관찰 장치에서 받고 전체 관찰 분모는 종료 조건을 따른다. 현재 집의 boundary.face·opening.profile·cell·surface·connector에 질문을 붙이고 두 L자 방의 추가 관찰을 정하는 부분이 이 공간 설계의 몫으로 구별된다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 외부의 노출 면·모서리·지붕·하부·개구와 실내의 threshold·모서리·중심 방위를 모두 남긴다. L자 방에서 성립하지 않는 위치를 삭제하거나 다섯 reference 화면으로 전체 분모를 치환하지 않아 어려운 관찰도 완료 조건에 남는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 평면에서는 cell·벽·개구·connector, 계단 단면에서는 tread·route·slab opening·도착 바닥, 입면에서는 jamb·floor line·bay를 함께 대조하도록 정했다. 도구 구현자가 어떤 관계를 겹쳐 보아야 할지 새로 발명하거나 임의의 대표 view만 선택할 여지가 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 관찰 조건을 현재 경계와 개구·cell에 연결하고 두 L자 방의 오목 모서리와 연장부를 추가 질문으로 지정한다. 계단 단면과 입면에서 함께 볼 부재 관계도 정하여 카메라 조건을 다시 적는 것 이상의 공간별 반증 구성을 제공한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 외부 관찰은 해당 면의 world normal 쪽 바깥에, 실내 관찰은 자기 공간 내부에 있어야 한다. L자 cell 밖의 box corner를 성공 시점으로 바꾸지 않으므로 관찰 설계 역시 방의 안팎과 경계를 보존한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 카메라 장치의 수치는 settings owner를 소비하고 관찰 id와 위치의 기준은 현재 컴파일된 face·cell·opening 등에 둔다. 검사 편의를 위해 다른 방 경계나 수동 개구 목록을 병렬로 소유하지 않아 source와 관찰 사본이 따로 바뀌는 구조를 허용하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 문과 벽을 지나가는 connector는 평면에서, slab과 계단 도착의 충돌은 단면에서, bay와 방·층 경계의 불일치는 입면에서 드러나게 한다. 각 반례를 실패 id·source·상태·URL·RENDERER에 연결하므로 관계가 깨진 위치를 추적할 수 있으며 현재 결과는 unverified로 남긴다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 관찰 장치의 0.25m inset과 내부 눈높이·중심 조건을 두 L자 방과 작은 코어 공간에 대조했다. 부모가 이미 성립하지 않는 위치의 실패 id 보존과 추가 관찰을 허용하므로, 어려운 위치를 감추기 위해 camera 기준이나 전체 분모를 부모에서 낮출 필요는 없다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d room/storey 귀속과 문·단일 계단의 연결, curtainwall의 room/floor 대응을 실제 topology 및 각 공간의 화면에서 반증하도록 남긴다. 절개 조감이나 reference 몇 장을 통과하면 이 고정 그래프의 전수 검사가 끝난다는 대체 조건을 만들지 않았다.
@evidenceReview settings/001-production.md#delivery-review-condition #c796e5c 질문은 컴파일된 경계·개구·공간에서 도출하고 실패 id도 분모에 유지하며 다섯 reference는 추가한다. 절개 진단을 납품용 외관으로 세지 않으므로 종료 조건이 대표 화면의 성공 수로 축소되지 않는다.
@evidenceReview settings/001-production.md#delivery-fidelity #374c8c8 평면·계단 단면·입면의 진단과 방 안 원근·외부 실제 geometry 관찰을 구별하고 전자가 후자를 대신할 수 없게 한다. 논리 cell이나 검사용 겹침이 보인다는 사실만으로 생활 공간과 부재의 읽힘을 승인하지 않는다.
@evidenceReview settings/004-observation.md#review-apparatus #1872595 raster·lens·eye를 관찰 장치에서 직접 받으며 외부 거리는 compiled bounds와 FOV, 관찰 방향은 실제 면의 world normal을 사용한다. 자기 공간 밖인 L자 corner는 실패로 남겨 장치 조건을 만족하지 않은 시점을 정상 내부 관찰로 기록하지 않는다.
@evidenceReview settings/004-observation.md#accessibility-products #2e72dbe 공간·관찰 id를 topology에서 도출하고 실패한 id까지 유지하여 텍스트로 식별할 질문 목록의 공간 입력을 제공한다. 이 설계 관계는 focus·키보드 조작이나 비시각 동등성의 구현 완료를 뜻하지 않으며 실제 UI 납품은 viewer에 남는다.
-->

[관찰 장치](../settings/004-observation.md#review-apparatus)의 raster·lens·eye 조건을 소비한다. 산출물의 boundary.face·opening.profile·space cell·surface·connector를 기준으로 전체 관찰 id를 도출하며 실패한 id도 분모에 남긴다. 검사 도구 구현은 src/viewer가 소유하고 이 H2는 어떤 공간 관계를 관찰해야 하는지 소유한다.

대지 setting 1개, 모든 외부 boundary의 정면, 인접 노출 face가 만나는 모서리, 지붕 상면과 노출 하부, 모든 opening·출입구를 묻는다. 외부 카메라는 해당 면의 world normal 쪽 바깥에서 면 중심을 향하고 거리는 compiled bounds와 FOV로 산출한다. 실내는 각 space의 threshold, 네 안쪽 모서리, 내부 중심에서 네 방위를 묻는다. box corner가 L자 방 밖이면 성공 위치로 덮어쓰지 않고 실패 id를 남기며 두 L자 방의 오목 모서리·연장부를 추가한다.

평면은 room cell·shared wall·opening·connector를 같은 좌표로 겹쳐 보고, 계단 단면은 tread·route·slab opening·도착 바닥을 함께 본다. 입면은 room jamb·floor line과 bay를 대조한다. 이 진단은 납품용 절개 장면이 아니며 방 안 원근과 외부 실제 geometry 관찰을 대신하지 않는다. 다섯 reference 질문은 이 전체 분모에 추가한다. 실내 reference 03·04·05는 해당 방의 실제 connector에서 도출한 threshold 위치와 방 내부 target을 소비한다. 별도의 최대 bounds 모서리를 카메라로 삼지 않는다. 이 결정은 방별 threshold·네 모서리·중심 네 방위와 외부 관찰의 id나 실패를 삭제하지 않고, 추가 reference 질문의 진입 위치만 수정한다. 정보 패널의 cameraSpace는 reference 그룹명이 아니라 실제 방 id를 표시한다. [전수 검증](002-spatial-graph.md#stage-one-verification)의 각 반례가 실패 id·source·상태·URL·실제 RENDERER에 연결되어야 하며 현재 관찰 결과는 unverified다.


2026-09-22 저작자 관찰: source basis `6db2efe40a066505f4ece4ee8691ee5ac81252ce8d3fbf58b86c967dfb705a4e`, `http://127.0.0.1:4174/?capture=1`, day/work, 1600×1000·DPR1·FOV50°, 벽 제거 없이 reference 03·04·05와 common-room·flex-workroom·upper-corridor의 threshold 총 6개 프레임을 열었다. Chromium channel chromium의 실제 RENDERER는 `ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)`이었다. 별도 수동 WebGL 교정 화면의 좌하 빨강·우상 초록과 readPixels가 일치했고, 이 여섯 장 촬영 중 pageerror·console error는 0이었다. 작업실의 이전 reference eye `(4.86,1.60,-0.72)`는 머피장 부재가 둘러싼 영역 안에 있어 닫힌 패널이 화면을 가렸다. 실제 threshold eye `(3.27,1.60,-1.10)`에서는 책상·의자·두 유리 면이 보였다. 공용부 threshold `(2.05,1.60,0.11)`에서는 식탁·주방·후면 창호, 상층 복도 threshold `(-0.58,4.80,-1.55)`에서는 여러 방의 문틀과 문짝이 보였다. 이 도착 뷰를 추가 reference 입력으로 채택했으며 머피장이나 방 경계는 옮기지 않았다.

이 관찰은 전체 190개 중 여섯 장의 저작자 검사이며 독립 판정이 아니다. child-bedroom-1/corner-0, upper-service/corner-3의 위치 실패 두 건을 유지한다. 작업실 수납장 내부에 놓여 공간을 보여 주지 못했던 이전 카메라 선택을 폐기했고, 공용부의 새 진입 뷰는 소파·계단을 한 장에 보여 주지 않으므로 기존 방별 모서리·중심 관찰에서 각각 답해야 한다. 모든 reference의 같은 건물 읽힘, 전수 실내 읽힘, 계단의 연속 인체 충돌은 unverified다. 카메라 연결 및 cameraSpace 수정 뒤 실행 중인 서버는 source 변경을 HTTP 409로 거부했다. 수정본의 실제 UI 재확인은 조정자의 서버 재시작 뒤에 필요하며 위 여섯 장을 수정 후 서버 검증으로 바꾸어 기록하지 않는다.
