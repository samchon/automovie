# 공간 관찰과 실행 인계

## 공간 산출물에서 파생할 검사 {#spatial-observation-derivation}
<!--
@evidence principles/core/common.md#scope-preservation 외부 setting·노출 입면과 모서리·지붕과 하부·개구부, 방마다 threshold·네 안쪽 모서리·중심 네 방향, 비직사각의 추가 질문, 01–05 추가 질문과 07·08·09·10·방별 사용·대지·울타리의 추가 단면을 한 파생 규칙에 모은다.
@evidence principles/core/common.md#substantive-completion 고정 view 수를 선언하지 않고 실제 공간·boundary·opening·roof 레코드를 만든 뒤 같은 산출물에서 질문과 자기 공간 내부 pose를 파생한다는 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 분모는 compiled-denominator 계약, pose의 눈높이·시야각·near는 frame-condition에서 받고 뷰어의 렌더링·실행·포트 조건은 settings가 소유해 이 H2가 정하지 않는다고 근거를 나눈다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 관찰 배분을 이 집의 계단 높이별 경계, 층간 바닥 가장자리, 천장/지붕 여유, 벽 상단 접촉, 지상층 바탕, 방별 사용 상태, 대지·울타리 접합의 구체 관찰 목록으로 만든다.
@evidence principles/design/spaces.md#space-topology 모든 방이 storey·실제 경계·출입 개구부·복도 또는 계단 경로를 갖고 현관에서 목적지와 돌아오는 길을 모두 검사하도록 한다.
@evidence principles/design/spaces.md#space-boundary-authority 07·08·09·10·방·대지 owner H2를 링크해 그 경계에서 추가 관찰을 파생하고 구조 바탕과 시각 면의 소유를 구별하며 설계의 owner 표를 실제 boundary/surface census로 대신하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 두 storey 평면, 계단·머드룸 문턱·포치 단면, 네 방향 입면과 지붕 합류 경계를 수치 검사로 두고 사람·바구니를 줄여 통과를 얻지 않는다.
@evidence contracts/observation-denominator.md#compiled-denominator 외부와 방별 고정 질문을 실제 공간 산출물에서 파생하고 비직사각의 가려진 부분에 질문을 더하며 01–05 질문을 분모에 추가해 대표 view로 줄이지 않는다.
@evidence settings/20-verification.md#observation-allocation spaces가 storey·방·노출 경계·지붕·개구부의 정체성과 연결을 만들고 matching source가 그 산출물에서 질문·pose를 파생한다는 배분을 공간 쪽에서 실현한다.
@evidence settings/20-verification.md#data-authority 선언된 room binding만으로 지지나 통행을 합격 처리하지 않고 고정 view 수를 미리 선언하지 않으며 문·가구·기기 점유 뒤의 순폭을 최종 산출물에서 다시 읽게 한다.
@evidence settings/20-verification.md#frame-condition 방마다 파생하는 threshold·모서리·중심 pose의 카메라 조건을 프레임 조건에서 받고 경계 때문에 시점을 안쪽으로 옮긴 근거를 pose와 함께 기록하게 한다.
@evidence settings/00-production.md#accessibility 방·경계·대지별 관찰 질문과 자기 공간 내부 pose의 파생 규칙을 글로 남기고 뷰어의 렌더링·실행·포트 조건은 이 공간 문서에서 정하지 않는다.
@evidence settings/00-production.md#use-profile 현관에서 목적지까지 왕복하는 경로 검사에서 use-profile의 사람·바구니 크기를 줄여 통과를 얻지 않고 문·가구·기기 점유 뒤 순폭을 최종 산출물에서 다시 읽는다.
@evidence obligations/design/spaces.md#space-review-set 평면·단면·입면·지붕 합류와 방별 내부 시점, 계단·문턱·포장·울타리 접합 단면을 compiled topology에서 파생하는 유한 관찰 집합으로 선택한다.
@evidenceExclude settings/20-verification.md#viewer-handoff spaces 47개 문서 어디에도 뷰어의 시작 명령·실행 디렉터리·포트·경로를 정하거나 소비하는 공간 결정이 없다. 이 H2가 넘기는 것은 관찰 질문과 자기 공간 내부 pose의 파생 규칙이며 포트와 기동 조건은 settings의 viewer-handoff가 소유한다.
@evidenceExclude settings/20-verification.md#validation-boundary spaces 47개 문서 어디에도 lint나 검증 명령을 입력으로 쓰는 공간 결정이 없다. 이 H2의 unverified 표기는 data-authority의 계측 부재 규칙을 따르며 npm run lint 실행은 저작 turn의 검증 절차이지 경계·경로·관찰의 입력이 아니다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work observation-allocation의 공간-소스 배분, data-authority의 산출물 판독, frame-condition의 초기 pose 조건을 공간 관찰 파생에 적용했고 settings가 관찰 수를 상수로 정하지 않아 파생 규칙과 충돌하지 않아 부모 수정이 없었다.
-->

