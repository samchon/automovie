# 대지 안 접근의 접속 책임

## 외부 네트워크에 넘길 포장 끝 {#site-access-interface}
<!--
@evidence principles/core/common.md#scope-preservation house-site의 포함 범위, 외부 구역의 ground-storey 바인딩, 전면 포장 끝, maps가 소유할 단일 외부 node와 두 포트, 현재 미완료 상태를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 house-site 포함 대상, ground-storey 외부 구역 바인딩, Z = 6.50 m 포장 끝, `house-site-access` 두 포트, maps disabled로 인한 미완료를 모두 적는지 대조해 인계 범위에 owner 없는 항목이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 전면 포장의 바깥 끝을 Z = 6.50 m에 두고 front-walk와 driveway의 끝을 같은 선에서 앞 보행길 datum에 닿게 한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Z = 6.50 m 끝선 위에서 front-walk·driveway 끝이 기존 앞 보행길 datum에 닿는다는 본문 결정을 대조해, 다음 층이 포장 끝 위치나 두 끝의 높이 접속을 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis Z = 6.50 m는 spaces가 요구하는 포장 끝이며 필지 경계나 공공 보도 선의 선언이 아니라고 밝히고 좌표는 coordinate-units에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Z = 6.50 m 끝선은 spaces 선택, 좌표계는 coordinate-units 링크, 필지·보도·연석은 maps 미해결 입력으로 본문에서 갈라지는지 대조해 각 주장이 근거 하나를 가리킴을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지 설정의 앞 보도·차도·현관 보행길을 한 포장 끝선과 `house-site-access` node의 보행/차도 두 포트라는 인계 형식으로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 site-identity의 앞 보도·차도·현관 보행길 목록에는 없는 공통 끝선 Z = 6.50 m와 `house-site-access` 보행/차도 포트 인계를 본문이 더하는지 대조해 부모 복사가 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology house-site가 본채·차고·포치·외부 접근 구역을 포함하고 외부 구역이 ground-storey에도 바인딩되며 실내 방이나 별도 층을 더하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 house-site 포함 목록(본채·차고·포치·외부 접근 구역), ground-storey 외부 구역 바인딩, 실내 방·층 무추가 문장을 대조해 포함 관계가 메시 없이 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 실제 필지 경계·보도·연석·도로는 maps owner의 답으로 두고 확정되지 않은 map geometry를 이 문서에 복사하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 필지 경계·보도·연석·도로를 maps owner 답으로 넘기고 map geometry를 복사하지 않으며 `src/spaces/site.ts`가 포장·지형을 중복 생성하지 않는다는 본문을 대조해 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 상위 boundary가 채택되면 포장 끝·좌표 변환·높이·폭을 양쪽에서 대조하고 현재 map/space binding은 unverified로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 상위 boundary 채택 시 포장 끝·좌표 변환·높이·폭을 양쪽에서 대조한다는 본문과 map/space binding unverified 표기를 대조해 반증할 관계와 현재 미검증 상태가 함께 명시됨을 확인했다.
@evidence settings/10-house.md#site-identity 앞 보도·차고 진입 차도·현관 보행길을 포장 끝에서 받고 구체 경계와 지표는 maps의 저작 선택으로 남긴다.
@evidenceReview settings/10-house.md#site-identity #452f15e site-identity의 앞 보도·차고 진입 차도·현관 보행길을 Z = 6.50 m 전면 포장 끝과 두 포트에 대조해 세 요소가 한 끝선에서 만나고 필지·보도 형상은 maps에 남음을 확인했다.
@evidence settings/00-production.md#build-allocation 대지와 외부 접근은 maps, 방 경계·동선은 spaces라는 배분에 따라 필지와 외부 node를 maps에 넘긴다.
@evidenceReview settings/00-production.md#build-allocation #eda898f build-allocation의 '대지와 외부 접근은 maps' 배분을 본문의 maps 소유 필지 경계·보도·연석·도로·`house-site-access` node에 대조해 spaces가 외부 접근을 가로채지 않음을 확인했다.
@evidence obligations/design/spaces.md#space-reference-topology house-site를 이름 있는 site 프레임으로 두고 건물·외부 구역·maps의 단일 접근 node 사이의 포함과 접속을 명시한다.
@evidenceReview obligations/design/spaces.md#space-reference-topology #5053f99 house-site를 site 프레임으로, 본채·차고·포치·외부 구역을 포함 요소로, `house-site-access`를 유일한 외부 접속으로 둔 본문을 대조해 이름 없는 경계 통과 없이 주소화됨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 앞 보도·차도·보행길, build-allocation의 maps 소유, coordinate-units의 +Z 전면을 대조했고 maps는 disabled라 map 부모가 없으며 설정만으로 포장 끝을 정할 수 있어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 site-identity 앞 보도·차도, build-allocation의 maps 소유, coordinate-units의 +Z를 이 H2의 Z = 6.50 m 끝선과 maps disabled 문장에 대조해 설정만으로 끝선이 정해져 부모 결함이 없음을 확인했다.
-->

