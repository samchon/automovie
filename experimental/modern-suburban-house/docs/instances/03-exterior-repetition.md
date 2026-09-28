# 외장 반복 모듈

## lap siding course의 반복 법칙 {#siding-course-law}

[재료 읽힘 설정](../settings/20-verification.md#visual-grammar)은 "siding은 벽면 전체를 일관된 course로 덮고" 창·문을 가리지 않는다고 정하고, [표면 분해 인계](../settings/20-verification.md#surface-allocation)는 외장 모듈을 instances가 "측정값과 반복 법칙으로" 구현하도록 배정한다. spaces의 입면 문서([정면](../spaces/envelope/front.md#front-openings) 등)는 course 간격을 정하지 않으며, [lap siding 원형](../models/15-outdoor.md#lap-siding-board)이 노출 높이 0.15 m를 정한다. 이 반복은 그 값으로 구성원을 놓는다. settings·레퍼런스 역할에 수치가 없으므로 근거는 설정의 "일관된 course"가 전체 입면 관찰 거리에서 규칙적인 수평 결로 읽혀야 한다는 요구이며, 실제 제품 노출 치수와의 대조는 외부 출처 확인 전까지 추론이다. [siding 재료](../materials/01-exterior.md#siding-warm-white)의 결은 반복된 부재에서 읽는다. 판 한 장의 단면·두께·겹침·노출은 [lap siding 판 단면](../models/15-outdoor.md#lap-siding-board) 원형이 정하고, 이 H2는 매개변수 L을 벽 폭에서 구성원마다 주며 시작 datum·절단·구성원 수를 정한다. 색은 materials다. course k의 하단 Y는 해당 벽의 벽돌 기단 상단(spaces 입면 owner의 datum)에서 k × 0.15 m이고, 벽의 [지붕 아래면 상단](../spaces/roof/00-junctions.md#roof-wall-head-junctions)을 넘는 course는 그 함수로 잘린다. 한 course는 벽면 하나의 수평 폭 전체를 한 구성원으로 덮고 창·문 void와 그 trim 범위에서 끊긴다. 구성원 id는 `<입면 owner>-siding-<k>`이며 seed·변이는 없다. 네 입면 모두 같은 기준을 쓰므로 모서리에서 같은 k의 하단 Y가 맞아야 하며, 관찰은 각 모서리에서 course 선의 연속과 void 가장자리의 끊김이다.

## asphalt shingle course의 반복 법칙 {#shingle-course-law}

설정은 지붕이 "작고 규칙적인 어두운 asphalt shingle의 중첩 결로 읽힌다"고 정한다. [asphalt shingle 원형](../models/15-outdoor.md#asphalt-shingle-strip)이 정한 경사 방향 노출 0.14 m를 쓰고 각 지붕 면([지붕 면 분할](../spaces/roof/00-junctions.md#roof-mass-allocation))의 처마선에서 용마루 쪽으로 course k를 쌓는다. 홀수 course는 탭 폭의 절반만큼 처마 방향으로 어긋나게 해 중첩 결을 만든다. 한 줄은 [asphalt shingle 줄 단면](../models/15-outdoor.md#asphalt-shingle-strip) 원형(길이 1.00 m, 높이 0.30 m, 탭 0.330 m 셋)이며 홀수 course의 어긋남은 그 반 탭 0.165 m다. 한 course 안에서 줄은 처마 방향으로 1.00 m 간격으로 이어지고 지붕 면 가장자리에서 잘린다. 처마선 바로 위에는 원형의 starter 변형 한 course를 k = 0 아래에 두고, 용마루선에는 ridge-cap 변형을 용마루를 따라 노출과 같은 0.14 m 간격으로 놓는다. 이 문서는 간격·순서·절단만 소유하고 줄의 형상과 변형은 원형이 정한다. 골짜기·단차·굴뚝 주변에서 잘리는 course는 [지붕 공유 가장자리](../spaces/roof/00-junctions.md#roof-shared-edges)를 따른다. 구성원 id는 `<지붕 면 owner>-shingle-<k>`이고 무작위 색 변이는 없다. 0.14 m는 원형이 설정의 작은 중첩 결에서 택한 값이며, 근거는 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 "작고 규칙적인" 중첩 결이 벽의 siding course보다 굵게 읽히지 않도록 siding 노출 0.15 m보다 작게 둔다는 것이다. 이 값은 [shingle 재료](../materials/01-exterior.md#roof-shingle)가 중첩 결을 instance 줄 geometry에 맡기는 것과 맞는다.

## 제외하는 외장 반복 {#exterior-exclusions}

포치 기둥·난간과 창·문 부재는 spaces와 models의 개별 소유이므로 여기서 반복하지 않는다. 현관문 유리 분할과 차고문 패널·채광창 반복은 [정면 입면](../spaces/envelope/front.md#garage-front-opening)이 개수와 간격을 이미 정하고 models가 부재를 만들므로 instances 집합으로 다시 세지 않는다. 벽돌 기단·굴뚝·벽난로의 줄눈은 설정상 연속 줄눈이 표면 표현이므로 materials가 소유한다. 식재 개체는 [제작 배분](../settings/00-production.md#build-allocation)이 instances에 두지만 대지 배치의 근거가 되는 maps/site 설계를 아직 읽지 않았으므로 이 문서에 포함하지 않고 후속 H2로 남긴다.

## 대지 식재 개체 {#planting-individuals}

[제작 배분](../settings/00-production.md#build-allocation)은 식재 개체를 instances에, [대지와 식재](../settings/10-house.md#site-identity)는 식재 위치와 지표를 maps의 저작 선택으로 둔다. 구성원은 왼쪽 전면 성목 하나, 뒤쪽 나무, 우측 울타리를 따른 관목이며 뒤쪽 나무와 관목의 수·위치는 maps가 주는 식재 기준점 목록에서만 도출하고 이 문서는 별도 목록을 두지 않는다. 각 구성원은 maps 지표 높이에 줄기 밑을 접지하고 yaw는 기준점이 주지 않으면 0이다. 무작위 변이를 쓰지 않으며 크기가 다른 나무는 models 원형을 따로 둔다. docs/maps가 아직 없으므로 이 H2는 maps 입력이 생기기 전까지 구성원을 만들지 않는다. 최악 경우는 관목이 [울타리](../spaces/site/fence.md#fence-enclosure-plan)나 보행로와 겹치는지다.

## 정원 테라스의 식탁과 의자 {#terrace-furniture}

[테라스 예약](../spaces/site/terrace.md#garden-terrace-plan)은 X = [1.50, 4.20], Z = [-14.10, -11.40] m 안에 식탁과 꺼낸 의자를 담도록 가구 owner에 인계한다. 설정이 좌석 수를 정하지 않으므로 [사용 가정](../settings/00-production.md#use-profile)의 성인 둘·자녀 둘에 맞춰 이 branch의 결정으로 식탁 하나와 의자 네 개(긴 변마다 둘, 식탁을 향함)를 두고 식탁 중심은 예약 중심, yaw 0이다. 의자 위치는 식탁 원형의 반폭과 의자 원형 깊이에서 도출하며 원형은 [테라스 식탁](../models/15-outdoor.md#terrace-table)과 [테라스 의자](../models/15-outdoor.md#terrace-chair)이며 의자 중심은 식탁 원형이 선언한 긴 변 좌석 중심 로컬 X = ±0.35 m에서 도출한다. Y는 테라스 상면 datum이다. 최악 경우는 꺼낸 의자가 예약 경계와 정원문 보행 띠를 넘지 않는지다.
