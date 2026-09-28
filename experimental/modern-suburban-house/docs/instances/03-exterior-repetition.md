# 외장 반복 모듈

## lap siding course의 반복 법칙 {#siding-course-law}
<!--
@evidence principles/core/common.md#scope-preservation 네 입면 siding course와 void 절단의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 기단 상단부터 0.15 m 간격으로 k를 두고 지붕 밑면·trim에서 절단한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 siding 원형의 노출 높이와 입면의 기단 datum이다. 그 위에서 이 H2가 네 입면 siding course와 void 절단의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 siding 원형의 노출 높이와 입면의 기단 datum이고, 이 H2는 기단 상단부터 0.15 m 간격으로 k를 두고 지붕 밑면·trim에서 절단한다.
@evidence principles/design/instances.md#instance-prototype-boundary 네 입면 siding course와 void 절단에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 입면 owner·course k·좌우 절단 경계 id가 판 조각의 id이며 기단 datum과 0.15 m 간격에서 Y를 산출한다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 동일 k의 코너 높이와 창 trim 침범이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work siding 원형의 노출 높이와 입면의 기단 datum을 실제 네 입면 siding course와 void 절단와 동일 k의 코너 높이와 창 trim 침범에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#addressable-instance-decisions siding course의 간격·id·void 절단을 지붕 줄과 독립된 H2에 둔다.
@evidence contracts/surface-ownership.md#whole-surface-owner 한 입면의 course를 외피 면 owner의 기준으로 만들고 창·문 void에서 잘라 같은 면을 별도 저작자가 덮지 않는다.
@evidence settings/20-verification.md#visual-grammar 재료 읽힘 설정의 기준을 siding-course-law의 네 입면 siding course와 void 절단에 소비한다.
@evidence settings/20-verification.md#surface-allocation 표면 분해 인계의 기준을 siding-course-law의 네 입면 siding course와 void 절단에 소비한다.
@evidence spaces/envelope/front.md#front-openings 정면의 기준을 siding-course-law의 네 입면 siding course와 void 절단에 소비한다.
@evidence models/15-outdoor.md#lap-siding-board lap siding 원형의 기준을 siding-course-law의 네 입면 siding course와 void 절단에 소비한다.
@evidence materials/01-exterior.md#siding-warm-white siding 재료의 기준을 siding-course-law의 네 입면 siding course와 void 절단에 소비한다.
@evidence spaces/roof/00-junctions.md#roof-wall-head-junctions 지붕 아래면 상단의 기준을 siding-course-law의 네 입면 siding course와 void 절단에 소비한다.
@evidence settings/10-house.md#main-mass `main-mass`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/00-building.md#attached-garage-extent `attached-garage-extent`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/00-building.md#main-building-extent `main-building-extent`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[재료 읽힘 설정](../settings/20-verification.md#visual-grammar)은 "siding은 벽면 전체를 일관된 course로 덮고" 창·문을 가리지 않는다고 정하고, [표면 분해 인계](../settings/20-verification.md#surface-allocation)는 외장 모듈을 instances가 "측정값과 반복 법칙으로" 구현하도록 배정한다. spaces의 입면 문서([정면](../spaces/envelope/front.md#front-openings) 등)는 course 간격을 정하지 않으며, [lap siding 원형](../models/15-outdoor.md#lap-siding-board)이 노출 높이 0.15 m를 정한다. 이 반복은 그 값으로 구성원을 놓는다. settings·레퍼런스 역할에 수치가 없으므로 근거는 설정의 "일관된 course"가 전체 입면 관찰 거리에서 규칙적인 수평 결로 읽혀야 한다는 요구이며, 실제 제품 노출 치수와의 대조는 외부 출처 확인 전까지 추론이다. [siding 재료](../materials/01-exterior.md#siding-warm-white)의 결은 반복된 부재에서 읽는다. 판 한 장의 단면·두께·겹침·노출은 [lap siding 판 단면](../models/15-outdoor.md#lap-siding-board) 원형이 정하고, 이 H2는 매개변수 L을 벽의 남는 연속 구간에서 구성원마다 주며 시작 datum·절단·구성원 수를 정한다. 색은 materials다. course k의 하단 Y는 해당 벽의 벽돌 기단 상단(spaces 입면 owner의 datum)에서 k × 0.15 m이고, 벽의 [지붕 아래면 상단](../spaces/roof/00-junctions.md#roof-wall-head-junctions)을 넘는 course는 그 함수로 잘린다. 각 course의 입면 수평 구간에서 창·문 void와 trim의 닫힌 구간을 빼고 남는 **연결된 각 구간마다 판 하나**를 놓는다. 절단 경계는 wall-start·wall-end 또는 개구부 id와 좌/우 trim 끝으로 이름 붙이고, 구성원 id는 `<입면 owner>-siding-<k>-<왼쪽 경계 id>-<오른쪽 경계 id>`다. 같은 개구부 목록과 벽 경계에서 순회 순서와 무관하게 같은 판 집합을 얻으며 seed·변이는 없다. 네 입면 모두 같은 기준을 쓰므로 모서리에서 같은 k의 하단 Y가 맞아야 하며, 관찰은 각 모서리에서 course 선의 연속과 void 가장자리의 끊김이다.

