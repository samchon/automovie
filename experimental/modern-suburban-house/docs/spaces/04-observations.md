# 공간 관찰과 실행 인계

## 공간 산출물에서 파생할 검사 {#spatial-observation-derivation}

[전체 관찰 분모](../contracts/observation-denominator.md#compiled-denominator)를 이 spaces draft에 그대로 적용한다. 현재의 외곽·층 예약으로 고정 view 수를 선언하지 않는다. 실제 공간·boundary·opening·roof 레코드를 만든 뒤 동일 산출물에서 외부 setting, 모든 노출 입면과 만나는 모서리, 지붕과 하부, 모든 개구부·출입구의 질문을 파생한다. 방마다 threshold 하나, 안쪽 모서리 네 곳, 중심의 네 방향을 자기 공간 내부 pose로 생성하고 비직사각형의 가려진 부분은 질문을 더한다. 01–05의 참조 질문은 이 분모에 추가한다.

수치 검사는 두 storey 평면, 계단·머드룸 문턱·포치 단면, 네 방향 입면과 지붕 합류 경계를 사용한다. 모든 방은 storey, 실제 경계, 출입 개구부, 복도 또는 계단 경로를 가지며 현관에서 목적지와 돌아오는 길을 모두 검사한다. use-profile의 사람·바구니 크기를 줄여 통과를 얻지 않는다. 문·가구·기기 점유가 들어간 뒤의 순폭은 최종 산출물에서 다시 읽어야 한다. 실제 topology와 경로 검사는 현재 unverified다.

[실내 공유 경계](07-boundary-assembly.md#interior-boundary-ownership)는 두 상대 공간과 단일 구조/양쪽 마감 책임을, [교차부·개구부·문턱](07-boundary-assembly.md#interior-boundary-junctions)은 모든 실제 접합의 높이별 단면과 양쪽 방 안 시야를 추가한다. 각 방을 따로 보아 놓치기 쉬운 중복 몸체·교차부 틈·문 뒤의 막힌 벽·문 아래 바닥 구멍을 찾는다. 계단의 보호 경계를 평면 겹침만으로 두 층 높이의 막힌 벽으로 만든 경우도 검사한다. 설계의 owner 표를 실제 boundary/surface census로 대신하지 않는다.

[계단의 높이별 경계](02-stair.md#stair-boundary-heights)는 아래 flight의 열린 난간, 상층 침실의 닫힌 벽, 복도 추락 가장자리, 도착의 열린 끝과 그 아래 외투장을 같은 단면에서 대조한다. 손잡이 높이와 복도 보호 높이를 구별하고 디딤마다 실제 머리 공간·부재 뒤 순폭을 읽는다. 보호 부재가 있다는 이름만으로 통행이나 추락 경계가 확인됐다고 세지 않는다.

[현관 분배](rooms/entry.md#entry-use-routes)는 두 실문의 열림·매트·계단 대기, [외투장](rooms/entry.md#entry-coat-storage)은 물건/미닫이·사용자와 서비스 띠, [거실 좌석](rooms/living.md#living-furniture-use)과 [앞뒤 경로](rooms/living.md#living-through-route)는 벽난로 돌출·테이블·좌석/책장 사용·두 창을 평면/단면과 자기 실 내부 시점에서 대조한다. 문 조작 중과 통과 중, 독서 의자 사용과 책장 횡단을 구별하며 앞뒤 주 경로를 좌석 점유로 줄이지 않는다. 02/04의 현관·거실·계단 관계와 기본 전체 시점은 모두 유지한다.

[공용부의 사용/통행 예약](rooms/common.md#common-clear-routes)은 닫힌 기기와 꺼낸 식사 의자·스툴을 배치한 평면, 각각 열린 냉장고/오븐/식기세척기 앞 작업, 싱크 섬/후면 창/상부장 단면을 추가한다. 중앙 서비스 진입에서 가족실과 정원문으로 가는 경로, 거실에서 주방을 통해 같은 후면으로 나오는 경로를 양방향으로 대조한다. 좌석별 점유의 합집합과 그 전체 bbox를 구별하고 실제 기구 문·손잡이·커튼까지 읽는다. 기구 작업 때문에 막힌 곳을 주 동선으로 중복 계상하거나 식당의 여섯 사용 좌석을 줄여 통과시키지 않는다.

[세탁 작업](rooms/laundry.md#laundry-equipment-use)과 [머드룸 횡단](rooms/laundry.md#laundry-through-route), [파우더룸 사용](rooms/powder.md#powder-fixture-use), [차고 수납/경로](rooms/garage-interior.md#garage-use-routes)는 서비스 통로에서 각 사용 지점까지 갔다 돌아오는 같은 검사에 포함한다. 실문을 조작하는 순간, 실문을 열고 통과하는 상태, 기기/서랍을 열고 작업하는 상태를 구별한다. 벤치 착용과 바로 앞 세탁 작업처럼 공유하는 면적을 동시 사용으로 계산하지 않는다. 두 세탁 기기와 열린 문, 바구니 작업·통과, 머드룸 단차, 변기/세면대 접근, 차고 선반·공구와 전면 패널/레일·측면 창의 평면/단면과 내부 시야를 추가하며 작은 서비스실/빈 차고의 기본 질문도 유지한다.

[팬트리 선반/식품](rooms/pantry.md#pantry-storage-use)과 [문을 연 사용 통로](rooms/pantry.md#pantry-use-route)는 문짝·손잡이·L형 코너·선반 앞턱·담긴 물건을 함께 놓은 평면/단면으로 대조한다. 문을 조작할 때와 들어가 물건을 꺼내 돌아설 때를 구별하고, 같은 문과 서비스 통로를 통해 주방으로 돌아온다. 명목 통로 폭이나 빈 선반만으로 실제 꺼내기·회전을 통과 처리하지 않는다. 팬트리의 기본 전체 내부 시점과 작은 수납실의 기능 읽힘도 유지한다.

상층에서는 [주침실](rooms/primary.md#primary-furniture-use)의 침대 양옆/발치·두 창·열린 서랍·옷방 문, [올리브 침실](rooms/bedroom-two.md#bedroom-two-furniture-use)과 [청회색 침실](rooms/bedroom-three.md#bedroom-three-furniture-use)의 문/침대·꺼낸 의자·옷장·창, [샤워 욕실](rooms/shower-bath.md#shower-fixture-use)의 실문과 미닫이 유리·세 기구, [욕조 욕실](rooms/tub-bath.md#tub-fixture-use)의 왼쪽 통로·창 조작·커튼·기구를 평면/단면과 자기 실 안 시야로 대조한다. [옷방 수납](rooms/wardrobe.md#wardrobe-storage-use)과 [린넨장](rooms/upper-hall.md#upper-linen-storage)은 실제 물건 깊이와 조작 중/통행 중의 점유를 구별한다. 계단 도착에서 각 실의 목적지까지 갔다 돌아오며 기본 관찰과 02·05의 추가 질문을 모두 유지한다.

[대지 내부 접근](site/00-access.md#site-local-routes)은 보행길의 포치 축, T자 교차점과 차도 접속, 차고 문턱과 도로 쪽 끝, 정원문 대기·테라스 중앙 경로·외부 단·아래 대기의 평면/단면을 추가한다. 외부 포장 구역의 threshold·코너·중심 방향을 포함하고 전면 보도에서 집으로, 공용부에서 정원으로 나갔다 돌아오는 양방향 시야를 관찰한다. 아직 없는 maps 경계/지표/도로 연결은 합격한 edge로 세지 않는다. 식재·가구 이후 점유와 모든 실제 노출 면의 질문은 그대로 추가되며 여기 나열한 접점만으로 분모를 고정하지 않는다.

[측면 관리길](site/side-walk.md#side-walk-plan)은 차도 접속의 높이 보간·세 띠의 합류·테라스 아래 대기와의 끝선을, [gate](site/side-walk.md#side-gate-interface)는 닫힘·문 조작·90° 열림과 앞뒤 대기를 추가한다. 앞뒤 두 외부 구역 각각의 기본 시점과 꺾임의 가려진 코너를 유지하며 차도에서 테라스로, 테라스에서 차도로 바구니를 들고 돌아오는 경로를 대조한다. 지표·울타리·식재가 아직 없다는 사실을 빈 장애물 목록이나 완성된 정원으로 해석하지 않는다.

[maps 입력 인계](site/00-access.md#map-handoff-inputs)가 실현되면 같은 revision의 필지/건물/포장 포함 평면과 두 전면 포트의 전폭 단면, 낮은 포장 가장자리 및 높은 테라스 옆면의 지표 접촉 단면을 추가한다. 처마 아래 지면이 빠지거나 포장 위에 지표가 겹친 곳, 계단을 덮어버린 지표, node의 점만 같고 포트 폭/높이가 다른 곳을 찾는다. 외부 보도에서 두 포트로 들어갔다 돌아오는 경로는 실제 지도 연결이 생긴 뒤에만 검사할 수 있고 현재는 unverified다. 이 접합 질문은 기존 외부·실내 전체 분모와 다섯 참조 질문에 더한다.

[울타리 폐합](site/fence.md#fence-enclosure-plan)은 전체 선과 건물 외피를 함께 보는 평면, 모든 긴 면/꺾임의 안팎 시야, [관리문 양옆 잔여 패널과 벽 접점](site/fence.md#fence-gate-junction), [지표 높이와 기초 점유](site/fence.md#fence-ground-profile)의 단면을 추가한다. 문이 실제 void에 있는지, 짧은 패널을 빠뜨리거나 끝기둥을 벽/포장 안에 넣지 않았는지, 가지/관목이 접합 결함을 가리는지 확인한다. 문을 닫은 경계와 연 뒤의 양방향 관리길 통행을 구별한다. 울타리의 눈에 보이는 모든 면은 실제 산출물에서 포함하고 한 정면 view로 대신하지 않는다.

관찰 뷰어는 [렌더 경계](../settings/20-verification.md#renderer-boundary), [CJS 실행 경계](../settings/20-verification.md#execution-boundary), [프레임 조건](../settings/20-verification.md#frame-condition)을 따른다. 이번 조정자 지정 인계값은 포트 4173과 `--port` 인자다. 이는 향후 구현이 받을 조건이고 실행 명령이 준비됐다는 보고가 아니다. 실제 공간 소스·뷰어·GPU RENDERER·프레임은 미구현/unverified다.
