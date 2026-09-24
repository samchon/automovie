# 개구부 충전 모델의 공통 기준

## 국소 좌표와 배치 규칙 {#model-local-frame}
<!--
@evidence principles/core/common.md#scope-preservation 개구부 하나를 채우는 모든 충전 모델의 단위·축·원점 면·world 회전과 '외곽·칸 수·경첩 쪽·열림 방향은 spaces에서 받고 모델은 부재 배분만 정한다'는 경계를 이 H2가 맡아 01–05가 좌표 규칙을 따로 정하지 않는다.
@evidence principles/core/common.md#substantive-completion 원점을 거친 개구부 아래 변 가로 중앙, 외벽 창·외부 문은 날씨 면, 실내 문은 열림 쪽 벽면으로 정하고 회전을 Y축 0·π·±π/2 중 하나로 한정해 구현자가 배치 기준을 새로 고르지 않게 한다.
@evidence principles/core/common.md#declared-basis 단위와 축은 settings/00-production.md#coordinate-units, 개구부 좌표 owner와 0.04·0.14 m 예약은 spaces/06-openings.md#external-opening-interface에서 받는다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation coordinate-units의 '문·창 local transform은 world 기준으로 변환 가능해야 한다'를 개구부 아래 변 중앙 원점, 원점 면 선택, 네 가지 Y축 회전이라는 모델 층 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 한 모델이 거친 개구부 하나를 채우는 원형이고 외곽 폭·높이가 그 개구부에서만 산출된다는 점유 범위를 정하며 세부 계층은 01–05 H2에 맡긴다.
@evidence principles/design/models.md#spatial-convention 국소 원점, +Y=world +Y, +Z=원점 면 바깥 법선, +X=+Z 쪽에서 본 오른쪽, 배치 회전 네 값을 적어 코드에서 좌표 관례를 찾을 필요가 없다.
@evidence principles/design/models.md#reviewable-structure 검사 주소를 spaces/04-observations.md의 각 개구부 정면과 벽 단면으로 적어 원점 면이나 회전이 틀리면 개구부와 부재가 어긋나는 것이 드러난다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨을 쓰지 않고 충전 모델이 spaces 좌표를 복제하지 않는다는 관찰 가능한 배치 결정만 정하며 색·조명을 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 척도는 m 단위 world, 층은 벽 두께 방향의 원점 면, 인터페이스는 원점과 회전으로 정해 개구부 모델 배치에 빠진 척도 관계가 없다.
@evidence settings/00-production.md#coordinate-units 오른손 Y-up·m·rad와 +Z=앞 보도 방향을 모든 충전 모델의 국소 축과 네 가지 Y축 회전으로 소비한다.
@evidence spaces/06-openings.md#external-opening-interface 개구부 좌표를 네 입면 owner가 소유한다는 인계를 받아 모델이 world 좌표를 복제하지 않고 외곽을 거친 개구부에서만 산출한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work coordinate-units의 오른손 Y-up·m·rad와 06의 개구부 좌표 owner·0.04/0.14 m 예약을 적힌 그대로 소비했고 원점 면과 회전을 정하는 데 부모와 모순되거나 빠진 값이 없었다.
@evidence obligations/core/common.md#layer-boundary 모델은 부재 배분만 정하고 개구부 좌표·칸 수·경첩 쪽은 spaces, 색·광학값은 materials, world 배치는 instances가 정한다고 이 H2가 층 경계를 적는다.
@evidence settings/00-production.md#build-allocation '실제 부재·가구·수목 원형은 models'라는 배분을 개구부 충전·가구·수목·조명기구·생활 소품의 원형 범위로 소비한다. 소스가 없는 계열의 실제 표면은 unverified다.
@evidence spaces/envelope/left.md#left-openings 왼쪽 벽의 개구부 좌표 owner를 창 원점 면(날씨 면) 배치의 입력으로 소비한다.
@evidence spaces/envelope/rear.md#rear-openings 본채 후벽 Z = [-10.70, -10.45] m를 후면 창·정원문의 원점 면 위치로 소비한다.
@evidence spaces/envelope/right.md#right-openings 오른쪽 벽의 개구부 좌표 owner를 창 원점 면 배치의 입력으로 소비한다.
@evidenceExclude settings/00-production.md#accessibility 이 상위 H2는 접근성 전달 상태를 정하는 전달물 조건이며 모델 부재 치수나 관절에 쓰이는 값이 없다.
@evidenceExclude settings/00-production.md#coverage-map 이 상위 H2는 settings 항목의 소유 지도를 정하며 모델은 그 지도가 가리키는 개별 H2(openings·use-profile 등)를 직접 인용한다.
@evidenceExclude settings/00-production.md#delivery-scope 이 상위 H2는 전달물 범위를 정하며 모델 부재의 치수·관절·표면을 정하지 않는다.
@evidenceExclude settings/00-production.md#governing-aim 이 상위 H2는 production의 지배 목표를 정하며 모델은 그 목표를 구체화한 fidelity·openings H2를 인용한다.
@evidenceExclude settings/00-production.md#operative-subjects 이 상위 H2는 작동 주체와 자원을 정하며 개구부·수납 부재의 형상 값을 주지 않는다.
@evidenceExclude settings/00-production.md#operator-access 이 상위 H2는 조작자와 접근 권한을 정하며 모델 부재 결정에 쓰이지 않는다.
@evidenceExclude settings/00-production.md#working-language 이 상위 H2는 작업 언어를 정하며 모델 문서는 그 언어로 쓰였을 뿐 부재 결정에 값을 받지 않는다.
@evidenceExclude settings/10-house.md#house-scale 이 상위 H2는 집 전체 규모를 정하며 모델은 그 규모를 좌표로 확정한 spaces 개구부 H2에서 치수를 받는다.
@evidenceExclude settings/10-house.md#main-mass 이 상위 H2는 본채 매스와 지붕 형태를 정하며 모델은 지붕·벽 몸체를 만들지 않는다.
@evidence settings/10-house.md#porch-entry 포치 구조와 기둥은 spaces가 소유하고 현관문은 02 원형이 맡는다. 발판과 화분은 별도 생활 소품 원형으로 분리해 포치 계단·문짝과 겹치지 않게 한다.
@evidenceExclude settings/10-house.md#service-band 이 상위 H2는 우측 서비스 동선을 정하며 모델은 그 안의 문 값을 각 room plan H2에서 받는다.
@evidenceExclude settings/20-verification.md#completion-boundary 이 상위 H2는 완료와 기록 조건을 정하는 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#data-authority 이 상위 H2는 측정과 프레임의 책임을 정하는 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#execution-boundary 이 상위 H2는 실행과 모듈 경계를 정하는 source 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#implementation-boundary 이 상위 H2는 편집과 의존성 경계를 정하는 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#lifecycle-boundary 이 상위 H2는 저작 순서를 정하는 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#lighting-state 이 상위 H2는 key light 방향·그림자·켜진 실내 광원의 빛 상태를 정하며 빛은 systems 소유이고 모델 리뷰 뷰는 중성 배경을 쓴다.
@evidenceExclude settings/20-verification.md#observation-allocation 이 상위 H2는 관찰 배분을 정하며 모델 리뷰 뷰는 frame-condition에서 받고 집 전체 관찰은 spaces가 맡는다.
@evidenceExclude settings/20-verification.md#reference-authority 이 상위 H2는 레퍼런스 권위를 정하며 모델은 그 레퍼런스를 해석한 visual-grammar와 openings를 인용한다.
@evidenceExclude settings/20-verification.md#renderer-boundary 이 상위 H2는 실제 3D 렌더 경계를 정하는 source·viewer 조건이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#role-boundary 이 상위 H2는 저작·계측·판정 권한을 정하는 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#submission-boundary 이 상위 H2는 커밋과 푸시 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#validation-boundary 이 상위 H2는 정규 검증 명령을 정하는 절차이며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude settings/20-verification.md#viewer-handoff 이 상위 H2는 뷰어 실행 인계를 정하며 모델 부재의 형상·관절·표면을 정하지 않는다.
@evidenceExclude spaces/01-storeys.md#storey-datums 이 상위 H2는 두 storey의 완성 바닥 높이를 정하며 모델 원형은 국소 원점에서 만들어지고 층 높이 배치는 instances가 한다.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff 이 상위 H2는 계단 connector 등록을 정하며 모델 난간살은 connector를 만들거나 바꾸지 않는다.
@evidenceExclude spaces/02-stair.md#stair-reservation 이 상위 H2는 계단 경로와 단 치수를 정하며 모델 난간살 값은 stair-boundary-heights와 stair-clearance에서 받는다.
@evidenceExclude spaces/03-surface-owners.md#exterior-surface-handoff 이 상위 H2는 입면·지붕·층 표면의 소유를 정하며 모델은 부재 자체의 면만 소유하고 그 표면을 받지 않는다.
@evidenceExclude spaces/03-surface-owners.md#interior-surface-handoff 이 상위 H2는 방 내부 완결 면의 소유를 정하며 모델은 부재 자체의 면만 소유한다.
@evidenceExclude spaces/04-observations.md#engine-render-handoff 이 상위 H2는 공간 산출물의 렌더 인계를 정하며 모델 부재 값을 주지 않는다.
@evidenceExclude spaces/04-observations.md#reference-spatial-comparisons 이 상위 H2는 참조 대비 공간 비교를 정하며 모델 리뷰 뷰는 frame-condition에서 받는다.
@evidenceExclude spaces/05-route-network.md#room-route-network 이 상위 H2는 방 사이 동선을 정하며 모델은 문 값을 각 room plan H2에서 받는다.
@evidenceExclude spaces/07-boundary-assembly.md#exterior-boundary-junctions 이 상위 H2는 외벽 모서리와 지붕 단차 몸체를 정하며 모델은 벽 몸체를 만들지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-junctions 이 상위 H2는 모서리와 문턱에서 이어지는 경계를 정하며 모델 실내 문은 문턱을 두지 않고 벽 접합을 만들지 않는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions 이 상위 H2는 층간 가장자리 접합을 정하며 모델은 층판을 만들지 않는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-floor-boundary 이 상위 H2는 층간 구조와 두 층 마감을 정하며 모델은 층판을 만들지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance 이 상위 H2는 천장과 지붕 접합 여유를 정하며 모델은 천장·지붕을 만들지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#garage-ceiling-closure 이 상위 H2는 차고 천장 폐합을 정하며 차고문 rail-path는 front.md의 상부 예약 안에서 정해지고 천장 면을 만들지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#upper-ceiling-closure 이 상위 H2는 상층과 계단실 천장을 정하며 모델은 천장을 만들지 않는다.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base 이 상위 H2는 차고 바닥 바탕을 정하며 모델은 바닥을 만들지 않는다.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff 이 상위 H2는 바닥 아래 지지와 지표 인계를 정하며 모델 부재와 관계가 없다.
@evidence spaces/10-ground-floor.md#ground-threshold-junctions 전면·후면 문턱판은 spaces가 단 한 번 만들고 상면 +0.02 m를 이 모델의 문짝 하단 기준으로 받아 문턱 위 0.01 m 틈을 둔다.
@evidenceExclude spaces/10-ground-floor.md#main-ground-floor-base 이 상위 H2는 본채 바닥 바탕을 정하며 모델은 바닥을 만들지 않는다.
@evidenceExclude spaces/envelope/front.md#front-roof-closures 이 상위 H2는 전면 박공 삼각 벽 폐합을 정하며 모델은 벽을 만들지 않는다.
@evidenceExclude spaces/envelope/left.md#left-roof-closure 이 상위 H2는 왼쪽 삼각 벽 폐합을 정하며 모델은 벽을 만들지 않는다.
@evidenceExclude spaces/envelope/rear.md#rear-roof-closures 이 상위 H2는 후면 처마 아래 외벽 폐합을 정하며 모델은 벽을 만들지 않는다.
@evidenceExclude spaces/envelope/right.md#right-roof-closures 이 상위 H2는 오른쪽 단차 외벽 폐합을 정하며 모델은 벽을 만들지 않는다.
@evidenceExclude spaces/porch.md#porch-roof-columns 이 상위 H2는 포치 기둥과 지붕을 정하며 모델 H2 어디도 기둥·포치 지붕을 만들지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-wall-head-junctions 이 상위 H2는 본채와 차고 외벽이 자기 지붕 아래에서 닫히는 벽 상단을 정하며 모델은 외벽 몸체와 그 상단을 만들지 않는다.
@evidenceExclude spaces/roof/front-gable-left.md#front-gable-left-roof 이 상위 H2는 roof.front-gable.left 면의 날씨 면·아래면·외곽 두께를 src/spaces/roof/front-gable-left.ts에 배정하며 모델은 그 지붕판을 만들지 않는다.
@evidenceExclude spaces/roof/front-gable-right.md#front-gable-right-roof 이 상위 H2는 roof.front-gable.right 면을 src/spaces/roof/front-gable-right.ts에 배정하고 F의 오른쪽 기울기를 쓰게 하며 모델은 그 지붕판을 만들지 않는다.
@evidenceExclude spaces/roof/garage-back.md#garage-back-roof 이 상위 H2는 차고 지붕 뒤 절반에 Gback을 적용하는 roof.garage.back 면을 정하며 모델은 차고 지붕판을 만들지 않는다.
@evidenceExclude spaces/roof/garage-front.md#garage-front-roof 이 상위 H2는 차고 지붕 앞 절반의 Gfront 날씨 면과 아래면을 정하며 차고문 rail-path는 이 지붕면이 아니라 front.md의 상부 예약에서 받는다.
@evidenceExclude spaces/roof/main-back.md#main-back-roof 이 상위 H2는 주 지붕 뒤 절반의 Mback 면과 뒤 처마를 정하며 모델은 주 지붕판을 만들지 않는다.
@evidenceExclude spaces/roof/right-back.md#right-back-roof 이 상위 H2는 오른쪽 영역 뒤 절반의 Rback 면을 정하며 모델은 그 지붕판을 만들지 않는다.
@evidenceExclude spaces/roof/right-front.md#right-front-roof 이 상위 H2는 오른쪽 영역 앞 절반의 Rfront 면과 단차 벽 접합을 정하며 모델은 그 지붕판을 만들지 않는다.
@evidenceExclude spaces/rooms/common.md#common-clear-routes 이 상위 H2는 공용부 통로를 정하며 개구부 모델 값에 쓰이지 않는다.
@evidenceExclude spaces/rooms/common.md#common-room-plan 이 상위 H2는 공용부 외곽을 정하며 개구부 모델은 공용부 창·정원문 값을 rear.md H2에서 받는다.
@evidenceExclude spaces/rooms/garage-interior.md#garage-interior-plan 이 상위 H2는 차고 내부 바닥과 머드룸 연결을 정하며 차고문 값은 front.md#garage-front-opening에서 받는다.
@evidenceExclude spaces/rooms/garage-interior.md#garage-use-routes 이 상위 H2는 차고 내부 접근 경로를 정하며 모델 부재 값에 쓰이지 않는다.
@evidenceExclude spaces/rooms/laundry.md#laundry-through-route 이 상위 H2는 세탁실 횡단 경로를 정하며 두 문 값은 laundry-plan에서 받는다.
@evidenceExclude spaces/rooms/living.md#living-through-route 이 상위 H2는 거실 바닥 경로를 정하며 거실 문 값은 living-plan에서 받는다.
@evidenceExclude spaces/rooms/pantry.md#pantry-use-route 이 상위 H2는 팬트리 사용 통로를 정하며 팬트리 문 값은 pantry-plan에서 받는다.
@evidenceExclude spaces/rooms/service.md#service-access-plan 이 상위 H2는 서비스 통로를 정하며 외투장 부재 값은 entry-coat-storage에서 받는다.
@evidenceExclude spaces/rooms/upper-hall.md#upper-hall-plan 이 상위 H2는 복도와 다섯 방 연결을 정하며 복도 문 값은 각 방 plan H2와 upper-linen-storage에서 받는다.
@evidenceExclude spaces/site/00-access.md#map-handoff-inputs 이 상위 H2는 house-site가 maps에서 받을 경계·지표 입력과 거부할 불일치를 정하며 모델 부재는 maps 입력을 쓰지 않는다.
@evidenceExclude spaces/site/00-access.md#site-access-interface 이 상위 H2는 house-site의 포함 범위와 외부 네트워크에 넘길 포장 끝을 정하며 모델은 포장이나 접속점을 만들지 않는다.
@evidenceExclude spaces/site/00-access.md#site-local-routes 이 상위 H2는 포치 접근·테라스·울타리를 잇는 site 내부 구간 순서를 정하며 모델은 경로를 만들지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff 이 상위 H2는 포장 owner들이 상면·아래면을 같은 좌표로 소비하는 접촉 규칙을 정하며 모델은 포장을 만들지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-depth-reservation 이 상위 H2는 현관 보행길·측면 관리길·정원 아래 대기의 포장 두께와 바탕을 정하며 대문 문짝 하단은 side-gate-interface의 S 위 0.05 m에서 받는다.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support 이 상위 H2는 포치와 정원 테라스의 높은 평탄면과 닫힌 단면을 정하며 모델은 포치·테라스 몸체를 만들지 않는다.
@evidenceExclude spaces/site/driveway.md#driveway-plan 이 상위 H2는 차고 문턱까지 오르는 콘크리트 차도를 정하며 차고문 문짝 값은 front.md#garage-front-opening에서 받는다.
@evidenceExclude spaces/site/fence.md#fence-enclosure-plan 이 상위 H2는 관리문과 이어지는 오른쪽 목재 울타리 선을 정하며 모델 00–05는 울타리 패널을 만들지 않는다.
@evidenceExclude spaces/site/fence.md#fence-gate-junction 이 상위 H2는 울타리에서 대문 개구부 X 구간을 비우고 문 값을 side-gate-interface에 맡기며 모델 대문은 그 owner 값만 받는다.
@evidenceExclude spaces/site/fence.md#fence-ground-profile 이 상위 H2는 울타리 패널 상단을 대문 문짝 상단과 같은 높이로, 아래끝을 지표 g + 0.05 m로 예약하며 대문 문짝 높이는 side-gate-interface의 S 위 0.05–1.70 m에서 받는다.
@evidenceExclude spaces/site/front-walk.md#front-walk-plan 이 상위 H2는 포치 첫 챌판 앞에서 전면 포장 끝까지의 현관 보행길을 정하며 모델은 보행면을 만들지 않는다.
@evidenceExclude spaces/site/side-walk.md#side-walk-plan 이 상위 H2는 차도 오른쪽에서 정원 아래 대기까지의 측면 보행면을 정하며 대문 폭은 이 H2가 아니라 side-gate-interface의 문기둥 구간에서 받는다.
@evidenceExclude spaces/site/terrace.md#garden-lower-landing-plan 이 상위 H2는 외부 단 아래 깊이 1.20 m의 평탄 대기를 정하며 모델은 대기 바닥을 만들지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-steps-plan 이 상위 H2는 테라스와 아래 대기를 잇는 외부 단을 정하며 모델은 외부 단과 그 난간을 만들지 않는다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

