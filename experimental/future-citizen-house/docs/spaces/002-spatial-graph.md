# 1단계 공간 그래프 수정안

## 매스와 층 {#mass-and-storeys}

<!--
@evidence principles/core/common.md#declared-basis settings의 metre·Y-up·본채 규모를 따르고 벽 두께, 바닥·천장·지붕 높이는 이 설계의 입력이라고 구분했다. reference에서 치수를 역산했다거나 기존 source가 새 값을 구현했다고 말하지 않는다.
@evidence principles/core/common.md#scope-preservation 한 직사각형의 두 층이라는 규모를 유지하며 내부 높이와 구조대까지 배정했다. 약 250㎡라는 목표를 맞추기 위해 누락 공간을 숨기거나 gross와 유효 면적을 같은 값으로 취급하지 않는다.
@evidence principles/core/common.md#substantive-completion 외측과 내측 범위, 두 finished floor, 두 ceiling, roof top과 내외벽 두께가 확정되어 room·portal·계단이 같은 datum을 소비할 수 있다. 구조 인증과 새 면적 계측은 이 설계값과 구분해 미검증으로 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 좌표 관례와 대략 규모에 층간 높이·구조대·실내 clear face를 더했다. 이를 통해 source가 벽 안팎과 상층 도착 높이를 처음 결정할 필요가 없어졌다.
@evidence principles/design/spaces.md#space-topology 이 datum은 외주 안의 두 층과 그 사이 구조대의 관계를 정하며 room 구획은 아래 층별 owner가 소비한다. 별도 체적을 추가해 내부 높이를 확보하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 외곽·층선·두께는 mass-and-storeys의 단일 입력이고 각 방·opening이 그 값을 참조한다. gross 목표를 이유로 다른 파일이 별도의 층 높이나 외벽 내측을 소유하지 않는다.
@evidence principles/design/spaces.md#space-verification-address gross, 구멍을 뺀 층 바닥, 내측 유효 면적을 구분해 새 산출물에서 읽도록 했다. room containment와 계단·창호 head의 datum 일치는 연결된 전수 검증으로 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work settings/003의 좌표와 11×12m 두 층, settings/001의 약 250㎡ 목표를 실제 두 층 외곽 및 구조대로 대조했다. 목표가 정확한 net 면적을 명령하지 않으므로 264㎡ gross를 정직하게 구분하는 것으로 충분했고 settings나 map 경계를 바꿀 필요가 없었다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 하나의 직사각형과 두 floor datum을 유지하고 별동·캔틸레버나 거실 보이드로 면적·높이를 맞추지 않는다. 정확한 새 유효 면적은 검증 결과로 남긴다.
@evidence settings/003-spatial-basis.md#coordinate-datum 동일한 metre·Y-up 좌표에서 명시한 외곽과 두 층 높이를 저작하고 내부 clear face를 벽 두께에서 파생한다. 축 관례를 reference 화면의 좌우와 혼동하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 좌표와 목표 규모는 settings의 기준을 따르고 외벽 0.24m·내벽 0.18m 및 층 높이는 저작 결정으로 밝힌다. 현재 source가 이 값을 구현하지 않았다는 상태도 명시하여 reference 측량값이나 완료된 산출물에서 얻은 사실로 바꾸지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 직사각형 본채의 두 층을 유지하면서 실내 높이와 층간 구조대까지 남긴다. 외곽 합계 264㎡를 목표 약 250㎡와 구분하므로 요구 공간을 삭제하거나 gross를 유효 면적처럼 읽어 규모를 맞췄다고 할 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 외곽에서 벽 두께를 뺀 clear face와 1층·2층 바닥, 각 천장 및 지붕 상단이 모두 지정되어 있다. 방과 계단·창호가 사용할 높이와 벽 안팎을 다음 구현자가 처음 선택해야 하는 상태가 아니다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 m·Y-up 관례와 약 11×12m 두 층이라는 요구에 중심 기준 외곽, 내측 경계, 0.30m 구조대와 실내 높이를 더했다. 목표 규모를 되풀이하는 데서 끝나지 않고 연결 부재가 공유할 단면 기준을 이 공간 단위가 정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 하나의 외곽과 그 안쪽 clear 범위에 두 floor·ceiling 관계를 배치하고 그 사이를 구조대로 구분한다. 높이를 확보하는 별도 체적이나 추가 층을 사용하지 않아 방 분할이 따를 기본 포함 구조를 수치에서 읽을 수 있다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 이 H2가 외곽·내외벽 두께·층 datum의 원본이고 방과 계단 및 외피는 그 입력을 소비한다. 각 room의 clear 높이나 다른 입면의 층선이 별도 치수 원본으로 생겨도 된다는 예외를 두지 않았다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 외곽 합계, 층간 구멍을 뺀 바닥, 내측 유효 면적을 새 산출물에서 구분하도록 해 서로 다른 면적을 같은 값으로 보고하는 반례를 드러낸다. 공유 datum의 containment·slab·창호 대응은 전수 검증의 질문과 함께 읽히며 실제 결과는 아직 unverified다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 좌표 기준의 11×12m 두 층과 약 250㎡ 목표를 외곽·구조대에 대조했으며 부모는 정확한 net 250㎡를 요구하지 않는다. 264㎡ gross와 미측정 유효 면적을 분리하면 이 단계에서 부모 규모를 고치거나 별도 map 경계를 요구할 모순은 없다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 고정된 한 직사각형의 외곽 안에 두 floor datum을 두며 면적을 채우기 위한 별동이나 높이를 늘리는 별도 보이드를 설계하지 않는다. 방 연결과 실제 유효 면적까지 이미 통과했다는 주장은 이 매스 결정에 포함하지 않는다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum #8a862c9 1층 y=0을 그대로 쓰고 같은 축에서 외곽과 내측 clear face 및 2층 y=3.20을 저작한다. 좌표 관례가 준 역할 안에서 정확한 공간 치수를 정하며, 제작 수치와 실제 건축물 측량을 혼동하지 않는다.
-->

