# 외부 보행면 아래의 바탕과 지지

## 낮은 포장의 두께와 경사 바탕 {#paving-depth-reservation}
<!--
@evidence principles/core/common.md#scope-preservation 세 낮은 보행면과 차도의 바탕 두께, 아래면 산출, 두 경사 연결로의 근사 오차와 분할, 합집합 안의 중복 바탕 금지를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 front-walk·side-walk·garden-lower-landing 0.12 m와 driveway 0.15 m 두께, 수직 차감 아래면, 두 연결로 오차·분할, T자·관리길 합집합 중복 금지가 본문에 모두 있는지 대조해 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 보행면 바탕 0.12 m와 driveway 0.15 m, `q = h11 - h10 - h01 + h00`와 최대 차이 `|q| / (4 × nX × nZ)`, 각 연결로를 X/Z 최소 네 구간으로 나누는 분할을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 `q = h11 - h10 - h01 + h00`, `|q| / 4`, `|q| / (4 × nX × nZ)`와 0.30 × 1.20 / 6.80 m 대입값 약 0.013235 m→0.000827 m(4×4 분할)이 산술로 맞음을 대조해 분할 결정이 완결됨을 확인했다.
@evidence principles/core/common.md#declared-basis 두께는 공간 점유 선택이고 콘크리트 배합·지지력 검증값이 아니며 약 0.013235 m와 0.000827 m는 저작 식의 해석이지 메시 측정이 아니라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 두께를 콘크리트 배합·지지력 검증이 아닌 점유 선택으로, 0.013235 m·0.000827 m를 컴파일 메시·GPU 측정이 아닌 식 해석으로 적은 본문을 대조해 각 수치의 근거 종류가 구분됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지 설정의 콘크리트 차도와 현관 보행길에 보이는 바탕 두께와 원래 높이식을 지키는 삼각형 분할 규칙을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 site-identity의 콘크리트 차도·현관 보행길에는 없는 0.12/0.15 m 바탕, 상면식에서 수직 차감한 아래면, 연결로 삼각 분할 규칙을 본문이 더하는지 대조해 부모 반복이 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology 각 바탕이 house-site/ground-storey의 해당 포장 owner에 속하고 연결로 끝선의 분할이 차도와 평탄 길의 공유 경계에 전달된다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 세 보행면·driveway 바탕이 house-site/ground-storey 외부 접근의 각 포장 owner에 속하고 연결로 끝선 분할이 차도·평탄 길 공유 경계에 전달된다는 본문을 대조해 접속 관계를 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 상면은 front-walk·side-walk·garden-lower-landing·driveway owner가 소유하고 바탕은 같은 owner가 함께 소유해 두 번째 불투명 판을 덧씌우지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 상면을 front-walk·side-walk·garden-lower-landing·driveway가 소유하고 '바탕과 마감은 기존 완결 포장 owner가 함께 소유'하는 본문을 대조해 같은 상면에 두 번째 판이 저작되지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 두 경사 연결로의 모든 셀 대각선 중점과 공유 끝선, T자 접합과 관리길 꺾임의 실제 높이를 원래 보간식과 대조한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 모든 셀 대각선 중점·공유 끝선·T자 접합·관리길 꺾임에서 삼각형 내부 높이를 원래 보간식과 storey-datums 허용 오차로 대조하는 검사 문단을 확인해 근사 주장의 반증 지점이 명시됨을 확인했다.
@evidence settings/10-house.md#site-identity 차고 진입 콘크리트 차도와 현관 보행길이 두께 있는 포장으로 읽히도록 바탕을 예약한다.
@evidenceReview settings/10-house.md#site-identity #452f15e site-identity의 차고 진입 콘크리트 차도·현관 보행길을 본문의 driveway 0.15 m·front-walk 0.12 m 바탕 예약에 대조해 두 포장이 두께 있는 몸체로 받쳐지고 자동차·주차 구역은 없음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 콘크리트 차도·보행길과 "측량/토목 인증이 아니다"를 대조했고 두께를 점유 예약으로 둘 수 있어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 site-identity의 콘크리트 차도·보행길과 비인증 단서를 0.12/0.15 m 점유 예약과 '배합·철근·지지력 검증값이 아니다'라는 본문에 대조해 설정 수정 없이 두께를 정할 수 있음을 확인했다.
-->