모든 개구부 충전 모델은 [제작 좌표](../settings/00-production.md#coordinate-units)의 오른손 Y-up, 길이 m, 각도 rad를 그대로 쓴다. 한 모델은 spaces가 좌표를 소유한 거친 개구부 하나를 채우며, 국소 원점은 그 개구부 아래 변의 가로 중앙에 두고 벽 두께 방향으로는 개구부를 소유한 벽의 한쪽 면 위에 둔다. 외벽의 창과 외부 문은 날씨 면, 내부 문은 문짝이 열리는 쪽 벽면을 원점 면으로 삼는다. 국소 +Y는 world +Y, 국소 +Z는 원점 면의 바깥 법선, 국소 +X는 +Z 쪽에서 보아 오른쪽이다. world 배치 회전은 벽 방향에 따라 Y축 0, π, ±π/2 중 하나이며 개구부를 소유한 spaces H2의 void 좌표에서 계산하고 모델 파일에 world 좌표를 복제하지 않는다.

모델 외곽의 폭과 높이는 거친 개구부의 폭과 높이에서만 산출하고, 칸 수·경첩 쪽·열림 방향도 개구부 owner가 선언한 값을 받는다. 모델이 정하는 것은 부재 폭·깊이·두께의 배분뿐이다. 소스 owner는 `src/models/frame.ts`이며 검사 주소는 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)의 각 개구부 정면과 벽 단면이다.

