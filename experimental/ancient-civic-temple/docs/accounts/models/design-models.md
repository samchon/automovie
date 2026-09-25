# 모델 설계 population의 모델 의무

## 독립 모델 결정의 주소 {#addressable-decisions}

<!--
@evidence obligations/design/models.md#addressable-model-decisions 49개 H2를 소비자와 변경 경로로 대조했다. 공통 축척·관절·검토 판은 셋으로, 기존 구조 부재는 접촉·치수가 다른 원형으로 나뉜다. 새 portable 13 H2에서는 벤치·직물의 크기 변형과 한 원형으로 쓰는 소형 등잔·쟁반을 나누되 문서 상자는 기존 궤의 s=0.55 변형으로 둔다.
-->

모델 결정은 소비자가 다르거나 따로 바뀔 수 있으면 자기 H2를 가진다. [공통 축척과 표현 상한](../../models/scale.md#reference-scale), [관절 규칙](../../models/scale.md#articulation-map), [검토 판](../../models/scale.md#model-review-board)은 모든 모델이 읽지만 각각 축척 비교, motion 인터페이스, 관찰 조건이라는 다른 소비자를 가져 셋으로 나눈다. 주랑 원주와 포치 원주는 같은 가족이지만 치수와 배치 수, 받는 보가 달라 따로 두고, 양개 문짝과 외개 문짝도 관절 수와 면 구성이 달라 나눈다. 평기와와 용마루 기와는 쓰이는 지붕 선과 코핑과의 관계가 달라 각자 주소를 가진다.

반대로 치수만 다르고 구성·표면·소비자가 같은 변형은 한 H2 안에 둔다. 문틀의 여덟 조합, 작성 책상과 열람 탁자, 진열대와 벽 선반, 두루마리의 말린 것·묶음·펼친 것, 궤의 작은 문서 상자, 직물의 좌구·덮개가 그렇다. 재료의 실제 비트맵과 반응은 materials가 맡고, 안정된 part 표면과 UV0·반복 길이·fallback의 입력 결속은 scale이 한 번 소유한다.

## 표현 층 완결 결산 {#representation-completion}

<!--
@evidence obligations/design/models.md#model-representation-completion 49 H2 중 46 원형의 part·부재 대응과 121 표면 결속을 결산하고, 구조적 유효성(아직 modelSources가 없어 unverified)과 의미적 완결(원점·점유·접합·실패 조건의 문서 검사)을 따로 보고한다.
-->

표현 층은 원형을 정의하는 46개 H2가 part와 표면 목록, 부재 대응 주소, 접촉면·빈 공간·점유 범위를 적어 결산된다. 새 소품 13 H2에는 part별 X·Y·Z 표가 있고 전체 46 H2에는 한 부재 문법 검사가 돈다. scale의 세 H2는 공통 규칙을 정하므로 part를 내지 않는다. 축척 관계는 [공통 기준](../../models/scale.md#reference-scale)의 보행 포락에 대한 비율과 판정된 spaces 순치수에서 온다. 계층은 기둥→보→서까래→지붕 하부, 석단→제단→그릇, 칸 선반→두루마리, 손수레 판→축·바퀴의 받침 연쇄로 이어진다. 관절 인터페이스는 두 문짝의 `hinge.<판 ID>`뿐이고 나머지는 의도된 강체다.

선언된 한계는 결정론적 blocking geometry 상한, 골 기와를 만들지 않는 골선, 배경 이웃 외피의 기와 없는 slab 지붕, 널판 위에 숨는 서까래를 만들지 않는 것, 불꽃·물 흐름을 두지 않는 정지 형상이다. 관찰 owner는 각 H2의 검토 판 문장과 건물 관찰 문장이며, 건물 안 배치·접촉은 spaces 관찰 전집합이 따로 본다.

구조적 유효성과 의미적 완결은 따로 판정한다. 아직 modelSources가 없으므로 prototype이 닫힌 실체이거나 의도된 열린 표면인지, part와 표면 ID가 실제로 나오는지는 unverified다. 의미적 완결은 각 H2가 치수·원점·접촉·빈 공간·실패 조건을 모두 적었다는 문서 수준의 판단이며 source를 만들고 검토 판을 캡처하기 전에는 시각 완료를 주장하지 않는다.
