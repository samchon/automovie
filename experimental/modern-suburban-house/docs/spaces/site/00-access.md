# 대지 안 접근의 접속 책임

## 외부 네트워크에 넘길 포장 끝 {#site-access-interface}

`house-site`는 [본채와 차고](../00-building.md#main-building-extent), 포치와 아래의 외부 접근 구역을 포함할 site다. 건물에 딸린 보행길·차도·테라스는 [ground-storey](../01-storeys.md#storey-datums)의 외부 구역으로도 바인딩한다. 실내 방이나 별도 층을 추가하지 않는다. 좌표는 [공통 기준](../../settings/00-production.md#coordinate-units)을 사용한다. `src/spaces/site.ts`는 이 containment와 접속의 조립 owner이며 포장·지형을 직접 중복 생성하지 않는다.

이 초안은 전면 포장의 바깥 끝을 Z = 6.50 m에 둔다. 이 선은 spaces가 요구하는 포장 끝이며 필지 경계나 공공 보도 선의 선언이 아니다. 같은 선 위 [현관 보행길](front-walk.md#front-walk-plan)의 끝과 [차고 차도](driveway.md#driveway-plan)의 끝은 모두 기존 [앞 보행길 datum](../01-storeys.md#ground-threshold-datums)에 닿는다. maps는 실제 필지 경계와 보도·연석·도로, 하나의 이름 있는 `house-site-access` node를 소유하고 이 두 접속 단면을 그 node의 보행/차도 포트로 받아야 한다. 별개의 두 외부 네트워크를 발명하지 않는다.

현재 maps는 disabled이며 채택된 경계/node가 없다. 따라서 house-site의 세계 경계와 이 두 포트의 외부 연결은 미완료이고, 아래 내부 경로를 외부 도로까지 이어진 것으로 보고하지 않는다. maps 초안의 후보와 근거는 선행 조사에만 있으며 확정된 map geometry를 이 문서에 복사하지 않는다. 상위 boundary가 채택되면 포장 끝·좌표 변환·높이·폭을 양쪽에서 대조하고 불일치는 해당 설계 owner에서 고친다. 실제 map/space binding은 unverified다.

## 포장과 계단의 내부 연결 {#site-local-routes}

현관 경로는 front-walk → front-porch의 아래 대기 → 외부 세 단 → 포치 → front-door → front-entry다. 차도에서 현관으로 걸어올 때는 driveway → front-walk의 가로 연결로 → 같은 포치 경로를 쓴다. 차고의 실내 진입은 기존 [머드룸 연결](../rooms/laundry.md#laundry-plan)이며 외부 차고문은 기본 닫힘을 유지한다. 차고문 작동 검사를 할 때만 열린 상태의 차도/차고 문턱 접속을 관찰한다. 자동차나 차량 주행 과제를 추가하지 않는다.

후면 경로는 kitchen-dining-family → [garden-door](../envelope/rear.md#garden-door) → garden-terrace의 대기 → 중앙 보행 띠 → 테라스 외부 단 → garden-lower-landing이다. 아래 대기에서 실제 정원 지표로의 연결은 maps가 지표를 채택한 뒤 완성한다. 전후 마당을 잇는 측면 관리 경로와 울타리 gate도 해당 경계와 함께 남은 항목이며, 잔디를 통과할 수 있다는 말로 열린 연결을 대신하지 않는다.

각 경로는 [사용 점유체](../../settings/00-production.md#use-profile)와 바구니 폭을 소비한다. 보행면의 단면과 위에서 돌아 내려오는 시야, 문짝 개방 및 후속 가구/식재 점유를 포함한 양방향 통행을 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 추가한다. 외부 구역도 threshold·각 코너·중심 방향의 질문을 부담하고 T자 보행길의 오목한 접점에는 질문을 더한다. 설계 경로는 compiled topology나 관찰 수를 대신하지 않으며 실제 통행·표면 연결은 unverified다.
