# 테라스 가구와 외장 판 원형

## 테라스 식탁 {#terrace-table}
<!--
@evidence principles/core/common.md#scope-preservation 식탁 한 원형의 외곽 1.40 × 0.80 m·상면 0.74 m, 널 상판과 다리 넷, 표면 id `top`·`leg`, 무관절, 소스 owner `src/models/furnishings/outdoor.ts`, 정면·측면 관찰을 맡고 놓는 위치와 yaw는 후속 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 상판 Y = [0.71, 0.74], 폭 0.125 m 널 여섯 장과 0.01 m 틈, 0.05 m 각재 다리를 모서리에서 0.05 m 안쪽에 세우는 값을 수치로 정한다. 널 여섯 장과 틈 다섯의 합은 0.80 m로 상판 폭과 같다.
@evidence principles/core/common.md#declared-basis 길이 1.40 m·폭 0.80 m·상면 0.74 m를 "이 층의 결정"으로 밝히고, 그 근거로 긴 변마다 두 좌석을 두는 성인 둘·자녀 둘의 네 좌석과 꺼낸 의자를 예약 반폭 1.35 m 안에 담는 조건을 댄다. 다리와 좌석 폭의 0.05 m 겹침은 다리가 무릎 앞이 아니라 옆에 놓인다는 이유로 허용한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 테라스 공간 예약의 크기 안에 부모에 없는 널 상판 분할, 다리 X = ±[0.60, 0.65] 위치, 좌석 중심 로컬 X = ±0.35 m를 더한다. 가구 국소 좌표의 예외로 원점을 바닥 평면 중심에 두는 결정도 더한다.
@evidence principles/design/models.md#representation-contract 결과 형상을 널 상판과 0.05 m 각재 다리 넷, 안정 표면 `top`·`leg`, 관절 없음, 점유 외곽 1.40 × 0.80 × 0.74 m로 정한다. 대리 형상이 지지하는 관찰은 상면 0.74 m와 널 틈의 읽힘으로 이름 붙였지만 지지하지 못하는 관찰은 따로 적지 않았다. 보이지 않는 한계는 본문의 "나뭇결·널 고정 나사·다리 발 캡은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 원점을 바닥 평면 중심, +X를 긴 방향, Y = 0을 테라스 상면 datum에 두는 가구 국소 좌표의 예외를 밝히고, 예외의 이유를 네 좌석이 두 긴 변에서 쓰는 사용으로 댄다.
@evidence principles/design/models.md#reviewable-structure 모델 리뷰 뷰의 정면과 측면에서 상면 0.74 m와 널 틈이 읽히는지를 반증 관찰로 두고 표면 분할은 `top`·`leg`, 관절 영역은 없다고 적는다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 0.01 m 틈을 둔 널 여섯 장 상판과 모서리 안쪽 0.05 m 각재 다리라는 관찰 가능한 구성만 정하고 재질·색·조명은 적지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 기준 척도 링크, 1.40 × 0.80 × 0.74 m 외곽, 상판 Y = [0.71, 0.74]와 다리의 두 층 계층, 표면 id, 정면·측면 관찰을 함께 정한다. 널 여섯 장과 다섯 틈은 상판 폭 0.80 m를 정확히 채운다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work spaces/site/terrace.md#garden-terrace-plan의 2.70 m 가구 사용 구역과 사용 가정의 네 사람을 적힌 그대로 소비했고 식탁 1.40 × 0.80 m가 그 안에 들어 부모 수정이 없었다.
@evidence settings/00-production.md#use-profile 사용 가정의 성인 둘·자녀 둘을 긴 변마다 둘씩 앉는 네 좌석으로, 사람 점유체 폭 0.60 m를 좌석 구간 [-0.65, -0.05]와 [0.05, 0.65]로 소비한다.
@evidence settings/10-house.md#site-identity 후면 정원 포장 테라스에 두라는 식탁을 길이 1.40 m·폭 0.80 m·상면 0.74 m의 널 상판 식탁 원형으로 만든다. 본문은 공간 예약과 사용 가정을 직접 소비한다.
@evidence spaces/site/terrace.md#garden-terrace-plan 본문의 예약 X = [1.50, 4.20], Z = [-14.10, -11.40] m는 이 spaces H2의 가구 사용 예약과 같은 값이며, 식탁은 그 2.70 × 2.70 m 중심에 놓여 반폭 1.35 m를 좌석 배치의 한계로 쓴다.
@evidence obligations/design/models.md#addressable-model-decisions 식탁을 의자·lap siding 판과 다른 H2로 두어 외곽·상판 분할·국소 좌표 예외·표면 id가 독립으로 인용·수정될 주소를 가지며 배치 위치는 instances의 테라스 가구 배치에 남긴다.
@evidence obligations/design/models.md#model-review-set 모델 리뷰 뷰 링크의 정면과 측면을 이 식탁의 고정 관찰로 지정해 상면 0.74 m와 널 틈을 개정 사이에 같은 뷰로 비교하게 한다.
-->

