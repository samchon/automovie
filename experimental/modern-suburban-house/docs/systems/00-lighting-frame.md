# 조명 체계의 틀

## 광원 소유와 쓰기 경계 {#lighting-authority}
<!--
@evidence principles/core/common.md#scope-preservation 광원 레코드의 쓰기 채널과, 방 경계·기구 몸체·발광 표면·배치를 spaces·models·materials·instances로 넘기는 경계를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 광원 id 형식 `light:<space-id>:<fixture-role>`, 쓸 수 있는 17개 공간 id, 대지 전체 낮빛의 `light:daylight:<role>` 예외를 정해 source가 id 규칙을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 조명의 systems 소유는 build-allocation, 광원 조건은 lighting-state에서 받고 id 형식과 한 광원 한 공간 소속은 이 branch의 선택이라고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation build-allocation이 "조명은 systems가 소유한다"만 정한 데 비해 쓰기 채널 목록, 공간별 id 규칙, 한 광원 한 공간 소속, 값의 단일 저작 파일을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 쓰는 것은 IAutoMovieLight 필드와 environment 다섯 값뿐이고 방 경계·천장 datum은 spaces, 기구 geometry는 models, 발광 표면은 materials, 배치는 instances에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 모든 기구 광원이 spaces id 하나에 묶여 입력 공간이 이름으로 드러나고 같은 값을 두 파일에서 저작하지 않아 이름 없는 입력이 없다.
@evidence principles/design/systems.md#system-verification-address 컴파일된 광원 목록이 네 광원 종류만 쓰는지, 공간 id가 실제 spaces 방과 일치하는지, 다른 branch 값을 쓰는 광원이 없는지의 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work build-allocation의 조명 배정과 spaces 방 id 17개를 소비했고 한 상태를 두 owner가 쓰거나 권한 없는 입력이 생기는 경우가 없어 부모 수정이 없었다.
@evidence settings/00-production.md#build-allocation "조명은 systems가 소유한다"를 받아 쓰기를 광원 레코드와 environment 값에 한정하고 기구 형상·표면·배치는 각 branch에 남긴다.
@evidence settings/00-production.md#working-language 본문 끝 문단대로 조명 결정을 한국어로 쓰고 API·필드명·광원 id만 원형을 보존한다.
@evidence obligations/design/systems.md#addressable-system-decisions 태양·하늘 fill·창 자연광·기구 묶음마다 독립 H2를 두고 광원 하나를 공간 하나에 묶어 따로 바꾸고 검토하게 한다.
@evidence obligations/design/systems.md#system-ownership-interfaces 입력(spaces 방 id·천장 datum), 출력(광원 레코드·environment 값), 영향받는 owner(models·materials·instances)를 이 H2가 나눈다.
@evidenceExclude settings/00-production.md#accessibility 「접근성 전달 상태」는 "이 library의 필수 대체 접근은 한국어 문서, 이름 있는 키보드 조작, 카메라 복귀 및 관찰 선택, 색만으로 상태를 구분하지 않는 검사 결과다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#coverage-map 「설정 소유 지도」는 "현재 설정의 명시적 canon은 이 파일의 전달·사용·좌표·언어·접근성과 사용 가정, 10-house.md의 규모·매스·각 방과 조경 정체성, 20-verification.md의 레퍼런스 권위·GPU·계측·관찰·소유 분해·저작 순서·역할·편집 및…"를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#governing-aim 「지배 목표」는 "사용자 지정 목표는 리뷰 거리의 외부 및 각 실내에서 레퍼런스 다섯 장과 같은 집의 구조·부재·재료·생활 기능이 읽히게 하는 것이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#operative-subjects 「작동 주체와 자원」는 "주택과 각 공간은 10-house.md의 해당 H2가 소유한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#operator-access 「조작자와 접근」는 "저작 결정으로 조작자는 마우스와 키보드를 사용하는 데스크톱 검토자다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/00-production.md#use-profile 「사용과 통행 가정」는 "구조·생활 가능성을 검토하기 위한 저작 가정은 성인 둘과 자녀 둘이 쓰는 집이며 특수 의료장비나 상주 보조인의 동선을 요구하지 않는다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#entry 「실내 현관」는 "고정 그래프의 1층 현관은 포치에서 들어와 거실과 중앙 단일 꺾임계단에 각각 직접 이어지는 분배 공간이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#garage 「빈 2대 차고」는 "오른쪽에 붙은 차고는 하나의 1층 부속 볼륨이며 두 대용 폭의 어두운 분절 패널문 하나와 상부 채광 유리를 가진다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#house-scale 「규모」는 "사용자가 정한 약 246㎡는 측량값이 아닌 규모 목표다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#kitchen-equipment 「주방 설비」는 "03에서 채택한 주방은 회갈색 패널 수납장, 밝은 상판과 타일 backsplash, 스테인리스 냉장고·레인지·전자레인지, 식기세척기, 싱크와 수도꼭지가 있는 섬으로 읽힌다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#laundry-mudroom 「세탁 겸 머드룸」는 "사용자 지정 세탁·머드룸을 우측 띠와 차고 사이의 완충실로 저작한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#living 「전면 거실」는 "거실은 본채 1층 전면 왼쪽에 있고 현관에서 직접 보이며 후면 공용부와 연결된다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#main-mass 「본채 매스와 지붕」는 "사용자 그래프와 외관 레퍼런스 01의 관계를 채택한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#openings 「개구부의 읽힘」는 "01의 검은 창틀과 흰 외부 trim, 03–05의 흰 실내 문선 및 패널문을 채택한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#pantry 「팬트리」는 "저작 선택으로 팬트리는 주방 또는 그에 바로 닿는 서비스 접근 통로에서 열리는 별도 식품 수납 공간이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#service-band 「우측 서비스 동선」는 "사용자 고정 그래프에 따라 본채 1층 우측 서비스 띠에 팬트리·파우더룸·세탁 겸 머드룸을 놓고 차고와 직접 연결한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#shower-bathroom 「샤워 욕실」는 "상층 복도에서 직접 들어가는 첫 욕실은 유리 샤워부스·세면대·변기를 가진다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#site-identity 「대지와 식재」는 "01을 바탕으로 완만한 평지의 주택 대지, 앞 보도·낮은 연석·차도 가장자리, 차고 진입 콘크리트 차도, 현관 보행길, 잔디와 낮은 화단을 만든다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#stair 「단일 꺾임계단」는 "본채 중앙의 계단 한 개가 현관과 2층 짧은 복도를 연결한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#storage 「수납」는 "사용자의 상층 수납 요구를 실현하는 저작 선택으로 계단참에 가까운 복도 수납에는 린넨 선반과 접힌 수건을 둔다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#tub-bathroom 「욕조 욕실」는 "상층 복도에 자기 문을 가진 두 번째 욕실로, 02의 욕조 겸 샤워·세면대·변기를 채택한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/10-house.md#upper-hall 「상층 복도」는 "계단 상부참에서 시작하는 짧은 복도 하나가 세 침실, 두 욕실, 수납에 직접 닿는다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#completion-boundary 「완료와 기록」는 "../contracts/observation-denominator.md#dual-completion의 양쪽 목록과 독립 판정을 적용한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#data-authority 「측정과 프레임의 책임」는 "사용자 지시에 따라 수·id·위치·binding·치수는 컴파일된 산출물에서 읽는다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#execution-boundary 「실행과 모듈 경계」는 "사용자 지시로 @automovie/engine의 CommonJS 경계를 유지한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#fidelity 「표현 수준」는 "이 production의 사용자 지시는 매스와 지붕, 개구부 비례/위치, 포치·기둥·처마·trim·굴뚝·계단·난간·창호·문짝, 재료·빛·그림자·조경과 모든 실내가 실제 캡처에서 읽혀야 한다는 것이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#implementation-boundary 「편집과 의존성 경계」는 "사용자가 허용한 편집 범위는 이 production의 저작 파일이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#lifecycle-boundary 「저작 순서」는 "사용자의 제작 순서는 매스/공간 그래프와 표면 분해를 함께 닫고, 실제 외피 부재, 외피 반복 모듈, fit-out, 재료 읽힘과 정리로 전진하는 것이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#reference-authority 「레퍼런스 권위」는 "사용자가 제공한 D:/AutoMovieBench/refs-20260916/1952/의 01-exterior.png, 02-section-axonometric.png, 03-common-room.png, 04-living-entry.png, 05-…"를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#role-boundary 「저작·계측·판정 권한」는 "사용자가 정한 역할에 따라 저작자는 이 production의 소스·자기 fan-out·수리를 소유하고, 관찰자는 계측하며, 독립 read-only reviewer가 단계 전이를 판정한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#submission-boundary 「커밋과 푸시」는 "사용자의 현재 지시에 따라 저작자가 최소 매 turn 끝과 단계 폐쇄/뷰어 구현 때 커밋·푸시한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#surface-allocation 「표면 분해 인계」는 "../contracts/surface-ownership.md#whole-surface-owner를 1단계 폐쇄의 필수 산출물로 적용한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#validation-boundary 「정규 검증 명령」는 "사용자가 지정한 검증 명령은 이 production 디렉터리에서 README가 소유하는 npm run lint 그대로다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#viewer-handoff 「뷰어 실행 인계」는 "사용자와 조정자의 지시에 따라 뷰어를 구현했으면 시작 명령, 실행 디렉터리, 포트, 열어야 할 경로를 보고한다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude settings/20-verification.md#visual-grammar 「공통 재료와 외피 인상」는 "레퍼런스에서 채택한 palette는 따뜻한 백색 수평 lap siding, 창틀과 차고문의 짙은 charcoal, 흰 trim, 붉은갈색 벽돌 기단과 굴뚝, 꿀빛/중간갈색 목재, 회베이지 실내 직물이다."를 정한다. 조명 H2는 이 결정을 광원 위치·색·강도·상태의 입력으로 읽지 않는다.
@evidenceExclude spaces/00-building.md#main-building-extent 「본채 외곽과 면적」는 "이 spaces의 외곽 선택은 규모와 좌표를 따른다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-boundary-heights 「계단 곁 벽과 열린 보호 경계의 높이」는 "계단 구멍 둘레의 평면 띠는 모두 같은 높이의 벽을 뜻하지 않는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-clearance 「난간과 통행의 순폭 예약」는 "경로의 1.15 m 폭 안에서 양쪽 손잡이·난간의 수평 점유를 각각 0.075 m 이내로 예약한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff 「하나의 연결에 속하는 두 flight와 중간참」는 "단일 꺾임계단을 실현한 계단 공간과 단별 치수는 유지한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/02-stair.md#stair-floor-opening 「계단 구멍과 전면 창의 경계」는 "위 경로와 하부 대기 면적에 한정하여, 층판 구멍은 X = [-1.80, -0.65]·Z = [-4.56, -0.25]의 세로 부분과 X = [-0.65, 1.87]·Z = [-4.56, -3.41]의 가로 부분을 합친 L형이다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/03-surface-owners.md#exterior-surface-handoff 「입면·지붕·층의 소유」는 "표면 분해 인계에 따라 완결 표면 계약을 첫 소스 저작 전에 적용한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/03-surface-owners.md#interior-surface-handoff 「방 내부의 완결 면 소유」는 "표면 분해 인계가 요구한 각 방 내부의 완결 면에 대해, 아래 owner는 각 방의 모든 안쪽 벽·천장·바닥 마감 구역과 개구부 둘레를 한 저작자가 통합할 책임을 가진다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/04-observations.md#engine-render-handoff 「공간 산출물에서 실제 렌더로 넘기는 경계」는 "설치된 공개 엔진의 lowerBuiltEnvironment는 환경을 검증하고 실제 model을 가진 element만 세계 변환의 set으로 내리며 원래 built environment도 보존한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/04-observations.md#reference-spatial-comparisons 「다섯 참조에 더하는 공간 비교」는 "레퍼런스 권위를 현재 공간 owner에 연결한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/04-observations.md#spatial-observation-derivation 「공간 산출물에서 파생할 검사」는 "관찰 배분을 받아 전체 관찰 분모를 이 spaces 층에 그대로 적용한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/05-route-network.md#room-route-network 「문으로 답하는 두 층 동선」는 "아래 이름은 이 spaces 문서가 소스로 넘길 식별자다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#exterior-boundary-junctions 「외벽 모서리와 지붕 단차의 단일 몸체」는 "이 접합은 본채 외벽과 차고 외벽/공유 벽의 예약 안에서 만나는 외부 경계를 잇는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-junctions 「모서리와 문턱에서 끊기지 않는 경계」는 "위 공유 칸막이는 같은 높이에서 만나는 끝점·L자·T자·십자 접합을 공유한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-ownership 「방 사이의 한 벽체와 두 안쪽 면」는 "이 설계는 두 storey 안에서 기존 방 사이의 칸막이를 한 번만 생성하기 위한 공간 인계다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions 「외벽과 계단 가장자리에서 닫히는 층간 단면」는 "층간 구조는 본채 내부에서 외벽의 동일 안쪽 면에 닿는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-floor-boundary 「한 층간 구조와 서로 다른 두 층의 마감」는 "두 storey의 완성면 사이에 있는 층간 바닥은 upper-storey 바닥의 한 구조다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance 「낮은 지붕과 천장 바탕의 접합 여유」는 "천장은 본채 실내 평면과 차고 실내 평면 각각의 안쪽 면까지이고, 지붕은 자기 외곽과 교차 경계를 갖는다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/09-ceiling-assembly.md#upper-ceiling-closure 「본채 상층과 계단실의 같은 상부 경계」는 "본채의 최상부 실내 경계는 upper-storey의 완성 천장 높이에 있는 수평 천장이다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base 「낮은 차고의 독립 바닥」는 "차고의 바탕은 차고 안쪽 외곽을 받으며 자기 완성 바닥에서 아래로 0.15 m를 예약한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff 「바닥 아래 지지와 지도 지표의 인계」는 "이 건물은 위 본채/차고 바탕 아래를 연속해서 받치는 채움과 가장자리 지지로 계획한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#ground-threshold-junctions 「외벽 두께 안에서 이어지는 네 출입 경계」는 "본채와 차고의 실내 바닥은 평면에서 벽 안쪽에 끝나지만, 출입 개구부 아래에는 벽 두께를 지나는 지지 바탕이 필요하다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/10-ground-floor.md#main-ground-floor-base 「본채의 연속 바닥 바탕」는 "두 층 본채의 ground-storey 바탕은 마감 안쪽 외곽 전체를 받는 연속 지면 지지 방식으로 택한다."를 정한다. 광원 H2는 방 외곽과 천장 datum만 소비하므로 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#bedroom-three-front-window 「오른쪽 자녀실의 정면 창」는 "bedroom-three-front-window는 전면 벽의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부로 upper-storey의 bedroom-three에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#bedroom-two-front-window 「왼쪽 자녀실의 정면 창」는 "bedroom-two-front-window는 전면 벽의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부로 upper-storey의 bedroom-two에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#front-entry-filling 「목재 현관문의 외부 충전」는 "front-door의 void·순폭 목표·경첩/열림은 현관 owner 그대로다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#front-openings 「거실·침실·계단의 창과 현관문」는 "공통 개구부 인계를 적용한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#front-roof-closures 「박공 삼각 벽과 포치 위의 외벽」는 "전면 전체 입면 owner는 src/spaces/envelope/front.ts다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#garage-front-opening 「닫힌 차고문과 상부 이동 예약」는 "garage-front-door는 차고의 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m의 거친 개구부로 택한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#living-front-window 「포치 아래 거실 묶음창」는 "living-front-window는 전면 벽의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부로 ground-storey의 living-room에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/front.md#stair-front-window 「층간 계단실의 작은 창」는 "stair-front-window는 전면 벽의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#chimney-roof-interface 「벽난로에서 지붕까지의 굴뚝」는 "거실 벽난로는 왼쪽 외벽에 붙는다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#left-openings 「굴뚝 뒤에서 방으로 열리는 창」는 "공통 개구부 인계를 적용한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#left-roof-closure 「주 지붕 끝의 왼쪽 삼각 벽」는 "src/spaces/envelope/left.ts가 왼쪽 완결 입면을 소유한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#living-left-window 「거실 벽난로 뒤쪽의 창」는 "living-left-window는 왼쪽 벽의 Z = [-5.50, -4.30], Y = [0.75, 2.30] m 개구부로 ground-storey의 living-room에 속하는 방과 외벽이 같은 창이다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/left.md#primary-left-window 「주침실 본체의 측면 창」는 "primary-left-window는 왼쪽 벽의 Z = [-8.90, -7.30], Y = [3.91, 5.31] m 개구부로 upper-storey의 primary-bedroom에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#family-rear-window 「가족실의 후면 묶음창」는 "family-rear-window는 후벽의 X = [2.75, 4.75], Y = [0.75, 2.30] m 개구부다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#garden-door 「공용부에서 정원으로 나가는 문」는 "garden-door는 후벽의 X = [-1.20, 1.20], Y = [0, 2.25] m 개구부로 ground-storey의 kitchen-dining-family와 외부 대기를 잇는다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#kitchen-rear-window 「주방 조리대 위의 후면 창」는 "kitchen-rear-window는 후벽의 X = [-4.50, -3.30], Y = [1.15, 2.30] m 개구부로 ground-storey의 kitchen-dining-family에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#primary-rear-window 「주침실의 후면 묶음창」는 "primary-rear-window는 후벽의 X = [-3.85, -1.45], Y = [3.91, 5.31] m 개구부다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#rear-openings 「공용부와 주침실의 정원 쪽 개구부」는 "본채 외곽의 뒤 바깥 면 Z = -10.70 m에서 0.25 m 외벽 예약만큼 들어온 본채 후벽 Z = [-10.70, -10.45] m에 공통 인계를 적용한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/rear.md#rear-roof-closures 「두 본채 지붕과 차고 아래의 후면」는 "src/spaces/envelope/rear.ts가 본채와 차고의 후면 완결 입면을 소유한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#family-right-window 「가족실의 오른쪽 창」는 "family-right-window는 본채 오른쪽 벽의 Z = [-9.95, -8.25], Y = [0.75, 2.30] m 개구부로 ground-storey의 kitchen-dining-family에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#garage-right-window 「차고의 측면 채광창」는 "garage-right-window는 차고 오른쪽 벽의 Z = [-5.85, -4.25], Y = [1.40, 2.20] m 개구부로 ground-storey의 garage에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#right-openings 「차고 접합을 피한 측면 채광」는 "공통 개구부 인계에 따라 본채 오른쪽 창은 본채 외곽의 외벽 X = [5.50, 5.75] m, 차고 오른쪽 창은 차고 외곽의 외벽 X = [11.45, 11.70] m에 바인딩한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#right-roof-closures 「본채 단차와 차고 위의 벽」는 "오른쪽 노출 입면의 owner는 src/spaces/envelope/right.ts다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/envelope/right.md#tub-right-window 「욕조 욕실의 높은 흐린 창」는 "tub-right-window는 본채 오른쪽 벽의 Z = [-8.40, -7.50], Y = [4.56, 5.31] m 개구부로 upper-storey의 tub-bathroom에 속한다."를 정한다. 실내 자연광은 06-openings의 개구부 경계로 받으므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-mass-allocation 「본채 위의 세 박공과 낮은 차고」는 "본채와 차고 외곽, 두 층 천장을 유지하며 설정의 지붕군을 배치한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-profile-datums 「날씨를 받는 면과 아래면」는 "여기서 높이 함수는 지붕 최상부 날씨 면의 Y를 뜻한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-shared-edges 「전면 박공의 골짜기와 단차」는 "전면 박공은 주 지붕 앞쪽에 합류한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/00-junctions.md#roof-wall-head-junctions 「지붕에 닿는 외벽 두께 전체의 상단」는 "본채와 차고의 외벽은 각각 본채와 차고의 기존 외곽과 안쪽 면 사이를 점유하고 자기 지붕 아래에서 닫힌다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/front-gable-left.md#front-gable-left-roof 「전면 왼쪽의 박공 지붕」는 "roof.front-gable.left는 박공 중심보다 -X 쪽의 면이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/front-gable-right.md#front-gable-right-roof 「계단 창 쪽으로 내려가는 박공」는 "roof.front-gable.right는 정면 왼쪽의 전방 박공 가운데 박공 중심보다 +X 쪽의 면이며 src/spaces/roof/front-gable-right.ts가 소유한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/garage-back.md#garage-back-roof 「차고 후벽과 본채 접합」는 "roof.garage.back과 아래면은 src/spaces/roof/garage-back.ts가 소유한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/garage-front.md#garage-front-roof 「패널문 위의 경사면」는 "roof.garage.front는 차고 지붕 영역의 앞 절반이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/main-back.md#main-back-roof 「뒤쪽 처마까지 이어지는 주 지붕」는 "roof.main.back과 아래면은 src/spaces/roof/main-back.ts가 소유한다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/main-front.md#main-front-roof 「전면 박공과 굴뚝을 받는 면」는 "roof.main.front의 owner는 src/spaces/roof/main-front.ts다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/right-back.md#right-back-roof 「후면까지 닫히는 오른쪽 지붕」는 "roof.right.back과 아래면은 src/spaces/roof/right-back.ts의 완결 면이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/roof/right-front.md#right-front-roof 「높은 지붕 아래에 붙는 앞 면」는 "roof.right.front는 본채 오른쪽 영역의 앞 절반이다."를 정한다. 태양 그림자는 이 지붕 geometry를 렌더에서 받을 뿐 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/rooms/common.md#common-kitchen-wall-reservation 「왼쪽 벽 주방의 기구와 작업 점유」는 "이 주방은 위 kitchen-dining-family/ground-storey 내부의 기능 구역이며 별도 room이나 칸막이가 없다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/entry.md#entry-coat-storage 「위 계단 아래의 닫힌 외투장」는 "현관에서 연결된 서비스 접근을 따라 닿는 현관 가까운 외투 수납인 외투장을 위 flight 아래의 높은 끝에 둔다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/entry.md#entry-use-routes 「현관문 뒤의 매트와 분배 바닥」는 "같은 front-entry/ground-storey의 목재 현관문과 얕은 매트를 소비한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/garage-interior.md#garage-use-routes 「문을 닫은 차고의 내부 접근」는 "머드룸의 차고 쪽 하부 대기에서 같은 garage 내부의 선반, 작업대, 측면 창, 닫힌 전면문 안쪽으로 이동한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/laundry.md#laundry-equipment-use 「나란한 두 기기와 신발 벤치의 사용」는 "같은 laundry-mudroom/ground-storey 안에서 오른쪽 기기 벽과 왼쪽 신발 벤치를 배정한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/laundry.md#laundry-through-route 「기기를 열어도 남기는 차고 횡단」는 "이 경로는 두 출입문과 양쪽 대기를 잇는 같은 방 안의 바닥 띠다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/living.md#living-furniture-use 「벽난로를 향한 좌석과 독서 가구」는 "같은 living-room/ground-storey 안에서 거실 설정의 소파는 오른쪽 계단 분리벽에 등을 대고 왼쪽 벽난로를 향한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/living.md#living-through-route 「두 출입과 창·좌석으로 이어지는 바닥」는 "같은 living-room 내부에서 현관 쪽 문과 공용부 쪽 개구부를 잇는다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/pantry.md#pantry-storage-use 「L형 선반과 식품의 점유」는 "같은 pantry/ground-storey의 선반 평면을 소비한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/pantry.md#pantry-use-route 「열린 문에서 선반까지의 사용 통로」는 "위 실문을 90° 열고 pantry 안에서 수납을 사용하는 상태를 예약한다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/rooms/upper-hall.md#upper-linen-storage 「도착면 앞쪽 린넨장」는 "복도 도착면의 앞쪽에 닫힌 린넨장을 둔다."를 정한다. 이 방의 광원 좌표는 같은 방의 외곽·가구 H2에서 유도하므로 광원 H2가 이 H2의 값을 읽지 않는다.
@evidenceExclude spaces/site/00-access.md#map-handoff-inputs 「지도에서 받아야 할 경계와 지표 입력」는 "이 H2는 house-site가 maps로부터 받아야 할 입력과 거부할 불일치를 소유한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/00-access.md#site-access-interface 「외부 네트워크에 넘길 포장 끝」는 "house-site는 본채와 차고, 포치와 아래의 외부 접근 구역을 포함할 site다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/00-access.md#site-local-routes 「포장과 계단의 내부 연결」는 "이 H2는 현관 포치와 외부 진입의 포치·현관 직접 접근과 대지와 식재의 후면 테라스·우측 목재 울타리를 house-site 안의 구간 순서로 잇는다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff 「포장 사이와 지표에서 끝나는 지지」는 "각 완결 포장 owner는 자기 평면 외곽에서 끝나고 상대의 상면/아래면을 동일 좌표로 소비한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-depth-reservation 「낮은 포장의 두께와 경사 바탕」는 "house-site/ground-storey의 외부 접근 중 현관 보행길·측면 관리길·정원 아래 대기의 상면은 각각 front-walk, side-walk, garden-lower-landing이 소유한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support 「높은 포치와 테라스의 닫힌 단면」는 "현관 포치와 정원 테라스는 자기 높은 평탄면과 외부 단을 유지한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/driveway.md#driveway-plan 「차고 문턱으로 오르는 차도」는 "driveway는 대지와 식재의 차고 진입 콘크리트 차도이며 house-site/ground-storey의 외부 포장 구역이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/fence.md#fence-gate-junction 「오른쪽 앞 면의 관리문 접속」는 "위 오른쪽 앞 구간에서 side-yard-gate의 개구부 X 구간을 그대로 비운다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/fence.md#fence-ground-profile 「지표를 받는 높이와 점유」는 "울타리 패널 상단은 관리문의 문짝 상단과 같은 world 높이로 예약한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/front-walk.md#front-walk-plan 「포치 축의 연속 보행면」는 "front-walk는 대지와 식재의 현관 보행길이며 house-site/ground-storey의 외부 보행 구역이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/side-walk.md#side-gate-interface 「측면 울타리 문과 양쪽 대기」는 "위 보행면에서 gate 앞을 side-front-access, 뒤를 side-rear-access의 두 외부 구역으로 택하고 둘 다 house-site/ground-storey에 속한다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/side-walk.md#side-walk-plan 「차도와 테라스 아래 대기를 잇는 보행면」는 "side-walk는 house-site/ground-storey의 연속 외부 보행면이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-lower-landing-plan 「정원 지표에 닿을 아래 대기」는 "garden-lower-landing은 house-site/ground-storey의 외부 대기 구역이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-steps-plan 「테라스에서 지표로 내려가는 단」는 "garden-steps는 house-site/ground-storey의 외부 연결 구역이며 위 테라스와 아래 대기를 잇는다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidenceExclude spaces/site/terrace.md#garden-terrace-plan 「정원문 대기와 포장 테라스」는 "garden-terrace는 대지와 식재가 공용부에서 닿게 둔 작은 포장 테라스이며 house-site/ground-storey의 외부 공간이다."를 정한다. 그림자 범위는 fence-enclosure-plan만 소비하므로 광원 H2가 이 값을 읽지 않는다.
@evidence obligations/core/common.md#layer-boundary 네 파일이 모두 systems 조명 역할 하나만 가지며 기구 몸체는 models, 발광 표면은 materials, 배치는 instances, 방 경계는 spaces로 보내 이 파일들에 다른 전문 계열이 정당화해야 할 결정이 없다.
@evidence obligations/core/common.md#production-language 조명 문서 전체를 working-language의 한국어로 쓰고 IAutoMovieLight 필드명·광원 id·색 벡터 같은 정확한 식별자만 원형으로 두어 읽는 사람이 언어 전환을 추측하지 않게 한다.
@evidence obligations/core/common.md#purpose-fit 00-lighting-frame.md는 권한·상태·예산·리뷰 집합이라는 조명 공통 틀 역할을 맡으며 이것이 없으면 광원 id 규칙, 정지 상태, 32개 상한, 여섯 리뷰 사례가 정해지지 않는다.
-->