## asphalt shingle course의 반복 법칙 {#shingle-course-law}
<!--
@evidence principles/core/common.md#scope-preservation 지붕 면 shingle 줄·starter·ridge cap의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 0.14 m 경사 간격과 홀수 줄 0.165 m 엇갈림을 정한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 shingle 원형의 노출·탭 폭과 지붕 면·골짜기 경계이다. 그 위에서 이 H2가 지붕 면 shingle 줄·starter·ridge cap의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 shingle 원형의 노출·탭 폭과 지붕 면·골짜기 경계이고, 이 H2는 0.14 m 경사 간격과 홀수 줄 0.165 m 엇갈림을 정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 지붕 면 shingle 줄·starter·ridge cap에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 지붕 면 owner·course k·1.00 m strip j·절단 경계 id가 각 조각의 유일한 id이며 처마 U=0과 면 basis에서 transform을 산출한다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 골짜기·굴뚝 절단과 용마루 빈틈이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work shingle 원형의 노출·탭 폭과 지붕 면·골짜기 경계을 실제 지붕 면 shingle 줄·starter·ridge cap와 골짜기·굴뚝 절단과 용마루 빈틈에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-variation-tiers 홀수 줄의 고정 offset 외에는 색 jitter나 거리별 원형 교체가 없다.
@evidence models/15-outdoor.md#asphalt-shingle-strip asphalt shingle 원형의 기준을 shingle-course-law의 지붕 면 shingle 줄·starter·ridge cap에 소비한다.
@evidence spaces/roof/00-junctions.md#roof-mass-allocation 지붕 면 분할의 기준을 shingle-course-law의 지붕 면 shingle 줄·starter·ridge cap에 소비한다.
@evidence spaces/roof/00-junctions.md#roof-shared-edges 지붕 공유 가장자리의 기준을 shingle-course-law의 지붕 면 shingle 줄·starter·ridge cap에 소비한다.
@evidence settings/20-verification.md#visual-grammar 공통 재료와 외피 인상의 기준을 shingle-course-law의 지붕 면 shingle 줄·starter·ridge cap에 소비한다.
@evidence materials/01-exterior.md#roof-shingle shingle 재료의 기준을 shingle-course-law의 지붕 면 shingle 줄·starter·ridge cap에 소비한다.
@evidence spaces/envelope/front.md#front-roof-closures `front-roof-closures`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/envelope/left.md#chimney-roof-interface `chimney-roof-interface`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/envelope/left.md#left-roof-closure `left-roof-closure`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/envelope/rear.md#rear-roof-closures `rear-roof-closures`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/envelope/right.md#right-roof-closures `right-roof-closures`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/00-junctions.md#roof-profile-datums `roof-profile-datums`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/front-gable-left.md#front-gable-left-roof `front-gable-left-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/front-gable-right.md#front-gable-right-roof `front-gable-right-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/garage-back.md#garage-back-roof `garage-back-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/garage-front.md#garage-front-roof `garage-front-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/main-back.md#main-back-roof `main-back-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/main-front.md#main-front-roof `main-front-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/right-back.md#right-back-roof `right-back-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/roof/right-front.md#right-front-roof `right-front-roof`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