**상태: review 선언을 유지한 제자리 재작성. 현재 수정안의 컴파일 결과와 독립 판정 전이다.** [좌표 기준](../settings/003-spatial-basis.md#coordinate-datum)을 따른다. 이 문서의 치수는 reference 픽셀의 역산값이 아닌 저작 결정이다. 고정 그래프의 노드와 연결 의미를 유지하면서 기존의 무소유 틈, 벽 관통, 계단 막힘을 제거하기 위한 입력이다. 현재 source는 이 값을 plan과 완결 표면 owner로 구현한다. 새 환경의 runtime 소비 결과와 GPU 관찰은 아직 미지급이다.

본채 외곽 x=-5.50..5.50, z=-6.00..6.00을 유지한다. 외벽 0.24m의 기준 내측은 x=-5.26..5.26, z=-5.76..5.76이다. 1층 바닥 y=0, 2층 바닥 y=3.20, 각 층 천장 y=2.90/6.10, 지붕 구조 상단 y=6.40으로 정한다. 내벽 두께는 0.18m다. 0.30m의 층간 구조대와 2.90m의 실내 높이는 계단과 창호 head가 함께 닿는 저작 입력이며 구조 안전 인증값이 아니다.

외곽 기준 두 층 합계는 264㎡다. “약 250㎡”는 제작 목표의 규모이며 264㎡에서 벽과 계단을 빼면 정확히 250㎡라는 기존 문장을 사용하지 않는다. gross, 층간 구멍을 뺀 바닥, 내측 유효 면적을 새 산출물에서 별도로 측정한다. 현재 새 면적 결과는 unverified다.

## 1층 {#ground-level}

<!--
@evidence settings/003-spatial-basis.md#surface-decomposition 1층 구조와 연속 바닥·천장을 층 owner 하나에 배정하고 개별 room이 그 최종 수평 면을 다시 만들지 못하게 한다. 이 책임은 실제 모듈 존재나 surface 검증 완료를 뜻하지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #0076c6d 1층의 노출 바닥·천장과 구조 partition을 ground-storey의 책임으로 두고 room이 같은 수평 마감을 덧씌우지 못하게 한다. 이는 설정의 층별 단독 소유를 소비한 배정이며 실제 파일이나 마감면이 구현됐다는 판정은 아니다.
-->

<!--
@evidence principles/core/common.md#declared-basis 1층 높이는 mass-and-storeys, 방 구성은 ground-partition, 수평 마감의 단독 책임은 settings 표면 배정에서 받는다. 이 storey가 별도의 층고를 정하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 높이는 mass-and-storeys, 하위 구획은 ground-partition, 층간 통행은 single-stair에서 받는다. 수평 면의 책임도 표면 분해 설정에 연결되어 이 storey가 별도 층고나 마감 소유권을 만들어 내지 않는다.
@evidence principles/core/common.md#scope-preservation 1층의 다섯 방과 상층으로 가는 한 계단을 모두 포함하고, slab의 바닥·천장과 구조 partition까지 같은 층 책임으로 둔다. 방마다 덧바른 중복 수평 마감을 허용하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 현관·작업실·공용부·powder·수납을 같은 1층에 담고 상층으로 향하는 계단 연결을 유지한다. 방 목록만 등록한 뒤 실제 partition이나 연속 바닥·천장을 무소유로 남기는 축소를 허용하지 않는다.
@evidence principles/core/common.md#substantive-completion ground-storey의 house 귀속, 하위 방 population, 상층 연결 및 floor/ceiling의 생성 책임이 정해져 있다. source에서 층과 방 사이 소유 계층을 새로 만들어야 하는 공백이 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 ground-storey의 house 귀속과 하위 partition, 상층에 이르는 연결 및 수평 면 생성 책임이 명시되어 있다. source는 가구나 벽의 이름에서 1층의 부모와 자식을 추측해 조립할 필요가 없다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 datum과 1층 프로그램을 storey 하나의 자식 방·계단 관계 및 수평 표면 책임으로 모았다. 숫자 층고를 재포맷하는 대신 실현 주체의 포함 관계를 결정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 표면 분해의 층 책임을 ground-storey라는 실제 공간 주소에 붙이고 다섯 room과 single-stair를 그 층의 구조로 연결했다. 일반적인 1층 프로그램을 구현 가능한 storey의 포함 관계로 만드는 결정이 추가되어 있다.
@evidence principles/design/spaces.md#space-topology house 아래 ground-storey가 있고 ground-partition의 다섯 room이 그 안에 있으며 upper-storey에는 single-stair로만 간다. 바닥과 방의 계층을 가구 mesh 이름에서 추정하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 house의 자식인 ground-storey 안에 ground-partition의 방들이 있고 single-stair가 2층으로 이어진다. 실내 바닥·천장과 partition의 소속도 정해져 있어 논리 room과 이를 둘러쌀 층을 서로 다른 공간으로 오인하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 바닥·천장 수치는 datum의 단일 소유를 유지하고 방 cell은 해당 room에 남긴다. 층 owner의 수평 마감과 room owner의 벽 마감이 같은 시각 면을 동시에 소유하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 1층 높이는 datum을 참조하며 방의 cell은 각 room이 맡는다. storey는 연속 수평 면을 소유하고 방이 이를 다시 마감하지 못하므로 동일한 최종 면에 두 독립 작성 기준이 붙지 않는다.
@evidence principles/design/spaces.md#space-verification-address 전수 검증에서 room parent와 cell의 층 밖 돌출, partition 실체, slab 충돌을 확인하게 해 논리적 층 이름만 맞는 실패를 놓치지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 room parent 누락이나 cell의 층 밖 돌출, 실물 벽의 부재와 slab 충돌을 전수 검증에서 묻는다. ground-storey id만 맞고 방이 그 밖에 떠 있는 산출물은 이 검증 내용을 통과할 수 없다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 1층 직접 연결 그래프와 표면 분해의 층별 바닥·천장 책임을 다섯 room의 parent 배정에 대조했다. 같은 datum을 공유하는 storey로 담을 수 있어 별도 중간층이나 부모 소유 규칙 변경이 필요하지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 1층의 직접 연결과 층이 바닥·천장을 맡는 표면 규칙을 방들의 parent 배정에 대조했다. 공통 datum을 쓰는 한 storey 안에 그 역할을 둘 수 있어 중간층을 추가하거나 부모의 표면 소유를 바꿀 필요는 드러나지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 1층 room 전부가 ground-storey를 부모로 갖게 하고 상층 연결은 하나의 계단에 남긴다. 층 미귀속 방을 구조물 이름으로만 표현하는 구현은 이 배정에 실패한다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 1층의 모든 room을 ground-storey에 배정하고 상층 연결을 single-stair에 남긴다. 층 귀속이 없는 방이나 별도 계단으로 향하는 구조를 1층의 다른 표현으로 허용하지 않는다.
-->

storey id ground-storey는 house의 자식이며 [매스와 층 datum](#mass-and-storeys)의 1층 바닥·천장을 사용한다. [1층 분할](#ground-partition)의 다섯 방이 이 층에 속하고 [단일 계단](#single-stair)이 2층에 연결한다. slab의 실내 노출 바닥·천장과 구조 partition은 층 owner가 전부 소유한다. 방 owner는 같은 수평 마감을 덧씌우지 않는다. [전수 검증](#stage-one-verification)에서 room parent와 cell의 층 밖 돌출, 벽 실체, slab 충돌을 검사한다.

## 2층 {#upper-level}

<!--
@evidence settings/003-spatial-basis.md#surface-decomposition 상층 slab·계단 구멍 및 연속 수평 마감은 upper owner가 맡고 room은 내측 벽과 fit-out만 맡는 배정을 소비한다. roof의 실외 하부와 상층 실내 ceiling을 섞지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #0076c6d upper-storey가 연속 수평 마감과 구조 partition을 맡고 계단의 바닥 개구를 그 층에 통합한다. 실내 ceiling을 room이나 roof의 외부 하부 마감으로 중복 생성하는 대신 설정의 upper owner 책임을 유지한다.
-->

<!--
@evidence principles/core/common.md#declared-basis 상층의 floor와 ceiling은 공통 datum, 일곱 방은 upper-partition, 필요한 바닥 구멍은 stair-opening에서 읽는다. 새로운 보이드 위치를 층 owner의 편의로 선택하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 상층 높이는 mass-and-storeys, 방 population은 upper-partition, 유일하게 허용할 바닥 결손은 stair-opening을 참조한다. slab를 편하게 만들기 위해 새로운 구멍 범위를 이 층에서 고를 근거는 없다.
@evidence principles/core/common.md#scope-preservation 상층 일곱 room과 연속 수평 마감·partition을 모두 담고 단일 계단 구멍 이외의 바닥 결손을 금지한다. 복도와 작은 core를 상층 population에서 빠뜨리지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 복도와 침실뿐 아니라 욕실·수납·설비를 포함한 upper-partition 전체를 담고 나머지 상층 바닥을 연속해서 유지한다. 작은 서비스 공간을 빼거나 계단 이외의 면적을 보이드로 비워도 같은 상층이라고 할 수 없다.
@evidence principles/core/common.md#substantive-completion upper-storey의 부모·하위 구획·허용 opening과 구조/마감 책임이 결정되었다. source는 상층 slab를 통판으로 만들거나 임의로 더 비우는 선택을 하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 upper-storey의 집 안 귀속과 자식 구획, 바닥에서 제외할 정확한 opening owner 및 구조 책임이 정해져 있다. 상층을 통판으로 막을지 임의로 더 뚫을지를 source가 처음 결정해야 하는 미완성 slab 지시가 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 상층 사적 구역을 일곱 room의 공통 storey로 묶고 층간 계단 통과만 바닥 예외로 배정했다. 이는 방 프로그램 이름을 다시 나열하는 데 그치지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 상층 사적 프로그램을 upper-storey 아래의 room population으로 묶고 필수 계단 구멍만 수평 경계의 예외로 배정했다. 부모의 방 이름과 표면 담당을 재서술하는 데서 그치지 않고 한 층으로 조립할 공간 주소와 예외 관계를 제공한다.
@evidence principles/design/spaces.md#space-topology upper-storey는 house의 자식이고 일곱 방을 포함한다. 1층과의 실제 연결부가 stair-opening이며 다른 room의 내부를 빈 통과 체적으로 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 upper-storey는 house에 포함되고 upper-partition의 방들을 담으며 stair-opening을 통해 하층의 계단과 만난다. 그 개구 이외에는 바닥을 비우지 않아 다른 방 내부가 이름 없는 층간 통과 체적으로 바뀌지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 mass-and-storeys, 구멍 범위는 stair-opening의 소유다. 층은 그 입력으로 slab와 최종 수평 면을 만들고 방 owner가 같은 ceiling을 중복 생성하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 floor·ceiling 값과 계단 구멍 범위를 각각 datum과 stair-opening에서 소비한다. upper owner가 이 값의 사본을 다시 저작하거나 room이 상층 ceiling을 별도 최종 면으로 추가할 권한은 없다.
@evidence principles/design/spaces.md#space-verification-address 상층 room의 귀속과 불필요한 바닥 보이드, slab와 stair 도착을 전수 검증에 연결했다. 상층 평면만 예쁘게 보이면서 계단 통과가 막히는 반례를 따로 묻는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 room의 상층 귀속, 불필요한 보이드, slab와 stair의 접합을 서로 다른 실패로 전수 검증에 연결했다. 평면상 방들이 모두 있어도 계단 도착이 slab에 막힌 경우는 별도로 드러나게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층의 짧은 복도·직결 침실과 서비스 구역, 표면 소유 설정을 upper-storey 하나와 필수 계단 구멍에 대조했다. 추가 층이나 거실 보이드 없이 배정할 수 있어 부모 범위를 바꾸지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 짧은 일자 복도와 직접 면한 사적·서비스 구역, 층별 수평 표면 책임을 하나의 upper-storey와 필수 계단 개구에 대조했다. 상층을 구성하기 위해 추가 층이나 복층 거실을 허용하도록 부모를 수정할 모순은 확인되지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 모든 상층 room을 같은 storey에 귀속시키며 계단의 필수 통과만 바닥에 허용한다. 복층 거실이나 제2 계단을 새 연결로 만들지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 상층 room의 공통 storey를 정하고 single-stair에 필요한 바닥 통과만 허용한다. 별도의 복층 거실이나 제2 계단을 그 개구에 포함시키지 않으며, 실제 slab·계단 실현은 아직 검증할 대상이다.
-->

storey id upper-storey는 house의 자식이며 [매스와 층 datum](#mass-and-storeys)의 2층 바닥·천장을 사용한다. [2층 분할](#upper-partition)의 일곱 방이 이 층에 속한다. [계단의 필수 개구](#stair-opening) 외에는 바닥을 비우지 않는다. 연속 수평 마감과 구조 partition은 층 owner가 소유하며 [전수 검증](#stage-one-verification)에서 상층 room 귀속, 불필요한 보이드, slab과 stair 접합을 검사한다.

## 1층 분할과 직접 연결 {#ground-partition}

<!--
@evidence principles/core/common.md#declared-basis settings/003#ground-graph의 직접 연결을 다섯 명시 room과 그 사이 wall/opening 관계로 풀었다. room 경계는 각 cell owner, gap 두께는 공통 datum이 근거다.
@evidence principles/core/common.md#scope-preservation 현관·작업실·연속 공용부·powder·수납을 모두 포함하고 현관에서 계단과 공용부로 바로 닿게 한다. 벽 사이 빈 띠를 소유 없는 추가 복도로 사용하지 않는다.
@evidence principles/core/common.md#substantive-completion 1층 분할 population과 각 직접 연결의 행선지가 정해져 있다. 이 owner를 읽으면 powder를 통해 수납에 가는지 같은 생활 연결을 source가 다시 결정할 필요가 없다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 고정된 현관·작업실·후면 공용부 관계에 powder는 현관 직결, 수납은 공용부 직결이라는 core 접근과 cell 사이 shared wall 처리 결정을 더했다.
@evidence principles/design/spaces.md#space-topology 다섯 room이 ground-storey를 분할하고 전면 문은 entry로, entry는 작업실·powder·공용부·계단으로 이어진다. storage는 common-room에서 접근하는 닫힌 목적지다.
@evidence principles/design/spaces.md#space-boundary-authority 이 H2는 연결 그래프를 소유하며 clear cell 좌표는 각 room에, 벽 두께는 datum에 남긴다. 공유 gap을 두 방이 서로 다른 통로나 wall로 동시에 정의하지 않는다.
@evidence principles/design/spaces.md#space-verification-address actual boundary와 connector를 containment·도달성 검사로 읽게 하여 문 레코드만 있고 실물 벽을 관통하는 연결을 실패로 잡는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 고정 1층 그래프와 ground-program의 위생·수납 사용을 다섯 room과 연결 opening의 본문에 대조했다. 필요한 room을 하나의 storey에 담고 현관 직결 작업실 및 후면 공용부를 유지할 수 있어 부모의 생활 범위를 수정하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 현관에서 단일 계단·후면 공용부·전면 작업실로 이어지는 핵심 연결을 지키고 room gap에 분기 corridor를 발명하지 않는다. 실제 문·벽 검증은 별도로 열려 있다.
@evidence settings/003-spatial-basis.md#ground-graph 현관 직결 작업실과 공용부, 한 계단을 그대로 배치하고 우측 core의 목적지 접근을 명시한다. source에서 링크 순서를 바꾸어 필요한 방을 통과실로 만들 수 없다.
@evidence settings/002-household.md#ground-program 다섯 room에 현관·작업·공용 생활·위생·수납의 공간 자리를 배정하고 각 가구와 설비는 해당 room의 후속 실현이 소비하게 한다. 방 목록을 줄여 프로그램을 생략하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 현관 직결의 작업실·공용부·계단은 ground-graph를 소비하고 1층의 생활 기능은 ground-program에서 받는다. 각 room의 cell과 datum의 벽 두께를 참조해 이 분할의 연결 결정과 다른 단위의 수치 근거를 구별한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 현관·작업실·공용부·powder·수납을 모두 실제 room owner에 연결하고 요구된 현관의 직접 진입 관계를 유지한다. cell 사이의 빈 띠를 무소유 복도로 쓰거나 수납을 다른 방에 묻어 목록에서 지우는 분할을 허용하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 작업실과 powder는 현관에서, 수납은 공용부에서 직접 들어가도록 행선지를 확정했다. 구현자는 위생 공간을 거쳐 수납에 가는지와 같은 1층의 생활 연결을 다시 선택할 필요가 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모가 고정한 현관–작업실·공용부·계단 관계에 powder의 현관 직결과 수납의 공용부 직결을 더했다. cell 사이 gap을 shared wall로 취급하는 결정도 있어 고정 그래프를 단순히 다시 나열한 단위가 아니다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 전면 출입은 entry로 들어오고 그곳에서 작업실·powder·공용부·계단으로 나뉘며 storage는 common-room에 붙은 목적지다. 이 연결과 room 사이의 닫힌 경계를 구분하므로 인접하기만 한 방 사이에 통로를 추정하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 분할 H2는 각 연결의 행선지를 정하되 clear cell 좌표는 개별 room, gap의 두께는 mass-and-storeys에 둔다. 공유 틈을 두 방이 독립적으로 통로나 벽으로 저작하도록 방치하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 containment와 도달성 검사는 실제 boundary·connector를 읽어야 한다고 정한다. 문 id가 존재하지만 route가 실물 벽을 지나거나 cell에 도달하지 않는 경우를 논리 그래프의 연결만으로 통과시킬 수 없다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 고정 1층 그래프와 위생·수납 프로그램을 현재 다섯 room 및 연결 opening의 본문에 대조했다. 현관 직결 작업실과 후면 공용부를 유지한 채 core의 목적지를 배정할 수 있어 부모의 생활 범위나 연결 요구를 바꿀 모순은 드러나지 않았다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 현관에서 전면 작업실·후면 공용부와 단일 계단으로 바로 이어지는 중심 관계를 보존한다. shared gap을 추가 복도로 해석해 요구된 직접 연결을 우회하는 설계는 이 분할과 맞지 않으며 실제 문·벽 검사는 별도로 남아 있다.
@evidenceReview settings/003-spatial-basis.md#ground-graph #38b01ba 현관에 작업실·공용부·계단을 직접 연결하고 우측 core의 powder와 수납에 각각 목적지 출입을 배정한다. 부모가 요구한 통행을 방 이름의 순서나 임의 경유실로 대신하지 않는다.
@evidenceReview settings/002-household.md#ground-program #bf91ce4 현관·전면 작업·연속된 공용 생활과 위생·수납을 ground-storey의 실제 room 목록으로 나눈다. 가구와 설비는 이 방들 안에서 후속 실현되어야 하므로 공간 분할을 간단히 만들기 위해 프로그램에 해당하는 room을 빼지 않는다.
-->

[1층](#ground-level) 내부는 [현관](#entry), [작업실](#flex-workroom), [공용부](#common-room), [powder](#powder-utility), [수납](#storage-1f)의 다섯 room으로 분할한다. 각 room의 clear cell이 자기 경계를 소유한다. cell 사이 gap은 [벽 두께](#mass-and-storeys)를 가진 shared wall 하나이며 이름 없는 corridor로 쓰지 않는다.

[전면 문](#front-entry)을 통해 현관에 들어오면 [계단](#single-stair)과 [공용부 개구](#entry-common)에 바로 닿는다. 작업실과 powder는 현관에, 수납은 공용부에 직접 문이 있다. [설정의 1층 그래프](../settings/003-spatial-basis.md#ground-graph)를 변경하지 않는다. 실제 경계와 connector를 [전수 검증](#stage-one-verification)의 containment·도달성 검사에서 읽는다.

## 현관 {#entry}

<!--
@evidence settings/002-household.md#ground-program 도착·신발 수납·잠시 앉는 기능을 현관 안의 공간 조건으로 받아 계단과 직결 목적지를 함께 배정한다. 가구가 놓일 때 동측 보행대를 없애는 실현은 이 프로그램 관계를 충족하지 못한다.
@evidenceReview settings/002-household.md#ground-program #bf91ce4 신발 수납과 벤치 등이 쓰일 현관을 계단 및 직접 연결 목적지와 함께 같은 cell에 배정한다. 해당 물품의 실제 배치를 승인한 것은 아니며 fit-out이 계단 동측 보행대를 없애면 이 현관 프로그램의 공간 조건을 잃는다.
-->

<!--
@evidence principles/core/common.md#declared-basis ground-storey와 ground-program을 상속하고 현관의 clear cell 및 계단 동측 보행대를 여기서 정했다. 층 높이와 연결문의 유효 치수는 각 owner를 따른다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb ground-storey의 높이와 ground-program의 도착 기능을 받아 현관의 x/z cell과 계단 동측 보행대를 결정한다. 출입문의 치수와 host는 개별 opening owner가 정하므로 현관 범위를 근거 없이 문 크기에서 역산하지 않는다.
@evidence principles/core/common.md#scope-preservation 전면 도착, 작업실·powder·공용부·계단의 다섯 방향 관계를 현관 안에 수용한다. 계단을 둔 뒤 남는 통행을 이름 없는 외부 gap으로 밀어내지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 전면에서 도착한 뒤 작업실·powder·공용부·계단에 닿는 관계를 현관 cell 안에 남긴다. 계단을 배치한 뒤 통행만 방 밖의 이름 없는 틈으로 보내는 방식으로 현관의 분배 역할을 생략하지 않는다.
@evidence principles/core/common.md#substantive-completion entry의 parent, 수평 clear 범위, 직접 연결과 계단 옆 보행대가 결정돼 있다. 현관이 문 이름만 있고 실제 차지할 공간이 없는 상태를 해소한 설계다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 entry의 parent와 clear cell, 계단 옆 보행대, 직접 연결할 네 opening이 지정되어 있다. 현관이라는 문 이름만 남긴 상태와 달리 계단 및 방 출입이 함께 놓일 실내 영역을 source가 읽을 수 있다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 도착·생활 분배 역할에 현관 cell과 동측 보행대를 추가해 계단과 직결 room들이 공유할 물리적 위치를 결정했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 도착·수납·잠시 앉는 기능과 생활 구역으로의 연결에 현관의 수평 경계 및 계단 동측 보행대를 더했다. 이 부가 결정은 가구 프로그램의 설명을 넘어 계단과 목적지 출입이 공유할 공간을 정한다.
@evidence principles/design/spaces.md#space-topology entry는 ground-storey 안에 있고 외부 문에서 들어와 named opening들 및 single-stair로 연결된다. 이 방 자체를 또 다른 corridor와 중복 정의하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 entry는 ground-storey 안에 있으며 front-entry로 외부와, 세 내부 portal로 작업실·공용부·powder와 연결된다. 같은 방 안에서 단일 계단에 닿으며 현관을 별도 분기 corridor로 다시 정의하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 현관의 x/z clear cell은 entry가 소유하고 y는 층에 둔다. 연결의 host·cut·clear 치수는 front-entry와 세 내부 portal을 소비하므로 방이 문 위치의 두 번째 owner가 되지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 entry는 수평 clear cell을 소유하고 y 범위는 ground-storey를 따른다. front-entry·entry-flex·entry-common·entry-powder의 host와 opening 치수는 각각의 주소로 넘겨 방 배치가 문 위치의 두 번째 원본이 되지 않게 한다.
@evidence principles/design/spaces.md#space-verification-address containment와 실제 외주 wall, 각 threshold 및 방 안 관찰을 전수 검증에 연결한다. 계단을 놓고 보행대가 사라지는 경우를 room label의 존재로 통과시키지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 cell 포함과 실물 외주 경계, 직접 연결 threshold 및 방 안 관찰을 전수 검증에 연결한다. 계단이나 가구가 동측 보행대를 지워도 entry label만 남아 있으면 된다는 통과 조건이 아니다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 현관의 신발장·벤치 및 공용부·작업실 직결 프로그램을 계단과 동측 보행대가 있는 cell에 대조했다. 대지에서 한 문으로 들어오는 설정을 유지할 수 있어 새 홀이나 부모 그래프 수정을 요구하지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 신발 수납·벤치가 있는 도착 기능과 작업실·공용부의 직접 연결을 계단 및 동측 보행대를 둔 현관 cell에 대조했다. 한 전면 문에서 이 역할을 분배하는 설계를 만들 수 있어 추가 홀이나 부모 그래프의 변경을 요구할 이유는 현재 드러나지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 현관을 단일 계단·후면 공용부·전면 작업실의 공통 직접 접속 공간으로 배정하고 ground-storey에 귀속시킨다. 새 방이나 분기 복도로 연결을 우회하지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 현관을 ground-storey에 귀속시키고 전면 작업실·후면 공용부·단일 계단이 공유하는 직접 접속 공간으로 둔다. 다른 방이나 새 corridor를 경유해 이 연결을 충족한 것으로 바꾸지 않는다.
-->

room id는 entry, parent는 [ground-storey](#ground-level)다. clear cell의 x=-2.84..2.84, z=-5.76..-0.32m를 이 방이 소유하고 y 범위는 층 owner를 따른다. 현관은 전면 출입구, 작업실, powder, 후면 공용부와 단일 계단을 직접 잇는다. 계단 동측의 x=1.58..2.84 보행대를 방 안에 남긴다. [생활 프로그램](../settings/002-household.md#ground-program)을 소비한다.

직접 연결은 [front-entry](#front-entry), [entry-flex](#entry-flex), [entry-common](#entry-common), [entry-powder](#entry-powder)가 소유한다. 방 외주에서만 shared wall을 도출하고 내부 seam이나 문 구멍을 막지 않는다. 이 clear cell의 containment·인접 실물 경계·threshold와 방 안 관찰을 [전수 검증](#stage-one-verification)에서 대조한다.

## 가변 작업실 {#flex-workroom}

<!--
@evidence settings/002-household.md#design-subject-conditions 작업/손님 두 가구 상태를 같은 clear cell에 두고 열린 문·실물 가구와 지정 가상 원통의 통행을 함께 질문한다. 원통을 측정하지 못하면 배치 가능성을 성공 처리하지 않는다.
@evidenceReview settings/002-household.md#design-subject-conditions #741a9e2 두 가구 상태가 들어갈 cell에 지정된 통행 원통 조건을 직접 연결하고 배치 가능성은 실물 검사 전으로 남긴다. 문이나 가구의 점유를 빼고 빈 room의 크기만으로 원통 통행까지 성공했다고 할 수 없다.
-->

<!--
@evidence settings/002-household.md#ground-program 책상과 수납 및 추가 손님 기능을 전면의 현관 직결 작업실에 배정한다. 식당이나 상층 침실로 작업 기능을 옮겨 요구 room을 없애지 않는다.
@evidenceReview settings/002-household.md#ground-program #bf91ce4 현관에서 바로 들어가는 전면 room에 책상·수납의 작업 기능을 배정하고 ground-program이 연결한 가변 가구의 상태도 유지한다. 작업 기능을 식당이나 상층 침실로 보내 독립 작업실을 생략하는 실현과 구별된다.
-->

<!--
@evidence principles/core/common.md#declared-basis 1층 작업 프로그램과 작업/손님 상태를 받아 전면의 clear cell과 현관 단독 진입 관계를 정했다. 실제 가구 두 상태의 통행 성립은 아직 관찰 전이라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 작업 기능과 두 정지 상태는 설정에서, 높이는 ground-storey에서 받으며 이 단위는 전면의 cell과 현관 단독 진입을 정한다. 2.24m clear 폭에 실제 가구와 통행이 성립하는지는 아직 관찰하지 않은 결과로 구분한다.
@evidence principles/core/common.md#scope-preservation 작업실을 전면의 독립 room으로 두면서 현관 직결을 보존한다. 좁은 폭을 이유로 손님 상태나 검사 원통 조건을 생략하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 전면의 독립 작업실과 현관 직결을 남긴 채 작업·손님 두 상태 및 통행 조건을 함께 요구한다. 폭이 좁다는 이유로 침대를 없애거나 원통 검사를 납품 범위에서 제외할 수 없다.
@evidence principles/core/common.md#substantive-completion flex-workroom의 storey, cell, 유효 폭과 유일한 진입 portal이 확정됐다. 후속 fit-out은 이 방의 실제 범위 안에서 두 상태와 통행을 해결해야 하며 방 크기를 몰래 늘릴 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 flex-workroom의 storey·clear cell과 유일한 진입 portal이 정해져 후속 fit-out이 사용할 공간 범위가 닫혀 있다. 가구를 편히 놓기 위해 room 경계를 임의로 넓히거나 출입구를 새로 만드는 선택은 이 설계가 허용하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 가변 작업 기능을 전면 +X의 한 room과 현관 사이 관계로 배정하고 유효 폭을 명시했다. 책상·침대 상태의 이름만 반복하지 않고 그 상태가 들어갈 공간 제약을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정의 가변 작업 기능을 전면 +X의 구체 cell과 entry-flex의 관계로 바꾸고 clear 폭을 부여했다. 침대 상태를 재서술하는 대신 그 두 상태가 들어갈 위치와 유일한 접근을 공간 설계가 추가한다.
@evidence principles/design/spaces.md#space-topology 작업실은 ground-storey의 한 방이고 entry-flex를 통해 현관에서만 들어간다. 공용부와의 인접성을 추가 출입 route로 해석하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 flex-workroom은 ground-storey 안에 있으며 entry-flex를 통해 현관에서만 접근한다. common-room과 맞닿은 뒤쪽 면을 두 번째 출입으로 해석하지 않아 인접과 통행이 구분된다.
@evidence principles/design/spaces.md#space-boundary-authority 작업실의 수평 cell은 이 H2가, 높이는 ground-level이, pocket 문은 entry-flex가 소유한다. 외주에서 wall을 파생하므로 내부 경계 사본으로 가구 공간을 부풀리지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 작업실의 x/z 범위는 여기서 정하고 y는 층 owner, pocket 문의 위치·치수는 entry-flex에서 받는다. 가변 가구에 맞춰 내부에 다른 room 경계 사본을 만들거나 문 위치를 독립 수정할 근거는 없다.
@evidence principles/design/spaces.md#space-verification-address room containment·진입 threshold·인접 wall과 방 안 시야를 전수 검증에 연결하고 두 가구 상태의 통행은 실물 검사 전이라고 명시한다. 가구가 펼쳐질 때 막힌 길은 별도의 반례다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 cell과 실물 외주, 진입 threshold 및 방 안 시야는 전수 검증에 연결하고 두 가구 상태의 통행은 별도로 미검증임을 밝힌다. 침대가 펼쳐지면서 길이 막힌 경우를 닫힌 상태의 관찰로 통과 처리하지 못한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work ground-program의 전면 작업과 flex-states의 수직 수납/수평 수면 상태, 가상 원통 조건을 이 cell의 제약으로 채택했다. 현재 단계에서 부모 상태를 줄일 근거는 없으며 fit-out 성립을 검증했다고 가장하지 않는다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 전면 작업과 침대의 수납·수면 상태, 가상 원통을 같은 cell이 받아야 할 조건으로 대조했다. 현재 공간 관계를 정하는 데 상태나 검사 조건을 부모에서 삭제해야 할 모순은 발견되지 않았으며 가구가 실제로 들어맞는지는 이 제외의 검증 결과로 주장하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 현관 직결 전면 작업실을 1층 room으로 보존한다. 유리나 가변 가구를 보기 좋게 하려고 별동·중정 또는 공용부 경유 진입으로 그래프를 바꾸지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 작업실을 현관에 직접 면한 전면의 1층 room으로 유지한다. 유리나 펼친 가구를 잘 보이게 하려고 별동·중정을 만들거나 공용부를 거쳐 진입하도록 바꾸는 선택은 허용하지 않는다.
@evidence settings/002-household.md#flex-states 작업/손님 두 정지 상태 모두 같은 clear 폭 안에서 통행과 함께 성립해야 하는 공간 제약으로 받는다. 이 공간 배정은 아직 침대 geometry의 실현이나 성공적인 상태 전환을 주장하지 않는다.
@evidenceReview settings/002-household.md#flex-states #a162198 기본 작업 상태와 손님 수면 상태가 동일한 작업실 cell 안에서 통행과 함께 성립해야 한다고 받는다. 이 관계는 침대의 형상이나 상태 전환을 구현했다는 증거가 아니며 room의 공간 제약을 두 상태 모두에 남긴 결정이다.
-->

room id는 flex-workroom, parent는 [ground-storey](#ground-level)다. clear cell의 x=3.02..5.26, z=-5.76..-0.32m를 이 방이 소유하고 y 범위는 층 owner를 따른다. 현관에서만 직접 진입하는 전면 작업실이다. clear 폭 2.24m 안에서 설정의 작업/손님 두 상태와 [통행 원통](../settings/002-household.md#design-subject-conditions)을 수용해야 하며 가구 배치의 가능성은 실물 검사 전이다. [생활 프로그램](../settings/002-household.md#ground-program)을 소비한다.

직접 연결은 [entry-flex](#entry-flex)가 소유한다. 방 외주에서만 shared wall을 도출하고 내부 seam이나 문 구멍을 막지 않는다. 이 clear cell의 containment·인접 실물 경계·threshold와 방 안 관찰을 [전수 검증](#stage-one-verification)에서 대조한다.

## 후면 연속 공용부 {#common-room}

<!--
@evidence settings/002-household.md#ground-program 소파 생활·여섯 자리 식사·섬 주방을 벽 없이 이어지는 후면 한 room이 수용하게 한다. 수납 접근과 주방까지의 길을 식탁 점유 안에만 두지 않는다.
@evidenceReview settings/002-household.md#ground-program #bf91ce4 소파 생활·여섯 자리 식사·섬 주방을 후면의 한 연속 room에 배정하고 수납 및 주방 접근을 남긴다. 식탁의 점유를 통과해야만 이동할 수 있는 배치는 이 생활 프로그램을 수용한 공간으로 볼 수 없다.
-->

<!--
@evidence principles/core/common.md#declared-basis ground-program의 거실·식당·주방을 하나의 후면 room에 배정하고 cell 범위 및 현관·수납 연결을 이 설계에서 정했다. 높이는 1층 datum을 따른다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 거실·식당·주방의 기능은 ground-program에서 가져오고 그 기능을 담을 후면 clear cell과 현관·수납의 접속은 이 설계가 정한다. 높이는 1층 datum을 소비하여 공용부만 다른 층고를 발명하지 않는다.
@evidence principles/core/common.md#scope-preservation living·dining·kitchen을 벽 없이 이어진 전체로 보존하고 수납 접근까지 포함한다. 식탁을 건너야만 주방에 가는 배치로 생활 동선을 빠뜨리지 못하게 한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 living·dining·kitchen을 칸막이 없는 하나의 공용부로 유지하고 1층 수납의 출입까지 연결한다. 주방까지 가는 길을 식탁 안에만 남겨 이동 기능을 사실상 없애는 배치를 허용하지 않는다.
@evidence principles/core/common.md#substantive-completion 공용부의 clear cell, parent, 내부 연속성 및 두 접속 portal이 확정되어 있다. living·dining·kitchen을 세 개의 임의 room으로 재분할해야 하는 공백이 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 parent와 clear cell, 내부의 무벽 연속성 및 entry-common·common-storage가 확정되어 있다. 후속 source가 세 생활 기능을 각기 닫힌 방으로 나누어야만 내용을 채울 수 있는 미정 프로그램이 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 세 공용 기능을 후면 전체 폭의 한 공간과 현관/수납의 접근 관계로 구체화했다. furniture 배치가 받아야 할 연속 동선 제약도 추가한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 세 공용 기능에 본채 후면 전체 폭의 cell과 현관·수납의 두 접속을 부여했다. 특히 식탁을 통과하지 않는 주방 접근을 공간 제약으로 더하여 가구 목록의 반복에 머물지 않는다.
@evidence principles/design/spaces.md#space-topology common-room은 ground-storey 안의 연속 room이며 entry-common과 common-storage로 연결된다. living과 kitchen 사이에는 새 door나 닫힌 wall을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 common-room은 ground-storey의 한 방이고 entry-common과 common-storage를 통해 현관 및 수납에 닿는다. living과 kitchen 사이에 별도의 문이나 닫힌 경계를 넣지 않으므로 세 기능은 한 연속 실내로 남는다.
@evidence principles/design/spaces.md#space-boundary-authority 공용부 x/z cell은 여기서 소유하고 두 opening과 층 높이는 다른 지정 owner를 소비한다. 외부 glazing의 room span도 이 cell을 참조하게 하여 별도 후면 폭이 생기지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 공용부의 x/z clear cell은 이 H2가 소유하고 높이와 두 접속 opening은 지정된 다른 owner를 소비한다. 후면 glazing도 이 room span을 읽으므로 창을 넓히기 위한 별도의 공용부 폭을 입면에서 저작할 수 없다.
@evidence principles/design/spaces.md#space-verification-address 방 내부 시야와 threshold, wall/connector를 대조하고 주방까지의 통로가 가구를 통과하지 않는지 전수 검증에 남긴다. 후면 유리가 넓다는 사실만으로 공용부의 연속성을 승인하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 방 안 관찰과 threshold·실물 경계를 전수 검증에 연결하며 식탁을 관통하는 주방 접근은 본문에서 금지한다. 큰 후면 유리만 보이고 실제 연결이 가구에 막힌 결과를 공용부의 연속성 증거로 쓰지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work ground-program의 소파·식탁·섬 주방과 현관 직결 공용부 관계를 하나의 후면 clear cell에 배정했다. 세 기능 사이에 새 칸막이나 상위 생활 프로그램 변경이 필요하다는 모순은 드러나지 않았고 실제 가구 접근은 후속 검사에 남긴다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 소파·식탁·섬 주방과 현관 직결이라는 부모 조건을 하나의 후면 cell 및 수납 출입에 대조했다. 공간 관계상 세 기능 사이에 새 칸막이를 요구하는 모순은 없으며, 실제 가구의 접근 성립까지 이 문서 대조로 검증했다고 주장하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 후면 대부분을 거실·식당·주방의 연속 공간으로 남기고 현관에서 바로 들어오게 한다. 세 기능을 분리된 방이나 추가 복도로 바꾸지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 후면의 거실·식당·주방을 연속된 공용 공간으로 두고 현관에서 바로 들어오도록 한다. 각 기능을 단절된 room이나 추가 corridor로 나누는 것은 같은 고정 그래프의 실현으로 인정되지 않는다.
-->

room id는 common-room, parent는 [ground-storey](#ground-level)다. clear cell의 x=-5.26..5.26, z=-0.14..5.76m를 이 방이 소유하고 y 범위는 층 owner를 따른다. 거실·식당·주방을 벽 없이 이어지는 하나의 방으로 둔다. 현관과 1층 수납으로 직접 연결하며 식탁을 통과해야만 주방에 닿는 통로를 만들지 않는다. [생활 프로그램](../settings/002-household.md#ground-program)을 소비한다.

직접 연결은 [entry-common](#entry-common), [common-storage](#common-storage)가 소유한다. 방 외주에서만 shared wall을 도출하고 내부 seam이나 문 구멍을 막지 않는다. 이 clear cell의 containment·인접 실물 경계·threshold와 방 안 관찰을 [전수 검증](#stage-one-verification)에서 대조한다.

## 1층 powder {#powder-utility}

<!--
@evidence settings/003-spatial-basis.md#surface-decomposition powder의 세면대·변기·청소 수납과 문 안쪽 벽면을 방 owner가 맡는 배정을 이 독립 코어 cell에 연결한다. 지워진 세탁 기능은 상층 설비실에 남는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #0076c6d 표면 배정의 powder 행이 정한 세면대·변기·청소 수납과 방 내측 벽면을 독립 core cell이 수용하게 한다. 이 fixture 목록을 ground-program의 별도 미기재 항목으로 돌리지 않고 실제 배정 owner와 연결한다.
-->

<!--
@evidence settings/002-household.md#ground-program 1층 powder/utility room을 현관 직결 core room으로 배정한다. 상층 세탁 프로그램을 여기에도 넣는 별도 기능 확장은 하지 않는다.
@evidenceReview settings/002-household.md#ground-program #bf91ce4 우측 service core에 둔 powder/utility room을 현관에서 직접 들어가는 1층 목적지로 구체화한다. ground-program의 room 존재를 소비하는 관계이며 상층 세탁 기능까지 같은 방에 추가했다고 읽지 않는다.
-->

<!--
@evidence principles/core/common.md#declared-basis ground-program의 powder room과 surface-decomposition의 세면·변기·청소 수납을 전면 화면 우측의 cell에 담았다. 상층 설비실의 세탁기를 여기로 옮기는 새로운 프로그램은 만들지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb powder room의 존재는 ground-program, 구체 fixture 배정은 surface-decomposition에서 받으며 전면 화면 우측 cell은 이 공간 설계가 정한다. 위생·청소 물품의 근거와 room의 위치 선택을 한 부모가 모두 이미 정한 것으로 섞지 않는다.
@evidence principles/core/common.md#scope-preservation powder를 현관 직결의 독립 위생 공간으로 두고 세면·변기·청소 수납 접근을 남긴다. 다른 방으로 가는 통과실로 사용해 프라이버시나 필수 목적지의 접근을 없애지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 세면·변기·청소 수납에 접근할 독립 위생 공간과 현관 직결을 남긴다. 다른 방의 통과실로 사용하거나 core의 불투명 외벽 뒤에 공간 없이 이름만 두는 방식으로 powder의 목적을 축소하지 않는다.
@evidence principles/core/common.md#substantive-completion powder-utility의 parent와 x/z cell, 직접 진입문과 목적지가 결정됐다. 후속 설비 배치가 이 core의 외곽을 먼저 발명해야 하는 상태가 아니다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 powder-utility의 ground-storey 귀속, clear cell 및 entry-powder 진입이 지정되어 있다. 설비를 배치할 후속 단계가 위생 room의 위치와 외곽부터 새로 결정해야 하는 빈 프로그램이 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 위생 기능을 우측 불투명 코어 전면의 구체 room으로 배정하고 현관에서 들어오는 독립 목적지로 정했다. 추상적인 service core에 묻혀 있던 실내 경계를 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모가 정한 위생 room과 fixture에 우측 core 전면의 clear cell 및 현관 직결이라는 배치를 더했다. 추상적인 service core를 실제 독립 목적지로 나누는 공간 결정이 이 H2에 있다.
@evidence principles/design/spaces.md#space-topology powder는 ground-storey에 속하고 entry-powder 하나로 현관과 연결되며 수납 등 다른 방의 통과 경로가 아니다. 외주 shared wall이 이 닫힌 목적지를 만든다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 powder는 ground-storey에 속하며 entry-powder로만 현관에 연결되는 목적지다. 수납 등의 다른 방으로 통과하지 않도록 외주 경계를 유지하므로 위생 공간의 인접과 허용 출입이 구분된다.
@evidence principles/design/spaces.md#space-boundary-authority powder cell의 수평 경계는 이 방이, 수직 범위는 ground-level이 소유한다. 현관문 개구는 entry-powder를 소비하므로 설비 배치가 문을 임의 이동시키지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 powder의 수평 cell은 이 방이 정하고 수직 범위는 ground-level, 현관과의 opening은 entry-powder에서 받는다. 설비 배치가 독자적으로 문을 옮기거나 같은 core에 다른 방 깊이를 중복 저작할 수 없다.
@evidence principles/design/spaces.md#space-verification-address room의 층 귀속·실제 외주·threshold와 위생 설비 주변 접근이 전수 검증의 관찰 대상이다. 불투명 외벽 뒤에 room 이름만 두고 벽이나 접근이 없는 실패를 허용하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 층 귀속·실제 외주·진입 threshold와 방 안 관찰을 전수 검증에 연결하고 fixture 주변 접근을 방의 요구로 남겼다. 불투명 core 뒤의 논리 cell만 존재하고 실물 구획이나 접근이 빠진 결과는 이 질문들에서 실패한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work ground-program의 powder/utility room·우측 core와 surface-decomposition의 powder fixture 배정을 현관 직결 cell에 대조했다. 세탁은 upper-program의 설비실에 남겨 부모 프로그램을 중복 배정하지 않았고 새 상위 기능 수정은 필요하지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 ground-program의 powder/utility와 우측 core, surface-decomposition의 powder fixture를 현관 직결 cell에 대조했다. 이 위생 목적지에 상층의 세탁 역할을 중복 추가할 필요가 없으므로 부모의 생활 기능을 다시 배분해야 할 모순은 확인되지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 1층 위생 공간을 우측 불투명 코어와 ground-storey 안에 두고 실제 문으로 현관에 연결한다. core를 별동으로 빼거나 다른 방을 통과해야 하는 단절 목적지로 만들지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 1층 위생 room을 우측 불투명 core와 ground-storey 안에 두고 실제 현관 문 연결을 요구한다. core를 별동으로 빼거나 다른 방을 거쳐야 닿는 목적지로 만들어 고정된 본채 관계를 바꾸지 않는다.
-->

room id는 powder-utility, parent는 [ground-storey](#ground-level)다. clear cell의 x=-5.26..-3.02, z=-5.76..-2.24m를 이 방이 소유하고 y 범위는 층 owner를 따른다. 전면 화면 우측 불투명 코어의 현관 직결 위생 공간이다. 세면·변기·청소 수납 주변의 실제 접근 영역을 확보하고 다른 방의 통과실로 쓰지 않는다. [생활 프로그램](../settings/002-household.md#ground-program)을 소비한다.

직접 연결은 [entry-powder](#entry-powder)가 소유한다. 방 외주에서만 shared wall을 도출하고 내부 seam이나 문 구멍을 막지 않는다. 이 clear cell의 containment·인접 실물 경계·threshold와 방 안 관찰을 [전수 검증](#stage-one-verification)에서 대조한다.

## 1층 수납 {#storage-1f}

<!--
@evidence settings/002-household.md#ground-program 공용 생활에 필요한 수납을 공용부에서 직접 들어가는 1층 core 목적지로 둔다. 위생 공간을 통과해야만 수납에 닿는 관계로 바꾸지 않는다.
@evidenceReview settings/002-household.md#ground-program #bf91ce4 1층 storage를 공용부에서 직접 들어갈 수 있는 core의 목적지로 배정한다. 위생 공간을 지나야만 수납에 닿도록 하지 않아 부모가 남긴 수납 기능을 독립적으로 사용할 공간 관계를 제공한다.
-->

<!--
@evidence principles/core/common.md#declared-basis ground-program의 수납 기능을 같은 우측 core에 배정하고 공용부에서 진입하는 cell을 이 H2에서 정했다. 천장과 바닥은 1층 owner를 따른다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 수납의 존재는 ground-program에서 받고 같은 core 안에서 공용부에 면한 cell을 이 H2가 정한다. 바닥과 천장은 ground-level을 소비하므로 수납실만 별도 높이 기준을 갖지 않는다.
@evidence principles/core/common.md#scope-preservation 1층 수납을 별도 room과 직접 문으로 남기고 powder와의 닫힌 구획을 보존한다. 보이는 cabinet만 두고 수납실의 실제 공간을 생략하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 storage-1f를 room과 직접 문으로 유지하면서 powder와의 닫힌 구획을 남긴다. cabinet 하나만 놓고 독립 수납실의 공간이나 출입을 생략하는 실현은 이 배정을 충족하지 못한다.
@evidence principles/core/common.md#substantive-completion storage-1f의 parent·clear cell·공용부 진입·powder와 닫힌 경계가 결정됐다. 수납을 어느 생활 공간에 붙일지 후속 source가 다시 고르지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 parent·clear cell·common-storage 출입과 powder 쪽의 닫힌 이웃 관계가 결정되어 있다. source가 수납을 어느 생활 공간에 붙일지 선택해야 하거나 위생 room과 합쳐야만 배치할 수 있는 미정 단위가 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 요구한 수납을 core의 powder 뒤쪽 clear cell 및 공용부 직결 목적지로 구체화했다. 위생 공간을 경유하지 않는 접근과 서로 닫힌 이웃 관계를 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 1층 수납을 powder 뒤쪽 core cell에 위치시키고 공용부에서만 진입하도록 했다. 수납 기능의 이름에 그치지 않고 위생 공간과 분리된 목적지 및 실제 접근 관계를 추가한다.
@evidence principles/design/spaces.md#space-topology 수납은 ground-storey에 포함되고 common-storage를 통해 common-room과 연결된다. powder와 현관 쪽의 인접 면은 통로를 의미하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 ground-storey에 포함된 storage-1f는 common-storage를 통해 common-room과 연결된다. powder 및 entry 쪽의 맞닿은 면은 출입으로 취급하지 않아 가까이 놓인 방을 통과 경로로 오인하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority storage의 수평 clear cell만 이 방이 소유하며 y는 ground-level, 문은 common-storage를 소비한다. 공유 wall은 방 외주 사이에서 파생하므로 수납 깊이를 임의 중복 저작하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 수납의 x/z clear cell을 이 단위에 두고 y 범위와 출입구는 각각 ground-level과 common-storage를 참조한다. shared wall은 이 외주에서 파생되므로 별도 수납 깊이나 문 좌표를 이웃 owner가 다시 정할 이유가 없다.
@evidence principles/design/spaces.md#space-verification-address cell containment·실물 경계·공용부 threshold와 내부 시야를 전수 검증에서 함께 본다. logical 수납 cell만 있고 실제 칸막이가 빠진 상태를 별도로 반증할 수 있다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 cell 포함·실물 경계·공용부에서의 threshold 및 내부 시야를 함께 전수 검증에 연결했다. 논리상 수납실이 있어도 powder와의 칸막이가 빠지거나 실제 문이 없는 경우를 독립적인 실패로 드러낼 수 있다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 1층 공용 생활과 수납, 위생 공간의 독립 사용이라는 부모 조건을 공용부 문과 powder 사이 닫힌 벽에 대조했다. 다른 room을 통과하지 않는 배정이 가능해 부모 그래프를 수정하지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 1층 공용 생활의 수납과 위생 공간의 독립 사용을 common-storage 및 powder 쪽 닫힌 벽에 대조했다. 다른 room을 통과하지 않는 목적지 배정이 가능하므로 부모의 수납 기능이나 고정 그래프를 바꿀 모순은 현재 나타나지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 수납을 우측 core의 1층 room으로 귀속시키고 공용부와 실제 문으로 연결한다. core의 빈 영역을 무소유 통로로 두거나 연결 없는 방으로 남기지 않는다.
@evidenceReview contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements #d31488d 우측 core의 수납을 ground-storey에 귀속시키고 공용부와 실제 문으로 잇는다. 남은 core 영역을 무소유 통로로 처리하거나 어느 연결에도 닿지 않는 room으로 방치하지 않는다.
-->

room id는 storage-1f, parent는 [ground-storey](#ground-level)다. clear cell의 x=-5.26..-3.02, z=-2.06..-0.32m를 이 방이 소유하고 y 범위는 층 owner를 따른다. 같은 코어에서 공용부에 직접 문이 있는 수납실이다. powder와는 닫힌 경계를 공유한다. [생활 프로그램](../settings/002-household.md#ground-program)을 소비한다.

직접 연결은 [common-storage](#common-storage)가 소유한다. 방 외주에서만 shared wall을 도출하고 내부 seam이나 문 구멍을 막지 않는다. 이 clear cell의 containment·인접 실물 경계·threshold와 방 안 관찰을 [전수 검증](#stage-one-verification)에서 대조한다.

## 문틀과 개폐 점유 {#door-interface}

<!--
@evidence principles/core/common.md#declared-basis 일반 문은 inherited-defaults에서 받으며 frame 면 폭0.06m와 leaf 두께0.045m 및 열린 검사 상태는 이 설계의 채택값이다.
@evidence principles/core/common.md#scope-preservation 문짝·틀·손잡이와 열린 leaf의 장애물 점유를 남겨 연결을 사각 구멍 하나로 축소하지 않는다.
@evidence principles/core/common.md#substantive-completion clear opening에서 structural cut을 확장하는 방향, host 두께의 소비, hinged·pocket·leafless의 차이를 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 일반 문 canon에 frame과 leaf의 실제 점유 및 방 안쪽으로90° 여는 검사용 상태를 더한다.
@evidence principles/design/spaces.md#space-topology 문 상태는 연결의 통행 가능성을 바꾸므로 닫힌 문을 관통한 route와 열린 통행을 구별한다.
@evidence principles/design/spaces.md#space-boundary-authority 개별 opening이 유효 폭·높이를 소유하고 이 공통 인터페이스는 frame과 leaf를 그 값에서 파생한다.
@evidence principles/design/spaces.md#space-verification-address structural cut·jamb·leaf 및 swept 영역을 room cell과 가구에 대조하며 문 부재의 존재와 통과 가능성을 별도로 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 일반 문 canon과 operator-access의 허용 조작을 대조해 문 열림을 저작 검사 상태로 구분했다. 사용자 제어 범위를 넓힐 부모 수정은 필요하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 실제 문을 통해 방에 닿는 요구를 clear opening과 실물 부재 및 상태 기록으로 연결한다.
@evidence settings/002-household.md#inherited-defaults 일반 문을 두께 있는 틀과 leaf로 구체화하고 열린 문도 장애물로 남긴다. 순간 이동식 미래 장치로 대체하지 않는다.
-->

<!--
@evidence settings/004-observation.md#operator-access 문 열림은 저작자의 통행 검사 상태로 제한하고 운영자 선택 목록의 유리·침대 이외에 문 제어를 임의로 추가하지 않는다. 허용 조작 범위를 문 상태 검사와 구분하는 공간 결정으로 소비하며 UI 코드를 여기서 구현했다고 주장하지 않는다.
@evidenceReview settings/004-observation.md#operator-access #a2cf7d9 열린 문은 저작자의 통행 검사 상태로 사용하고 사용자의 유리·침대 선택에 문 제어를 임의로 더하지 않는다. closed/open 상태와 source를 검사마다 기록하는 결정이 허용 UI 조작과 저작 검사 입력을 구분하므로, 이 관계는 viewer 구현을 다른 설계 H2가 대신했다는 주장이 아니다.
-->

[일반 문의 채택](../settings/002-household.md#inherited-defaults)을 공간 개폐로 구체화한다. 방문과 현관문의 clear opening 바깥에는 면 폭0.06m의 jamb·head를 두고 leaf 두께는0.045m다. frame 깊이는 host wall 전체 두께를 소비한다. 문짝을 두께 없는 구멍으로 대신하지 않는다. clear width/height는 각 opening H2가 소유하고 structural cut은 양 jamb와 head만큼 확장한다.

hinged door는 해당 방 안쪽으로90° 열린 상태에서 통행을 검사한다. 현관문은 entry 안쪽, 방문은 복도 반대쪽 방 안쪽이며 개별 문 owner가 named room을 정한다. 작업실의 pocket door는 clear opening만큼 옆으로 미끄러져 벽 pocket에 들어간다. entry-common은 leaf 없는 개구다. 문짝과 hinge·handle은 같은 opening에서 파생하며 open-state leaf도 장애물에서 제외하지 않는다.

이 문 개폐는 저작자의 통행 검사 상태이며 [일반 문 canon](../settings/002-household.md#inherited-defaults)을 소비한다. viewer 사용자의 유리·침대 선택 목록에 문 제어를 임의로 추가하지 않는다. 저작 검사마다 closed/open 상태와 source를 기록한다. 닫힌 문을 관통하는 route를 열린 상태 통행으로 보고하지 않는다. [전수 검증](#stage-one-verification)은 모든 structural cut·jamb·leaf·open-state swept 영역과 방 cell/가구의 간섭을 검사한다. 구조·안전 인증은 아니다.

## 전면 현관 출입구 {#front-entry}

<!--
@evidence principles/core/common.md#declared-basis 전면 진입은 ground graph에서 받고 중심2.22m와 clear1.05×2.30m는 계단실 frame 충돌을 피하려는 저작 선택이다.
@evidence principles/core/common.md#scope-preservation 대지 landing에서 entry까지 실제 문짝을 가진 한 출입을 유지하며 외관용 가짜 현관을 두지 않는다.
@evidence principles/core/common.md#substantive-completion host face·중심·폭·높이·sill·양쪽 route 종점을 지정해 문 위치를 구현 단계의 재량으로 남기지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 현관으로 곧장 들어온다는 요구를 전면 boundary의 특정 clear opening과 landing 접속으로 바꾼다.
@evidence principles/design/spaces.md#space-topology from은 대지 landing이고 to는 entry이며 전면 외주가 그 사이의 실제 통과 경계다.
@evidence principles/design/spaces.md#space-boundary-authority 출입문이 clear 치수를 소유하고 sill은 ground-level, frame은 door-interface, host plane은 front-face에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 계단실 glazing과 frame 간격, landing 접지, route endpoint 포함 및 통행 원통 충돌을 이 개구의 반례로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면 단일 현관과 계단실 glazing 조건을 문 중심 후보에 대조해0.12m 이동으로 둘의 점유를 분리했다. 부모의 진입 그래프를 바꿀 필요는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 현관을 중앙 동선에 직접 연결하는 실제 외부 출입으로 배정하고 별도 포치 건물이나 두 번째 계단으로 우회하지 않는다.
@evidence settings/002-household.md#design-subject-conditions 문 유효 폭과 열린 leaf 주변 통과를 가상 원통 질문에 연결한다. 이 치수를 실제 인체·법규 인증으로 보고하지 않는다.
-->

[외부 대지](001-citizen-house.md#site-access) ↔ [entry](#entry)의 직접 연결 하나다. host wall은 [전면 boundary](003-surface-ownership.md#front-face)이고 폭 방향 중심은 x=2.22m이며 clear width 1.05m, clear height 2.30m를 이 opening owner가 정한다. sill은 [1층 바닥](#ground-level)이다. 전면 출입 계단의 마지막 landing에서 현관 바닥으로 진입한다. 목재 문짝의 열림과 닫힘이 threshold를 덮는 실제 부재를 가진다.

문 중심은 기존 후보 x=2.10에서 0.12m 옮겼다. [계단실 glazing](003-surface-ownership.md#front-stair-glazing)의 끝과 door frame이 겹치지 않게 하되 현관의 동측 보행대 안에 남기기 위한 수리다. [문틀 점유](#door-interface)를 적용한 실제 frame 간격을 검증해야 한다.

jamb·head·문짝을 제외한 유효 치수가 이 값이다. structural cut은 frame 두께를 더해 파생한다. route는 opening 중심에서 양쪽 실내 방향으로 각각 경계 두께의 절반과 0.20m 이상 연장해 실제 from/to cell에 도달시킨다. 외부 입구는 대지 landing에 연결한다. 개구 형상, 문 상태, endpoint 포함과 [통행 원통](../settings/002-household.md#design-subject-conditions)의 충돌을 [전수 검증](#stage-one-verification)에서 반증할 수 있어야 한다.

## 현관–작업실 문 {#entry-flex}

<!--
@evidence settings/002-household.md#flex-states 작업·손님 두 정지 상태에서 유지되는 미닫이문을 현관과 작업실 사이 pocket에 배정하고 열린 leaf의 수납은 -Z로 정한다.
-->

<!--
@evidence principles/core/common.md#declared-basis 현관에서 작업실로 직접 들어가는 관계를 상속하고 z=-1.10의1.20m 개구와 -Z pocket을 채택했다.
@evidence principles/core/common.md#scope-preservation 작업실 입구를 공용부나 외부에 돌리지 않으며 열린 leaf의 실제 수납 위치도 남긴다.
@evidence principles/core/common.md#substantive-completion 문 중심·clear 크기·host·층 sill과 pocket 방향이 정해져 짧은 +Z wall end에 문을 억지로 밀어 넣을 수 없다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가변 작업실의 직접 접근에 미닫이 이동 방향과 공유 벽 안 수납이라는 공간 점유를 추가한다.
@evidence principles/design/spaces.md#space-topology entry와 flex-workroom의 shared wall에 하나의 opening을 두어 두 cell 사이의 직결 route를 만든다.
@evidence principles/design/spaces.md#space-boundary-authority 폭과 중심은 이 opening, plane은 wall-entry-flex, floor는 ground-level에서 각각 받는다.
@evidence principles/design/spaces.md#space-verification-address pocket 길이와 열린 leaf, 양쪽 endpoint, 통행 원통이 실제 cell과 공유 벽에 맞는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 직접 작업실 접근과 flex-states가 두 상태에서 유지하도록 정한 미닫이문을 공유 벽 길이에 대조해 -Z pocket을 이 opening에서 택했다. 현관 연결이나 방의 용도를 부모에서 바꾸지 않아도 된다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 전면 작업실이 현관에 직접 붙는 고정 연결을 실물 pocket door로 배정한다.
@evidence settings/002-household.md#design-subject-conditions 열린 pocket 문이 통행 원통을 막는지 질문하고 clear 폭만으로 접근 완료를 판정하지 않는다.
-->

[entry](#entry) ↔ [flex-workroom](#flex-workroom)의 직접 연결 하나다. host wall은 [wall-entry-flex](#wall-entry-flex)이며 폭 방향 중심은 z=-1.10m이며 clear width 1.20m, clear height 2.20m를 이 opening owner가 정한다. sill은 [1층 바닥](#ground-level)이다. 미닫이 pocket은 공유 벽 안에서 -Z 방향으로 두며 열린 leaf는 opening의 앞쪽 벽 속에 수납한다. +Z 쪽의 짧은 wall end로 밀어 넣지 않는다.

jamb·head·문짝을 제외한 유효 치수가 이 값이다. structural cut은 frame 두께를 더해 파생한다. route는 opening 중심에서 양쪽 실내 방향으로 각각 경계 두께의 절반과 0.20m 이상 연장해 실제 from/to cell에 도달시킨다. 개구 형상, 문 상태, endpoint 포함과 [통행 원통](../settings/002-household.md#design-subject-conditions)의 충돌을 [전수 검증](#stage-one-verification)에서 반증할 수 있어야 한다.

## 현관–공용부 개구 {#entry-common}

<!--
@evidence principles/core/common.md#declared-basis 현관에서 후면 공용부로 곧장 이어지는 요구에 x=2.05의 clear1.30×2.20m 개구를 채택했다.
@evidence principles/core/common.md#scope-preservation 거실·식당·주방의 연속성을 현관과 연결하며 별도 홀이나 분기 복도를 덧붙이지 않는다.
@evidence principles/core/common.md#substantive-completion 계단 동측 보행대에 맞춘 중심과 leaf 없는 개구 형식 및 양쪽 cell 종점을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 공용부로의 생활 동선을 문짝 없이 계속되는 특정 shared-wall opening으로 공간화한다.
@evidence principles/design/spaces.md#space-topology entry와 common-room은 wall-entry-common을 관통하는 한 passage로 직접 이어진다.
@evidence principles/design/spaces.md#space-boundary-authority 이 개구는 중심·유효 폭과 높이·leaf 없는 형식 및 route 접속을 정하고 wall plane·frame·층 높이는 각각의 owner를 소비한다.
@evidence principles/design/spaces.md#space-verification-address route가 동측 통행대와 실제 공용부 cell 안에 닿는지 및 jamb가 유효 폭을 침범하는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work ground graph의 직결 요구를 계단 동측 띠와 공유 벽에 대조했다. leaf 없는1.30m 통과를 둘 수 있어 부모에 추가 corridor를 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 단일 현관에서 연속 공용부로 이어지는 주 동선을 이 실제 opening으로 남긴다.
@evidence settings/002-household.md#design-subject-conditions 통행 원통은 leaf가 없더라도 jamb와 주변 가구에 충돌할 수 있으므로 route 검사를 면제하지 않는다.
-->

[entry](#entry) ↔ [common-room](#common-room)의 직접 연결 하나다. host wall은 [wall-entry-common](#wall-entry-common)이며 폭 방향 중심은 x=2.05m이며 clear width 1.30m, clear height 2.20m를 이 opening owner가 정한다. sill은 [1층 바닥](#ground-level)이다. 문짝 없는 연속 내부 개구이며 계단 동측 통행대에 이어진다.

jamb·head·문짝을 제외한 유효 치수가 이 값이다. structural cut은 frame 두께를 더해 파생한다. route는 opening 중심에서 양쪽 실내 방향으로 각각 경계 두께의 절반과 0.20m 이상 연장해 실제 from/to cell에 도달시킨다. 개구 형상, 문 상태, endpoint 포함과 [통행 원통](../settings/002-household.md#design-subject-conditions)의 충돌을 [전수 검증](#stage-one-verification)에서 반증할 수 있어야 한다.

## 현관–powder 문 {#entry-powder}

<!--
@evidence principles/core/common.md#declared-basis 현관 직결 powder 배치를 받아 z=-3.20의 clear0.90×2.20m와 방 안쪽 열림을 정했다.
@evidence principles/core/common.md#scope-preservation powder를 현관에서 직접 사용하는 방으로 유지하고 열린 문이 계단 통행을 대신 점유하지 않게 한다.
@evidence principles/core/common.md#substantive-completion host wall·sill·중심과 열림 대상 room을 지정해 손잡이·hinge·route가 같은 개구에서 파생되게 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground program의 작은 위생실에 구체적인 측면 출입 위치와 inward leaf 점유를 부여한다.
@evidence principles/design/spaces.md#space-topology entry와 powder-utility 두 cell이 실제 공유 벽의 한 문으로 이어지고 공용부를 경유하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority z 중심과 clear 치수는 문에서 소유하며 벽 두께와 중심면은 연결된 경계 owner를 소비한다.
@evidence principles/design/spaces.md#space-verification-address powder 안으로 열린 leaf와 세면·변기 배치의 간섭, endpoint 포함과 원통의 충돌을 개구별로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 현관 직접 연결과 일반 문 조건을 코어의 clear 방 범위에 대조했다. 열림을 powder 안으로 두므로 계단이나 부모 그래프 변경이 요구되지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 우측 코어의 위생실이 끊김 없이 닿도록 현관에서 문을 내며 별도의 복도를 추가하지 않는다.
@evidence settings/002-household.md#design-subject-conditions 지정 원통과 열린 leaf의 충돌을 질문하되0.90m 폭을 실물 접근성 인증의 대용으로 사용하지 않는다.
-->

[entry](#entry) ↔ [powder-utility](#powder-utility)의 직접 연결 하나다. host wall은 [wall-entry-powder](#wall-entry-powder)이며 폭 방향 중심은 z=-3.20m이며 clear width 0.90m, clear height 2.20m를 이 opening owner가 정한다. sill은 [1층 바닥](#ground-level)이다. 문은 powder 안쪽으로 열리고 현관의 계단이나 통행대를 침범하지 않는다.

jamb·head·문짝을 제외한 유효 치수가 이 값이다. structural cut은 frame 두께를 더해 파생한다. route는 opening 중심에서 양쪽 실내 방향으로 각각 경계 두께의 절반과 0.20m 이상 연장해 실제 from/to cell에 도달시킨다. 개구 형상, 문 상태, endpoint 포함과 [통행 원통](../settings/002-household.md#design-subject-conditions)의 충돌을 [전수 검증](#stage-one-verification)에서 반증할 수 있어야 한다.

## 공용부–수납 문 {#common-storage}

<!--
@evidence principles/core/common.md#declared-basis 공용부에 붙은1층 수납에 x=-4.14의 문 중심과0.90×2.20m clear를 저작했다.
@evidence principles/core/common.md#scope-preservation 수납은 공용부에서 접근되며 현관 쪽 폐쇄 경계를 임의의 두 번째 출입으로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 수납 안으로 열리는 leaf와 ground sill 및 shared host를 정해 수납 진입을 실제 부재에 연결한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-partition의 common→storage 연결에 문 중심과 방 안쪽 개폐 점유를 부여했다.
@evidence principles/design/spaces.md#space-topology common-room에서 storage-1f로의 route는 두 방의 Z방향 공유 벽을 관통한다.
@evidence principles/design/spaces.md#space-boundary-authority clear 문 치수는 여기, wall-common-storage는 양 room의 face에서 plane을 도출하여 값의 중복을 피한다.
@evidence principles/design/spaces.md#space-verification-address 공용부 통행을 막는 leaf, 수납 가구와 문 충돌, cell에 닿지 않는 route를 이 문 id의 실패로 기록한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 공용부 직결 수납 조건과 공유 span을 대조했고 room 안으로 열어 현관이나 생활 동선의 부모 조건을 변경하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 불투명 코어 수납의 실제 도달성을 공용부 문으로 마련하고 단절된 방으로 남기지 않는다.
@evidence settings/002-household.md#design-subject-conditions 좁은 수납실 진입에서도 가상 통행 원통과 열린 leaf를 함께 검사하며 명목 clear 치수만으로 성공시키지 않는다.
-->

[common-room](#common-room) ↔ [storage-1f](#storage-1f)의 직접 연결 하나다. host wall은 [wall-common-storage](#wall-common-storage)이며 폭 방향 중심은 x=-4.14m이며 clear width 0.90m, clear height 2.20m를 이 opening owner가 정한다. sill은 [1층 바닥](#ground-level)이다. 수납실 안으로 열리는 문으로 공용부를 가로막지 않는다.

jamb·head·문짝을 제외한 유효 치수가 이 값이다. structural cut은 frame 두께를 더해 파생한다. route는 opening 중심에서 양쪽 실내 방향으로 각각 경계 두께의 절반과 0.20m 이상 연장해 실제 from/to cell에 도달시킨다. 개구 형상, 문 상태, endpoint 포함과 [통행 원통](../settings/002-household.md#design-subject-conditions)의 충돌을 [전수 검증](#stage-one-verification)에서 반증할 수 있어야 한다.

## 단일 꺾임계단과 필수 바닥 개구 {#single-stair}

<!--
@evidence principles/core/common.md#declared-basis 한 꺾임계단 요구를 두 flight와 한 참으로 해석하고 높이는 층 datum에서,18 riser와0.28m 진행은 저작 선택에서 받는다.
@evidence principles/core/common.md#scope-preservation 두 flight를 하나의 연속 계단으로 유지하며 난간·참·실제 tread를 생략하거나 두 번째 계단을 더하지 않는다.
@evidence principles/core/common.md#substantive-completion 각 flight의 x/z 범위·방향·9개 tread와 landing의 접속 및 끝 tread 높이 규칙까지 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 중앙 계단이라는 부모 조건에 반대 방향 flight와 floor 차이에서 파생하는 riser·참 높이의 관계를 더한다.
@evidence principles/design/spaces.md#space-topology entry에서 중간 참을 지나 upper-corridor로 도착하는 유일한 층간 route를 실제 tread 상단에 묶는다.
@evidence principles/design/spaces.md#space-boundary-authority rise는 층 높이 차이의 함수이며 slab 구멍은 stair-opening이 소유한다. 계단 owner가 별도 층 높이를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address headroom·return clearance·tread/참 접촉·guard와 route의 간섭을 새 산출물에서 질문하며 현재는 unverified다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 두 층 datum과 단일 계단 조건을18 riser·두 flight의 도착에 대조했다. 별도 계단이나 거실 보이드를 요구하는 계획 모순은 없으나 실제 clearance는 아직 검증하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 두 층을 잇는 하나의 꺾임계단을 중앙 현관에 두고 실물 참과 난간을 후속 구현 범위로 남긴다.
@evidence settings/003-spatial-basis.md#ground-graph 현관 중앙에서 상층으로 올라가는 단일 계단을 두 flight와 한 참에 배정하고 별도의 층간 연결을 추가하지 않는다.
-->

entry 안에 두 flight와 하나의 중간 참으로 구성된 단일 계단을 둔다. 하부 flight는 x=0.26..1.46에서 전면(-Z)을 향해 상승하고, 참에서 방향을 바꾼 상부 flight는 x=-1.18..0.02에서 후면(+Z)을 향해 상승한다. 두 flight의 수평 범위는 z=-4.32..-1.80, 중간 참은 x=-1.18..1.46, z=-5.52..-4.32이다. 참은 두 flight 전폭에 실제로 닿는다.

[매스와 층 datum](#mass-and-storeys)의 두 floor 높이 차이를 18개 riser로 나누므로 현재 rise=(3.20-0)/18m다. 각 flight는 9개 riser이며 명목 진행 간격 0.28m로 2.52m의 진행 범위를 가진다. 참의 y는 ground floor 높이에 9×rise를 더한 값이고 상부 도착은 upper floor 높이와 같다. 각 flight는 tread도 9개다. 각 tread는 0.28m 길이이며 상승 방향의 가까운 edge마다 riser를 하나 두고, n번째 tread 상단은 출발 높이+n×rise다. 따라서 하부 9번째 tread는 참과, 상부 9번째 tread는 upper floor와 같은 높이로 만나며 그 뒤에 추가 riser를 만들지 않는다. 첫 riser는 flight 출발선이고 마지막 tread의 먼 edge는 참/도착 경계에 닿는다. route는 이 실제 tread 상단과 참의 중심을 소비한다. 이 문서는 아직 staircase clearance를 검증하지 않았다.

[필수 바닥 개구](#stair-opening)가 upper slab과 상부 도착의 관계를 소유한다.

guard와 handrail은 실제 tread pitch와 참을 따른다. 계단 전체를 막는 불투명 판은 사용하지 않는다. 상부 opening edge의 유리 guard는 독립된 복층 보이드를 뜻하지 않으므로 선택 가능하다. 재료·프레임 형상은 계단의 완결 owner가 후속 외피/fit-out 단계에서 구현한다. headroom, return clearance, 난간의 실제 geometry는 새 산출물에서 검증 전이며 unverified다.

## 계단의 필수 바닥 개구 {#stair-opening}

<!--
@evidence principles/core/common.md#declared-basis 계단에 필요한 구멍만 허용하는 부모 조건 아래 x=-1.24..1.58,z=-5.64..-1.80의 slab opening을 정했다.
@evidence principles/core/common.md#scope-preservation 구멍을 단일 계단의 통과 면적으로 한정하고 거실이나 다른 방에 복층 보이드를 늘리지 않는다.
@evidence principles/core/common.md#substantive-completion opening 외곽과 복도의 직접 시작선을 고정하고 slab strip·보·난간 받침의 파생 입력을 하나로 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 계단실의 필수 개구라는 조건을 상부 slab의 특정 직사각형과 복도 도착 관계로 좁혔다.
@evidence principles/design/spaces.md#space-topology 계단 route가 upper slab을 지나 upper-corridor로 바로 이어지는 통과 경계를 소유한다.
@evidence principles/design/spaces.md#space-boundary-authority slab와 guard 받침은 같은 구멍에서 도출하고 계단 tread나 복도 cell이 구멍 치수를 따로 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 실제 면적·slab strip·headroom과 상층 도착 접속을 함께 검증해 구멍이 있어도 slab 충돌이 남는 반례를 잡는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 계단 외 보이드 금지와 일자 복도 시작 조건을 구멍 범위에 대조했다. 상부 도착선에서 복도를 바로 시작하므로 추가 생활 보이드가 필요하지 않다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 단일 계단이 통과할 필수 바닥 개구만 두어 복층 거실과 두 번째 계단을 금지한 그래프를 유지한다.
-->

upper slab의 계단 구멍은 x=-1.24..1.58, z=-5.64..-1.80에만 둔다. 구멍의 남은 slab strip, 보, 난간 받침은 같은 opening 입력에서 파생한다. upper-corridor는 상부 flight 도착선 z=-1.80에서 바로 시작하므로 다른 방을 통과하거나 복도를 추가하지 않는다. 구멍은 단일 계단에 필요한 면적이며 거실을 뚫는 복층 보이드는 만들지 않는다.

이 opening은 [단일 계단](#single-stair)과 [2층 바닥](#upper-level)을 연결한다. 다른 생활 공간의 복층 보이드는 허용하지 않는다. 구멍의 실제 면적·slab strip·계단 route의 headroom과 [복도](#upper-corridor) 도착을 [전수 검증](#stage-one-verification)에서 함께 확인한다.

## 2층 분할과 짧은 일자 복도 {#upper-partition}

<!--
@evidence settings/002-household.md#household-program 가족이 한 집에서 공동생활하면서 상층 수면 프라이버시를 얻도록 복도와 독립 침실의 직접 출입에 배정한다. 실제 거주자 asset은 공간으로 만들지 않는다.
@evidence settings/002-household.md#operative-subjects 성인 둘과 자녀 둘을 설명하는 주침실 하나·작은 침실 둘을 상층 room population에 보존한다. 인물 행동이나 설비 작동을 공간의 실행 주체로 추가하지 않는다.
-->

<!--
@evidence principles/core/common.md#declared-basis upper-graph의 일자 복도와 여섯 직접 연결 방을 받아 일곱 room의 개별 cell·opening owner로 분해한다.
@evidence principles/core/common.md#scope-preservation 주침실·두 작은 침실·욕실·수납·설비실을 모두 복도에 직접 붙이고 분기나 통과실을 추가하지 않는다.
@evidence principles/core/common.md#substantive-completion 상층 면적을 각 room·shared gap·필수 계단 구멍에 배정하며 L자 cell seam은 벽이 아님을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 프로그램을 실제 일곱 room 주소와 그 사이 문·닫힌 경계 및 무소유 영역 검사로 전개한다.
@evidence principles/design/spaces.md#space-topology upper-storey 안의 일곱 room과 중앙 복도의 여섯 직접 문, 전면 계단 도착이 상층 포함·연결을 이룬다.
@evidence principles/design/spaces.md#space-boundary-authority 이 조립 H2는 개별 cell의 좌표를 반복하지 않고 각 방·연결 H2를 유일 치수 owner로 지정한다.
@evidence principles/design/spaces.md#space-verification-address containment·인접 경계·도달·무소유 바닥을 함께 질문하여 연결된 듯한 그림만으로 partition을 승인하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 그래프와 생활 프로그램을 일곱 room 및 두 L자 cell의 합집합에 배정했다. 분기 복도나 삭제해야 할 방을 요구하는 모순은 계획에서 발견하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 짧은 일자 복도에서 세 침실과 코어에 직접 닿는 관계를 고정하고 단절된 방이나 두 번째 corridor를 만들지 않는다.
@evidence settings/003-spatial-basis.md#upper-graph 상층의 직접 연결을 여섯 실제 opening owner에 배정하며 계단 도착부터 다른 방을 통과하는 우회를 허용하지 않는다.
@evidence settings/002-household.md#upper-program 상층의 잠·위생·수납·설비 역할을 일곱 room 전체에 배분하고 생활 프로그램을 외피 모양 때문에 줄이지 않는다.
-->

[2층](#upper-level)은 [복도](#upper-corridor)에서 [주침실](#primary-bedroom), [작은 침실 1](#child-bedroom-1), [작은 침실 2](#child-bedroom-2), [욕실](#upper-bathroom), [수납](#upper-storage), [설비실](#upper-service)로 직접 닿는 일곱 room이다. 각 방의 cell과 연결 H2가 유일한 치수 owner다. [설정의 상층 그래프](../settings/003-spatial-basis.md#upper-graph)를 소비하고 다른 통과실·분기 복도를 추가하지 않는다. [가족의 공동생활과 상층 수면 프라이버시](../settings/002-household.md#household-program), [성인 둘·자녀 둘의 세 수면실 배정](../settings/002-household.md#operative-subjects)을 이 복도와 세 침실의 독립 출입이 소비한다.

L자 두 방의 seam에는 벽을 만들지 않는다. 각 외주·shared gap에만 벽이 있고 필수 계단 개구를 제외한 전체 상층은 방 또는 실물 경계로 설명되어야 한다. [전수 검증](#stage-one-verification)에서 containment·인접 경계·도달·무소유 영역을 판정한다.

## 2층 일자 복도 {#upper-corridor}

<!--
@evidence principles/core/common.md#declared-basis upper-program의 단일 복도를 x=-2.84..0.12,z=-1.80..2.40의 clear plan으로 해석했다. 높이는 upper-storey를 소비한다.
@evidence principles/core/common.md#scope-preservation 계단참에서 여섯 방에 직접 닿는 하나의 복도이며 분기나 침실 통과 경로를 추가하지 않는다.
@evidence principles/core/common.md#substantive-completion 전면 시작선과 폭2.96m·길이4.20m 및 여섯 문 주소를 정해 상층 접근의 공간을 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 짧은 일자 복도라는 부모 결정을 계단 도착선·clear cell·각 방의 실제 opening 관계로 전개했다.
@evidence principles/design/spaces.md#space-topology upper-storey의 room인 복도는 single-stair와 여섯 방문의 접속 중심이며 다른 층에 중복 귀속되지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 복도는 자기 clear plan을 소유하고 y 범위는 층, 각 문은 해당 opening, slab 구멍은 stair-opening에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 계단 도착·문 route·가구 점유와 내부 관찰을 cell에 대조하여 방 밖 우회와 무소유 바닥을 검출한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층의 여섯 직접 문과 단일 복도 조건을4.20m의 한 구획에 대조했다. 분기나 통과실을 부모에게 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 계단참에서 시작하는 짧은 일자 복도를 유일한 상층 분배 공간으로 유지한다.
@evidence settings/002-household.md#upper-program 세 침실·욕실·수납 및 별도 설비실을 직접 잇는 corridor를 실제 문 주소에 연결했다.
-->

room id upper-corridor의 parent는 [upper-storey](#upper-level)다. clear plan은 x=-2.84..0.12, z=-1.80..2.40m인 한 직사각형이며 y 범위는 층 owner가 소유한다. 상부 계단 도착선에서 시작한다. 길이 4.20m와 clear width 2.96m의 하나의 일자 복도이며 분기나 다른 통과실을 만들지 않는다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-primary](#corridor-primary), [corridor-child-one](#corridor-child-one), [corridor-child-two](#corridor-child-two), [corridor-bathroom](#corridor-bathroom), [corridor-storage](#corridor-storage), [corridor-service](#corridor-service)의 실제 opening과 route를 사용한다. 계단은 복도 전면 경계에서 바로 연결된다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다.

## 주침실 {#primary-bedroom}

<!--
@evidence principles/core/common.md#declared-basis 상층 수면 프로그램의 주침실을 후면 clear8.10×3.18m에 배정하며25.76㎡는 저작 입력의 계산값으로만 표시한다.
@evidence principles/core/common.md#scope-preservation 주침실은 작은 침실과 구별되는 독립 room이며 복도를 거쳐 직접 들어가는 사적 공간으로 남긴다.
@evidence principles/core/common.md#substantive-completion 후면 cell의 네 경계와 층 귀속, 출입 opening을 정해 나중에 외관을 맞추려고 위치를 임의 선택할 수 없다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-program의 주침실 역할에 후면 폭과 깊이 및 corridor-primary의 직접 접속을 추가했다.
@evidence principles/design/spaces.md#space-topology primary-bedroom은 upper-storey 안에 있고 corridor-primary만을 통해 상층 복도에 접속한다.
@evidence principles/design/spaces.md#space-boundary-authority 방의 clear plan은 여기서, floor/ceiling은 upper-level에서, 출입의 문틀 치수는 opening owner에서 받는다.
@evidence principles/design/spaces.md#space-verification-address cell containment·방문·침대 등 실물 가구와 통행 및 자기 방 안 관찰이 이 후면 room의 검증 주소다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 세 침실을 요구하는 상층 프로그램과 후면 주침실 배치를 대조했다. 이 방 때문에 작은 침실이나 복도 연결을 삭제할 부모 변경은 필요하지 않다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 주침실을 짧은 복도에 직접 연결하고 다른 침실을 통과하는 사적 동선을 만들지 않는다.
@evidence settings/002-household.md#upper-program double bed와 수납·책상으로 읽힐 주침실의 실내 영역을 제공하며 가구의 구현과 충돌 판정은 후속 작업으로 남긴다.
-->

room id primary-bedroom의 parent는 [upper-storey](#upper-level)다. clear plan은 x=-2.84..5.26, z=2.58..5.76m인 한 직사각형이며 y 범위는 층 owner가 소유한다. 후면의 주침실이다. 저작 입력의 평면 면적은 약25.76㎡이며 두 작은 침실보다 크다. 이는 컴파일된 유효 면적 측정이 아니다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-primary](#corridor-primary)의 실제 opening과 route를 사용한다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다.

## 작은 침실 1 {#child-bedroom-1}

<!--
@evidence principles/core/common.md#declared-basis 첫 작은 침실의 clear plan을 두 cell 합집합으로 정했으며20.94㎡는 저작 치수의 계산으로 실제 측량과 구별한다.
@evidence principles/core/common.md#scope-preservation 전면 침실과 복도 직결 연장부를 한 방으로 유지하고 seam에 벽을 넣어 단절된 잔여실을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 두 직사각형의 범위와 열린 seam, upper-storey 귀속 및 직접 문을 지정해 L자의 안팎을 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층의 첫 작은 침실에 계단 동측 본체와 복도에 닿는 연장부라는 L자 공간 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 두 cell은 같은 child-bedroom-1에 속하며 corridor-child-one이 연장부에서 복도와 직접 연결한다.
@evidence principles/design/spaces.md#space-boundary-authority 합집합의 외주만 room 경계이고 내부 seam은 벽 입력이 아니다. 계단 구멍과 y 범위는 별도 owner를 소비한다.
@evidence principles/design/spaces.md#space-verification-address L자의 오목 모서리와 연장부 관찰을 추가하고 문·가구 통행과 cell containment를 함께 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전면 작은 침실과 복도 직결 조건을 두 cell로 맞췄고 seam을 열었다. 계단 구멍을 침실로 채우거나 두 번째 corridor를 부모에 추가할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 첫 작은 침실은 상층의 독립 수면실로 복도에 직접 닿으며 계단 측면의 남는 면적을 단절 공간으로 남기지 않는다.
@evidence settings/002-household.md#upper-program single bed·wardrobe·desk 또는 shelf가 들어갈 첫 침실의 영역과 통행 검사를 배정했다.
-->

room id child-bedroom-1의 parent는 [upper-storey](#upper-level)다. clear plan은 x=1.76..5.26, z=-5.76..-0.32m와 x=0.30..1.76, z=-1.62..-0.32m의 합집합이며 y 범위는 층 owner가 소유한다. 계단 동측 전면과 복도 직결 연장부가 이어진 하나의 L자 방이다. 두 cell의 공유 seam에 벽을 만들지 않는다. 저작 입력 면적은 약20.94㎡이며 실제 측정 전이다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-child-one](#corridor-child-one)의 실제 opening과 route를 사용한다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다. L자 방은 네 모서리에 더해 오목 모서리와 연장부 관찰을 추가한다.

## 작은 침실 2 {#child-bedroom-2}

<!--
@evidence principles/core/common.md#declared-basis 두 번째 작은 침실은 x=0.30..5.26,z=-0.14..2.40에 채택했고12.60㎡는 구현 전 설계 계산값이다.
@evidence principles/core/common.md#scope-preservation 두 작은 침실을 하나로 합치지 않으며 이 방을 주침실로 가는 통과실로 쓰지 않는다.
@evidence principles/core/common.md#substantive-completion 직사각형 cell과 층 높이 소비, corridor-child-two 출입을 정해 동측 수면실의 경계를 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 작은 bedroom 요구의 두 번째 항목에 동측 중간 구획과 독립 방문을 대응시킨다.
@evidence principles/design/spaces.md#space-topology child-bedroom-2는 upper-storey 자식으로 복도에 직접 이어지고 양옆 침실과 통과 연결을 갖지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 방 좌표는 이 H2에 한 번 소유하며 주변 벽은 이 face와 인접 room face에서 파생한다.
@evidence principles/design/spaces.md#space-verification-address 좁은 깊이 안에서 문·가구·관찰 시점의 포함과 통행을 검증하며 넓게 보이는 화면으로 대체하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 별도의 두 작은 침실과 직접 방문 요구에 이 동측 구획을 대조했다. 방의 수나 상층 복도 형식을 부모에서 바꾸지 않아도 배정된다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 두 작은 침실 중 하나를 실제 cell과 방문으로 남겨 수면실 수와 독립 도달 관계를 보존한다.
@evidence settings/002-household.md#upper-program 두 번째 single-bed room의 생활 물품과 통행을 삭제하지 않고 이 clear 영역 안의 후속 fit-out 질문으로 남겼다.
-->

room id child-bedroom-2의 parent는 [upper-storey](#upper-level)다. clear plan은 x=0.30..5.26, z=-0.14..2.40m인 한 직사각형이며 y 범위는 층 owner가 소유한다. 동측의 작은 침실이며 다른 침실의 통과실이 아니다. 저작 입력 면적은 약12.60㎡이며 실제 측정 전이다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-child-two](#corridor-child-two)의 실제 opening과 route를 사용한다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다.

## 상층 욕실 {#upper-bathroom}

<!--
@evidence principles/core/common.md#declared-basis upper-program의 욕실을 서측 코어 x=-5.26..-3.02,z=1.28..5.76에 배정한 저작 설계다.
@evidence principles/core/common.md#scope-preservation 욕조·샤워·변기·세면과 수건 수납은 한 욕실 안에서 접근되며 침실 전용 통과 동선으로 축소하지 않는다.
@evidence principles/core/common.md#substantive-completion 길쭉한 코어 room의 경계·층 귀속·복도 문을 정해 위생 fixture의 실제 배치 영역을 제공한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 위생 프로그램을 후방 서측 코어 구획과 복도 직결 문으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 욕실은 upper-storey 안의 room으로 corridor-bathroom을 통해 복도에서 직접 접근한다.
@evidence principles/design/spaces.md#space-boundary-authority 욕실 clear 범위는 여기, 외부 privacy 창은 외피 owner, 높이는 upper-level이 소유한다.
@evidence principles/design/spaces.md#space-verification-address 문과 위생 fixture가 통행을 막는지, 실제 cell 안에서 방 관찰이 가능한지를 전수 검증에 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 불투명 코어와 상층 욕실의 직접 출입을 현재 서측 구획에 대조했다. 침실 경유나 추가 corridor를 요구하는 부모 변경은 필요하지 않다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 욕실을 우측 불투명 코어에 모으고 상층 일자 복도에서 직접 문으로 연결한다.
@evidence settings/002-household.md#upper-program 명시한 vanity·toilet·shower/tub·towel storage를 욕실 안의 생활 범위로 유지한다.
-->

room id upper-bathroom의 parent는 [upper-storey](#upper-level)다. clear plan은 x=-5.26..-3.02, z=1.28..5.76m인 한 직사각형이며 y 범위는 층 owner가 소유한다. 서측 불투명 코어의 욕실이다. 욕조·샤워·변기·세면대와 수건 수납은 이 방 안에서 접근되며 침실을 통해 들어가지 않는다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-bathroom](#corridor-bathroom)의 실제 opening과 route를 사용한다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다.

## 상층 수납 {#upper-storage}

<!--
@evidence principles/core/common.md#declared-basis 상층 linen 수납의 요구를 서측 clear2.24×1.24m 방으로 채택했으며 깊이는 실물 수납과 문 통행의 후속 검사 대상이다.
@evidence principles/core/common.md#scope-preservation 수납을 욕실이나 설비실 안의 접근 불가능한 이름으로 합치지 않고 복도 직결 room으로 유지한다.
@evidence principles/core/common.md#substantive-completion cell 네 경계와 upper-storey 귀속·corridor-storage 문을 정해 작은 공간도 독립 수정 주소를 가진다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 storage 프로그램에 코어 중간의 짧은 구획과 독립 문이라는 배치를 추가한다.
@evidence principles/design/spaces.md#space-topology upper-storage는 욕실과 설비실 사이에 있으나 통행은 두 방이 아닌 upper-corridor에서 직접 받는다.
@evidence principles/design/spaces.md#space-boundary-authority 수납 cell의 z=-0.14..1.10을 여기서 소유하고 양끝 벽 및 문 host는 인접 face에서 도출한다.
@evidence principles/design/spaces.md#space-verification-address 작은 깊이의 cell에 열린 leaf와 linen cabinet을 대조하여 실제 통행을 막는 수납 배치를 검출한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 수납의 직접 출입 요구를 코어의 중간 room에 대조했다. 설비실 통과나 수납 삭제를 부모에 요청할 계획상 이유는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 상층 수납은 일자 복도에서 실제 문으로 닿는 불투명 코어 방으로 남긴다.
@evidence settings/002-household.md#upper-program linen·cleaning cabinet을 소유할 상층 수납의 독립 영역과 방문을 배정한다.
-->

room id upper-storage의 parent는 [upper-storey](#upper-level)다. clear plan은 x=-5.26..-3.02, z=-0.14..1.10m인 한 직사각형이며 y 범위는 층 owner가 소유한다. 복도에 직접 붙은 linen 수납이다. 설비실이나 욕실에 들어가야만 수납에 닿는 연결을 만들지 않는다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-storage](#corridor-storage)의 실제 opening과 route를 사용한다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다.

## 상층 설비·세탁실 {#upper-service}

<!--
@evidence principles/core/common.md#declared-basis 별도 설비·세탁실 프로그램을 계단 서측 바닥 띠를 포함하는 두 cell 합집합으로 채택한다.
@evidence principles/core/common.md#scope-preservation 세탁·설비실을 수면실이나 두 번째 corridor로 바꾸지 않고 계단 옆 잔여 공간까지 하나의 닫힌 room에 귀속한다.
@evidence principles/core/common.md#substantive-completion 두 cell 범위와 열린 seam, 계단 서측·복도 전면의 닫힌 경계를 정해 L자 외주의 끝을 설명한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-service의 생활 역할에 계단 옆 넓은 전면부와 복도에 닿는 후방 날개를 결합한 L자 배치를 더한다.
@evidence principles/design/spaces.md#space-topology 두 cell은 하나의 upper-service이며 seam 통과와 corridor-service의 직접 출입을 갖고 stair hole에는 열리지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 합집합 외주와 계단·복도에 면한 닫힌 segment를 구별하여 seam이나 없는 벽을 별도 owner가 생성하지 못하게 한다.
@evidence principles/design/spaces.md#space-verification-address 오목 모서리·연장부 관찰과 계단 개구 간섭, 설비·문·통행 검사를 이 L자 room의 질문으로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 별도 설비실과 단일 계단·복도를 동시에 보존하도록 두 cell과 닫힌 측벽을 대조했다. 부모에 두 번째 복도나 수면실로의 용도 변경을 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 설비를 우측 불투명 코어에 모으고 계단 옆 바닥 띠를 단절 구역으로 남기지 않으면서 복도에 직접 문을 낸다.
@evidence settings/002-household.md#upper-program 세탁·건조기와 청소 수납·점검 영역을 위한 별도 상층 room을 제공하고 다른 방의 설비 통과 경로로 만들지 않는다.
-->

room id upper-service의 parent는 [upper-storey](#upper-level)다. clear plan은 x=-5.26..-1.42, z=-5.76..-1.98m와 x=-5.26..-3.02, z=-1.98..-0.32m의 합집합이며 y 범위는 층 owner가 소유한다. 계단 서측 상층 바닥 띠를 포함하는 하나의 L자 방이다. 두 cell의 seam은 열고 외주에만 벽을 둔다. 계단 opening 서측 x=-1.42..-1.24와 복도 전면 z=-1.98..-1.80의 경계를 닫는다. x=-3.02..-2.84의 벽은 z=-1.98 후방에만 존재한다. [상층 생활 프로그램](../settings/002-household.md#upper-program)을 소비한다.

직접 출입은 [corridor-service](#corridor-service)의 실제 opening과 route를 사용한다. cell 외주와 [계단 개구](#stair-opening)를 구분하여 무소유 바닥이나 방 밖 통로를 만들지 않는다. [전수 검증](#stage-one-verification)에서 cell·문·가구 통행과 방 내부 관찰을 검사한다. L자 방은 네 모서리에 더해 오목 모서리와 연장부 관찰을 추가한다.

## 복도–주침실 문 {#corridor-primary}

<!--
@evidence principles/core/common.md#declared-basis 상층 복도 직결 주침실 요구에 x=-0.58 중심과0.90×2.20m clear 문을 채택했다.
@evidence principles/core/common.md#scope-preservation 후면 주침실을 다른 수면실 경유 없이 연결하며 문짝과 틀도 실제 점유로 남긴다.
@evidence principles/core/common.md#substantive-completion host·sill·중심·크기와 주침실 안쪽 열림이 결정되어 방문 위치를 가구 배치자가 다시 고르지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 복도에서 주침실에 닿는 추상 edge를 후면 shared wall의 특정 문과 양쪽 cell endpoint로 바꾼다.
@evidence principles/design/spaces.md#space-topology upper-corridor와 primary-bedroom 사이 경계를 관통하는 한 문이며 제삼 room을 from/to에 포함하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 문은 x 중심과 유효 폭을 소유하고 host plane은 wall-corridor-primary의 두 clear face에서 받는다.
@evidence principles/design/spaces.md#space-verification-address shared span 안의 frame 포함, 주침실에 들어간 route 종점과 열린 leaf 충돌을 문 id로 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 직접 방문과 일반 문 canon을 복도 후면 shared span에 대조했다. 침실 통과나 복도 분기를 부모에 요구할 필요는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 주침실은 짧은 일자 복도의 끝에서 실제 문으로 연결되며 단절된 후면 room으로 남지 않는다.
@evidence settings/002-household.md#design-subject-conditions 주침실 안쪽의 열린 leaf를 원통 검사의 장애물에 포함해 명목 문 폭만으로 통행을 승인하지 않는다.
-->

[upper-corridor](#upper-corridor) ↔ [primary-bedroom](#primary-bedroom)의 직접 문 하나다. host wall은 [wall-corridor-primary](#wall-corridor-primary)이며 폭 방향 중심은 x=-0.58m이고 clear width 0.90m, clear height 2.20m다. sill은 [2층 바닥](#upper-level)에 놓는다. 방 안쪽으로 열리는 문짝과 틀은 복도를 가로막지 않으며 그 열린 부재도 통행 원통 검사의 장애물에 포함한다.

문 구멍은 jamb·head 두께를 더해 파생하고 route는 그 구멍의 중심에서 양쪽 cell 안으로 0.20m 이상 들어간다. [전수 검증](#stage-one-verification)에서 실제 shared wall span 안에 clear 폭과 frame이 들어가는지, route endpoint와 door-state가 실물 문과 맞는지 검사한다.

## 복도–작은 침실 1 문 {#corridor-child-one}

<!--
@evidence principles/core/common.md#declared-basis 첫 작은 침실의 복도 직결 조건을 L자 연장부의 z=-0.95 중심 문으로 채택했다.
@evidence principles/core/common.md#scope-preservation 전면 침실에 들어가기 위해 계단 구멍이나 두 번째 침실을 통과하는 우회를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 0.90×2.20m clear와 host·upper sill·방 안쪽 열림을 지정해 짧은 L자 연장부의 진입 위치를 고정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작은 침실1의 직접 접근을 연장부 서측 외주에서 벽 두께를 넘는 실물 portal로 구체화한다.
@evidence principles/design/spaces.md#space-topology 복도와 child-bedroom-1의 연장 cell이 문 양쪽이며 열린 seam을 통해 전면 본체로 이어진다.
@evidence principles/design/spaces.md#space-boundary-authority 문 z 중심은 여기서 정하고 L자 합집합 외주로부터 host span을 소비하여 seam을 벽으로 오인하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 짧은 shared span의 frame 여유와 열린 leaf, 실제 연장 cell에 들어간 route 종점을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work upper-graph의 직접 출입과 일반 문을 L자 연장부의 폭에 대조했다. 방의 분리나 corridor 추가 없이 방문을 배정할 수 있다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 첫 작은 침실의 상층 직접 문을 실물 개구로 남기고 계단실을 방 접근 통로로 재사용하지 않는다.
@evidence settings/002-household.md#design-subject-conditions L자 연장부의 열린 문짝도 지정 원통의 장애물이며 실제 clearance를 재지 못하면 unverified로 남긴다.
-->

[upper-corridor](#upper-corridor) ↔ [child-bedroom-1](#child-bedroom-1)의 직접 문 하나다. host wall은 [wall-corridor-child-one](#wall-corridor-child-one)이며 폭 방향 중심은 z=-0.95m이고 clear width 0.90m, clear height 2.20m다. sill은 [2층 바닥](#upper-level)에 놓는다. 방 안쪽으로 열리는 문짝과 틀은 복도를 가로막지 않으며 그 열린 부재도 통행 원통 검사의 장애물에 포함한다.

문 구멍은 jamb·head 두께를 더해 파생하고 route는 그 구멍의 중심에서 양쪽 cell 안으로 0.20m 이상 들어간다. [전수 검증](#stage-one-verification)에서 실제 shared wall span 안에 clear 폭과 frame이 들어가는지, route endpoint와 door-state가 실물 문과 맞는지 검사한다.

## 복도–작은 침실 2 문 {#corridor-child-two}

<!--
@evidence principles/core/common.md#declared-basis 두 번째 작은 침실의 독립 출입에 z=1.05 중심, clear0.90×2.20m를 선택했다.
@evidence principles/core/common.md#scope-preservation 동측 침실을 복도에서 바로 연결하고 다른 침실로 가는 연속 passage로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 상층 sill과 방 안으로 열리는 leaf·frame 및 양쪽 endpoint를 지정하여 실제 문을 구현할 입력을 갖춘다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 번째 수면실과 복도의 요구 edge에 공유 벽의 중심 위치와 실물 점유를 추가했다.
@evidence principles/design/spaces.md#space-topology upper-corridor에서 child-bedroom-2로의 단일 문이며 이 문은 두 room 외의 연결을 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority wall-corridor-child-two가 host의 plane/span을, 이 H2가 clear 치수와 z 중심을 소유한다.
@evidence principles/design/spaces.md#space-verification-address frame이 host span을 벗어나는지와 방 안으로 들어간 route가 열린 leaf나 가구를 통과하는지 질문한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 두 번째 작은 bedroom의 복도 직접 연결과 일반 inward 문을 동측 shared span에 대조해 부모 room 수나 그래프 변경이 필요하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 둘째 작은 침실의 독립 도달성을 일자 복도의 측면 문으로 실현할 주소를 남긴다.
@evidence settings/002-household.md#design-subject-conditions 열린 leaf를 포함한 문 상태에서 원통 통과를 검사하고 유효 폭과 실제 충돌을 같은 측정으로 혼동하지 않는다.
-->

[upper-corridor](#upper-corridor) ↔ [child-bedroom-2](#child-bedroom-2)의 직접 문 하나다. host wall은 [wall-corridor-child-two](#wall-corridor-child-two)이며 폭 방향 중심은 z=1.05m이고 clear width 0.90m, clear height 2.20m다. sill은 [2층 바닥](#upper-level)에 놓는다. 방 안쪽으로 열리는 문짝과 틀은 복도를 가로막지 않으며 그 열린 부재도 통행 원통 검사의 장애물에 포함한다.

문 구멍은 jamb·head 두께를 더해 파생하고 route는 그 구멍의 중심에서 양쪽 cell 안으로 0.20m 이상 들어간다. [전수 검증](#stage-one-verification)에서 실제 shared wall span 안에 clear 폭과 frame이 들어가는지, route endpoint와 door-state가 실물 문과 맞는지 검사한다.

## 복도–욕실 문 {#corridor-bathroom}

<!--
@evidence principles/core/common.md#declared-basis 상층 욕실의 복도 직접 접근에 z=1.86의0.90×2.20m 문을 배정한 저작 선택이다.
@evidence principles/core/common.md#scope-preservation 욕실 출입은 침실이나 수납을 거치지 않으며 불투명 코어 뒤에도 실제 문짝과 틀이 있어야 한다.
@evidence principles/core/common.md#substantive-completion bathroom 안쪽의 열림과 upper sill, host와 route의 cell 진입을 정해 코어 문을 단순 구멍으로 남기지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 위생 접근을 복도 서측 shared wall의 지정 문 중심과 실물 leaf 점유로 구체화한다.
@evidence principles/design/spaces.md#space-topology upper-corridor와 upper-bathroom을 직접 잇는 문으로 bath의 다른 인접 공간에는 연결되지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 욕실 문 폭은 이 owner에서, 벽 중심면과 전체 span은 wall-corridor-bathroom에서 파생 없이 참조한다.
@evidence principles/design/spaces.md#space-verification-address 문 frame의 shared span 포함과 inward leaf·위생 fixture·route 종점의 간섭을 검증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 복도 직결 욕실과 일반 문 조건을 코어의 sidewall에 대조했다. 이 개구 때문에 다른 room 경유나 추가 복도를 부모에 요구하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 우측 코어 욕실은 상층 단일 복도에 실제 문으로 직접 닿아야 한다는 관계를 지킨다.
@evidence settings/002-household.md#design-subject-conditions 욕실 안쪽 열린 문과 위생 설비를 원통 검사에서 제외하지 않으며 실제 신체 접근성 인증을 주장하지 않는다.
-->

[upper-corridor](#upper-corridor) ↔ [upper-bathroom](#upper-bathroom)의 직접 문 하나다. host wall은 [wall-corridor-bathroom](#wall-corridor-bathroom)이며 폭 방향 중심은 z=1.86m이고 clear width 0.90m, clear height 2.20m다. sill은 [2층 바닥](#upper-level)에 놓는다. 방 안쪽으로 열리는 문짝과 틀은 복도를 가로막지 않으며 그 열린 부재도 통행 원통 검사의 장애물에 포함한다.

문 구멍은 jamb·head 두께를 더해 파생하고 route는 그 구멍의 중심에서 양쪽 cell 안으로 0.20m 이상 들어간다. [전수 검증](#stage-one-verification)에서 실제 shared wall span 안에 clear 폭과 frame이 들어가는지, route endpoint와 door-state가 실물 문과 맞는지 검사한다.

## 복도–수납 문 {#corridor-storage}

<!--
@evidence principles/core/common.md#declared-basis 상층 storage의 독립 방문에 z=0.48 중심과 clear0.90×2.20m를 채택했다.
@evidence principles/core/common.md#scope-preservation 작은 수납실에도 문 부재와 직접 접근을 남기고 욕실이나 설비실에서만 쓰는 수납으로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 좁은 shared span의 문 중심·크기와 상층 sill 및 room 안쪽 열림을 지정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation linen 수납의 직접 연결을 코어 중간의 짧은 벽에 들어가는 실물 portal로 전개한다.
@evidence principles/design/spaces.md#space-topology upper-storage와 복도를 연결하는 유일한 문이며 옆 욕실·설비실 경계에는 추가 route가 없다.
@evidence principles/design/spaces.md#space-boundary-authority 수납 문 치수를 이 H2에서 정하고 wall-corridor-storage의 실제 겹치는 face 길이에 포함시킨다.
@evidence principles/design/spaces.md#space-verification-address 1.24m room 길이 안에서 jamb·head와 clear 폭이 host span에 들어가는지 및 열린 문 뒤 통행을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 수납과 복도 직접 접근을 작은 shared span에 대조해 문 frame을 포함하는 설계로 두었다. 수납을 없애거나 다른 방 통과로 부모를 고치지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 수납은 일자 복도의 실제 문으로 닿는 목적지이고 라벨만 존재하는 단절 공간이 아니다.
@evidence settings/002-household.md#design-subject-conditions 좁은 수납실 안의 열린 leaf와 가구가 지정 원통 통행을 막을 수 있음을 남겨 명목 opening으로 검사를 대체하지 않는다.
-->

[upper-corridor](#upper-corridor) ↔ [upper-storage](#upper-storage)의 직접 문 하나다. host wall은 [wall-corridor-storage](#wall-corridor-storage)이며 폭 방향 중심은 z=0.48m이고 clear width 0.90m, clear height 2.20m다. sill은 [2층 바닥](#upper-level)에 놓는다. 방 안쪽으로 열리는 문짝과 틀은 복도를 가로막지 않으며 그 열린 부재도 통행 원통 검사의 장애물에 포함한다.

문 구멍은 jamb·head 두께를 더해 파생하고 route는 그 구멍의 중심에서 양쪽 cell 안으로 0.20m 이상 들어간다. [전수 검증](#stage-one-verification)에서 실제 shared wall span 안에 clear 폭과 frame이 들어가는지, route endpoint와 door-state가 실물 문과 맞는지 검사한다.

## 복도–설비실 문 {#corridor-service}

<!--
@evidence principles/core/common.md#declared-basis 별도 상층 설비실의 직접 접근에 z=-0.95 중심의0.90×2.20m 문을 채택한다.
@evidence principles/core/common.md#scope-preservation 설비실은 복도에서 출입하고 그 L자 전면부를 계단 경유로 들어가는 추가 통로로 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 실제 wall host·upper sill과 room 안쪽 열림을 지정하고 양 endpoint가 각각의 cell에 들어가야 함을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 독립 설비실 프로그램을 L자 후방 날개와 복도가 만나는 측면 문으로 구체화한다.
@evidence principles/design/spaces.md#space-topology corridor-service는 복도에서 upper-service의 후방 cell로 진입하며 열린 seam을 통해 전면부로 이어진다.
@evidence principles/design/spaces.md#space-boundary-authority service 합집합 외주가 host span을 결정하고 이 opening은 중심·clear 치수와 방 안쪽 열림 및 route 접속을 소유한다.
@evidence principles/design/spaces.md#space-verification-address host 범위·route endpoint와 열린 leaf·세탁 설비의 간섭을 이 문 id에서 대조한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 별도 설비실과 단일 corridor의 연결을 후방 날개에 대조했다. 상층 계단이나 수납을 통과하는 부모 그래프 변경 없이 직접 문이 배정된다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 설비 코어를 단일 일자 복도에 직접 연결하고 상층의 단절된 목적지를 남기지 않는다.
@evidence settings/002-household.md#design-subject-conditions 설비실 안쪽 열린 leaf를 원통 장애물로 유지하며 실제 정비 작업 반경이나 사람의 안전성 인증으로 확대하지 않는다.
-->

[upper-corridor](#upper-corridor) ↔ [upper-service](#upper-service)의 직접 문 하나다. host wall은 [wall-corridor-service](#wall-corridor-service)이며 폭 방향 중심은 z=-0.95m이고 clear width 0.90m, clear height 2.20m다. sill은 [2층 바닥](#upper-level)에 놓는다. 방 안쪽으로 열리는 문짝과 틀은 복도를 가로막지 않으며 그 열린 부재도 통행 원통 검사의 장애물에 포함한다.

문 구멍은 jamb·head 두께를 더해 파생하고 route는 그 구멍의 중심에서 양쪽 cell 안으로 0.20m 이상 들어간다. [전수 검증](#stage-one-verification)에서 실제 shared wall span 안에 clear 폭과 frame이 들어가는지, route endpoint와 door-state가 실물 문과 맞는지 검사한다.

## 현관·작업실 공유 벽 {#wall-entry-flex}

<!--
@evidence principles/core/common.md#declared-basis 현관 +X와 작업실 -X의 clear face를 입력으로 받아 평균 중심면과 실제 gap을 벽으로 해석한다.
@evidence principles/core/common.md#scope-preservation 작업실의 독립 경계를 전 길이에 남기되 entry-flex 하나만 통과시켜 방을 연속 공용부로 합치지 않는다.
@evidence principles/core/common.md#substantive-completion 겹치는 외주 segment·층 높이·인접 두 room과 유일 opening을 정해 양쪽 방 사이 벽의 존재를 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 현관 직결 작업실 관계를 닫힌 공유 벽과 한 pocket opening의 조합으로 세분화한다.
@evidence principles/design/spaces.md#space-topology entry와 flex-workroom은 이 경계의 양쪽 room이고 통과는 entry-flex에 한정된다.
@evidence principles/design/spaces.md#space-boundary-authority 양 face 평균에서 plane을 구하고 gap을 datum 내벽 두께와 대조하여 방마다 별도 벽 중심을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 포켓 개구 밖의 무단 틈, 서로 다른 중심면과 중복 면을 이 shared boundary의 검증으로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 1층 직결 작업실과 내벽 datum을 두 room의 마주보는 face에 대조했다. 부모 연결은 유지하며 공간 boundary에서 닫힌 부분과 문을 정할 수 있다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 현관 직결 가변실의 실제 벽과 문 관계를 남겨 cell 라벨만으로 독립 방을 주장하지 않는다.
-->

[entry](#entry)의 +X clear face와 [flex-workroom](#flex-workroom)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [entry-flex](#entry-flex)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 현관·공용부 공유 벽 {#wall-entry-common}

<!--
@evidence principles/core/common.md#declared-basis 현관 후면과 공용부 전면 clear face의 겹침을 shared wall의 근거로 삼는다.
@evidence principles/core/common.md#scope-preservation 현관에서 공용부로의 개구를 보존하면서 나머지 경계를 실물 벽으로 채워 무소유 띠를 남기지 않는다.
@evidence principles/core/common.md#substantive-completion 두 room의 마주보는 +Z/-Z face·층 수직 범위·entry-common을 지정해 접속과 닫힘을 구별한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공용부 직결 요구를 두 room 사이의 shared boundary와 한 leafless opening으로 전개한다.
@evidence principles/design/spaces.md#space-topology entry와 common-room은 이 벽에서 만나지만 passage는 entry-common을 통해서만 생긴다.
@evidence principles/design/spaces.md#space-boundary-authority wall plane은 두 face 평균이고 전체 span은 겹침 길이여서 별도의 공용부 전면 좌표를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 문 밖 route 관통과 두 겹 벽·닫히지 않은 틈을 actual boundary와 connector의 대조로 검출한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 현관 직결 후면 공용부와 단일 계단 동선을 이 shared span에 대조했고 추가 corridor 없이 개구를 둘 수 있다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 후면 연속 공용부로 바로 들어가는 개구의 host를 실제 두께 있는 경계에 귀속한다.
-->

[entry](#entry)의 +Z clear face와 [common-room](#common-room)의 -Z clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [entry-common](#entry-common)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 현관·powder 공유 벽 {#wall-entry-powder}

<!--
@evidence principles/core/common.md#declared-basis powder 동측과 현관 서측 clear face를 공통 경계의 입력으로 삼으며 높이는1층 datum에서 받는다.
@evidence principles/core/common.md#scope-preservation 코어 위생실의 닫힌 성격과 현관 직접 문을 함께 남겨 문 이외의 측면 누락을 허용하지 않는다.
@evidence principles/core/common.md#substantive-completion adjacent spaces 두 개와 entry-powder 하나를 지정하고 벽의 길이·중심·두께 도출 규칙을 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 현관에서 접근하는 powder 배치를 위생실과 현관의 shared face 및 한 opening 관계로 좁힌다.
@evidence principles/design/spaces.md#space-topology 이 경계는 powder와 entry만 분리하며 수납이나 계단에 별도 passage를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority powder +X/entry -X의 차이를 내벽 datum과 비교하므로 불일치를 임의 두께로 흡수하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 실제 opening 밖의 powder 진입, 서로 다른 plane과 중복 마감을 같은 경계 id에서 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 현관 직접 위생실과 우측 코어 조건을 두 clear face에 대조했다. 이 벽의 구성 때문에 부모의 위생실 위치나 통행 그래프를 바꾸지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 우측 코어 위생실은 실물 경계로 닫히고 현관문을 통해 끊김 없이 닿는다.
-->

[powder-utility](#powder-utility)의 +X clear face와 [entry](#entry)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [entry-powder](#entry-powder)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 공용부·수납 공유 벽 {#wall-common-storage}

<!--
@evidence principles/core/common.md#declared-basis storage의 후면과 common의 전면 face가 겹치는 길이를 수납 문이 있는 벽의 범위로 정한다.
@evidence principles/core/common.md#scope-preservation 수납을 후면 공용부에 직접 연결하되 문 바깥은 닫아 별도 room의 범위를 유지한다.
@evidence principles/core/common.md#substantive-completion common-storage를 유일 opening으로 두고 두 room과 ground datum에서 wall span·plane·높이를 도출한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공용부에서 수납으로 가는 edge에 두꺼운 boundary와 문 외 폐쇄 면을 부여한다.
@evidence principles/design/spaces.md#space-topology 이 boundary의 adjacent spaces는 common-room과 storage-1f뿐이며 수납 접근은 명시 문을 따른다.
@evidence principles/design/spaces.md#space-boundary-authority 수납·공용부 clear 좌표를 받아 gap 평균과 차이를 사용하고 wall의 두 번째 치수 원본을 두지 않는다.
@evidence principles/design/spaces.md#space-verification-address common-storage route와 wall cut의 일치, 개구 밖 관통과 이중 wall을 전수 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 1층 수납의 공용부 직결 배치를 공유 face와 문에 대조했다. 현관으로 새 출입을 돌리는 부모 변경은 필요하지 않다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 불투명 코어의 수납도 실제 문과 경계를 갖는 방으로 두어 도달성을 공간 라벨에 맡기지 않는다.
-->

[storage-1f](#storage-1f)의 +Z clear face와 [common-room](#common-room)의 -Z clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [common-storage](#common-storage)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 복도·주침실 공유 벽 {#wall-corridor-primary}

<!--
@evidence principles/core/common.md#declared-basis 복도 후면과 주침실 전면 face의 평균을 wall plane으로 삼고 upper datum을 높이 입력으로 쓴다.
@evidence principles/core/common.md#scope-preservation 후면 주침실의 사적 경계를 유지하면서 복도 끝의 한 직접 문을 보존한다.
@evidence principles/core/common.md#substantive-completion corridor-primary의 host와 adjacent rooms를 지정하고 clear face 겹침 전체를 벽 길이로 결정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주침실의 복도 직접 접근에 room 분리 wall과 한 opening의 실물 결합을 추가한다.
@evidence principles/design/spaces.md#space-topology 복도와 주침실의 사이만 경계로 삼고 나머지 침실과의 관계를 이 wall에 섞지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 주침실·복도의 Z face를 소비해 경계를 만들고 independently authored wall 좌표를 허용하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 후면 문 route의 실제 cut 통과와 문 바깥의 틈·중복 면을 shared wall 단위로 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 일자 복도에서 주침실로의 직접 문과 datum 두께를 마주보는 face에 대조했고 부모 침실·복도 구성을 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 주침실은 단일 복도의 실제 경계에 문을 갖고 복도 연장이나 분기 없이 닿는다.
-->

[upper-corridor](#upper-corridor)의 +Z clear face와 [primary-bedroom](#primary-bedroom)의 -Z clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [corridor-primary](#corridor-primary)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 복도·작은 침실 1 공유 벽 {#wall-corridor-child-one}

<!--
@evidence principles/core/common.md#declared-basis 복도 동측과 첫 작은 침실의 서측 외주 겹침을 문 host로 삼으며 L자 내부 seam은 배제한다.
@evidence principles/core/common.md#scope-preservation L자 침실의 직결 연장부는 남기고 shared wall을 seam까지 잘못 연장해 방을 둘로 나누지 않는다.
@evidence principles/core/common.md#substantive-completion 양쪽 room·외주 겹침·datum 높이와 corridor-child-one의 단독 통과를 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 첫 침실의 직접 문을 L자 외주와 복도 사이의 실제 boundary에 배정한다.
@evidence principles/design/spaces.md#space-topology 이 wall은 upper-corridor와 child-bedroom-1의 연장부를 나누고 지정 문에서만 연결한다.
@evidence principles/design/spaces.md#space-boundary-authority L자 cell 합집합의 외주와 복도 face의 겹침만 소비해 침실 내부 seam을 별도의 경계로 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 짧은 외주 span의 문 포함, 이중 중심면과 seam 폐쇄를 plan 및 실제 boundary로 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층의 직접 침실 문 조건을 L자 연장부 외주에 대조했다. cell seam을 닫거나 부모에 두 번째 복도를 추가할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 첫 작은 침실의 복도 직결을 실제 shared wall과 opening 관계로 보존한다.
-->

[upper-corridor](#upper-corridor)의 +X clear face와 [child-bedroom-1](#child-bedroom-1)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [corridor-child-one](#corridor-child-one)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 복도·작은 침실 2 공유 벽 {#wall-corridor-child-two}

<!--
@evidence principles/core/common.md#declared-basis 둘째 침실 서측과 복도 동측의 clear face 차이를 내벽 두께에 대조해 wall을 정한다.
@evidence principles/core/common.md#scope-preservation 동측의 두 번째 침실을 복도와 구분하는 실물 벽을 남기고 한 문만 통과시킨다.
@evidence principles/core/common.md#substantive-completion 상층 높이와 전체 겹침 span 및 corridor-child-two host를 확정해 방 경계가 실제 부재를 갖게 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 복도에 면한 두 번째 수면실에 닫힌 경계와 문 cut의 역할을 추가했다.
@evidence principles/design/spaces.md#space-topology 두 adjacent room은 upper-corridor와 child-bedroom-2이며 문 밖 경계는 통행을 허용하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority wall 중심면·두께·길이는 두 room face에서 도출하여 침실과 복도가 서로 다른 벽을 소유하지 않는다.
@evidence principles/design/spaces.md#space-verification-address corridor-child-two의 route가 실제 opening을 지나며 wall 밖 우회나 중복 face가 없는지 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 독립된 둘째 침실의 복도 문을 두 clear face의 겹침에 대조했고 다른 침실 통과로 부모 관계를 고치지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 두 작은 침실을 각각 실제 경계와 문이 있는 room으로 남기는 상층 조건을 답한다.
-->

[upper-corridor](#upper-corridor)의 +X clear face와 [child-bedroom-2](#child-bedroom-2)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [corridor-child-two](#corridor-child-two)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 복도·욕실 공유 벽 {#wall-corridor-bathroom}

<!--
@evidence principles/core/common.md#declared-basis 욕실 +X와 복도 -X face를 이 코어 경계의 입력으로 받아 upper floor–ceiling을 소비한다.
@evidence principles/core/common.md#scope-preservation 욕실과 복도 사이를 닫되 직접 문을 유지하고 위생 room을 통과실로 합치지 않는다.
@evidence principles/core/common.md#substantive-completion boundary의 두 room과 유일 corridor-bathroom opening 및 plane/span 산식을 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 욕실 직결 조건을 코어 측면의 문 있는 shared boundary로 구체화한다.
@evidence principles/design/spaces.md#space-topology upper-bathroom과 upper-corridor만 이 wall에 인접하며 통행 connector는 지정 문에 귀속한다.
@evidence principles/design/spaces.md#space-boundary-authority 두 face 간 gap이 datum과 다르면 입력 모순으로 실패하고 욕실의 넓이를 벽 쪽에서 임의 보정하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 욕실 문 밖 route·개구 없는 틈과 중복 마감은 actual boundary 검증의 실패 항목이다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 불투명 코어와 복도 직접 위생 접근을 shared face에 대조해 부모의 room 배치나 corridor 형식 변경이 필요하지 않았다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 코어 욕실을 단일 복도에 실제 문으로 연결하며 벽 없는 논리 구획으로 남기지 않는다.
-->

[upper-bathroom](#upper-bathroom)의 +X clear face와 [upper-corridor](#upper-corridor)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [corridor-bathroom](#corridor-bathroom)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 복도·상층 수납 공유 벽 {#wall-corridor-storage}

<!--
@evidence principles/core/common.md#declared-basis 상층 수납 동측과 복도 서측 face의 겹침 전체가 이 짧은 문 host의 근거다.
@evidence principles/core/common.md#scope-preservation 수납 room을 분리하는 벽과 단독 문을 함께 남겨 작은 방을 장식 라벨로 축소하지 않는다.
@evidence principles/core/common.md#substantive-completion 두 clear face로 center/thickness/span을 도출하고 corridor-storage만 통과시키도록 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation linen 수납의 독립 접근에 짧은 실제 shared wall의 닫힘과 문 구멍을 배정한다.
@evidence principles/design/spaces.md#space-topology upper-storage와 upper-corridor의 경계이며 설비실·욕실을 통과 대상으로 혼입하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 수납 room의 짧은 z 범위를 그대로 소비하고 문에 맞추려고 wall span을 room 밖으로 늘리지 않는다.
@evidence principles/design/spaces.md#space-verification-address 실제 shared span과 문 frame, 개구 밖 통행 및 두 겹 wall 여부를 이 경계에서 대조한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 직접 상층 수납이라는 조건을 짧은 sidewall과 비교해 문 배정을 유지했다. 부모의 수납 프로그램을 삭제하거나 코어 통과실로 바꿀 이유는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 상층 수납의 닫힌 방 경계와 일자 복도의 직접 접근을 함께 보존한다.
-->

[upper-storage](#upper-storage)의 +X clear face와 [upper-corridor](#upper-corridor)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [corridor-storage](#corridor-storage)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 복도·설비실 공유 벽 {#wall-corridor-service}

<!--
@evidence principles/core/common.md#declared-basis 설비실 L자의 동측 외주와 복도 서측의 겹침만 wall 범위로 쓰며 내부 seam은 제외한다.
@evidence principles/core/common.md#scope-preservation 별도 설비실의 독립 경계와 한 직접 방문을 남기고 전면 계단 측벽과 혼동하지 않는다.
@evidence principles/core/common.md#substantive-completion upper-service·upper-corridor와 corridor-service의 결합 및 공통 datum 기반 wall 산출을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상층 설비실의 직접 출입에 L자 후방 날개 외주를 host로 사용하는 공간 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 이 경계는 service 후방 cell과 복도를 나누며 문을 지나 열린 seam으로 설비실 전체에 닿는다.
@evidence principles/design/spaces.md#space-boundary-authority 합집합 외주 segment만 받아 face 평균을 계산하므로 cell 내부 접합선을 새 벽으로 삼지 않는다.
@evidence principles/design/spaces.md#space-verification-address service 문을 벗어난 route와 L자 seam의 오폐쇄·중복 면은 실제 plan 및 경계 검사로 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 설비실의 별도 접근과 분기 없는 corridor 조건을 후방 shared face에 대조했고 부모에 추가 통로를 요청할 모순은 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 우측 설비 코어의 한 room이 복도의 실제 문으로 닿도록 하고 계단 옆 단절된 이름으로 남기지 않는다.
-->

[upper-service](#upper-service)의 +X clear face와 [upper-corridor](#upper-corridor)의 -X clear face 사이가 이 boundary다. 두 방의 서로 마주보는 외주 segment가 겹치는 전체 길이를 사용하며 L자 내부 seam은 외주로 세지 않는다. center plane은 두 clear face 위치의 산술 평균으로 도출한다. 두 face 사이 거리가 [내벽 두께](#mass-and-storeys)와 다르면 방 경계 입력의 모순으로 검사에 실패한다.

수직 범위는 두 방이 속한 층의 floor–ceiling이다. boundary의 adjacent spaces는 이 두 room뿐이고 [corridor-service](#corridor-service)가 유일한 통과 opening이다. room cell이 벽 geometry를 대신하지 않으며 구조 몸체는 해당 층 owner, 양쪽 노출 내측 마감은 각 방 owner가 맡는다. [전수 검증](#stage-one-verification)에서 서로 다른 중심면, 벽을 가로지르는 route, opening 없이 통과하는 틈과 중복 면을 검출한다.

## 1층 코어 내부 경계 {#wall-powder-storage}

<!--
@evidence principles/core/common.md#declared-basis powder 후면과 수납 전면 face가 마주보는 부분을 문 없는 코어 내부 벽으로 정한다.
@evidence principles/core/common.md#scope-preservation 위생실과 수납실을 독립 목적지로 남기며 두 방의 맞닿음을 통과 허가로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 겹침 segment 전체 폐쇄와 층 높이, opening·connector 없음 및 구조/마감 담당을 확정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 코어 기능의 독립 사용에 출입 없는 실제 분리 boundary를 추가한다.
@evidence principles/design/spaces.md#space-topology 두 방은 인접하지만 서로 통행하지 않고 각각 현관과 공용부의 문을 사용한다.
@evidence principles/design/spaces.md#space-boundary-authority 중심과 두께는 두 room face에서 얻고 datum과 다르면 실패하므로 별도 코어 분할선을 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 누락된 칸막이와 powder→storage의 금지 route를 닫힌 경계의 반례로 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 독립 위생·수납 목적지와 ground graph를 대조해 각자의 출입만 유지할 수 있으므로 부모에 코어 통과 동선을 추가할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 불투명 코어의 방들을 실제 경계로 나누고 단절을 해소한다는 이유로 임의의 문을 늘리지 않는다.
-->

[powder-utility](#powder-utility)의 +Z 외주 clear face와 [storage-1f](#storage-1f)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 작업실·공용부 경계 {#wall-flex-common}

<!--
@evidence principles/core/common.md#declared-basis 작업실 후면과 공용부 전면의 clear face 겹침을 닫힌 벽의 입력으로 사용한다.
@evidence principles/core/common.md#scope-preservation 현관 직결 작업실의 독립성을 남기며 뒤쪽 공용부로 추가 출입을 뚫지 않는다.
@evidence principles/core/common.md#substantive-completion 두 room의 전체 겹침·floor–ceiling·무개구 조건을 정해 실제 폐쇄 경계가 되게 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작업실과 공용부의 인접 배치에 통행 없는 분리면이라는 관계를 더한다.
@evidence principles/design/spaces.md#space-topology flex와 common은 이 벽을 공유하지만 각자의 현관 연결을 통해서만 왕래한다.
@evidence principles/design/spaces.md#space-boundary-authority 방 외주 평균과 차이로 wall을 산출하여 공용부나 작업실의 깊이를 벽에서 재작성하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 이름 없는 후면 passage와 wall 누락·이중 plane을 plan과 경계 산출물에서 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 작업실의 현관 직접 접근 및 연속 공용부 요구를 이 닫힌 경계에 대조했다. 공용부 경유 출입으로 부모를 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 가변 작업실의 현관 직결 관계를 유지하면서 후면 생활 구역과 실물 벽으로 구별한다.
-->

[flex-workroom](#flex-workroom)의 +Z 외주 clear face와 [common-room](#common-room)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 작은 침실 사이 경계 {#wall-child-one-two}

<!--
@evidence principles/core/common.md#declared-basis 첫 침실 +Z와 둘째 침실 -Z의 외주 겹침에서 두 수면실 사이 벽을 도출한다.
@evidence principles/core/common.md#scope-preservation 두 작은 침실을 별도 room으로 보존하고 사이 문이나 열린 틈으로 하나의 통과실을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion L자 내부 seam을 뺀 외주 전체에 opening 없는 upper-height wall을 배정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 작은 bedroom 프로그램을 실제 두께를 가진 폐쇄 분리면으로 공간화한다.
@evidence principles/design/spaces.md#space-topology child1과 child2는 인접하지만 각자의 복도 문을 통해 접근하며 직접 통과하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority L자 합집합 외주를 입력으로 써 첫 침실의 내부 seam과 두 방 사이 외주를 구분한다.
@evidence principles/design/spaces.md#space-verification-address 두 수면실 사이 금지된 connector와 무벽 틈을 이 boundary의 실패로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 두 개의 독립 작은 침실과 각각의 복도 출입에 이 폐쇄 경계를 대조했다. 방을 합치거나 통과실로 부모를 수정할 이유는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 작은 침실 둘이 실제 별도 방으로 남으며 다른 침실을 거치는 접근을 만들지 않는다.
-->

[child-bedroom-1](#child-bedroom-1)의 +Z 외주 clear face와 [child-bedroom-2](#child-bedroom-2)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 작은 침실 2·주침실 경계 {#wall-child-two-primary}

<!--
@evidence principles/core/common.md#declared-basis 둘째 작은 침실의 후면과 주침실 전면 face가 만나는 전체 segment를 닫는다.
@evidence principles/core/common.md#scope-preservation 주침실과 자녀 침실의 독립 경계를 유지하여 세 수면실 프로그램을 축소하지 않는다.
@evidence principles/core/common.md#substantive-completion shared span·upper datum·무개구 조건과 양면 마감 책임을 정해 분리벽의 빈자리를 남기지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 bedroom의 별도 출입에 room 간 직접 통행을 차단하는 실물 boundary를 추가했다.
@evidence principles/design/spaces.md#space-topology child2와 primary 사이에는 connector가 없고 두 방 모두 단일 복도의 자기 문을 사용한다.
@evidence principles/design/spaces.md#space-boundary-authority clear face 평균과 gap을 소비하여 주침실 전면선이나 child2 깊이를 새로 정하지 않는다.
@evidence principles/design/spaces.md#space-verification-address wall 없이 이어진 침실과 명시되지 않은 room-to-room passage를 검증 실패로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 세 침실과 복도 직접 연결을 두 방의 마주보는 face에 대조했다. 그 사이에 문을 요구하는 부모 모순은 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 주침실과 둘째 작은 침실을 실제 경계로 나누며 복도의 직접 연결을 우회하지 않는다.
-->

[child-bedroom-2](#child-bedroom-2)의 +Z 외주 clear face와 [primary-bedroom](#primary-bedroom)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 상층 설비·수납 경계 {#wall-service-storage}

<!--
@evidence principles/core/common.md#declared-basis 설비실 L자의 후면 외주와 수납 전면을 문 없는 코어 경계로 채택한다.
@evidence principles/core/common.md#scope-preservation 설비와 linen 수납을 독립 room으로 유지하고 하나를 다른 방의 접근 통로로 쓰지 않는다.
@evidence principles/core/common.md#substantive-completion room 외주 겹침 전체의 폐쇄와 upper datum 및 opening 부재를 지정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 별도 설비·수납 프로그램에 문 없는 실제 인접 경계를 부여한다.
@evidence principles/design/spaces.md#space-topology service와 storage는 붙어 있지만 각자의 복도 문을 이용하며 이 boundary에는 통과 connector가 없다.
@evidence principles/design/spaces.md#space-boundary-authority service의 내부 seam은 제외하고 합집합 외주와 수납 face만 wall 위치 입력으로 받는다.
@evidence principles/design/spaces.md#space-verification-address 설비실에서 수납으로 새는 틈과 두 room의 다른 plane 또는 누락 wall을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 설비실과 수납의 별도 직접 접근을 이 닫힌 경계에 대조했다. 두 기능을 통과 관계로 부모에서 재배정할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 코어 내부도 독립 방 경계와 복도 출입을 갖추며 무소유 통로를 만들지 않는다.
-->

[upper-service](#upper-service)의 +Z 외주 clear face와 [upper-storage](#upper-storage)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 상층 수납·욕실 경계 {#wall-storage-bath}

<!--
@evidence principles/core/common.md#declared-basis 상층 수납 후면과 욕실 전면 clear face를 입력으로 두 코어 기능을 분리한다.
@evidence principles/core/common.md#scope-preservation linen room과 욕실을 합치지 않고 각각의 복도 직접 문을 보존한다.
@evidence principles/core/common.md#substantive-completion 마주보는 전체 외주 길이를 upper floor–ceiling의 무개구 wall로 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 위생·수납의 별도 목적지 역할에 통행 없는 분리 boundary를 추가한다.
@evidence principles/design/spaces.md#space-topology storage와 bathroom의 인접성은 이 벽이 표현하고 통행은 각 room의 복도 portal이 소유한다.
@evidence principles/design/spaces.md#space-boundary-authority 두 face 사이의 거리와 평균으로 벽을 정해 욕실 깊이나 수납 길이를 경계 쪽에서 변경하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 개구 없는 두 코어 room 사이 passage와 wall의 틈·중복을 전수 검증에 연결한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 상층 수납·욕실과 단일 복도의 직접 접근을 닫힌 분리면에 대조했고 부모의 room 수나 접근을 바꿀 이유가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 욕실과 수납이 실제 개별 방으로 닿게 하며 하나를 다른 하나의 경유실로 만들지 않는다.
-->

[upper-storage](#upper-storage)의 +Z 외주 clear face와 [upper-bathroom](#upper-bathroom)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 욕실·주침실 측면 경계 {#wall-bath-primary}

<!--
@evidence principles/core/common.md#declared-basis 욕실 동측과 주침실 서측이 겹치는 clear face 부분을 닫힌 측면 벽으로 정한다.
@evidence principles/core/common.md#scope-preservation 가족이 복도에서 사용하는 욕실과 주침실을 구별하여 주침실 전용 우회 출입으로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 두 adjacent room과 무개구·upper datum·구조 및 마감 담당이 결정되어 있다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면 주침실과 코어 욕실의 나란한 배치에 직접 문 없는 분리 관계를 더했다.
@evidence principles/design/spaces.md#space-topology bath와 primary는 측면에서 인접하되 passage는 없으며 두 방은 각자의 복도 문에 닿는다.
@evidence principles/design/spaces.md#space-boundary-authority 욕실 +X와 주침실 -X의 겹치는 segment에서 wall을 도출해 새 코어 폭을 쓰지 않는다.
@evidence principles/design/spaces.md#space-verification-address 주침실에서 욕실로의 금지 통과·무벽 틈·다른 두 중심면을 검증 대상으로 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 욕실과 주침실의 복도 직결 조건에 닫힌 측면 경계를 대조했다. en-suite 출입을 부모에 추가할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 세 침실과 욕실이 일자 복도에서 각각 직접 닿는 그래프를 보존한다.
-->

[upper-bathroom](#upper-bathroom)의 +X 외주 clear face와 [primary-bedroom](#primary-bedroom)의 -X 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 설비실·복도 전면 경계 {#wall-service-corridor-front}

<!--
@evidence principles/core/common.md#declared-basis 설비실 전면부의 +Z 외주와 복도 -Z face 겹침을 닫힌 전면 boundary로 삼는다.
@evidence principles/core/common.md#scope-preservation 설비실 후방 측면의 단독 문을 유지하며 복도 전면을 추가 설비 통로로 뚫지 않는다.
@evidence principles/core/common.md#substantive-completion 두 face가 겹치는 부분만 닫고 opening과 connector를 두지 않는 상층 경계로 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation L자 설비실과 일자 복도의 인접을 기존 측면 출입과 구별한 닫힌 전면 면으로 구체화했다.
@evidence principles/design/spaces.md#space-topology service와 corridor의 이 접면은 통과하지 않고 corridor-service가 다른 측면에서 유일 출입을 제공한다.
@evidence principles/design/spaces.md#space-boundary-authority 두 clear face의 겹침만 소비하여 복도 전면의 계단 도착까지 wall을 연장하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 문 없는 전면을 관통한 route와 계단 도착으로 과도하게 연장된 경계를 actual plan에서 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 설비실의 직접 측면 문과 계단참에서 시작하는 복도를 겹침 segment에 대조했다. 부모의 계단 도착이나 복도 방향을 바꿀 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 계단참에서 시작하는 단일 복도를 보존하며 코어 전면에 이름 없는 추가 통로를 만들지 않는다.
-->

[upper-service](#upper-service)의 +Z 외주 clear face와 [upper-corridor](#upper-corridor)의 -Z 외주 clear face가 마주보는 겹침 segment 전체를 닫는 boundary다. L자 cell 내부 seam은 제외한다. 위치는 두 clear face의 평균이고 두께는 그 차이로 도출하여 [내벽 두께](#mass-and-storeys)와 같아야 한다. 높이는 두 방의 층 datum을 소비한다.

이 boundary에는 opening이나 통과 connector가 없다. 두 방의 합법적 출입은 각각의 room H2가 링크한 문으로만 가능하다. 구조 body는 층 owner, 양면 내측 마감은 해당 방 owner가 맡는다. [전수 검증](#stage-one-verification)은 벽이 없는 틈, 서로 다른 두 중심면과 금지된 방 사이 통과를 검사한다.

## 계단 구멍의 상층 측벽 {#stair-enclosure}

<!--
@evidence principles/core/common.md#declared-basis 계단 hole과 상층 두 room의 clear edge를 입력으로 닫힌 측벽과 열린 복도 도착을 구분한다.
@evidence principles/core/common.md#scope-preservation 계단 통과 구멍과 독립 침실·설비실을 모두 남기고 slab hole 안에 벽을 밀어 넣어 headroom을 줄이지 않는다.
@evidence principles/core/common.md#substantive-completion 동서 측벽과 child1 연장부 전면의 폐쇄, 복도 도착의 개방 및0.18m 후퇴 수리 이유를 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 단일 계단의 상층 접속에 방 경계와 구멍 가장자리 사이 실제 벽 두께를 확보하는 결정을 더했다.
@evidence principles/design/spaces.md#space-topology 계단은 북측 복도로만 도착하고 설비실·작은 침실 쪽에는 닫힌 경계가 있어 그 방으로 새지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 위치는 hole과 room clear edge에서 도출하며 child1의 현재 cell이 후퇴 좌표를 소유한다.
@evidence principles/design/spaces.md#space-verification-address 상층 plan·계단 section·실물 충돌에서 세 폐쇄 경계와 열린 도착 및 hole 침범을 함께 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 단일 계단과 복도 직결 조건을 상층 room edge에 대조해 child1 연장부만 내벽 두께 뒤로 물렸다. 부모의 층간 그래프를 변경할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 필수 계단 구멍의 통행을 보존하면서 다른 방을 거치지 않고 상층 일자 복도로 도착한다.
-->

[계단 바닥 개구](#stair-opening)의 서측과 [upper-service](#upper-service)의 동측, 동측과 [child-bedroom-1](#child-bedroom-1)의 서측 사이에 각각 [내벽 두께](#mass-and-storeys)의 닫힌 측벽을 둔다. 위치는 서로 마주보는 clear edge의 평균이다. 복도에 닿는 북측 도착 구간은 열고, child-bedroom-1의 연장부에 닿는 북측 구간은 방 외주 앞에 두께를 확보한 벽으로 닫는다.

child-bedroom-1의 짧은 연장부 전면은 계단 opening 북측에서 내벽 두께만큼 물러난다. 이 관계를 확보하기 위해 기존 z=-1.80 후보를 z=-1.62로 수리했으며 방의 현재 cell이 그 값을 소유한다. slab 구멍 안에 벽 두께를 넣어 상부 tread의 headroom을 줄이지 않는다. 전면의 얇은 slab strip은 계단 opening edge의 구조 여유이고 다른 room/corridor가 아니다. [전수 검증](#stage-one-verification)의 상층 plan·계단 section·실물 충돌에서 이 세 경계와 열린 도착을 대조한다.

## 현관·1층 수납 측면 경계 {#wall-entry-storage}

<!--
@evidence principles/core/common.md#declared-basis 수납 동측과 현관 서측의 전체 겹침을 common-storage의 유일 출입과 대조해 닫힌 벽으로 정했다.
@evidence principles/core/common.md#scope-preservation 수납의 현관 쪽 경계도 생략하지 않아 코어 뒤에 이름 없는 통로가 생기지 않는다.
@evidence principles/core/common.md#substantive-completion 전체 z segment의 폐쇄·무개구와 두 face의 plane/thickness 도출 및 구조·마감 소유를 확정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공용부 직결 수납이라는 결정의 반대쪽에 현관과 통행하지 않는 실제 측벽을 더한다.
@evidence principles/design/spaces.md#space-topology entry와 storage는 인접하지만 이 wall로 직접 연결되지 않으며 수납 진입은 common-storage를 따른다.
@evidence principles/design/spaces.md#space-boundary-authority 수납·현관의 clear face에서 중심과 두께를 받아 별도 수납 동측선을 저작하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 현관에서 이 벽을 관통하는 route와 누락 경계의 이름 없는 통로를 전수 검증에서 반증한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 공용부 직결 수납과 현관의 동선을 이 닫힌 측벽에 대조해 부모에 두 번째 수납문을 요구할 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 닫힌 코어 수납을 실제 방으로 유지하면서 허가되지 않은 분기 통로를 추가하지 않는다.
-->

[storage-1f](#storage-1f)의 +X clear face와 [entry](#entry)의 -X clear face가 마주보는 전체 z segment를 닫는다. center plane과 두께는 두 clear face에서 도출하고 [내벽 두께](#mass-and-storeys)와 대조한다. 수납의 유일한 출입은 [공용부 문](#common-storage)이므로 이 벽에는 opening이나 passage가 없다.

1층 owner가 구조 body를, 두 room owner가 각 내측 마감을 맡는다. [전수 검증](#stage-one-verification)은 현관에서 이 벽을 관통하는 route와 이름 없는 통로를 반증한다.

## 내벽 끝의 접합부 {#wall-junctions}

<!--
@evidence principles/core/common.md#declared-basis 각 boundary가 도출한 끝점·두께에서 잔여 직사각형을 판단하며 junction의 별도 절대 좌표는 만들지 않는다.
@evidence principles/core/common.md#scope-preservation 두 층의 T·교차 접합을 모두 닫되 room·문·계단 구멍을 채우는 범위 확대는 금지한다.
@evidence principles/core/common.md#substantive-completion 잔여 영역의 포함 배제와 인접 boundary id 정렬, 한 solid의 공유 참조 및 wall 끝의 맞댐을 정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation shared wall의 독립 소유를 유지하면서 끝 사이 작은 무소유 영역을 층 owner가 한 번 닫는 결합 규칙을 더한다.
@evidence principles/design/spaces.md#space-topology junction은 인접 wall 끝만 연결하며 room이나 opening의 통행 영역에 속할 수 없다.
@evidence principles/design/spaces.md#space-boundary-authority 동일 접합의 id를 정렬된 boundary 집합에서 만들고 모두 한 element를 참조해 중복 solid를 방지한다.
@evidence principles/design/spaces.md#space-verification-address 두 층 plan과 모서리 원근에서 틈·겹침·막힌 통로를 검사하여 wall 끝을 늘려 숨기는 수리를 금지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 층별 구조 소유와 완결 표면 조건을 내벽 끝 결합에 대조했다. 외벽 corner와 분담하면 부모의 표면 소유를 다시 나눌 필요가 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 방 사이 실물 경계의 빈틈을 닫되 문·계단을 막거나 추가 통행 공간을 발명하지 않는다.
-->

각 [층 owner](#ground-level)는 같은 층의 shared wall 끝 사이 접합을 한 번만 닫는다. 내벽의 중심면·두께·끝점은 각 boundary가 방 clear face로부터 도출하며 이 H2가 별도 좌표를 덮어쓰지 않는다. 서로 직교하는 wall strip 끝 사이에 남는 직사각형 중, 어떤 room cell·opening·계단 hole에도 속하지 않고 인접 wall 끝을 연결하는 부분만 junction solid로 귀속한다. 동일한 junction에 닿는 boundary id를 정렬하여 하나의 안정 id를 만들고 모든 인접 boundary가 같은 element를 참조한다.

예를 들어 entry–flex 벽의 뒤 끝과 entry/common·flex/common 벽 사이의 작은 교차부는 1층 junction 하나다. 양쪽 wall body를 서로 관통하도록 늘리지 않고 endpoint에서 그 solid에 맞닿게 한다. 상층 T접합과 L자 방 외주에도 같은 판정을 적용한다. boundary gap이 아니라 방·문·계단 구멍 안에 있는 부분은 채울 수 없다.

[2층 owner](#upper-level)도 같은 규칙으로 접합을 만들고, 외벽 모서리는 [입면 owner](003-surface-ownership.md#whole-surface-owners)가 소유하므로 층이 다시 채우지 않는다. [전수 검증](#stage-one-verification)의 두 층 plan과 모서리 perspective에서 틈·중복 solid·통로를 막는 junction을 검사한다.

## 입면·대지 인터페이스 {#envelope-interface}

<!--
@evidence principles/core/common.md#declared-basis room clear 외주·층 datum·roof canopy span을 받아 bay와 PV 반복의 근거로 쓰며 reference 픽셀은 사용하지 않는다.
@evidence principles/core/common.md#scope-preservation 외피 모양을 위해 room 경계와 floor line을 바꾸지 않고 대지 landing과 현관 sill의 실제 접합도 남긴다.
@evidence principles/core/common.md#substantive-completion 창호 host/span owner와 PV의 최대 pitch·ceil count·0.04m gap 및 대지 접속을 지정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation curtainwall·PV 요구를 room/floor 대응과 canopy span에서 반복 count를 구하는 공간 인터페이스로 구체화한다.
@evidence principles/design/spaces.md#space-topology 외피는 room 외주를 닫고 현관 opening은 대지 landing과 같은 sill에서 이어진다.
@evidence principles/design/spaces.md#space-boundary-authority glazing은 opening/room을, PV는 roof span을 소비하며 각 완결 owner가 파생 부재를 소유한다.
@evidence principles/design/spaces.md#space-verification-address bay와 방·층 경계 불일치 및 landing/sill의 단절을 전수 검증에 남긴다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 외피와 고정 그래프의 우선 관계를 room 기반 bay·PV span에 대조했다. 외관을 위해 부모 그래프나 층선을 바꿀 이유는 없다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 커튼월 베이를 내부 방·바닥선에 맞추고 단일 본채의 대지 진입을 실제 개구에 연결한다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy 전면·후면 유리와 PV 캐노피를 방·층 및 roof span을 소비하는 외피에 배정한다. 프라이버시 재질 상태의 시각 성공은 이 인터페이스만으로 주장하지 않는다.
-->

각 room의 clear 외주와 [층 datum](#mass-and-storeys)을 [외피 boundary](003-surface-ownership.md#whole-surface-owners)가 소비한다. [창호 인터페이스](003-surface-ownership.md#glazing-interface)가 반복 bay를 결정하고 각 opening H2가 host·span·sill·head를 소유한다. 외피를 더 크게 보이게 하려고 방 경계를 옮기거나 floor line을 지우지 않는다.

PV는 [캐노피 span](003-surface-ownership.md#roof-face)을 받아 x 방향 최대1.20m, z 방향 최대1.90m의 module로 등분한다. 각 방향 count는 ceil(span/maximum)이며 frame을 제외한 유효 panel은 pitch에서 0.04m gap을 뺀다. 공간 결정은 roof owner의 반복 점유 범위이며 실제 PV 부재·재료는 같은 완결 owner가 작성한다.

[대지 접근](001-citizen-house.md#site-access)의 마지막 landing이 [현관문](#front-entry)의 sill에 닿는다. [전수 검증](#stage-one-verification)은 이 외부/내부 접합과 모든 bay/방·층 경계를 함께 검사한다.

## 1단계의 미지급 검증 {#stage-one-verification}

<!--
@evidence settings/001-production.md#build-or-adopt 새 production source와 공개 engine 경계를 거친 산출물에서 공간을 읽도록 정해 기각된 box나 reference 이미지를 새 geometry의 검증값으로 채택하지 않는다.
@evidence settings/001-production.md#verification-boundary canonical lint 뒤 실제 산출물·GPU 관찰을 요구하고 측정되지 않은 질문은 unverified로 남긴다. 다른 명령으로 성공 수치를 대체하지 않는다.
@evidence settings/001-production.md#roles-and-accessibility 저작자는 수리하고 관찰자는 계측하며 독립 read-only reviewer가 현재 시각 판정을 내리는 역할을 구분한다. 작성자의 자체 검사로 그 판정을 대신하지 않는다.
@evidence settings/001-production.md#runtime-and-restart review 선언은 유지하며 영향받은 evidence·구현·시각 검사를 다시 닫는 제자리 재작성 경로를 따른다. stage 역행으로 열린 실패를 지우지 않는다.
@evidence settings/002-household.md#program-boundary 방과 통행의 구조·시각 질문을 실물 사용성이나 설비·대피·구조·에너지 인증으로 확대하지 않고 미측정 경계를 명시한다.
-->

<!--
@evidence principles/core/common.md#declared-basis 고정 그래프와 전체 관찰 분모가 검증 질문의 근거이며 표는 미지급 질문임을 명시한다.
@evidence principles/core/common.md#scope-preservation 모든 room·외부 노출면·개구 및 다섯 reference를 남기고 어려운 L자 관찰이나 실물 부재 검사를 줄이지 않는다.
@evidence principles/core/common.md#substantive-completion 층 귀속·도달·계단·분할·bay·전체 관찰에 각각 반례와 필요한 산출물을 배정해 무엇을 검증할지 결정했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 종료 조건을 현재 집의 slab 충돌·떠 있는 endpoint·무벽 구획 같은 구체 실패 질문으로 전개한다.
@evidence principles/design/spaces.md#space-topology room parent·실제 threshold 경유·단일 계단의 도착과 무소유 영역을 topology 검증의 분리된 질문으로 둔다.
@evidence principles/design/spaces.md#space-boundary-authority 수·위치·귀속은 새 컴파일 산출물에서 읽고 이 표가 구현과 다른 수동 room/문 census가 되지 않게 한다.
@evidence principles/design/spaces.md#space-verification-address 각 검증 항목에 실패 형태를 짝지어 논리 graph의 연결만으로 실물 벽·가구 관통을 승인하지 못하게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 전체 관찰과 시각 판정 조건을 미지급 질문에 대조했다. 현재 측정 부재는 unverified로 남기며 부모의 종료 분모를 줄이는 수정 근거로 사용하지 않는다.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements 모든 방의 층 귀속·실제 문과 단일 계단 도달 및 curtainwall 대응을 새 산출물과 GPU 관찰의 열린 검사로 남긴다.
@evidence settings/001-production.md#delivery-review-condition 전체 topology 관찰에 다섯 reference를 더하고 독립 시각 판정 전까지 재검토 완료를 선언하지 않는다.
-->

[새 제작과 공개 engine 채택](../settings/001-production.md#build-or-adopt)에 따라 새 source를 구현하여 [정해진 검증 실행 경계](../settings/001-production.md#verification-boundary)의 canonical lint와 engine 소비 경계를 지난 뒤 다음을 산출물에서 읽는다. 이 표는 결과 기록이 아니라 아직 지급되지 않은 질문이다.

| 질문 | 반례와 필요한 산출물 |
| --- | --- |
| 모든 방의 층 귀속 | room parent 누락/중복, storey 밖 cell |
| 현관에서 전 방 도달 | 실제 threshold를 지나지 않는 connector, 벽/가구 관통, 떠 있는 endpoint |
| 단일 계단의 층간 도달 | 참 밖 route, stairwell을 막는 slab, 상부 도착과 복도 불연속 |
| 완결 방 분할 | logical cell만 있고 실물 벽 없는 구획, 중첩/무소유 영역 |
| 유리와 실내 일치 | room boundary와 bay/jamb 또는 floor/transom 불일치 |
| 전체 관찰 분모 | setting, 노출 입면·모서리·지붕·하부·개구부·출입구와 모든 공간의 threshold·4 안쪽 모서리·중심 4방위, 두 L자 방의 추가 모서리 |
| reference 추가 질문 | 다섯 장을 각각 현재 실물 3D 화면과 대조, 절개는 검사로 표시 |

현재 위 항목 모두 새 산출물에 대해 unverified다. 조정자의 정정에 따라 stage는 review로 유지하며 열린 evidence·구현·시각 검사를 정해진 경로로 다시 닫는다. 이 수정안의 재검토는 [역할 분담](../settings/001-production.md#roles-and-accessibility)과 [단계 유지 권한](../settings/001-production.md#runtime-and-restart)에 따라 독립 read-only reviewer의 현재 시각 판정 전까지 완료되지 않는다. [프로그램 경계](../settings/002-household.md#program-boundary)가 구분한 실물 사용성·구조·에너지·대피 인증을 이 공간 검사로 대신하지 않는다.