`house-site`는 [본채](../00-building.md#main-building-extent)와 [차고](../00-building.md#attached-garage-extent), 포치와 아래의 외부 접근 구역을 포함할 site다. 건물에 딸린 보행길·차도·테라스는 [ground-storey](../01-storeys.md#storey-datums)의 외부 구역으로도 바인딩한다. 실내 방이나 별도 층을 추가하지 않는다. 좌표는 [공통 기준](../../settings/00-production.md#coordinate-units)을 사용한다. `src/spaces/site.ts`는 이 containment와 접속의 조립 owner이며 포장·지형을 직접 중복 생성하지 않는다.

이 문서는 [대지와 식재](../../settings/10-house.md#site-identity)의 앞 보도에 차고 진입 차도와 현관 보행길이 닿을 전면 포장의 바깥 끝을 Z = 6.50 m에 둔다. 이 선은 spaces가 요구하는 포장 끝이며 필지 경계나 공공 보도 선의 선언이 아니다. 같은 선 위 [현관 보행길](front-walk.md#front-walk-plan)의 끝과 [차고 차도](driveway.md#driveway-plan)의 끝은 모두 기존 [앞 보행길 datum](../01-storeys.md#ground-threshold-datums)에 닿는다. maps는 실제 필지 경계와 보도·연석·도로, 하나의 이름 있는 `house-site-access` node를 소유하고 이 두 접속 단면을 그 node의 보행/차도 포트로 받아야 한다. 별개의 두 외부 네트워크를 발명하지 않는다.

현재 maps는 disabled이며 채택된 경계/node가 없다. 따라서 house-site의 세계 경계와 이 두 포트의 외부 연결은 미완료이고, 아래 내부 경로를 외부 도로까지 이어진 것으로 보고하지 않는다. maps가 아직 저작되지 않았으므로 map geometry를 이 문서에 미리 복사하지 않는다. 상위 boundary가 채택되면 포장 끝·좌표 변환·높이·폭을 양쪽에서 대조하고 불일치는 해당 설계 owner에서 고친다. 실제 map/space binding은 unverified다.

## 포장과 계단의 내부 연결 {#site-local-routes}
<!--
@evidence principles/core/common.md#scope-preservation 현관 경로, 차도에서 현관으로 오는 경로, 차고의 머드룸 진입, 후면 정원 경로, 측면 관리길과 울타리 문, maps에 넘길 접속, 관찰 추가를 모두 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 현관·차도→현관·머드룸 진입·후면 정원·관리길/울타리 문 경로, maps에 넘길 측면 접속, 관찰 추가를 각 문단에 두는지 대조해 대지 내부 경로에 owner 없는 항목이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion front-walk → front-porch의 아래 대기 → 외부 세 단 → 포치 → front-door → front-entry, kitchen-dining-family → garden-door → garden-terrace → garden-lower-landing의 순서 경로를 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 front-walk → 아래 대기 → 외부 세 단 → 포치 → front-door → front-entry와 kitchen-dining-family → garden-door → 테라스 → garden-lower-landing 순서를 대조해 경로 순서가 이 H2에서 확정됨을 확인했다.
@evidence principles/core/common.md#declared-basis 각 경로 구간은 링크한 front-walk·driveway·porch·entry·laundry·garden-door·terrace·side-walk·fence owner에서 받고 사용체는 use-profile에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 각 경로 구간이 front-walk·driveway·porch·entry·laundry·rear·terrace·side-walk·fence 링크를, 점유체가 use-profile 링크를 가리키는지 본문과 대조해 구간마다 근거가 추적됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "외부 보행자는 앞 보도에서 포치와 현관으로 직접 접근"과 테라스 설정을 구간 순서가 있는 내부 경로 그래프로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 porch-entry의 직접 접근 한 문장과 site-identity 테라스 조건에 없는 구간 순서, driveway→front-walk 가로 연결로, 아래 대기→관리길 연결을 본문이 더하는지 대조해 분화를 확인했다.
@evidence principles/design/spaces.md#space-topology 차고 외부문은 기본 닫힘이고 차고 실내 진입은 머드룸이며 관리길 앞뒤 구역과 울타리 문은 외부 node를 늘리지 않는 내부 연결이다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 차고 외부문 기본 닫힘, 머드룸 실내 진입, 관리길 앞뒤 구역·울타리 문의 내부 연결을 본문에서 대조해 접속·차단 관계가 외부 node 추가 없이 그래프로 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 높은 테라스와 낮은 대기의 지표 접속, 필지·울타리 선은 각 owner와 maps로 넘기고 잔디 통과를 열린 연결로 대신하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 높은 테라스 상면·낮은 아래 대기의 지표 접속과 울타리 선의 필지 폐합을 maps 입력으로 넘기고 '잔디 통과'를 연결로 쓰지 않는 본문을 대조해 공유 경계를 재저작하지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 보행면의 단면과 위에서 돌아 내려오는 시야, 문짝 개방과 식재/가구 점유를 포함한 양방향 통행, T자 보행길의 오목한 접점 질문을 추가한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 보행면 단면, 위에서 돌아 내려오는 시야, 문짝 개방·식재/가구 점유 포함 양방향 통행, T자 보행길 오목 접점 질문이 전체 관찰로 넘어가는지 대조해 경로 주장의 반증 주소를 확인했다.
@evidence settings/10-house.md#porch-entry "외부 보행자는 앞 보도에서 포치와 현관으로 직접 접근한다"를 front-walk → 포치 아래 대기 → 외부 세 단 → 포치 → front-door의 구간 순서로 만든다.
@evidenceReview settings/10-house.md#porch-entry #a9f9880 porch-entry의 '앞 보도에서 포치와 현관으로 직접 접근'을 본문의 front-walk → 아래 대기 → 외부 세 단 → 포치 → front-door 순서에 대조해 다른 구역을 거치지 않는 직접 경로임을 확인했다.
@evidence settings/10-house.md#site-identity 공용부에서 닿는 후면 테라스와 우측 울타리를 후면·측면 경로에 포함한다.
@evidenceReview settings/10-house.md#site-identity #452f15e site-identity의 공용부에서 닿는 후면 테라스와 우측 목재 울타리를 kitchen-dining-family → garden-door → garden-terrace 경로와 울타리 문 연결에 대조해 둘 다 경로에 포함됨을 확인했다.
@evidence settings/00-production.md#use-profile 각 외부 경로가 사용 점유체와 바구니 폭을 소비하게 한다.
@evidenceReview settings/00-production.md#use-profile #6ef5afe use-profile의 폭 0.60 m 점유체와 0.75 m 바구니를 '각 경로는 사용 점유체와 바구니 폭을 소비한다'는 본문에 대조해 모든 외부 경로가 같은 테스트 도형을 받음을 확인했다.
@evidence obligations/design/spaces.md#space-access-circulation 대지의 표현된 출입구인 현관·정원문·관리문과 차고 머드룸 진입을 연결하는 외부 경로를 배정하고 자동차 주행 과제를 추가하지 않는다.
@evidenceReview obligations/design/spaces.md#space-access-circulation #76c5e04 현관·garden-door·울타리 문·머드룸 연결의 네 출입이 각각 경로 구간에 배정되고 '자동차나 차량 주행 과제를 추가하지 않는다'는 본문을 대조해 연결 누락과 과제 추가가 없음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work porch-entry의 직접 접근, site-identity의 테라스·울타리, garage의 닫힌 기준 상태를 대조했고 내부 경로로 모두 이어져 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 porch-entry 직접 접근, site-identity 테라스·울타리, garage 기본 닫힘을 본문의 현관·후면·관리길 경로와 차고문 작동 검사 한정 문장에 대조해 부모 수정 없이 경로가 닫힘을 확인했다.
-->

이 H2는 [현관 포치와 외부 진입](../../settings/10-house.md#porch-entry)의 포치·현관 직접 접근과 [대지와 식재](../../settings/10-house.md#site-identity)의 후면 테라스·우측 목재 울타리를 house-site 안의 구간 순서로 잇는다. 현관 경로는 [front-walk](front-walk.md#front-walk-plan) → front-porch의 아래 대기 → 외부 세 단 → [포치](../porch.md#porch-platform-access) → [front-door](../rooms/entry.md#entry-plan) → front-entry다. 차도에서 현관으로 걸어올 때는 [driveway](driveway.md#driveway-plan) → front-walk의 가로 연결로 → 같은 포치 경로를 쓴다. 차고의 실내 진입은 기존 [머드룸 연결](../rooms/laundry.md#laundry-plan)이며 외부 차고문은 [기본 닫힘](../../settings/10-house.md#garage)을 유지한다. 차고문 작동 검사를 할 때만 열린 상태의 차도/차고 문턱 접속을 관찰한다. 자동차나 차량 주행 과제를 추가하지 않는다.

후면 경로는 kitchen-dining-family → [garden-door](../envelope/rear.md#garden-door) → [garden-terrace](terrace.md#garden-terrace-plan)의 대기 → 중앙 보행 띠 → [테라스 외부 단](terrace.md#garden-steps-plan) → [garden-lower-landing](terrace.md#garden-lower-landing-plan)이다. 아래 대기의 바깥 끝은 [측면 관리길](side-walk.md#side-walk-plan)을 통해 차도로 이어진다. 그 길의 앞뒤 구역과 [울타리 문](side-walk.md#side-gate-interface)은 별도 내부 연결이며 외부 node를 늘리지 않는다. [울타리 선](fence.md#fence-enclosure-plan)은 건물/관리길에서 도출하지만 실제 정원 지표·필지 포함·폐합은 maps 입력과 함께 남은 항목이다. 잔디를 통과할 수 있다는 말로 열린 연결을 대신하지 않는다.

maps에 넘기는 포장 접속은 기존 전면 두 포트 외에 측면 관리길의 전체 외곽·식재 제외 여유와 아래 [지표 접합 입력](#map-handoff-inputs)이다. 높은 테라스 상면과 낮은 아래 대기를 모두 잔디에 수평 접속하는 것으로 취급하지 않는다. 이는 필지 형상이나 울타리 선을 대신 확정하는 값이 아니다. [전체 표면 인계](../03-surface-owners.md#exterior-surface-handoff)는 관리길과 목재 울타리의 파일 책임을 미리 배정하고 실제 세계 경계·지표·식재 census는 미완료로 둔다.

각 경로는 [사용 점유체](../../settings/00-production.md#use-profile)와 바구니 폭을 소비한다. 보행면의 단면과 위에서 돌아 내려오는 시야, 문짝 개방 및 후속 가구/식재 점유를 포함한 양방향 통행을 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 추가한다. 외부 구역도 threshold·각 코너·중심 방향의 질문을 부담하고 T자 보행길의 오목한 접점에는 질문을 더한다. 설계 경로는 compiled topology나 관찰 수를 대신하지 않으며 실제 통행·표면 연결은 unverified다.

## 지도에서 받아야 할 경계와 지표 입력 {#map-handoff-inputs}
<!--
@evidence principles/core/common.md#scope-preservation maps로부터 받아야 할 세계 변환, 닫힌 필지, 외부 node와 두 포트, 낮은 보행면·높은 테라스의 지표 접합, 식재/울타리 경계 입력과 거부할 불일치를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 입력 표의 세계 좌표·닫힌 필지·node와 두 포트·낮은 보행면·높은 테라스·식재/울타리 여섯 행이 각각 접속 또는 거부 조건을 갖는지 대조해 maps 인계 범위에 빠진 항목이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 입력 여섯 행과 site 변환을 항등으로 요구하는 조건, 처마 투영선을 지표 삭제 윤곽으로 쓰지 않는 규칙을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 표 여섯 행의 접속 조건, 항등 site 변환 요구, 처마 투영선을 지표 삭제 윤곽으로 쓰지 않는 규칙을 대조해 maps가 받을 조건이 필드 목록이 아니라 판정 가능한 결정임을 확인했다.
@evidence principles/core/common.md#declared-basis 좌표·높이의 원본을 링크한 spaces/settings owner에 두고 입력 표만으로 maps가 채택되거나 연결되지 않았다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 좌표·높이 원본을 링크한 spaces/settings owner에 두고 '아래 요구만으로 maps가 채택되거나 연결된 것은 아니다'라는 본문을 대조해 지도 값이 미해결 입력으로 표시됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지 설정의 "구체 경계·식재 위치·배수처럼 보이는 지표 경사는 maps의 저작 선택"을 spaces가 거부할 포함·포트·접지 불일치 목록으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 site-identity가 maps에 맡긴 구체 경계·지표 경사를 본문이 중심점 일치 불인정·지표로 챌판 삭제 금지·gate 대기 제외 같은 거부 조건으로 바꾸는지 대조해 부모에 없는 판정을 확인했다.
@evidence principles/design/spaces.md#space-topology 필지가 본채·차고·포치·굴뚝·처마·네 포장·울타리를 모두 포함하고 외부 보도가 두 포트 끝선 전체와 턱 없이 만나야 한다는 관계를 정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 닫힌 필지 행의 본채·차고·포치·굴뚝·처마·네 포장·울타리 포함과 node 행의 '두 끝선 전체와 턱 없이' 접속을 대조해 필지 포함·외부 접속 관계가 이 표에서 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 포장 두께와 지지체 형상을 이 인터페이스에서 새로 발명하지 않고 01-paving-support와 10-ground-floor owner에서 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 포장 두께·지지체 형상을 새로 정하지 않고 01-paving-support 세 H2와 10-ground-floor의 지지·출입 경계 H2에서 받는 본문을 대조해 공유 값이 이 인터페이스에서 이중 저작되지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 필지 포함 평면, 두 포트의 전체 단면, 차도 양옆과 두 경사 연결로의 접합, 테라스 상면·챌판·아래 대기·지표 단면을 추가한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 필지 포함 평면, 두 포트 전체 단면, 차도 양옆·두 경사 연결로 접합, 테라스 상면·챌판·아래 대기·지표 단면과 storey-datums 허용 오차를 대조해 인계 주장의 반증 경로를 확인했다.
@evidence settings/00-production.md#coordinate-units 이 집이 공통 좌표에 직접 저작되므로 maps의 site 변환을 항등으로 요구한다.
@evidenceReview settings/00-production.md#coordinate-units #2e3dcf8 coordinate-units의 원점·축·m 단위를 세계 좌표 행의 '원점·축·단위·높이 datum 일치, site 변환 항등' 조건과 node 행의 +Z 접속 방향에 대조해 공통 좌표가 그대로 소비됨을 확인했다.
@evidence settings/10-house.md#site-identity 필지·지표·식재의 저작을 maps에 두고 그 입력이 포장 여유와 gate 대기를 식재 제외 조건으로 받게 한다.
@evidenceReview settings/10-house.md#site-identity #452f15e site-identity가 maps에 둔 경계·식재 위치·지표 경사를 식재/울타리 행의 포장 여유·gate 앞뒤 대기/회전 제외 조건에 대조해 식재 저작은 maps에 남고 제약만 넘어감을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work coordinate-units의 원점과 +Z 전면, site-identity의 maps 소유 지표를 대조했고 maps가 disabled라 map 부모 결함을 시험할 수 없으며 settings는 인계 조건을 정하기에 충분해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 coordinate-units 원점·+Z와 site-identity의 maps 소유 지표를 세계 좌표 행의 항등 변환과 두 지표 접합 행에 대조해 설정이 인계 조건을 정하기에 충분하고 부모 수정이 없음을 확인했다.
-->

이 H2는 `house-site`가 maps로부터 받아야 할 입력과 거부할 불일치를 소유한다. [대지와 식재](../../settings/10-house.md#site-identity)가 구체 경계·식재 위치·지표 경사를 maps의 저작 선택으로 두므로 실제 필지·외부 네트워크·지형은 maps owner의 답이며, 아래 요구만으로 maps가 채택되거나 연결된 것은 아니다. 좌표·높이의 원본은 링크한 spaces/settings owner에 유지하고 지표에 맞추기 위해 건물이나 계단을 뷰어에서 따로 이동하지 않는다.

| 받을 입력 | 소비하는 spaces 값과 접속 조건 |
| --- | --- |
| 세계 좌표와 site 배치 | [공통 좌표](../../settings/00-production.md#coordinate-units)와 원점·축·단위·높이 datum이 일치하는 변환을 받는다. 이 집은 그 공통 좌표에 직접 저작하므로 site 변환은 항등으로 요구한다. 렌더 카메라 이동은 site 변환을 바꾸지 않는다. |
| 닫힌 필지 경계 | [본채](../00-building.md#main-building-extent)/[차고](../00-building.md#attached-garage-extent), 포치·굴뚝·처마의 실제 외곽과 네 포장 owner의 윤곽 및 식재 제외 여유, [울타리 전체 선과 최대 점유](fence.md#fence-ground-profile)를 모두 수용해야 한다. 지붕 투영선과 지면을 점유하는 기초선은 구별한다. 경계가 예약을 자르면 원래 maps 또는 spaces owner에서 고치며 잘린 면을 숨기지 않는다. |
| 하나의 외부 접근 node와 두 포트 | 위 [전면 포장 끝](#site-access-interface)의 front-walk/driveway 전체 끝선을 받는다. 폭은 각 포장 owner의 X 구간, 높이는 그 끝선의 상면, 접속 방향은 +Z다. 중심점 하나가 같다는 이유로 연결을 인정하지 않는다. 외부 보도는 두 끝선 전체와 턱 없이 만나고 차도 포트가 가로지르는 보행 구간도 연속되어야 한다. |
| 낮은 보행면의 지표 접합 | [현관 보행길](front-walk.md#front-walk-plan), [차도](driveway.md#driveway-plan), [측면 관리길](side-walk.md#side-walk-plan)의 노출 가장자리별 높이식을 소비한다. 가로 연결로는 횡방향 보간까지 포함한다. [아래 대기](terrace.md#garden-lower-landing-plan)의 양옆은 그 상면에서 지표와 이어지고 뒤끝은 이미 관리길이 받으므로 두 번째 지형 면을 넣지 않는다. |
| 높은 테라스와 건물의 접지 | [테라스와 세 단](terrace.md#garden-steps-plan)은 상하 높이 차를 유지한다. 지표를 테라스 상면까지 끌어올려 챌판이나 옆면을 지우지 않는다. 테라스·기초·굴뚝의 수직 옆면에 닿는 지표 접촉선을 받아 후속 지지/마감 부재가 닫는다. 해당 부재가 없는 현재 상태에서는 접지 완료를 주장하지 않는다. |
| 식재와 울타리의 경계 입력 | 포장 여유와 [gate 앞뒤 대기/회전](side-walk.md#side-gate-interface), 출입·창·처마 앞의 점유를 식재 배치 제외 조건으로 넘긴다. 필지/지표를 받은 뒤 울타리 owner가 [전체 선](fence.md#fence-enclosure-plan)의 포함과 [문기둥/벽 접점](fence.md#fence-gate-junction)을 확인한다. 현재 gate만으로 필지나 정원이 닫혔다고 세지 않는다. |

지표의 노출 면은 포장 상면과 겹치지 않고, 기초·포장 지지체 아래의 접지와 수직 옆면은 실제 단면으로 닫아야 한다. 처마 투영 영역 전체를 지형에서 빼면 포치/처마 아래 지면이 사라지므로 그 투영선을 지표 삭제 윤곽으로 쓰지 않는다. 후속 지형 owner는 각 접촉선의 높이와 상대 owner를 받아야 하며, 포장 두께나 지지체 형상을 이 인터페이스에서 새로 발명하지 않는다.

[본채/차고 바닥 아래 지지](../10-ground-floor.md#ground-support-handoff)는 이 지표 입력을 받은 뒤 건물 쪽 채움·기단/기초의 하단을 정한다. maps의 외부 완성 지표를 지지면이나 기초 바닥 깊이로 대신하지 않는다. [네 건물 출입 경계](../10-ground-floor.md#ground-threshold-junctions)의 완성 높이와 단은 유지하며 외부 지표로 문턱을 덮어 접촉을 만든 것으로 처리하지 않는다.

외부 바탕의 입력은 [낮은 포장 두께](01-paving-support.md#paving-depth-reservation)와 [높은 포치/테라스 지지](01-paving-support.md#raised-platform-support)에서 받는다. [포장 접촉](01-paving-support.md#paving-contact-handoff)은 서로 다른 바탕 아래면과 노출 옆면·매립 구역을 구별하며, 그 제작상 하단을 maps의 외부 완성 지표로 채택하지 않는다. 실제 지지면/기초와 두 전면 포트의 연결은 여전히 미완료다.

인계 검사에는 필지 포함 평면, 두 포트의 전체 단면, 차도 양옆과 두 경사 연결로의 접합, 테라스 상면·챌판·아래 대기·지표를 함께 지나는 단면을 추가한다. 허용 오차는 [공유 기준](../01-storeys.md#storey-datums)을 소비한다. 실제 source가 생기면 같은 산출물의 world/site/space 식별자·변환·경계·접촉을 읽고 [전체 관찰](../04-observations.md#spatial-observation-derivation)에서 양방향 시야를 확인한다. 입력 표의 행 수는 surface나 observation 개수가 아니며 현재 포함·접지·연결·식재 간섭은 unverified다.
