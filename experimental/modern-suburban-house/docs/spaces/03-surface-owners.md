# 완결 시각 표면의 소유 분해

## 입면·지붕·층의 소유 {#exterior-surface-handoff}
<!--
@evidence principles/core/common.md#scope-preservation 네 입면, 공유 벽, 지붕 경사면, 포치, 본채/차고 바닥·층간·천장 바탕, 계단, 포장과 울타리 패널·문기둥의 완결 면을 spaces source에 배정하고 별도 대문 문짝은 models에 넘기며 계산 파일의 역할을 구분한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 표가 네 입면·공유 벽체·여덟 지붕 경사면·포치·1층/층간/차고 바탕·계단·네 포장·울타리 패널과 문기둥을 spaces 파일에 배정함을 대조했다. 대문 문짝·철물은 models/02에 별도 배정하고 building·junctions·openings·boundaries·site는 계산 역할로 구분한다.
@evidence principles/core/common.md#substantive-completion 완결 면마다 source owner를 정하고 본채/차고 공유 벽은 지붕 높이에 따라 garage와 right 두 파일에 배정하며 building·roof/junctions·openings·boundaries·site 파일은 계산과 조립만 하게 한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 표가 완결 면의 source owner를 적고 공유 벽 행은 차고 지붕을 경계로 `garage.ts`와 `envelope/right.ts` 두 몸체를 적는지 대조했다. `building.ts`는 외곽·공유 좌표 조립, `roof/junctions.ts`는 교차 경계 산출로 한정한다.
@evidence principles/core/common.md#declared-basis 배정 근거는 whole-surface-owner 계약이고 spaces source의 건물 골격은 실재하지만 model 충전 부재는 후속 분기라 표가 그 두 시점의 owner 경계임을 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 표면 분해 인계와 완결 표면 계약 링크, 현재 spaces source의 골격과 아직 없는 model 충전 부재라는 두 시점을 본문에서 다시 대조했다. 충전 부재 면 census 완료로 확대하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 사전 분해 요구를 입면별·지붕 경사면별·포장별 파일로 나누고 종전의 포장 전체 한 파일 예약을 소스 저작 전에 보행면·차도·테라스로 쪼갠다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 surface-allocation이 owner·파일 경계 선언만 요구한 데 비해 이 H2는 지붕 경사면별 파일과, ‘종전의 포장 전체 한 파일 예약’을 보행면·차도·테라스 파일로 나눈 결정을 소스 저작 전에 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology 포치 아래 대기와 정원문 바깥 대기를 각 연속 포장 owner에 통째로 속하게 하고 관리길의 앞뒤 두 구역도 같은 면 owner를 유지한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 front-walk 행의 ‘포치 아래 대기를 포함’, terrace 행의 정원문 바깥 대기 포함, site.ts 문단의 관리길 앞뒤 두 구역 단일 owner를 대조해 대기 구역의 포함 관계가 포장 면 하나에 묶임을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 모서리·단차 몸체는 07, 벽 상단은 roof/00, 층간 가장자리는 08, 지상 지지는 10이 배정해도 이 표의 면 소유는 바뀌지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 모서리·단차 몸체는 07, 벽 상단 접촉은 roof/00, 층간 가장자리는 08, 지지 하단은 10 링크로 받으면서 ‘위 표의 입면·지붕·방 표면 소유를 바꾸지 않는다’를 둬 같은 면이 두 번 소유되지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 표의 행 수를 면 개수로 쓰지 않고 현재 spaces part 측정과 후속 model 충전 면 census를 단계별로 구분한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 현재 spaces 골격의 part 측정과 후속 model 충전 면의 미구현을 본문에서 구분하며 표의 행 수를 전체 표면 수로 읽지 않는지 다시 확인했다.
@evidence settings/20-verification.md#surface-allocation 외피·층·지붕과 접합을 실제 source 파일 경계로 나누어 첫 저작에 넘긴다.
@evidenceReview settings/20-verification.md#surface-allocation #a6f76e5 surface-allocation의 외부 입면·층 바닥·천장·계단 구멍과 접합 owner 선언을 입면 네 행, floors/ground·upper, 차고 천장, stair 행과 07·08·10 접합 문단에 대조해 첫 저작 전 파일 경계가 정해졌음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work surface-allocation의 "여러 소유자의 독립 기준을 허용하지 않는다"를 계산 파일과 면 owner의 분리에 대조했고 공유 계산이 면을 소유하지 않아 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 surface-allocation의 동일 면 복제·독립 기준 금지를 ‘공유 계산은 경사면을 소유하는 두 번째 geometry가 아니다’와 `boundaries.ts`의 계산 한정에 대조해 settings 문장을 고치지 않고 배정이 성립함을 확인했다.
@evidence contracts/surface-ownership.md#whole-surface-owner 입면·지붕 경사면·포치·층 바탕·계단·포장·울타리 패널과 문기둥의 완결 면을 한 spaces source에 배정하고 대문 문짝·철물은 models/02에 넘긴다. building·junctions·openings·site 계산 파일은 표면을 소유하지 않는다.
@evidenceReview contracts/surface-ownership.md#whole-surface-owner #0e24f29 벽 void·reveal·울타리 패널과 문기둥은 spaces, 독립 창틀·문짝·외부 trim·대문 문짝과 철물은 models라는 표면 배정을 표와 인계 문단에 대조했다. 같은 물리 면의 복제는 허용하지 않는다.
-->