설정은 지붕이 "작고 규칙적인 어두운 asphalt shingle의 중첩 결로 읽힌다"고 정한다. [asphalt shingle 원형](../models/15-outdoor.md#asphalt-shingle-strip)이 정한 경사 방향 노출 0.14 m를 쓰고 각 지붕 면([지붕 면 분할](../spaces/roof/00-junctions.md#roof-mass-allocation))의 처마선에서 용마루 쪽으로 course k를 쌓는다. 홀수 course는 탭 폭의 절반만큼 처마 방향으로 어긋나게 해 중첩 결을 만든다. 한 줄은 [asphalt shingle 줄 단면](../models/15-outdoor.md#asphalt-shingle-strip) 원형(길이 1.00 m, 높이 0.30 m, 탭 0.330 m 셋)이며 홀수 course의 어긋남은 그 반 탭 0.165 m다. 한 course 안에서 줄은 처마 방향으로 1.00 m 간격으로 이어지고 지붕 면 가장자리에서 잘린다. 처마선 바로 위에는 원형의 starter 변형 한 course를 k = 0 아래에 두고, 용마루선에는 ridge-cap 변형을 용마루를 따라 노출과 같은 0.14 m 간격으로 놓는다. 이 문서는 간격·순서·절단만 소유하고 줄의 형상과 변형은 원형이 정한다. 골짜기·단차·굴뚝 주변에서 잘리는 course는 [지붕 공유 가장자리](../spaces/roof/00-junctions.md#roof-shared-edges)를 따른다. 각 면의 처마 시작점을 U=0으로 하여 course k 안의 1.00 m 줄 번호 j를 정하고, 면 경계·골짜기·굴뚝을 뺀 각 연결 구간을 잘라 한 조각당 원형 한 개를 둔다. id는 `<지붕 면 owner>-shingle-<k>-<j>-<왼쪽 절단 경계 id>-<오른쪽 절단 경계 id>`이며 starter는 k 대신 `starter`, ridge-cap은 `ridge`와 용마루 방향 번호 j를 쓴다. 위치는 그 조각 아래 butt의 길이 중심 밑면, 회전은 지붕 면의 U 접선 e(처마 평행)·경사 위쪽 V 접선 v·바깥 법선 n=e×v를 원형의 local +X·+Y·+Z에 대응시키는 강체 회전이다. 면 경계와 U 원점이 같으면 순회 순서와 무관하게 같은 id·변환을 얻고 무작위 색 변이는 없다. 0.14 m는 원형이 설정의 작은 중첩 결에서 택한 값이며, 근거는 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 "작고 규칙적인" 중첩 결이 벽의 siding course보다 굵게 읽히지 않도록 siding 노출 0.15 m보다 작게 둔다는 것이다. 이 값은 [shingle 재료](../materials/01-exterior.md#roof-shingle)가 중첩 결을 instance 줄 geometry에 맡기는 것과 맞는다.

## 제외하는 외장 반복 {#exterior-exclusions}
<!--
@evidence principles/core/common.md#scope-preservation 문 패널·줄눈·기둥의 중복 instance 금지의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 차고문 패널은 문 모델, 벽돌 줄눈은 재료, 식재는 다음 H2로 나눈다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 정면 개구부와 완결 표면의 소유 인계이다. 그 위에서 이 H2가 문 패널·줄눈·기둥의 중복 instance 금지의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 정면 개구부와 완결 표면의 소유 인계이고, 이 H2는 차고문 패널은 문 모델, 벽돌 줄눈은 재료, 식재는 다음 H2로 나눈다.
@evidence principles/design/instances.md#instance-prototype-boundary 이 집합은 어떤 원형도 생성하지 않는다. 문 패널·벽돌 줄눈·기둥을 원래 models·materials·spaces 소유에 남겨 반복 원형으로 가장하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 구성원 생성 전에 문 패널·줄눈·기둥을 입면 반복 대상에서 제외한다. 외피 모델의 부품 순서로 대상 여부를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 차고문 패널이나 줄눈의 중복 id이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 정면 개구부와 완결 표면의 소유 인계을 실제 문 패널·줄눈·기둥의 중복 instance 금지와 차고문 패널이나 줄눈의 중복 id에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/envelope/front.md#garage-front-opening 정면 입면의 기준을 exterior-exclusions의 문 패널·줄눈·기둥의 중복 instance 금지에 소비한다.
@evidenceExclude models/04-stair-members.md#stair-balusters `stair-balusters`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/04-stair-members.md#stair-bottom-member `stair-bottom-member`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/04-stair-members.md#stair-member-fidelity `stair-member-fidelity`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/04-stair-members.md#stair-member-surfaces `stair-member-surfaces`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/04-stair-members.md#stair-side-skirt `stair-side-skirt`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/06-interior-trim.md#wall-baseboard `wall-baseboard`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/15-outdoor.md#eave-gutter-downspout `eave-gutter-downspout`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/15-outdoor.md#exterior-corner-trim `exterior-corner-trim`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidence settings/10-house.md#porch-entry `porch-entry`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidenceExclude settings/10-house.md#stair `stair`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude spaces/02-stair.md#stair-boundary-heights `stair-boundary-heights`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/02-stair.md#stair-clearance `stair-clearance`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff `stair-connector-handoff`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/02-stair.md#stair-floor-opening `stair-floor-opening`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/02-stair.md#stair-reservation `stair-reservation`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/03-surface-owners.md#exterior-surface-handoff `exterior-surface-handoff`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/03-surface-owners.md#interior-surface-handoff `interior-surface-handoff`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidence spaces/porch.md#porch-platform-access `porch-platform-access`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/porch.md#porch-roof-columns `porch-roof-columns`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff `paving-contact-handoff`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/site/01-paving-support.md#paving-depth-reservation `paving-depth-reservation`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support `raised-platform-support`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
-->

포치 기둥·난간과 창·문 부재는 spaces와 models의 개별 소유이므로 여기서 반복하지 않는다. 현관문 유리 분할과 차고문 패널·채광창 반복은 [정면 입면](../spaces/envelope/front.md#garage-front-opening)이 개수와 간격을 이미 정하고 models가 부재를 만들므로 instances 집합으로 다시 세지 않는다. 벽돌 기단·굴뚝·벽난로의 줄눈은 설정상 연속 줄눈이 표면 표현이므로 materials가 소유한다. 식재 개체의 별도 배치 규칙은 [대지 식재 개체](#planting-individuals)가 맡는다.

## 포치 발판과 작은 화분 {#porch-props}
<!--
@evidence principles/core/common.md#scope-preservation 이 H2는 포치의 바닥 위 발판·작은 화분 두 개체의 위치와 간섭을 맡고 바닥·챌판·기둥·식물 형상은 부모에 둔다.
@evidence principles/core/common.md#substantive-completion 현관 밖 발판 하나와 왼쪽 가장자리 화분 하나를 서로 다른 id·world 접점으로 놓고 1.50 m 출입 폭을 보존한다.
@evidence principles/core/common.md#declared-basis settings의 포치 소품, spaces의 세 단 접근과 1.50 m 순폭, models의 발판·화분 외곽을 입력으로 소비한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 소품의 크기와 포치의 길은 부모가 정했으며 여기서는 두 몸체가 어느 바닥점에 서는지를 결정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 발판과 화분의 내부 테·줄기·잎은 models 원형 그대로 사용하고 포치 바닥이나 난간을 새 개체로 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 두 id와 p는 현관문 중심·포치 왼쪽 경계에서 고정 산출하며 seed·jitter 없이 scale 1이다.
@evidence principles/design/instances.md#instance-verification-address 문이 열린 상태와 세 챌판 접근 축, 왼쪽 기둥 받침과 화분 바닥의 여유를 반증 표본으로 검사한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 포치의 기존 출입 폭과 기둥 접점을 바꾸지 않고 두 소품을 바닥 안에 둘 수 있으므로 부모 공간 수정이 없다.
@evidence settings/10-house.md#porch-entry 문 앞 발판과 낮은 화분 요구를 두 개체로 구현한다.
@evidence spaces/porch.md#porch-platform-access 세 챌판과 문 진입 폭에서 발판·화분 간섭을 검사한다.
@evidence spaces/porch.md#porch-roof-columns 왼쪽 기둥 받침에서 화분 외곽을 떼어 놓는다.
@evidence models/18-house-props.md#porch-mat-planter 발판 0.60 × 0.40 m와 화분 입술 지름 0.28 m 원형을 사용한다.
@evidence obligations/design/instances.md#instance-prototype-membership 포치 소품 두 구성원을 정확히 한 번 만든다.
@evidence obligations/design/instances.md#instance-identity-transform 두 개체의 바닥 접점과 yaw 0을 고정한다.
@evidence obligations/design/instances.md#instance-placement-review 출입 축·기둥과 두 소품의 비접촉을 위·측면으로 검사한다.
-->

[포치 발판·화분 원형](../models/18-house-props.md#porch-mat-planter)에서 발판 `front-porch-mat`은 문 중심 X=0.90 m와 바깥쪽 Z=0.45 m의 완성 바닥 Y=0에 yaw 0으로 놓는다. 발판 외곽 X=[0.60,1.20], Z=[0.25,0.65] m는 [현관문과 세 챌판 접근](../spaces/porch.md#porch-platform-access)의 중앙에 놓이고 문짝은 실내로 열린다. 화분 `front-porch-planter`는 X=-4.90, Z=0.75 m·Y=0에 yaw 0으로 놓는다. 입술 반지름 0.14 m의 바닥 윤곽은 왼쪽 [기둥 중심 X=-5.40, Z=1.975 m](../spaces/porch.md#porch-roof-columns) 및 중앙 1.50 m 진입 폭 밖이다. 화분 줄기·잎과 발판의 형상은 원형이 만들며 출입 축 및 접지는 실제 viewer에서 unverified다.

## 대지 식재 개체 {#planting-individuals}
<!--
@evidence principles/core/common.md#scope-preservation 전면 성목·후면 나무·우측 관목의 배치의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion map 기준점 id에서 개체를 만들고 그 지표 높이에 줄기 밑을 접지한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 site-identity의 식재 관계와 공간 owner의 통로 제외 경계이다. 그 위에서 이 H2가 전면 성목·후면 나무·우측 관목의 배치의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 site-identity의 식재 관계와 공간 owner의 통로 제외 경계이고, 이 H2는 map 기준점 id에서 개체를 만들고 그 지표 높이에 줄기 밑을 접지한다.
@evidence principles/design/instances.md#instance-prototype-boundary 전면·후면 나무는 models/16의 두 높이 원형, 관목은 그 파일의 별도 낮은 원형을 쓰며 scale jitter로 크기 역할을 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority map의 식재 기준점 id·위치·지표 높이를 입력으로 같은 id·접지 변환을 산출한다. 현재 map 입력이 없어 수를 지어내지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 울타리 또는 관리길에 가장 가까운 관목의 침범이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidence upstream/design/instances.md#parent-revision-from-instance-work 식재 위치를 maps에 맡긴 site-identity와 현재 비활성 map branch를 대조해 기준점 없는 구성원 수·접지는 확정 불가라는 상위 결함을 드러낸다.
@evidence settings/00-production.md#build-allocation 제작 배분의 기준을 planting-individuals의 전면 성목·후면 나무·우측 관목의 배치에 소비한다.
@evidence settings/10-house.md#site-identity 대지와 식재의 기준을 planting-individuals의 전면 성목·후면 나무·우측 관목의 배치에 소비한다.
@evidence models/16-planting.md#site-tree-prototypes 전면 8.00 m 성목과 후면 6.00 m 나무의 서로 다른 원형을 map 기준점별로 고른다.
@evidence models/16-planting.md#site-shrub-prototype 우측 울타리 관목은 높이 0.80 m 원형만 반복하고 scale jitter를 쓰지 않는다.
@evidence spaces/site/fence.md#fence-enclosure-plan 울타리의 기준을 planting-individuals의 전면 성목·후면 나무·우측 관목의 배치에 소비한다.
@evidence spaces/site/00-access.md#map-handoff-inputs `map-handoff-inputs`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/site/00-access.md#site-access-interface `site-access-interface`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/site/00-access.md#site-local-routes `site-local-routes`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidenceExclude spaces/site/driveway.md#driveway-plan `driveway-plan`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/site/front-walk.md#front-walk-plan `front-walk-plan`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
-->

[제작 배분](../settings/00-production.md#build-allocation)은 식재 개체를 instances에, [대지와 식재](../settings/10-house.md#site-identity)는 식재 위치와 지표를 maps의 저작 선택으로 둔다. 구성원은 왼쪽 전면 [성목 원형](../models/16-planting.md#site-tree-prototypes) 하나, 같은 H2의 뒤쪽 작은 나무, 우측 울타리를 따른 [관목 원형](../models/16-planting.md#site-shrub-prototype)이며 뒤쪽 나무와 관목의 수·위치는 maps가 주는 식재 기준점 목록에서만 도출하고 이 문서는 별도 목록을 두지 않는다. 각 구성원은 maps 지표 높이에 줄기 밑을 접지하고 yaw는 기준점이 주지 않으면 0이다. 무작위 변이를 쓰지 않으며 큰 나무와 작은 나무는 모델의 두 원형으로 구별한다. docs/maps가 아직 없으므로 이 H2는 maps 입력이 생기기 전까지 구성원을 만들지 않는다. 최악 경우는 관목이 [울타리](../spaces/site/fence.md#fence-enclosure-plan)나 보행로와 겹치는지다.

## 정원 테라스의 식탁과 의자 {#terrace-furniture}
<!--
@evidence principles/core/common.md#scope-preservation 정원 테라스 식탁 하나와 의자 네 개의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 식탁 중심·양쪽 두 좌석씩과 꺼낸 상태를 고정한다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 테라스 예약과 성인 둘·자녀 둘 사용 가정이다. 그 위에서 이 H2가 정원 테라스 식탁 하나와 의자 네 개의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 테라스 예약과 성인 둘·자녀 둘 사용 가정이고, 이 H2는 식탁 중심·양쪽 두 좌석씩과 꺼낸 상태를 고정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 정원 테라스 식탁 하나와 의자 네 개에는 본문에서 이름 붙인 원형만 배정하고, 차이는 그 원형의 선언 매개변수와 transform으로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 정원 테라스 식탁 하나와 의자 네 개의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 식탁 중심·양쪽 두 좌석씩과 꺼낸 상태를 고정한다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 정원문 보행 띠에 가까운 의자의 예약 이탈이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 테라스 예약과 성인 둘·자녀 둘 사용 가정을 실제 정원 테라스 식탁 하나와 의자 네 개와 정원문 보행 띠에 가까운 의자의 예약 이탈에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence spaces/site/terrace.md#garden-terrace-plan 테라스 예약의 기준을 terrace-furniture의 정원 테라스 식탁 하나와 의자 네 개에 소비한다.
@evidence settings/00-production.md#use-profile 사용 가정의 기준을 terrace-furniture의 정원 테라스 식탁 하나와 의자 네 개에 소비한다.
@evidence models/15-outdoor.md#terrace-table 테라스 식탁의 기준을 terrace-furniture의 정원 테라스 식탁 하나와 의자 네 개에 소비한다.
@evidence models/15-outdoor.md#terrace-chair 테라스 의자의 기준을 terrace-furniture의 정원 테라스 식탁 하나와 의자 네 개에 소비한다.
@evidence spaces/site/terrace.md#garden-lower-landing-plan `garden-lower-landing-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/site/terrace.md#garden-steps-plan `garden-steps-plan`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

[테라스 예약](../spaces/site/terrace.md#garden-terrace-plan)은 X = [1.50, 4.20], Z = [-14.10, -11.40] m 안에 식탁과 꺼낸 의자를 담도록 가구 owner에 인계한다. 설정이 좌석 수를 정하지 않으므로 [사용 가정](../settings/00-production.md#use-profile)의 성인 둘·자녀 둘에 맞춰 이 branch의 결정으로 식탁 하나와 의자 네 개(긴 변마다 둘, 식탁을 향함)를 두고 식탁 중심은 예약 중심, yaw 0이다. 의자 위치는 식탁 원형의 반폭과 의자 원형 깊이에서 도출하며 원형은 [테라스 식탁](../models/15-outdoor.md#terrace-table)과 [테라스 의자](../models/15-outdoor.md#terrace-chair)이며 의자 중심은 식탁 원형이 선언한 긴 변 좌석 중심 로컬 X = ±0.35 m에서 도출한다. Y는 테라스 상면 datum이다. 최악 경우는 꺼낸 의자가 예약 경계와 정원문 보행 띠를 넘지 않는지다.
