# 테라스 가구와 외장 판 원형

## 테라스 식탁 {#terrace-table}

테라스 식탁은 [테라스 가구 배치](../instances/03-exterior-repetition.md#terrace-furniture)가 X = [1.50, 4.20], Z = [-14.10, -11.40]의 2.70 × 2.70 m 예약 중심에 yaw 0으로 놓는 원형이다. 길이 1.40 m(로컬 X), 폭 0.80 m(로컬 Z), 상면 0.74 m는 성인 둘·자녀 둘의 네 좌석을 긴 변마다 둘씩 두고, 꺼낸 의자까지 예약 반폭 1.35 m 안에 담기 위한 이 층의 결정이다. 로컬 원점은 바닥 평면 중심이며 Y = 0이 테라스 상면 datum에 놓인다. 공통 좌표 규칙은 [모델 국소 좌표](00-model-frame.md#model-local-frame), 척도 대조는 [기준 척도](00-model-frame.md#model-reference-scale)를 따른다.

부품은 널판 상판과 다리 넷이다. 상판은 Y = [0.71, 0.74]이며 로컬 X를 따라 0.01 m 틈을 둔 폭 0.12 m 널 여섯 장으로 나눈다. 다리는 0.05 m 각재로 모서리에서 0.05 m 안쪽에 세운다. 긴 변 좌석 중심은 로컬 X = ±0.35 m이고 사람 폭 0.60 m 기준으로 [-0.65, -0.05]와 [0.05, 0.65]가 되어 다리 X = ±[0.60, 0.65]와 0.05 m만 겹친다. 이 겹침은 다리가 상판 가장자리 0.05 m 안쪽에 있어 무릎 앞이 아니라 옆에 놓이므로 허용한다. 표면 id는 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 `top`, `leg`다. 관절은 없다.

소스 owner는 `src/models/furnishings/outdoor.ts`다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 정면과 측면에서 상면 0.74 m와 널 틈이 읽히는지다. 모든 관찰은 unverified다.

## 테라스 의자 {#terrace-chair}

테라스 의자는 [테라스 가구 배치](../instances/03-exterior-repetition.md#terrace-furniture)에 네 번 쓰는 한 원형이며 위치는 instances가 식탁 반폭 0.40 m와 이 의자 깊이에서 도출한다. 외곽은 폭 0.50 m, 깊이 0.55 m, 좌면 0.45 m, 등받이 0.85 m이며 팔걸이는 없다. 로컬 원점은 바닥의 좌면 중심, +Z가 식탁을 향한 정면이다. 식탁 가장자리에서 0.30 m 꺼낸 상태의 뒤쪽 끝은 식탁 중심에서 0.40 + 0.30 + 0.55 = 1.25 m로 예약 반폭 1.35 m 안에 든다.

부품은 좌판, 다리 넷, 등받이 널 셋이다. 좌판은 Y = [0.42, 0.45]이고 로컬 Z를 따라 널 넷으로 나눈다. 등받이 널은 Y = [0.55, 0.85]에서 뒤로 8° 기운다. 표면 id는 `seat`, `leg`, `back`이다. 관절은 없고 꺼내기는 배치 변화다. 소스 owner는 `src/models/furnishings/outdoor.ts`다. 관찰은 측면에서 좌면과 등받이 기울기가 보이는지, 네 의자를 꺼낸 평면이 예약 안에 드는지다. 모든 관찰은 unverified다.

## lap siding 판 단면 {#lap-siding-board}

[siding course 반복 법칙](../instances/03-exterior-repetition.md#siding-course-law)은 판 한 장의 단면(두께·겹침)을 models 원형에, course 노출 0.15 m·시작 datum·절단·구성원 수를 instances에 배정한다. 이 원형은 길이 L을 매개변수로 받는 쐐기 단면 판이며 L은 instances가 벽 구간과 개구부 절단에서 정한다. 로컬 원점은 판 아래 가장자리의 길이 중심이며 뒷면(외벽 바탕 면) 위에 있고, +X가 판 길이 방향, +Y가 위, +Z가 날씨 면 바깥 법선이다.

판 높이는 0.18 m로 정한다. 노출 0.15 m에 위 판과의 겹침 0.03 m를 더한 값이며, 겹침이 있어야 course마다 아래 끝의 그림자 선이 생긴다는 [재료 읽힘 설정](../settings/20-verification.md#visual-grammar)의 요구가 근거다. 단면은 아래 끝 두께 0.018 m에서 위 끝 0.006 m로 줄어드는 쐐기이며, 겹침 구간에서 위 판의 뒷면이 아래 판 위 끝의 앞면에 얹혀 판마다 약 0.012 m 앞으로 기운다. 판 끝은 직각으로 자르고 끝마감 몰딩은 개구부·모서리 트림 owner에 남긴다. 실제 제품 노출·두께와의 대조는 외부 출처 확인 전까지 추론이다.

표면 id는 `siding-face`, `siding-butt`(아래 끝 두께 면), `siding-back`이다. 관절은 없다. 소스 owner는 `src/models/exterior/siding.ts`다. 관찰은 측면 직교 단면에서 쐐기와 0.03 m 겹침이 보이는지, 정면에서 course마다 아래 끝 두께 면이 수평 그림자 선으로 읽히는지다. 모든 관찰은 unverified다.