[관찰 배분](../settings/20-verification.md#observation-allocation)을 받아 [전체 관찰 분모](../contracts/observation-denominator.md#compiled-denominator)를 이 spaces 층에 그대로 적용한다. 현재의 외곽·층 예약으로 고정 view 수를 선언하지 않는다. 실제 공간·boundary·opening·roof 레코드를 만든 뒤 동일 산출물에서 외부 setting, 모든 노출 입면과 만나는 모서리, 지붕과 하부, 모든 개구부·출입구의 질문을 파생한다. 방마다 threshold 하나, 안쪽 모서리 네 곳, 중심의 네 방향을 자기 공간 내부 pose로 생성하고 비직사각형의 가려진 부분은 질문을 더한다. 01–05의 참조 질문은 이 분모에 추가한다.

수치 검사는 두 storey 평면, 계단·머드룸 문턱·포치 단면, 네 방향 입면과 지붕 합류 경계를 사용한다. 모든 방은 storey, 실제 경계, 출입 개구부, 복도 또는 계단 경로를 가지며 현관에서 목적지와 돌아오는 길을 모두 검사한다. use-profile의 사람·바구니 크기를 줄여 통과를 얻지 않는다. 문·가구·기기 점유가 들어간 뒤의 순폭은 최종 산출물에서 다시 읽어야 한다. 실제 topology와 경로 검사는 [측정과 프레임의 책임](../settings/20-verification.md#data-authority)에 따라 현재 unverified다.

[실내 공유 경계](07-boundary-assembly.md#interior-boundary-ownership)는 두 상대 공간과 단일 구조/양쪽 마감 책임을, [교차부·개구부·문턱](07-boundary-assembly.md#interior-boundary-junctions)은 모든 실제 접합의 높이별 단면과 양쪽 방 안 시야를 추가한다. 각 방을 따로 보아 놓치기 쉬운 중복 몸체·교차부 틈·문 뒤의 막힌 벽·문 아래 바닥 구멍을 찾는다. 계단의 보호 경계를 평면 겹침만으로 두 층 높이의 막힌 벽으로 만든 경우도 검사한다. 설계의 owner 표를 실제 boundary/surface census로 대신하지 않는다.

같은 개구부 인계에서는 벽 부착물의 전체 지지 접면과 담긴 물건, 문/창 void·틀·열린 부재를 실내 입면과 높이별 단면에 함께 놓는다. 방 바닥 평면만 보고 통과한 수건걸이가 문 구멍을 가로지르거나 상부장/거울이 창을 막는 경우를 찾는다. [욕조 욕실 수건걸이](rooms/tub-bath.md#tub-fixture-use)는 문 뒤의 실제 닫힌 벽과 걸린 수건을 포함한 돌출, 사용 중/통과 중의 점유를 읽는다. 선언된 room binding만으로 지지나 통행을 합격 처리하지 않으며 실제 부재가 없는 현재 결과는 unverified다.

[계단의 높이별 경계](02-stair.md#stair-boundary-heights)는 아래 flight의 열린 난간, 상층 침실의 닫힌 벽, 복도 추락 가장자리, 도착의 열린 끝과 그 아래 외투장을 같은 단면에서 대조한다. 손잡이 높이와 복도 보호 높이를 구별하고 디딤마다 실제 머리 공간·부재 뒤 순폭을 읽는다. 보호 부재가 있다는 이름만으로 통행이나 추락 경계가 확인됐다고 세지 않는다.

[층간 바닥](08-floor-assembly.md#interstorey-floor-boundary)은 서로 다른 두 층 방 분할과 한 구조 바탕, 양쪽 완성면 및 동일 계단 구멍을 평면/단면에서 대조한다. [가장자리 접합](08-floor-assembly.md#interstorey-edge-junctions)은 외벽 둘레·공유 벽·칸막이 상하·구멍 꺾임/전면 끝·열린 상부 도착 전체를 추가한다. 두 층판 중복, 방마다 끊긴 바탕, 외장 사이로 튀어나온 층판, 마감이 좁힌 계단 구멍, 마지막 챌판 위에 포개진 도착 판을 찾는다. 구조 바탕과 시각 면의 소유를 구별하고 실제 부재 이후의 순높이·머리 공간을 다시 읽는다.

[본채 최상부 천장](09-ceiling-assembly.md#upper-ceiling-closure)은 상층 전체와 계단실의 반사 천장 평면/단면을, [차고 천장](09-ceiling-assembly.md#garage-ceiling-closure)은 전면문 레일과 네 벽 접점을 추가한다. [낮은 지붕 아래 여유](09-ceiling-assembly.md#ceiling-roof-clearance)는 실내 끝선·모서리·지붕 단차·계단 위와 차고 공유 벽에서 실제 부재까지 함께 읽는다. 지붕까지 뚫린 계단실, 계단을 가로막는 낮은 천장, 천장/지붕 또는 레일의 충돌, 수납/난간 위 천장 띠 누락과 중복 마감을 찾는다. 설계식의 여유를 실측으로 대신하지 않으며 방별 기본 관찰을 모두 유지한다.

[외벽 두께 전체의 지붕 접촉](roof/00-junctions.md#roof-wall-head-junctions)은 앞뒤 벽의 외측/중간/내측과 박공 교차선을 지나는 단면을 추가한다. [외벽 모서리/단차의 단일 몸체](07-boundary-assembly.md#exterior-boundary-junctions)는 그 단면과 높이별 평면에서 함께 읽는다. 외측 입면선만 맞고 안쪽에 남은 틈, 내측 높이로 올려 지붕을 관통한 벽, 단차와 앞뒤 벽의 겹친 몸체, 차고 지붕에서 잘린 본채 공유 벽을 찾는다. 실제 부재가 없는 현재 이 검사는 unverified이며 기존 외부/실내 전체 관찰을 대체하지 않는다.

[본채 지상층 바탕](10-ground-floor.md#main-ground-floor-base)과 [차고 바탕](10-ground-floor.md#garage-ground-floor-base)은 전체 바닥 평면·칸막이/계단/수납의 발치와 마감 전환 단면을 추가한다. [네 건물 출입 단면](10-ground-floor.md#ground-threshold-junctions)은 중앙과 양 문설주에서 지지 바탕·문틀·완성 바닥을 함께 읽는다. 실제 지표를 받은 뒤에는 [지지 하단 인계](10-ground-floor.md#ground-support-handoff)의 건물 둘레·공유 벽·외부 포장 접점을 검사한다. 층간 구멍이 잘못 복제된 1층 바닥, 문 아래의 빈띠/겹친 벽, 사라진 머드룸 한 단, 공중에 뜬 바탕과 지표에 묻힌 출입을 찾는다. 지표가 없는 현재 상태를 접지 합격으로 세지 않는다.

[현관 분배](rooms/entry.md#entry-use-routes)는 두 실문의 열림·매트·계단 대기, [외투장](rooms/entry.md#entry-coat-storage)은 물건/미닫이·사용자와 서비스 띠, [거실 좌석](rooms/living.md#living-furniture-use)과 [앞뒤 경로](rooms/living.md#living-through-route)는 벽난로 돌출·테이블·좌석/책장 사용·두 창을 평면/단면과 자기 실 내부 시점에서 대조한다. 문 조작 중과 통과 중, 독서 의자 사용과 책장 횡단을 구별하며 앞뒤 주 경로를 좌석 점유로 줄이지 않는다. 02/04의 현관·거실·계단 관계와 기본 전체 시점은 모두 유지한다.

[공용부의 사용/통행 예약](rooms/common.md#common-clear-routes)은 닫힌 기기와 꺼낸 식사 의자·스툴을 배치한 평면, 각각 열린 냉장고/오븐/식기세척기 앞 작업, 싱크 섬/후면 창/상부장 단면을 추가한다. 중앙 서비스 진입에서 가족실과 정원문으로 가는 경로, 거실에서 주방을 통해 같은 후면으로 나오는 경로를 양방향으로 대조한다. 좌석별 점유의 합집합과 그 전체 bbox를 구별하고 실제 기구 문·손잡이·커튼까지 읽는다. 기구 작업 때문에 막힌 곳을 주 동선으로 중복 계상하거나 식당의 여섯 사용 좌석을 줄여 통과시키지 않는다.

[세탁 작업](rooms/laundry.md#laundry-equipment-use)과 [머드룸 횡단](rooms/laundry.md#laundry-through-route), [파우더룸 사용](rooms/powder.md#powder-fixture-use), [차고 수납/경로](rooms/garage-interior.md#garage-use-routes)는 서비스 통로에서 각 사용 지점까지 갔다 돌아오는 같은 검사에 포함한다. 실문을 조작하는 순간, 실문을 열고 통과하는 상태, 기기/서랍을 열고 작업하는 상태를 구별한다. 벤치 착용과 바로 앞 세탁 작업처럼 공유하는 면적을 동시 사용으로 계산하지 않는다. 두 세탁 기기와 열린 문, 바구니 작업·통과, 머드룸 단차, 변기/세면대 접근, 차고 선반·공구와 전면 패널/레일·측면 창의 평면/단면과 내부 시야를 추가하며 작은 서비스실/빈 차고의 기본 질문도 유지한다.

[팬트리 선반/식품](rooms/pantry.md#pantry-storage-use)과 [문을 연 사용 통로](rooms/pantry.md#pantry-use-route)는 문짝·손잡이·L형 코너·선반 앞턱·담긴 물건을 함께 놓은 평면/단면으로 대조한다. 문을 조작할 때와 들어가 물건을 꺼내 돌아설 때를 구별하고, 같은 문과 서비스 통로를 통해 주방으로 돌아온다. 명목 통로 폭이나 빈 선반만으로 실제 꺼내기·회전을 통과 처리하지 않는다. 팬트리의 기본 전체 내부 시점과 작은 수납실의 기능 읽힘도 유지한다.

상층에서는 [주침실](rooms/primary.md#primary-furniture-use)의 침대 양옆/발치·두 창·열린 서랍·옷방 문, [올리브 침실](rooms/bedroom-two.md#bedroom-two-furniture-use)과 [청회색 침실](rooms/bedroom-three.md#bedroom-three-furniture-use)의 문/침대·꺼낸 의자·옷장·창, [샤워 욕실](rooms/shower-bath.md#shower-fixture-use)의 실문과 미닫이 유리·세 기구, [욕조 욕실](rooms/tub-bath.md#tub-fixture-use)의 왼쪽 통로·창 조작·커튼·기구를 평면/단면과 자기 실 안 시야로 대조한다. [옷방 수납](rooms/wardrobe.md#wardrobe-storage-use)과 [린넨장](rooms/upper-hall.md#upper-linen-storage)은 실제 물건 깊이와 조작 중/통행 중의 점유를 구별한다. 계단 도착에서 각 실의 목적지까지 갔다 돌아오며 기본 관찰과 02·05의 추가 질문을 모두 유지한다.

[대지 내부 접근](site/00-access.md#site-local-routes)은 보행길의 포치 축, T자 교차점과 차도 접속, 차고 문턱과 도로 쪽 끝, 정원문 대기·테라스 중앙 경로·외부 단·아래 대기의 평면/단면을 추가한다. 외부 포장 구역의 threshold·코너·중심 방향을 포함하고 전면 보도에서 집으로, 공용부에서 정원으로 나갔다 돌아오는 양방향 시야를 관찰한다. 아직 없는 maps 경계/지표/도로 연결은 합격한 edge로 세지 않는다. 식재·가구 이후 점유와 모든 실제 노출 면의 질문은 그대로 추가되며 여기 나열한 접점만으로 분모를 고정하지 않는다.

[측면 관리길](site/side-walk.md#side-walk-plan)은 차도 접속의 높이 보간·세 띠의 합류·테라스 아래 대기와의 끝선을, [gate](site/side-walk.md#side-gate-interface)는 닫힘·문 조작·90° 열림과 앞뒤 대기를 추가한다. 앞뒤 두 외부 구역 각각의 기본 시점과 꺾임의 가려진 코너를 유지하며 차도에서 테라스로, 테라스에서 차도로 바구니를 들고 돌아오는 경로를 대조한다. 지표·울타리·식재가 아직 없다는 사실을 빈 장애물 목록이나 완성된 정원으로 해석하지 않는다.

[외부 포장 두께](site/01-paving-support.md#paving-depth-reservation)는 경사 연결로의 끝선뿐 아니라 중간 단면과 아래면을, [높은 포치/테라스](site/01-paving-support.md#raised-platform-support)는 전체 외곽·단 양옆·기둥 아래 지지를 추가한다. [다른 바탕과의 접촉](site/01-paving-support.md#paving-contact-handoff)은 차도 양옆, 낮은 대기/관리길, 건물 문턱과 문기둥 기초를 함께 읽는다. 얇은 공중판, 상면 위로 솟은 지지벽, 합류부 중복 몸체, 바탕을 맞추려고 바뀐 단 높이/보행면, 기초에 끊긴 포장을 찾는다. 지표/기초가 없는 현재 상태는 접지 결과가 아니다.

[maps 입력 인계](site/00-access.md#map-handoff-inputs)가 실현되면 같은 revision의 필지/건물/포장 포함 평면과 두 전면 포트의 전폭 단면, 낮은 포장 가장자리 및 높은 테라스 옆면의 지표 접촉 단면을 추가한다. 처마 아래 지면이 빠지거나 포장 위에 지표가 겹친 곳, 계단을 덮어버린 지표, node의 점만 같고 포트 폭/높이가 다른 곳을 찾는다. 외부 보도에서 두 포트로 들어갔다 돌아오는 경로는 실제 지도 연결이 생긴 뒤에만 검사할 수 있고 현재는 unverified다. 이 접합 질문은 기존 외부·실내 전체 분모와 다섯 참조 질문에 더한다.

[울타리 폐합](site/fence.md#fence-enclosure-plan)은 전체 선과 건물 외피를 함께 보는 평면, 모든 긴 면/꺾임의 안팎 시야, [관리문 양옆 잔여 패널과 벽 접점](site/fence.md#fence-gate-junction), [지표 높이와 기초 점유](site/fence.md#fence-ground-profile)의 단면을 추가한다. 문이 실제 void에 있는지, 짧은 패널을 빠뜨리거나 끝기둥을 벽/포장 안에 넣지 않았는지, 가지/관목이 접합 결함을 가리는지 확인한다. 문을 닫은 경계와 연 뒤의 양방향 관리길 통행을 구별한다. 울타리의 눈에 보이는 모든 면은 실제 산출물에서 포함하고 한 정면 view로 대신하지 않는다.

각 관찰 pose의 눈높이·시야각·near 같은 카메라 조건은 [프레임 조건](../settings/20-verification.md#frame-condition)을 소비하고, 경계 때문에 시점을 자기 공간 안쪽으로 옮겼다면 그 근거를 pose와 함께 기록한다. 이 H2가 인계하는 것은 질문과 자기 공간 내부 pose의 파생 규칙이다. 그 관찰을 보여 줄 뷰어의 렌더링·실행·포트 조건은 settings의 표현과 검증 조건이 소유하므로 이 공간 문서에서 정하지 않는다. 집을 그리는 공간 소스와 그 GPU 프레임은 아직 없어 이 관찰들은 unverified다.

## 다섯 참조에 더하는 공간 비교 {#reference-spatial-comparisons}
<!--
@evidence principles/core/common.md#scope-preservation 다섯 참조 각각의 공간 배정과 반증 비교, maps 입력과 지지 하단의 미완료, branch 몫, 1단계 완료 비선언, 그래프 충돌의 조정자 상향을 맡는다.
@evidence principles/core/common.md#substantive-completion 01은 온전한 외피의 전면과 두 앞 모서리, 02는 검사 모드의 두 storey 절개, 03은 kitchen-dining-family 내부, 04는 현관 분배 바닥 내부, 05는 상부 도착과 복도에서 파생한다는 배정 표를 정한다.
@evidence principles/core/common.md#declared-basis 참조의 권위는 reference-authority, 프레임은 frame-condition에서 받고 이 배정이 설계 문서 사이의 인계라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 다섯 입력 이미지를 이 집의 외곽·지붕군·포치·방·계단·복도 owner와 각 참조에서 반증할 비교 항목으로 연결한다.
@evidence principles/design/spaces.md#space-topology 각 참조의 시점을 해당 공간 내부에서 파생하고 참조의 카메라를 흉내 내려고 방 밖으로 물러나거나 벽을 지우지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 실제 카메라 위치·방향·관찰 id는 같은 revision의 compiled 경계와 frame-condition에서 정하고 이 배정은 exterior-surface-handoff의 표면 소유와 방별 owner를 그대로 소비하며 maps 입력을 spaces의 포장 치수로 대체하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 끊긴 방, 문 뒤의 막힌 벽, 두 번째 층간 연결, 추가 보이드, 머드룸을 거치지 않는 차고 연결, 가려진 계단 출발을 반증 비교로 둔다.
@evidence settings/20-verification.md#reference-authority 01–05를 외관·절개 조감·후면 공용부·현관/거실/계단·상층 사적 구역 순서로 배정하고 02의 차량을 채우지 않는다.
@evidence settings/20-verification.md#frame-condition 실제 카메라 위치·방향을 frame-condition과 compiled 경계에서 정하고 02의 평면·절개를 검사 모드에서만 보아 절개에서 잘 보이는 배치가 온전한 외피의 내부 관찰을 지불하지 않게 한다.
@evidence settings/20-verification.md#lifecycle-boundary 모든 공간의 storey 귀속·도달과 소유된 표면 산출물 없이 1단계 완료를 선언하지 않는다.
@evidence settings/20-verification.md#completion-boundary 관찰자 목록을 미수령으로 기록하고 다섯 비교를 unverified로 둔다.
@evidence settings/20-verification.md#role-boundary 공간 그래프를 바꾸어야만 해소되는 참조 충돌의 결정을 조정자에게 올린다.
@evidence settings/20-verification.md#fidelity 공간 설계 문서를 읽은 결과를 부재나 빛의 관찰 결과로 옮기지 않아 topology 검토만으로 시각 요구를 낮추지 않는다.
@evidence settings/00-production.md#governing-aim 고정 공간 그래프를 먼저 보존하고 그래프 변경이 필요한 참조 세부는 임의 선택하지 않는다.
@evidence settings/00-production.md#operator-access 02의 평면과 절개를 검사 모드에서만 보게 한다.
@evidence settings/00-production.md#build-allocation 부재 원형·마감·반복·조명을 해당 branch가 실현할 일로 남긴다.
@evidence contracts/observation-denominator.md#dual-completion 집의 GPU 프레임·RENDERER·compiled topology가 없고 관찰자 목록도 미수령이라 다섯 비교를 완료로 바꾸지 않는다.
@evidence obligations/design/spaces.md#space-review-set 다섯 참조의 공간 비교를 산출물 전체 관찰에 더하는 추가 관찰로 선택한다.
@evidenceExclude settings/00-production.md#working-language 이 H2의 참조 배정·반증 비교·1단계 완료 경계는 작업 언어에 근거하거나 그것을 바꾸지 않는다. 한국어 서술과 원형 id·경로 표기는 이 배정의 입력이 아니다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work reference-authority의 다섯 입력 순서·차량 종속·한 집 canon 통일과 governing-aim의 그래프 우선을 공간 배정에 적용했고 그래프 변경이 필요한 참조 충돌은 발견되지 않아 부모 수정이 없었다.
-->

[레퍼런스 권위](../settings/20-verification.md#reference-authority)를 현재 공간 owner에 연결한다. 아래 비교는 [산출물 전체 관찰](#spatial-observation-derivation)에 추가할 질문이며 대표 view로 그 분모를 대체하지 않는다. 현재는 설계 문서 사이의 인계다. 실제 카메라 위치·방향·관찰 id는 같은 revision의 compiled 경계와 [프레임 조건](../settings/20-verification.md#frame-condition)에서 정하고 자기 공간 포함을 확인해야 한다. 참조의 카메라를 흉내 내려고 방 밖으로 물러나거나 벽을 지우지 않는다.

| 참조 | 공간과 관찰의 배정 | 현재 설계를 반증할 비교 |
| --- | --- | --- |
| 01 외관 | 온전한 외피의 전면 접근과 두 앞 모서리. [외곽](00-building.md#main-building-extent), [지붕군](roof/00-junctions.md#roof-mass-allocation), [포치](porch.md#porch-roof-columns), [전면 개구부](envelope/front.md#front-openings), [굴뚝](envelope/left.md#chimney-roof-interface), [대지 접근](site/00-access.md#site-access-interface)을 함께 본다. | 왼쪽 교차 박공·오른쪽 낮은 지붕·더 낮은 붙박이 차고의 위계, 거실창과 현관을 덮는 포치, 창과 실제 방의 대응, 기둥/처마/굴뚝/단의 깊이를 비교한다. 포장만 있고 지표·나무·식재가 없으면 외부 setting 질문이 남는다. |
| 02 절개 조감 | [두 storey](01-storeys.md#storey-datums)의 평면과 절개를 검사 모드에서만 본다. [모든 방 연결](05-route-network.md#room-route-network), [같은 계단 구멍](02-stair.md#stair-floor-opening), [공유 경계](07-boundary-assembly.md#interior-boundary-ownership)를 대조한다. | 끊긴 방, 문 뒤의 막힌 벽, 두 번째 층간 연결, 추가 보이드, 머드룸을 거치지 않는 차고 연결을 찾는다. 차고는 사용자 지시대로 비우며 참조의 차량을 채우지 않는다. 절개에서 잘 보이는 배치가 온전한 외피의 내부 관찰을 지불하지 않는다. |
| 03 후면 공용부 | 같은 [kitchen-dining-family](rooms/common.md#common-room-plan) 안에서 주방/싱크 섬·식사 자리·가족 좌석과 [정원문](envelope/rear.md#garden-door)을 보는 내부 시점을 파생한다. 앞쪽 두 진입과 문 너머 [테라스](site/terrace.md#garden-terrace-plan)도 함께 읽는다. | 하나의 방 안 세 기능, 섬의 세 좌석과 식탁 여섯 좌석, 주방 창/정원문의 관계, 의자를 꺼낸 뒤의 경로를 비교한다. 계단과 공용부 사이의 실제 시야는 [계단 뒤 분리벽](02-stair.md#stair-boundary-heights)을 포함한 현 경계로 관찰하며 사진처럼 보이게 그 벽을 임의 제거하지 않는다. |
| 04 현관·거실·계단 | [현관 분배 바닥](rooms/entry.md#entry-use-routes) 내부에서 현관문, [거실 출입](rooms/living.md#living-plan), [아래 flight](02-stair.md#stair-reservation)의 직접 관계를 읽는다. 거실의 벽난로/좌석은 같은 실 내부의 보충 시점으로 잇는다. | 현관에서 세 방향으로 실제 분기하는지, 문과 난간에 가려 계단 출발을 찾을 수 없는지, 거실의 창·벽난로·좌석이 자기 방으로 읽히는지를 비교한다. 현관 시점에서 가려진 거실을 투명 벽이나 다른 집의 가구 배치로 보충하지 않는다. |
| 05 상층 사적 구역 | [상부 도착과 하나의 복도](rooms/upper-hall.md#upper-hall-plan), [계단 창](envelope/front.md#stair-front-window), 각 침실/욕실의 자기 threshold와 [린넨장](rooms/upper-hall.md#upper-linen-storage)을 연결해 본다. | 다섯 실문이 같은 짧은 복도에 닿는지, 계단/복도 보호와 수납이 도착을 막는지, 방별 카펫·욕실 타일·창호·문이 같은 집으로 읽히는지를 비교한다. 문을 열린 상태로 관찰한 결과와 실제 문 조작/통과 검사는 구별한다. |

이 배정은 [전체 표면 소유](03-surface-owners.md#exterior-surface-handoff)와 방별 owner를 그대로 소비한다. maps가 맡는 필지·외부 보도/도로·지표·식재 입력은 [map 인계](site/00-access.md#map-handoff-inputs)가 미완료로 노출하며 spaces의 포장 치수로 대체하지 않는다. 지표를 받은 뒤 결정할 [건물 지지 하단](10-ground-floor.md#ground-support-handoff)과 [포장/문기둥 접지](site/01-paving-support.md#paving-contact-handoff)도 함께 남는다. 부재 원형·마감·반복·조명은 [제작 배분](../settings/00-production.md#build-allocation)의 해당 branch가 실현할 일이다. 공간 설계 문서를 읽은 결과를 그 부재나 빛의 관찰 결과로 옮기지 않는다.

현재 다섯 비교 모두 집의 GPU 프레임·RENDERER·compiled topology/surface census가 없어 unverified이며 관찰자 목록도 미수령이다. spaces 문서 검토와 실제 1단계 폐쇄를 구별한다. 모든 공간의 실제 storey 귀속·문/계단/복도를 통한 도달과 소유된 표면 산출물 없이 [1단계 완료](../settings/20-verification.md#lifecycle-boundary)를 선언하지 않는다. 공간 그래프를 바꾸어야만 해소되는 참조 충돌이 관찰되면 [지배 목표](../settings/00-production.md#governing-aim)에 따라 조정자에게 올린다.

## 공간 산출물에서 실제 렌더로 넘기는 경계 {#engine-render-handoff}
<!--
@evidence principles/core/common.md#scope-preservation model을 가진 element만 내리는 lowerBuiltEnvironment 경계에서 공간 면의 element 인계, 비직사각 공간 표현, standable surface와 보이는 바닥의 구별, 관찰 helper의 null 처리, 계단 connector 검증 한계를 맡는다.
@evidence principles/core/common.md#substantive-completion 논리 room·boundary·opening 선언만으로는 보이는 벽·바닥·창호가 생기지 않으므로 03의 같은 source owner가 같은 저작 입력에서 model을 가진 element로 면을 만들고 비직사각 공간은 볼록 cell 합집합 또는 닫힌 shell로 표현한다는 인계를 정한다.
@evidence principles/core/common.md#declared-basis lowerBuiltEnvironment와 두 helper, landing 검증의 동작은 설치된 공개 엔진 소스를 읽은 조건이며 환경 입력·호출·렌더 결과는 없다고 구분한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 실제 3D 렌더 요구를 공간 쪽에서 받아 공간 면은 surface owner별 model element로, 걷는 면은 검사용 standable surface로 나누는 인계를 정해 공간 선언만으로 보이는 집이 생긴 것처럼 읽히지 않게 한다.
@evidence principles/design/spaces.md#space-topology 계단의 세 stop과 landing의 실제 참 포함을 connector id 유효성과 구별하고 L형 계단실·복도의 안쪽 꺾임 관찰을 같은 compiled 경계에서 추가한다.
@evidence principles/design/spaces.md#space-boundary-authority 보이는 바닥은 08·10과 방·포장 owner의 element가 만들고 standable surface가 그 면을 대신하지 않으며 비직사각 공간의 전체 bbox를 방 부피로 바꾸지 않는다.
@evidence principles/design/spaces.md#space-verification-address null이나 같은 장소로 모인 시점을 성공한 관찰로 세지 않고 각 pose의 자기 공간 내부 위치를 확인하도록 한다.
@evidence settings/20-verification.md#renderer-boundary lowerBuiltEnvironment가 model을 가진 element만 내리므로 standable surface 검사 바닥을 실제 3D 렌더의 보이는 층판이나 대지로 세지 않고 08·10·방·포장 owner의 바닥 부재를 생략하지 못하게 한다.
@evidence settings/20-verification.md#data-authority helper 결과의 개수·좌표를 미리 선언하지 않고 실제 호출·전수 관찰을 unverified로 둔다.
@evidenceExclude settings/20-verification.md#submission-boundary spaces H2 가운데 커밋·푸시 절차를 입력으로 쓰는 공간 결정은 없다. 이 H2의 렌더 인계도 공간 면의 element 표현을 다루며 Git 제출은 저작 turn의 작업 절차다.
@evidenceExclude settings/20-verification.md#execution-boundary spaces 47개 문서는 CommonJS 엔진 경계·서버 구조·실행기를 정하거나 소비하는 공간 결정을 두지 않는다. 이 H2가 기록하는 공개 엔진 동작은 공간 면·standable surface·관찰 helper·landing의 인계 조건이며 서버 구조나 모듈 방식을 정하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work renderer-boundary의 실제 3D 요구를 공개 엔진의 element 경계에 대조했고 각 완결 면을 exterior-surface-handoff의 같은 source owner가 model을 가진 element로 만들면 되어 부모 수정이 없었다.
-->

설치된 공개 엔진의 `lowerBuiltEnvironment`는 환경을 검증하고 실제 model을 가진 element만 세계 변환의 set으로 내리며 원래 built environment도 보존한다. 논리적인 room·boundary·opening 선언만으로는 보이는 벽·바닥·창호가 생기지 않는다. 따라서 이 공간 문서들이 정한 각 완결 면은 [표면 소유](03-surface-owners.md#exterior-surface-handoff)의 같은 source owner가 같은 저작 입력에서 model을 가진 element로 만들어야 하며 별도 좌표로 복제한 집을 두지 않는다. 비직사각 공간은 `IAutoMovieBuiltSpace`의 볼록 cell 합집합 또는 닫힌 shell 중 한 표현을 사용하며 그 전체 bbox를 방의 부피로 바꾸지 않는다. 현재는 공개 엔진 소스를 읽은 조건이며 환경 입력·호출·렌더 결과는 없다.

공간의 standable surface는 이동과 관찰 검사를 위한 바닥 선언이며 [실제 3D 렌더](../settings/20-verification.md#renderer-boundary)에서 보이는 층판이나 대지가 아니다. 보이는 바닥은 [지상층 바탕](10-ground-floor.md#main-ground-floor-base), [층간 바닥](08-floor-assembly.md#interstorey-floor-boundary), 각 방과 포장 owner의 element가 만든다. standable surface가 있다는 이유로 그 면들의 부재를 생략하지 않는다. 카메라·조명·그림자·재질을 포함한 뷰어의 렌더 조건은 settings가 소유하며 이 공간 문서에서 정하지 않는다.

`builtEnvironmentBuildingCensus`와 `builtSpaceObservationStations`를 사용하더라도 [전체 분모](#spatial-observation-derivation)를 줄이지 않는다. 후자는 공간 부피에서 중심 네 방향·bbox 코너에서 안으로 옮긴 네 시점·각 boundary opening의 threshold를 파생하고, 내부 pose를 찾지 못하면 null을 반환할 수 있다. null이나 같은 장소로 모인 시점을 성공한 관찰로 세지 않는다. 이 집의 L형 계단실·복도 등에서 빠진 실제 안쪽 꺾임은 같은 compiled 경계로부터 추가하고 각 pose의 자기 공간 내부 위치를 확인해야 한다. helper 결과의 개수·좌표를 이번 문서에서 미리 선언하거나 기본 네 코너가 모든 오목 코너를 답했다고 주장하지 않는다. 실제 호출·전수 관찰·다섯 참조 대조는 unverified다.

[동선 인계](05-route-network.md#room-route-network)는 boundary 인접성과 사람의 실제 통행을 분리한다. 계단에서는 [단일 connector의 세 stop](02-stair.md#stair-connector-handoff), 참에 도달한 route 위치와 실제 참 면, 단별 부재를 함께 읽는다. 공개 landing 검증은 참조 id와 at 범위를 검사하지만 그 점이 대상 공간 안에 있는지는 보증하지 않으므로 잘못 놓인 참을 유효 id만으로 통과시키지 않는다. steps 집계가 없는 connector를 단별 검사가 끝난 계단으로 보고하지 않는다. 실제 공간 포함·지지·문 조작·치수 및 frame이 없는 현재 결과는 모두 unverified다.