## 가구·설비 원형의 국소 좌표 {#model-furniture-local-frame}
<!--
@evidence principles/core/common.md#scope-preservation 개구부를 채우지 않는 가구·설비·수납 원형의 원점·축·뒤 모서리 선택·배치 회전을 이 H2가 맡아 10번 이후 가구 파일이 링크로 소비하게 한다.
@evidence principles/core/common.md#substantive-completion 원점을 바닥에 닿는 뒤쪽 모서리 선의 가로 중앙, +Z를 사용자가 서는 앞쪽으로 정하고 벽에서 떨어진 섬·식탁은 사용 방향 반대쪽 외곽을 뒤 모서리로 삼는 규칙까지 적는다.
@evidence principles/core/common.md#declared-basis 단위와 축은 settings/00-production.md#coordinate-units, 외곽 치수는 contracts/reservation-fit.md#reservation-fit에 따른 room owner 예약에서 받는다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation coordinate-units의 가구 local transform 요구를 뒤 모서리 중앙 원점, 사용자 쪽 +Z, instances가 계산하는 Y축 회전 하나라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 가구 원형의 점유 범위가 room owner의 상한 박스와 사용 공간 예약에서 온다고 정해 각 가구 H2의 외곽 산출 기준을 준다.
@evidence principles/design/models.md#spatial-convention 가구 원형의 원점·+Y·+Z·+X와 world 배치가 Y축 회전 하나라는 관례를 적는다.
@evidence principles/design/models.md#reviewable-structure 뒤 모서리가 벽 마감 면에 닿는지와 +Z가 사용 공간을 향하는지가 room 관찰에서 반증 가능한 배치 경계다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 벽에 붙는 면과 사용 방향이라는 관찰 가능한 배치 결정만 정하고 재료·조명을 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 척도는 m, 층은 바닥 접지 면, 인터페이스는 뒤 모서리 원점으로 정해 가구 원형 배치에 빠진 척도나 층이 없다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work coordinate-units와 reservation-fit 계약을 적힌 그대로 소비했고 가구 원점 규칙을 정하는 데 settings나 spaces의 결함을 찾지 못했다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