테라스 식탁은 [테라스 공간 예약](../spaces/site/terrace.md#garden-terrace-plan)의 2.70 × 2.70 m 사용 구역에 놓는 원형이다. 예약 중심 배치와 yaw는 후속 instances가 정한다. 길이 1.40 m(로컬 X), 폭 0.80 m(로컬 Z), 상면 0.74 m는 성인 둘·자녀 둘의 네 좌석을 긴 변마다 둘씩 두고, 꺼낸 의자까지 예약 반폭 1.35 m 안에 담기 위한 이 층의 결정이다. [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 네 좌석이 두 긴 변에서 쓰므로 원점을 바닥 평면 중심에 두고 +X를 긴 방향으로 두며 Y = 0이 테라스 상면 datum에 놓인다. 척도 대조는 [기준 척도](00-model-frame.md#model-reference-scale)를 따른다.

부품은 널판 상판과 다리 넷이다. 상판은 Y = [0.71, 0.74]이며 로컬 X를 따라 0.01 m 틈을 둔 폭 0.125 m 널 여섯 장으로 나누어 6 × 0.125 + 5 × 0.01 = 0.80 m가 상판 폭과 같다. 다리는 0.05 m 각재로 모서리에서 0.05 m 안쪽에 세운다. 긴 변 좌석 중심은 로컬 X = ±0.35 m이고 사람 폭 0.60 m 기준으로 [-0.65, -0.05]와 [0.05, 0.65]가 되어 다리 X = ±[0.60, 0.65]와 0.05 m만 겹친다. 이 겹침은 다리가 상판 가장자리 0.05 m 안쪽에 있어 무릎 앞이 아니라 옆에 놓이므로 허용한다. 표면 id는 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 `top`, `leg`다. 관절은 없다.

나뭇결·널 고정 나사·다리 발 캡은 표현하지 않는다. 소스 owner는 `src/models/furnishings/outdoor.ts`다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 정면과 측면에서 상면 0.74 m와 널 틈이 읽히는지다. 모든 관찰은 unverified다.

## 테라스 의자 {#terrace-chair}
<!--
@evidence principles/core/common.md#scope-preservation 네 번 쓰는 한 의자 원형의 외곽 0.50 × 0.55 m·좌면 0.45 m·등받이 0.85 m, 좌판·다리 넷·등받이 널 셋, 표면 id `seat`·`leg`·`back`, 소스 owner를 맡고 위치는 instances가 도출하도록 남긴다.
@evidence principles/core/common.md#substantive-completion 좌판 Y = [0.42, 0.45]를 로컬 Z를 따라 널 넷으로, 등받이 널을 Y = [0.55, 0.85]에서 뒤로 8° 기울게 정한다. 좌판 널·등받이 널의 폭과 틈, 다리 단면 치수는 본문에 적혀 있지 않다.
@evidence principles/core/common.md#declared-basis 꺼낸 의자의 뒤쪽 끝을 식탁 반폭 0.40 m, 꺼냄 0.30 m, 의자 깊이 0.55 m의 합 1.25 m로 산출해 예약 반폭 1.35 m와 대조한다. 좌면 0.45 m는 식탁과 0.29 m 차, 폭 0.50 m는 중심 간격 0.70 m에서 틈 0.20 m라는 근거를 본문에 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 테라스 공간 예약에 팔걸이 없는 의자 외곽, 등받이 8° 기울기, 뒤 다리 뒤쪽 변을 뒤쪽 모서리 선으로 둔 국소 좌표를 더하고 꺼내기를 관절이 아닌 배치 변화로 정한다.
@evidence principles/design/models.md#representation-contract 좌판·다리 넷·등받이 널 셋의 무관절 형상과 표면 `seat`·`leg`·`back`, 외곽 0.50 × 0.55 × 0.85 m를 정한다. 관찰은 모두 unverified로 두었지만 대리 형상이 지지하지 못하는 관찰은 따로 이름 붙이지 않았다. 보이지 않는 한계는 본문의 "널 고정 나사·등받이 곡률·다리 발 캡은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표를 따르되 뒤쪽 모서리 선을 뒤 다리의 뒤쪽 변, +Z를 식탁을 향한 정면으로 둔다.
@evidence principles/design/models.md#reviewable-structure 측면에서 좌면 높이와 등받이 기울기가 보이는지, 네 의자를 꺼낸 평면이 예약 안에 드는지를 반증 관찰로 두고 표면 분할은 `seat`·`leg`·`back`이다.
@evidence principles/design/models.md#model-observable-style-basis 양식 라벨 없이 팔걸이 없음, 널 넷의 좌판, 8° 기운 등받이 널 셋이라는 관찰 가능한 구성으로 의자를 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽·좌면·등받이 높이, 세 부품군, 널·다리 단면, 표면 id, 무관절, 기준 척도와 측면·평면 관찰을 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work spaces/site/terrace.md#garden-terrace-plan의 2.70 m 가구 사용 구역과 식탁 반폭 0.40 m를 적힌 그대로 소비했고 꺼낸 끝 1.25 m가 그 안에 들어 부모 수정이 없었다.
@evidence settings/10-house.md#site-identity 후면 정원 포장 테라스에 두라는 의자를 팔걸이 없는 0.50 × 0.55 m 의자 원형으로 만든다. 본문은 공간 예약과 사용 가정을 직접 소비한다.
@evidence spaces/site/terrace.md#garden-terrace-plan 이 spaces H2가 가구 owner에 넘긴 "꺼낸 상태까지 예약 안" 조건을 식탁 가장자리에서 0.30 m 꺼낸 뒤쪽 끝 1.25 m가 반폭 1.35 m 안에 든다는 산술로 받는다.
@evidence obligations/design/models.md#reference-scale 의자 깊이 0.55 m를 식탁 반폭 0.40 m·꺼냄 0.30 m와 더해 예약 반폭 1.35 m에 대조하는 외곽 확인 규칙을 둔다. 공통 척도 기준 자체는 이 H2가 지명하지 않는다.
-->

테라스 의자는 [테라스 공간 예약](../spaces/site/terrace.md#garden-terrace-plan)과 네 사람의 [사용 가정](../settings/00-production.md#use-profile)을 소비하는 한 원형이며 반복 수와 위치는 후속 instances가 식탁 반폭 0.40 m와 이 의자 깊이에서 도출한다. 외곽은 폭 0.50 m, 깊이 0.55 m, 좌면 0.45 m, 등받이 0.85 m이며 팔걸이는 없다. 좌면 0.45 m는 상판 0.74 m와 0.29 m 차의 식사 자세를 [식탁 의자](10-kitchen-dining.md#dining-chair)와 같게 두려는 선택이고, 폭 0.50 m는 긴 변 좌석 중심 간격 0.70 m에서 두 의자 사이 0.20 m를 남기며, 깊이 0.55 m는 꺼낸 상태의 끝 1.25 m가 예약 반폭 1.35 m 안에 들도록 택했다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 뒤쪽 모서리 선은 뒤 다리의 뒤쪽 변, +Z는 식탁을 향한 정면이다. 식탁 가장자리에서 0.30 m 꺼낸 상태의 뒤쪽 끝은 식탁 중심에서 0.40 + 0.30 + 0.55 = 1.25 m로 예약 반폭 1.35 m 안에 든다.

부품은 좌판, 다리 넷, 등받이 널 셋이다. 좌판은 Y = [0.42, 0.45]이고 깊이 0.55 m를 로컬 Z 방향 널 네 장(각 0.13 m)과 틈 세 개(각 0.01 m)로 정확히 채운다. 다리는 0.035 × 0.035 m 각재이며 중심을 좌판 각 가장자리에서 0.04 m 안쪽에 둔다. 등받이 널 셋은 각각 높이 0.08 m, 두께 0.02 m이며 하단 Y = 0.55, 0.66, 0.77 m에 두고 뒤 다리 윗부분을 회전축으로 뒤로 8° 기울여 최상단이 0.85 m다. 표면 id는 `seat`, `leg`, `back`이다. 관절은 없고 꺼내기는 배치 변화다. 널 고정 나사·등받이 곡률·다리 발 캡은 표현하지 않는다. 소스 owner는 `src/models/furnishings/outdoor.ts`다. 관찰은 [기준 척도](00-model-frame.md#model-reference-scale)와 함께 측면에서 좌면과 등받이 기울기가 보이는지, 네 의자를 꺼낸 평면이 예약 안에 드는지다. 모든 관찰은 unverified다.

## lap siding 판 단면 {#lap-siding-board}
<!--
@evidence principles/core/common.md#scope-preservation 판 한 장의 쐐기 단면·높이 0.18 m·겹침 0.03 m·노출 0.15 m, 길이 매개변수 L, 국소 좌표, 표면 id와 소스 owner `src/models/exterior/siding.ts`를 맡는다. 시작 datum·절단·구성원 수는 instances, 끝마감 몰딩은 개구부·모서리 트림 owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 판 높이 0.18 m, 아래 끝 두께 0.018 m에서 위 끝 0.006 m로 줄어드는 쐐기, 0.03 m 겹침에서 위 판 뒷면이 아래 판 위 끝 앞면에 얹히는 관계, 직각 판 끝을 정한다.
@evidence principles/core/common.md#declared-basis 0.18 m를 노출 0.15 m와 겹침 0.03 m의 합으로 산출하고, 겹침의 근거를 재료 읽힘 설정 링크의 course별 그림자 선 요구로 댄다. 실제 제품 노출·두께와의 대조는 외부 출처 확인 전까지 추론이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 재료 읽힘 설정의 일관된 수평 결에 0.15 m 노출·0.03 m 겹침·쐐기 두께 0.018→0.006 m·판 높이 0.18 m·약 0.012 m 앞기울기를 더한다.
@evidence principles/design/models.md#representation-contract 길이 L로 뽑는 쐐기 단면 판을 결과 형상으로 두고 표면을 `siding-face`, `siding-butt`, `siding-back`으로 나누며 관절은 없다. 대리 형상이 뒷받침하지 못하는 주장으로 실제 제품 노출·두께 대조를 추론으로 남긴다.
@evidence principles/design/models.md#spatial-convention 로컬 원점을 판 아래 가장자리의 길이 중심이자 뒷면 위에 두고 +X 판 길이, +Y 위, +Z 날씨 면 바깥 법선으로 정한다.
@evidence principles/design/models.md#reviewable-structure 측면 직교 단면에서 쐐기와 0.03 m 겹침, 정면에서 course마다 `siding-butt`가 수평 그림자 선으로 읽히는지를 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis "lap siding"이라는 라벨을 쐐기 단면, 위 판이 아래 판에 0.03 m 얹히는 겹침, 아래 끝 두께 면이 만드는 수평 그림자 선이라는 관찰 가능한 결정으로 풀고 끝마감 몰딩은 트림 owner에 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 단면과 노출은 이 H2가, 길이 L·절단·구성원 수는 instances가, 판 끝 몰딩은 트림 owner가 갖도록 층을 나누고 측면·정면 관찰을 붙인다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 설정의 일관된 수평 siding course와 spaces의 벽 경계를 소비해 0.15 m 노출·0.03 m 겹침을 모델 자체에서 정했고 부모 수정이 없었다.
@evidence settings/20-verification.md#visual-grammar 설정의 "일관된 course" 요구를 판 높이 0.18 m(노출 0.15 m + 겹침 0.03 m)의 근거로 인용하고, 아래 끝 두께 면 `siding-butt`를 instances가 되풀이할 원형으로 제공한다.
@evidence obligations/design/models.md#representation-ceiling 실제 lap siding 제품의 노출·두께와 일치한다는 추론은 외부 출처 확인 전까지 끌어낼 수 없다고 밝히고, 모든 관찰을 unverified로 둔다.
@evidence obligations/design/models.md#model-representation-completion 판 단면·노출은 이 H2, 길이 매개변수의 실제 값·절단은 instances, 끝마감 몰딩은 트림 owner로 계정하고 제품 대조를 선언된 한계로 남긴다. 구조적 유효성과 의미적 완결을 따로 판정하지는 않는다.
-->

[재료 읽힘 설정](../settings/20-verification.md#visual-grammar)의 일관된 수평 course를 위해 판 한 장의 단면과 노출 0.15 m를 이 원형에서 정한다. [siding course 반복 법칙](../instances/03-exterior-repetition.md#siding-course-law)은 이 원형을 소비하여 시작 datum·절단·구성원 수를 정한다. 이 원형은 길이 L을 매개변수로 받는 쐐기 단면 판이며 L은 instances가 벽 구간과 개구부 절단에서 정한다. 로컬 원점은 판 아래 가장자리의 길이 중심이며 뒷면(외벽 바탕 면) 위에 있고, +X가 판 길이 방향, +Y가 위, +Z가 날씨 면 바깥 법선이다.

판 높이는 0.18 m로 정한다. 노출 0.15 m에 위 판과의 겹침 0.03 m를 더한 값이며, 근거는 [재료 읽힘 설정](../settings/20-verification.md#visual-grammar)의 "일관된 course"가 리뷰 거리에서 수평 그림자 선으로 읽혀야 한다는 요구다. 이 원형이 노출과 겹침을 정하고 instances는 그 값을 반복한다. 겹침 0.03 m가 있어야 판마다 아래 끝 두께 면이 생긴다. 단면은 아래 끝 두께 0.018 m에서 위 끝 0.006 m로 줄어드는 쐐기이며, 겹침 구간에서 위 판의 뒷면이 아래 판 위 끝의 앞면에 얹혀 판마다 약 0.012 m 앞으로 기운다. 판 끝은 직각으로 자르고 끝마감 몰딩은 개구부·모서리 트림 owner에 남긴다. 실제 제품 노출·두께와의 대조는 외부 출처 확인 전까지 추론이다.

표면 id는 넓은 날씨 면 `siding-face`, 아래 끝 두께 면 `siding-butt`, 외벽 바탕을 향한 뒷면 `siding-back`, 위 끝 두께 면 `siding-top`, 양쪽 끝과 개구부 절단면 `siding-cut`이다. 각 끝면도 정확히 하나의 id를 받는다. 전면 UV는 판의 왼쪽 아래를 원점으로 길이 U·높이 V를 미터 단위로, 절단 끝은 모서리 길이 U·두께 V로 새로 투영한다. 관절은 없다. 소스 owner는 `src/models/exterior/siding.ts`다. 관찰은 측면 직교 단면에서 쐐기와 0.03 m 겹침이 보이는지, 정면에서 course마다 아래 끝 두께 면이 수평 그림자 선으로 읽히는지다. 모든 관찰은 unverified다.

## asphalt shingle 줄 단면 {#asphalt-shingle-strip}
<!--
@evidence principles/core/common.md#scope-preservation 탭 폭·한 장 두께·0.14 m 노출과의 짝·처마/골짜기/용마루 절단을 이 H2가 맡고, course 배치·순서·구성원 id는 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 줄 길이 1.00 m, 높이 0.30 m, 탭 셋 각 0.330 m, 홈 폭 0.005 m·깊이 0.14 m, 쐐기 두께 0.010→0.002 m, 겹침 0.16 m, 처마 시작 줄·절단면·용마루 캡 변형까지 수치로 정해 구현자가 단면을 새로 정하지 않는다.
@evidence principles/core/common.md#declared-basis 줄 높이·탭 폭·두께는 settings와 spaces에 수치가 없어 이 branch의 결정이라고 밝히고, 근거를 "작고 규칙적인 어두운 asphalt shingle의 중첩 결"과 course 노출 0.14 m의 두 겹 덮임으로 적으며 실제 제품 치수 대조는 추론이라고 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 작은 중첩 결에 0.14 m 노출, 탭 폭 0.330 m(반 탭 0.165 m), 겹침 0.16 m, 한 course 선마다 약 0.004 m의 butt 단차라는 단면 결정을 더한다.
@evidence principles/design/models.md#representation-contract 결과는 밑면이 지붕 바탕 평면에 닿는 강체 쐐기 판 하나와 starter·ridge-cap 두 변형, 평면 절단 연산이며, 겹친 부피의 교차를 허용하고 못·접착 띠·입자 질감은 표현하지 않는 proxy라고 밝힌다.
@evidence principles/design/models.md#spatial-convention 원점을 줄 아래 끝(butt) 길이 중심의 밑면에, +X를 줄 길이 방향, +Z를 지붕 면 바깥 법선, +Y를 경사 위쪽(용마루 방향)으로 두는 국소 축을 가구 국소 좌표의 예외로 밝힌다.
@evidence principles/design/models.md#reviewable-structure 측면 직교 단면의 쐐기와 0.16 m 겹침, 정면의 세 탭·홈과 반 탭 어긋남, 절단면 `shingle-cut`, 용마루 캡의 좌우 대칭을 리뷰에서 반증할 경계로 지목한다.
@evidence principles/design/models.md#model-observable-style-basis "어두운 asphalt shingle"을 탭 셋의 3-tab 줄, 홈으로 드러나는 세로 결, butt 단차의 가로 결이라는 관찰 결정으로 바꾸고 색은 materials에 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 0.14 m 노출과 0.30 m 줄 높이의 척도 관계, 줄·변형·절단의 세 층, 표면 id 넷, 비표현 한계, 두 관찰이 함께 표현을 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 지붕 경사 8/12·9/12·7/12·5/12와 날씨 면 함수, 공유 가장자리와 면 분할을 소비하고 0.14 m 노출은 이 원형에서 정했으므로 부모 수정이 필요 없었다.
@evidence settings/20-verification.md#visual-grammar "지붕은 작고 규칙적인 어두운 asphalt shingle의 중첩 결로 읽힌다"를 탭 폭 0.330 m의 3-tab 줄과 course마다의 butt 단차로 소비한다.
@evidence spaces/roof/00-junctions.md#roof-profile-datums 날씨 면 함수와 경사 8/12·9/12·7/12·5/12를 줄이 놓일 바탕 평면과 용마루 캡의 좌우 각도로, 아래면 0.24 m 수직 예약을 쐐기 두께 0.010 m가 그 안에 드는 상한으로 소비한다.
@evidence spaces/roof/00-junctions.md#roof-shared-edges 골짜기·단차·굴뚝 주변의 공유 가장자리 선을 줄을 자르는 평면 위치로 소비하고 flashing은 그 owner에 남긴다.
@evidence spaces/roof/00-junctions.md#roof-mass-allocation 각 지붕 면의 처마선을 starter 줄과 course 0 butt가 맞춰지는 선으로 소비한다.
@evidence obligations/design/models.md#representation-ceiling 이 원형은 중첩 결의 기하만 보이며 방수·접착·입자 질감·풍하중 성능을 주장하지 않는다는 한계를 둔다.
@evidence obligations/design/models.md#articulation-ownership 줄·starter·ridge-cap 모두 피벗 없는 강체이며 motion이 바꿀 인터페이스가 없다고 밝힌다.
-->

이 원형은 [재료 읽힘 설정](../settings/20-verification.md#visual-grammar)의 작은 중첩 결을 위해 course 노출 0.14 m, 탭 폭과 한 장의 두께를 정한다. [shingle course 반복 법칙](../instances/03-exterior-repetition.md#shingle-course-law)은 이 원형을 소비하여 처마에서 용마루로 쌓는 순서, 홀수 course의 반 탭 어긋남과 구성원 id를 정한다. 이 원형은 [재료 읽힘 설정](../settings/20-verification.md#visual-grammar)의 "지붕은 작고 규칙적인 어두운 asphalt shingle의 중첩 결로 읽힌다"를 3-tab 줄 하나로 표현한다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)의 예외로 원점을 줄 아래 끝(butt)의 길이 중심 밑면에 두고, +X는 줄 길이 방향, +Z는 지붕 면 바깥 법선, +Y는 경사 위쪽(용마루 방향)이다. 지붕 면에 놓는 회전과 위치는 instances가 [지붕 날씨 면 함수](../spaces/roof/00-junctions.md#roof-profile-datums)에서 계산한다.

줄은 길이 1.00 m, 높이 0.30 m이며 아래 끝에서 0.14 m 깊이, 폭 0.005 m의 홈 둘로 폭 0.330 m의 탭 셋을 만든다(3 × 0.330 + 2 × 0.005 = 1.000 m). 높이 0.30 m는 노출 0.14 m에 위 course와의 겹침 0.16 m를 더한 값이다. 이 값이면 지붕의 모든 점이 두 장 이상에 덮이고 반 탭 어긋남(0.165 m)이 홈을 위 course 탭의 가운데로 보낸다. 줄 길이·높이·탭 폭은 settings와 spaces에 수치가 없는 이 branch의 결정이며, 근거는 "작고 규칙적인" 결이 0.14 m 노출과 0.330 m 탭으로 가로·세로 모두 1 m 안에 여러 번 반복된다는 것이다. 실제 제품 치수와의 대조는 외부 출처 확인 전까지 추론이다.

단면은 밑면이 바탕 평면에 닿는 쐐기다. 두께는 아래 끝 0.010 m에서 위 끝 0.002 m로 줄어든다. 위 course의 밑면은 같은 바탕 평면에 놓이며 겹친 구간에서 아래 줄과 부피가 교차하는 것을 허용한다. 아래 줄의 두께는 위 course butt 위치(아래 끝에서 0.14 m)에서 0.010 − 0.008 × 0.14 / 0.30 ≈ 0.006 m이므로, course 선마다 약 0.004 m의 butt 단차가 보이는 가로 그림자 선을 만든다. 쐐기 최대 두께 0.010 m는 [지붕 아래면의 수직 예약 0.24 m](../spaces/roof/00-junctions.md#roof-profile-datums) 안에 든다. 날씨 면 함수와 줄 윗면의 높이 맞춤은 instances가 소유한다.

처마와 가장자리에서는 두 변형과 한 연산을 둔다. `starter` 변형은 홈이 없는 같은 단면의 줄이며 [지붕 면 분할](../spaces/roof/00-junctions.md#roof-mass-allocation)의 처마선에 아래 끝을 맞춰 course 0 아래에 한 겹 깐다. 박공 끝, 골짜기, 단차, 굴뚝 주변에서는 줄을 [지붕 공유 가장자리](../spaces/roof/00-junctions.md#roof-shared-edges) 선을 지나는, 지붕 면에 수직한 평면으로 자르고 잘린 면은 `shingle-cut` 표면으로 닫는다. 골짜기에서는 양쪽 면의 course를 같은 골짜기 선에서 자르며 flashing은 그 owner에 남긴다. 용마루에서는 마지막 course를 용마루 선에서 자르고 `ridge-cap` 변형으로 덮는다. `ridge-cap`은 폭 0.330 m, 길이 0.30 m의 탭 한 장을 용마루 선에서 두 지붕 경사 각도로 좌우 대칭으로 꺾은 판이다. 용마루 방향 노출은 0.14 m이고 두께는 0.006 m로 균일하다.

표면 id는 `shingle-face`, `shingle-butt`(아래 끝 두께 면), `shingle-back`, `shingle-cut`이며 어두운 색은 [shingle 재료](../materials/01-exterior.md#roof-shingle)가 바인딩한다. 모든 변형은 피벗이 없는 강체다. 못·접착 띠·입자 질감·방수와 풍하중 성능은 표현하지 않는다. 소스 owner는 `src/models/exterior/shingle.ts`다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 측면 직교 단면에서 쐐기와 0.16 m 겹침, 0.004 m 단차가 보이는지, 정면에서 세 탭과 홈의 반 탭 어긋남이 규칙적인 결로 읽히는지, 용마루 캡이 두 경사에 좌우 대칭으로 앉는지다. 모든 관찰은 unverified다.