[house-site/ground-storey의 외부 접근](00-access.md#site-local-routes) 중 현관 보행길·측면 관리길·정원 아래 대기의 상면은 각각 [front-walk](front-walk.md#front-walk-plan), [side-walk](side-walk.md#side-walk-plan), [garden-lower-landing](terrace.md#garden-lower-landing-plan)이 소유한다. 이 세 보행면의 바탕 두께는 상면에서 Y 방향으로 0.12 m, [driveway](driveway.md#driveway-plan)는 0.15 m를 예약한다. [대지와 식재](../../settings/10-house.md#site-identity)의 차고 진입 콘크리트 차도와 현관 보행길은 이 두께 예약을 받는다. 이는 마감까지 포함한 공간 점유 선택이며 콘크리트 배합·철근·줄눈·지지력·차량 하중을 검증한 값이 아니다. 자동차나 별도 주차 구역을 추가하지 않는다.

각 바탕의 아래면은 원래 상면 높이식에서 자기 두께를 수직으로 뺀다. 경사면에 수직한 재료 두께와 혼동하지 않는다. 차도 양쪽 연결로는 위치 X와 Z를 함께 소비하는 원래 보간식을 위아래에 적용한다. 모서리 네 점만으로 임의 평면을 만들어 중간 높이를 바꾸지 않는다. T자 보행길과 관리길 세 띠의 합집합 내부에는 중복 바탕이나 가짜 옆면을 생성하지 않는다. 바탕과 마감은 기존 완결 포장 owner가 함께 소유하며 같은 상면에 두 번째 불투명 판을 덧씌우지 않는다.

두 연결로의 쌍선형 상면을 삼각형으로 근사할 때는 꼭짓점의 높이 일치만으로 [공유 허용 오차](../01-storeys.md#storey-datums)를 지불하지 않는다. 각 연결로 직사각형의 정규화 좌표를 u/v, 네 꼭짓점 높이를 h00/h10/h01/h11로 쓰면 곡률을 만드는 교차항은 `q = h11 - h10 - h01 + h00`이다. 사각형을 대각선 하나로 나눈 두 평면과 원래 보간식 사이의 최대 수직 차이는 `|q| / 4`이며 대각선 중점에서 나타난다. X/Z 방향을 각각 nX/nZ개로 균등 분할한 셀에서도 같은 관계를 적용하면 전체 최대 차이는 `|q| / (4 × nX × nZ)`다. 아래면은 같은 상면에서 일정 두께만 빼므로 같은 오차 한계를 갖는다.

현재 두 연결로의 Z 길이는 각 owner에서 1.20 m이고, 차도의 양 끝 높이 차 0.30 m와 길이 6.80 m를 소비하면 각각 `|q| = 0.30 × 1.20 / 6.80 m`다. 따라서 한 사각형을 두 삼각형으로만 덮으면 최대 차이가 약 0.013235 m다. 각 연결로의 경사 구간을 X/Z 각각 최소 네 구간으로 나누면 이론상 최대 차이는 약 0.000827 m로 줄어든다. 이 분할은 표면의 근사 예약이며 콘크리트 줄눈이나 별도 표면 owner를 만들지 않는다. 높이식·끝선·길이가 바뀌면 원래 owner에서 교차항과 분할을 다시 도출한다. 이 수치는 저작 식의 해석이며 컴파일된 메시나 GPU 정밀도를 측정한 결과가 아니다.

보행 가능 높이와 실제 불투명 바탕은 동일한 원래 높이식을 소비한다. 분할 꼭짓점은 그 식에 놓고 상면/아래면의 X/Z 분할을 대응시킨다. 연결로 끝선의 분할은 차도와 평탄 길의 공유 경계에도 전달하여 한쪽 삼각형 변 중간에서 다른 쪽 변이 끝나는 불일치를 남기지 않는다. 평탄면으로 넘어가는 선은 유지하고 경사 구간을 주변 길 전체로 넓히지 않는다. 보행용 표면 선언만 있고 눈에 보이는 바탕이 없는 상태는 완성으로 세지 않는다.

검사는 각 포장의 상면/아래면과 세로·가로 단면, 두 경사 연결로의 모든 셀 대각선 중점과 공유 끝선, T자 접합과 관리길 꺾임이다. 꼭짓점뿐 아니라 삼각형 내부의 실제 높이를 원래 보간식과 대조하며, 인접한 포장의 공유 경계와 수직 두께도 같은 산출물에서 읽는다. [공유 허용 오차](../01-storeys.md#storey-datums)로 높이식·수직 두께·빈틈/중복을 대조하고 [전체 관찰](../04-observations.md#spatial-observation-derivation)을 유지한다. 두께 입력과 근사 오차의 해석은 실제 지지나 경사 연결 측정이 아니며 바탕·표면·통행·접지는 unverified다.

## 높은 포치와 테라스의 닫힌 단면 {#raised-platform-support}
<!--
@evidence principles/core/common.md#scope-preservation 높은 포치와 테라스의 상부판, 가장자리 지지벽, 내부 채움, 외부 단 몸체, 포치 세 기둥 아래 지지를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 포치·테라스 상부판, 0.15 m 가장자리 지지벽, 평탄면 아래 채움, 외부 단 몸체, 세 기둥 받침 아래 수직 지지를 각각 배정하는지 대조해 높은 두 평탄면 단면에 빠진 부분이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 평탄면 외곽 안쪽에 폭 0.15 m 가장자리 지지벽을 두고 상부판 아래부터 자기 낮은 대기의 바탕 아래면까지 닫는 단면을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 외곽 안쪽 0.15 m 지지벽을 상부판 아래에서 자기 낮은 대기 바탕 아래면까지 닫고 단 몸체도 같은 하단까지 닫는 본문을 대조해 떠 있는 판 없이 단면이 결정됨을 확인했다.
@evidence principles/core/common.md#declared-basis 상부판 두께는 paving-depth-reservation, 기둥 받침 평면은 porch-roof-columns에서 받고 공통 하단이 지도 지표나 기초 깊이가 아니라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 상부판 두께를 paving-depth-reservation, 기둥 받침 평면을 porch-roof-columns, 뒤끝을 ground-threshold-junctions에서 받고 공통 하단을 지표·기초 깊이가 아니라 적은 본문을 대조해 근거를 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 현관 포치와 외부 진입의 "주변 보도보다 0.35–0.55 m 높고 실제 단"과 테라스를 떠 있는 판이 아닌 닫힌 몸체로 만드는 지지 배정을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 porch-entry의 '주변 보도보다 0.35–0.55 m 높고 실제 단' 조건에 없는 0.15 m 지지벽·채움·단 몸체 하단 배정을 본문이 포치와 테라스 모두에 더하는지 대조해 부모 반복이 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology 평탄면 아래를 사람이 쓰는 빈 공간 없이 채우고 끝 지지벽과 단 몸체가 공유 면에서 접하게 한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 평탄면 아래를 사람이 쓰는 빈 공간 없는 채움으로 두고 끝 지지벽과 단 몸체가 공유 면에서 접하며 같은 부피에 두 몸체를 겹치지 않는 본문을 대조해 내부 포함·인접 관계를 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 포치 아래 대기는 front-walk, 정원 단과 아래 대기는 terrace owner가 유지하고 기둥 위치나 개수를 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 포치 아래 대기는 front-walk, 정원 단과 아래 대기는 terrace owner가 유지하고 기둥 위치·개수를 porch-roof-columns에서 복제하지 않는 본문을 대조해 지지 구역이 공유 값을 재저작하지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 두 평탄면 전체 외곽, 단의 중앙/양옆, 상부판과 지지벽의 만남, 포치 기둥 세 곳의 수직 단면에서 떠 있는 판과 묻힌 단을 찾는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 두 평탄면 전체 외곽, 단 중앙/양옆, 상부판·끝 지지벽 만남, 낮은 대기 접점, 기둥 세 곳 수직 단면에서 떠 있는 판·묻힌 단·중복 대기를 찾는 검사를 대조해 반증 지점을 확인했다.
@evidence settings/10-house.md#porch-entry 주변 보도보다 높은 포치 바닥과 실제 단을 닫힌 지지 몸체로 받친다.
@evidenceReview settings/10-house.md#porch-entry #a9f9880 porch-entry의 높은 포치 바닥과 실제 단을 본문의 상부판·0.15 m 지지벽·단 몸체 하단 배정과 '두께를 이유로 단 높이/깊이를 바꾸지 않는다'에 대조해 포치 조건이 닫힌 몸체로 받쳐짐을 확인했다.
@evidence settings/10-house.md#site-identity 후면 정원의 작은 포장 테라스를 같은 방식의 닫힌 단면으로 받친다.
@evidenceReview settings/10-house.md#site-identity #452f15e site-identity의 후면 작은 포장 테라스를 본문의 garden-terrace 상부판·지지벽·채움·정원 단 몸체 배정에 대조해 테라스가 포치와 같은 닫힌 단면으로 받쳐짐을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work porch-entry의 0.35–0.55 m 높이·실제 단과 site-identity의 테라스를 지지 단면에 적용했고 기존 단 높이/깊이를 바꾸지 않고 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 porch-entry의 0.35–0.55 m·실제 단과 site-identity 테라스를 세 챌판·두 디딤 유지 문장과 지지 하단 배정에 대조해 단 치수를 바꾸지 않고 지지가 성립하므로 부모 수정이 없음을 확인했다.
-->

[현관 포치](../porch.md#porch-platform-access)와 [정원 테라스](terrace.md#garden-terrace-plan)는 자기 높은 평탄면과 외부 단을 유지한다. 포치 바닥이 주변 보도보다 높고 실제 단이 이어진다는 조건은 [현관 포치와 외부 진입](../../settings/10-house.md#porch-entry)에서 받는다. 두 평탄면의 상부판 두께는 [보행 포장 예약](#paving-depth-reservation)을 소비한다. 각 평탄면의 외곽 안쪽에 폭 0.15 m의 가장자리 지지벽을 예약하고, 상부판 아래부터 자기 낮은 대기의 바탕 아래면까지 닫는다. 이 하단은 포치 앞/정원 뒤의 기존 대기와 접합할 건물 쪽 기준이며 지도 지표나 기초 바닥 깊이가 아니다. 지지벽을 상면 위로 올려 새 연석·난간을 만들거나 기존 순폭을 줄이지 않는다.

평탄면 아래의 내부는 상부판을 받치는 채움 구역으로 계획하고 사람이 사용하는 빈 공간을 두지 않는다. 지지벽과 채움은 같은 경계에서 만나며 같은 부피에 두 몸체를 겹치지 않는다. 외부 단의 몸체는 원래 챌판/디딤의 단면에서 같은 낮은 대기 바탕 아래면까지 닫는다. 높은 평탄면의 끝 지지벽과 단 몸체는 공유 면에서 접하고, 각 디딤 밑을 빈 공중판으로 남기지 않는다. 상부판·지지벽·단이 만나는 몸체는 한 번만 배정하고 내부에 겹친 면을 남기지 않는다. 상면·챌면·양옆 노출 면은 기존 완결 owner가 통합한다.

포치 아래 대기 바닥은 front-walk owner가 유지하고 포치가 복제하지 않는다. 정원 단과 아래 대기는 terrace owner가 한 몸체 경계로 잇는다. 원래 세 챌판·두 수평 디딤과 도착 바닥의 관계를 유지하며 두께를 이유로 단 높이/깊이를 바꾸지 않는다. 본채 벽에 닿는 뒤끝은 [건물 문턱 인계](../10-ground-floor.md#ground-threshold-junctions)를 소비하고 본채 내부로 상부판·지지벽을 밀어 넣지 않는다.

포치의 [세 기둥 받침](../porch.md#porch-roof-columns) 아래에는 그 받침 평면을 소비하는 수직 지지 구역을 상부판 아래에서 위 공통 하단까지 배정한다. 별도 기둥 위치나 개수를 복제하지 않는다. 지지벽과 겹치는 부분은 하나의 몸체로 합치고 내부 채움에서 제외한다. 받침 상면과 바닥 위 기둥 높이는 기존 값을 유지하며 바닥판만으로 기둥 하중을 검증했다고 세지 않는다. 이 지지와 이후 실제 기초의 접속은 porch owner의 남은 일이다.

검사는 두 높은 평탄면의 전체 외곽, 각 단의 중앙/양옆, 상부판과 끝 지지벽의 만남, 낮은 대기 접점, 포치 기둥 세 곳의 수직 단면이다. [전체 관찰](../04-observations.md#spatial-observation-derivation)에 이를 더하여 떠 있는 판/기둥, 지지벽에 묻힌 단, 중복 대기 바닥, 상면 위로 튀어나온 지지를 찾는다. 실제 부재·지반/기초·배수·구조 성능·그림자와 01/03 참조 읽힘은 unverified다.

## 포장 사이와 지표에서 끝나는 지지 {#paving-contact-handoff}
<!--
@evidence principles/core/common.md#scope-preservation 포장 사이의 상면/아래면 접촉, 건물 출입 접점, 전면 포트, 지표와 바탕 아래 지지, 문기둥 기초 예외, 지표 높이 조회의 식별 순서를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 포장 간 상면/아래면 접촉, 네 출입 단면, 두 전면 포트, 지표·바탕 아래 지지, 문기둥 기초 예외, footprint 우선 지표 조회 순서를 각각 문단으로 두는지 대조해 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 보행길과 더 두꺼운 차도의 접점에서 상면을 먼저 일치시키고 나머지 깊은 단면을 driveway owner에 배정하는 규칙을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 보행길과 더 두꺼운 차도 접점에서 상면을 먼저 맞추고 보행면을 낮추지 않으며 깊은 나머지 단면을 driveway owner에 두는 본문 규칙을 대조해 접점 처리가 다음 층에 남지 않음을 확인했다.
@evidence principles/core/common.md#declared-basis 건물 쪽 접점은 ground-threshold-junctions, 전면 끝은 site-access-interface, 지표는 map-handoff-inputs에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 건물 쪽 접점을 ground-threshold-junctions, 전면 끝을 site-access-interface 두 포트, 지표를 map-handoff-inputs 링크에서 받는 본문을 대조해 접촉 규칙의 각 경계가 근거 owner를 가리킴을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 대지 설정의 포장·울타리 관계를 서로 다른 두께의 바탕이 만나는 숨은 공유 경계와 문기둥 기초의 분할 단면으로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 site-identity의 포장·울타리 서술에 없는 두께가 다른 바탕의 숨은 공유 경계, 문기둥 기초와 관리길 바탕의 같은 단면 분할을 본문이 더하는지 대조해 부모 복사가 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology 각 완결 포장 owner가 자기 평면 외곽에서 끝나고 정원 아래 대기와 관리길이 같은 두께로 끝선에서 만난다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 각 포장 owner가 자기 평면 외곽에서 끝나고 정원 아래 대기와 관리길이 같은 두께 예약으로 끝선에서 만나며 바닥을 포개지 않는 본문을 대조해 포장 간 인접 관계가 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 차이를 덮는 독립 마감 띠를 양쪽에서 만들지 않고 외부 완성 지표를 구조 지지면으로 간주하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 두께 차이를 덮는 독립 마감 띠를 양쪽에서 만들지 않고 외부 완성 지표를 구조 지지면으로 보지 않는 본문을 대조해 포장 경계와 지표 경계가 각 owner에 한 번만 저작됨을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 검사점의 footprint와 모든 후보 표면의 id·owner·보행 가능 여부·높이를 먼저 식별하고 footprint 밖의 연장 높이를 접촉으로 세지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 검사점 footprint와 후보 표면 id·owner·보행 여부·높이를 먼저 식별하고 footprint 밖 연장 높이·격자 끝 고정 높이를 접촉으로 세지 않는 본문을 대조해 높이 조회의 반증 조건을 확인했다.
@evidence settings/10-house.md#site-identity 우측 목재 울타리의 문기둥과 관리길 포장이 같은 단면에서 겹치지 않도록 기초와 바탕을 분할한다.
@evidenceReview settings/10-house.md#site-identity #452f15e site-identity 우측 목재 울타리의 문기둥 기초가 관리길 아래로 들어올 때 바탕과 같은 단면에서 분할하고 기초 윗면을 보행면 위로 올리지 않는 본문을 대조해 중복 점유가 없음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work site-identity의 포장·울타리와 "측량/토목 인증이 아니다"를 접촉 규칙에 대조했고 설정이 바탕 두께를 정하지 않아도 설계에서 배정할 수 있어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 site-identity의 포장·울타리와 비인증 단서를 상면 우선 접점 규칙과 문기둥/바탕 단면 분할에 대조해 설정에 바탕 두께가 없어도 spaces가 배정할 수 있어 부모 수정이 없음을 확인했다.
-->

각 완결 포장 owner는 자기 평면 외곽에서 끝나고 상대의 상면/아래면을 동일 좌표로 소비한다. 보행길과 더 두꺼운 차도의 접점에서는 상면이 먼저 일치해야 하며 아래면까지 맞추려고 보행면을 낮추지 않는다. 높이가 겹치는 두 바탕의 접촉 구간은 숨은 공유 경계이고, 더 깊은 차도 바탕의 나머지 단면은 driveway owner의 책임이다. 그 차이를 덮는 독립 마감 띠를 양쪽에서 만들지 않는다. 정원 아래 대기와 관리길은 같은 두께 예약으로 끝선에서 만나며 바닥을 포개지 않는다.

건물 쪽은 [네 출입 단면](../10-ground-floor.md#ground-threshold-junctions)의 바깥 벽 면에서 만나고, 전면 끝은 [maps의 두 포트](00-access.md#site-access-interface)를 기다린다. 낮은 포장 바탕 아래의 받침/채움과 높은 지지벽 아래의 기초는 각 포장/porch owner가 소유할 미완료다. [실제 지표](00-access.md#map-handoff-inputs)를 받은 뒤 노출 옆면과 매립 구역, 바탕 아래 지지를 함께 정하며 외부 완성 지표를 구조 지지면으로 간주하지 않는다. 처마 투영 전체를 지형에서 지우거나 지표를 올려 계단을 덮지 않는다.

[대지와 식재](../../settings/10-house.md#site-identity)의 우측 목재 울타리에서 [울타리 문기둥](fence.md#fence-gate-junction)의 기초만 관리길 아래로 들어올 수 있다는 기존 예외는 바탕 중복을 허용하지 않는다. 문기둥 기초와 포장 바탕의 실제 점유를 같은 단면에서 분할하고, 기초 윗면을 완성 보행면 위로 솟게 하지 않는다. 포장에 필요한 받침이 사라지거나 gate 순폭/대기를 침범하면 해당 기초/포장 owner에서 수정한다. 기초 깊이가 없는 현재 상태에서 교차 단면을 합격으로 세지 않는다.

지표 인계의 높이 검사는 먼저 검사점이 속하는 실제 footprint와 모든 후보 표면의 id·owner·보행 가능 여부·높이를 식별한 뒤 수행한다. 조회가 먼저 선택한 표면 하나의 높이만 맞아도 다른 지표/포장의 노출 상면이 겹쳐 있을 수 있으므로 그것을 단일 점유의 증거로 쓰지 않는다. 다른 높이의 매립 지지면은 노출 상면 중복과 구별한다. 공유 끝선 위의 두 상면은 경계 접촉으로 구별하고, 선 양쪽의 내부 점에서는 각각 의도한 완성면만 이어지는지도 읽는다. footprint 밖의 점에서 얻은 연장 높이나 격자 끝에 고정된 높이는 접촉으로 세지 않는다. 이 검사는 위의 실제 메시 높이와 옆면/바탕 단면을 대체하지 않으며 지도 지표와 포장 소유권을 합치지 않는다.

검사는 차도 양옆 경사 연결 전체, 정원 아래 대기 끝선, 네 건물 출입 접점, 두 전면 포트의 전폭, 노출 포장 외곽 및 문기둥 단면이다. [전체 관찰](../04-observations.md#spatial-observation-derivation)과 [지도 인계 검사](00-access.md#map-handoff-inputs)를 유지하며 상대 owner·상하 높이·노출 여부·실제 접촉을 같은 산출물에서 읽는다. 현재 지도 연결·기초/채움·빈틈/겹침·마감/줄눈·GPU 관찰은 unverified다.