개구부를 채우지 않는 가구·설비·수납 원형은 [제작 좌표](../settings/00-production.md#coordinate-units)의 단위와 축을 쓰고 국소 원점을 바닥에 닿는 뒤쪽 모서리 선의 가로 중앙에 둔다. 국소 +Z는 사용자가 서서 쓰는 앞쪽, 국소 +Y는 world +Y, 국소 +X는 앞에서 보아 오른쪽이다. 뒤쪽 모서리 선은 벽에 붙는 원형이면 벽 마감 면에, 섬·식탁처럼 벽에서 떨어진 원형이면 사용 방향 반대쪽 외곽에 둔다. 외곽 치수는 [예약 맞춤 계약](../contracts/reservation-fit.md#reservation-fit)에 따라 room owner의 상한 박스와 사용 공간 예약에서 받고, world 배치 회전은 Y축 회전 하나로 instances가 room owner의 좌표에서 계산한다. 소스 owner는 `src/models/frame.ts`이며 각 가구 H2가 이 규칙을 링크로 소비한다.

## 기준 척도와 대조 치수 {#model-reference-scale}
<!--
@evidence principles/core/common.md#scope-preservation 모든 모델의 공통 척도 기준을 사람 점유체 0.60×0.45×1.90 m와 문 유효폭 0.80 m로 정하고 문 순폭·창 유리 폭 산출이라는 대조 규칙을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문은 90° 열림의 문설주 면 사이 순폭을 owner 목표와, 창은 부재를 뺀 유리 폭을 대조하며 같은 뷰에 점유체를 세워 문 높이 2.20 m와 창대 높이를 비교한다고 적는다.
@evidence principles/core/common.md#declared-basis 척도 기준을 settings/00-production.md#use-profile에서 받는다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation use-profile의 점유체와 0.80 m 목표를 모델 생성 시 순폭·유리 폭을 수치로 보고하는 모델 층 대조 규칙으로 바꾼다.
@evidence principles/design/models.md#representation-contract 모든 모델이 소비자에게 보고할 점유 수치(순폭·유리 폭)를 정해 점유 범위를 비교 가능하게 한다.
@evidence principles/design/models.md#spatial-convention 치수를 primitive 기본값이 아니라 점유체와 개구부 owner 목표에서 유도한다는 척도 기준을 명시한다.
@evidence principles/design/models.md#reviewable-structure 점유체를 같은 뷰에 세운 척도 비교를 관찰로 정해 독립 모델 사이의 척도 어긋남이 드러나게 한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 사람 점유체라는 관찰 가능한 척도 비교만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 공통 척도 기준과 문·창 대조 산술을 정해 척도 관계가 빠진 모델이 통과하지 못하게 한다.
@evidence obligations/design/models.md#reference-scale 공유 척도 기준을 use-profile 점유체로 지명하고 다른 모델의 외곽을 순폭·유리 폭 산출로 확인하는 규칙을 정한다.
@evidence settings/00-production.md#use-profile 점유체 0.60×0.45×1.90 m와 문 유효폭 0.80 m를 모든 모델의 공통 척도 기준과 순폭 대조로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work use-profile의 점유체 치수와 0.80 m 목표를 적힌 그대로 소비했고 모델 척도를 정하는 데 부모 수정이 필요한 모순이 없었다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

공통 척도 기준은 [사용과 통행 가정](../settings/00-production.md#use-profile)의 사람 점유체 폭 0.60 m, 깊이 0.45 m, 높이 1.90 m와 문 유효폭 0.80 m 이상이다. 모든 문 모델은 90° 열림에서 문설주 면 사이의 순폭을 산출해 그 개구부 owner가 정한 유효 폭 목표와 대조하고, 모든 창 모델은 부재를 뺀 유리 폭을 산출해 부재가 유리를 가리지 않는지 대조한다. 독립적으로 만든 모델 사이의 척도 어긋남은 같은 뷰에 사람 점유체를 세워 문 높이 2.20 m와 창대 높이를 비교해 드러낸다. 소스 owner는 `src/models/frame.ts`이며 순폭과 유리 폭 산출은 모델 생성 시 수치로 보고한다.

## 표현 상한과 보이는 한계 {#model-representation-ceiling}
<!--
@evidence principles/core/common.md#scope-preservation 창틀·sash·살대·유리·문짝·문설주·손잡이·경첩·문턱을 두께 있는 별도 부재로 만드는 범위와 웨더스트립·잠금 내부·스프링·나사·이중 유리 공기층을 만들지 않는 범위를 함께 정한다.
@evidence principles/core/common.md#substantive-completion 사각 구멍이나 평면 한 장 대체를 금지하고 검사자가 추론하지 말아야 할 단열·방수·기밀·하중·구조·법규를 열거해 각 모델 H2가 한계를 새로 정할 필요가 없다.
@evidence principles/core/common.md#declared-basis 상한을 settings/20-verification.md#fidelity의 '단순 blocking이나 topology 통과로 낮추지 않는다'에서 받는다고 링크로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation fidelity의 '창호·문짝이 실제 캡처에서 읽혀야 한다'를 부재별 두께 있는 형상 목록과 만들지 않는 기구 목록이라는 모델 층 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract proxy 상태를 '두께 있는 별도 부재, 내부 기구 없음'으로 정하고 그 proxy가 지지하지 않는 관찰을 적는다.
@evidence principles/design/models.md#spatial-convention 이 H2는 좌표를 새로 정하지 않고 model-local-frame의 관례를 그대로 쓴다.
@evidence principles/design/models.md#reviewable-structure 부재가 평면 한 장으로 대체되었는지는 model-review-set의 측면 직교 단면에서 반증된다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 대신 두께·분리 부재라는 관찰 가능한 구성 결정을 정하고 광학·조명 판정을 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 어떤 부재 층이 존재하고 어떤 층이 없는지를 명시해 구현자가 층을 발명하지 않게 한다.
@evidence obligations/design/models.md#representation-ceiling 모델 모집단의 표현 상한과 검사자가 추론하지 말아야 할 단열·방수·기밀·하중·구조·법규 주장을 정한다.
@evidence settings/20-verification.md#fidelity 창호·문짝이 캡처에서 읽혀야 하고 blocking 통과로 낮추지 않는다는 요구를 두께 있는 별도 부재 목록으로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work fidelity를 적힌 그대로 소비했고 표현 상한과 settings 사이에 수정할 모순이 없었다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

[표현 수준](../settings/20-verification.md#fidelity)은 창호와 문짝이 실제 캡처에서 읽혀야 하며 단순 blocking이나 topology 통과로 낮추지 않는다고 정한다. 따라서 창틀·sash·살대·유리·문짝·문설주·손잡이·경첩은 각각 두께 있는 별도 부재로 만들고 사각 구멍이나 평면 한 장으로 대신하지 않는다. 전후면 외부 문턱은 spaces가 이미 지은 부재이므로 모델이 복제하지 않는다. 웨더스트립, 잠금 기구 내부, 스프링, 나사, 유리 이중층의 공기층은 만들지 않는다. 검사자는 이 모델에서 단열·방수·기밀·개폐 하중·구조 안전·법규 적합을 추론하지 않는다. 소스 owner는 `src/models/frame.ts`이며 각 모델 H2가 이 상한 안에서 자기 한계를 적는다.

## 표면 파티션 이름 규칙 {#model-surface-partition-naming}
<!--
@evidence principles/core/common.md#scope-preservation 개구부와 가구·설비·외장 반복 부재의 역할별 id를 역할별로 한 목록에 두고 '한 id는 한 역할'과 -exterior/-interior 접미사 규칙을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion frame·sash·glass·leaf·jamb부터 siding-face·siding-butt·siding-back까지 각 id의 역할을 괄호로 적어 materials가 바인딩할 이름을 새로 만들 필요가 없다.
@evidence principles/core/common.md#declared-basis 모델이 표면 id만 제공하고 색·광학값·텍스처 scale을 정하지 않는 분담을 settings/20-verification.md#surface-allocation에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-allocation의 'models는 경계를 받아 두께 있는 부재를' 인계를 kebab-case 역할 id 목록과 안팎 접미사 규칙으로 바꾼다.
@evidence principles/design/models.md#representation-contract 인접 면이 다른 응답을 받을 때 -exterior/-interior로 별도 안정 표면을 준다는 규칙과 공통 id 목록을 정한다.
@evidence principles/design/models.md#spatial-convention 이 H2는 좌표를 정하지 않으며 표면 id는 model-local-frame의 부재 노드에 붙는다.
@evidence principles/design/models.md#reviewable-structure 같은 역할이 다른 id를 쓰거나 한 id가 두 역할을 가지면 materials 바인딩 뷰에서 경계가 어긋나 반증된다.
@evidence principles/design/models.md#model-observable-style-basis charcoal·흰 trim 같은 색은 materials 몫으로 남기고 모델은 부재 역할 경계만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 모든 모델이 공유하는 표면 인터페이스 이름을 정해 표면 층이 빠진 모델이 생기지 않게 한다.
@evidence obligations/design/models.md#addressable-model-decisions 표면 파티션을 기하·관절·한계와 분리된 주소로 두는 규칙을 정하고 01–05가 각자 표면 H2를 따로 둔다.
@evidence settings/20-verification.md#surface-allocation 모델이 경계를 받아 두께 있는 부재와 안정 표면 id를 내고 materials가 같은 binding으로 마감한다는 인계를 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work surface-allocation을 적힌 그대로 소비했고 id 목록을 정하는 데 settings나 spaces의 수정이 필요하지 않았다.
@evidence obligations/core/common.md#production-language id는 영어 kebab-case, 역할 설명과 본문은 한국어로 두고 id마다 괄호 안 한국어 역할을 붙여 독자가 용어를 추측하지 않게 한다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

[표면 분해 인계](../settings/20-verification.md#surface-allocation)에 따라 모델은 materials가 바인딩할 안정 표면 id만 제공하고 색·광학값·텍스처 scale은 정하지 않는다. id는 부재 역할을 나타내는 kebab-case 이름이며 한 모델 안에서 유일하고, 같은 역할은 모든 모델에서 같은 id를 쓴다. 개구부 부재의 공통 id는 `frame`(창틀), `sash`(움직이거나 고정된 유리 틀), `mullion`(칸 사이 세로 부재), `muntin`(유리 칸 살대), `glass`(투명 유리), `appliance-glass`(불투명 조작부·오븐 문 유리), `obscured-glass`(흐린 유리), `exterior-trim`(외부 trim), `interior-sill`(안쪽 창대), `leaf`(실내 문짝 또는 기기 문짝 몸), `leaf-exterior`(외부 문짝 날씨 면), `leaf-interior`(외부 문짝 실내 면), `leaf-panel`(문짝 오목 패널·판재), `leaf-edge`(외부 문짝 두께 면), `panel-edge`(차고문 분절 사이와 절단 끝), `gate-batten`(대문 가로 띠장), `gutter`(처마 물받이), `downspout`(선홈통), `jamb`(문설주), `jamb-a`(A방 쪽 문설주 바깥 면), `jamb-b`(B방 쪽 문설주 바깥 면), `jamb-core`(개구부 안쪽 챌면), `casing`(실내 문선), `casing-a`(A방 문선), `casing-b`(B방 문선), `handle`(손잡이), `hinge`(경첩), `rail`(트랙·레일), `baluster`(난간살), `bottom-rail`(난간 아래 부재), `rod`(옷걸이 봉), `shelf`(선반판)이다. 가구·설비의 공통 id는 몸통 계열 `carcass`(수납 몸통), `plinth`(걸레받이 받침), `drawer-front`(서랍 전면), `countertop`(작업 상판), `top`(가구 윗판), `cleat`(선반 받침목), `leg`(다리), `post`(세움대), `apron`(상판 아래 띠), `base`(바닥 받침), `board`(벽 부착판), `hook`(걸이), 좌석 계열 `seat`(가구 좌판), `toilet-seat`(변기 좌대), `seat-cushion`(좌석 쿠션), `back`(등받이), `arm`(팔걸이), `footrest`(발받침), 설비 계열 `appliance-body`(가전 외장), `appliance-interior`(가전 내부), `control-panel`(조작부), `cooktop`(조리면), `burner`(화구), `basin`(세면볼·싱크볼), `ceramic`(위생도기 몸), `faucet`(수전), `lid`(뚜껑), `shower-tray`(샤워 바닥판), `mirror`(거울면), 침구 계열 `bed-frame`(침대 틀), `headboard`(머리판), `mattress`(매트리스), `bedding`(이불), `pillow`(베개), 직물·소품 계열 `towel`(수건), `curtain`(커튼), `clothes`(걸린 옷), `folded`(접힌 직물), `field`(깔개 안쪽 면), `border`(깔개 테두리), `book`(책), `pencil`(연필), `container`(식품 용기), `basket`(바구니), `bin`(수납함), `shoe`(신발), `shoe-box`(신발 상자), `lamp-base`(등 받침), `lamp-shade`(등 갓), `tool-steel`(공구 금속부), `tool-grip`(공구 손잡이), `door-ring`(세탁기 문 금속 고리), `drum`(세탁기 문 뒤 정지 원통), `mirror-frame`(거울 테두리), 외장 반복 계열 `siding-face`(siding 노출면), `siding-butt`(siding 아래 끝면), `siding-back`(siding 뒷면), `siding-top`(siding 위 끝면), `siding-cut`(siding 양 끝 절단면), 지붕 반복 계열 `shingle-face`(shingle 노출면), `shingle-butt`(shingle 아래 끝면), `shingle-back`(shingle 뒷면), `shingle-cut`(shingle 절단면), 부속 계열 `bracket`(받침 철물), `accessory`(부착 소품), 식재 계열 `bark`(줄기·가지), `foliage`(잎 군집), `stem`(실내 식물 줄기), 조명 계열 `fixture-housing`(기구 외장), `fixture-diffuser`(확산면), `fixture-canopy`(천장 접합판), `fixture-stem`(기구 목·줄), `fixture-shade`(갓 외면), `fixture-glass`(포치 등 유리), 생활 소품 계열 `cutting-board`(도마), `utensil`(조리도구), `bowl`(그릇), `fruit`(과일), `tray`(쟁반), `art-frame`(액자 테와 뒤판), `art-print`(인쇄 면), 벽난로 계열 `firebox`(화구 속), `firebox-trim`(화구 전면 테), `mantel`(목재 선반)이다. 한 id는 한 역할만 가지며 같은 역할에 새 id를 만들지 않는다. 안팎 면이 다른 마감을 받아야 하는 부재는 `-exterior`와 `-interior` 접미사로 나눈다. 부품의 앞·뒤·옆·위·아래·절단 끝을 포함한 모든 삼각형 면에는 정확히 하나의 표면 id를 붙인다. 회전 피벗·슬라이드 노드 이름은 표면 id가 아니다. 외부 문턱판은 spaces/10-ground-floor.md#ground-threshold-junctions의 공간 부재이고 모델은 같은 면을 만들지 않는다. 소스 owner는 `src/models/frame.ts`이며 materials 결합은 실제로 각 H2가 내는 id와 대조해야 하며 현재 source 결속은 unverified다.

## 원형 계열별 표현 완결 보고 {#model-representation-completion}
<!--
@evidence principles/core/common.md#scope-preservation 창·외부 문·실내 문·난간·수납·가구 여섯 계열 모두에 구조 판정과 의미 판정을 따로 보고하는 경로를 정한다.
@evidence principles/core/common.md#substantive-completion 구조 판정을 닫힌 부피·바깥 법선·유한 좌표·id와 관절 노드로, 의미 판정을 예약 산술·표현 한계·리뷰 캡처로 정하고 source가 없어 구조 판정이 현재 unverified라고 적는다.
@evidence principles/core/common.md#declared-basis 의미 판정 기준을 contracts/reservation-fit.md#reservation-fit과 이 파일의 model-review-set에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공용 완결 의무를 이 주택의 여섯 원형 계열과 account 표의 한 줄 형식(계열·원형·예약 owner·산술·캡처 주소)으로 바꾼다.
@evidence principles/design/models.md#representation-contract 각 계열의 구조 결과가 갖출 것(닫힌 부피·법선·id·노드)을 정한다.
@evidence principles/design/models.md#spatial-convention 이 H2는 좌표를 새로 정하지 않고 각 계열 H2의 관례를 검사 대상으로 삼는다.
@evidence principles/design/models.md#reviewable-structure 의미 판정에 리뷰 캡처 주소를 포함시켜 캡처 없는 계열이 완결로 보고되지 않게 한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 판정을 새로 하지 않고 각 계열 H2의 관찰 가능한 결정이 답해졌는지만 묻는다.
@evidence principles/design/models.md#model-scale-layer-completion 구조적으로 유효해도 척도·층·경계·관찰이 빠진 계열을 의미 판정에서 실패로 보고하는 경로를 정한다.
@evidence obligations/design/models.md#model-representation-completion 모집단의 구조 판정과 의미 판정을 계열별로 분리해 보고하고 어느 판정도 다른 판정을 함의하지 않는다고 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work reservation-fit 계약과 settings fidelity를 그대로 소비했고 완결 보고 형식을 정하는 데 부모 수정이 필요하지 않았다.
@evidence obligations/core/common.md#purpose-fit 여섯 원형 계열(창·외부 문·실내 문·난간·수납·가구)과 공통 기준 파일 00의 역할을 나열해 각 파일이 사라지면 어느 source 판정이 미정이 되는지를 적는다.
@evidence obligations/core/common.md#proportionate-development 계열마다 구조·의미 판정을 같은 형식으로 보고하게 해 한 계열이 산술 없이 압축되거나 source 없이 부풀려진 것을 드러낸다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

모델 모집단의 완결은 원형 계열마다 두 판정을 따로 보고한다. 구조 판정은 `src/models`가 만든 메시가 닫힌 부피·바깥 법선·유한 좌표·선언한 표면 id와 관절 노드를 모두 갖는지이고, 의미 판정은 [예약 맞춤 계약](../contracts/reservation-fit.md#reservation-fit)의 산술, 선언한 표현 한계, [모델 리뷰 뷰 목록](#model-review-set)의 캡처가 모두 답해졌는지다. 한 판정은 다른 판정을 함의하지 않는다. 계열은 창([01](01-windows.md)), 외부 문과 대문([02](02-exterior-doors.md)), 실내 문([03](03-interior-doors.md)), 난간 부재([04](04-stair-members.md)), 수납 부재([05](05-closet-fittings.md)), 가구·설비([10](10-kitchen-dining.md)–[15](15-outdoor.md)), 식재([16](16-planting.md)), 조명기구([17](17-light-fixtures.md)), 생활 소품([18](18-house-props.md)–[19](19-room-accents.md))이다. 현재 모든 계열은 설계 문서만 있고 source가 없으므로 구조 판정은 unverified이며, 의미 판정은 각 H2의 산술이 문서에 적힌 수준까지만 성립한다. 보고 경로는 모델 source 단계의 구조 검사 출력과, 예약 맞춤 account가 계열·원형·예약 owner·산술 결과·캡처 주소를 한 줄씩 나열하는 표다. 소스 owner는 `src/models/frame.ts`다.

## 모델 리뷰 뷰 목록 {#model-review-set}
<!--
@evidence principles/core/common.md#scope-preservation 모든 모델에 정면 직교·측면 직교 단면·45° 사선 투시와 관절 모델의 기준·최대 열림 사선 투시를 찍는 고정 목록을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion canvas 1536×1024·DPR 1·중성 배경·FOV 45°·눈높이 1.6 m와 사람 점유체 동반을 정해 회귀 비교 조건을 구현자가 고르지 않게 한다.
@evidence principles/core/common.md#declared-basis 프레임 조건을 settings/20-verification.md#frame-condition, 점유체를 settings/00-production.md#use-profile에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation frame-condition의 외부·실내 기본 view를 모델 단위의 네 가지 고정 뷰와 관절 두 상태로 바꾼다.
@evidence principles/design/models.md#representation-contract 리뷰 뷰가 확인할 점유 범위와 관절 상태를 정해 proxy가 지지하는 관찰을 한정한다.
@evidence principles/design/models.md#spatial-convention 사선 투시의 FOV 45°와 눈높이 1.6 m를 도·m 단위로 적는다.
@evidence principles/design/models.md#reviewable-structure 실루엣은 정면 직교, 부재 깊이는 측면 단면, 관절은 기준·최대 열림 투시로 드러내는 뷰를 정한다.
@evidence principles/design/models.md#model-observable-style-basis 중성 배경으로 샷 조명·구도를 배제하고 모델 구성만 비교한다.
@evidence principles/design/models.md#model-scale-layer-completion 척도 대조용 점유체를 모든 뷰에 포함시켜 척도가 빠진 리뷰를 허용하지 않는다.
@evidence obligations/design/models.md#model-review-set 모델 개정 사이 회귀를 비교하는 유한한 중성 뷰·배경·척도 대조 목록을 정한다.
@evidence settings/20-verification.md#frame-condition canvas 1536×1024·DPR 1·중성 배경·FOV 45°·눈높이 1.6 m를 모델 리뷰 뷰 조건으로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work frame-condition과 use-profile을 적힌 그대로 소비했고 리뷰 목록을 정하는 데 부모 수정이 필요하지 않았다.
@evidence spaces/04-observations.md#spatial-observation-derivation 모델 리뷰와 별개로 실제 집 안 배치 검사는 전체 관찰이 맡는다는 경계를 소비한다.
-->

레퍼런스 01–05는 치수 도면으로 사용하지 않는다. 이 H2의 기술 규칙은 설정과 공간 예약에서 정하며 사진 비례를 근거로 삼지 않는다. 이 판단은 사진으로 척도를 역산하지 않는다는 경계이며 외곽·동선의 owner를 바꾸지 않는다.

모델 리뷰는 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 canvas 1536×1024, device pixel ratio 1, 중성 배경을 쓴다. 각 모델마다 정면 직교, 측면 직교 단면, 45° 사선 투시(수직 FOV 45°, 눈높이 1.6 m), 관절이 있으면 기준 상태와 최대 열림 상태의 같은 사선 투시를 찍는다. 척도 대조로 같은 뷰에 [사람 점유체](../settings/00-production.md#use-profile)를 세운다. 이 뷰는 샷 구도와 무관하게 모델 개정 사이의 회귀를 비교하는 고정 목록이며 실제 집 안 배치 검사는 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)이 맡는다. 소스 owner는 `src/models/frame.ts`이고 실제 캡처는 unverified다.