[제작 설정의 build 배분](../settings/00-production.md#build-allocation)이 조명을 systems에 맡기고, [빛과 기준 상태](../settings/20-verification.md#lighting-state)가 전면 왼쪽 위 key·뒤 오른쪽 그림자·하늘 fill·켜진 따뜻한 실내등·고정 노출과 white balance를 정한다. 이 branch는 그 조건을 실현하는 광원 레코드만 쓴다. 쓰는 채널은 설치된 공개 타입 `IAutoMovieLight`(directional·point·spot·area)의 `id`·`transform`·`color`·`intensity`·`castShadow`·`shadow`·`range`·`coneAngle`·`width`·`height`와 `IAutoMovieSceneEnvironment`의 `background`·`intensity`·`exposure`·`toneMapping`·`shadows`다. 방 경계·천장 datum은 [storey datum](../spaces/01-storeys.md#storey-datums)과 각 방 owner, 기구의 갓·몸체 geometry는 models, 갓과 전구의 발광 표면은 materials, 기구 개체 배치는 instances가 소유하며 이 branch는 그 값을 다시 정하지 않는다.

기구 광원 id는 `light:<space-id>:<fixture-role>` 형식이며 space-id는 spaces의 방 id(`front-entry`, `living-room`, `kitchen-dining-family`, `service-access`, `powder-room`, `laundry-mudroom`, `pantry`, `garage`, `upper-hall`, `primary-bedroom`, `primary-wardrobe`, `bedroom-two`, `bedroom-three`, `shower-bathroom`, `tub-bathroom`), 계단 `main-stair`, 외부 구역 `front-porch`를 그대로 쓴다. 기구 광원 하나는 그 한 공간에만 속한다. 대지 전체를 비추는 두 낮빛은 공간에 속하지 않으므로 `light:daylight:<role>`로 구분한다. 같은 광원 값을 두 파일에서 저작하지 않는다. [작업 언어](../settings/00-production.md#working-language)에 따라 조명 결정은 한국어로 쓰고 API 이름·필드명·광원 id는 원형을 보존한다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 컴파일된 광원 목록이 `IAutoMovieLight` 합집합만 쓰는지, 방 id가 실제 spaces 방과 일치하는지, 다른 branch의 값을 쓰는 광원이 없는지의 산출물 대조이며 아직 source가 없어 unverified다.

## 정지 기준 상태와 시계 {#lighting-static-state}
<!--
@evidence principles/core/common.md#scope-preservation 시간 흐름이 없는 library의 조명 상태, 리뷰 프레임 on/off, 꺼진 기구의 레코드 처리, 평가 입력과 순서를 맡는다.
@evidence principles/core/common.md#substantive-completion 모든 광원이 rest 값만 갖고 lightMotions·IAutoMovieProductionLighting·seed를 쓰지 않으며 꺼진 기구는 레코드를 만들지 않는다고 정한다.
@evidence principles/core/common.md#declared-basis 정지 상태는 delivery-scope의 시간 순서 없는 library에서 오고 스위치 회로·조광을 모델링하지 않는 것은 이 branch의 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state가 켜진 따뜻한 실내등만 정한 데 비해 rest 값 단일 상태, 꺼짐의 레코드 생략, spaces 확정 후 한 번 평가를 더한다.
@evidence principles/design/systems.md#system-authority-confinement on/off 값은 각 기구 H2가 정하고 이 H2는 상태 모델만 두며 꺼진 기구의 형상은 instances에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 평가 입력을 spaces 산출물의 방 외곽·storey 천장 datum과 이 branch의 상수로 한정하고 다른 활성 system이 없어 update 순서가 없다고 적는다.
@evidence principles/design/systems.md#system-verification-address 서로 다른 두 요청 시점과 두 번의 컴파일이 같은 광원 목록·값을 내는지의 대조가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work delivery-scope의 시간 순서 없는 전달물과 lighting-state의 정지 날씨를 소비했고 시계나 순서가 부모 사이에서 충돌하지 않아 부모 수정이 없었다.
@evidence settings/00-production.md#delivery-scope 시간 순서가 있는 영화·shot이 없다는 전달 범위를 받아 조명을 rest 값의 단일 상태로 둔다.
@evidence obligations/design/systems.md#system-state-clock 초기 상태가 유일 상태이고 시계·seed가 없으며 임의 시점이 같은 상태를 낸다고 정한다.
@evidence obligations/design/systems.md#system-ownership-interfaces spaces 산출물 확정 뒤 한 번 평가하고 다른 system과 공동 쓰기 채널이 없다는 순서를 정한다.
-->

이 라이브러리는 시간이 흐르는 장면을 전달하지 않으므로 조명은 하나의 정지 상태다. 모든 광원은 rest 값만 가지며 `IAutoMovieShot.lightMotions`와 `IAutoMovieProductionLighting`을 쓰지 않는다. 시계·seed가 없고 임의 시점 요청은 언제나 같은 상태를 돌려준다. 평가 입력은 spaces 컴파일 산출물의 방 외곽·storey 천장 datum과 이 branch의 상수뿐이며, 조명은 spaces 산출물이 확정된 뒤 한 번 평가된다. 이 production에 다른 활성 system이 없으므로 system 사이의 update 순서나 공동 쓰기 채널은 없다. 리뷰 프레임의 on/off 상태는 [실내 기구](02-interior-fixtures.md)와 [외부 기구](03-exterior-fixtures.md)의 각 H2가 정한 값 하나이며 스위치 회로·조광·자동 점멸은 모델링하지 않는다. 꺼진 기구는 광원 레코드를 만들지 않고 기구 형상만 instances에 남는다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 서로 다른 두 요청 시점과 두 번의 컴파일이 같은 광원 목록·값을 내는지의 대조이며 unverified다.

## 광원 수와 그림자 예산 {#lighting-budget}
<!--
@evidence principles/core/common.md#scope-preservation 광원 수, 입장 상한, 그림자 광원 수, 초과 시 저하 순서와 보고를 맡는다.
@evidence principles/core/common.md#substantive-completion 광원 30개(directional 2·point 28), 입장 상한 32, 그림자 광원은 태양 하나, 초과 시 range 축소→같은 방 area 병합→조정자 보고의 순서를 정한다.
@evidence principles/core/common.md#declared-basis 그림자 map 하나는 renderer-boundary의 실제 WebGL canvas를 위한 이 branch의 선택이고 방을 빼지 않는 규칙은 build-allocation에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation build-allocation이 성능 때문에 방을 생략하지 말라고만 한 데 비해 32개 상한과 세 단계 저하 순서를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 저하는 광원의 range·종류만 바꾸고 방이나 기구 형상을 지우지 않아 spaces·instances 소유를 건드리지 않는다.
@evidence principles/design/systems.md#system-dependency-basis 저하 발동은 컴파일된 광원 수와 32의 비교라는 이름 있는 입력에만 의존한다.
@evidence principles/design/systems.md#system-verification-address 컴파일된 광원 수와 그림자 광원 수 1, 실제 canvas의 RENDERER와 프레임 오류 유무가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work build-allocation의 방 생략 금지와 renderer-boundary의 실제 GPU canvas를 30개 광원·그림자 1개에 대조했고 상한 안이어서 부모 예산 결정을 고칠 결함이 없었다.
@evidence settings/20-verification.md#renderer-boundary 실제 WebGL canvas에서 그림자 map을 태양 하나로 묶고 RENDERER 보고를 관찰에 넣는다.
@evidence obligations/design/systems.md#system-budget-degradation 입장 상한 32, 그림자 광원 1, range 축소→area 병합→보고의 저하와 실내 그림자 부재라는 보이는 한계를 정한다.
@evidence obligations/core/common.md#proportionate-development 네 파일 14개 H2와 광원 30개를 17개 공간에 배분하되 기능 구분이 조명에 걸린 공용부에 매달린 광원 세 개와 갓 외곽 대조, 위생실에 세면등 세 개를 더 주고 수납·통로에는 천장등 하나씩만 둬 결과 비중에 맞춘다.
-->

현재 광원은 낮빛 directional 2개와 실내 point 28개로 30개이며 입장 상한을 32개로 둔다. 그림자를 던지는 광원은 태양 하나로 제한한다. 실내·외부 기구는 모두 `castShadow`를 쓰지 않는다. 이는 [렌더 경계](../settings/20-verification.md#renderer-boundary)의 실제 WebGL canvas에서 그림자 map 수를 하나로 묶기 위한 이 branch의 선택이며, 실내등의 그림자가 없다는 한계는 리뷰에서 보이는 결과로 기록한다. 광원 수가 설치 엔진의 한도를 넘으면 방을 빼지 않고 `range`를 줄이거나 같은 방의 여러 기구를 area 하나로 합치는 순서로 처리하며, 그래도 넘으면 실제 한도를 조정자에게 보고한다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 컴파일된 광원 수와 그림자 광원 수, 실제 canvas의 RENDERER와 프레임 오류 유무이며 unverified다.

## 조명 리뷰 집합 {#lighting-review-set}
<!--
@evidence principles/core/common.md#scope-preservation 외관 그림자, 공용부 빛 웅덩이, 실내 연속, 좌표·갓 외곽 대조, 컴파일 동일성, 광원 수·RENDERER의 여섯 사례를 맡는다.
@evidence principles/core/common.md#substantive-completion 여섯 사례와 "광원 하나를 빼거나 강도 0이면 해당 사례가 실패해야 한다"는 반증력 기준을 정한다.
@evidence principles/core/common.md#declared-basis 01·03·04·05 프레임은 frame-condition의 참조 역할에서, 좌표 대조는 02·03 H2의 인용 외곽에서 온다고 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation frame-condition이 프레임 조건만 정한 데 비해 조명 전용 여섯 사례와 반증력 기준을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 사례는 광원 결과만 묻고 프레임·카메라 조건은 frame-condition에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 각 사례가 대조하는 입력(참조 프레임, 인용 외곽, 두 컴파일, 광원 수)을 이름으로 적는다.
@evidence principles/design/systems.md#system-verification-address 여섯 사례가 각 H2 주장을 반증하고 광원 제거 시 실패해야 한다는 기준으로 통과만 하는 사례를 걸러낸다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work frame-condition의 01·03·04·05 참조 프레임을 여섯 사례에 대조했고 조명 관찰을 받을 프레임이 모두 있어 부모 수정이 없었다.
@evidence settings/20-verification.md#frame-condition 01 외관, 03 공용부, 04·05 실내 참조 프레임을 조명 사례의 관찰 조건으로 쓴다.
@evidence obligations/design/systems.md#system-review-set 상태·예산·인터페이스 실패를 가르는 여섯 유한 사례와 반증력 기준을 정한다.
@evidence settings/20-verification.md#observation-allocation 레퍼런스 01 외관, 03 공용부, 04 현관/거실/계단, 05 복도/침실/욕실과 계단참의 역할 배분을 여섯 사례 중 세 프레임 사례의 대상으로 쓴다.
-->

조명의 유한 리뷰 사례는 여섯이다. 프레임 사례의 대상은 [관찰 배분](../settings/20-verification.md#observation-allocation)의 레퍼런스 역할을 따른다. 첫째, 01 외관 프레임에서 그림자가 뒤 오른쪽에 떨어지고 그늘이 완전 검정이 아닌지를 본다. 둘째, 03 공용부 프레임에서 섬 pendant와 식탁등의 두 빛 웅덩이를 본다. 셋째, 04·05 프레임에서 현관·계단참·복도·침실이 창 빛과 따뜻한 천장등으로 함께 읽히는지 본다. 넷째, 모든 켜진 광원의 좌표가 [실내 기구](02-interior-fixtures.md)가 인용한 방 외곽 안에 있고 매달린 기구의 갓 외곽이 인용한 가구·동선 예약과 겹치지 않는지를 산출물로 대조한다. 다섯째, 두 번의 컴파일과 두 요청 시점이 같은 광원 목록을 내는지 대조한다. 여섯째, 컴파일된 광원 수와 그림자 광원 수 1, 실제 canvas의 RENDERER를 보고한다. 광원 하나를 빼거나 강도를 0으로 바꾸면 해당 사례가 실패해야 하며, 그렇지 않은 사례는 반증력이 없는 것으로 보고 고친다.

source owner는 `src/systems/lighting.ts`이며 관찰 결과는 아직 없어 모두 unverified다.
