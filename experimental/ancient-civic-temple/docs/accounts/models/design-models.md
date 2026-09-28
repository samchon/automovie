# 모델 설계 population의 모델 의무

## 독립 모델 결정의 주소 {#addressable-decisions}

<!--
@evidence obligations/design/models.md#addressable-model-decisions 49개 모델 원형 H2를 소비자와 변경 경로로 대조했다. 공통 축척·관절·검토 판의 세 항목은 생산 계약으로 옮기고, 구조 부재는 접촉·치수가 다른 원형으로 나뉜다. portable 13 H2와 ritual 3 H2에서는 벤치·직물의 크기 변형과 별도 향로·좌구·한 자리 받침을 구분하고 기록실·보관실 궤는 같은 기본 원형으로 둔다.
-->

모델 결정은 소비자가 다르거나 따로 바뀔 수 있으면 자기 H2를 가진다. [공통 축척과 표현 상한](../../contracts/principles-models.md#temple-reference-scale)은 모든 원형 H2가 자기 점유·UV0로 따로 답하는 원칙이다. [관절 규칙](../../contracts/obligations-models.md#temple-articulation-map)과 [검토 판](../../contracts/obligations-models.md#temple-model-review-board)은 모델 모집단의 역할 배정을 결산한다. 주랑 원주와 포치 원주는 같은 가족이지만 치수와 배치 수, 받는 보가 달라 따로 두고, 양개 문짝과 외개 문짝도 관절 수와 면 구성이 달라 나눈다. 평기와와 용마루 기와는 쓰이는 지붕 선과 코핑과의 관계가 달라 각자 주소를 가진다.

반대로 치수만 다르고 구성·표면·소비자가 같은 변형은 한 H2 안에 둔다. 문틀의 여덟 조합, 작성 책상과 열람 탁자, 진열대와 벽 선반, 두루마리의 말린 것·묶음·펼친 것, 접은 직물의 덮개 변형이 그렇다. 기록실·보관실 궤는 같은 기본 원형을 복제한다. 바닥 좌구·낮은 향로·한 자리 항아리 받침은 구성과 소비자가 달라 [별도 주소](../../models/ritual.md)를 가진다. 안정된 part 표면과 UV0는 모델 원형과 [공통 원칙](../../contracts/principles-models.md#temple-reference-scale)이, 반복 길이·fallback과 비트맵 결속은 [materials](../../materials/10-model-bindings.md#binding-map)가 소유한다.

## 표현 층 완결 결산 {#representation-completion}

<!--
@evidence obligations/design/models.md#model-representation-completion 49개 원형 H2의 part·부재 대응과 표면 결속을 결산하고, 현재 modelSources evidence 단계의 구조 검사와 원점·점유·접합·실패 조건의 문서 검사를 구별한다.
@evidence obligations/design/models.md#reference-scale 각 원형 H2에 적용되는 축척·UV 원칙은 보행 포락과 점유 상자를 원형마다 비교하며 치수를 primitive 기본 크기에서 받지 않는다.
@evidence obligations/design/models.md#representation-ceiling 원형의 part·빈 공간과 리뷰 거리에서 읽히는 실루엣까지만 형상 조건이며 조각·풍화·기와 한 장씩의 불규칙·정확한 역사 양식은 범위 밖이다.
@evidence obligations/design/models.md#articulation-ownership 양개·외개 문짝의 `hinge.<판 ID>`만 회전 node이며 손잡이·경첩은 판과 함께 움직이고 나머지 47개 원형은 강체다.
@evidence obligations/design/models.md#model-review-set 여섯 전체 방향과 원형별 맞은편 근접 시점, 닫힘·열림 문짝, 세 두루마리 변형과 3×3 기와 반복을 중립 원형 판의 관찰 주소로 정한다.
-->

표현 층은 원형을 정의하는 49개 H2가 part와 표면 목록, 부재 대응 주소, 접촉면·빈 공간·점유 범위를 적어 결산된다. 이동식 소품 13 H2는 각 본문 산문에 부재 치수와 점유 범위를 적고 전체 49 H2에는 부재 문법 검사가 돈다. 축척·UV0 원칙은 각 H2가 답하고, 관절·중립 검토 판 두 항목은 생산 의무가 맡으며 part를 내지 않는다. 축척 관계는 [공통 기준](../../contracts/principles-models.md#temple-reference-scale)의 보행 포락에 대한 비율과 판정된 spaces 순치수에서 오며 primitive 기본 치수로 정하지 않는다. 리뷰 거리에서는 실루엣·part·빈 공간을 판독하고 조각·풍화·기와 한 장씩의 불규칙·정확한 역사 양식 복원은 형상 조건에서 제외한다. 계층은 기둥→보→서까래→지붕 하부, 석단→제단→그릇, 칸 선반→두루마리, 손수레 판→축·바퀴의 받침 연쇄로 이어진다. 관절 인터페이스는 양개·외개 두 문짝의 `hinge.<판 ID>`뿐이고 손잡이·경첩은 판과 함께 움직이며 다른 47개 원형은 강체다. 중립 원형 판은 여섯 전체 방향과 접합 반대쪽 근접 시점, 닫힘·열림 문짝, 말린·묶음·펼친 두루마리 및 3×3 기와 반복을 같은 조명과 카메라 비율로 관찰한다.

선언된 한계는 결정론적 blocking geometry 상한, 골 기와를 만들지 않는 골선, 배경 이웃 외피의 기와 없는 slab 지붕, 널판 위에 숨는 서까래를 만들지 않는 것, 불꽃·물 흐름을 두지 않는 정지 형상이다. 관찰 owner는 각 H2의 검토 판 문장과 건물 관찰 문장이며, 건물 안 배치·접촉은 spaces 관찰 전집합이 따로 본다.

구조적 유효성과 의미적 완결은 따로 판정한다. `modelSources`는 evidence 단계이므로 계약 주소·리뷰 지문·class별 원형 H2 대응을 캐시 없는 lint로 검증한다. Source가 내는 part·표면 ID와 접촉 수치는 audit로 확인하고, 실루엣과 근접 접합의 시각 완료는 모델 검토 판의 실제 관찰로 판정한다.