[표면 분해 인계](../settings/20-verification.md#surface-allocation)에 따라 [완결 표면 계약](../contracts/surface-ownership.md#whole-surface-owner)을 source 저작에 적용한다. 아래 표는 spaces의 벽·지붕·바탕 파일 책임을 배정한다. 담당 저작자는 모두 이 production의 단일 저작자다. 완결 면 하나를 통째로 넘기며 같은 면의 부재·반복·마감을 따로 넘기지 않는다. spaces의 골격 source와 part 측정은 존재하지만 후속 model 충전 부재는 아직 source가 없으므로 이 표를 전체 surface id·면 개수·누락/중복 census의 완료 선언으로 읽지 않는다.

| 완결 면 또는 공유 경계 | 소스 파일 owner | 책임과 접합 |
| --- | --- | --- |
| 전면 전체 입면 | `src/spaces/envelope/front.ts` | [본채 박공 삼각 벽·포치 접점·차고 정면](envelope/front.md#front-roof-closures). 거실/상층 창과 현관/차고문의 벽 void·reveal을 방/벽 binding에서 받되 닫힌 창호·문 충전은 models가 만든다. |
| 후면 전체 입면 | `src/spaces/envelope/rear.ts` | [본채 지붕 단차·차고 뒤 처마 아래의 후벽](envelope/rear.md#rear-roof-closures), 공용부 정원 출입과 상층 창의 벽 void·reveal. 닫힌 정원문·창호는 models가 만들며 테라스 때문에 벽을 숨기지 않는다. |
| 왼쪽 전체 입면 | `src/spaces/envelope/left.ts` | [주 지붕 삼각 벽](envelope/left.md#left-roof-closure)과 [벽난로/굴뚝 접면](envelope/left.md#chimney-roof-interface), 창 둘레. |
| 오른쪽 노출 입면 전체 | `src/spaces/envelope/right.ts` | [본채 지붕 단차·오른쪽 박공·차고 박공과 벽 접합](envelope/right.md#right-roof-closures). 가려진 공유 벽과 노출 면을 구별한다. |
| 본채/차고 공유 벽체 | `src/spaces/garage.ts` · `src/spaces/envelope/right.ts` | 한 X/Z 구조 기준에서 차고 지붕 윗면의 날씨선까지 문 있는 벽체는 garage가, 그 위의 바깥 사이딩 벽체는 right가 맡는다. 두 몸체는 그 날씨선에서 만나며 노출 도장 면이나 틈을 남기지 않는다. 두 실 안쪽 면의 owner는 각 실이다. |
| 주 지붕 전방 경사면과 하부 | `src/spaces/roof/main-front.ts` | 전면 박공과 합류하는 골짜기 경계를 공유 지붕 교차 계산에서 받는다. |
| 주 지붕 후방 경사면과 하부 | `src/spaces/roof/main-back.ts` | 주 용마루·후면 처마와 마감 경계를 소유한다. |
| 전면 왼쪽 박공의 왼쪽 경사면·하부 | `src/spaces/roof/front-gable-left.ts` | 삼각 전면 벽과 왼쪽 처마·주 지붕 합류선. |
| 전면 왼쪽 박공의 오른쪽 경사면·하부 | `src/spaces/roof/front-gable-right.ts` | 현관 쪽 골짜기·처마·용마루 접점. |
| 본채 오른쪽 낮은 박공 전방 면·하부 | `src/spaces/roof/right-front.ts` | 높은 주 지붕과 낮은 우측 지붕의 단차 경계. |
| 본채 오른쪽 낮은 박공 후방 면·하부 | `src/spaces/roof/right-back.ts` | 오른쪽 박공 삼각 벽과 후방 처마 접점. |
| 차고 지붕 전방 면·하부 | `src/spaces/roof/garage-front.ts` | 차고 정면과 본채 접합의 닫힌 경계. |
| 차고 지붕 후방 면·하부 | `src/spaces/roof/garage-back.ts` | 차고 후벽·본채 접면과 처마. |
| 낮은 포치 지붕·하부 | `src/spaces/porch.ts` | [보·기둥·받침](porch.md#porch-roof-columns)과 [바닥/현관 접근](porch.md#porch-platform-access)을 함께 소유한다. |
| 본채 1층 바닥 구조 바탕 | `src/spaces/floors/ground.ts` | [연속 바탕](10-ground-floor.md#main-ground-floor-base)과 [문 아래 지지](10-ground-floor.md#ground-threshold-junctions)를 받는다. 보이는 방 마감은 각 room, 전후면 외부 문턱판은 front/rear 입면 owner, 같은 높이 실내 문 아래 바닥 전환은 [07의 단일 방 owner](07-boundary-assembly.md#interior-boundary-junctions)가 맡고 층간 구조/1층 천장을 중복 생성하지 않는다. |
| 차고의 낮은 바닥 바탕 | `src/spaces/garage.ts` | [독립 차고 바탕](10-ground-floor.md#garage-ground-floor-base)과 전면문 아래 지지. 노출 콘크리트 상면은 garage-interior, 머드룸의 높은 문턱/챌면은 laundry owner다. |
| 본채 층간 구조와 2층 천장 바탕 | `src/spaces/floors/upper.ts` | [단일 층간 구조](08-floor-assembly.md#interstorey-floor-boundary)와 같은 계단 구멍·상부 도착. [최상부 천장 바탕](09-ceiling-assembly.md#upper-ceiling-closure)에는 층간 구멍을 복제하지 않는다. 보이는 바닥/천장 마감은 각 방 owner다. |
| 차고의 독립 천장 바탕 | `src/spaces/garage.ts` | [차고 천장](09-ceiling-assembly.md#garage-ceiling-closure)의 구조/벽 접점. 보이는 전체 천장 마감은 garage-interior owner다. |
| 단일 L형 계단과 보호 경계 | `src/spaces/stair.ts` | 두 flight·중간참·도착·난간의 동일 기준과 [계단실 위 높은 천장 마감](09-ceiling-assembly.md#upper-ceiling-closure). |
| 현관 보행길과 차도까지의 연결로 전체 | `src/spaces/site/front-walk.ts` | [T자 보행면](site/front-walk.md#front-walk-plan)은 포치 아래 대기를 포함한다. 포치는 그 대기를 요구하고 별도 바닥을 생성하지 않는다. |
| 차고 앞 차도 전체 | `src/spaces/site/driveway.ts` | [차도 상면](site/driveway.md#driveway-plan)은 차고 문턱과 전면 포장 끝을 연결하고 보행 연결로의 높이 입력을 제공한다. |
| 정원 테라스·외부 단·아래 대기 | `src/spaces/site/terrace.ts` | [테라스](site/terrace.md#garden-terrace-plan)는 정원문 바깥 대기를 포함하며 [단과 아래 대기](site/terrace.md#garden-steps-plan)를 통해 지표로 나간다. |
| 차도에서 테라스 아래까지의 측면 관리 보행면 전체 | `src/spaces/site/side-walk.ts` | [세 띠의 연속 보행면](site/side-walk.md#side-walk-plan)과 경사 접속·gate 양쪽 대기를 통째로 소유한다. |
| 목재 울타리 패널·가로 보·측면 문의 문기둥 | `src/spaces/site/fence.ts` | [건물 양끝에 닿는 전체 선](site/fence.md#fence-enclosure-plan)의 고정 울타리와 [문 개구부·잔여 패널](site/fence.md#fence-gate-junction), [지표 접촉](site/fence.md#fence-ground-profile)을 소유한다. 문짝·경첩·걸쇠는 [대문 모델 원형](../models/02-exterior-doors.md#side-yard-gate)이 만들고, gate의 void·회전·대기는 관리길 owner에서 소비한다. 실제 maps 포함·접합은 미완료다. |

`src/spaces/building.ts`는 외곽·공유 좌표의 조립 owner이고 완결 입면의 개별 부재를 거대 배열로 직접 저작하지 않는다. 지붕 합류선은 `src/spaces/roof/junctions.ts`에서 [단일 높이/교차 경계](roof/00-junctions.md#roof-shared-edges)를 산출하고 각 경사면 owner가 소비한다. 지붕면별 문서는 같은 이름의 `docs/spaces/roof` 파일에 있다. 공유 계산은 경사면을 소유하는 두 번째 geometry가 아니다. spaces 골격의 실제 측정은 source audit가 맡고, model 충전 뒤의 통합 surface census와 GPU 읽힘은 unverified다.

`src/spaces/openings.ts`의 [공통 개구부 인계](06-openings.md#external-opening-interface)는 좌표 형식과 부재 예약을 공유하는 계산 경계이며 창/문 geometry의 별도 소유자가 아니다. 각 입면 owner는 벽 몸체·자기 void·벽 절단면을 소유하고 방 안쪽 owner는 동일 void의 실내 reveal/마감을 맡는다. 별도 닫힌 부재인 바깥 trim·창틀·창대·문틀·문짝·유리는 [모델 충전 원형](../models/00-model-frame.md#model-representation-ceiling)이 소유하고 modelSources가 열린 뒤 생성한다. 같은 절단면을 trim으로 다시 덮거나 같은 trim을 입면과 model이 동시에 짓지 않는다. 문짝 유리·창 내부 분할까지 실제 관찰에서 숨기지 않는다.

일반 실내 칸막이의 공통 몸체는 [공유 경계 배정](07-boundary-assembly.md#interior-boundary-ownership)의 단일 source owner가 생성하고 양쪽 room은 자기 완결 마감을 유지한다. `src/spaces/boundaries.ts`는 [교차부·개구부·문턱](07-boundary-assembly.md#interior-boundary-junctions)의 같은 경계를 전달하는 계산 책임만 가지며 별도 벽/마감을 만들지 않는다. 차고 공유 벽은 위 표의 높이별 두 owner를, 계단 구조는 기존 stair owner를 따른다.

[외벽 모서리와 지붕 단차 접합](07-boundary-assembly.md#exterior-boundary-junctions)은 앞뒤 입면/공유 벽이 받는 단일 구조 몸체와 각 완결 입면의 마감을 구별한다. [벽 상단의 지붕 접촉](roof/00-junctions.md#roof-wall-head-junctions)은 지붕 교차 계산에서 받아 벽 두께 전체에 적용한다. 공유 계산이나 공통 몸체를 이유로 위 표의 입면·지붕·방 표면 소유를 바꾸지 않는다.

[층간 구조의 가장자리](08-floor-assembly.md#interstorey-edge-junctions)는 외벽의 두께 구역과 실내 벽 상하 접촉을 같은 경계로 잇는다. 계단 구멍의 몸체는 upper 층판 owner, 그 두께 단면의 보이는 연속 마감은 stair owner, 도착의 보이는 바닥은 upper-hall owner다. 같은 가장자리에 두 번째 층판이나 테두리 마감을 생성하지 않는다.

[지상층 바닥 아래 지지](10-ground-floor.md#ground-support-handoff)는 본채/차고 실내 바탕 아래와 외벽/공유 벽의 기단 구역을 구별한다. 기단의 노출 수직 마감은 기존 완결 입면 owner가 통합하며 바닥 owner가 별도 외장 띠를 덧씌우지 않는다. 실제 지표·지지 하단·기초와 접촉 census는 아직 미완료다.

`src/spaces/site.ts`는 [외부 구역/접속의 조립](site/00-access.md#site-access-interface)만 맡는다. 종전의 포장 전체 한 파일 예약을 소스 저작 전에 완결 보행면·차도·테라스로 구체화했다. 포치 아래 대기와 정원문 바깥 대기는 각 연속 포장 owner에게 통째로 속하며 별도 판으로 쪼개지지 않는다. 측면 관리길은 앞뒤 두 구역이어도 같은 연속 면 owner를 유지한다. 목재 울타리의 고정 패널·문기둥과 models의 독립 문짝은 서로 다른 닫힌 표면이며, [퇴역과 후속 생성 시점](../models/02-exterior-doors.md#side-yard-gate)을 명시한 인계에서만 갈라진다. 대지 경계·보도/도로·지표·식재의 소유 분해와 울타리의 실제 필지 포함·지표 접합은 maps가 아직 없어 미완료다. 이 표를 전체 대지 표면 census 완료로 읽지 않는다.

[외부 포장 바탕](site/01-paving-support.md#paving-depth-reservation)과 [높은 평탄면 지지](site/01-paving-support.md#raised-platform-support)도 위의 각 완결 포장/porch 파일이 함께 소유한다. site 조립 파일은 별도 바탕이나 지지 상자를 만들지 않는다. [차도/보행길 접촉과 문기둥 접합](site/01-paving-support.md#paving-contact-handoff)은 원래 owner의 동일 끝선에서 닫고 실제 지지 하단/지표는 후속 입력을 기다린다.

## 방 내부의 완결 면 소유 {#interior-surface-handoff}
<!--
@evidence principles/core/common.md#scope-preservation 실내 공간 책임마다 안쪽 벽·천장·바닥·개구부 둘레를 방 파일에 배정하고 옷방·린넨장·외투장의 분류를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 표가 현관부터 욕조 욕실까지 방마다 `src/spaces/rooms/` 파일을 두고 첫 문단이 안쪽 벽·천장·바닥 마감 구역과 개구부 둘레를 그 owner에 묶으며, 마지막 문단이 옷방·린넨장·외투장을 분류함을 확인했다.
@evidence principles/core/common.md#substantive-completion 방마다 src/spaces/rooms 아래 한 파일을 완결 내부 owner로 정하고 사람이 들어가는 옷방은 자기 파일로 분리한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 방마다 `src/spaces/rooms/<방>.ts` 하나를 완결 내부 owner로 정하고 주침실에서 들어가는 옷방을 `wardrobe.ts`로 분리해 source가 방 파일 경계를 다시 나눌 결정을 남기지 않음을 확인했다.
@evidence principles/core/common.md#declared-basis 방별 경계·문·창·storey binding은 동선 인계의 방 owner와 대조한다. 방별 spaces 골격 source는 있으나 model 충전이 없어 방 전체 면 census는 unverified라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 마지막 문단의 동선·수납 링크, 현재 spaces 골격 source의 존재, 아직 없는 model 충전과 전체 면 census unverified를 대조했다. 표 행 수를 실제 방 면 개수로 쓰지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation storage 설정의 "사람이 들어가는 수납실을 공간으로 저작하면 다른 방과 같은 전체 관찰을 부담한다"를 옷방은 방, 린넨장·외투장은 소비 방의 접면이라는 분류로 적용한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 storage 설정은 사람이 들어가는 수납실의 관찰 부담만 정했는데, 이 H2는 옷방을 자기 파일의 방으로, 린넨장은 upper-hall, 외투장은 entry의 접면으로 분류하는 결정을 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology 린넨장은 upper-hall, 외투장은 entry의 접면으로 두고 수납 이름으로 방의 질문을 없애지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 ‘상층 복도와 린넨 수납 접면’·‘실내 현관과 외투 수납 접면’ 행과 ‘이 분류로 실제 방의 질문을 줄이지 않는다’를 대조해 얕은 수납의 포함 관계가 소비 방 안에 명시됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 구조 벽과 층판은 외곽/공유 기준을 소비하고 문·창 void는 경계 owner가 한 번 절단한다. 방 owner는 안쪽 벽·바닥·reveal 마감 면을 만들며 별도 닫힌 문짝·창호·벽 걸레받이는 models가 만들어 같은 접면에 맞춘다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본문의 방별 설명은 안쪽 벽·바닥·reveal 면을 방 source에 두고 문짝·창호·걸레받이의 닫힌 부재를 각 models/03·01·06에 둔다. 방 source가 그 판을 복제하지 않고 두 모델이 받은 void와 벽·바닥 접선을 각각 맞추도록 한 문장을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 방별 경계·문·창·storey binding을 05와 대조하고 표의 행 수를 방의 면 개수로 쓰지 않게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 ‘방의 면 개수를 표의 행 수로 대체하지 않는다’와 방별 binding을 05의 방 owner와 대조하라는 문장이 동선 표 교차 대조와 source 이후 census를 이 배정의 반증 검사로 지목함을 확인했다.
@evidence settings/10-house.md#storage 사람이 들어가는 옷방은 자기 파일·전체 관찰을 가지며 얕은 장은 소비 방에 속한다.
@evidenceReview settings/10-house.md#storage #cc3fdd3 storage의 ‘사람이 들어가는 수납실은 다른 방과 같은 전체 관찰’을 옷방의 자기 파일·전체 관찰 추가에, ‘붙박이장이라는 이름으로 질문을 없애지 않는다’를 린넨장·외투장 접면 분류에 대조했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work storage의 사람이 들어가는 수납실 조건과 surface-allocation의 "각 방 내부의 완결 면" 배정을 대조했고 옷방·린넨장·외투장을 구별해 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 storage의 사람이 들어가는 수납실 조건과 surface-allocation의 방 내부 완결 면 배정을 옷방·린넨장·외투장 세 분류에 대조해 settings 문장을 고치지 않고 방 파일 배정이 닫힘을 확인했다.
@evidence contracts/surface-ownership.md#whole-surface-owner 각 방의 안쪽 벽·천장·바닥·reveal을 그 방의 한 room 파일에 배정하고 사람이 들어가는 옷방은 자기 파일로, 린넨장·외투장은 소비하는 방의 접면으로 구분한다.
@evidenceReview contracts/surface-ownership.md#whole-surface-owner #0e24f29 계약의 방별 소유자·파일 선언과 한 표면 비분할을 ‘모든 안쪽 벽·천장·바닥 마감 구역과 개구부 둘레를 한 저작자가 통합’과 방별 room 파일 표에 대조하고 옷방의 별도 파일도 확인했다.
-->

[표면 분해 인계](../settings/20-verification.md#surface-allocation)가 요구한 각 방 내부의 완결 면에 대해, 아래 owner는 각 방의 모든 안쪽 벽·천장·바닥 마감 구역과 개구부 둘레를 한 저작자가 통합할 책임을 가진다. 구조 벽과 층판은 외곽/공유 기준을 소비하며 외피와 별도 방 좌표를 발명하지 않는다. 문·창의 실제 void는 경계 owner가 한 번 절단한다. 아래 방 면 owner는 자기 reveal·마감 면과 [실내 문 원형](../models/03-interior-doors.md#interior-door-members)·[창 원형](../models/01-windows.md#window-member-sizes)의 부재가 동일 void와 접면에 맞는지 검사하고 문짝·창호 메시를 만들지 않는다. 마른 실과 세탁실의 벽·바닥 접선에는 [별도 닫힌 걸레받이 판](../models/06-interior-trim.md#wall-baseboard)이 붙으며 방 owner는 벽·바닥 마감 면만 만들고 그 판의 길이 입력과 종단 접면을 제공한다. 차고와 욕실 타일 벽에는 그 판을 배치하지 않는다. 모든 담당은 같은 단일 저작자다.

| 공간 책임 | 소스 파일 owner |
| --- | --- |
| 실내 현관과 외투 수납 접면 | `src/spaces/rooms/entry.ts` |
| 전면 거실과 벽난로 안쪽 접면 | `src/spaces/rooms/living.ts` |
| 후면 주방·식당·가족실 전체 | `src/spaces/rooms/common.ts` |
| 서비스 접근 통로 | `src/spaces/rooms/service.ts` |
| 팬트리 | `src/spaces/rooms/pantry.ts` |
| 파우더룸 | `src/spaces/rooms/powder.ts` |
| 세탁·머드룸 | `src/spaces/rooms/laundry.ts` |
| 빈 차고 내부 | `src/spaces/rooms/garage-interior.ts` |
| 상층 복도와 린넨 수납 접면 | `src/spaces/rooms/upper-hall.ts` |
| 주침실 | `src/spaces/rooms/primary.ts` |
| 주침실에서 들어가는 별도 옷방 | `src/spaces/rooms/wardrobe.ts` |
| 올리브 침구의 작은 침실과 자기 수납 | `src/spaces/rooms/bedroom-two.ts` |
| 청회색 침구의 작은 침실과 자기 수납 | `src/spaces/rooms/bedroom-three.ts` |
| 유리 부스 샤워 욕실 | `src/spaces/rooms/shower-bath.ts` |
| 욕조 욕실 | `src/spaces/rooms/tub-bath.ts` |

[별도 옷방](rooms/wardrobe.md#primary-wardrobe-plan)은 사람이 들어가는 공간으로 채택했으므로 [수납](../settings/10-house.md#storage)의 조건대로 자기 파일·전체 관찰을 추가했다. 얕은 [복도 린넨장](rooms/upper-hall.md#upper-linen-storage)과 [현관 외투장](rooms/entry.md#entry-coat-storage)은 소비하는 방의 접면이다. 이 분류로 실제 방의 질문을 줄이지 않는다. 방별 경계·문·창·storey binding은 [동선 인계](05-route-network.md#room-route-network)의 방 owner와 대조한다. 방의 면 개수를 표의 행 수로 대체하지 않는다. 표의 spaces 방 골격 source는 현재 존재하지만 model 충전 부재는 아직 생성되지 않았으므로 방 전체 면 census는 unverified다. 이 문서만으로 model 충전 뒤의 표면 검사를 완료했다고 주장하지 않는다.
